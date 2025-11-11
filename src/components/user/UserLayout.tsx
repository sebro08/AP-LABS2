import { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import './UserLayout.css';

interface UserData {
  primer_nombre: string;
  segundo_nombre?: string;
  primer_apellido: string;
  segundo_apellido?: string;
  email: string;
  id_rol: string;
}

const UserLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const auth = getAuth();
  const db = getFirestore();
  const [userData, setUserData] = useState<UserData | null>(null);

  useEffect(() => {
    const loadUserData = async () => {
      try {
        const user = auth.currentUser;
        if (user) {
          const userDoc = await getDoc(doc(db, 'usuarios', user.uid));
          if (userDoc.exists()) {
            setUserData(userDoc.data() as UserData);
          }
        }
      } catch (error) {
        console.error('Error cargando datos del usuario:', error);
      }
    };

    loadUserData();
  }, [auth, db]);

  const getUserName = () => {
    if (!userData) return 'Usuario';
    const nombres = [
      userData.primer_nombre,
      userData.segundo_nombre,
      userData.primer_apellido,
      userData.segundo_apellido
    ].filter(Boolean).join(' ');
    return nombres || 'Usuario';
  };

  const menuItems = [
    { id: 'dashboard', icon: '🏠', label: 'Inicio', path: '/user/dashboard' },
    { id: 'perfil', icon: '👤', label: 'Perfil', path: '/user/perfil' },
    { id: 'separator1', isSeparator: true, label: 'Servicios' },
    { id: 'calendario', icon: '📅', label: 'Calendario', path: '/user/calendario' },
    { id: 'reservas', icon: '🏢', label: 'Reservas', path: '/user/reservas' },
    { id: 'mis-solicitudes', icon: '📋', label: 'Mis Solicitudes', path: '/user/mis-solicitudes' },
    { id: 'historial', icon: '📊', label: 'Historial de Uso', path: '/user/historial' },
    { id: 'separator2', isSeparator: true, label: 'Comunicación' },
    { id: 'notificaciones', icon: '🔔', label: 'Notificaciones', path: '/user/notificaciones' },
    { id: 'mensajes', icon: '💬', label: 'Mensajes Internos', path: '/user/mensajes' },
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
    <div className="user-layout">
      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
        <div className="sidebar-header">
          <h2>AP-LABS</h2>
          <button 
            className="toggle-btn" 
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {sidebarOpen ? '◀' : '▶'}
          </button>
        </div>

        <div className="user-info">
          <div className="user-avatar">👤</div>
          {sidebarOpen && (
            <div className="user-details">
              <div className="user-name">{getUserName()}</div>
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
            <span className="menu-icon">🚪</span>
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

export default UserLayout;
