import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '../firebase/config';
import { LogActivityParams } from '../types/Bitacora';

export async function registrarEnBitacora(params: LogActivityParams): Promise<void> {
  try {
    const now = new Date();
    const fecha_formateada = now.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
    const hora_formateada = now.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });

    const bitacoraEntry = {
      usuario_nombre: params.usuario_nombre,
      usuario_email: params.usuario_email,
      usuario_rol: params.usuario_rol,
      accion: params.accion,
      accion_detalle: params.accion_detalle,
      modulo: params.modulo,
      timestamp: Timestamp.now(),
      fecha_formateada,
      hora_formateada,
      ...(params.recurso_nombre && { recurso_nombre: params.recurso_nombre }),
      ...(params.recurso_codigo && { recurso_codigo: params.recurso_codigo }),
      ...(params.recurso_id && { recurso_id: params.recurso_id }),
      ...(params.observaciones && { observaciones: params.observaciones })
    };

    await addDoc(collection(db, 'bitacora'), bitacoraEntry);
    console.log('✅ Entrada en bitácora registrada:', params.accion_detalle);
  } catch (error) {
    console.error('❌ Error registrando en bitácora:', error);
    // No lanzar error - los fallos de logging no deben romper el flujo principal
  }
}
