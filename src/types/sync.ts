/**
 * FASE 1 · Definición del Esquema de Datos
 * Contrato de datos del archivo .sync
 */

export interface SyncEvent {
  type: 'play' | 'pause' | 'seek';
  vrTimeSec: number; // Marca de tiempo del reaccionador (Master)
  vmTimeSec: number; // Marca de tiempo del video musical (Slave)
}

export interface SyncConfig {
  version: string;
  createdAt: string;
  vmUrl: string;
  events: SyncEvent[];
}
