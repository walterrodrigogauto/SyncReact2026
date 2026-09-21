import LZString from 'lz-string';
import type { SyncConfig } from '../types/sync';

/**
 * FASE 3 · Generación de la URL de Visitante (opción 100% client-side).
 * El objeto JSON del .sync se serializa y comprime con lz-string,
 * y viaja en el query param `data` (variante URL-safe de Base64).
 * Ej: https://syncreact.app/watch?vm=ID_VM&vr=ID_VR&data=eJzLSM3...
 */

export function encodeSyncParam(config: SyncConfig): string {
  return LZString.compressToEncodedURIComponent(JSON.stringify(config));
}

export function decodeSyncParam(param: string): SyncConfig | null {
  try {
    const json = LZString.decompressFromEncodedURIComponent(param);
    if (!json) return null;
    const parsed: unknown = JSON.parse(json);
    return isSyncConfig(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function isSyncConfig(value: unknown): value is SyncConfig {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.version === 'string' &&
    typeof v.createdAt === 'string' &&
    typeof v.vmUrl === 'string' &&
    Array.isArray(v.events) &&
    v.events.every((e) => {
      const ev = e as Record<string, unknown>;
      return (
        (ev.type === 'play' || ev.type === 'pause' || ev.type === 'seek') &&
        typeof ev.vrTimeSec === 'number' &&
        typeof ev.vmTimeSec === 'number' &&
        Number.isFinite(ev.vrTimeSec) &&
        Number.isFinite(ev.vmTimeSec)
      );
    })
  );
}

export function buildWatchUrl(vmId: string, vrId: string, config: SyncConfig): string {
  const base = `${window.location.origin}${import.meta.env.BASE_URL}`;
  const path = base.endsWith('/') ? `${base}watch` : `${base}/watch`;
  return `${path}?vm=${vmId}&vr=${vrId}&data=${encodeSyncParam(config)}`;
}
