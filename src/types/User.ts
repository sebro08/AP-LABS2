export interface User {
  id: string;
  nombre: string;
  correo: string;
  cedula: string;
  rol: string;
  activo: boolean;
}

export interface UserFirestore {
  email: string;
  primer_nombre: string;
  segundo_nombre?: string;
  primer_apellido: string;
  segundo_apellido?: string;
  id_rol: string;
  activo: boolean;
  cedula?: string;
}
