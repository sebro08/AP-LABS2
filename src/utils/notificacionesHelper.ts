import { collection, doc, setDoc, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebase/config';
import { Notificacion } from '../types/Notificacion';

export const crearNotificacionesIniciales = async (usuarioId: string) => {
  try {
    console.log('🔔 Inicializando colección de notificaciones...');

    // Verificar si ya existen notificaciones para este usuario
    const notificacionesRef = collection(db, 'notificaciones');
    const q = query(notificacionesRef, where('id_usuario', '==', usuarioId));
    const snapshot = await getDocs(q);

    if (!snapshot.empty) {
      console.log('✅ Usuario ya tiene notificaciones');
      return;
    }

    const ahora = new Date().toISOString();
    const hace2Horas = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
    const ayer = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    // Crear notificaciones iniciales
    const notificacionesIniciales: Omit<Notificacion, 'id'>[] = [
      {
        tipo: 'general',
        titulo: '¡Bienvenido al sistema de notificaciones!',
        mensaje: 'El sistema de notificaciones ha sido activado correctamente. Aquí recibirás actualizaciones sobre tus solicitudes, mensajes y actividades del laboratorio.',
        fecha_creacion: ahora,
        leida: false,
        id_usuario: usuarioId,
        datos_adicionales: {}
      },
      {
        tipo: 'mensaje',
        titulo: 'Nuevo mensaje del sistema',
        mensaje: 'Tienes un nuevo mensaje en tu bandeja de entrada. Haz clic aquí para verlo.',
        fecha_creacion: hace2Horas,
        leida: false,
        id_usuario: usuarioId,
        datos_adicionales: {
          remitente: 'Sistema AP-LABS',
          id_mensaje: 'sistema-bienvenida'
        }
      },
      {
        tipo: 'solicitud_aprobada',
        titulo: 'Solicitud aprobada',
        mensaje: 'Tu solicitud de reserva de laboratorio ha sido aprobada exitosamente.',
        fecha_creacion: ayer,
        leida: true,
        id_usuario: usuarioId,
        datos_adicionales: {
          laboratorio: 'Laboratorio de Química',
          id_solicitud: 'ejemplo-sol-001'
        }
      }
    ];

    // Crear documentos en Firestore
    const promesas = notificacionesIniciales.map(async (notificacion) => {
      const docRef = doc(collection(db, 'notificaciones'));
      await setDoc(docRef, notificacion);
      return docRef.id;
    });

    const idsCreados = await Promise.all(promesas);
    
    console.log('✅ Notificaciones iniciales creadas:', idsCreados);
    return idsCreados;

  } catch (error) {
    console.error('❌ Error creando notificaciones iniciales:', error);
    throw error;
  }
};

export const crearNotificacion = async (notificacion: Omit<Notificacion, 'id' | 'fecha_creacion'>) => {
  try {
    const docRef = doc(collection(db, 'notificaciones'));
    await setDoc(docRef, {
      ...notificacion,
      fecha_creacion: new Date().toISOString()
    });
    
    console.log('✅ Notificación creada:', docRef.id);
    return docRef.id;

  } catch (error) {
    console.error('❌ Error creando notificación:', error);
    throw error;
  }
};

export const crearNotificacionMensaje = async (
  usuarioId: string, 
  remitente: string, 
  idMensaje: string
) => {
  return crearNotificacion({
    tipo: 'mensaje',
    titulo: 'Nuevo mensaje recibido',
    mensaje: `Tienes un nuevo mensaje de ${remitente}. Haz clic para verlo.`,
    leida: false,
    id_usuario: usuarioId,
    datos_adicionales: {
      remitente,
      id_mensaje: idMensaje
    }
  });
};

export const crearNotificacionSolicitud = async (
  usuarioId: string,
  aprobada: boolean,
  recursoOLaboratorio: string,
  idSolicitud: string
) => {
  const tipo = aprobada ? 'solicitud_aprobada' : 'solicitud_rechazada';
  const titulo = aprobada ? 'Solicitud aprobada' : 'Solicitud rechazada';
  const mensaje = aprobada 
    ? `Tu solicitud para ${recursoOLaboratorio} ha sido aprobada.`
    : `Tu solicitud para ${recursoOLaboratorio} ha sido rechazada.`;

  return crearNotificacion({
    tipo: tipo as 'solicitud_aprobada' | 'solicitud_rechazada',
    titulo,
    mensaje,
    leida: false,
    id_usuario: usuarioId,
    datos_adicionales: {
      id_solicitud: idSolicitud,
      recurso: recursoOLaboratorio
    }
  });
};

export const crearNotificacionMantenimiento = async (
  usuarioId: string,
  programado: boolean,
  recurso: string,
  idMantenimiento: string
) => {
  const tipo = programado ? 'mantenimiento_programado' : 'mantenimiento_completado';
  const titulo = programado ? 'Mantenimiento programado' : 'Mantenimiento completado';
  const mensaje = programado 
    ? `Se ha programado mantenimiento para ${recurso}.`
    : `El mantenimiento de ${recurso} ha sido completado.`;

  return crearNotificacion({
    tipo: tipo as 'mantenimiento_programado' | 'mantenimiento_completado',
    titulo,
    mensaje,
    leida: false,
    id_usuario: usuarioId,
    datos_adicionales: {
      id_mantenimiento: idMantenimiento,
      recurso
    }
  });
};