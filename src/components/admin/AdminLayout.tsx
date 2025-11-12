import { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  FiHome, 
  FiUser, 
  FiClipboard, 
  FiCalendar, 
  FiTrendingUp, 
  FiBell, 
  FiMail, 
  FiSettings, 
  FiBox, 
  FiActivity, 
  FiTool, 
  FiPackage, 
  FiUsers, 
  FiFileText, 
  FiLogOut,
  FiChevronLeft,
  FiChevronRight
} from 'react-icons/fi';
import './AdminLayout.css';

const AdminLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    { id: 'inicio', icon: <FiHome />, label: 'Inicio', path: '/admin/dashboard' },
    { id: 'perfil', icon: <FiUser />, label: 'Perfil', path: '/admin/perfil' },
    { id: 'bitacora', icon: <FiClipboard />, label: 'Bitácora', path: '/admin/bitacora' },
    { id: 'calendario', icon: <FiCalendar />, label: 'Calendario Sistema', path: '/admin/calendario' },
    { id: 'separator1', isSeparator: true, label: 'Reportes' },
    { id: 'reportes-generales', icon: <FiTrendingUp />, label: 'Reportes Generales', path: '/admin/reportes-generales' },
    { id: 'separator2', isSeparator: true, label: 'Comunicación' },
    { id: 'notificaciones', icon: <FiBell />, label: 'Notificaciones', path: '/admin/notificaciones' },
    { id: 'mensajeria', icon: <FiMail />, label: 'Mensajería', path: '/admin/mensajeria' },
    { id: 'separator3', isSeparator: true, label: 'Gestión del Sistema' },
    { id: 'parametros', icon: <FiSettings />, label: 'Parámetros Globales', path: '/admin/parametros' },
    { id: 'departamentos', icon: <FiBox />, label: 'Gestión de Departamentos', path: '/admin/departamentos' },
    { id: 'laboratorios', icon: <FiActivity />, label: 'Gestión de Laboratorios', path: '/admin/laboratorios' },
    { id: 'mantenimientos', icon: <FiTool />, label: 'Gestión de Mantenimientos', path: '/admin/mantenimientos' },
    { id: 'inventario', icon: <FiPackage />, label: 'Gestión de Inventario', path: '/admin/inventario' },
    { id: 'usuarios', icon: <FiUsers />, label: 'Gestión de Usuarios', path: '/admin/usuarios' },
    { id: 'solicitudes', icon: <FiFileText />, label: 'Gestión de Solicitudes', path: '/admin/solicitudes' }
  ];

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  const handleMenuClick = (path: string) => {
    navigate(path);
  };

  return (
    <div className="admin-layout">
      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
        <div className="sidebar-header">
          <h2>AP-LABS</h2>
          <button 
            className="toggle-btn" 
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {sidebarOpen ? <FiChevronLeft /> : <FiChevronRight />}
          </button>
        </div>

        <div className="user-info">
          <div className="user-avatar"><FiUser /></div>
          {sidebarOpen && (
            <div className="user-details">
              <div className="user-name">{user?.nombre}</div>
              <div className="user-role">{user?.rol}</div>
            </div>
          )}
        </div>

        <nav className="sidebar-menu">
          {menuItems.map((item) => {
            if (item.isSeparator) {
              return (
                <div key={item.id} className="menu-separator">
                  {sidebarOpen && <span>{item.label}</span>}
                </div>
              );
            }

            const isActive = location.pathname === item.path;
            
            return (
              <button
                key={item.id}
                className={`menu-item ${isActive ? 'active' : ''}`}
                onClick={() => handleMenuClick(item.path!)}
                title={!sidebarOpen ? item.label : ''}
              >
                <span className="menu-icon">{item.icon}</span>
                {sidebarOpen && <span className="menu-label">{item.label}</span>}
              </button>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <button className="logout-btn" onClick={handleLogout}>
            <span className="menu-icon"><FiLogOut /></span>
            {sidebarOpen && <span>Cerrar Sesión</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className={`main-content ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;
