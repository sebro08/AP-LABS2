export interface ParametroGlobal {
  id: string;
  nombre: string;
  descripcion: string;
  valor: string | number | boolean;
  tipo: 'numero' | 'texto' | 'booleano';
  categoria: 'reservas' | 'estados' | 'notificaciones' | 'politicas';
  activo?: boolean;
}

export interface FiltrosParametros {
  categoria?: string;
  activo?: boolean;
}