import React, { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useAuth } from '../../context/AuthContext';
import { registrarEnBitacora } from '../../utils/bitacoraHelper';
import { crearNotificacion } from '../../utils/notificacionesHelper';
import { FiClipboard, FiPackage, FiSearch, FiTrash2, FiTag, FiBarChart } from 'react-icons/fi';
import './UserReservas.css';

interface Laboratorio {
  id: string;
  nombre: string;
  capacidad: number;
  estado: string;
  ubicacion: string;
}

interface Recurso {
  id: string;
  nombre: string;
  cantidad_disponible: number;
  unidad: string;
  tipo_recurso: string;
  estado: string;
}

interface Horario {
  hora_inicio: string;
  hora_fin: string;
}

const UserReservas: React.FC = () => {
  const { user } = useAuth();
  const [tabActiva, setTabActiva] = useState<'laboratorios' | 'recursos'>('laboratorios');
  
  // Listas
  const [laboratorios, setLaboratorios] = useState<Laboratorio[]>([]);
  const [recursos, setRecursos] = useState<Recurso[]>([]);
  
  // Búsqueda y filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('todos');
  const [filtroUbicacion, setFiltroUbicacion] = useState('todas');
  const [filtroTipoRecurso, setFiltroTipoRecurso] = useState('todos');
  
  // Formulario Laboratorio
  const [labSeleccionado, setLabSeleccionado] = useState<Laboratorio | null>(null);
  const [fechaLab, setFechaLab] = useState('');
  const [participantes, setParticipantes] = useState('');
  const [motivoLab, setMotivoLab] = useState('');
  const [horariosSeleccionados, setHorariosSeleccionados] = useState<Horario[]>([]);
  
  // Horarios disponibles (puedes obtenerlos desde Firebase si están en una colección)
  const horariosDisponibles = [
    { hora_inicio: '07:00', hora_fin: '09:00' },
    { hora_inicio: '09:00', hora_fin: '11:00' },
    { hora_inicio: '11:00', hora_fin: '13:00' },
    { hora_inicio: '13:00', hora_fin: '15:00' },
    { hora_inicio: '15:00', hora_fin: '17:00' },
    { hora_inicio: '17:00', hora_fin: '19:00' },
  ];
  
  // Formulario Recurso
  const [recursoSeleccionado, setRecursoSeleccionado] = useState<Recurso | null>(null);
  const [cantidadRecurso, setCantidadRecurso] = useState('');
  const [fechaReserva, setFechaReserva] = useState('');
  const [fechaDevolucion, setFechaDevolucion] = useState('');
  const [motivoRecurso, setMotivoRecurso] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    cargarLaboratorios();
    cargarRecursos();
  }, []);

  const cargarLaboratorios = async () => {
    try {
      const labsSnapshot = await getDocs(collection(db, 'laboratorios'));
      const labsData = labsSnapshot.docs.map(doc => ({
        id: doc.id,
        nombre: doc.data().nombre || '',
        capacidad: doc.data().capacidad || 0,
        estado: doc.data().estado || '',
        ubicacion: doc.data().ubicacion || '',
      }));
      setLaboratorios(labsData);
    } catch (error) {
      console.error('Error cargando laboratorios:', error);
    }
  };

  const cargarRecursos = async () => {
    try {
      // Cargar estados primero
      const estadosSnapshot = await getDocs(collection(db, 'estado'));
      const estadosMap = new Map();
      estadosSnapshot.docs.forEach(doc => {
        estadosMap.set(doc.id, doc.data().nombre);
      });

      // Cargar tipos de recurso
      const tiposSnapshot = await getDocs(collection(db, 'tipo_recurso'));
      const tiposMap = new Map();
      tiposSnapshot.docs.forEach(doc => {
        tiposMap.set(doc.id, doc.data().nombre);
      });

      // Cargar medidas
      const medidasSnapshot = await getDocs(collection(db, 'medida'));
      const medidasMap = new Map();
      medidasSnapshot.docs.forEach(doc => {
        medidasMap.set(doc.id, doc.data().nombre);
      });

      // Cargar recursos con sus relaciones
      const recursosSnapshot = await getDocs(collection(db, 'recurso'));
      const recursosData = recursosSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          nombre: data.nombre || '',
          cantidad_disponible: data.cantidad || 0,
          unidad: medidasMap.get(data.id_medida) || '',
          tipo_recurso: tiposMap.get(data.id_tipo_recurso) || '',
          estado: estadosMap.get(data.id_estado) || 'Disponible',
        };
      });
      setRecursos(recursosData);
    } catch (error) {
      console.error('Error cargando recursos:', error);
    }
  };

  const laboratoriosFiltrados = laboratorios.filter(lab => {
    const matchesSearch = lab.nombre.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesEstado = filtroEstado === 'todos' || lab.estado === filtroEstado;
    const matchesUbicacion = filtroUbicacion === 'todas' || lab.ubicacion === filtroUbicacion;
    return matchesSearch && matchesEstado && matchesUbicacion;
  });

  const recursosFiltrados = recursos.filter(rec => {
    const matchesSearch = rec.nombre.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTipo = filtroTipoRecurso === 'todos' || rec.tipo_recurso === filtroTipoRecurso;
    return matchesSearch && matchesTipo;
  });

  const toggleHorario = (horario: Horario) => {
    const existe = horariosSeleccionados.some(
      h => h.hora_inicio === horario.hora_inicio && h.hora_fin === horario.hora_fin
    );
    
    if (existe) {
      setHorariosSeleccionados(horariosSeleccionados.filter(
        h => !(h.hora_inicio === horario.hora_inicio && h.hora_fin === horario.hora_fin)
      ));
    } else {
      setHorariosSeleccionados([...horariosSeleccionados, horario]);
    }
  };

  const handleSolicitudLaboratorio = async () => {
    if (!user || !labSeleccionado || !fechaLab || !participantes || !motivoLab) {
      alert('Por favor completa todos los campos obligatorios');
      return;
    }

    if (horariosSeleccionados.length === 0) {
      alert('Selecciona al menos un horario');
      return;
    }

    const numParticipantes = parseInt(participantes);
    if (numParticipantes > labSeleccionado.capacidad) {
      alert(`El número de participantes excede la capacidad del laboratorio (${labSeleccionado.capacidad})`);
      return;
    }

    setLoading(true);
    try {
      const solicitud = {
        id_usuario: user.uid,
        id_lab: labSeleccionado.id,
        dia: fechaLab,
        fecha_solicitud: Timestamp.now(),
        horarios: horariosSeleccionados,
        motivo: motivoLab,
        participantes: numParticipantes,
        recursos: [], // Puedes agregar lógica para seleccionar recursos adicionales
        estado_solicitud: 'pendiente',
      };

      await addDoc(collection(db, 'solicitudes_labs'), solicitud);

      // Registrar en bitácora
      await registrarEnBitacora({
        usuario_nombre: user.email || 'Usuario',
        usuario_email: user.email || '',
        usuario_rol: user.rol || '1',
        accion: 'crear',
        accion_detalle: `Solicitud de laboratorio: ${labSeleccionado.nombre}`,
        modulo: 'solicitudes_labs'
      });

      // Notificar a administradores (puedes implementar notificación específica si es necesario)
      await crearNotificacion({
        titulo: 'Nueva Solicitud de Laboratorio',
        mensaje: `${user.email} ha solicitado el laboratorio ${labSeleccionado.nombre}`,
        tipo: 'general',
        leida: false,
        id_usuario: 'admin',
        datos_adicionales: {
          laboratorio: labSeleccionado.nombre
        }
      });

      alert('Solicitud de laboratorio enviada correctamente');
      limpiarFormularioLab();
      setShowModal(false);
    } catch (error) {
      console.error('Error enviando solicitud:', error);
      alert('Error al enviar la solicitud');
    } finally {
      setLoading(false);
    }
  };

  const handleSolicitudRecurso = async () => {
    if (!user || !recursoSeleccionado || !cantidadRecurso || !fechaReserva || !motivoRecurso) {
      alert('Por favor completa todos los campos obligatorios');
      return;
    }

    const cantidad = parseInt(cantidadRecurso);
    if (cantidad > recursoSeleccionado.cantidad_disponible) {
      alert(`La cantidad solicitada excede la disponibilidad (${recursoSeleccionado.cantidad_disponible} ${recursoSeleccionado.unidad})`);
      return;
    }

    if (cantidad <= 0) {
      alert('La cantidad debe ser mayor a 0');
      return;
    }

    setLoading(true);
    try {
      const solicitud = {
        id_usuario: user.uid,
        id_recurso: recursoSeleccionado.id,
        cantidad: cantidad,
        fecha_solicitud: Timestamp.now(),
        fecha_reserva: fechaReserva,
        fecha_devolucion: fechaDevolucion || null,
        motivo: motivoRecurso,
        id_medida: '1', // Puedes ajustar según tu sistema
        estado_solicitud: 'pendiente',
      };

      await addDoc(collection(db, 'solicitudes_recursos'), solicitud);

      // Registrar en bitácora
      await registrarEnBitacora({
        usuario_nombre: user.email || 'Usuario',
        usuario_email: user.email || '',
        usuario_rol: user.rol || '1',
        accion: 'crear',
        accion_detalle: `Solicitud de recurso: ${recursoSeleccionado.nombre}`,
        modulo: 'solicitudes_recursos'
      });

      // Notificar a administradores
      await crearNotificacion({
        titulo: 'Nueva Solicitud de Recurso',
        mensaje: `${user.email} ha solicitado ${cantidad} ${recursoSeleccionado.unidad} de ${recursoSeleccionado.nombre}`,
        tipo: 'general',
        leida: false,
        id_usuario: 'admin',
        datos_adicionales: {
          recurso: recursoSeleccionado.nombre
        }
      });

      alert('Solicitud de recurso enviada correctamente');
      limpiarFormularioRecurso();
      setShowModal(false);
    } catch (error) {
      console.error('Error enviando solicitud:', error);
      alert('Error al enviar la solicitud');
    } finally {
      setLoading(false);
    }
  };

  const limpiarFormularioLab = () => {
    setLabSeleccionado(null);
    setFechaLab('');
    setParticipantes('');
    setMotivoLab('');
    setHorariosSeleccionados([]);
  };

  const limpiarFormularioRecurso = () => {
    setRecursoSeleccionado(null);
    setCantidadRecurso('');
    setFechaReserva('');
    setFechaDevolucion('');
    setMotivoRecurso('');
  };

  const abrirModalLaboratorio = (lab: Laboratorio) => {
    setLabSeleccionado(lab);
    setShowModal(true);
  };

  const abrirModalRecurso = (rec: Recurso) => {
    setRecursoSeleccionado(rec);
    setShowModal(true);
  };

  const cerrarModal = () => {
    setShowModal(false);
    limpiarFormularioLab();
    limpiarFormularioRecurso();
  };

  // Obtener valores únicos para filtros
  const estadosUnicos = ['todos', ...Array.from(new Set(laboratorios.map(l => l.estado).filter(e => e)))];
  const ubicacionesUnicas = ['todas', ...Array.from(new Set(laboratorios.map(l => l.ubicacion)))];
  const tiposRecursosUnicos = ['todos', ...Array.from(new Set(recursos.map(r => r.tipo_recurso)))];

  const limpiarFiltros = () => {
    setSearchTerm('');
    setFiltroEstado('todos');
    setFiltroUbicacion('todas');
    setFiltroTipoRecurso('todos');
  };

  return (
    <div className="user-reservas-container">
      <div className="reservas-header">
        <h2><FiClipboard /> Reservas y Solicitudes</h2>
        <p>Solicita laboratorios y recursos para tus actividades académicas</p>
      </div>

      {/* Tabs */}
      <div className="tabs-container">
        <button
          className={`tab-btn ${tabActiva === 'laboratorios' ? 'active' : ''}`}
          onClick={() => {
            setTabActiva('laboratorios');
            setSearchTerm('');
          }}
        >
          🔬 Laboratorios
        </button>
        <button
          className={`tab-btn ${tabActiva === 'recursos' ? 'active' : ''}`}
          onClick={() => {
            setTabActiva('recursos');
            setSearchTerm('');
          }}
        >
          <FiPackage /> Recursos
        </button>
      </div>

      {/* Barra de búsqueda y filtros */}
      <div className="search-bar">
        <input
          type="text"
          className="search-input-main"
          placeholder={tabActiva === 'laboratorios' ? 'Buscar por nombre, código o ubicación...' : 'Buscar recurso...'}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        
        <div className="filters-bar">
        {tabActiva === 'laboratorios' ? (
          <>
            <select
              className="filter-dropdown"
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
            >
              <option value="todos">Todos los estados</option>
              {estadosUnicos.filter(e => e !== 'todos').map(estado => (
                <option key={estado} value={estado}>{estado}</option>
              ))}
            </select>
            
            <select
              className="filter-dropdown"
              value={filtroUbicacion}
              onChange={(e) => setFiltroUbicacion(e.target.value)}
            >
              <option value="todas">Todas las ubicaciones</option>
              {ubicacionesUnicas.filter(u => u !== 'todas').map(ub => (
                <option key={ub} value={ub}>{ub}</option>
              ))}
            </select>
          </>
        ) : (
          <select
            className="filter-dropdown"
            value={filtroTipoRecurso}
            onChange={(e) => setFiltroTipoRecurso(e.target.value)}
          >
            <option value="todos">Todos los tipos</option>
            {tiposRecursosUnicos.filter(t => t !== 'todos').map(tipo => (
              <option key={tipo} value={tipo}>{tipo}</option>
            ))}
          </select>
        )}
        
        <button className="btn-clear-filters" onClick={limpiarFiltros}>
          <FiTrash2 /> Limpiar filtros
        </button>
        </div>
      </div>

      {/* Lista de elementos */}
      <div className="items-grid">
        {tabActiva === 'laboratorios' ? (
          laboratoriosFiltrados.length > 0 ? (
            laboratoriosFiltrados.map(lab => (
              <div key={lab.id} className="item-card">
                <div className="item-header">
                  <h3>🔬 {lab.nombre}</h3>
                  <span className={`badge badge-${
                    lab.estado === 'Disponible' ? 'success' : 
                    lab.estado === 'En Mantenimiento' ? 'warning' : 
                    'danger'
                  }`}>
                    {lab.estado || 'Sin estado'}
                  </span>
                </div>
                <div className="item-info">
                  <p><strong>📍 Ubicación:</strong> {lab.ubicacion}</p>
                  <p><strong>👥 Capacidad:</strong> {lab.capacidad} personas</p>
                </div>
                <button
                  className="btn-solicitar"
                  onClick={() => abrirModalLaboratorio(lab)}
                  disabled={lab.estado !== 'Disponible'}
                >
                  {lab.estado === 'Disponible' 
                    ? 'Solicitar Laboratorio' 
                    : 'No disponible'}
                </button>
              </div>
            ))
          ) : (
            <p className="no-results">No se encontraron laboratorios</p>
          )
        ) : (
          recursosFiltrados.length > 0 ? (
            recursosFiltrados.map(rec => (
              <div key={rec.id} className="item-card">
                <div className="item-header">
                  <h3><FiPackage /> {rec.nombre}</h3>
                  <span className={`badge badge-${
                    rec.estado?.toLowerCase().includes('disponible') ? 'success' : 
                    rec.estado?.toLowerCase().includes('mantenimiento') ? 'warning' : 
                    rec.estado?.toLowerCase().includes('reservado') ? 'info' :
                    'danger'
                  }`}>
                    {rec.estado || 'Sin estado'}
                  </span>
                </div>
                <div className="item-info">
                  <p><strong><FiTag /> Tipo:</strong> {rec.tipo_recurso}</p>
                  <p><strong><FiBarChart /> Disponible:</strong> {rec.cantidad_disponible} {rec.unidad}</p>
                </div>
                <button
                  className="btn-solicitar"
                  onClick={() => abrirModalRecurso(rec)}
                  disabled={rec.estado?.toLowerCase() !== 'disponible' || rec.cantidad_disponible <= 0}
                >
                  {rec.estado?.toLowerCase() === 'disponible' && rec.cantidad_disponible > 0
                    ? 'Solicitar Recurso' 
                    : 'No disponible'}
                </button>
              </div>
            ))
          ) : (
            <p className="no-results">No se encontraron recursos</p>
          )
        )}
      </div>

      {/* Modal para formulario */}
      {showModal && (
        <div className="modal-overlay" onClick={cerrarModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            {labSeleccionado ? (
              <>
                <h3>📝 Solicitud de Laboratorio</h3>
                <h4>{labSeleccionado.nombre}</h4>
                
                <div className="form-group">
                  <label>Fecha de Reserva *</label>
                  <input
                    type="date"
                    value={fechaLab}
                    onChange={(e) => setFechaLab(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>

                <div className="form-group">
                  <label>Horarios Disponibles *</label>
                  <div className="horarios-grid">
                    {horariosDisponibles.map((horario, index) => (
                      <button
                        key={index}
                        className={`horario-btn ${
                          horariosSeleccionados.some(
                            h => h.hora_inicio === horario.hora_inicio && h.hora_fin === horario.hora_fin
                          ) ? 'selected' : ''
                        }`}
                        onClick={() => toggleHorario(horario)}
                        type="button"
                      >
                        {horario.hora_inicio} - {horario.hora_fin}
                      </button>
                    ))}
                  </div>
                  {horariosSeleccionados.length > 0 && (
                    <p className="selected-info">
                      ✓ {horariosSeleccionados.length} horario(s) seleccionado(s)
                    </p>
                  )}
                </div>

                <div className="form-group">
                  <label>Número de Participantes *</label>
                  <input
                    type="number"
                    value={participantes}
                    onChange={(e) => setParticipantes(e.target.value)}
                    min="1"
                    max={labSeleccionado.capacidad}
                    placeholder={`Máximo ${labSeleccionado.capacidad}`}
                  />
                </div>

                <div className="form-group">
                  <label>Motivo de la Solicitud *</label>
                  <textarea
                    value={motivoLab}
                    onChange={(e) => setMotivoLab(e.target.value)}
                    rows={4}
                    placeholder="Describe el motivo de tu solicitud..."
                  />
                </div>

                <div className="modal-actions">
                  <button
                    className="btn-primary"
                    onClick={handleSolicitudLaboratorio}
                    disabled={loading}
                  >
                    {loading ? 'Enviando...' : 'Enviar Solicitud'}
                  </button>
                  <button className="btn-secondary" onClick={cerrarModal}>
                    Cancelar
                  </button>
                </div>
              </>
            ) : recursoSeleccionado ? (
              <>
                <h3>📝 Solicitud de Recurso</h3>
                <h4>{recursoSeleccionado.nombre}</h4>
                
                <div className="form-group">
                  <label>Cantidad *</label>
                  <input
                    type="number"
                    value={cantidadRecurso}
                    onChange={(e) => setCantidadRecurso(e.target.value)}
                    min="1"
                    max={recursoSeleccionado.cantidad_disponible}
                    placeholder={`Máximo ${recursoSeleccionado.cantidad_disponible} ${recursoSeleccionado.unidad}`}
                  />
                </div>

                <div className="form-group">
                  <label>Fecha de Reserva *</label>
                  <input
                    type="date"
                    value={fechaReserva}
                    onChange={(e) => setFechaReserva(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>

                <div className="form-group">
                  <label>Fecha de Devolución</label>
                  <input
                    type="date"
                    value={fechaDevolucion}
                    onChange={(e) => setFechaDevolucion(e.target.value)}
                    min={fechaReserva || new Date().toISOString().split('T')[0]}
                  />
                </div>

                <div className="form-group">
                  <label>Motivo de la Solicitud *</label>
                  <textarea
                    value={motivoRecurso}
                    onChange={(e) => setMotivoRecurso(e.target.value)}
                    rows={4}
                    placeholder="Describe el motivo de tu solicitud..."
                  />
                </div>

                <div className="modal-actions">
                  <button
                    className="btn-primary"
                    onClick={handleSolicitudRecurso}
                    disabled={loading}
                  >
                    {loading ? 'Enviando...' : 'Enviar Solicitud'}
                  </button>
                  <button className="btn-secondary" onClick={cerrarModal}>
                    Cancelar
                  </button>
                </div>
              </>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
};

export default UserReservas;
