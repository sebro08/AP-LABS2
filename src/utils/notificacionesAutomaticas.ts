import { collection, query, where, getDocs, addDoc, Timestamp, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';

interface ReservaRecurso {
  id: string;
  id_usuario: string;
  id_recurso: string;
  fecha_devolucion: string;
  estado: number; // 1 = aprobado, 3 = rechazado
  notificacion_recordatorio_enviada?: boolean;
  notificacion_vencido_enviada?: boolean;
}

/**
 * Verifica y envía notificaciones de recordatorio de devolución de recursos
 * Debe ejecutarse diariamente
 */
export const verificarNotificacionesDevolucion = async (): Promise<void> => {
  try {
    console.log('🔔 Verificando notificaciones de devolución de recursos...');

    // Obtener todas las reservas de recursos aprobadas
    const reservasRef = collection(db, 'reserva_recurso');
    const qReservas = query(
      reservasRef,
      where('estado', '==', 1) // Solo aprobadas
    );

    const reservasSnapshot = await getDocs(qReservas);
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0); // Resetear hora para comparación de solo fecha

    let recordatoriosEnviados = 0;
    let vencidosEnviados = 0;

    for (const docSnap of reservasSnapshot.docs) {
      const reserva = { id: docSnap.id, ...docSnap.data() } as ReservaRecurso;

      if (!reserva.fecha_devolucion) continue;

      // Convertir fecha_devolucion a Date
      const fechaDevolucion = new Date(reserva.fecha_devolucion);
      fechaDevolucion.setHours(0, 0, 0, 0);

      // Calcular diferencia en días
      const diferenciaDias = Math.ceil((fechaDevolucion.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));

      // Obtener información del recurso
      let nombreRecurso = 'Recurso';
      try {
        const recursoDoc = await getDoc(doc(db, 'recurso', reserva.id_recurso));
        if (recursoDoc.exists()) {
          nombreRecurso = recursoDoc.data().nombre || 'Recurso';
        }
      } catch (error) {
        console.error('Error obteniendo recurso:', error);
      }

      // Caso 1: Un día antes de la devolución (recordatorio)
      if (diferenciaDias === 1 && !reserva.notificacion_recordatorio_enviada) {
        await crearNotificacion(
          reserva.id_usuario,
          'mantenimiento_programado', // Usar este tipo o crear uno nuevo
          '⏰ Recordatorio de Devolución',
          `Recuerda que mañana ${fechaDevolucion.toLocaleDateString('es-ES')} debes devolver el recurso "${nombreRecurso}". Por favor, asegúrate de entregarlo a tiempo.`,
          {
            id_reserva: reserva.id,
            recurso: nombreRecurso,
            fecha_devolucion: reserva.fecha_devolucion,
            tipo_notificacion: 'recordatorio_devolucion'
          }
        );

        // Marcar como enviada
        // await updateDoc(doc(db, 'reserva_recurso', reserva.id), {
        //   notificacion_recordatorio_enviada: true
        // });

        recordatoriosEnviados++;
        console.log(`✅ Recordatorio enviado para reserva ${reserva.id}`);
      }

      // Caso 2: Fecha de devolución ya pasó (vencido)
      if (diferenciaDias < 0 && !reserva.notificacion_vencido_enviada) {
        const diasVencidos = Math.abs(diferenciaDias);
        await crearNotificacion(
          reserva.id_usuario,
          'general', // Notificación de alerta
          '⚠️ Devolución Vencida',
          `El plazo para devolver el recurso "${nombreRecurso}" venció hace ${diasVencidos} día${diasVencidos > 1 ? 's' : ''}. Debes devolverlo lo antes posible para evitar una multa. La fecha límite era ${fechaDevolucion.toLocaleDateString('es-ES')}.`,
          {
            id_reserva: reserva.id,
            recurso: nombreRecurso,
            fecha_devolucion: reserva.fecha_devolucion,
            dias_vencidos: diasVencidos,
            tipo_notificacion: 'devolucion_vencida'
          }
        );

        // Marcar como enviada
        // await updateDoc(doc(db, 'reserva_recurso', reserva.id), {
        //   notificacion_vencido_enviada: true
        // });

        vencidosEnviados++;
        console.log(`⚠️ Notificación de vencimiento enviada para reserva ${reserva.id}`);
      }
    }

    console.log(`📊 Proceso completado: ${recordatoriosEnviados} recordatorios, ${vencidosEnviados} vencimientos`);

  } catch (error) {
    console.error('❌ Error verificando notificaciones de devolución:', error);
    throw error;
  }
};

/**
 * Crea una notificación en Firebase
 */
const crearNotificacion = async (
  idUsuario: string,
  tipo: string,
  titulo: string,
  mensaje: string,
  datosAdicionales?: any
): Promise<void> => {
  try {
    await addDoc(collection(db, 'notificaciones'), {
      id_usuario: idUsuario,
      tipo: tipo,
      titulo: titulo,
      mensaje: mensaje,
      fecha_creacion: Timestamp.now(),
      leida: false,
      datos_adicionales: datosAdicionales || {}
    });
    console.log('✅ Notificación creada');
  } catch (error) {
    console.error('❌ Error creando notificación:', error);
    throw error;
  }
};

/**
 * Función para inicializar el sistema de notificaciones automáticas
 * Se puede llamar al iniciar la aplicación
 */
export const inicializarNotificacionesAutomaticas = (): void => {
  // Verificar inmediatamente al iniciar
  verificarNotificacionesDevolucion().catch(error => {
    console.error('Error en verificación inicial:', error);
  });

  // Configurar verificación diaria (cada 24 horas)
  const INTERVALO_24_HORAS = 24 * 60 * 60 * 1000;
  setInterval(() => {
    verificarNotificacionesDevolucion().catch(error => {
      console.error('Error en verificación periódica:', error);
    });
  }, INTERVALO_24_HORAS);

  console.log('🔔 Sistema de notificaciones automáticas inicializado');
};
