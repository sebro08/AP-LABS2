import { useNavigate } from 'react-router-dom';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const navigate = useNavigate();

  const dashboardCards = [
    {
      id: 'usuarios',
      title: 'Gestión de Usuarios',
      icon: '👥',
      description: 'Administrar usuarios del sistema',
      color: '#667eea',
      path: '/admin/usuarios'
    },
    {
      id: 'laboratorios',
      title: 'Gestión de Laboratorios',
      icon: '🔬',
      description: 'Administrar laboratorios',
      color: '#764ba2',
      path: '/admin/laboratorios'
    },
    {
      id: 'inventario',
      title: 'Gestión de Inventario',
      icon: '📦',
      description: 'Control de recursos y materiales',
      color: '#f093fb',
      path: '/admin/inventario'
    },
    {
      id: 'departamentos',
      title: 'Gestión de Departamentos',
      icon: '🏢',
      description: 'Administrar áreas',
      color: '#4facfe',
      path: '/admin/departamentos'
    },
    {
      id: 'solicitudes',
      title: 'Gestión de Solicitudes',
      icon: '📄',
      description: 'Revisar y aprobar solicitudes',
      color: '#43e97b',
      path: '/admin/solicitudes'
    },
    {
      id: 'mantenimientos',
      title: 'Gestión de Mantenimientos',
      icon: '🔧',
      description: 'Programar mantenimientos',
      color: '#fa709a',
      path: '/admin/mantenimientos'
    },
    {
      id: 'bitacora',
      title: 'Bitácora',
      icon: '📋',
      description: 'Registro de actividades del sistema',
      color: '#30cfd0',
      path: '/admin/bitacora'
    },
    {
      id: 'reportes',
      title: 'Reportes Generales',
      icon: '📈',
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
          <div className="stat-icon">👥</div>
          <div className="stat-info">
            <div className="stat-value">-</div>
            <div className="stat-label">Usuarios Activos</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🔬</div>
          <div className="stat-info">
            <div className="stat-value">-</div>
            <div className="stat-label">Laboratorios</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📄</div>
          <div className="stat-info">
            <div className="stat-value">-</div>
            <div className="stat-label">Solicitudes Pendientes</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📦</div>
          <div className="stat-info">
            <div className="stat-value">-</div>
            <div className="stat-label">Items en Inventario</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
