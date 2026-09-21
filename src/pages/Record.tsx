import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { saveAs } from 'file-saver';
import YouTube, { type YouTubeEvent } from 'react-youtube';
import {
  AlertTriangle,
  ArrowLeftRight,
  ArrowRight,
  Camera,
  CameraOff,
  CheckCircle2,
  Download,
  Loader2,
  Mic,
  MicOff,
  Pause,
  Play,
  Radio,
  Square,
  Youtube as YoutubeIcon,
} from 'lucide-react';
import { canonicalYouTubeUrl, parseYouTubeId } from '../lib/youtube';
import { formatTime, type PlayerLike } from '../lib/player';
import { useEventRecorder } from '../hooks/useEventRecorder';
import { useWebcam } from '../hooks/useWebcam';
import type { SyncConfig } from '../types/sync';

const vmOpts = { playerVars: { autoplay: 0, rel: 0, modestbranding: 1, playsinline: 1 } };

interface RecordResult {
  config: SyncConfig;
  durationSec: number;
  videoBlob: Blob;
  videoFileName: string;
  syncFileName: string;
}

function stamp(d: Date): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}`;
}

export default function Record() {
  const navigate = useNavigate();

  const [vmUrl, setVmUrl] = useState('');
  const [vmId, setVmId] = useState<string | null>(null);
  const [vmError, setVmError] = useState<string | null>(null);
  const [vmReady, setVmReady] = useState(false);
  const vmPlayerRef = useRef<PlayerLike | null>(null);

  const webcam = useWebcam();
  const recorder = useEventRecorder();

  const [recordStart, setRecordStart] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [result, setResult] = useState<RecordResult | null>(null);

  // Cronómetro de la grabación
  useEffect(() => {
    if (recordStart === null) {
      setElapsed(0);
      return;
    }
    const id = window.setInterval(() => setElapsed((Date.now() - recordStart) / 1000), 200);
    return () => window.clearInterval(id);
  }, [recordStart]);

  const loadVideo = () => {
    const id = parseYouTubeId(vmUrl);
    setVmId(id);
    setVmReady(false);
    setVmError(
      id
        ? null
        : 'No pudimos detectar un video válido. Pega un enlace tipo youtube.com/watch?v=… o youtu.be/…',
    );
  };

  const canRecord = Boolean(vmId && vmReady && webcam.status === 'ready') && !recorder.isRecording;
  const webcamStarting = webcam.status === 'requesting';

  const handleStart = () => {
    const player = vmPlayerRef.current;
    if (!player || webcam.status !== 'ready') return;
    if (!webcam.startRecording()) return;
    recorder.start(player);
    setResult(null);
    setRecordStart(Date.now());
  };

  const handleStop = async () => {
    if (recordStart === null) return;
    const durationSec = (Date.now() - recordStart) / 1000;
    const events = recorder.stop();
    setRecordStart(null);
    const videoBlob = await webcam.stopRecording();

    const createdAt = new Date();
    const config: SyncConfig = {
      version: '1.0.0',
      createdAt: createdAt.toISOString(),
      vmUrl: canonicalYouTubeUrl(vmId ?? ''),
      events,
    };
    const ext = webcam.mimeType.includes('mp4') ? 'mp4' : 'webm';
    const videoFileName = `syncreact-reaccion-${stamp(createdAt)}.${ext}`;
    const syncFileName = `syncreact-reaccion-${stamp(createdAt)}.sync`;

    if (videoBlob) saveAs(videoBlob, videoFileName);
    saveAs(
      new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' }),
      syncFileName,
    );

    setResult({ config, durationSec, videoBlob: videoBlob ?? new Blob(), videoFileName, syncFileName });
  };

  const publish = () => {
    if (!result) return;
    navigate('/upload', { state: { vmUrl: result.config.vmUrl, syncConfig: result.config } });
  };

  const hint = !vmId || !vmReady
    ? 'Empieza cargando el video musical.'
    : webcam.status !== 'ready'
      ? 'Ahora activa tu cámara y micrófono.'
      : !recorder.isRecording && !result
        ? 'Todo listo: presiona GRABAR y da play al video para reaccionar.'
        : null;

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Grabar reacción</h1>
          <p className="mt-1 text-sm text-yt-dim">
            Reacciona al video musical: cada pausa y salto queda registrado automáticamente.
          </p>
        </div>
        {recorder.isRecording && (
          <span className="flex items-center gap-2 rounded-full border border-yt-red/40 bg-yt-red/10 px-4 py-1.5 text-sm font-semibold text-yt-red">
            <span className="h-2.5 w-2.5 animate-pulse-rec rounded-full bg-yt-red" />
            REC {formatTime(elapsed)}
          </span>
        )}
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        {/* VIDEO MUSICAL */}
        <section className="card p-4 sm:p-5">
          <div className="flex items-center gap-2">
            <YoutubeIcon className="h-5 w-5 text-yt-red" />
            <h2 className="font-semibold">Video musical</h2>
          </div>
          <label className="label mt-4" htmlFor="vm-url">
            Enlace de YouTube
          </label>
          <div className="flex gap-2">
            <input
              id="vm-url"
              className="input"
              placeholder="https://www.youtube.com/watch?v=…"
              value={vmUrl}
              onChange={(e) => setVmUrl(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') loadVideo();
              }}
              disabled={recorder.isRecording}
            />
            <button
              className="btn-ghost shrink-0"
              onClick={loadVideo}
              disabled={recorder.isRecording || !vmUrl.trim()}
            >
              Cargar
            </button>
          </div>
          {vmError && (
            <p className="mt-2 flex items-start gap-1.5 text-xs text-yt-red">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              {vmError}
            </p>
          )}
          <div className="mt-4">
            {vmId ? (
              <div className="player-frame aspect-video w-full overflow-hidden rounded-xl bg-black">
                <YouTube
                  key={vmId}
                  videoId={vmId}
                  opts={vmOpts}
                  className="h-full w-full"
                  onReady={(e: YouTubeEvent) => {
                    vmPlayerRef.current = e.target as unknown as PlayerLike;
                    setVmReady(true);
                  }}
                  onStateChange={(e: YouTubeEvent<number>) => recorder.handleVmStateChange(e.data)}
                />
              </div>
            ) : (
              <div className="grid aspect-video w-full place-items-center rounded-xl border border-dashed border-yt-border bg-yt-elevated text-center">
                <div className="px-6">
                  <YoutubeIcon className="mx-auto h-10 w-10 text-yt-dim" />
                  <p className="mt-3 text-sm font-medium text-yt-dim">
                    Pega el enlace del video y presiona Cargar
                  </p>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* WEBCAM */}
        <section className="card p-4 sm:p-5">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Camera className="h-5 w-5" />
              <h2 className="font-semibold">Tu reacción</h2>
            </div>
            {(webcam.status === 'ready' || webcam.status === 'recording') && (
              <span
                className={`flex items-center gap-1.5 text-xs font-medium ${
                  webcam.hasAudio ? 'text-emerald-400' : 'text-amber-400'
                }`}
              >
                {webcam.hasAudio ? <Mic className="h-3.5 w-3.5" /> : <MicOff className="h-3.5 w-3.5" />}
                {webcam.hasAudio ? 'Micrófono activo' : 'Sin micrófono'}
              </span>
            )}
          </div>
          <div className="mt-4">
            {webcam.status === 'idle' || webcam.status === 'error' ? (
              <div className="grid aspect-video w-full place-items-center rounded-xl border border-dashed border-yt-border bg-yt-elevated text-center">
                <div className="px-6">
                  <CameraOff className="mx-auto h-10 w-10 text-yt-dim" />
                  <p className="mt-3 text-sm text-yt-dim">
                    Activa tu cámara y micrófono para comenzar
                  </p>
                  <button
                    className="btn-primary mt-4"
                    onClick={() => void webcam.start()}
                    disabled={webcamStarting}
                  >
                    {webcamStarting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Camera className="h-4 w-4" />
                    )}
                    {webcamStarting ? 'Solicitando permisos…' : 'Activar cámara y micrófono'}
                  </button>
                  {webcam.error && <p className="mt-3 text-xs text-yt-red">{webcam.error}</p>}
                </div>
              </div>
            ) : (
              <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-black">
                <video ref={webcam.videoRef} muted playsInline className="h-full w-full object-cover" />
                {recorder.isRecording && (
                  <span className="absolute left-3 top-3 flex items-center gap-2 rounded-full bg-black/70 px-3 py-1 text-xs font-bold text-yt-red">
                    <span className="h-2 w-2 animate-pulse-rec rounded-full bg-yt-red" />
                    REC {formatTime(elapsed)}
                  </span>
                )}
              </div>
            )}
          </div>
          <div className="mt-3 flex items-center justify-between gap-3">
            <p className="text-xs text-yt-dim">
              La vista previa está silenciada para evitar eco; tu micrófono sí se graba.
            </p>
            {webcam.status !== 'idle' && webcam.status !== 'error' && (
              <button className="btn-ghost shrink-0 !px-3 !py-1.5 text-xs" onClick={webcam.stop} disabled={recorder.isRecording}>
                <CameraOff className="h-3.5 w-3.5" />
                Liberar cámara
              </button>
            )}
          </div>
        </section>
      </div>

      {/* CONTROL DE GRABACIÓN */}
      <section className="card mt-5 p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Radio className="h-5 w-5 text-yt-red" />
            <h2 className="font-semibold">
              Grabación{' '}
              <span className="ml-1 text-sm font-normal text-yt-dim">
                ({recorder.events.length} eventos)
              </span>
            </h2>
          </div>
          {!recorder.isRecording ? (
            <button className="btn-primary" onClick={handleStart} disabled={!canRecord}>
              <span className="h-2.5 w-2.5 rounded-full bg-white" />
              GRABAR
            </button>
          ) : (
            <button className="btn-danger" onClick={() => void handleStop()}>
              <Square className="h-4 w-4 fill-current" />
              DETENER
            </button>
          )}
        </div>
        {hint && <p className="mt-3 text-xs text-yt-dim">{hint}</p>}

        <div className="mt-4 max-h-44 overflow-y-auto rounded-xl border border-yt-border bg-yt-bg p-2">
          {recorder.events.length === 0 ? (
            <p className="px-2 py-8 text-center text-xs text-yt-dim">
              Tus pausas y saltos aparecerán aquí durante la grabación.
            </p>
          ) : (
            <ul className="space-y-1">
              {recorder.events.map((ev, i) => (
                <li key={i} className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-xs">
                  {ev.type === 'play' ? (
                    <Play className="h-3.5 w-3.5 shrink-0 text-emerald-400" />
                  ) : ev.type === 'pause' ? (
                    <Pause className="h-3.5 w-3.5 shrink-0 text-zinc-400" />
                  ) : (
                    <ArrowLeftRight className="h-3.5 w-3.5 shrink-0 text-amber-400" />
                  )}
                  <span className="font-semibold capitalize">{ev.type}</span>
                  <span className="text-yt-dim">a los {formatTime(ev.vrTimeSec)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {/* RESULTADO */}
      {result && (
        <section className="card mt-5 !border-emerald-700/50 p-4 sm:p-5">
          <div className="flex items-center gap-2 text-emerald-400">
            <CheckCircle2 className="h-5 w-5" />
            <h2 className="font-semibold text-emerald-400">¡Grabación completada!</h2>
          </div>
          <p className="mt-2 text-sm text-yt-dim">
            Duración: {formatTime(result.durationSec)} · Se descargaron tu video y el archivo de
            sincronización <span className="font-mono">.sync</span>.
          </p>
          <p className="mt-1 text-sm text-yt-dim">
            <b className="text-yt-text">Siguiente paso:</b> sube el video descargado a tu canal de
            YouTube; lo necesitarás para generar tu enlace.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <button className="btn-primary" onClick={publish}>
              <ArrowRight className="h-4 w-4" />
              Publicar mi reacción
            </button>
            <button
              className="btn-ghost"
              onClick={() => {
                if (result.videoBlob.size > 0) saveAs(result.videoBlob, result.videoFileName);
              }}
            >
              <Download className="h-4 w-4" />
              Descargar video
            </button>
            <button
              className="btn-ghost"
              onClick={() =>
                saveAs(
                  new Blob([JSON.stringify(result.config, null, 2)], { type: 'application/json' }),
                  result.syncFileName,
                )
              }
            >
              <Download className="h-4 w-4" />
              Descargar .sync
            </button>
          </div>
        </section>
      )}
    </div>
  );
}
