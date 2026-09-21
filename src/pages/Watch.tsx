import { useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import YouTube, { type YouTubeEvent } from 'react-youtube';
import {
  AlertTriangle,
  MonitorPlay,
  RotateCcw,
  Volume2,
  VolumeX,
  Youtube as YoutubeIcon,
} from 'lucide-react';
import { decodeSyncParam } from '../lib/syncCodec';
import { parseYouTubeId } from '../lib/youtube';
import { formatTime, type PlayerLike } from '../lib/player';
import { useSyncEngine } from '../hooks/useSyncEngine';
import type { SyncEvent } from '../types/sync';

const masterOpts = { playerVars: { autoplay: 0, rel: 0, playsinline: 1 } };
const slaveOpts = {
  playerVars: {
    autoplay: 0,
    controls: 0,
    disablekb: 1,
    rel: 0,
    modestbranding: 1,
    iv_load_policy: 3,
    playsinline: 1,
    fs: 0,
  },
};

const statusMeta = {
  idle: { label: 'Cargando…', dot: 'bg-zinc-400' },
  waiting: { label: 'Presiona play en la reacción', dot: 'bg-zinc-400 animate-pulse-rec' },
  synced: { label: 'En sincronía', dot: 'bg-emerald-500' },
  correcting: { label: 'Ajustando…', dot: 'bg-amber-400' },
  paused: { label: 'En pausa', dot: 'bg-zinc-500' },
  buffering: { label: 'Cargando video…', dot: 'bg-sky-400' },
} as const;

const eventDot: Record<SyncEvent['type'], string> = {
  play: 'bg-emerald-500',
  pause: 'bg-zinc-400',
  seek: 'bg-amber-400',
};

export default function Watch() {
  const [searchParams] = useSearchParams();
  const vmParam = searchParams.get('vm');
  const vrParam = searchParams.get('vr');
  const dataParam = searchParams.get('data');

  const config = useMemo(() => (dataParam ? decodeSyncParam(dataParam) : null), [dataParam]);
  const vmId = vmParam ?? (config ? parseYouTubeId(config.vmUrl) : null);
  const vrId = vrParam;

  const vrRef = useRef<PlayerLike | null>(null);
  const vmRef = useRef<PlayerLike | null>(null);
  const [vrReady, setVrReady] = useState(false);
  const [vmReady, setVmReady] = useState(false);
  const [vrDuration, setVrDuration] = useState(0);
  const [vrMuted, setVrMuted] = useState(false);
  const [vmMuted, setVmMuted] = useState(true);
  const [vrError, setVrError] = useState<string | null>(null);
  const [vmError, setVmError] = useState<string | null>(null);

  const events = config?.events ?? [];
  const { status, resync } = useSyncEngine(vrRef, vmRef, events, vrReady && vmReady && events.length > 0);

  // Enlace inválido: faltan parámetros o el payload está corrupto
  if (!vrId || !vmId || !config || events.length === 0) {
    return (
      <div className="mx-auto w-full max-w-2xl px-4 py-20 text-center">
        <AlertTriangle className="mx-auto h-12 w-12 text-amber-400" />
        <h1 className="mt-4 text-2xl font-bold">Enlace inválido</h1>
        <p className="mt-2 text-sm text-yt-dim">
          Este enlace no tiene toda la información necesaria. Pídele al creador un enlace nuevo.
        </p>
        <Link to="/upload" className="btn-primary mt-6">
          Generar un enlace
        </Link>
      </div>
    );
  }

  const meta = statusMeta[status.kind];
  const progress = vrDuration > 0 ? Math.min(1, status.vrTimeSec / vrDuration) : 0;

  const toggleVrMute = () => {
    const p = vrRef.current;
    if (!p) return;
    if (p.isMuted()) {
      p.unMute();
      setVrMuted(false);
    } else {
      p.mute();
      setVrMuted(true);
    }
  };

  const toggleVmMute = () => {
    const p = vmRef.current;
    if (!p) return;
    if (p.isMuted()) {
      p.unMute();
      setVmMuted(false);
    } else {
      p.mute();
      setVmMuted(true);
    }
  };

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Reacción sincronizada</h1>
          <p className="mt-1 text-sm text-yt-dim">
            Dale play a la reacción: el video musical la sigue solo, en cada pausa y cada salto.
          </p>
        </div>
        <span className="flex items-center gap-2 rounded-full border border-yt-border bg-yt-surface px-4 py-1.5 text-xs font-semibold">
          <span className={`h-2.5 w-2.5 rounded-full ${meta.dot}`} />
          {meta.label}
        </span>
      </div>

      {(vrError || vmError) && (
        <div className="mt-4 flex flex-wrap gap-2">
          {vrError && (
            <p className="flex items-center gap-1.5 rounded-full border border-yt-red/50 bg-yt-red/10 px-3 py-1.5 text-xs text-yt-red">
              <AlertTriangle className="h-3.5 w-3.5" /> {vrError}
            </p>
          )}
          {vmError && (
            <p className="flex items-center gap-1.5 rounded-full border border-yt-red/50 bg-yt-red/10 px-3 py-1.5 text-xs text-yt-red">
              <AlertTriangle className="h-3.5 w-3.5" /> {vmError}
            </p>
          )}
        </div>
      )}

      <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,1fr)_380px]">
        {/* REACCIÓN (control principal) */}
        <div className="space-y-4">
          <section className="card overflow-hidden">
            <div className="flex items-center justify-between border-b border-yt-border px-4 py-2.5">
              <span className="flex items-center gap-2 text-sm font-semibold">
                <YoutubeIcon className="h-4 w-4 text-yt-red" />
                Reacción
              </span>
              <span className="text-[11px] text-yt-dim">controla la reproducción desde aquí</span>
              <button
                className="icon-btn"
                onClick={toggleVrMute}
                title={vrMuted ? 'Activar sonido de la reacción' : 'Silenciar reacción'}
              >
                {vrMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
              </button>
            </div>
            <div className="player-frame aspect-video w-full bg-black">
              <YouTube
                videoId={vrId}
                opts={masterOpts}
                className="h-full w-full"
                onReady={(e: YouTubeEvent) => {
                  const p = e.target as unknown as PlayerLike;
                  vrRef.current = p;
                  setVrDuration(p.getDuration());
                  setVrReady(true);
                }}
                onError={() => setVrError('No se pudo cargar el video de la reacción.')}
              />
            </div>
          </section>

          {/* Progreso con marcadores */}
          <section className="card p-4">
            <div className="flex items-center justify-between text-xs text-yt-dim">
              <span className="flex items-center gap-1.5 font-semibold text-yt-text">
                <MonitorPlay className="h-4 w-4" />
                Progreso de la reacción
              </span>
              <span className="font-mono">
                {formatTime(status.vrTimeSec)} / {formatTime(vrDuration)}
              </span>
            </div>
            <div className="relative mt-3 h-2.5 rounded-full bg-yt-elevated">
              <div
                className="absolute inset-y-0 left-0 rounded-full bg-yt-red/80"
                style={{ width: `${progress * 100}%` }}
              />
              {vrDuration > 0 &&
                events.map((ev, i) => (
                  <span
                    key={i}
                    className={`absolute top-1/2 h-3 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full ${eventDot[ev.type]}`}
                    style={{ left: `${Math.min(100, (ev.vrTimeSec / vrDuration) * 100)}%` }}
                  />
                ))}
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-4 text-[11px] text-yt-dim">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-500" /> play
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-zinc-400" /> pausa
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-amber-400" /> salto
              </span>
            </div>
          </section>
        </div>

        {/* VIDEO MUSICAL (automático) */}
        <aside className="space-y-4">
          <section className="card overflow-hidden">
            <div className="flex items-center justify-between border-b border-yt-border px-4 py-2.5">
              <span className="flex items-center gap-2 text-sm font-semibold">
                <YoutubeIcon className="h-4 w-4 text-yt-dim" />
                Video musical
              </span>
              <button
                className="icon-btn"
                onClick={toggleVmMute}
                title={vmMuted ? 'Activar sonido del video musical' : 'Silenciar video musical'}
              >
                {vmMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
              </button>
            </div>
            {vmMuted && (
              <button
                onClick={toggleVmMute}
                className="flex w-full items-center gap-2 border-b border-yt-border bg-amber-400/10 px-4 py-2 text-left text-xs text-amber-300 transition hover:bg-amber-400/20"
              >
                <VolumeX className="h-3.5 w-3.5 shrink-0" />
                ¿No se escucha la música? Toca aquí para activarla
              </button>
            )}
            <div className="relative aspect-video w-full bg-black">
              <YouTube
                videoId={vmId}
                opts={slaveOpts}
                className="h-full w-full"
                onReady={(e: YouTubeEvent) => {
                  const p = e.target as unknown as PlayerLike;
                  vmRef.current = p;
                  p.mute();
                  p.setVolume(90);
                  setVmReady(true);
                }}
                onError={() => setVmError('No se pudo cargar el video musical.')}
              />
              {/* Bloquea la interacción manual */}
              <div className="absolute inset-0 z-10 flex cursor-not-allowed items-end justify-center bg-gradient-to-t from-black/60 via-transparent to-transparent p-2">
                <span className="flex items-center gap-1.5 rounded-full bg-black/70 px-3 py-1 text-[11px] font-medium text-white">
                  Se sincroniza solo
                </span>
              </div>
            </div>
          </section>

          <button className="btn-ghost w-full" onClick={resync}>
            <RotateCcw className="h-4 w-4" />
            ¿Se desfasó? Re-sincronizar
          </button>
        </aside>
      </div>
    </div>
  );
}
