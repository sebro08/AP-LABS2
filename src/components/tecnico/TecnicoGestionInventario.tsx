import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs, doc, deleteDoc, query, orderBy } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { Inventario, Estado, TipoRecurso, Medida } from '../../types/Inventario';
import { FiPackage, FiCheckCircle, FiTool, FiSearch, FiEdit, FiTrash2, FiPlus } from 'react-icons/fi';
import './TecnicoGestionInventario.css';

const TecnicoGestionInventario = () => {
  const navigate = useNavigate();
  const [recursos, setRecursos] = useState<Inventario[]>([]);
  const [estados, setEstados] = useState<Estado[]>([]);
  const [tiposRecurso, setTiposRecurso] = useState<TipoRecurso[]>([]);
  const [medidas, setMedidas] = useState<Medida[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEstado, setFilterEstado] = useState('todos');
  const [filterTipo, setFilterTipo] = useState('todos');

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    setLoading(true);
    try {
      console.log('Cargando datos de inventario...');

      // Cargar recursos
      const recursosQuery = query(collection(db, 'recurso'), orderBy('nombre'));
      const recursosSnapshot = await getDocs(recursosQuery);
      const recursosData = recursosSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Inventario));

      // Cargar estados
      const estadosSnapshot = await getDocs(collection(db, 'estado'));
      const estadosData = estadosSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Estado));

      // Cargar tipos de recurso
      const tiposSnapshot = await getDocs(collection(db, 'tipo_recurso'));
      const tiposData = tiposSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as TipoRecurso));

      // Cargar medidas
      const medidasSnapshot = await getDocs(collection(db, 'medida'));
      const medidasData = medidasSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Medida));

      setRecursos(recursosData);
      setEstados(estadosData);
      setTiposRecurso(tiposData);
      setMedidas(medidasData);

      console.log(`${recursosData.length} recursos cargados`);
      console.log(`${estadosData.length} estados, ${tiposData.length} tipos, ${medidasData.length} medidas`);

      setLoading(false);
    } catch (error: any) {
      console.error('Error cargando datos:', error);
      alert('Error al cargar los datos: ' + error.message);
      setLoading(false);
    }
  };

  const eliminarRecurso = async (id: string, nombre: string) => {
    if (!window.confirm(`¿Está seguro de eliminar el recurso "${nombre}"?`)) {
      return;
    }

    try {
      await deleteDoc(doc(db, 'recurso', id));
      console.log('Recurso eliminado');
      cargarDatos();
    } catch (error: any) {
      console.error('Error eliminando recurso:', error);
      alert('Error al eliminar: ' + error.message);
    }
  };

  const getNombreEstado = (id: string) => {
    const estado = estados.find(e => e.id === id);
    return estado ? estado.nombre : 'N/A';
  };

  const getNombreTipo = (id: string) => {
    const tipo = tiposRecurso.find(t => t.id === id);
    return tipo ? tipo.nombre : 'N/A';
  };

  const getNombreMedida = (id: string) => {
    const medida = medidas.find(m => m.id === id);
    return medida ? medida.nombre : 'N/A';
  };

  const getEstadoClass = (nombreEstado: string) => {
    const estado = nombreEstado.toLowerCase();
    if (estado.includes('disponible')) return 'badge-estado-disponible';
    if (estado.includes('mantenimiento')) return 'badge-estado-en-mantenimiento';
    if (estado.includes('fuera')) return 'badge-estado-fuera-de-servicio';
    if (estado.includes('reservado')) return 'badge-estado-reservado';
    return 'badge-estado-disponible';
  };

  const recursosFiltrados = recursos.filter(recurso => {
    const matchSearch = recurso.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       recurso.codigo_inventario.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       recurso.descripcion.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchEstado = filterEstado === 'todos' || recurso.id_estado === filterEstado;
    const matchTipo = filterTipo === 'todos' || recurso.id_tipo_recurso === filterTipo;

    return matchSearch && matchEstado && matchTipo;
  });

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Cargando inventario...</p>
      </div>
    );
  }

  return (
    <div className="tecnico-gestion-inventario">
      <div className="page-header">
        <h1><FiPackage className="header-icon" /> Gestión de Inventario</h1>
        <button className="btn-primary" onClick={() => navigate('/tecnico/inventario/nuevo')}>
          <FiPlus /> Nuevo Recurso
        </button>
      </div>

      <div className="filters-section">
        <div className="search-box">
          <FiSearch className="search-icon" />
          <input
            type="text"
            placeholder="Buscar por nombre, código o descripción..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="filters-row">
          <div className="filter-group">
            <label>Estado:</label>
            <select value={filterEstado} onChange={(e) => setFilterEstado(e.target.value)}>
              <option value="todos">Todos los Estados</option>
              {estados.map(estado => (
                <option key={estado.id} value={estado.id}>
                  {estado.nombre}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>Tipo de Recurso:</label>
            <select value={filterTipo} onChange={(e) => setFilterTipo(e.target.value)}>
              <option value="todos">Todos los Tipos</option>
              {tiposRecurso.map(tipo => (
                <option key={tipo.id} value={tipo.id}>
                  {tipo.nombre}
                </option>
              ))}
            </select>
          </div>

          {(searchTerm || filterEstado !== 'todos' || filterTipo !== 'todos') && (
            <button
              className="btn-clear-filters"
              onClick={() => {
                setSearchTerm('');
                setFilterEstado('todos');
                setFilterTipo('todos');
              }}
            >
              Limpiar Filtros
            </button>
          )}
        </div>
      </div>

      <div className="summary-cards">
        <div className="summary-card">
          <div className="summary-icon"><FiPackage /></div>
          <div className="summary-info">
            <div className="summary-value">{recursos.length}</div>
            <div className="summary-label">Total Recursos</div>
          </div>
        </div>
        <div className="summary-card">
          <div className="summary-icon"><FiCheckCircle /></div>
          <div className="summary-info">
            <div className="summary-value">
              {recursos.filter(r => r.id_estado === '1').length}
            </div>
            <div className="summary-label">Disponibles</div>
          </div>
        </div>
        <div className="summary-card">
          <div className="summary-icon"><FiTool /></div>
          <div className="summary-info">
            <div className="summary-value">
              {recursos.filter(r => r.id_estado === '2').length}
            </div>
            <div className="summary-label">En Uso</div>
          </div>
        </div>
        <div className="summary-card">
          <div className="summary-icon"><FiSearch /></div>
          <div className="summary-info">
            <div className="summary-value">{recursosFiltrados.length}</div>
            <div className="summary-label">Resultados</div>
          </div>
        </div>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Código</th>
              <th>Nombre</th>
              <th>Tipo</th>
              <th>Cantidad</th>
              <th>Medida</th>
              <th>Estado</th>
              <th>Último Mantenimiento</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {recursosFiltrados.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: '30px' }}>
                  No se encontraron recursos
                </td>
              </tr>
            ) : (
              recursosFiltrados.map((recurso) => (
                <tr key={recurso.id}>
                  <td>
                    <span className="recurso-codigo">{recurso.codigo_inventario}</span>
                  </td>
                  <td>
                    <strong>{recurso.nombre}</strong>
                    {recurso.descripcion && (
                      <div style={{ fontSize: '0.85em', color: '#666' }}>
                        {recurso.descripcion.substring(0, 50)}
                        {recurso.descripcion.length > 50 ? '...' : ''}
                      </div>
                    )}
                  </td>
                  <td>{getNombreTipo(recurso.id_tipo_recurso)}</td>
                  <td style={{ textAlign: 'center' }}>
                    <strong>{recurso.cantidad}</strong>
                  </td>
                  <td>{getNombreMedida(recurso.id_medida)}</td>
                  <td>
                    <span className={`badge ${getEstadoClass(getNombreEstado(recurso.id_estado))}`}>
                      {getNombreEstado(recurso.id_estado)}
                    </span>
                  </td>
                  <td>{recurso.fecha_ultimo_mantenimiento || 'N/A'}</td>
                  <td>
                    <div className="action-buttons">
                      <button
                        className="btn-icon btn-edit"
                        onClick={() => navigate(`/tecnico/inventario/editar/${recurso.id}`)}
                        title="Editar"
                      >
                        <FiEdit />
                      </button>
                      <button
                        className="btn-icon btn-delete"
                        onClick={() => eliminarRecurso(recurso.id, recurso.nombre)}
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

export default TecnicoGestionInventario;
