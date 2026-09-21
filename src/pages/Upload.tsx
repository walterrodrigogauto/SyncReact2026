import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  Copy,
  FileJson,
  Link2,
  MonitorPlay,
  Upload as UploadIcon,
} from 'lucide-react';
import { parseYouTubeId } from '../lib/youtube';
import { buildWatchUrl, isSyncConfig } from '../lib/syncCodec';
import { formatTime } from '../lib/player';
import type { SyncConfig } from '../types/sync';

interface UploadLocationState {
  vmUrl?: string;
  syncConfig?: SyncConfig;
}

export default function Upload() {
  const location = useLocation();
  const incoming = (location.state ?? null) as UploadLocationState | null;

  const [vmUrl, setVmUrl] = useState(incoming?.vmUrl ?? '');
  const [vrUrl, setVrUrl] = useState('');
  const [config, setConfig] = useState<SyncConfig | null>(incoming?.syncConfig ?? null);
  const [fileName, setFileName] = useState<string | null>(
    incoming?.syncConfig ? 'transferido desde Grabar' : null,
  );
  const [fileError, setFileError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [generated, setGenerated] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const eventsDuration =
    config && config.events.length > 0 ? config.events[config.events.length - 1].vrTimeSec : 0;

  const vmInputId = parseYouTubeId(vmUrl);
  const vmConfigId = config ? parseYouTubeId(config.vmUrl) : null;
  const vmMismatch = Boolean(vmInputId && vmConfigId && vmInputId !== vmConfigId);

  const readFile = async (file: File) => {
    setFileError(null);
    try {
      const parsed: unknown = JSON.parse(await file.text());
      if (!isSyncConfig(parsed)) {
        setConfig(null);
        setFileName(null);
        setFileError('Este archivo no parece ser un .sync válido. Usa el que se descarga al terminar una grabación.');
        return;
      }
      setConfig(parsed);
      setFileName(file.name);
      setGenerated(null);
      if (!vmUrl.trim()) setVmUrl(parsed.vmUrl);
    } catch {
      setConfig(null);
      setFileName(null);
      setFileError('No se pudo leer el archivo.');
    }
  };

  const generate = () => {
    const vmId = parseYouTubeId(vmUrl);
    const vrId = parseYouTubeId(vrUrl);
    if (!vmId) {
      setFormError('Ingresa el enlace del video musical.');
      return;
    }
    if (!vrId) {
      setFormError('Ingresa el enlace de tu reacción, ya subida a YouTube.');
      return;
    }
    if (!config) {
      setFormError('Carga el archivo .sync que descargaste al grabar.');
      return;
    }
    setFormError(null);
    setGenerated(buildWatchUrl(vmId, vrId, config));
    setCopied(false);
  };

  const copy = async () => {
    if (!generated) return;
    try {
      await navigator.clipboard.writeText(generated);
    } catch {
      const el = document.createElement('textarea');
      el.value = generated;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-8">
      <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Publicar reacción</h1>
      <p className="mt-1 text-sm text-yt-dim">
        Completa los tres campos y genera tu enlace para compartir.
      </p>

      <section className="card mt-6 space-y-5 p-4 sm:p-6">
        <div>
          <label className="label" htmlFor="vm-url">
            ① Enlace del video musical original
          </label>
          <input
            id="vm-url"
            className="input"
            placeholder="https://www.youtube.com/watch?v=…"
            value={vmUrl}
            onChange={(e) => setVmUrl(e.target.value)}
          />
        </div>

        <div>
          <label className="label" htmlFor="vr-url">
            ② Enlace de tu reacción en YouTube
          </label>
          <input
            id="vr-url"
            className="input"
            placeholder="https://www.youtube.com/watch?v=…"
            value={vrUrl}
            onChange={(e) => setVrUrl(e.target.value)}
          />
          <p className="mt-1.5 text-xs text-yt-dim">
            ¿Todavía no lo subiste? Publica el video descargado desde{' '}
            <Link to="/record" className="font-medium text-yt-red hover:underline">
              Grabar
            </Link>{' '}
            en tu canal y vuelve aquí.
          </p>
        </div>

        <div>
          <span className="label">③ Archivo .sync de tu grabación</span>
          <label
            className={`flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed px-6 py-7 text-center transition ${
              config
                ? 'border-emerald-600/60 bg-emerald-500/5'
                : 'border-yt-border bg-yt-elevated/60 hover:border-yt-dim'
            }`}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const f = e.dataTransfer.files?.[0];
              if (f) void readFile(f);
            }}
          >
            <input
              type="file"
              accept=".sync,.json,application/json"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void readFile(f);
              }}
            />
            <FileJson className={`h-8 w-8 ${config ? 'text-emerald-400' : 'text-yt-dim'}`} />
            <span className="text-sm font-medium">
              {config ? fileName : 'Arrastra aquí tu archivo .sync o haz clic para buscarlo'}
            </span>
            {config ? (
              <span className="text-xs text-emerald-400">
                {config.events.length} eventos · {formatTime(eventsDuration)} de reacción
              </span>
            ) : (
              <span className="flex items-center gap-1 text-xs text-yt-dim">
                <UploadIcon className="h-3 w-3" />
                Se descarga automáticamente al terminar una grabación
              </span>
            )}
          </label>
          {fileError && (
            <p className="mt-2 flex items-start gap-1.5 text-xs text-yt-red">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              {fileError}
            </p>
          )}
          {vmMismatch && (
            <p className="mt-2 flex items-start gap-1.5 text-xs text-amber-400">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              Este video musical no coincide con el de tu grabación. Usaremos el que acabas de poner.
            </p>
          )}
        </div>

        {formError && (
          <p className="flex items-start gap-1.5 text-xs text-yt-red">
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            {formError}
          </p>
        )}

        <button
          className="btn-primary w-full sm:w-auto"
          onClick={generate}
          disabled={!vmUrl.trim() || !vrUrl.trim() || !config}
        >
          <Link2 className="h-4 w-4" />
          Generar mi enlace
        </button>
      </section>

      {generated && (
        <section className="card mt-5 p-4 sm:p-6">
          <div className="flex items-center gap-2 text-emerald-400">
            <CheckCircle2 className="h-5 w-5" />
            <h2 className="font-semibold text-emerald-400">¡Tu enlace está listo!</h2>
          </div>
          <p className="mt-2 text-sm text-yt-dim">
            Compártelo: quien lo abra verá tu reacción y el video musical sincronizados.
          </p>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <input
              readOnly
              value={generated}
              onFocus={(e) => e.currentTarget.select()}
              className="input font-mono text-xs"
            />
            <button className="btn-primary shrink-0" onClick={() => void copy()}>
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied ? '¡Copiado!' : 'Copiar'}
            </button>
          </div>
          <a href={generated} target="_blank" rel="noreferrer" className="btn-ghost mt-3">
            <MonitorPlay className="h-4 w-4" />
            Probar el enlace
          </a>
        </section>
      )}
    </div>
  );
}
