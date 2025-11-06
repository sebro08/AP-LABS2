export interface FiltrosReporte {
  fechaInicio: string;
  fechaFin: string;
  tipoReporte: 'usuarios' | 'laboratorios' | 'inventario' | 'solicitudes' | 'mantenimientos' | 'bitacora' | 'mensajes' | 'completo';
  formato: 'pdf' | 'excel' | 'ambos';
  idDepartamento?: string;
  idLaboratorio?: string;
  idEstado?: string;
}

export interface EstadisticasGenerales {
  totalUsuarios: number;
  usuariosActivos: number;
  totalLaboratorios: number;
  laboratoriosActivos: number;
  totalRecursos: number;
  recursosDisponibles: number;
  recursosEnMantenimiento: number;
  solicitudesPendientes: number;
  solicitudesAprobadas: number;
  solicitudesRechazadas: number;
  mantenimientosProgramados: number;
  mantenimientosCompletados: number;
  mensajesEnviados: number;
  actividadesBitacora: number;
}

export interface DatosReporte {
  usuarios?: any[];
  laboratorios?: any[];
  recursos?: any[];
  solicitudes?: any[];
  mantenimientos?: any[];
  mensajes?: any[];
  bitacora?: any[];
  estadisticas?: EstadisticasGenerales;
}
