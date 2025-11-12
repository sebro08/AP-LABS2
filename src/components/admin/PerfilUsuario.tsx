import { useState, useEffect } from 'react';
import { updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { doc, getDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db } from '../../firebase/config';
import { useAuth } from '../../context/AuthContext';
import { registrarEnBitacora } from '../../utils/bitacoraHelper';
import { FiUser, FiLock, FiCheckCircle, FiXCircle, FiAlertCircle, FiInfo, FiKey } from 'react-icons/fi';
import './PerfilUsuario.css';

interface DatosUsuario {
  primer_nombre: string;
  segundo_nombre?: string;
  primer_apellido: string;
  segundo_apellido?: string;
  email: string;
  cedula?: string;
  identificador?: string;
  telefono?: string;
  id_rol: string;
  rol_nombre: string;
  id_departamento?: string;
  departamento_nombre?: string;
  activo: boolean;
  fecha_creacion?: string;
}

const PerfilUsuario = () => {
  const { user: currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [actualizando, setActualizando] = useState(false);
  const [datosUsuario, setDatosUsuario] = useState<DatosUsuario | null>(null);
  const [mostrarCambioPassword, setMostrarCambioPassword] = useState(false);

  const [formPassword, setFormPassword] = useState({
    passwordActual: '',
    passwordNueva: '',
    confirmarPassword: ''
  });

  useEffect(() => {
    cargarDatosUsuario();
  }, [currentUser]);

  const cargarDatosUsuario = async () => {
    if (!currentUser?.email) return;

    try {
      setLoading(true);
      
      // Buscar usuario por email
      const usuariosRef = collection(db, 'usuarios');
      let qUsuario = query(usuariosRef, where('email', '==', currentUser.email));
      let usuarioSnapshot = await getDocs(qUsuario);
      
      if (usuarioSnapshot.empty) {
        qUsuario = query(usuariosRef, where('correo', '==', currentUser.email));
        usuarioSnapshot = await getDocs(qUsuario);
      }

      if (usuarioSnapshot.empty) {
        console.error('Usuario no encontrado');
        return;
      }

      const usuarioDoc = usuarioSnapshot.docs[0];
      const usuarioData = usuarioDoc.data();

      // Obtener nombre del rol
      let rolNombre = 'Desconocido';
      try {
        const rolDoc = await getDoc(doc(db, 'rol', usuarioData.id_rol));
        if (rolDoc.exists()) {
          rolNombre = rolDoc.data().nombre;
        }
      } catch (error) {
        console.error('Error obteniendo rol:', error);
      }

      // Obtener nombre del departamento si tiene
      let departamentoNombre = '';
      if (usuarioData.id_departamento) {
        try {
          const deptDoc = await getDoc(doc(db, 'departamentos', usuarioData.id_departamento));
          if (deptDoc.exists()) {
            departamentoNombre = deptDoc.data().nombre;
          }
        } catch (error) {
          console.error('Error obteniendo departamento:', error);
        }
      }

      setDatosUsuario({
        ...usuarioData,
        rol_nombre: rolNombre,
        departamento_nombre: departamentoNombre
      } as DatosUsuario);

    } catch (error) {
      console.error('Error cargando datos del usuario:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCambiarPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!auth.currentUser || !currentUser) {
      alert('No hay usuario autenticado');
      return;
    }

    if (formPassword.passwordNueva !== formPassword.confirmarPassword) {
      alert('Las contraseñas nuevas no coinciden');
      return;
    }

    if (formPassword.passwordNueva.length < 6) {
      alert('La nueva contraseña debe tener al menos 6 caracteres');
      return;
    }

    setActualizando(true);
    try {
      // Reautenticar al usuario con su contraseña actual
      const credential = EmailAuthProvider.credential(
        auth.currentUser.email!,
        formPassword.passwordActual
      );
      
      await reauthenticateWithCredential(auth.currentUser, credential);
      
      // Actualizar la contraseña
      await updatePassword(auth.currentUser, formPassword.passwordNueva);

      // Registrar en bitácora
      await registrarEnBitacora({
        usuario_nombre: currentUser.nombre,
        usuario_email: currentUser.email,
        usuario_rol: currentUser.rol,
        accion: 'Cambiar Contraseña',
        accion_detalle: 'Usuario cambió su contraseña',
        modulo: 'Perfil'
      });

      alert('Contraseña actualizada exitosamente');
      setFormPassword({
        passwordActual: '',
        passwordNueva: '',
        confirmarPassword: ''
      });
      setMostrarCambioPassword(false);

    } catch (error: any) {
      console.error('Error cambiando contraseña:', error);
      if (error.code === 'auth/wrong-password') {
        alert('La contraseña actual es incorrecta');
      } else if (error.code === 'auth/weak-password') {
        alert('La nueva contraseña es muy débil');
      } else {
        alert('Error al cambiar la contraseña: ' + error.message);
      }
    } finally {
      setActualizando(false);
    }
  };

  const formatearFecha = (fecha: string) => {
    if (!fecha) return 'No disponible';
    try {
      return new Date(fecha).toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      return 'Fecha inválida';
    }
  };

  const getRolColor = (rol: string) => {
    switch (rol.toLowerCase()) {
      case 'administrador':
        return '#e53e3e';
      case 'docente':
        return '#3182ce';
      case 'técnico':
      case 'tecnico':
        return '#38a169';
      case 'estudiante':
        return '#d69e2e';
      default:
        return '#718096';
    }
  };

  if (loading) {
    return (
      <div className="perfil-loading">
        <div className="loading-spinner"></div>
        <p>Cargando perfil...</p>
      </div>
    );
  }

  if (!datosUsuario) {
    return (
      <div className="perfil-error">
        <h2><FiAlertCircle /> Error</h2>
        <p>No se pudieron cargar los datos del perfil</p>
      </div>
    );
  }

  return (
    <div className="perfil-usuario">
      <div className="perfil-header">
        <h1><FiUser className="header-icon" /> Mi Perfil</h1>
        <p className="subtitle">Información personal y configuración de cuenta</p>
      </div>

      <div className="perfil-content">
        {/* Información Personal */}
        <div className="perfil-card">
          <div className="card-header">
            <h2><FiUser className="header-icon" /> Información Personal</h2>
          </div>
          
          <div className="info-grid">
            <div className="info-item">
              <label>Nombre Completo:</label>
              <div className="info-value">
                {[
                  datosUsuario.primer_nombre,
                  datosUsuario.segundo_nombre,
                  datosUsuario.primer_apellido,
                  datosUsuario.segundo_apellido
                ].filter(Boolean).join(' ')}
              </div>
            </div>

            <div className="info-item">
              <label>Email:</label>
              <div className="info-value">{datosUsuario.email}</div>
            </div>

            {datosUsuario.cedula && (
              <div className="info-item">
                <label>Cédula:</label>
                <div className="info-value">{datosUsuario.cedula}</div>
              </div>
            )}

            {datosUsuario.telefono && (
              <div className="info-item">
                <label>Teléfono:</label>
                <div className="info-value">{datosUsuario.telefono}</div>
              </div>
            )}

            {datosUsuario.identificador && (
              <div className="info-item">
                <label>Carnet:</label>
                <div className="info-value">{datosUsuario.identificador}</div>
              </div>
            )}

            <div className="info-item">
              <label>Rol:</label>
              <div className="info-value">
                <span 
                  className="rol-badge" 
                  style={{ backgroundColor: getRolColor(datosUsuario.rol_nombre) }}
                >
                  {datosUsuario.rol_nombre}
                </span>
              </div>
            </div>

            {datosUsuario.departamento_nombre && (
              <div className="info-item">
                <label>Departamento:</label>
                <div className="info-value">{datosUsuario.departamento_nombre}</div>
              </div>
            )}

            <div className="info-item">
              <label>Estado:</label>
              <div className="info-value">
                <span className={`estado-badge ${datosUsuario.activo ? 'activo' : 'inactivo'}`}>
                  {datosUsuario.activo ? <><FiCheckCircle /> Activo</> : <><FiXCircle /> Inactivo</>}
                </span>
              </div>
            </div>

            {datosUsuario.fecha_creacion && (
              <div className="info-item">
                <label>Fecha de Registro:</label>
                <div className="info-value">{formatearFecha(datosUsuario.fecha_creacion)}</div>
              </div>
            )}
          </div>
        </div>

        {/* Seguridad */}
        <div className="perfil-card">
          <div className="card-header">
            <h2><FiLock className="header-icon" /> Seguridad</h2>
          </div>

          <div className="seguridad-content">
            <div className="password-info">
              {!mostrarCambioPassword ? (
                <button 
                  className="btn-cambiar-password"
                  onClick={() => setMostrarCambioPassword(true)}
                >
                  <FiKey /> Cambiar Contraseña
                </button>
              ) : (
                <div className="cambio-password-form">
                  <form onSubmit={handleCambiarPassword}>
                    <div className="form-group">
                      <label>Contraseña Actual: <span className="required">*</span></label>
                      <input
                        type="password"
                        value={formPassword.passwordActual}
                        onChange={(e) => setFormPassword({...formPassword, passwordActual: e.target.value})}
                        required
                        disabled={actualizando}
                      />
                    </div>

                    <div className="form-group">
                      <label>Nueva Contraseña: <span className="required">*</span></label>
                      <input
                        type="password"
                        value={formPassword.passwordNueva}
                        onChange={(e) => setFormPassword({...formPassword, passwordNueva: e.target.value})}
                        required
                        minLength={6}
                        disabled={actualizando}
                      />
                      <small>Mínimo 6 caracteres</small>
                    </div>

                    <div className="form-group">
                      <label>Confirmar Nueva Contraseña: <span className="required">*</span></label>
                      <input
                        type="password"
                        value={formPassword.confirmarPassword}
                        onChange={(e) => setFormPassword({...formPassword, confirmarPassword: e.target.value})}
                        required
                        minLength={6}
                        disabled={actualizando}
                      />
                    </div>

                    <div className="form-actions">
                      <button 
                        type="button" 
                        className="btn-cancelar"
                        onClick={() => {
                          setMostrarCambioPassword(false);
                          setFormPassword({
                            passwordActual: '',
                            passwordNueva: '',
                            confirmarPassword: ''
                          });
                        }}
                        disabled={actualizando}
                      >
                        Cancelar
                      </button>
                      <button 
                        type="submit" 
                        className="btn-guardar"
                        disabled={actualizando}
                      >
                        {actualizando ? 'Actualizando...' : 'Guardar Cambios'}
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Información del Sistema */}
        <div className="perfil-card">
          <div className="card-header">
            <h2><FiInfo className="header-icon" /> Información del Sistema</h2>
          </div>

          <div className="sistema-info">
            <div className="info-item">
              <label>Usuario ID:</label>
              <div className="info-value mono">{currentUser?.uid}</div>
            </div>

            <div className="info-item">
              <label>Última Conexión:</label>
              <div className="info-value">{new Date().toLocaleString('es-ES')}</div>
            </div>

            <div className="info-item">
              <label>Versión del Sistema:</label>
              <div className="info-value">AP-LABS Web v1.0</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PerfilUsuario;