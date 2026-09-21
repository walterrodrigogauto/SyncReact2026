import { useCallback, useEffect, useRef, useState } from 'react';
import type { RefObject } from 'react';

/**
 * FASE 2 · Paso A: Captura de Cámara (MediaRecorder API).
 * - getUserMedia({ video: true, audio: true })
 * - Feed en vivo en un <video> muted (encuadre e iluminación)
 * - MediaRecorder con acumuladores en array de Blob (chunks)
 */

export type WebcamStatus = 'idle' | 'requesting' | 'ready' | 'recording' | 'error';

export interface UseWebcamResult {
  videoRef: RefObject<HTMLVideoElement>;
  status: WebcamStatus;
  error: string | null;
  hasAudio: boolean;
  mimeType: string;
  start: () => Promise<void>;
  stop: () => void;
  startRecording: () => boolean;
  stopRecording: () => Promise<Blob | null>;
}

function pickMimeType(): string {
  const candidates = [
    'video/webm;codecs=vp9,opus',
    'video/webm;codecs=vp8,opus',
    'video/webm',
    'video/mp4',
  ];
  if (typeof MediaRecorder === 'undefined') return '';
  for (const candidate of candidates) {
    if (MediaRecorder.isTypeSupported(candidate)) return candidate;
  }
  return '';
}

export function useWebcam(): UseWebcamResult {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const [status, setStatus] = useState<WebcamStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [hasAudio, setHasAudio] = useState(false);
  const [mimeType, setMimeType] = useState<string>('video/webm');

  const start = useCallback(async () => {
    setError(null);
    setStatus('requesting');
    try {
      if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
        throw new Error('unsupported');
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: true,
      });
      streamRef.current = stream;
      setHasAudio(stream.getAudioTracks().length > 0);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => undefined);
      }

      const chosen = pickMimeType();
      const recorder = chosen
        ? new MediaRecorder(stream, {
            mimeType: chosen,
            videoBitsPerSecond: 2_500_000,
            audioBitsPerSecond: 128_000,
          })
        : new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (e: BlobEvent) => {
        if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorderRef.current = recorder;
      setMimeType(chosen || recorder.mimeType || 'video/webm');
      setStatus('ready');
    } catch (err) {
      const e = err as DOMException;
      const msg =
        e.name === 'NotAllowedError'
          ? 'Permiso de cámara/micrófono denegado. Habilítalo en tu navegador; si estás en una vista previa incrustada, abre la app en una pestaña propia.'
          : e.name === 'NotFoundError'
            ? 'No se detectó ninguna cámara o micrófono disponibles.'
            : e.message === 'unsupported'
              ? 'Este navegador no soporta getUserMedia / MediaRecorder.'
              : 'No se pudo iniciar la captura de cámara en este entorno.';
      setError(msg);
      setStatus('error');
    }
  }, []);

  /** Inicia la captura con acumuladores cada 1 segundo (Paso C). */
  const startRecording = useCallback(() => {
    const rec = recorderRef.current;
    if (!rec) return false;
    if (rec.state === 'inactive') rec.start(1000);
    setStatus('recording');
    return true;
  }, []);

  /** Detiene el MediaRecorder y genera un Blob unificado (Paso D). */
  const stopRecording = useCallback(async (): Promise<Blob | null> => {
    const rec = recorderRef.current;
    if (!rec || rec.state === 'inactive') {
      setStatus('ready');
      return null;
    }
    const blob = await new Promise<Blob>((resolve) => {
      rec.onstop = () => resolve(new Blob(chunksRef.current, { type: mimeType.split(';')[0] }));
      rec.stop();
    });
    setStatus('ready');
    return blob;
  }, [mimeType]);

  const stop = useCallback(() => {
    const rec = recorderRef.current;
    if (rec && rec.state !== 'inactive') {
      try {
        rec.stop();
      } catch {
        /* noop */
      }
    }
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    recorderRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setStatus('idle');
    setError(null);
  }, []);

  // Liberar dispositivos al desmontar
  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      const rec = recorderRef.current;
      if (rec && rec.state !== 'inactive') {
        try {
          rec.stop();
        } catch {
          /* noop */
        }
      }
    };
  }, []);

  return { videoRef, status, error, hasAudio, mimeType, start, stop, startRecording, stopRecording };
}
