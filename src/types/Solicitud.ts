import { Timestamp } from 'firebase/firestore';

// Solicitud de Laboratorio
export interface SolicitudLaboratorio {
  id: string;
  id_usuario: string;
  id_lab: string;
  dia: string;
  fecha_solicitud: Timestamp;
  horarios: Array<{
    hora_inicio: string;
    hora_fin: string;
  }>;
  motivo: string;
  participantes: number;
  recursos: string[];
  estado_solicitud: 'pendiente' | 'aprobado' | 'rechazado';
}

// Solicitud de Recurso
export interface SolicitudRecurso {
  id: string;
  id_usuario: string;
  id_recurso: string;
  fecha_solicitud: Timestamp;
  fecha_reserva?: string;
  fecha_devolucion?: string;
  motivo: string;
  cantidad: number;
  id_medida: string;
  estado_solicitud: 'pendiente' | 'aprobado' | 'rechazado';
}

// Para la vista del admin (unificada)
export interface SolicitudGestion {
  id: string;
  tipo: 'LABORATORIO' | 'RECURSO';
  tipoRecurso?: string;
  nombreUsuario: string;
  emailUsuario: string;
  tipoUsuario: string;
  nombreRecursoLab: string;
  fechaSolicitud: string;
  prioridad: 'Alta' | 'Media' | 'Baja';
  estado: string;
  detalles: {
    motivo: string;
    [key: string]: any;
  };
  datosOriginales: SolicitudLaboratorio | SolicitudRecurso;
}
