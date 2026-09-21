/**
 * Parser de URLs de YouTube (FASE 2 · Paso B).
 * Extrae el videoId mediante expresiones regulares estándar.
 */

const ID_PATTERN = /^[a-zA-Z0-9_-]{11}$/;

const URL_PATTERNS: RegExp[] = [
  /(?:youtube\.com\/watch\?[^#]*\bv=)([a-zA-Z0-9_-]{11})/,
  /(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/,
  /(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
  /(?:youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
  /(?:youtube\.com\/live\/)([a-zA-Z0-9_-]{11})/,
  /(?:youtube\.com\/.*[?&]v=)([a-zA-Z0-9_-]{11})/,
];

export function parseYouTubeId(input: string): string | null {
  const raw = input.trim();
  if (!raw) return null;
  // También aceptamos el ID crudo (11 caracteres)
  if (ID_PATTERN.test(raw)) return raw;
  for (const pattern of URL_PATTERNS) {
    const match = raw.match(pattern);
    if (match) return match[1];
  }
  return null;
}

export function canonicalYouTubeUrl(videoId: string): string {
  return `https://www.youtube.com/watch?v=${videoId}`;
}
