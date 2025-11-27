import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { Laboratorio } from '../../types/Laboratorio';
import { FiActivity, FiCheckCircle, FiXCircle, FiSearch, FiEdit, FiTrash2, FiAlertCircle, FiPlus, FiTool, FiUsers } from 'react-icons/fi';
import './GestionLaboratorios.css';

const GestionLaboratorios = () => {
  const navigate = useNavigate();
  const [laboratorios, setLaboratorios] = useState<Laboratorio[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEstado, setFilterEstado] = useState('');
  const [filterActivo, setFilterActivo] = useState('');

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    console.log('[INICIO] Función cargarDatos ejecutándose...');
    setLoading(true);
    setError('');
    try {
      console.log('Intentando conectar con Firebase...');
      console.log('Colección: laboratorios');
      
      const labsSnapshot = await getDocs(collection(db, 'laboratorios'));
      console.log('Snapshot obtenido, total documentos:', labsSnapshot.size);
      
      const labsData = labsSnapshot.docs.map(doc => {
        const data = doc.data();
        console.log('Procesando doc ID:', doc.id, 'Data:', data);
        
        // Asegurar que estado sea un string válido
        let estadoVal: 'Disponible' | 'En Mantenimiento' | 'Fuera de Servicio' = 'Disponible';
        if (typeof data.estado === 'string') {
          estadoVal = data.estado as any;
        }
        
        return {
          id: doc.id,
          nombre: String(data.nombre || ''),
          codigo: String(data.codigo || ''),
          ubicacion: String(data.ubicacion || ''),
          capacidad: Number(data.capacidad || 0),
          descripcion: String(data.descripcion || ''),
          estado: estadoVal,
          encargado: String(data.encargado || ''),
          fecha_creacion: String(data.fecha_creacion || ''),
          activo: data.activo !== undefined ? data.activo : true
        } as Laboratorio;
      });

      console.log('Laboratorios procesados:', labsData);
      setLaboratorios(labsData);
      console.log('Estado actualizado con', labsData.length, 'laboratorios');
      setLoading(false);
      console.log('[FIN] Carga completada exitosamente');
    } catch (err: any) {
      console.error('[ERROR] Error en cargarDatos:', err);
      console.error('Mensaje:', err.message);
      console.error('Código:', err.code);
      setError('Error al cargar los laboratorios: ' + err.message);
      setLoading(false);
    }
  };

  const toggleEstadoLaboratorio = async (lab: Laboratorio) => {
    try {
      const nuevoEstado = !lab.activo;
      await updateDoc(doc(db, 'laboratorios', lab.id), {
        activo: nuevoEstado
      });

      setLaboratorios(laboratorios.map(l => 
        l.id === lab.id ? { ...l, activo: nuevoEstado } : l
      ));

      console.log(`Laboratorio ${nuevoEstado ? 'activado' : 'desactivado'}`);
    } catch (error) {
      console.error('Error cambiando estado:', error);
      setError('Error al cambiar el estado del laboratorio');
    }
  };

  const eliminarLaboratorio = async (labId: string, nombreLab: string) => {
    const confirmar = window.confirm(`¿Estás seguro que deseas eliminar el laboratorio "${nombreLab}"?\n\nEsta acción no se puede deshacer.`);
    
    if (confirmar) {
      try {
        await deleteDoc(doc(db, 'laboratorios', labId));
        
        setLaboratorios(laboratorios.filter(l => l.id !== labId));
        
        console.log('Laboratorio eliminado correctamente');
      } catch (err) {
        console.error('Error al eliminar laboratorio:', err);
        setError('Error al eliminar el laboratorio');
      }
    }
  };

  const limpiarFiltros = () => {
    setSearchTerm('');
    setFilterEstado('');
    setFilterActivo('');
  };

  // Filtrar laboratorios
  const laboratoriosFiltrados = laboratorios.filter(lab => {
    const busqueda = searchTerm.toLowerCase();
    const coincideBusqueda = 
      lab.nombre.toLowerCase().includes(busqueda) || 
      lab.codigo.toLowerCase().includes(busqueda) ||
      lab.ubicacion.toLowerCase().includes(busqueda);

    const coincideEstado = !filterEstado || lab.estado === filterEstado;
    
    const coincideActivo = !filterActivo || 
                          (filterActivo === 'activo' && lab.activo) ||
                          (filterActivo === 'inactivo' && !lab.activo);

    return coincideBusqueda && coincideEstado && coincideActivo;
  });

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Cargando laboratorios...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <div className="error-icon"><FiAlertCircle /></div>
        <h2>Error al cargar datos</h2>
        <p>{error}</p>
        <button className="btn-primary" onClick={cargarDatos}>
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="gestion-laboratorios">
      {/* Header */}
      <div className="page-header">
        <h1>Gestión de Laboratorios</h1>
        <button 
          className="btn-primary"
          onClick={() => navigate('/admin/laboratorios/nuevo')}
        >
          <FiPlus /> Nuevo Laboratorio
        </button>
      </div>

      {/* Filtros */}
      <div className="filters-section">
        <div className="search-box">
          <span className="search-icon"><FiSearch /></span>
          <input
            type="text"
            placeholder="Buscar por nombre, código o ubicación..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="filters">
          <select 
            className="filter-select"
            value={filterEstado}
            onChange={(e) => setFilterEstado(e.target.value)}
          >
            <option value="">Todos los estados</option>
            <option value="Disponible">Disponible</option>
            <option value="En Mantenimiento">En Mantenimiento</option>
            <option value="Fuera de Servicio">Fuera de Servicio</option>
          </select>
          <select 
            className="filter-select"
            value={filterActivo}
            onChange={(e) => setFilterActivo(e.target.value)}
          >
            <option value="">Activos e Inactivos</option>
            <option value="activo">Solo Activos</option>
            <option value="inactivo">Solo Inactivos</option>
          </select>
          <button className="btn-secondary" onClick={limpiarFiltros}>
            Limpiar filtros
          </button>
        </div>
      </div>

      {/* Cards de resumen */}
      <div className="summary-cards">
        <div className="summary-card">
          <div className="summary-icon"><FiActivity /></div>
          <div className="summary-info">
            <div className="summary-value">{laboratorios.length}</div>
            <div className="summary-label">Total</div>
          </div>
        </div>
        <div className="summary-card">
          <div className="summary-icon"><FiCheckCircle /></div>
          <div className="summary-info">
            <div className="summary-value">{laboratorios.filter(l => l.estado === 'Disponible').length}</div>
            <div className="summary-label">Disponibles</div>
          </div>
        </div>
        <div className="summary-card">
          <div className="summary-icon"><FiTool /></div>
          <div className="summary-info">
            <div className="summary-value">{laboratorios.filter(l => l.estado === 'En Mantenimiento').length}</div>
            <div className="summary-label">En Mantenimiento</div>
          </div>
        </div>
        <div className="summary-card">
          <div className="summary-icon"><FiSearch /></div>
          <div className="summary-info">
            <div className="summary-value">{laboratoriosFiltrados.length}</div>
            <div className="summary-label">Resultados</div>
          </div>
        </div>
      </div>

      {/* Tabla de laboratorios */}
      <div className="table-container">
        <table className="laboratorios-table">
          <thead>
            <tr>
              <th>Código</th>
              <th>Nombre</th>
              <th>Ubicación</th>
              <th>Capacidad</th>
              <th>Estado</th>
              <th>Estado Sistema</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {laboratoriosFiltrados.length === 0 ? (
              <tr>
                <td colSpan={7} className="no-data">
                  No se encontraron laboratorios
                </td>
              </tr>
            ) : (
              laboratoriosFiltrados.map(lab => (
                <tr key={lab.id}>
                  <td>
                    <span className="lab-codigo">{lab.codigo}</span>
                  </td>
                  <td>
                    <div className="lab-name">{lab.nombre}</div>
                  </td>
                  <td>{lab.ubicacion}</td>
                  <td>
                    <span className="capacidad-badge">
                      <FiUsers /> {lab.capacidad} personas
                    </span>
                  </td>
                  <td>
                    <span className={`badge badge-estado-${typeof lab.estado === 'string' ? lab.estado.toLowerCase().replace(/ /g, '-') : 'disponible'}`}>
                      {lab.estado || 'Disponible'}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${lab.activo ? 'badge-active' : 'badge-inactive'}`}>
                      {lab.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button 
                        className="btn-icon btn-toggle"
                        onClick={() => toggleEstadoLaboratorio(lab)}
                        title={lab.activo ? 'Desactivar' : 'Activar'}
                      >
                        {lab.activo ? <FiXCircle /> : <FiCheckCircle />}
                      </button>
                      <button 
                        className="btn-icon btn-edit"
                        onClick={() => navigate(`/admin/laboratorios/editar/${lab.id}`)}
                        title="Editar"
                      >
                        <FiEdit />
                      </button>
                      <button
                        className="btn-icon btn-delete"
                        onClick={() => eliminarLaboratorio(lab.id, lab.nombre)}
                        title="Eliminar"
                      >
                        <FiTrash2 />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default GestionLaboratorios;
