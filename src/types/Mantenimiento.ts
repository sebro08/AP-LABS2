export interface Mantenimiento {
  id: string;
  id_recurso: string;
  id_tipo_mantenimiento: string;
  fecha_programada: string;
  fecha_realizada: string;
  detalle: string;
  repuestos_usados: string;
  id_tecnico: string;
  id_estado: string;
}

export interface TipoMantenimiento {
  id: string;
  nombre: string;
}

export interface MantenimientoDetalle extends Mantenimiento {
  nombreRecurso: string;
  nombreTecnico: string;
  tipoMantenimiento: string;
  estadoNombre: string;
}
