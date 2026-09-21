import { useCallback, useEffect, useRef, useState } from 'react';
import type { PlayerLike } from '../lib/player';
import { YT } from '../lib/player';
import type { SyncEvent } from '../types/sync';

/**
 * FASE 2 · Paso C: Registro de Marcas Temporales y Eventos.
 *
 * Al iniciar la grabación se establece el tiempo de referencia cero
 * (startTime = Date.now()). A partir de ahí:
 *  - PLAY   → registra { type: 'play',  vrTimeSec, vmTimeSec }
 *  - PAUSE  → registra { type: 'pause', vrTimeSec, vmTimeSec }
 *  - SEEK   → detecta saltos manuales en la línea de tiempo (polling de 250 ms
 *             + verificación en cada cambio de estado).
 *
 * vrTimeSec = segundos desde el inicio de la grabación (línea de tiempo del Master).
 * vmTimeSec = posición del video musical (Slave) en ese instante.
 */

interface Sample {
  t: number; // posición conocida del VM
  at: number; // wall-clock del muestreo
  playing: boolean; // ¿el VM estaba reproduciéndose?
}

const POLL_MS = 250;

export interface UseEventRecorderResult {
  isRecording: boolean;
  events: SyncEvent[];
  start: (player: PlayerLike) => void;
  stop: () => SyncEvent[];
  handleVmStateChange: (state: number) => void;
}

export function useEventRecorder(): UseEventRecorderResult {
  const [isRecording, setIsRecording] = useState(false);
  const [events, setEvents] = useState<SyncEvent[]>([]);

  const eventsRef = useRef<SyncEvent[]>([]);
  const isRecordingRef = useRef(false);
  const startAtRef = useRef<number | null>(null);
  const sampleRef = useRef<Sample | null>(null);
  const playerRef = useRef<PlayerLike | null>(null);
  const pollIdRef = useRef<number | null>(null);
  const suppressRef = useRef(false);

  const vrNow = useCallback(() => {
    return startAtRef.current !== null ? (Date.now() - startAtRef.current) / 1000 : 0;
  }, []);

  /** Posición esperada del VM según el último muestreo. */
  const expectedAt = (s: Sample, now: number) =>
    s.playing ? s.t + (now - s.at) / 1000 : s.t;

  const pushEvent = useCallback(
    (type: SyncEvent['type'], vmTimeSec: number) => {
      const ev: SyncEvent = {
        type,
        vrTimeSec: Math.round(vrNow() * 1000) / 1000,
        vmTimeSec: Math.round(vmTimeSec * 1000) / 1000,
      };
      eventsRef.current = [...eventsRef.current, ev];
      setEvents(eventsRef.current);
      // 'seek' mantiene el estado previo; play/pause lo actualizan
      const playing =
        type === 'play' ? true : type === 'pause' ? false : (sampleRef.current?.playing ?? false);
      sampleRef.current = { t: vmTimeSec, at: Date.now(), playing };
    },
    [vrNow],
  );

  /** Polling: detecta saltos manuales (SEEK) en la línea de tiempo. */
  const poll = useCallback(() => {
    const player = playerRef.current;
    if (!player || !isRecordingRef.current) return;
    const state = player.getPlayerState();
    const now = Date.now();

    // Buffering: congelamos la posición conocida (sin leer el tiempo nuevo,
    // que ya puede reflejar un salto que se detectará al reanudar)
    if (state === YT.BUFFERING) {
      const s = sampleRef.current;
      if (s) sampleRef.current = { t: s.t, at: now, playing: false };
      return;
    }

    const t = player.getCurrentTime();
    const s = sampleRef.current;
    if (s) {
      const expected = expectedAt(s, now);
      const tolerance = s.playing ? 1.2 : 0.35;
      if (Math.abs(t - expected) > tolerance) {
        pushEvent('seek', t);
        return;
      }
    }
    sampleRef.current = { t, at: now, playing: state === YT.PLAYING };
  }, [pushEvent]);

  /**
   * Controlador onStateChange de la API IFrame de YouTube.
   * Se alimenta con e.data desde el componente.
   */
  const handleVmStateChange = useCallback(
    (state: number) => {
      if (!isRecordingRef.current || suppressRef.current) return;
      const player = playerRef.current;
      if (!player) return;
      const now = Date.now();

      if (state === YT.PLAYING) {
        const t = player.getCurrentTime();
        const s = sampleRef.current;
        // ¿Saltó la posición desde lo esperado? → SEEK justo antes del PLAY
        if (s && Math.abs(t - expectedAt(s, now)) > 0.75) {
          pushEvent('seek', t);
        }
        pushEvent('play', t);
      } else if (state === YT.PAUSED || state === YT.ENDED) {
        pushEvent('pause', player.getCurrentTime());
      } else if (state === YT.BUFFERING) {
        const s = sampleRef.current;
        if (s) sampleRef.current = { t: s.t, at: now, playing: false };
      }
    },
    [pushEvent],
  );

  /** Inicia el registro: t₀ = Date.now() (Paso C). */
  const start = useCallback(
    (player: PlayerLike) => {
      playerRef.current = player;
      eventsRef.current = [];
      setEvents([]);
      sampleRef.current = null;
      startAtRef.current = Date.now();
      isRecordingRef.current = true;
      setIsRecording(true);

      // Pausa silenciosa del VM para garantizar un primer evento 'play' limpio
      suppressRef.current = true;
      try {
        if (player.getPlayerState() === YT.PLAYING) player.pauseVideo();
      } catch {
        /* noop */
      }
      window.setTimeout(() => {
        suppressRef.current = false;
      }, 500);

      if (pollIdRef.current !== null) window.clearInterval(pollIdRef.current);
      pollIdRef.current = window.setInterval(poll, POLL_MS);
    },
    [poll],
  );

  /** Cierra el registro y devuelve el vector de eventos (Paso D). */
  const stop = useCallback((): SyncEvent[] => {
    if (pollIdRef.current !== null) {
      window.clearInterval(pollIdRef.current);
      pollIdRef.current = null;
    }
    isRecordingRef.current = false;
    setIsRecording(false);
    const player = playerRef.current;
    if (player && player.getPlayerState() === YT.PLAYING) {
      pushEvent('pause', player.getCurrentTime());
    }
    startAtRef.current = null;
    return eventsRef.current;
  }, [pushEvent]);

  useEffect(() => {
    return () => {
      if (pollIdRef.current !== null) window.clearInterval(pollIdRef.current);
    };
  }, []);

  return { isRecording, events, start, stop, handleVmStateChange };
}
