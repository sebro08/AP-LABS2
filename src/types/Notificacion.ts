export interface Notificacion {
  id: string;
  tipo: 'mensaje' | 'solicitud_aprobada' | 'solicitud_rechazada' | 'mantenimiento_programado' | 'mantenimiento_completado' | 'general';
  titulo: string;
  mensaje: string;
  fecha_creacion: string;
  leida: boolean;
  id_usuario: string;
  datos_adicionales?: {
    id_solicitud?: string;
    id_mantenimiento?: string;
    id_mensaje?: string;
    remitente?: string;
    recurso?: string;
    laboratorio?: string;
  };
}

export interface FiltrosNotificacion {
  tipo?: string;
  leida?: boolean;
  fechaInicio?: string;
  fechaFin?: string;
}