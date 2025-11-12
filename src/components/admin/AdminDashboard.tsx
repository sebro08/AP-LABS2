import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { FiUsers, FiActivity, FiPackage, FiBox, FiFileText, FiTool, FiClipboard, FiTrendingUp } from 'react-icons/fi';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const navigate = useNavigate();
  
  // Estados para las estadísticas
  const [stats, setStats] = useState({
    usuariosActivos: 0,
    laboratorios: 0,
    solicitudesPendientes: 0,
    itemsInventario: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cargarEstadisticas();
  }, []);

  const cargarEstadisticas = async () => {
    try {
      setLoading(true);

      // 1. Usuarios Activos (activo = true)
      const usuariosRef = collection(db, 'usuarios');
      const qUsuariosActivos = query(usuariosRef, where('activo', '==', true));
      const usuariosSnapshot = await getDocs(qUsuariosActivos);
      const usuariosActivos = usuariosSnapshot.size;

      // 2. Total de Laboratorios
      const laboratoriosRef = collection(db, 'laboratorios');
      const laboratoriosSnapshot = await getDocs(laboratoriosRef);
      const totalLaboratorios = laboratoriosSnapshot.size;

      // 3. Solicitudes Pendientes (ambas colecciones)
      // Solicitudes de Laboratorios pendientes
      const solicitudesLabsRef = collection(db, 'solicitudes_labs');
      const qLabsPendientes = query(solicitudesLabsRef, where('estado_solicitud', '==', 'pendiente'));
      const labsPendientesSnapshot = await getDocs(qLabsPendientes);
      
      // Solicitudes de Recursos pendientes
      const solicitudesRecursosRef = collection(db, 'solicitudes_recursos');
      const qRecursosPendientes = query(solicitudesRecursosRef, where('estado_solicitud', '==', 'pendiente'));
      const recursosPendientesSnapshot = await getDocs(qRecursosPendientes);
      
      const totalSolicitudesPendientes = labsPendientesSnapshot.size + recursosPendientesSnapshot.size;

      // 4. Items en Inventario (colección recurso)
      const recursosRef = collection(db, 'recurso');
      const recursosSnapshot = await getDocs(recursosRef);
      const totalItems = recursosSnapshot.size;

      // Actualizar estados
      setStats({
        usuariosActivos,
        laboratorios: totalLaboratorios,
        solicitudesPendientes: totalSolicitudesPendientes,
        itemsInventario: totalItems
      });

    } catch (error) {
      console.error('Error cargando estadísticas del dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const dashboardCards = [
    {
      id: 'usuarios',
      title: 'Gestión de Usuarios',
      icon: <FiUsers />,
      description: 'Administrar usuarios del sistema',
      color: '#667eea',
      path: '/admin/usuarios'
    },
    {
      id: 'laboratorios',
      title: 'Gestión de Laboratorios',
      icon: <FiActivity />,
      description: 'Administrar laboratorios',
      color: '#764ba2',
      path: '/admin/laboratorios'
    },
    {
      id: 'inventario',
      title: 'Gestión de Inventario',
      icon: <FiPackage />,
      description: 'Control de recursos y materiales',
      color: '#f093fb',
      path: '/admin/inventario'
    },
    {
      id: 'departamentos',
      title: 'Gestión de Departamentos',
      icon: <FiBox />,
      description: 'Administrar áreas',
      color: '#4facfe',
      path: '/admin/departamentos'
    },
    {
      id: 'solicitudes',
      title: 'Gestión de Solicitudes',
      icon: <FiFileText />,
      description: 'Revisar y aprobar solicitudes',
      color: '#43e97b',
      path: '/admin/solicitudes'
    },
    {
      id: 'mantenimientos',
      title: 'Gestión de Mantenimientos',
      icon: <FiTool />,
      description: 'Programar mantenimientos',
      color: '#fa709a',
      path: '/admin/mantenimientos'
    },
    {
      id: 'bitacora',
      title: 'Bitácora',
      icon: <FiClipboard />,
      description: 'Registro de actividades del sistema',
      color: '#30cfd0',
      path: '/admin/bitacora'
    },
    {
      id: 'reportes',
      title: 'Reportes Generales',
      icon: <FiTrendingUp />,
      description: 'Visualizar estadísticas y reportes',
      color: '#a8edea',
      path: '/admin/reportes-generales'
    }
  ];

  return (
    <div className="admin-dashboard">
      <div className="dashboard-header">
        <h1>Panel de Administración</h1>
        <p>Bienvenido al sistema de gestión de laboratorios</p>
      </div>

      <div className="dashboard-grid">
        {dashboardCards.map((card) => (
          <div
            key={card.id}
            className="dashboard-card"
            onClick={() => navigate(card.path)}
            style={{ borderTopColor: card.color }}
          >
            <div className="card-icon" style={{ background: card.color }}>
              {card.icon}
            </div>
            <h3>{card.title}</h3>
            <p>{card.description}</p>
            <div className="card-arrow">→</div>
          </div>
        ))}
      </div>

      <div className="quick-stats">
        <div className="stat-card">
          <div className="stat-icon"><FiUsers /></div>
          <div className="stat-info">
            <div className="stat-value">{loading ? '...' : stats.usuariosActivos}</div>
            <div className="stat-label" style={{ color: 'white' }}>Usuarios Activos</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon"><FiActivity /></div>
          <div className="stat-info">
            <div className="stat-value">{loading ? '...' : stats.laboratorios}</div>
            <div className="stat-label" style={{ color: 'white' }}>Laboratorios</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon"><FiFileText /></div>
          <div className="stat-info">
            <div className="stat-value">{loading ? '...' : stats.solicitudesPendientes}</div>
            <div className="stat-label" style={{ color: 'white' }}>Solicitudes Pendientes</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon"><FiPackage /></div>
          <div className="stat-info">
            <div className="stat-value">{loading ? '...' : stats.itemsInventario}</div>
            <div className="stat-label" style={{ color: 'white' }}>Items en Inventario</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
