export interface Departamento {
  id: string;
  nombre: string;
  codigo: string;
  descripcion?: string;
  jefe?: string; // ID del usuario jefe del departamento
  telefono?: string;
  email?: string;
  activo: boolean;
  fecha_creacion?: string;
}
