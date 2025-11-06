export interface Laboratorio {
  id: string;
  nombre: string;
  codigo: string;
  ubicacion: string;
  capacidad: number;
  descripcion?: string;
  estado: 'Disponible' | 'En Mantenimiento' | 'Fuera de Servicio';
  encargado?: string; // ID del usuario encargado
  fecha_creacion?: string;
  activo: boolean;
}
