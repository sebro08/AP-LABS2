import { useState, useEffect } from 'react';
import { collection, getDocs, doc, updateDoc, addDoc, Timestamp, getDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { SolicitudGestion, SolicitudLaboratorio, SolicitudRecurso } from '../../types/Solicitud';
import { FiFileText, FiCheckCircle, FiXCircle, FiSearch, FiClock, FiEye, FiPackage, FiAlertCircle, FiUser, FiCalendar, FiX } from 'react-icons/fi';
import './GestionSolicitudes.css';

const GestionSolicitudes = () => {
  const [solicitudes, setSolicitudes] = useState<SolicitudGestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTipo, setFilterTipo] = useState('todos');
  const [filterEstado, setFilterEstado] = useState('pendiente');
  const [filterPrioridad, setFilterPrioridad] = useState('todos');

  useEffect(() => {
    cargarSolicitudes();
  }, []);

  const crearNotificacion = async (
    idUsuario: string,
    tipo: 'solicitud_aprobada' | 'solicitud_rechazada',
    titulo: string,
    mensaje: string,
    datosAdicionales?: any
  ) => {
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
      console.log('Notificación creada');
    } catch (error) {
      console.error('Error creando notificación:', error);
    }
  };

  const cargarSolicitudes = async () => {
    setLoading(true);
    try {
      console.log('Cargando solicitudes...');

      const solicitudesUnificadas: SolicitudGestion[] = [];

      // Cargar solicitudes de laboratorios
      const labsSnapshot = await getDocs(collection(db, 'solicitudes_labs'));
      console.log(`${labsSnapshot.docs.length} solicitudes de labs encontradas`);
      
      for (const docSnap of labsSnapshot.docs) {
        const data = docSnap.data();
        console.log('Datos de solicitud lab:', docSnap.id, data);
        
        // Validar que existan los IDs necesarios
        if (!data.id_usuario || !data.id_lab) {
          console.warn('Solicitud lab sin ID usuario o lab:', docSnap.id, data);
          continue;
        }
        
        const solicitudData = data as SolicitudLaboratorio;

        try {
          // Obtener datos del usuario
          const usuarioDoc = await getDoc(doc(db, 'usuarios', data.id_usuario));
          const usuarioData = usuarioDoc.exists() ? usuarioDoc.data() : null;

          // Obtener datos del laboratorio
          const labDoc = await getDoc(doc(db, 'laboratorios', data.id_lab));
          const labData = labDoc.exists() ? labDoc.data() : null;

          // Obtener rol
          const rolDoc = usuarioData?.id_rol ? await getDoc(doc(db, 'rol', usuarioData.id_rol)) : null;
          const rolNombre = rolDoc?.exists() ? rolDoc.data().nombre : 'Usuario';

          // Calcular prioridad
          const fechaReserva = new Date(solicitudData.dia.split('/').reverse().join('-'));
          const hoy = new Date();
          const diasDiferencia = Math.ceil((fechaReserva.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
          let prioridad: 'Alta' | 'Media' | 'Baja' = 'Baja';
          if (diasDiferencia <= 1) prioridad = 'Alta';
          else if (diasDiferencia <= 3) prioridad = 'Media';

          const horarios = solicitudData.horarios?.map((h: any) => `${h.hora_inicio}-${h.hora_fin}`).join(', ') || 'N/A';

          // Convertir fecha_solicitud a string
          let fechaSolicitudStr = '';
          if (solicitudData.fecha_solicitud) {
            if (typeof solicitudData.fecha_solicitud === 'string') {
              fechaSolicitudStr = solicitudData.fecha_solicitud;
            } else if (solicitudData.fecha_solicitud.toDate) {
              fechaSolicitudStr = solicitudData.fecha_solicitud.toDate().toLocaleDateString();
            }
          }

          solicitudesUnificadas.push({
            id: docSnap.id,
            tipo: 'LABORATORIO',
            nombreUsuario: usuarioData 
              ? `${usuarioData.primer_nombre} ${usuarioData.primer_apellido}` 
              : 'Usuario desconocido',
            emailUsuario: usuarioData?.email || '',
            tipoUsuario: rolNombre,
            nombreRecursoLab: labData?.nombre || 'Lab desconocido',
            fechaSolicitud: fechaSolicitudStr,
            prioridad,
            estado: solicitudData.estado_solicitud,
            detalles: {
              dia: solicitudData.dia,
              horarios,
              participantes: solicitudData.participantes?.toString() || '0',
              motivo: solicitudData.motivo,
              recursos: solicitudData.recursos?.length ? `${solicitudData.recursos.length} recursos` : 'Ninguno'
            },
            datosOriginales: { ...solicitudData, id: docSnap.id } as SolicitudLaboratorio
          });
        } catch (err) {
          console.error('Error procesando solicitud lab:', docSnap.id, err);
        }
      }

      // Cargar solicitudes de recursos
      const recursosSnapshot = await getDocs(collection(db, 'solicitudes_recursos'));
      console.log(`${recursosSnapshot.docs.length} solicitudes de recursos encontradas`);
      
      for (const docSnap of recursosSnapshot.docs) {
        const data = docSnap.data();
        console.log('Datos de solicitud recurso:', docSnap.id, data);
        
        // Validar que existan los IDs necesarios
        if (!data.id_usuario || !data.id_recurso) {
          console.warn('Solicitud recurso sin ID usuario o recurso:', docSnap.id, data);
          continue;
        }
        
        const solicitudData = data as SolicitudRecurso;

        try {
          const usuarioDoc = await getDoc(doc(db, 'usuarios', data.id_usuario));
          const usuarioData = usuarioDoc.exists() ? usuarioDoc.data() : null;

          const recursoDoc = await getDoc(doc(db, 'recurso', data.id_recurso));
          const recursoData = recursoDoc.exists() ? recursoDoc.data() : null;

          const tipoRecursoDoc = recursoData?.id_tipo_recurso 
            ? await getDoc(doc(db, 'tipo_recurso', recursoData.id_tipo_recurso)) 
            : null;
          const tipoRecursoNombre = tipoRecursoDoc?.exists() ? tipoRecursoDoc.data().nombre : '';

          const medidaDoc = solicitudData.id_medida ? await getDoc(doc(db, 'medida', solicitudData.id_medida)) : null;
          const medidaNombre = medidaDoc?.exists() ? medidaDoc.data().nombre : '';

          const rolDoc = usuarioData?.id_rol ? await getDoc(doc(db, 'rol', usuarioData.id_rol)) : null;
          const rolNombre = rolDoc?.exists() ? rolDoc.data().nombre : 'Usuario';

          // Recursos siempre tienen prioridad media por defecto
          const prioridad: 'Alta' | 'Media' | 'Baja' = 'Media';

          // Convertir fecha_solicitud a string
          let fechaSolicitudStr = '';
          if (solicitudData.fecha_solicitud) {
            if (typeof solicitudData.fecha_solicitud === 'string') {
              fechaSolicitudStr = solicitudData.fecha_solicitud;
            } else if (solicitudData.fecha_solicitud.toDate) {
              fechaSolicitudStr = solicitudData.fecha_solicitud.toDate().toLocaleDateString();
            }
          }

          solicitudesUnificadas.push({
            id: docSnap.id,
            tipo: 'RECURSO',
            tipoRecurso: tipoRecursoNombre,
            nombreUsuario: usuarioData 
              ? `${usuarioData.primer_nombre} ${usuarioData.primer_apellido}` 
              : 'Usuario desconocido',
            emailUsuario: usuarioData?.email || '',
            tipoUsuario: rolNombre,
            nombreRecursoLab: recursoData?.nombre || 'Recurso desconocido',
            fechaSolicitud: fechaSolicitudStr,
            prioridad,
            estado: solicitudData.estado_solicitud,
            detalles: {
              cantidad: `${solicitudData.cantidad} ${medidaNombre}`,
              fecha_reserva: solicitudData.fecha_reserva || 'No especificada',
              fecha_devolucion: solicitudData.fecha_devolucion || 'No especificada',
              motivo: solicitudData.motivo
            },
            datosOriginales: { ...solicitudData, id: docSnap.id } as SolicitudRecurso
          });
        } catch (err) {
          console.error('Error procesando solicitud recurso:', docSnap.id, err);
        }
      }

      // Ordenar por fecha (más recientes primero)
      solicitudesUnificadas.sort((a, b) => {
        const fechaA = new Date(a.fechaSolicitud.split('/').reverse().join('-'));
        const fechaB = new Date(b.fechaSolicitud.split('/').reverse().join('-'));
        return fechaB.getTime() - fechaA.getTime();
      });

      setSolicitudes(solicitudesUnificadas);
      console.log(`${solicitudesUnificadas.length} solicitudes cargadas`);
      setLoading(false);
    } catch (error: any) {
      console.error('Error cargando solicitudes:', error);
      alert('Error al cargar las solicitudes: ' + error.message);
      setLoading(false);
    }
  };

  const aprobarSolicitud = async (solicitud: SolicitudGestion) => {
    if (!window.confirm(`¿Aprobar la solicitud de ${solicitud.nombreUsuario}?`)) {
      return;
    }

    try {
      console.log('Aprobando solicitud...');

      if (solicitud.tipo === 'LABORATORIO') {
        const datosLab = solicitud.datosOriginales as SolicitudLaboratorio;
        
        // Crear reserva de laboratorio
        await addDoc(collection(db, 'reserva_labs'), {
          id_solicitud_lab: solicitud.id,
          id_usuario: datosLab.id_usuario,
          id_lab: datosLab.id_lab,
          dia: datosLab.dia,
          horarios: datosLab.horarios,
          participantes: datosLab.participantes,
          recursos: datosLab.recursos,
          motivo: datosLab.motivo,
          comentario: 'Aceptada',
          estado: 1,
          fecha_accion: new Date().toLocaleDateString('es-ES'),
          fecha_creacion: Timestamp.now()
        });

        // Actualizar estado de la solicitud
        await updateDoc(doc(db, 'solicitudes_labs', solicitud.id), {
          estado_solicitud: 'aprobado'
        });

        // Crear notificación para el usuario
        const fechaFormato = new Date(datosLab.dia).toLocaleDateString('es-ES');
        await crearNotificacion(
          datosLab.id_usuario,
          'solicitud_aprobada',
          'Solicitud Aprobada',
          `Tu solicitud del laboratorio ${solicitud.nombreRecursoLab} para el día ${fechaFormato} ha sido aprobada.`,
          {
            id_solicitud: solicitud.id,
            laboratorio: solicitud.nombreRecursoLab,
            fecha: datosLab.dia
          }
        );
        console.log(`Notificación enviada al usuario ${datosLab.id_usuario}`);
      } else {
        const datosRecurso = solicitud.datosOriginales as SolicitudRecurso;
        
        // Crear reserva de recurso
        await addDoc(collection(db, 'reserva_recurso'), {
          id_solicitud_recurso: solicitud.id,
          id_usuario: datosRecurso.id_usuario,
          id_recurso: datosRecurso.id_recurso,
          cantidad: datosRecurso.cantidad,
          id_medida: datosRecurso.id_medida,
          fecha_reserva: datosRecurso.fecha_reserva,
          fecha_devolucion: datosRecurso.fecha_devolucion,
          motivo: datosRecurso.motivo,
          comentario: 'Aceptada',
          estado: 1,
          fecha_accion: new Date().toLocaleDateString('es-ES'),
          fecha_creacion: Timestamp.now()
        });

        // Actualizar estado de la solicitud
        await updateDoc(doc(db, 'solicitudes_recursos', solicitud.id), {
          estado_solicitud: 'aprobado'
        });

        // Actualizar estado del recurso a "Reservado"
        const estadosSnapshot = await getDocs(collection(db, 'estado'));
        let idEstadoReservado = '';
        let nombreEstadoReservado = '';
        estadosSnapshot.docs.forEach(docEstado => {
          const nombreEstado = docEstado.data().nombre?.toLowerCase();
          if (nombreEstado === 'reservado' || nombreEstado === 'en reserva') {
            idEstadoReservado = docEstado.id;
            nombreEstadoReservado = docEstado.data().nombre;
          }
        });

        if (datosRecurso.id_recurso && idEstadoReservado) {
          await updateDoc(doc(db, 'recurso', datosRecurso.id_recurso), {
            id_estado: idEstadoReservado,
            estado: nombreEstadoReservado
          });
          console.log(`Recurso ${datosRecurso.id_recurso} cambiado a estado ${nombreEstadoReservado}`);
        }

        // Crear notificación para el usuario
        const fechaInicio = new Date(datosRecurso.fecha_reserva || '').toLocaleDateString('es-ES');
        const fechaFin = new Date(datosRecurso.fecha_devolucion || '').toLocaleDateString('es-ES');
        await crearNotificacion(
          datosRecurso.id_usuario,
          'solicitud_aprobada',
          'Solicitud Aprobada',
          `Tu solicitud del recurso ${solicitud.nombreRecursoLab} para el período ${fechaInicio} - ${fechaFin} ha sido aprobada.`,
          {
            id_solicitud: solicitud.id,
            recurso: solicitud.nombreRecursoLab,
            fecha_inicio: datosRecurso.fecha_reserva,
            fecha_fin: datosRecurso.fecha_devolucion
          }
        );
        console.log(`Notificación enviada al usuario ${datosRecurso.id_usuario}`);
      }

      console.log('Solicitud aprobada');
      cargarSolicitudes();
    } catch (error: any) {
      console.error('Error aprobando:', error);
      alert('Error al aprobar: ' + error.message);
    }
  };

  const [showRechazoModal, setShowRechazoModal] = useState(false);
  const [solicitudSeleccionada, setSolicitudSeleccionada] = useState<SolicitudGestion | null>(null);
  const [motivoRechazo, setMotivoRechazo] = useState('');

  const abrirModalRechazo = (solicitud: SolicitudGestion) => {
    setSolicitudSeleccionada(solicitud);
    setMotivoRechazo('');
    setShowRechazoModal(true);
  };

  const cerrarModalRechazo = () => {
    setShowRechazoModal(false);
    setSolicitudSeleccionada(null);
    setMotivoRechazo('');
  };

  const confirmarRechazo = async () => {
    if (!solicitudSeleccionada) return;
    
    if (!motivoRechazo || motivoRechazo.trim() === '') {
      alert('Debe proporcionar un motivo para el rechazo');
      return;
    }

    await rechazarSolicitud(solicitudSeleccionada, motivoRechazo);
    cerrarModalRechazo();
  };

  const rechazarSolicitud = async (solicitud: SolicitudGestion, motivo: string) => {

    try {
      console.log('Rechazando solicitud...');

      if (solicitud.tipo === 'LABORATORIO') {
        const datosLab = solicitud.datosOriginales as SolicitudLaboratorio;
        
        await addDoc(collection(db, 'reserva_labs'), {
          id_solicitud_lab: solicitud.id,
          id_usuario: datosLab.id_usuario,
          id_lab: datosLab.id_lab,
          dia: datosLab.dia,
          horarios: datosLab.horarios,
          participantes: datosLab.participantes,
          recursos: datosLab.recursos,
          motivo: datosLab.motivo,
          comentario: motivo,
          estado: 3,
          fecha_accion: new Date().toLocaleDateString('es-ES'),
          fecha_creacion: Timestamp.now()
        });

        await updateDoc(doc(db, 'solicitudes_labs', solicitud.id), {
          estado_solicitud: 'rechazado'
        });

        // Crear notificación para el usuario
        const fechaFormato = new Date(datosLab.dia).toLocaleDateString('es-ES');
        await crearNotificacion(
          datosLab.id_usuario,
          'solicitud_rechazada',
          'Solicitud Rechazada',
          `Tu solicitud del laboratorio ${solicitud.nombreRecursoLab} para el día ${fechaFormato} ha sido rechazada. Motivo: ${motivo}`,
          {
            id_solicitud: solicitud.id,
            laboratorio: solicitud.nombreRecursoLab,
            fecha: datosLab.dia,
            motivo_rechazo: motivo
          }
        );
        console.log(`Notificación de rechazo enviada al usuario ${datosLab.id_usuario}`);
      } else {
        const datosRecurso = solicitud.datosOriginales as SolicitudRecurso;
        
        await addDoc(collection(db, 'reserva_recurso'), {
          id_solicitud_recurso: solicitud.id,
          id_usuario: datosRecurso.id_usuario,
          id_recurso: datosRecurso.id_recurso,
          cantidad: datosRecurso.cantidad,
          id_medida: datosRecurso.id_medida,
          fecha_reserva: datosRecurso.fecha_reserva,
          fecha_devolucion: datosRecurso.fecha_devolucion,
          motivo: datosRecurso.motivo,
          comentario: motivo,
          estado: 3,
          fecha_accion: new Date().toLocaleDateString('es-ES'),
          fecha_creacion: Timestamp.now()
        });

        await updateDoc(doc(db, 'solicitudes_recursos', solicitud.id), {
          estado_solicitud: 'rechazado'
        });

        // Crear notificación para el usuario
        const fechaInicio = new Date(datosRecurso.fecha_reserva || '').toLocaleDateString('es-ES');
        const fechaFin = new Date(datosRecurso.fecha_devolucion || '').toLocaleDateString('es-ES');
        await crearNotificacion(
          datosRecurso.id_usuario,
          'solicitud_rechazada',
          'Solicitud Rechazada',
          `Tu solicitud del recurso ${solicitud.nombreRecursoLab} para el período ${fechaInicio} - ${fechaFin} ha sido rechazada. Motivo: ${motivo}`,
          {
            id_solicitud: solicitud.id,
            recurso: solicitud.nombreRecursoLab,
            fecha_inicio: datosRecurso.fecha_reserva,
            fecha_fin: datosRecurso.fecha_devolucion,
            motivo_rechazo: motivo
          }
        );
        console.log(`Notificación de rechazo enviada al usuario ${datosRecurso.id_usuario}`);
      }

      console.log('Solicitud rechazada');
      cargarSolicitudes();
    } catch (error: any) {
      console.error('Error rechazando:', error);
      alert('Error al rechazar: ' + error.message);
    }
  };

  const solicitudesFiltradas = solicitudes.filter(sol => {
    const matchSearch = sol.nombreUsuario.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       sol.nombreRecursoLab.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       sol.emailUsuario.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchTipo = filterTipo === 'todos' || sol.tipo === filterTipo;
    const matchEstado = filterEstado === 'todos' || sol.estado === filterEstado;
    const matchPrioridad = filterPrioridad === 'todos' || sol.prioridad === filterPrioridad;

    return matchSearch && matchTipo && matchEstado && matchPrioridad;
  });

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Cargando solicitudes...</p>
      </div>
    );
  }

  return (
    <div className="gestion-solicitudes">
      <div className="page-header">
        <h1><FiFileText /> Gestión de Solicitudes</h1>
      </div>

      <div className="filters-section">
        <div className="search-box">
          <input
            type="text"
            placeholder="Buscar por usuario o recurso/laboratorio..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="filters-row">
          <div className="filter-group">
            <label>Tipo:</label>
            <select value={filterTipo} onChange={(e) => setFilterTipo(e.target.value)}>
              <option value="todos">Todos</option>
              <option value="LABORATORIO">Laboratorios</option>
              <option value="RECURSO">Recursos</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Estado:</label>
            <select value={filterEstado} onChange={(e) => setFilterEstado(e.target.value)}>
              <option value="todos">Todos</option>
              <option value="pendiente">Pendientes</option>
              <option value="aprobado">Aprobadas</option>
              <option value="rechazado">Rechazadas</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Prioridad:</label>
            <select value={filterPrioridad} onChange={(e) => setFilterPrioridad(e.target.value)}>
              <option value="todos">Todas</option>
              <option value="Alta">Alta</option>
              <option value="Media">Media</option>
              <option value="Baja">Baja</option>
            </select>
          </div>

          {(searchTerm || filterTipo !== 'todos' || filterEstado !== 'pendiente' || filterPrioridad !== 'todos') && (
            <button
              className="btn-clear-filters"
              onClick={() => {
                setSearchTerm('');
                setFilterTipo('todos');
                setFilterEstado('pendiente');
                setFilterPrioridad('todos');
              }}
            >
              Limpiar Filtros
            </button>
          )}
        </div>
      </div>

      <div className="summary-cards">
        <div className="summary-card">
          <div className="summary-icon"><FiFileText /></div>
          <div className="summary-info">
            <div className="summary-value">{solicitudes.length}</div>
            <div className="summary-label">Total Solicitudes</div>
          </div>
        </div>
        <div className="summary-card">
          <div className="summary-icon"><FiClock /></div>
          <div className="summary-info">
            <div className="summary-value">
              {solicitudes.filter(s => s.estado === 'pendiente').length}
            </div>
            <div className="summary-label">Pendientes</div>
          </div>
        </div>
        <div className="summary-card">
          <div className="summary-icon"><FiCheckCircle /></div>
          <div className="summary-info">
            <div className="summary-value">
              {solicitudes.filter(s => s.estado === 'aprobado').length}
            </div>
            <div className="summary-label">Aprobadas</div>
          </div>
        </div>
        <div className="summary-card">
          <div className="summary-icon"><FiSearch /></div>
          <div className="summary-info">
            <div className="summary-value">{solicitudesFiltradas.length}</div>
            <div className="summary-label">Resultados</div>
          </div>
        </div>
      </div>

      <div className="solicitudes-list">
        {solicitudesFiltradas.length === 0 ? (
          <div className="no-data">No se encontraron solicitudes</div>
        ) : (
          solicitudesFiltradas.map((solicitud) => (
            <div key={solicitud.id} className="solicitud-card">
              <div className="solicitud-header">
                <div className="solicitud-tipo">
                  <span className={`tipo-badge tipo-${solicitud.tipo.toLowerCase()}`}>
                    {solicitud.tipo === 'LABORATORIO' ? <FiEye /> : <FiPackage />} {solicitud.tipo}
                  </span>
                  {solicitud.tipoRecurso && (
                    <span className="tipo-recurso">{solicitud.tipoRecurso}</span>
                  )}
                  <span className={`prioridad-badge prioridad-${solicitud.prioridad.toLowerCase()}`}>
                    {solicitud.prioridad === 'Alta' && <FiAlertCircle />}
                    {solicitud.prioridad === 'Media' && <FiAlertCircle />}
                    {solicitud.prioridad === 'Baja' && <FiAlertCircle />}
                    {solicitud.prioridad}
                  </span>
                </div>
                <span className={`estado-badge estado-${solicitud.estado}`}>
                  {solicitud.estado.toUpperCase()}
                </span>
              </div>

              <div className="solicitud-body">
                <div className="solicitud-main-info">
                  <h3>{solicitud.nombreRecursoLab}</h3>
                  <div className="usuario-info">
                    <span className="usuario-nombre"><FiUser /> {solicitud.nombreUsuario}</span>
                    <span className="usuario-tipo">({solicitud.tipoUsuario})</span>
                  </div>
                  <div className="fecha-solicitud">
                    <FiCalendar /> Solicitado el: {solicitud.fechaSolicitud}
                  </div>
                </div>

                <div className="solicitud-detalles">
                  <h4>Detalles:</h4>
                  {Object.entries(solicitud.detalles).map(([key, value]) => (
                    <div key={key} className="detalle-item">
                      <strong>{key}:</strong> {value}
                    </div>
                  ))}
                </div>
              </div>

              {solicitud.estado === 'pendiente' && (
                <div className="solicitud-actions">
                  <button
                    className="btn-aprobar"
                    onClick={() => aprobarSolicitud(solicitud)}
                  >
                    <FiCheckCircle /> Aprobar
                  </button>
                  <button
                    className="btn-rechazar"
                    onClick={() => abrirModalRechazo(solicitud)}
                  >
                    <FiXCircle /> Rechazar
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Modal de rechazo */}
      {showRechazoModal && solicitudSeleccionada && (
        <div className="modal-overlay" onClick={cerrarModalRechazo}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2><FiXCircle /> Rechazar Solicitud</h2>
              <button className="modal-close" onClick={cerrarModalRechazo}><FiX /></button>
            </div>
            
            <div className="modal-body">
              <div className="solicitud-info-modal">
                <p><strong>Usuario:</strong> {solicitudSeleccionada.nombreUsuario}</p>
                <p><strong>Tipo:</strong> {solicitudSeleccionada.tipo}</p>
                <p><strong>Recurso/Lab:</strong> {solicitudSeleccionada.nombreRecursoLab}</p>
              </div>

              <div className="form-group">
                <label htmlFor="motivoRechazo">Motivo del rechazo *</label>
                <textarea
                  id="motivoRechazo"
                  value={motivoRechazo}
                  onChange={(e) => setMotivoRechazo(e.target.value)}
                  placeholder="Explique el motivo por el cual se rechaza esta solicitud..."
                  rows={5}
                  autoFocus
                />
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn-modal-cancel" onClick={cerrarModalRechazo}>
                Cancelar
              </button>
              <button className="btn-modal-confirm" onClick={confirmarRechazo}>
                Confirmar Rechazo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GestionSolicitudes;
