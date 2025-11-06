import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { AuthProvider } from './context/AuthContext';
import Login from './components/Login';
import ProtectedRoute from './components/ProtectedRoute';
import AdminLayout from './components/admin/AdminLayout';
import AdminDashboard from './components/admin/AdminDashboard';
import { inicializarNotificacionesAutomaticas } from './utils/notificacionesAutomaticas';
import GestionUsuarios from './components/admin/GestionUsuarios';
import EditarUsuario from './components/admin/EditarUsuario';
import NuevoUsuario from './components/admin/NuevoUsuario';
import GestionLaboratorios from './components/admin/GestionLaboratorios';
import NuevoLaboratorio from './components/admin/NuevoLaboratorio';
import EditarLaboratorio from './components/admin/EditarLaboratorio';
import GestionDepartamentos from './components/admin/GestionDepartamentos';
import NuevoDepartamento from './components/admin/NuevoDepartamento';
import EditarDepartamento from './components/admin/EditarDepartamento';
import GestionInventario from './components/admin/GestionInventario';
import NuevoInventario from './components/admin/NuevoInventario';
import EditarInventario from './components/admin/EditarInventario';
import GestionSolicitudes from './components/admin/GestionSolicitudes';
import GestionMantenimientos from './components/admin/GestionMantenimientos';
import ProgramarMantenimiento from './components/admin/ProgramarMantenimiento';
import RegistrarMantenimiento from './components/admin/RegistrarMantenimiento';
import DetalleMantenimiento from './components/admin/DetalleMantenimiento';
import GestionBitacora from './components/admin/GestionBitacora';
import GestionMensajeria from './components/admin/GestionMensajeria';
import GestionReportes from './components/admin/GestionReportes';
import PerfilUsuario from './components/admin/PerfilUsuario';
import GestionNotificaciones from './components/admin/GestionNotificaciones';
import ParametrosGlobales from './components/admin/ParametrosGlobales';
import UserLayout from './components/user/UserLayout';
import UserDashboard from './components/user/UserDashboard';
import UserProfile from './components/user/UserProfile';
import EditUserProfile from './components/user/EditUserProfile';
import UserMensajeria from './components/user/UserMensajeria';
import UserNotificaciones from './components/user/UserNotificaciones';
import UserSolicitudes from './components/user/UserSolicitudes';
import UserReservas from './components/user/UserReservas';
import UserHistorial from './components/user/UserHistorial';
import TecnicoLayout from './components/tecnico/TecnicoLayout';
import TecnicoDashboard from './components/tecnico/TecnicoDashboard';
import TecnicoGestionSolicitudes from './components/tecnico/TecnicoGestionSolicitudes';
import TecnicoGestionMantenimientos from './components/tecnico/TecnicoGestionMantenimientos';
import TecnicoProgramarMantenimiento from './components/tecnico/TecnicoProgramarMantenimiento';
import TecnicoRegistrarMantenimiento from './components/tecnico/TecnicoRegistrarMantenimiento';
import TecnicoDetalleMantenimiento from './components/tecnico/TecnicoDetalleMantenimiento';
import TecnicoGestionInventario from './components/tecnico/TecnicoGestionInventario';
import TecnicoNuevoInventario from './components/tecnico/TecnicoNuevoInventario';
import TecnicoEditarInventario from './components/tecnico/TecnicoEditarInventario';

function App() {
  // Inicializar sistema de notificaciones automáticas
  useEffect(() => {
    inicializarNotificacionesAutomaticas();
  }, []);

  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Ruta pública */}
          <Route path="/login" element={<Login />} />
          
          {/* Rutas del Administrador */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={['3']}>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="perfil" element={<PerfilUsuario />} />
            <Route path="bitacora" element={<GestionBitacora />} />
            <Route path="reportes-uso" element={<div style={{padding: '30px'}}>Reportes de Uso (Próximamente)</div>} />
            <Route path="reportes-generales" element={<GestionReportes />} />
            <Route path="notificaciones" element={<GestionNotificaciones />} />
            <Route path="mensajeria" element={<GestionMensajeria />} />
            <Route path="parametros" element={<ParametrosGlobales />} />
            <Route path="departamentos" element={<GestionDepartamentos />} />
            <Route path="departamentos/nuevo" element={<NuevoDepartamento />} />
            <Route path="departamentos/editar/:id" element={<EditarDepartamento />} />
            <Route path="laboratorios" element={<GestionLaboratorios />} />
            <Route path="laboratorios/nuevo" element={<NuevoLaboratorio />} />
            <Route path="laboratorios/editar/:id" element={<EditarLaboratorio />} />
            <Route path="mantenimientos" element={<GestionMantenimientos />} />
            <Route path="mantenimientos/programar" element={<ProgramarMantenimiento />} />
            <Route path="mantenimientos/registrar" element={<RegistrarMantenimiento />} />
            <Route path="mantenimientos/detalle/:id" element={<DetalleMantenimiento />} />
            <Route path="inventario" element={<GestionInventario />} />
            <Route path="inventario/nuevo" element={<NuevoInventario />} />
            <Route path="inventario/editar/:id" element={<EditarInventario />} />
            <Route path="usuarios" element={<GestionUsuarios />} />
            <Route path="usuarios/nuevo" element={<NuevoUsuario />} />
            <Route path="usuarios/editar/:id" element={<EditarUsuario />} />
            <Route path="solicitudes" element={<GestionSolicitudes />} />
          </Route>

          {/* Rutas del Usuario (Estudiante/Docente) */}
          <Route
            path="/user"
            element={
              <ProtectedRoute allowedRoles={['1', '2']}>
                <UserLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/user/dashboard" replace />} />
            <Route path="dashboard" element={<UserDashboard />} />
            <Route path="perfil" element={<UserProfile />} />
            <Route path="perfil/editar" element={<EditUserProfile />} />
            <Route path="reservas" element={<UserReservas />} />
            <Route path="mensajes" element={<UserMensajeria />} />
            <Route path="notificaciones" element={<UserNotificaciones />} />
            <Route path="mis-solicitudes" element={<UserSolicitudes />} />
            <Route path="historial" element={<UserHistorial />} />
          </Route>

          {/* Rutas de Técnico */}
          <Route path="/tecnico" element={<ProtectedRoute><TecnicoLayout /></ProtectedRoute>}>
            <Route index element={<Navigate to="/tecnico/dashboard" replace />} />
            <Route path="dashboard" element={<TecnicoDashboard />} />
            <Route path="solicitudes" element={<TecnicoGestionSolicitudes />} />
            <Route path="mantenimientos" element={<TecnicoGestionMantenimientos />} />
            <Route path="mantenimientos/programar" element={<TecnicoProgramarMantenimiento />} />
            <Route path="mantenimientos/registrar" element={<TecnicoRegistrarMantenimiento />} />
            <Route path="mantenimientos/detalle/:id" element={<TecnicoDetalleMantenimiento />} />
            <Route path="inventario" element={<TecnicoGestionInventario />} />
            <Route path="inventario/nuevo" element={<TecnicoNuevoInventario />} />
            <Route path="inventario/editar/:id" element={<TecnicoEditarInventario />} />
          </Route>

          {/* Otras rutas */}
          <Route path="/unauthorized" element={<div>No autorizado</div>} />
          
          {/* Ruta por defecto */}
          <Route path="/" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
