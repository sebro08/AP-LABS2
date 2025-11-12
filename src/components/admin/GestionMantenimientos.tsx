import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs, getDoc, doc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { MantenimientoDetalle } from '../../types/Mantenimiento';
import { FiTool, FiCheckCircle, FiSearch, FiEye, FiCalendar } from 'react-icons/fi';
import './GestionMantenimientos.css';

const GestionMantenimientos = () => {
  const navigate = useNavigate();
  const [mantenimientos, setMantenimientos] = useState<MantenimientoDetalle[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEstado, setFilterEstado] = useState('todos');
  const [filterTipo, setFilterTipo] = useState('todos');

  useEffect(() => {
    cargarMantenimientos();
  }, []);

  const cargarMantenimientos = async () => {
    setLoading(true);
    try {
      console.log('🔄 Cargando mantenimientos...');

      const mantenimientosSnapshot = await getDocs(collection(db, 'mantenimiento'));
      console.log(`${mantenimientosSnapshot.docs.length} mantenimientos encontrados`);

      const mantenimientosDetalle: MantenimientoDetalle[] = [];

      for (const docSnap of mantenimientosSnapshot.docs) {
        const data = docSnap.data();
        
        try {
          // Obtener nombre del recurso
          let nombreRecurso = 'Recurso desconocido';
          if (data.id_recurso) {
            const recursoDoc = await getDoc(doc(db, 'recurso', data.id_recurso));
            nombreRecurso = recursoDoc.exists() ? recursoDoc.data().nombre : 'Recurso desconocido';
          }

          // Obtener nombre del técnico
          let nombreTecnico = 'No asignado';
          if (data.id_tecnico) {
            const tecnicoDoc = await getDoc(doc(db, 'usuarios', data.id_tecnico));
            if (tecnicoDoc.exists()) {
              const tecnicoData = tecnicoDoc.data();
              nombreTecnico = `${tecnicoData.primer_nombre} ${tecnicoData.primer_apellido}`;
            }
          }

          // Obtener tipo de mantenimiento
          let tipoMantenimiento = 'No especificado';
          if (data.id_tipo_mantenimiento) {
            const tipoDoc = await getDoc(doc(db, 'tipo_mantenimiento', data.id_tipo_mantenimiento));
            tipoMantenimiento = tipoDoc.exists() ? tipoDoc.data().nombre : 'No especificado';
          }

          // Obtener estado
          let estadoNombre = 'Sin estado';
          if (data.id_estado) {
            const estadoDoc = await getDoc(doc(db, 'estado', data.id_estado));
            estadoNombre = estadoDoc.exists() ? estadoDoc.data().nombre : 'Sin estado';
          }

          mantenimientosDetalle.push({
            id: docSnap.id,
            id_recurso: data.id_recurso || '',
            id_tipo_mantenimiento: data.id_tipo_mantenimiento || '',
            fecha_programada: data.fecha_programada || '',
            fecha_realizada: data.fecha_realizada || '',
            detalle: data.detalle || '',
            repuestos_usados: data.repuestos_usados || '',
            id_tecnico: data.id_tecnico || '',
            id_estado: data.id_estado || '',
            nombreRecurso,
            nombreTecnico,
            tipoMantenimiento,
            estadoNombre
          });
        } catch (err) {
          console.error('Error procesando mantenimiento:', docSnap.id, err);
        }
      }

      // Ordenar por fecha (más recientes primero)
      mantenimientosDetalle.sort((a, b) => {
        const fechaA = a.fecha_realizada || a.fecha_programada || '';
        const fechaB = b.fecha_realizada || b.fecha_programada || '';
        return fechaB.localeCompare(fechaA);
      });

      setMantenimientos(mantenimientosDetalle);
      console.log(`${mantenimientosDetalle.length} mantenimientos cargados`);
      setLoading(false);
    } catch (error: any) {
      console.error('Error cargando mantenimientos:', error);
      alert('Error al cargar los mantenimientos: ' + error.message);
      setLoading(false);
    }
  };

  const mantenimientosFiltrados = mantenimientos.filter(mant => {
    const matchSearch = mant.nombreRecurso.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       mant.nombreTecnico.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       mant.tipoMantenimiento.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       mant.detalle.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchEstado = filterEstado === 'todos' || mant.id_estado === filterEstado;
    const matchTipo = filterTipo === 'todos' || mant.id_tipo_mantenimiento === filterTipo;

    return matchSearch && matchEstado && matchTipo;
  });

  const tiposUnicos = Array.from(new Set(mantenimientos.map(m => m.id_tipo_mantenimiento)));
  const estadosUnicos = Array.from(new Set(mantenimientos.map(m => m.id_estado)));

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Cargando mantenimientos...</p>
      </div>
    );
  }

  return (
    <div className="gestion-mantenimientos">
      <div className="page-header">
        <h1><FiTool className="header-icon" /> Gestión de Mantenimientos</h1>
        <div className="header-buttons">
          <button className="btn-secondary" onClick={() => navigate('/admin/mantenimientos/programar')}>
            📅 Programar Mantenimiento
          </button>
          <button className="btn-primary" onClick={() => navigate('/admin/mantenimientos/registrar')}>
            <FiCheckCircle /> Registrar Mantenimiento
          </button>
        </div>
      </div>

      <div className="filters-section">
        <div className="search-box">
          <input
            type="text"
            placeholder="Buscar por recurso, técnico, tipo o detalles..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="filters-row">
          <div className="filter-group">
            <label>Estado:</label>
            <select value={filterEstado} onChange={(e) => setFilterEstado(e.target.value)}>
              <option value="todos">Todos</option>
              {estadosUnicos.map(estadoId => {
                const mant = mantenimientos.find(m => m.id_estado === estadoId);
                return mant ? (
                  <option key={estadoId} value={estadoId}>
                    {mant.estadoNombre}
                  </option>
                ) : null;
              })}
            </select>
          </div>

          <div className="filter-group">
            <label>Tipo:</label>
            <select value={filterTipo} onChange={(e) => setFilterTipo(e.target.value)}>
              <option value="todos">Todos los Tipos</option>
              {tiposUnicos.map(tipoId => {
                const mant = mantenimientos.find(m => m.id_tipo_mantenimiento === tipoId);
                return mant ? (
                  <option key={tipoId} value={tipoId}>
                    {mant.tipoMantenimiento}
                  </option>
                ) : null;
              })}
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
          <div className="summary-icon"><FiTool /></div>
          <div className="summary-info">
            <div className="summary-value">{mantenimientos.length}</div>
            <div className="summary-label">Total Mantenimientos</div>
          </div>
        </div>
        <div className="summary-card">
          <div className="summary-icon"><FiCheckCircle /></div>
          <div className="summary-info">
            <div className="summary-value">
              {mantenimientos.filter(m => m.id_estado === '1').length}
            </div>
            <div className="summary-label">Completados</div>
          </div>
        </div>
        <div className="summary-card">
          <div className="summary-icon">📅</div>
          <div className="summary-info">
            <div className="summary-value">
              {mantenimientos.filter(m => m.id_estado === '3').length}
            </div>
            <div className="summary-label">Programados</div>
          </div>
        </div>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Recurso</th>
              <th>Tipo</th>
              <th>Técnico Responsable</th>
              <th>Fecha Programada</th>
              <th>Fecha Realizada</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {mantenimientosFiltrados.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '30px' }}>
                  No se encontraron mantenimientos
                </td>
              </tr>
            ) : (
              mantenimientosFiltrados.map((mant) => (
                <tr key={mant.id}>
                  <td>
                    <strong>{mant.nombreRecurso}</strong>
                  </td>
                  <td>
                    <span className="tipo-badge">{mant.tipoMantenimiento}</span>
                  </td>
                  <td>{mant.nombreTecnico}</td>
                  <td>{mant.fecha_programada || '-'}</td>
                  <td>{mant.fecha_realizada || '-'}</td>
                  <td>
                    <span className={`estado-badge estado-${mant.id_estado}`}>
                      {mant.estadoNombre}
                    </span>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button
                        className="btn-icon btn-view"
                        onClick={() => navigate(`/admin/mantenimientos/detalle/${mant.id}`)}
                        title="Ver Detalles"
                      >
                        <FiEye />
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

export default GestionMantenimientos;
