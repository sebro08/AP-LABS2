import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../firebase/config';
import './TecnicoDashboard.css';

const TecnicoDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    solicitudesPendientes: 0,
    mantenimientosPendientes: 0,
    inventarioTotal: 0,
    mantenimientosHoy: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cargarEstadisticas();
  }, []);

  const cargarEstadisticas = async () => {
    try {
      // Contar solicitudes pendientes (laboratorios + recursos)
      const solicitudesLabsSnapshot = await getDocs(
        query(collection(db, 'solicitudes_labs'), where('estado_solicitud', '==', 'pendiente'))
      );
      const solicitudesRecursosSnapshot = await getDocs(
        query(collection(db, 'solicitudes_recursos'), where('estado_solicitud', '==', 'pendiente'))
      );
      const totalSolicitudes = solicitudesLabsSnapshot.size + solicitudesRecursosSnapshot.size;

      // Contar mantenimientos pendientes
      const mantenimientosSnapshot = await getDocs(collection(db, 'mantenimientos'));
      const mantenimientosPendientes = mantenimientosSnapshot.docs.filter(doc => {
        const data = doc.data();
        return data.estado?.toLowerCase() === 'pendiente' || data.estado?.toLowerCase() === 'programado';
      }).length;

      // Contar mantenimientos de hoy
      const hoy = new Date().toLocaleDateString('es-ES');
      const mantenimientosHoy = mantenimientosSnapshot.docs.filter(doc => {
        const data = doc.data();
        const fechaMantenimiento = data.fecha_mantenimiento;
        if (fechaMantenimiento) {
          try {
            const fecha = new Date(fechaMantenimiento).toLocaleDateString('es-ES');
            return fecha === hoy;
          } catch {
            return false;
          }
        }
        return false;
      }).length;

      // Contar inventario total
      const inventarioSnapshot = await getDocs(collection(db, 'recurso'));
      const inventarioTotal = inventarioSnapshot.size;

      setStats({
        solicitudesPendientes: totalSolicitudes,
        mantenimientosPendientes,
        inventarioTotal,
        mantenimientosHoy
      });
    } catch (error) {
      console.error('Error cargando estadísticas:', error);
    } finally {
      setLoading(false);
    }
  };

  const dashboardCards = [
    {
      id: 'solicitudes',
      title: 'Gestión de Solicitudes',
      icon: '📋',
      description: 'Ver y gestionar solicitudes',
      color: '#667eea',
      path: '/tecnico/solicitudes',
      stat: stats.solicitudesPendientes,
      statLabel: 'Pendientes'
    },
    {
      id: 'mantenimientos',
      title: 'Gestión de Mantenimientos',
      icon: '🔧',
      description: 'Programar y registrar mantenimientos',
      color: '#f59e0b',
      path: '/tecnico/mantenimientos',
      stat: stats.mantenimientosPendientes,
      statLabel: 'Por realizar'
    },
    {
      id: 'inventario',
      title: 'Gestión de Inventario',
      icon: '📦',
      description: 'Consultar inventario de recursos',
      color: '#10b981',
      path: '/tecnico/inventario',
      stat: stats.inventarioTotal,
      statLabel: 'Recursos'
    }
  ];

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Cargando dashboard...</p>
      </div>
    );
  }

  return (
    <div className="tecnico-dashboard">
      <div className="dashboard-header">
        <h1>🔧 Panel de Técnico</h1>
        <p className="subtitle">Gestiona las operaciones técnicas del sistema</p>
      </div>

      {/* Tarjetas de estadísticas rápidas */}
      <div className="stats-grid">
        <div className="stat-card blue">
          <div className="stat-icon">📋</div>
          <div className="stat-content">
            <h3>{stats.solicitudesPendientes}</h3>
            <p>Solicitudes Pendientes</p>
          </div>
        </div>
        <div className="stat-card orange">
          <div className="stat-icon">⏰</div>
          <div className="stat-content">
            <h3>{stats.mantenimientosHoy}</h3>
            <p>Mantenimientos Hoy</p>
          </div>
        </div>
        <div className="stat-card green">
          <div className="stat-icon">🔧</div>
          <div className="stat-content">
            <h3>{stats.mantenimientosPendientes}</h3>
            <p>Mantenimientos Pendientes</p>
          </div>
        </div>
        <div className="stat-card purple">
          <div className="stat-icon">📦</div>
          <div className="stat-content">
            <h3>{stats.inventarioTotal}</h3>
            <p>Recursos en Inventario</p>
          </div>
        </div>
      </div>

      {/* Tarjetas de navegación */}
      <div className="dashboard-grid">
        {dashboardCards.map((card) => (
          <div
            key={card.id}
            className="dashboard-card"
            onClick={() => navigate(card.path)}
            style={{ borderLeftColor: card.color }}
          >
            <div className="card-icon" style={{ background: `${card.color}20` }}>
              {card.icon}
            </div>
            <div className="card-content">
              <h3>{card.title}</h3>
              <p>{card.description}</p>
              {card.stat !== undefined && (
                <div className="card-stat">
                  <span className="stat-number">{card.stat}</span>
                  <span className="stat-label">{card.statLabel}</span>
                </div>
              )}
            </div>
            <div className="card-arrow">→</div>
          </div>
        ))}
      </div>

      {/* Recordatorios */}
      <div className="reminders-section">
        <h2>📌 Recordatorios</h2>
        <div className="reminders-grid">
          {stats.mantenimientosHoy > 0 && (
            <div className="reminder-card warning">
              <span className="reminder-icon">⏰</span>
              <div className="reminder-content">
                <h4>Mantenimientos Programados Hoy</h4>
                <p>Tienes {stats.mantenimientosHoy} mantenimiento(s) programado(s) para hoy</p>
              </div>
            </div>
          )}
          {stats.solicitudesPendientes > 0 && (
            <div className="reminder-card info">
              <span className="reminder-icon">📋</span>
              <div className="reminder-content">
                <h4>Solicitudes Pendientes</h4>
                <p>Hay {stats.solicitudesPendientes} solicitud(es) esperando revisión</p>
              </div>
            </div>
          )}
          {stats.mantenimientosPendientes > 0 && (
            <div className="reminder-card alert">
              <span className="reminder-icon">🔧</span>
              <div className="reminder-content">
                <h4>Mantenimientos Pendientes</h4>
                <p>{stats.mantenimientosPendientes} mantenimiento(s) por completar</p>
              </div>
            </div>
          )}
          {stats.mantenimientosHoy === 0 && stats.solicitudesPendientes === 0 && stats.mantenimientosPendientes === 0 && (
            <div className="reminder-card success">
              <span className="reminder-icon">✅</span>
              <div className="reminder-content">
                <h4>Todo al día</h4>
                <p>No hay tareas pendientes por el momento</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TecnicoDashboard;
