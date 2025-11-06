import { useState, useEffect } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useAuth } from '../../context/AuthContext';
import './UserHistorial.css';

interface HistorialItem {
  id: string;
  tipo: 'laboratorio' | 'recurso';
  nombre: string;
  fecha_reserva: string;
  fecha_devolucion: string;
  fecha_devolucion_real?: string;
  cantidad?: number;
  unidad?: string;
  horarios?: string;
  participantes?: number;
  motivo: string;
  comentario?: string;
  estado: number;
}

const UserHistorial = () => {
  const { user } = useAuth();
  const [historial, setHistorial] = useState<HistorialItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTipo, setFilterTipo] = useState<'todos' | 'laboratorio' | 'recurso'>('todos');
  const [showDetalle, setShowDetalle] = useState(false);
  const [itemSeleccionado, setItemSeleccionado] = useState<HistorialItem | null>(null);

  useEffect(() => {
    if (user) {
      cargarHistorial();
    }
  }, [user]);

  const cargarHistorial = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const historialData: HistorialItem[] = [];

      // Cargar historial de laboratorios (estado = 2 significa devuelto/completado)
      const labsQuery = query(
        collection(db, 'reserva_labs'),
        where('id_usuario', '==', user.uid),
        where('estado', '==', 2)
      );
      const labsSnapshot = await getDocs(labsQuery);

      for (const docSnap of labsSnapshot.docs) {
        const data = docSnap.data();
        
        // Obtener datos del laboratorio
        const labDoc = await getDocs(collection(db, 'laboratorios'));
        const lab = labDoc.docs.find(doc => doc.id === data.id_lab);
        const labData = lab?.data();

        // Formatear horarios
        const horariosStr = data.horarios?.map((h: any) => 
          `${h.hora_inicio}-${h.hora_fin}`
        ).join(', ') || 'N/A';

        historialData.push({
          id: docSnap.id,
          tipo: 'laboratorio',
          nombre: labData?.nombre || 'Laboratorio desconocido',
          fecha_reserva: data.dia || '',
          fecha_devolucion: data.dia || '',
          fecha_devolucion_real: data.fecha_devolucion_real || '',
          horarios: horariosStr,
          participantes: data.participantes || 0,
          motivo: data.motivo || '',
          comentario: data.comentario || '',
          estado: data.estado
        });
      }

      // Cargar historial de recursos (estado = 2 significa devuelto/completado)
      const recursosQuery = query(
        collection(db, 'reserva_recurso'),
        where('id_usuario', '==', user.uid),
        where('estado', '==', 2)
      );
      const recursosSnapshot = await getDocs(recursosQuery);

      // Cargar medidas para los recursos
      const medidasSnapshot = await getDocs(collection(db, 'medida'));
      const medidasMap = new Map();
      medidasSnapshot.docs.forEach(doc => {
        medidasMap.set(doc.id, doc.data().nombre);
      });

      for (const docSnap of recursosSnapshot.docs) {
        const data = docSnap.data();
        
        // Obtener datos del recurso
        const recursoDoc = await getDocs(collection(db, 'recurso'));
        const recurso = recursoDoc.docs.find(doc => doc.id === data.id_recurso);
        const recursoData = recurso?.data();

        historialData.push({
          id: docSnap.id,
          tipo: 'recurso',
          nombre: recursoData?.nombre || 'Recurso desconocido',
          fecha_reserva: data.fecha_reserva || '',
          fecha_devolucion: data.fecha_devolucion || '',
          fecha_devolucion_real: data.fecha_devolucion_real || '',
          cantidad: data.cantidad || 0,
          unidad: medidasMap.get(data.id_medida) || '',
          motivo: data.motivo || '',
          comentario: data.comentario || '',
          estado: data.estado
        });
      }

      // Ordenar por fecha de devolución real más reciente
      historialData.sort((a, b) => {
        const fechaA = a.fecha_devolucion_real || a.fecha_devolucion;
        const fechaB = b.fecha_devolucion_real || b.fecha_devolucion;
        return new Date(fechaB).getTime() - new Date(fechaA).getTime();
      });

      setHistorial(historialData);
    } catch (error) {
      console.error('Error cargando historial:', error);
      alert('Error al cargar el historial');
    } finally {
      setLoading(false);
    }
  };

  const formatearFecha = (fecha: string) => {
    if (!fecha) return 'N/A';
    try {
      // Si es una fecha ISO
      if (fecha.includes('T')) {
        return new Date(fecha).toLocaleDateString('es-ES', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit'
        });
      }
      // Si es formato DD/MM/YYYY
      if (fecha.includes('/')) {
        return fecha;
      }
      // Si es formato YYYY-MM-DD
      const [year, month, day] = fecha.split('-');
      return `${day}/${month}/${year}`;
    } catch (error) {
      return fecha;
    }
  };

  const handleVerDetalle = (item: HistorialItem) => {
    setItemSeleccionado(item);
    setShowDetalle(true);
  };

  const historialFiltrado = historial.filter(item => {
    const matchSearch = item.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       item.motivo.toLowerCase().includes(searchTerm.toLowerCase());
    const matchTipo = filterTipo === 'todos' || item.tipo === filterTipo;
    return matchSearch && matchTipo;
  });

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Cargando historial...</p>
      </div>
    );
  }

  return (
    <div className="user-historial">
      <div className="historial-header">
        <h1>📊 Historial de Uso</h1>
        <p className="subtitle">Consulta tu historial de reservas completadas</p>
      </div>

      {/* Filtros */}
      <div className="filtros-section">
        <div className="search-box">
          <input
            type="text"
            placeholder="🔍 Buscar por nombre o motivo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="filter-group">
          <label>Tipo:</label>
          <select value={filterTipo} onChange={(e) => setFilterTipo(e.target.value as any)}>
            <option value="todos">Todos</option>
            <option value="laboratorio">Laboratorios</option>
            <option value="recurso">Recursos</option>
          </select>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="stats-cards">
        <div className="stat-card">
          <div className="stat-icon">🏢</div>
          <div className="stat-info">
            <h3>{historial.filter(h => h.tipo === 'laboratorio').length}</h3>
            <p>Laboratorios Usados</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📦</div>
          <div className="stat-info">
            <h3>{historial.filter(h => h.tipo === 'recurso').length}</h3>
            <p>Recursos Usados</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">✅</div>
          <div className="stat-info">
            <h3>{historial.length}</h3>
            <p>Total Devoluciones</p>
          </div>
        </div>
      </div>

      {/* Lista de historial */}
      <div className="historial-list">
        {historialFiltrado.length > 0 ? (
          historialFiltrado.map(item => (
            <div key={item.id} className="historial-item">
              <div className="item-icon">
                {item.tipo === 'laboratorio' ? '🏢' : '📦'}
              </div>
              <div className="item-content">
                <div className="item-header">
                  <h3>{item.nombre}</h3>
                  <span className={`badge badge-${item.tipo}`}>
                    {item.tipo === 'laboratorio' ? 'Laboratorio' : 'Recurso'}
                  </span>
                </div>
                <div className="item-details">
                  {item.tipo === 'laboratorio' ? (
                    <>
                      <p><strong>📅 Fecha:</strong> {formatearFecha(item.fecha_reserva)}</p>
                      <p><strong>🕐 Horarios:</strong> {item.horarios}</p>
                      <p><strong>👥 Participantes:</strong> {item.participantes}</p>
                    </>
                  ) : (
                    <>
                      <p><strong>📅 Reserva:</strong> {formatearFecha(item.fecha_reserva)}</p>
                      <p><strong>📅 Devolución:</strong> {formatearFecha(item.fecha_devolucion)}</p>
                      <p><strong>📊 Cantidad:</strong> {item.cantidad} {item.unidad}</p>
                    </>
                  )}
                  {item.fecha_devolucion_real && (
                    <p><strong>✅ Devuelto:</strong> {formatearFecha(item.fecha_devolucion_real)}</p>
                  )}
                </div>
              </div>
              <button 
                className="btn-ver-detalle"
                onClick={() => handleVerDetalle(item)}
              >
                Ver Detalle
              </button>
            </div>
          ))
        ) : (
          <div className="no-results">
            <p>📭 No se encontraron registros en el historial</p>
            {searchTerm && (
              <button className="btn-clear" onClick={() => setSearchTerm('')}>
                Limpiar búsqueda
              </button>
            )}
          </div>
        )}
      </div>

      {/* Modal de detalle */}
      {showDetalle && itemSeleccionado && (
        <div className="modal-overlay" onClick={() => setShowDetalle(false)}>
          <div className="modal-detalle" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>
                {itemSeleccionado.tipo === 'laboratorio' ? '🏢' : '📦'} 
                {' '}{itemSeleccionado.nombre}
              </h2>
              <button className="btn-close" onClick={() => setShowDetalle(false)}>✕</button>
            </div>

            <div className="modal-body">
              <div className="detalle-section">
                <h3>📋 Información General</h3>
                <div className="detalle-grid">
                  <div className="detalle-item">
                    <strong>Tipo:</strong>
                    <span className={`badge badge-${itemSeleccionado.tipo}`}>
                      {itemSeleccionado.tipo === 'laboratorio' ? 'Laboratorio' : 'Recurso'}
                    </span>
                  </div>
                  <div className="detalle-item">
                    <strong>Estado:</strong>
                    <span className="badge badge-completado">✅ Completado</span>
                  </div>
                </div>
              </div>

              <div className="detalle-section">
                <h3>📅 Fechas</h3>
                <div className="detalle-grid">
                  <div className="detalle-item">
                    <strong>Fecha de Reserva:</strong>
                    <span>{formatearFecha(itemSeleccionado.fecha_reserva)}</span>
                  </div>
                  {itemSeleccionado.tipo === 'recurso' && (
                    <div className="detalle-item">
                      <strong>Fecha de Devolución Programada:</strong>
                      <span>{formatearFecha(itemSeleccionado.fecha_devolucion)}</span>
                    </div>
                  )}
                  {itemSeleccionado.fecha_devolucion_real && (
                    <div className="detalle-item">
                      <strong>Fecha de Devolución Real:</strong>
                      <span>{formatearFecha(itemSeleccionado.fecha_devolucion_real)}</span>
                    </div>
                  )}
                </div>
              </div>

              {itemSeleccionado.tipo === 'laboratorio' ? (
                <div className="detalle-section">
                  <h3>🏢 Detalles del Laboratorio</h3>
                  <div className="detalle-grid">
                    <div className="detalle-item">
                      <strong>Horarios:</strong>
                      <span>{itemSeleccionado.horarios}</span>
                    </div>
                    <div className="detalle-item">
                      <strong>Participantes:</strong>
                      <span>{itemSeleccionado.participantes} personas</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="detalle-section">
                  <h3>📦 Detalles del Recurso</h3>
                  <div className="detalle-grid">
                    <div className="detalle-item">
                      <strong>Cantidad:</strong>
                      <span>{itemSeleccionado.cantidad} {itemSeleccionado.unidad}</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="detalle-section">
                <h3>📝 Motivo</h3>
                <p className="motivo-text">{itemSeleccionado.motivo}</p>
              </div>

              {itemSeleccionado.comentario && (
                <div className="detalle-section">
                  <h3>💬 Comentarios</h3>
                  <p className="comentario-text">{itemSeleccionado.comentario}</p>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button className="btn-cerrar" onClick={() => setShowDetalle(false)}>
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserHistorial;
