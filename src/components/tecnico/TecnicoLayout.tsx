import { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  FiHome, 
  FiClipboard, 
  FiTool, 
  FiPackage, 
  FiLogOut,
  FiChevronLeft,
  FiChevronRight
} from 'react-icons/fi';
import './TecnicoLayout.css';

const TecnicoLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    { id: 'dashboard', icon: <FiHome />, label: 'Inicio', path: '/tecnico/dashboard' },
    { id: 'separator1', isSeparator: true, label: 'Gestión Principal' },
    { id: 'solicitudes', icon: <FiClipboard />, label: 'Gestión de Solicitudes', path: '/tecnico/solicitudes' },
    { id: 'mantenimientos', icon: <FiTool />, label: 'Gestión de Mantenimientos', path: '/tecnico/mantenimientos' },
    { id: 'inventario', icon: <FiPackage />, label: 'Gestión de Inventario', path: '/tecnico/inventario' }
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
    <div className="tecnico-layout">
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
          <div className="user-avatar"><FiTool /></div>
          {sidebarOpen && (
            <div className="user-details">
              <div className="user-name">{user?.email || 'Técnico'}</div>
              <div className="user-role">Técnico</div>
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

export default TecnicoLayout;
