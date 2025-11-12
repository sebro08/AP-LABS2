import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { Departamento } from '../../types/Departamento';
import { FiBox, FiCheckCircle, FiXCircle, FiSearch, FiEdit, FiTrash2, FiAlertCircle, FiPlus } from 'react-icons/fi';
import './GestionDepartamentos.css';

const GestionDepartamentos = () => {
  const navigate = useNavigate();
  const [departamentos, setDepartamentos] = useState<Departamento[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterActivo, setFilterActivo] = useState('');

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    console.log('🔄 [INICIO] Cargando departamentos...');
    setLoading(true);
    setError('');
    try {
      const deptosSnapshot = await getDocs(collection(db, 'departamentos'));
      console.log('Snapshot obtenido, total documentos:', deptosSnapshot.size);
      
      const deptosData = deptosSnapshot.docs.map(doc => {
        const data = doc.data();
        console.log('Procesando doc ID:', doc.id, 'Data:', data);
        
        return {
          id: doc.id,
          nombre: String(data.nombre || ''),
          codigo: String(data.codigo || ''),
          descripcion: String(data.descripcion || ''),
          jefe: String(data.jefe || ''),
          telefono: String(data.telefono || ''),
          email: String(data.email || ''),
          activo: data.activo !== undefined ? data.activo : true,
          fecha_creacion: String(data.fecha_creacion || '')
        } as Departamento;
      });

      console.log('Departamentos procesados:', deptosData);
      setDepartamentos(deptosData);
      setLoading(false);
      console.log('[FIN] Carga completada exitosamente');
    } catch (err: any) {
      console.error('[ERROR] Error en cargarDatos:', err);
      console.error('Mensaje:', err.message);
      setError('Error al cargar los departamentos: ' + err.message);
      setLoading(false);
    }
  };

  const toggleEstadoDepartamento = async (depto: Departamento) => {
    try {
      const nuevoEstado = !depto.activo;
      await updateDoc(doc(db, 'departamentos', depto.id), {
        activo: nuevoEstado
      });

      setDepartamentos(departamentos.map(d => 
        d.id === depto.id ? { ...d, activo: nuevoEstado } : d
      ));

      console.log(`Departamento ${nuevoEstado ? 'activado' : 'desactivado'}`);
    } catch (error) {
      console.error('Error cambiando estado:', error);
      setError('Error al cambiar el estado del departamento');
    }
  };

  const eliminarDepartamento = async (deptoId: string, nombreDepto: string) => {
    const confirmar = window.confirm(`¿Estás seguro que deseas eliminar el departamento "${nombreDepto}"?\n\nEsta acción no se puede deshacer.`);
    
    if (confirmar) {
      try {
        await deleteDoc(doc(db, 'departamentos', deptoId));
        
        setDepartamentos(departamentos.filter(d => d.id !== deptoId));
        
        console.log('Departamento eliminado correctamente');
      } catch (err) {
        console.error('Error al eliminar departamento:', err);
        setError('Error al eliminar el departamento');
      }
    }
  };

  const limpiarFiltros = () => {
    setSearchTerm('');
    setFilterActivo('');
  };

  // Filtrar departamentos
  const departamentosFiltrados = departamentos.filter(depto => {
    const busqueda = searchTerm.toLowerCase();
    const coincideBusqueda = 
      depto.nombre.toLowerCase().includes(busqueda) || 
      depto.codigo.toLowerCase().includes(busqueda);

    const coincideActivo = !filterActivo || 
                          (filterActivo === 'activo' && depto.activo) ||
                          (filterActivo === 'inactivo' && !depto.activo);

    return coincideBusqueda && coincideActivo;
  });

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Cargando departamentos...</p>
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
          🔄 Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="gestion-departamentos">
      {/* Header */}
      <div className="page-header">
        <h1><FiBox className="header-icon" /> Gestión de Departamentos</h1>
        <button 
          className="btn-primary"
          onClick={() => navigate('/admin/departamentos/nuevo')}
        >
          <FiPlus /> Nuevo Departamento
        </button>
      </div>

      {/* Filtros */}
      <div className="filters-section">
        <div className="search-box">
          <span className="search-icon"><FiSearch /></span>
          <input
            type="text"
            placeholder="Buscar por nombre o código..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="filters">
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
          <div className="summary-icon"><FiBox /></div>
          <div className="summary-info">
            <div className="summary-value">{departamentos.length}</div>
            <div className="summary-label">Total</div>
          </div>
        </div>
        <div className="summary-card">
          <div className="summary-icon"><FiCheckCircle /></div>
          <div className="summary-info">
            <div className="summary-value">{departamentos.filter(d => d.activo).length}</div>
            <div className="summary-label">Activos</div>
          </div>
        </div>
        <div className="summary-card">
          <div className="summary-icon"><FiXCircle /></div>
          <div className="summary-info">
            <div className="summary-value">{departamentos.filter(d => !d.activo).length}</div>
            <div className="summary-label">Inactivos</div>
          </div>
        </div>
        <div className="summary-card">
          <div className="summary-icon"><FiSearch /></div>
          <div className="summary-info">
            <div className="summary-value">{departamentosFiltrados.length}</div>
            <div className="summary-label">Resultados</div>
          </div>
        </div>
      </div>

      {/* Tabla de departamentos */}
      <div className="table-container">
        <table className="departamentos-table">
          <thead>
            <tr>
              <th>Código</th>
              <th>Nombre</th>
              <th>Teléfono</th>
              <th>Email</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {departamentosFiltrados.length === 0 ? (
              <tr>
                <td colSpan={6} className="no-data">
                  No se encontraron departamentos
                </td>
              </tr>
            ) : (
              departamentosFiltrados.map(depto => (
                <tr key={depto.id}>
                  <td>
                    <span className="depto-codigo">{depto.codigo}</span>
                  </td>
                  <td>
                    <div className="depto-name">{depto.nombre}</div>
                  </td>
                  <td>{depto.telefono || '-'}</td>
                  <td>{depto.email || '-'}</td>
                  <td>
                    <span className={`badge ${depto.activo ? 'badge-active' : 'badge-inactive'}`}>
                      {depto.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button 
                        className="btn-icon btn-toggle"
                        onClick={() => toggleEstadoDepartamento(depto)}
                        title={depto.activo ? 'Desactivar' : 'Activar'}
                      >
                        {depto.activo ? <FiXCircle /> : <FiCheckCircle />}
                      </button>
                      <button 
                        className="btn-icon btn-edit"
                        onClick={() => navigate(`/admin/departamentos/editar/${depto.id}`)}
                        title="Editar"
                      >
                        <FiEdit />
                      </button>
                      <button
                        className="btn-icon btn-delete"
                        onClick={() => eliminarDepartamento(depto.id, depto.nombre)}
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

export default GestionDepartamentos;
