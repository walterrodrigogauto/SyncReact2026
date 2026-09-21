import { useEffect, useRef, useState } from 'react';
import type { MutableRefObject } from 'react';
import type { PlayerLike } from '../lib/player';
import { YT } from '../lib/player';
import type { SyncEvent } from '../types/sync';

/**
 * FASE 4 · Motor de Sincronización Master-Slave (useSyncEngine).
 *
 * - El video de la Reacción (VR) actúa como MASTER.
 * - El video Musical (VM) actúa como SLAVE.
 * - Un bucle periódico de 100 ms consulta la posición del Master:
 *     1. Lee el tiempo actual del VR (vrCurrentTime).
 *     2. Busca en el vector de eventos el estado correspondiente a ese segundo.
 *     3. Calcula el objetivo del VM: vmTargetTime = vrCurrentTime − eventOffset.
 *
 * Drift Control: si |vmRealTime − vmTargetTime| > 0.35 s → seekTo(vmTargetTime)
 * para re-alinear sin interrumpir el audio.
 *
 * Buffering: si el VR entra en buffering, se pausa inmediatamente el VM;
 * al reanudar el VR, se reanuda el VM.
 */

export type SyncKind = 'idle' | 'waiting' | 'synced' | 'correcting' | 'paused' | 'buffering';

export interface SyncStatus {
  kind: SyncKind;
  driftSec: number | null;
  vrTimeSec: number;
  vmTargetSec: number | null;
  activeEventIndex: number;
}

/** Tolerancia de desfase antes de re-alinear con seekTo (0.35 s). */
export const DRIFT_THRESHOLD_SEC = 0.35;
const TICK_MS = 100;

type SegmentState = 'playing' | 'paused';

interface Prepared {
  events: SyncEvent[];
  stateAfter: SegmentState[];
}

/** Ordena eventos y precomputa el estado resultante tras cada uno. */
function prepare(events: SyncEvent[]): Prepared {
  const sorted = [...events].sort((a, b) => a.vrTimeSec - b.vrTimeSec);
  const stateAfter: SegmentState[] = [];
  let current: SegmentState = 'paused';
  for (const ev of sorted) {
    if (ev.type === 'play') current = 'playing';
    else if (ev.type === 'pause') current = 'paused';
    // 'seek' mantiene el estado previo
    stateAfter.push(current);
  }
  return { events: sorted, stateAfter };
}

function roundOrNeg(v: number | null, mult: number): number {
  return v === null ? -1 : Math.round(v * mult);
}

function sameStatus(a: SyncStatus, b: SyncStatus): boolean {
  return (
    a.kind === b.kind &&
    a.activeEventIndex === b.activeEventIndex &&
    Math.round(a.vrTimeSec * 10) === Math.round(b.vrTimeSec * 10) &&
    roundOrNeg(a.driftSec, 20) === roundOrNeg(b.driftSec, 20) &&
    roundOrNeg(a.vmTargetSec, 10) === roundOrNeg(b.vmTargetSec, 10)
  );
}

export function useSyncEngine(
  vrRef: MutableRefObject<PlayerLike | null>,
  vmRef: MutableRefObject<PlayerLike | null>,
  events: SyncEvent[],
  enabled: boolean,
): { status: SyncStatus; resync: () => void } {
  const [status, setStatus] = useState<SyncStatus>({
    kind: 'idle',
    driftSec: null,
    vrTimeSec: 0,
    vmTargetSec: null,
    activeEventIndex: -1,
  });

  const preparedRef = useRef<Prepared>({ events: [], stateAfter: [] });
  preparedRef.current = prepare(events);

  const enabledRef = useRef(enabled);
  enabledRef.current = enabled;

  const forceRef = useRef(false);

  useEffect(() => {
    const apply = (next: SyncStatus) => {
      setStatus((prev) => (sameStatus(prev, next) ? prev : next));
    };

    const tick = () => {
      const vr = vrRef.current;
      const vm = vmRef.current;
      if (!vr || !vm || !enabledRef.current) return;

      const { events: evs, stateAfter } = preparedRef.current;
      const vrState = vr.getPlayerState();
      const vrTime = vr.getCurrentTime();

      // Buffering del MASTER → pausar el SLAVE de inmediato
      if (vrState === YT.BUFFERING) {
        if (vm.getPlayerState() === YT.PLAYING) vm.pauseVideo();
        apply({ kind: 'buffering', driftSec: null, vrTimeSec: vrTime, vmTargetSec: null, activeEventIndex: -1 });
        return;
      }

      // El visitante aún no le da play al Master
      if (vrState === YT.UNSTARTED || vrState === YT.CUED) {
        if (vm.getPlayerState() === YT.PLAYING) vm.pauseVideo();
        apply({ kind: 'waiting', driftSec: null, vrTimeSec: vrTime, vmTargetSec: null, activeEventIndex: -1 });
        return;
      }

      // Último evento alcanzado por la línea de tiempo del Master
      let idx = -1;
      for (let i = 0; i < evs.length; i += 1) {
        if (evs[i].vrTimeSec <= vrTime) idx = i;
        else break;
      }

      if (idx === -1) {
        if (vm.getPlayerState() === YT.PLAYING) vm.pauseVideo();
        apply({ kind: 'waiting', driftSec: null, vrTimeSec: vrTime, vmTargetSec: null, activeEventIndex: -1 });
        return;
      }

      const ev = evs[idx];
      const segment = stateAfter[idx];
      // vmTargetTime = vrCurrentTime − eventOffset (interpolado desde el evento activo)
      const vmTarget = segment === 'playing' ? ev.vmTimeSec + (vrTime - ev.vrTimeSec) : ev.vmTimeSec;
      const vmState = vm.getPlayerState();
      const vmTime = vm.getCurrentTime();
      const desiredPlaying = segment === 'playing' && vrState === YT.PLAYING;

      if (!desiredPlaying) {
        if (vmState === YT.PLAYING) vm.pauseVideo();
        apply({ kind: 'paused', driftSec: null, vrTimeSec: vrTime, vmTargetSec: vmTarget, activeEventIndex: idx });
        return;
      }

      // (Re)arranque del Slave alineado con el objetivo
      if (vmState !== YT.PLAYING && vmState !== YT.BUFFERING) {
        vm.seekTo(vmTarget, true);
        vm.playVideo();
      }

      if (vmState === YT.BUFFERING) {
        apply({ kind: 'buffering', driftSec: null, vrTimeSec: vrTime, vmTargetSec: vmTarget, activeEventIndex: idx });
        return;
      }

      // Controlador de Desfase (Drift Control)
      const drift = vmTime - vmTarget;
      if (forceRef.current || Math.abs(drift) > DRIFT_THRESHOLD_SEC) {
        vm.seekTo(vmTarget, true); // re-alinear sin interrumpir el audio
        forceRef.current = false;
        apply({ kind: 'correcting', driftSec: drift, vrTimeSec: vrTime, vmTargetSec: vmTarget, activeEventIndex: idx });
        return;
      }

      apply({ kind: 'synced', driftSec: drift, vrTimeSec: vrTime, vmTargetSec: vmTarget, activeEventIndex: idx });
    };

    const id = window.setInterval(tick, TICK_MS);
    return () => window.clearInterval(id);
  }, [vrRef, vmRef]);

  /** Fuerza una re-alineación inmediata en el próximo tick. */
  const resync = () => {
    forceRef.current = true;
  };

  return { status, resync };
}
