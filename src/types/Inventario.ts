import { Timestamp } from 'firebase/firestore';

export interface Inventario {
  id: string;
  nombre: string;
  codigo_inventario: string;
  descripcion: string;
  cantidad: number;
  id_estado: string;
  id_medida: string;
  id_tipo_recurso: string;
  fecha_ultimo_mantenimiento: string;
  fecha_creacion: Timestamp;
}

export interface Estado {
  id: string;
  nombre: string;
}

export interface TipoRecurso {
  id: string;
  nombre: string;
}

export interface Medida {
  id: string;
  nombre: string;
}
