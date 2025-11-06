import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, doc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useAuth } from '../../context/AuthContext';
import { registrarEnBitacora } from '../../utils/bitacoraHelper';
import './UserSolicitudes.css';

interface Solicitud {
  id: string;
  tipo: 'laboratorio' | 'recurso';
  nombre: string;
  fecha_solicitud: string;
  fecha_inicio?: string;
  fecha_fin?: string;
  hora_inicio?: string;
  hora_fin?: string;
  estado: string;
  justificacion?: string;
  cantidad?: number;
  motivo_rechazo?: string;
  devuelto?: boolean;
}

const UserSolicitudes = () => {
  const { user: currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([]);
  const [filtroTipo, setFiltroTipo] = useState<'todas' | 'laboratorio' | 'recurso'>('todas');
  const [filtroEstado, setFiltroEstado] = useState<'todos' | 'pendiente' | 'aprobada' | 'rechazada'>('todos');
  const [searchTerm, setSearchTerm] = useState('');
  const [solicitudSeleccionada, setSolicitudSeleccionada] = useState<Solicitud | null>(null);
  const [showDetalle, setShowDetalle] = useState(false);

  useEffect(() => {
    cargarSolicitudes();
  }, [currentUser]);

  const cargarSolicitudes = async () => {
    if (!currentUser) return;

    setLoading(true);
    try {
      // Buscar el ID del usuario en Firestore
      const usuariosRef = collection(db, 'usuarios');
      let qUsuario = query(usuariosRef, where('email', '==', currentUser.email));
      let usuarioSnapshot = await getDocs(qUsuario);
      
      if (usuarioSnapshot.empty) {
        qUsuario = query(usuariosRef, where('correo', '==', currentUser.email));
        usuarioSnapshot = await getDocs(qUsuario);
      }
      
      if (usuarioSnapshot.empty) {
        console.error('Usuario no encontrado');
        setLoading(false);
        return;
      }

      const usuarioId = usuarioSnapshot.docs[0].id;
      const solicitudesData: Solicitud[] = [];

      // Cargar solicitudes de laboratorios
      const labsQuery = query(
        collection(db, 'solicitudes_labs'),
        where('id_usuario', '==', usuarioId)
      );
      const labsSnapshot = await getDocs(labsQuery);

      for (const docSnap of labsSnapshot.docs) {
        const data = docSnap.data();
        
        // Obtener nombre del laboratorio
        let nombreLab = 'Laboratorio desconocido';
        if (data.id_lab) {
          const labDoc = await getDoc(doc(db, 'laboratorios', data.id_lab));
          if (labDoc.exists()) {
            nombreLab = labDoc.data().nombre || 'Laboratorio desconocido';
          }
        }

        // Convertir Timestamp a fecha
        let fechaSolicitud = new Date().toISOString();
        if (data.fecha_solicitud) {
          if (data.fecha_solicitud.toDate) {
            fechaSolicitud = data.fecha_solicitud.toDate().toISOString();
          } else if (data.fecha_solicitud.seconds) {
            fechaSolicitud = new Date(data.fecha_solicitud.seconds * 1000).toISOString();
          }
        }

        // Cargar motivo de rechazo si está rechazada y verificar si ya fue devuelto
        let motivoRechazo = undefined;
        let devuelto = false;
        const reservaQuery = query(
          collection(db, 'reserva_labs'),
          where('id_solicitud_lab', '==', docSnap.id)
        );
        const reservaSnapshot = await getDocs(reservaQuery);
        if (!reservaSnapshot.empty) {
          const reservaData = reservaSnapshot.docs[0].data();
          if (data.estado_solicitud === 'rechazado') {
            motivoRechazo = reservaData.comentario || 'No se especificó motivo';
          }
          // Verificar si ya fue devuelto (estado 2 = completado/devuelto)
          devuelto = reservaData.estado === 2;
        }

        solicitudesData.push({
          id: docSnap.id,
          tipo: 'laboratorio',
          nombre: nombreLab,
          fecha_solicitud: fechaSolicitud,
          fecha_inicio: data.dia || data.fecha_inicio,
          fecha_fin: data.fecha_fin,
          hora_inicio: data.hora_inicio,
          hora_fin: data.hora_fin,
          estado: data.estado_solicitud || 'pendiente',
          justificacion: data.justificacion,
          motivo_rechazo: motivoRechazo,
          devuelto: devuelto
        });
      }

      // Cargar solicitudes de recursos
      const recursosQuery = query(
        collection(db, 'solicitudes_recursos'),
        where('id_usuario', '==', usuarioId)
      );
      const recursosSnapshot = await getDocs(recursosQuery);

      for (const docSnap of recursosSnapshot.docs) {
        const data = docSnap.data();
        
        // Obtener nombre del recurso
        let nombreRecurso = 'Recurso desconocido';
        if (data.id_recurso) {
          const recursoDoc = await getDoc(doc(db, 'recurso', data.id_recurso));
          if (recursoDoc.exists()) {
            nombreRecurso = recursoDoc.data().nombre || 'Recurso desconocido';
          }
        }

        // Convertir Timestamp a fecha
        let fechaSolicitud = new Date().toISOString();
        if (data.fecha_solicitud) {
          if (data.fecha_solicitud.toDate) {
            fechaSolicitud = data.fecha_solicitud.toDate().toISOString();
          } else if (data.fecha_solicitud.seconds) {
            fechaSolicitud = new Date(data.fecha_solicitud.seconds * 1000).toISOString();
          }
        }

        // Cargar motivo de rechazo si está rechazada y verificar si ya fue devuelto
        let motivoRechazo = undefined;
        let devuelto = false;
        const reservaQuery = query(
          collection(db, 'reserva_recurso'),
          where('id_solicitud_recurso', '==', docSnap.id)
        );
        const reservaSnapshot = await getDocs(reservaQuery);
        if (!reservaSnapshot.empty) {
          const reservaData = reservaSnapshot.docs[0].data();
          if (data.estado_solicitud === 'rechazado') {
            motivoRechazo = reservaData.comentario || 'No se especificó motivo';
          }
          // Verificar si ya fue devuelto (estado 2 = completado/devuelto)
          devuelto = reservaData.estado === 2;
        }

        solicitudesData.push({
          id: docSnap.id,
          tipo: 'recurso',
          nombre: nombreRecurso,
          fecha_solicitud: fechaSolicitud,
          fecha_inicio: data.fecha_inicio,
          fecha_fin: data.fecha_fin,
          estado: data.estado_solicitud || 'pendiente',
          justificacion: data.justificacion,
          cantidad: data.cantidad,
          motivo_rechazo: motivoRechazo,
          devuelto: devuelto
        });
      }

      // Ordenar por fecha de solicitud (más recientes primero)
      solicitudesData.sort((a, b) => {
        const dateA = new Date(a.fecha_solicitud).getTime();
        const dateB = new Date(b.fecha_solicitud).getTime();
        return dateB - dateA;
      });

      setSolicitudes(solicitudesData);
    } catch (error) {
      console.error('Error cargando solicitudes:', error);
    } finally {
      setLoading(false);
    }
  };

  const solicitudesFiltradas = solicitudes.filter(s => {
    // Filtro por tipo
    if (filtroTipo !== 'todas' && s.tipo !== filtroTipo) return false;
    
    // Filtro por estado - comparar directamente con los estados de Firebase
    if (filtroEstado !== 'todos') {
      // Convertir el filtro a la terminación correcta (aprobada -> aprobado, rechazada -> rechazado)
      let estadoBuscado: string = filtroEstado;
      if (filtroEstado === 'aprobada') estadoBuscado = 'aprobado';
      if (filtroEstado === 'rechazada') estadoBuscado = 'rechazado';
      
      if (s.estado.toLowerCase() !== estadoBuscado.toLowerCase()) return false;
    }
    
    // Búsqueda
    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      return s.nombre.toLowerCase().includes(lowerSearch);
    }
    
    return true;
  });

  const getEstadoBadge = (estado: string) => {
    const estadoLower = estado.toLowerCase();
    switch (estadoLower) {
      case 'pendiente':
        return <span className="badge badge-warning">⏳ Pendiente</span>;
      case 'aprobado':
      case 'aprobada':
        return <span className="badge badge-success">✅ Aprobada</span>;
      case 'rechazado':
      case 'rechazada':
        return <span className="badge badge-danger">❌ Rechazada</span>;
      default:
        return <span className="badge badge-secondary">{estado}</span>;
    }
  };

  const getTipoBadge = (tipo: 'laboratorio' | 'recurso') => {
    return tipo === 'laboratorio' 
      ? <span className="badge badge-lab">🔬 Laboratorio</span>
      : <span className="badge badge-resource">📦 Recurso</span>;
  };

  const handleVerDetalle = (solicitud: Solicitud) => {
    setSolicitudSeleccionada(solicitud);
    setShowDetalle(true);
  };

  const handleCancelarSolicitud = async (solicitud: Solicitud) => {
    if (!window.confirm(`¿Estás seguro de cancelar y eliminar la solicitud de ${solicitud.tipo === 'laboratorio' ? 'laboratorio' : 'recurso'} "${solicitud.nombre}"?`)) {
      return;
    }

    try {
      setLoading(true);

      // Registrar en bitácora antes de eliminar
      if (currentUser) {
        await registrarEnBitacora({
          usuario_nombre: currentUser.email || 'Usuario',
          usuario_email: currentUser.email || '',
          accion: 'Cancelación',
          accion_detalle: `Canceló y eliminó la solicitud de ${solicitud.tipo === 'laboratorio' ? 'laboratorio' : 'recurso'}: ${solicitud.nombre}`,
          modulo: 'Mis Solicitudes'
        });
      }

      if (solicitud.tipo === 'laboratorio') {
        // Eliminar la solicitud de la base de datos
        await deleteDoc(doc(db, 'solicitudes_labs', solicitud.id));
      } else {
        // Eliminar la solicitud de la base de datos
        await deleteDoc(doc(db, 'solicitudes_recursos', solicitud.id));
      }

      alert('✅ Solicitud cancelada y eliminada exitosamente');
      setShowDetalle(false);
      cargarSolicitudes(); // Recargar solicitudes
    } catch (error: any) {
      console.error('Error al cancelar solicitud:', error);
      alert('❌ Error al cancelar la solicitud: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDevolucion = async (solicitud: Solicitud) => {
    if (!window.confirm(`¿Confirmar devolución de ${solicitud.tipo === 'laboratorio' ? 'laboratorio' : 'recurso'} "${solicitud.nombre}"?`)) {
      return;
    }

    try {
      setLoading(true);

      if (solicitud.tipo === 'laboratorio') {
        // Buscar la reserva del laboratorio
        const reservaQuery = query(
          collection(db, 'reserva_labs'),
          where('id_solicitud_lab', '==', solicitud.id)
        );
        const reservaSnapshot = await getDocs(reservaQuery);

        if (!reservaSnapshot.empty) {
          const reservaDoc = reservaSnapshot.docs[0];
          const reservaData = reservaDoc.data();

          // Actualizar estado de la reserva a "completado" o "devuelto"
          await updateDoc(doc(db, 'reserva_labs', reservaDoc.id), {
            estado: 2, // 2 = devuelto/completado
            fecha_devolucion_real: new Date().toISOString()
          });

          // Actualizar estado del laboratorio a Disponible
          if (reservaData.id_lab) {
            await updateDoc(doc(db, 'laboratorios', reservaData.id_lab), {
              estado: 'Disponible'
            });
          }

          // Registrar en bitácora
          if (currentUser) {
            await registrarEnBitacora({
              usuario_nombre: currentUser.email || 'Usuario',
              usuario_email: currentUser.email || '',
              accion: 'Devolución',
              accion_detalle: `Devolvió el laboratorio: ${solicitud.nombre}`,
              modulo: 'Mis Solicitudes'
            });
          }
        }
      } else {
        // Buscar la reserva del recurso
        const reservaQuery = query(
          collection(db, 'reserva_recurso'),
          where('id_solicitud_recurso', '==', solicitud.id)
        );
        const reservaSnapshot = await getDocs(reservaQuery);

        if (!reservaSnapshot.empty) {
          const reservaDoc = reservaSnapshot.docs[0];
          const reservaData = reservaDoc.data();

          // Actualizar estado de la reserva a "completado" o "devuelto"
          await updateDoc(doc(db, 'reserva_recurso', reservaDoc.id), {
            estado: 2, // 2 = devuelto/completado
            fecha_devolucion_real: new Date().toISOString()
          });

          // Obtener el id_estado de "Disponible"
          const estadosSnapshot = await getDocs(collection(db, 'estado'));
          let idEstadoDisponible = '';
          estadosSnapshot.docs.forEach(doc => {
            if (doc.data().nombre?.toLowerCase() === 'disponible') {
              idEstadoDisponible = doc.id;
            }
          });

          // Actualizar estado del recurso a Disponible
          if (reservaData.id_recurso && idEstadoDisponible) {
            await updateDoc(doc(db, 'recurso', reservaData.id_recurso), {
              id_estado: idEstadoDisponible
            });
          }

          // Registrar en bitácora
          if (currentUser) {
            await registrarEnBitacora({
              usuario_nombre: currentUser.email || 'Usuario',
              usuario_email: currentUser.email || '',
              accion: 'Devolución',
              accion_detalle: `Devolvió el recurso: ${solicitud.nombre}`,
              modulo: 'Mis Solicitudes'
            });
          }
        }
      }

      alert('✅ Devolución registrada exitosamente');
      setShowDetalle(false);
      cargarSolicitudes(); // Recargar solicitudes
    } catch (error: any) {
      console.error('Error en devolución:', error);
      alert('❌ Error al registrar la devolución: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="user-solicitudes">
      <div className="page-header">
        <h1>📋 Mis Solicitudes</h1>
        <p>Consulta el estado de tus solicitudes de laboratorios y recursos</p>
      </div>

      {!showDetalle ? (
        <>
          {/* Filtros */}
          <div className="filtros-container">
            <div className="search-box">
              <input
                type="text"
                placeholder="🔍 Buscar por nombre..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="filtros-group">
              <div className="filtro-item">
                <label>Tipo:</label>
                <select
                  value={filtroTipo}
                  onChange={(e) => setFiltroTipo(e.target.value as any)}
                >
                  <option value="todas">Todas</option>
                  <option value="laboratorio">Laboratorios</option>
                  <option value="recurso">Recursos</option>
                </select>
              </div>

              <div className="filtro-item">
                <label>Estado:</label>
                <select
                  value={filtroEstado}
                  onChange={(e) => setFiltroEstado(e.target.value as any)}
                >
                  <option value="todos">Todos</option>
                  <option value="pendiente">Pendientes</option>
                  <option value="aprobada">Aprobadas</option>
                  <option value="rechazada">Rechazadas</option>
                </select>
              </div>
            </div>
          </div>

          {/* Estadísticas rápidas */}
          <div className="stats-cards">
            <div className="stat-card">
              <div className="stat-icon">⏳</div>
              <div className="stat-info">
                <div className="stat-number">{solicitudes.filter(s => s.estado.toLowerCase() === 'pendiente').length}</div>
                <div className="stat-label">Pendientes</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">✅</div>
              <div className="stat-info">
                <div className="stat-number">{solicitudes.filter(s => s.estado.toLowerCase() === 'aprobado' || s.estado.toLowerCase() === 'aprobada').length}</div>
                <div className="stat-label">Aprobadas</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">❌</div>
              <div className="stat-info">
                <div className="stat-number">{solicitudes.filter(s => s.estado.toLowerCase() === 'rechazado' || s.estado.toLowerCase() === 'rechazada').length}</div>
                <div className="stat-label">Rechazadas</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">📋</div>
              <div className="stat-info">
                <div className="stat-number">{solicitudes.length}</div>
                <div className="stat-label">Total</div>
              </div>
            </div>
          </div>

          {/* Lista de solicitudes */}
          <div className="solicitudes-list">
            {loading ? (
              <div className="loading-container">
                <div className="spinner"></div>
                <p>Cargando solicitudes...</p>
              </div>
            ) : solicitudesFiltradas.length === 0 ? (
              <div className="empty-state">
                <p>📭 No hay solicitudes que mostrar</p>
              </div>
            ) : (
              solicitudesFiltradas.map((solicitud) => (
                <div key={solicitud.id} className="solicitud-card">
                  <div className="solicitud-header">
                    <div className="solicitud-title">
                      <h3>{solicitud.nombre}</h3>
                      <div className="badges">
                        {getTipoBadge(solicitud.tipo)}
                        {getEstadoBadge(solicitud.estado)}
                      </div>
                    </div>
                    <button
                      className="btn-ver-detalle"
                      onClick={() => handleVerDetalle(solicitud)}
                    >
                      Ver Detalle →
                    </button>
                  </div>

                  <div className="solicitud-info">
                    <div className="info-row">
                      <span className="label">Fecha de solicitud:</span>
                      <span className="value">
                        {(() => {
                          if (!solicitud.fecha_solicitud) return 'No especificada';
                          try {
                            const fecha = new Date(solicitud.fecha_solicitud);
                            return isNaN(fecha.getTime()) ? 'Fecha inválida' : fecha.toLocaleDateString('es-ES');
                          } catch {
                            return 'Fecha inválida';
                          }
                        })()}
                      </span>
                    </div>
                    {solicitud.fecha_inicio && (
                      <div className="info-row">
                        <span className="label">
                          {solicitud.tipo === 'laboratorio' ? 'Período:' : 'Desde:'}
                        </span>
                        <span className="value">
                          {(() => {
                            try {
                              const fechaInicio = new Date(solicitud.fecha_inicio);
                              let resultado = isNaN(fechaInicio.getTime()) ? 'Fecha inválida' : fechaInicio.toLocaleDateString('es-ES');
                              if (solicitud.fecha_fin) {
                                const fechaFin = new Date(solicitud.fecha_fin);
                                if (!isNaN(fechaFin.getTime())) {
                                  resultado += ` - ${fechaFin.toLocaleDateString('es-ES')}`;
                                }
                              }
                              return resultado;
                            } catch {
                              return 'Fecha inválida';
                            }
                          })()}
                        </span>
                      </div>
                    )}
                    {solicitud.hora_inicio && (
                      <div className="info-row">
                        <span className="label">Horario:</span>
                        <span className="value">
                          {solicitud.hora_inicio} - {solicitud.hora_fin}
                        </span>
                      </div>
                    )}
                    {solicitud.cantidad && (
                      <div className="info-row">
                        <span className="label">Cantidad:</span>
                        <span className="value">{solicitud.cantidad}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      ) : (
        /* Detalle de solicitud */
        <div className="solicitud-detalle">
          <button className="btn-back" onClick={() => setShowDetalle(false)}>
            ← Volver a la lista
          </button>

          {solicitudSeleccionada && (
            <>
              <div className="detalle-header">
                <h2>{solicitudSeleccionada.nombre}</h2>
                <div className="badges">
                  {getTipoBadge(solicitudSeleccionada.tipo)}
                  {getEstadoBadge(solicitudSeleccionada.estado)}
                </div>
              </div>

              <div className="detalle-content">
                <div className="detalle-section">
                  <h3>Información General</h3>
                  <div className="info-grid">
                    <div className="info-item">
                      <label>Tipo de Solicitud</label>
                      <p>{solicitudSeleccionada.tipo === 'laboratorio' ? 'Laboratorio' : 'Recurso'}</p>
                    </div>
                    <div className="info-item">
                      <label>Estado</label>
                      <p>{solicitudSeleccionada.estado}</p>
                    </div>
                    <div className="info-item">
                      <label>Fecha de Solicitud</label>
                      <p>{(() => {
                        if (!solicitudSeleccionada.fecha_solicitud) return 'No especificada';
                        try {
                          const fecha = new Date(solicitudSeleccionada.fecha_solicitud);
                          return isNaN(fecha.getTime()) ? 'Fecha inválida' : fecha.toLocaleString('es-ES');
                        } catch {
                          return 'Fecha inválida';
                        }
                      })()}</p>
                    </div>
                    {solicitudSeleccionada.cantidad && (
                      <div className="info-item">
                        <label>Cantidad Solicitada</label>
                        <p>{solicitudSeleccionada.cantidad}</p>
                      </div>
                    )}
                  </div>
                </div>

                {solicitudSeleccionada.fecha_inicio && (
                  <div className="detalle-section">
                    <h3>Período Solicitado</h3>
                    <div className="info-grid">
                      <div className="info-item">
                        <label>Fecha de Inicio</label>
                        <p>{(() => {
                          try {
                            const fecha = new Date(solicitudSeleccionada.fecha_inicio);
                            return isNaN(fecha.getTime()) ? 'Fecha inválida' : fecha.toLocaleDateString('es-ES');
                          } catch {
                            return 'Fecha inválida';
                          }
                        })()}</p>
                      </div>
                      {solicitudSeleccionada.fecha_fin && (
                        <div className="info-item">
                          <label>Fecha de Fin</label>
                          <p>{(() => {
                            try {
                              const fecha = new Date(solicitudSeleccionada.fecha_fin);
                              return isNaN(fecha.getTime()) ? 'Fecha inválida' : fecha.toLocaleDateString('es-ES');
                            } catch {
                              return 'Fecha inválida';
                            }
                          })()}</p>
                        </div>
                      )}
                      {solicitudSeleccionada.hora_inicio && (
                        <>
                          <div className="info-item">
                            <label>Hora de Inicio</label>
                            <p>{solicitudSeleccionada.hora_inicio}</p>
                          </div>
                          <div className="info-item">
                            <label>Hora de Fin</label>
                            <p>{solicitudSeleccionada.hora_fin}</p>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                )}

                {solicitudSeleccionada.justificacion && (
                  <div className="detalle-section">
                    <h3>Justificación</h3>
                    <p className="justificacion">{solicitudSeleccionada.justificacion}</p>
                  </div>
                )}

                {solicitudSeleccionada.motivo_rechazo && (solicitudSeleccionada.estado.toLowerCase() === 'rechazado' || solicitudSeleccionada.estado.toLowerCase() === 'rechazada') && (
                  <div className="detalle-section motivo-rechazo">
                    <h3>❌ Motivo del Rechazo</h3>
                    <p className="justificacion motivo-rechazo-text">{solicitudSeleccionada.motivo_rechazo}</p>
                  </div>
                )}

                {/* Botón de cancelar solo para solicitudes pendientes */}
                {solicitudSeleccionada.estado.toLowerCase() === 'pendiente' && (
                  <div className="detalle-section">
                    <button 
                      className="btn-cancelar"
                      onClick={() => handleCancelarSolicitud(solicitudSeleccionada)}
                      disabled={loading}
                    >
                      {loading ? '⏳ Procesando...' : '🚫 Cancelar Solicitud'}
                    </button>
                    <p className="cancelar-info">
                      Al cancelar la solicitud, esta será eliminada y no podrá ser procesada.
                    </p>
                  </div>
                )}

                {/* Botón de devolución solo para solicitudes aprobadas y no devueltas */}
                {(solicitudSeleccionada.estado.toLowerCase() === 'aprobado' || solicitudSeleccionada.estado.toLowerCase() === 'aprobada') && (
                  <div className="detalle-section">
                    {solicitudSeleccionada.devuelto ? (
                      <div className="devolucion-completada">
                        <p className="devolucion-ya-hecha">✅ Este {solicitudSeleccionada.tipo === 'laboratorio' ? 'laboratorio' : 'recurso'} ya fue devuelto</p>
                      </div>
                    ) : (
                      <>
                        <button 
                          className="btn-devolucion"
                          onClick={() => handleDevolucion(solicitudSeleccionada)}
                          disabled={loading}
                        >
                          {loading ? '⏳ Procesando...' : '📦 Hacer Devolución'}
                        </button>
                        <p className="devolucion-info">
                          Al hacer la devolución, el {solicitudSeleccionada.tipo === 'laboratorio' ? 'laboratorio' : 'recurso'} quedará nuevamente disponible para otros usuarios.
                        </p>
                      </>
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default UserSolicitudes;
