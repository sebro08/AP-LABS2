export interface Usuario {
  id: string;
  email: string;
  primer_nombre: string;
  segundo_nombre?: string;
  primer_apellido: string;
  segundo_apellido?: string;
  identificador?: string;
  telefono?: string;
  id_departamento?: string;
  id_rol: string;
  activo: boolean;
}

export interface Rol {
  id: string;
  nombre: string;
}

export interface Departamento {
  id: string;
  nombre: string;
}
