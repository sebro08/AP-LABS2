import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Notificacion, FiltrosNotificacion } from '../../types/Notificacion';
import { registrarEnBitacora } from '../../utils/bitacoraHelper';
import './UserNotificaciones.css';

const UserNotificaciones = () => {
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);
  const [filtros, setFiltros] = useState<FiltrosNotificacion>({
    // No aplicar filtros por defecto para mostrar todas las notificaciones
  });
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    cargarNotificaciones();
  }, [currentUser]);

  const cargarNotificaciones = async () => {
    if (!currentUser?.email) return;

    try {
      setLoading(true);

      // Buscar el ID del usuario en Firestore
      console.log('🔍 Buscando usuario con email:', currentUser.email);
      const usuariosRef = collection(db, 'usuarios');
      let qUsuario = query(usuariosRef, where('email', '==', currentUser.email));
      let usuarioSnapshot = await getDocs(qUsuario);
      
      if (usuarioSnapshot.empty) {
        console.log('❌ No encontrado con "email", probando con "correo"');
        qUsuario = query(usuariosRef, where('correo', '==', currentUser.email));
        usuarioSnapshot = await getDocs(qUsuario);
      }

      if (usuarioSnapshot.empty) {
        console.error('❌ Usuario no encontrado en ninguna de las dos búsquedas');
        return;
      }

      const usuarioId = usuarioSnapshot.docs[0].id;
      console.log('✅ Usuario encontrado con ID:', usuarioId);

      // Cargar notificaciones del usuario
      console.log('🔍 Buscando notificaciones para usuario ID:', usuarioId);
      const notificacionesRef = collection(db, 'notificaciones');
      const qNotificaciones = query(
        notificacionesRef,
        where('id_usuario', '==', usuarioId)
      );

      console.log('📡 Ejecutando consulta a Firestore...');
      const snapshot = await getDocs(qNotificaciones);
      console.log('📊 Documentos encontrados en consulta:', snapshot.size);
      
      const notificacionesData: Notificacion[] = snapshot.docs.map(doc => {
        const data = doc.data();
        console.log('📄 Documento encontrado:', { id: doc.id, ...data });
        return {
          id: doc.id,
          ...data
        } as Notificacion;
      })
      // Ordenar por fecha en el cliente (en lugar de en la consulta)
      .sort((a, b) => {
        try {
          let fechaA: number;
          let fechaB: number;
          
          // Convertir fecha_creacion de A
          if (typeof a.fecha_creacion === 'string') {
            fechaA = new Date(a.fecha_creacion).getTime();
          } else if (a.fecha_creacion?.toDate) {
            fechaA = a.fecha_creacion.toDate().getTime();
          } else if (a.fecha_creacion?.seconds) {
            fechaA = a.fecha_creacion.seconds * 1000;
          } else {
            fechaA = 0;
          }
          
          // Convertir fecha_creacion de B
          if (typeof b.fecha_creacion === 'string') {
            fechaB = new Date(b.fecha_creacion).getTime();
          } else if (b.fecha_creacion?.toDate) {
            fechaB = b.fecha_creacion.toDate().getTime();
          } else if (b.fecha_creacion?.seconds) {
            fechaB = b.fecha_creacion.seconds * 1000;
          } else {
            fechaB = 0;
          }
          
          return fechaB - fechaA; // Orden descendente (más recientes primero)
        } catch (error) {
          console.error('Error al ordenar notificaciones:', error);
          return 0;
        }
      });

      console.log('📢 Notificaciones cargadas desde "notificaciones":', notificacionesData.length);
      console.log('📋 Resumen de notificaciones:');
      notificacionesData.forEach((n, index) => {
        console.log(`  ${index + 1}. ID: ${n.id}, Título: "${n.titulo}", Leída: ${n.leida}, Usuario: ${n.id_usuario}`);
      });
      
      if (notificacionesData.length === 0) {
        console.warn('⚠️ No se encontraron notificaciones. Verifica:');
        console.warn('   - Que existe la colección "notificaciones"');
        console.warn('   - Que hay documentos con id_usuario =', usuarioId);
        console.warn('   - Los permisos de Firestore');
      }
      
      setNotificaciones(notificacionesData);

    } catch (error) {
      console.error('❌ Error cargando notificaciones:', error);
      setNotificaciones([]); // Lista vacía si hay error
    } finally {
      setLoading(false);
    }
  };



  const handleMarcarComoLeida = async (notificacionId: string) => {
    try {
      // Actualizar estado local inmediatamente para feedback visual instantáneo
      setNotificaciones(prev => 
        prev.map(notif => 
          notif.id === notificacionId ? { ...notif, leida: true } : notif
        )
      );



      // Actualizar en Firebase
      console.log('🔄 Actualizando en Firebase - Colección: notificaciones, ID:', notificacionId);
      await updateDoc(doc(db, 'notificaciones', notificacionId), {
        leida: true
      });
      console.log('✅ Actualización exitosa en Firebase');

      if (currentUser) {
        await registrarEnBitacora({
          usuario_nombre: currentUser.nombre,
          usuario_email: currentUser.email,
          usuario_rol: currentUser.rol,
          accion: 'Marcar Leída',
          accion_detalle: `Marcó notificación como leída - ID: ${notificacionId}`,
          modulo: 'Notificaciones'
        });
      }

      console.log('✅ Notificación marcada como leída en Firebase:', notificacionId);

    } catch (error) {
      console.error('❌ Error marcando notificación como leída:', error);
      
      // Revertir el cambio local si falla Firebase
      setNotificaciones(prev => 
        prev.map(notif => 
          notif.id === notificacionId ? { ...notif, leida: false } : notif
        )
      );
    }
  };

  const handleEliminarNotificacion = async (notificacionId: string) => {
    if (!confirm('¿Está seguro de eliminar esta notificación?')) return;

    try {


      await deleteDoc(doc(db, 'notificaciones', notificacionId));
      setNotificaciones(prev => prev.filter(notif => notif.id !== notificacionId));

      if (currentUser) {
        await registrarEnBitacora({
          usuario_nombre: currentUser.nombre,
          usuario_email: currentUser.email,
          usuario_rol: currentUser.rol,
          accion: 'Eliminar',
          accion_detalle: 'Eliminó una notificación',
          modulo: 'Notificaciones'
        });
      }

    } catch (error) {
      console.error('Error eliminando notificación:', error);
    }
  };

  const handleAccionNotificacion = async (notificacion: Notificacion) => {
    console.log('🔔 Click en notificación:', notificacion.titulo, 'Leída:', notificacion.leida);
    
    // Marcar como leída si no lo está
    if (!notificacion.leida) {
      console.log('📝 Marcando como leída...');
      await handleMarcarComoLeida(notificacion.id);
    }

    // Realizar acción según el tipo después de marcar como leída
    setTimeout(() => {
      // Verificar tipo de notificación por datos adicionales
      const tipoNotificacion = notificacion.datos_adicionales?.tipo_notificacion;
      
      if (tipoNotificacion === 'recordatorio_devolucion' || tipoNotificacion === 'devolucion_vencida') {
        console.log('📦 Navegando a mis reservas (devolución)');
        navigate('/user/reservas');
        return;
      }

      switch (notificacion.tipo) {
        case 'mensaje':
          console.log('📨 Navegando a mensajería');
          navigate('/user/mensajes');
          break;
        case 'solicitud_aprobada':
        case 'solicitud_rechazada':
          console.log('📋 Navegando a mis solicitudes');
          navigate('/user/mis-solicitudes');
          break;
        case 'mantenimiento_programado':
          // Podría ser recordatorio de devolución
          console.log('⏰ Notificación de recordatorio');
          break;
        case 'mantenimiento_completado':
          console.log('🔧 Navegando a mantenimientos');
          // Los usuarios no tienen acceso a mantenimientos, solo marcar como leída
          break;
        default:
          console.log('ℹ️ Notificación general - solo marcada como leída');
          break;
      }
    }, 200); // Pausa para que se vea el cambio visual
  };

  const getIconoTipo = (tipo: string) => {
    switch (tipo) {
      case 'mensaje': return '💬';
      case 'solicitud_aprobada': return '✅';
      case 'solicitud_rechazada': return '❌';
      case 'mantenimiento_programado': return '🔧';
      case 'mantenimiento_completado': return '✅';
      default: return '🔔';
    }
  };

  const getColorTipo = (tipo: string) => {
    switch (tipo) {
      case 'mensaje': return '#667eea';
      case 'solicitud_aprobada': return '#48bb78';
      case 'solicitud_rechazada': return '#e53e3e';
      case 'mantenimiento_programado': return '#d69e2e';
      case 'mantenimiento_completado': return '#38a169';
      default: return '#718096';
    }
  };

  const notificacionesFiltradas = notificaciones.filter(notif => {
    // Debug para ver qué está filtrando
    console.log(`🔍 Filtrando notificación "${notif.titulo}":`, {
      tipo: notif.tipo,
      leida: notif.leida,
      filtroTipo: filtros.tipo,
      filtroLeida: filtros.leida,
      searchTerm
    });

    if (filtros.tipo && notif.tipo !== filtros.tipo) {
      console.log(`❌ Filtrado por tipo: esperado "${filtros.tipo}", actual "${notif.tipo}"`);
      return false;
    }
    
    if (filtros.leida !== undefined && notif.leida !== filtros.leida) {
      console.log(`❌ Filtrado por estado leída: esperado ${filtros.leida}, actual ${notif.leida}`);
      return false;
    }
    
    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      const match = (
        notif.titulo.toLowerCase().includes(lowerSearch) ||
        notif.mensaje.toLowerCase().includes(lowerSearch)
      );
      if (!match) {
        console.log(`❌ Filtrado por búsqueda: "${searchTerm}" no encontrado`);
        return false;
      }
    }
    
    console.log(`✅ Notificación "${notif.titulo}" pasa todos los filtros`);
    return true;
  });

  const notificacionesNoLeidas = notificaciones.filter(n => !n.leida).length;
  const notificacionesLeidas = notificaciones.filter(n => n.leida).length;
  const notificacionesHoy = notificaciones.filter(n => {
    try {
      const hoy = new Date().toDateString();
      let fechaNotif;
      if (typeof n.fecha_creacion === 'string') {
        fechaNotif = new Date(n.fecha_creacion).toDateString();
      } else if (n.fecha_creacion?.toDate) {
        fechaNotif = n.fecha_creacion.toDate().toDateString();
      } else if (n.fecha_creacion?.seconds) {
        fechaNotif = new Date(n.fecha_creacion.seconds * 1000).toDateString();
      } else {
        return false;
      }
      return hoy === fechaNotif;
    } catch {
      return false;
    }
  }).length;

  // Debug de estadísticas
  console.log('📊 Estadísticas de notificaciones:', {
    total: notificaciones.length,
    noLeidas: notificacionesNoLeidas,
    leidas: notificacionesLeidas,
    hoy: notificacionesHoy,
    filtros: filtros,
    filtradas: notificacionesFiltradas.length
  });

  if (loading) {
    return (
      <div className="notificaciones-loading">
        <div className="loading-spinner"></div>
        <p>Cargando notificaciones...</p>
      </div>
    );
  }

  return (
    <div className="gestion-notificaciones">
      <div className="notificaciones-header">
        <h1>🔔 Notificaciones</h1>
        <p className="subtitle">Centro de notificaciones y alertas del sistema</p>
      </div>

      {/* Estadísticas */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">📢</div>
          <div className="stat-content">
            <div className="stat-label">Total</div>
            <div className="stat-value">{notificaciones.length}</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">🔴</div>
          <div className="stat-content">
            <div className="stat-label">No Leídas</div>
            <div className="stat-value">{notificacionesNoLeidas}</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">📅</div>
          <div className="stat-content">
            <div className="stat-label">Hoy</div>
            <div className="stat-value">{notificacionesHoy}</div>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="filtros-container">
        {/* Barra de búsqueda arriba */}
        <div className="search-row">
          <input
            type="text"
            placeholder="🔍 Buscar por usuario o recurso/laboratorio..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input-full"
          />
        </div>
        
        {/* Filtros abajo */}
        <div className="filters-row">
          <select
            value={filtros.tipo || ''}
            onChange={(e) => setFiltros({ ...filtros, tipo: e.target.value || undefined })}
            className="filter-select"
          >
            <option value="">Tipo: Todos</option>
            <option value="mensaje">💬 Mensajes</option>
            <option value="solicitud_aprobada">✅ Solicitudes Aprobadas</option>
            <option value="solicitud_rechazada">❌ Solicitudes Rechazadas</option>
            <option value="mantenimiento_programado">🔧 Mantenimientos Programados</option>
            <option value="mantenimiento_completado">✅ Mantenimientos Completados</option>
            <option value="general">🔔 Generales</option>
          </select>

          <select
            value={filtros.leida === undefined ? '' : filtros.leida ? 'true' : 'false'}
            onChange={(e) => {
              const value = e.target.value;
              setFiltros({ 
                ...filtros, 
                leida: value === '' ? undefined : value === 'true' 
              });
            }}
            className="filter-select"
          >
            <option value="">Estado: Todas</option>
            <option value="false">No leídas</option>
            <option value="true">Leídas</option>
          </select>
        </div>
      </div>

      {/* Lista de Notificaciones */}
      <div className="notificaciones-lista">
        {notificacionesFiltradas.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🔔</div>
            <h3>No hay notificaciones</h3>
            <p>No tienes notificaciones que coincidan con los filtros seleccionados.</p>
          </div>
        ) : (
          notificacionesFiltradas.map(notificacion => (
            <div 
              key={notificacion.id} 
              className={`notificacion-item ${!notificacion.leida ? 'no-leida' : ''}`}
            >
              <div 
                className="notificacion-icon"
                style={{ backgroundColor: getColorTipo(notificacion.tipo) }}
              >
                {getIconoTipo(notificacion.tipo)}
              </div>

              <div className="notificacion-content" onClick={() => handleAccionNotificacion(notificacion)}>
                <div className="notificacion-header">
                  <h3 className="notificacion-titulo">{notificacion.titulo}</h3>
                  <span className="notificacion-fecha">
                    {(() => {
                      try {
                        if (typeof notificacion.fecha_creacion === 'string') {
                          return new Date(notificacion.fecha_creacion).toLocaleString('es-ES');
                        } else if (notificacion.fecha_creacion?.toDate) {
                          return notificacion.fecha_creacion.toDate().toLocaleString('es-ES');
                        } else if (notificacion.fecha_creacion?.seconds) {
                          return new Date(notificacion.fecha_creacion.seconds * 1000).toLocaleString('es-ES');
                        }
                        return 'Fecha no disponible';
                      } catch {
                        return 'Fecha inválida';
                      }
                    })()}
                  </span>
                </div>
                <p className="notificacion-mensaje">{notificacion.mensaje}</p>
                
                {notificacion.datos_adicionales && (
                  <div className="notificacion-detalles">
                    {notificacion.datos_adicionales.remitente && (
                      <span className="detalle">De: {notificacion.datos_adicionales.remitente}</span>
                    )}
                    {notificacion.datos_adicionales.recurso && (
                      <span className="detalle">Recurso: {notificacion.datos_adicionales.recurso}</span>
                    )}
                    {notificacion.datos_adicionales.laboratorio && (
                      <span className="detalle">Lab: {notificacion.datos_adicionales.laboratorio}</span>
                    )}
                  </div>
                )}
              </div>

              <div className="notificacion-actions">
                {!notificacion.leida && (
                  <button
                    className="btn-marcar-leida"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleMarcarComoLeida(notificacion.id);
                    }}
                    title="Marcar como leída"
                  >
                    ✓
                  </button>
                )}
                
                <button
                  className="btn-eliminar"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEliminarNotificacion(notificacion.id);
                  }}
                  title="Eliminar notificación"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default UserNotificaciones;