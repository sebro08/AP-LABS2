import { useState, useEffect } from 'react';
import { collection, doc, getDocs, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useAuth } from '../../context/AuthContext';
import { registrarEnBitacora } from '../../utils/bitacoraHelper';
import { FiSettings, FiCalendar, FiRefreshCw, FiCheckCircle, FiXCircle, FiEdit, FiX } from 'react-icons/fi';
import './ParametrosGlobales.css';

interface EstadoItem {
  id: string;
  nombre: string;
  descripcion: string;
  color: string;
  activo: boolean;
  tipo: 'equipos' | 'solicitudes' | 'mantenimientos' | 'reservas';
}

interface ParametroConfig {
  id: string;
  nombre: string;
  descripcion: string;
  valor: string | number | boolean;
  tipo: 'numero' | 'texto' | 'booleano' | 'color' | 'select';
  categoria: 'reservas' | 'notificaciones' | 'politicas' | 'estados';
  opciones?: string[];
  min?: number;
  max?: number;
  unidad?: string;
}

// interface Usuario {
//   id: string;
//   nombre: string;
//   email: string;
//   id_rol: string;
// }

const ParametrosGlobales = () => {
  const { user: currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [parametros, setParametros] = useState<ParametroConfig[]>([]);
  const [estados, setEstados] = useState<EstadoItem[]>([]);

  const [tabActiva, setTabActiva] = useState('reservas');
  const [guardando, setGuardando] = useState(false);
  const [mostrarModalEstado, setMostrarModalEstado] = useState(false);
  const [estadoEditando, setEstadoEditando] = useState<EstadoItem | null>(null);
  const [nuevoEstado, setNuevoEstado] = useState<Partial<EstadoItem>>({
    nombre: '',
    descripcion: '',
    color: '#667eea',
    activo: true,
    tipo: 'equipos'
  });
  const [usuarios, setUsuarios] = useState<any[]>([]);

  useEffect(() => {
    cargarTodosLosDatos();
  }, []);

  const cargarTodosLosDatos = async () => {
    setLoading(true);
    try {
      await Promise.all([
        cargarParametros(),
        cargarEstados(),
        cargarUsuarios()
      ]);
    } finally {
      setLoading(false);
    }
  };

  const cargarUsuarios = async () => {
    try {
      const usuariosRef = collection(db, 'usuarios');
      const snapshot = await getDocs(usuariosRef);
      
      const usuariosData = snapshot.docs.map(doc => ({
        id: doc.id,
        nombre: doc.data().nombre || doc.data().name || 'Sin nombre',
        email: doc.data().email || doc.data().correo || '',
        id_rol: doc.data().id_rol || '1'
      }));

      setUsuarios(usuariosData);
      console.log('Usuarios cargados:', usuariosData.length);

    } catch (error) {
      console.error('Error cargando usuarios:', error);
    }
  };

  const cargarEstados = async () => {
    try {
      // Crear estados por defecto
      const estadosDefecto: EstadoItem[] = [
        // Estados de Equipos
        { id: 'eq_disponible', nombre: 'Disponible', descripcion: 'Equipo disponible para uso', color: '#48bb78', activo: true, tipo: 'equipos' },
        { id: 'eq_en_uso', nombre: 'En Uso', descripcion: 'Equipo actualmente en uso', color: '#ed8936', activo: true, tipo: 'equipos' },
        { id: 'eq_mantenimiento', nombre: 'En Mantenimiento', descripcion: 'Equipo en proceso de mantenimiento', color: '#e53e3e', activo: true, tipo: 'equipos' },
        { id: 'eq_fuera_servicio', nombre: 'Fuera de Servicio', descripcion: 'Equipo temporalmente fuera de servicio', color: '#718096', activo: true, tipo: 'equipos' },

        // Estados de Solicitudes
        { id: 'sol_pendiente', nombre: 'Pendiente', descripcion: 'Solicitud pendiente de revisión', color: '#d69e2e', activo: true, tipo: 'solicitudes' },
        { id: 'sol_aprobada', nombre: 'Aprobada', descripcion: 'Solicitud aprobada', color: '#48bb78', activo: true, tipo: 'solicitudes' },
        { id: 'sol_rechazada', nombre: 'Rechazada', descripcion: 'Solicitud rechazada', color: '#e53e3e', activo: true, tipo: 'solicitudes' },
        { id: 'sol_cancelada', nombre: 'Cancelada', descripcion: 'Solicitud cancelada por el usuario', color: '#718096', activo: true, tipo: 'solicitudes' },

        // Estados de Mantenimientos
        { id: 'mant_programado', nombre: 'Programado', descripcion: 'Mantenimiento programado', color: '#667eea', activo: true, tipo: 'mantenimientos' },
        { id: 'mant_en_proceso', nombre: 'En Proceso', descripcion: 'Mantenimiento en ejecución', color: '#ed8936', activo: true, tipo: 'mantenimientos' },
        { id: 'mant_completado', nombre: 'Completado', descripcion: 'Mantenimiento completado exitosamente', color: '#48bb78', activo: true, tipo: 'mantenimientos' },

        // Estados de Reservas
        { id: 'res_confirmada', nombre: 'Confirmada', descripcion: 'Reserva confirmada', color: '#48bb78', activo: true, tipo: 'reservas' },
        { id: 'res_pendiente', nombre: 'Pendiente', descripcion: 'Reserva pendiente de confirmación', color: '#d69e2e', activo: true, tipo: 'reservas' },
        { id: 'res_cancelada', nombre: 'Cancelada', descripcion: 'Reserva cancelada', color: '#e53e3e', activo: true, tipo: 'reservas' }
      ];

      setEstados(estadosDefecto);
      console.log('Estados configurados:', estadosDefecto.length);

    } catch (error) {
      console.error('Error cargando estados:', error);
    }
  };

  const handleGuardarEstado = async () => {
    try {
      if (!nuevoEstado.nombre || !nuevoEstado.descripcion) {
        alert('Por favor completa todos los campos obligatorios');
        return;
      }

      setGuardando(true);

      const estadoCompleto: EstadoItem = {
        id: estadoEditando?.id || `${nuevoEstado.tipo}_${Date.now()}`,
        nombre: nuevoEstado.nombre!,
        descripcion: nuevoEstado.descripcion!,
        color: nuevoEstado.color || '#667eea',
        activo: nuevoEstado.activo ?? true,
        tipo: nuevoEstado.tipo as any
      };

      if (estadoEditando) {
        // Editar estado existente
        setEstados(prev => prev.map(e => e.id === estadoEditando.id ? estadoCompleto : e));
      } else {
        // Agregar nuevo estado
        setEstados(prev => [...prev, estadoCompleto]);
      }

      // Registrar en bitácora
      if (currentUser) {
        await registrarEnBitacora({
          usuario_nombre: currentUser.nombre,
          usuario_email: currentUser.email,
          usuario_rol: currentUser.rol,
          accion: estadoEditando ? 'Actualizar' : 'Crear',
          accion_detalle: `${estadoEditando ? 'Actualizó' : 'Creó'} estado "${estadoCompleto.nombre}" en categoría ${estadoCompleto.tipo}`,
          modulo: 'Parámetros Globales - Estados'
        });
      }

      console.log(`Estado ${estadoEditando ? 'actualizado' : 'creado'}:`, estadoCompleto.nombre);
      handleCerrarModal();

    } catch (error) {
      console.error('Error guardando estado:', error);
      alert('Error al guardar el estado. Inténtalo de nuevo.');
    } finally {
      setGuardando(false);
    }
  };

  const handleCerrarModal = () => {
    setMostrarModalEstado(false);
    setEstadoEditando(null);
    setNuevoEstado({
      nombre: '',
      descripcion: '',
      color: '#667eea',
      activo: true,
      tipo: 'equipos'
    });
  };

  const handleEditarEstado = (estado: EstadoItem) => {
    setEstadoEditando(estado);
    setNuevoEstado({
      nombre: estado.nombre,
      descripcion: estado.descripcion,
      color: estado.color,
      activo: estado.activo,
      tipo: estado.tipo
    });
    setMostrarModalEstado(true);
  };

  const toggleEstadoActivo = (estadoId: string) => {
    setEstados(prev => prev.map(e => 
      e.id === estadoId ? { ...e, activo: !e.activo } : e
    ));
  };

  const cargarParametros = async () => {
    try {
      // Crear parámetros configurables del sistema
      const parametrosConfig: ParametroConfig[] = [
        // RESERVAS
        {
          id: 'reservas_duracion_maxima',
          nombre: 'Duración Máxima de Reserva',
          descripcion: 'Tiempo máximo que puede durar una reserva de laboratorio',
          valor: 8,
          tipo: 'numero',
          categoria: 'reservas',
          min: 1,
          max: 24,
          unidad: 'horas'
        },
        {
          id: 'reservas_antelacion_minima',
          nombre: 'Antelación Mínima',
          descripcion: 'Tiempo mínimo de anticipación para hacer una reserva',
          valor: 2,
          tipo: 'numero',
          categoria: 'reservas',
          min: 0,
          max: 168,
          unidad: 'horas'
        },
        {
          id: 'reservas_simultaneas_max',
          nombre: 'Reservas Simultáneas Máximas',
          descripcion: 'Número máximo de reservas activas por usuario',
          valor: 3,
          tipo: 'numero',
          categoria: 'reservas',
          min: 1,
          max: 10,
          unidad: 'reservas'
        },
        
        // NOTIFICACIONES
        {
          id: 'notif_email_activo',
          nombre: 'Notificaciones por Email',
          descripcion: 'Activar envío de notificaciones por correo electrónico',
          valor: true,
          tipo: 'booleano',
          categoria: 'notificaciones'
        },
        {
          id: 'notif_sms_activo',
          nombre: 'Notificaciones por SMS',
          descripcion: 'Activar envío de notificaciones por mensaje de texto',
          valor: false,
          tipo: 'booleano',
          categoria: 'notificaciones'
        },
        {
          id: 'notif_recordatorio_tiempo',
          nombre: 'Tiempo para Recordatorios',
          descripcion: 'Tiempo antes del evento para enviar recordatorios automáticos',
          valor: 24,
          tipo: 'numero',
          categoria: 'notificaciones',
          min: 1,
          max: 168,
          unidad: 'horas'
        },
        
        // POLÍTICAS
        {
          id: 'politica_mantenimiento_intervalo',
          nombre: 'Intervalo de Mantenimiento Preventivo',
          descripcion: 'Frecuencia automática para programar mantenimientos preventivos',
          valor: 30,
          tipo: 'numero',
          categoria: 'politicas',
          min: 1,
          max: 365,
          unidad: 'días'
        },
        {
          id: 'politica_tiempo_respuesta',
          nombre: 'Tiempo Máximo de Respuesta',
          descripcion: 'Tiempo máximo para responder a solicitudes de los usuarios',
          valor: 24,
          tipo: 'numero',
          categoria: 'politicas',
          min: 1,
          max: 168,
          unidad: 'horas'
        },
        {
          id: 'politica_tecnico_defecto',
          nombre: 'Técnico por Defecto',
          descripcion: 'Técnico asignado automáticamente para nuevas solicitudes',
          valor: '',
          tipo: 'select',
          categoria: 'politicas',
          opciones: ['', ...usuarios.filter(u => u.id_rol === '4').map(u => `${u.id}:${u.nombre}`)]
        }
      ];

      setParametros(parametrosConfig);
      console.log('Parámetros configurados:', parametrosConfig.length);

    } catch (error) {
      console.error('Error configurando parámetros:', error);
    }
  };



  const handleGuardarParametro = async (parametro: ParametroConfig, nuevoValor: string | number | boolean) => {
    try {
      setGuardando(true);

      // Determinar el campo a actualizar (valor o activo según el tipo)
      const campo = parametro.tipo === 'booleano' ? 'activo' : 'valor';

      // Actualizar en Firebase
      await updateDoc(doc(db, 'parametros_globales', parametro.id), {
        [campo]: nuevoValor
      });

      // Actualizar estado local
      setParametros(prev => 
        prev.map(p => 
          p.id === parametro.id ? { ...p, valor: nuevoValor } : p
        )
      );

      // Registrar en bitácora
      if (currentUser) {
        await registrarEnBitacora({
          usuario_nombre: currentUser.nombre,
          usuario_email: currentUser.email,
          usuario_rol: currentUser.rol,
          accion: 'Actualizar',
          accion_detalle: `Actualizó parámetro "${parametro.nombre}" a: ${nuevoValor}`,
          modulo: 'Parámetros Globales'
        });
      }

      console.log(`Parámetro ${parametro.nombre} actualizado:`, nuevoValor);

    } catch (error) {
      console.error('Error actualizando parámetro:', error);
    } finally {
      setGuardando(false);
    }
  };

  const parametrosPorCategoria = parametros.filter(p => p.categoria === tabActiva);

  const getIconoCategoria = (categoria: string) => {
    switch (categoria) {
      case 'reservas': return <FiCalendar />;
      case 'estados': return <FiRefreshCw />;
      case 'notificaciones': return <FiSettings />;
      case 'politicas': return <FiSettings />;
      default: return <FiSettings />;
    }
  };

  const renderParametro = (parametro: ParametroConfig) => {
    switch (parametro.tipo) {
      case 'booleano':
        return (
          <div className="parametro-control">
            <label className="switch">
              <input
                type="checkbox"
                checked={parametro.valor as boolean}
                onChange={(e) => handleGuardarParametro(parametro, e.target.checked)}
                disabled={guardando}
              />
              <span className="slider"></span>
            </label>
            <span className="value-display">
              {parametro.valor ? <><FiCheckCircle /> Activado</> : <><FiXCircle /> Desactivado</>}
            </span>
          </div>
        );
      
      case 'numero':
        return (
          <div className="parametro-control">
            <div className="numero-input-group">
              <input
                type="number"
                value={parametro.valor as number}
                onChange={(e) => {
                  const valor = parseFloat(e.target.value) || 0;
                  if (!parametro.min || valor >= parametro.min) {
                    if (!parametro.max || valor <= parametro.max) {
                      handleGuardarParametro(parametro, valor);
                    }
                  }
                }}
                disabled={guardando}
                min={parametro.min}
                max={parametro.max}
                className="numero-input"
              />
              {parametro.unidad && (
                <span className="unidad">{parametro.unidad}</span>
              )}
            </div>
            {(parametro.min !== undefined || parametro.max !== undefined) && (
              <small className="rango-info">
                Rango: {parametro.min || 0} - {parametro.max || '∞'} {parametro.unidad}
              </small>
            )}
          </div>
        );
      
      case 'texto':
        return (
          <div className="parametro-control">
            <input
              type="text"
              value={parametro.valor as string}
              onChange={(e) => handleGuardarParametro(parametro, e.target.value)}
              disabled={guardando}
              placeholder="Ingrese valor..."
              className="texto-input"
            />
          </div>
        );
      
      case 'select':
        return (
          <div className="parametro-control">
            <select
              value={parametro.valor as string}
              onChange={(e) => handleGuardarParametro(parametro, e.target.value)}
              disabled={guardando}
              className="select-input"
            >
              {parametro.opciones?.map(opcion => {
                if (opcion === '') {
                  return <option key="" value="">Seleccionar...</option>;
                }
                
                // Si la opción tiene formato "id:nombre", separar
                const [id, nombre] = opcion.includes(':') 
                  ? opcion.split(':') 
                  : [opcion, opcion];
                
                return (
                  <option key={id} value={id}>
                    {nombre}
                  </option>
                );
              })}
            </select>
          </div>
        );
      
      case 'color':
        return (
          <div className="parametro-control">
            <div className="color-input-group">
              <input
                type="color"
                value={parametro.valor as string}
                onChange={(e) => handleGuardarParametro(parametro, e.target.value)}
                disabled={guardando}
                className="color-input"
              />
              <span className="color-preview" style={{ backgroundColor: parametro.valor as string }}>
                {parametro.valor}
              </span>
            </div>
          </div>
        );
      
      default:
        return <span className="tipo-no-soportado">Tipo no soportado: {parametro.tipo}</span>;
    }
  };

  if (loading) {
    return (
      <div className="parametros-loading">
        <div className="loading-spinner"></div>
        <p>Cargando parámetros globales...</p>
      </div>
    );
  }

  return (
    <div className="parametros-globales">
      <div className="parametros-header">
        <h1><FiSettings /> Parámetros Globales</h1>
        <p className="subtitle">Configuración general del sistema</p>
      </div>

      {/* Tabs de Categorías */}
      <div className="tabs-container">
        {['reservas', 'notificaciones', 'politicas', 'estados'].map(categoria => (
          <button
            key={categoria}
            className={`tab ${tabActiva === categoria ? 'active' : ''}`}
            onClick={() => setTabActiva(categoria)}
          >
            {getIconoCategoria(categoria)} {categoria.charAt(0).toUpperCase() + categoria.slice(1)}
          </button>
        ))}
      </div>



      {/* Contenido según tab activa */}
      {tabActiva === 'estados' ? (
        <div className="estados-gestion">
          <div className="estados-header">
            <h2><FiRefreshCw /> Gestión de Estados</h2>
            <button 
              className="btn btn-primary"
              onClick={() => {
                setEstadoEditando(null);
                setMostrarModalEstado(true);
              }}
            >
              Nuevo Estado
            </button>
          </div>
          
          <div className="estados-grid">
            {['equipos', 'solicitudes', 'mantenimientos', 'reservas'].map(tipo => (
              <div key={tipo} className="estados-categoria">
                <h3 className="categoria-titulo">
                  {getIconoCategoria(tipo)} {tipo.charAt(0).toUpperCase() + tipo.slice(1)}
                </h3>
                
                <div className="estados-lista">
                  {estados
                    .filter(estado => estado.tipo === tipo)
                    .map(estado => (
                      <div key={estado.id} className="estado-item">
                        <div 
                          className="estado-color" 
                          style={{ backgroundColor: estado.color }}
                        ></div>
                        
                        <div className="estado-info">
                          <h4>{estado.nombre}</h4>
                          <p>{estado.descripcion}</p>
                        </div>
                        
                        <div className="estado-acciones">
                          <button 
                            className="btn-icon edit"
                            onClick={() => handleEditarEstado(estado)}
                            title="Editar estado"
                          >
                            <FiEdit />
                          </button>
                          
                          <label className="switch small">
                            <input
                              type="checkbox"
                              checked={estado.activo}
                              onChange={() => toggleEstadoActivo(estado.id)}
                            />
                            <span className="slider"></span>
                          </label>
                        </div>
                      </div>
                    ))
                  }
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* Lista de Parámetros */
        <div className="parametros-lista">
          {parametrosPorCategoria.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon"><FiSettings /></div>
              <h3>No hay parámetros</h3>
              <p>No se encontraron parámetros para la categoría seleccionada.</p>
            </div>
          ) : (
            parametrosPorCategoria.map(parametro => (
              <div key={parametro.id} className="parametro-item">
                <div className="parametro-info">
                  <h3 className="parametro-nombre">{parametro.nombre}</h3>
                  <p className="parametro-descripcion">{parametro.descripcion}</p>
                <div className="parametro-meta">
                  <span className="parametro-categoria">{getIconoCategoria(parametro.categoria)} {parametro.categoria}</span>
                </div>
                </div>
                
                {renderParametro(parametro)}
              </div>
            ))
          )}
        </div>
      )}

      {/* Estado de guardado */}
      {guardando && (
        <div className="guardando-overlay">
          <div className="guardando-message">
            <div className="loading-spinner small"></div>
            Guardando cambios...
          </div>
        </div>
      )}

      {/* Modal de Estado */}
      {mostrarModalEstado && (
        <div className="modal-overlay" onClick={handleCerrarModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{estadoEditando ? 'Editar Estado' : 'Nuevo Estado'}</h2>
              <button className="modal-close" onClick={handleCerrarModal}>
                <FiX />
              </button>
            </div>
            
            <div className="modal-body">
              <div className="form-grid">
                <div className="form-group">
                  <label>Nombre *</label>
                  <input
                    type="text"
                    value={nuevoEstado.nombre || ''}
                    onChange={(e) => setNuevoEstado(prev => ({ ...prev, nombre: e.target.value }))}
                    placeholder="Nombre del estado"
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label>Descripción *</label>
                  <textarea
                    value={nuevoEstado.descripcion || ''}
                    onChange={(e) => setNuevoEstado(prev => ({ ...prev, descripcion: e.target.value }))}
                    placeholder="Descripción del estado"
                    className="form-textarea"
                    rows={3}
                  />
                </div>

                <div className="form-group">
                  <label>Categoría</label>
                  <select
                    value={nuevoEstado.tipo || 'equipos'}
                    onChange={(e) => setNuevoEstado(prev => ({ ...prev, tipo: e.target.value as any }))}
                    className="form-select"
                  >
                    <option value="equipos">Equipos</option>
                    <option value="solicitudes">Solicitudes</option>
                    <option value="mantenimientos">Mantenimientos</option>
                    <option value="reservas">Reservas</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Color</label>
                  <div className="color-picker-group">
                    <input
                      type="color"
                      value={nuevoEstado.color || '#667eea'}
                      onChange={(e) => setNuevoEstado(prev => ({ ...prev, color: e.target.value }))}
                      className="color-picker"
                    />
                    <div 
                      className="color-preview-large"
                      style={{ backgroundColor: nuevoEstado.color || '#667eea' }}
                    >
                      {nuevoEstado.color || '#667eea'}
                    </div>
                  </div>
                </div>

                <div className="form-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={nuevoEstado.activo ?? true}
                      onChange={(e) => setNuevoEstado(prev => ({ ...prev, activo: e.target.checked }))}
                    />
                    Estado activo por defecto
                  </label>
                </div>
              </div>
            </div>
            
            <div className="modal-footer">
              <button 
                className="btn btn-secondary"
                onClick={handleCerrarModal}
                disabled={guardando}
              >
                Cancelar
              </button>
              <button 
                className="btn btn-primary"
                onClick={handleGuardarEstado}
                disabled={guardando || !nuevoEstado.nombre || !nuevoEstado.descripcion}
              >
                {guardando ? (
                  <>
                    <div className="loading-spinner small"></div>
                    Guardando...
                  </>
                ) : (
                  estadoEditando ? 'Actualizar Estado' : 'Crear Estado'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default ParametrosGlobales;