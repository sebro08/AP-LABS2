import { Timestamp } from 'firebase/firestore';

export interface BitacoraEntry {
  id: string;
  usuario_nombre: string;
  usuario_email: string;
  usuario_rol: string;
  recurso_nombre?: string;
  recurso_codigo?: string;
  recurso_id?: string;
  accion: string;
  accion_detalle: string;
  modulo: string;
  timestamp: Timestamp;
  fecha_formateada: string;
  hora_formateada: string;
  observaciones?: string;
}

export interface LogActivityParams {
  usuario_nombre: string;
  usuario_email: string;
  usuario_rol: string;
  accion: string;
  accion_detalle: string;
  modulo: string;
  recurso_nombre?: string;
  recurso_codigo?: string;
  recurso_id?: string;
  observaciones?: string;
}
