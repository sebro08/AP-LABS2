import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { collection, getDocs, doc, setDoc, query, where } from 'firebase/firestore';
import { auth, db } from '../firebase/config';
import { FiUser, FiMail, FiLock, FiPhone, FiCreditCard, FiUsers, FiArrowLeft, FiBox } from 'react-icons/fi';
import '../styles/Signup.css';

interface Rol {
  id: string;
  nombre: string;
}

interface Departamento {
  id: string;
  nombre: string;
}

const Signup = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [roles, setRoles] = useState<Rol[]>([]);
  const [departamentos, setDepartamentos] = useState<Departamento[]>([]);

  // Form fields
  const [formData, setFormData] = useState({
    email: '',
    contrasenna: '',
    confirmarContrasenna: '',
    nombreCompleto: '',
    cedula: '',
    telefono: '',
    idRol: '',
    idDepartamento: ''
  });

  useEffect(() => {
    cargarRolesPermitidos();
    cargarDepartamentos();
  }, []);

  const cargarRolesPermitidos = async () => {
    try {
      const rolesRef = collection(db, 'rol');
      const snapshot = await getDocs(rolesRef);
      
      const rolesPermitidos: Rol[] = [];
      snapshot.forEach((doc) => {
        const nombre = doc.data().nombre;
        if (nombre.toLowerCase() === 'estudiante' || nombre.toLowerCase() === 'docente') {
          rolesPermitidos.push({
            id: doc.id,
            nombre: nombre
          });
        }
      });
      
      setRoles(rolesPermitidos);
    } catch (error) {
      console.error('Error al cargar roles:', error);
      setError('Error al cargar roles disponibles');
    }
  };

  const cargarDepartamentos = async () => {
    try {
      const deptosRef = collection(db, 'departamentos');
      const snapshot = await getDocs(deptosRef);
      
      const deptosList: Departamento[] = [];
      snapshot.forEach((doc) => {
        deptosList.push({
          id: doc.id,
          nombre: doc.data().nombre
        });
      });
      
      setDepartamentos(deptosList);
    } catch (error) {
      console.error('Error al cargar departamentos:', error);
      setError('Error al cargar departamentos disponibles');
    }
  };

  const validateEmail = (email: string): boolean => {
    const validDomains = ['@estudiantec.cr', '@itcr.cr'];
    return validDomains.some(domain => email.endsWith(domain));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validaciones
    if (!formData.email || !formData.contrasenna || !formData.confirmarContrasenna || 
        !formData.nombreCompleto || !formData.cedula || !formData.telefono || 
        !formData.idRol || !formData.idDepartamento) {
      setError('Todos los campos son obligatorios');
      return;
    }

    if (!validateEmail(formData.email)) {
      setError('Los únicos dominios permitidos son @estudiantec.cr y @itcr.cr');
      return;
    }

    if (formData.contrasenna !== formData.confirmarContrasenna) {
      setError('Las contraseñas no coinciden');
      return;
    }

    if (formData.contrasenna.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    // Parsear nombre completo: PrimerApellido SegundoApellido Nombre
    const partesNombre = formData.nombreCompleto.trim().split(' ');
    if (partesNombre.length < 3) {
      setError('Formato inválido. Use: PrimerApellido SegundoApellido Nombre');
      return;
    }

    const primerApellido = partesNombre[0];
    const segundoApellido = partesNombre[1];
    const primerNombre = partesNombre.slice(2).join(' ');

    setLoading(true);

    try {
      // Crear usuario en Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.contrasenna
      );
      const uid = userCredential.user.uid;

      // Crear documento en Firestore
      const usuario = {
        uid: uid,
        email: formData.email,
        identificador: formData.cedula,
        telefono: formData.telefono,
        primer_nombre: primerNombre,
        segundo_nombre: '',
        primer_apellido: primerApellido,
        segundo_apellido: segundoApellido,
        id_rol: formData.idRol,
        id_departamento: formData.idDepartamento,
        activo: true,
        cedula: formData.cedula,
        contrasenna: formData.contrasenna
      };

      await setDoc(doc(db, 'usuarios', uid), usuario);

      alert('Registro exitoso! Ahora puede iniciar sesión.');
      navigate('/login');
      
    } catch (error: any) {
      console.error('Error al registrar usuario:', error);
      
      if (error.code === 'auth/email-already-in-use') {
        setError('Este correo electrónico ya está registrado');
      } else if (error.code === 'auth/invalid-email') {
        setError('Correo electrónico inválido');
      } else if (error.code === 'auth/weak-password') {
        setError('La contraseña es muy débil');
      } else {
        setError('Error al crear la cuenta. Intente nuevamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="signup-container">
      <div className="signup-card">
        <button 
          className="btn-back"
          onClick={() => navigate('/login')}
          type="button"
        >
          <FiArrowLeft /> Volver al inicio de sesión
        </button>

        <div className="signup-header">
          <h1>Crear Cuenta</h1>
          <p>Sistema de Gestión de Laboratorios AP-LABS</p>
        </div>

        <form onSubmit={handleSubmit} className="signup-form">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="nombreCompleto">
                <FiUser className="label-icon" />
                Nombre Completo
              </label>
              <input
                type="text"
                id="nombreCompleto"
                name="nombreCompleto"
                value={formData.nombreCompleto}
                onChange={handleInputChange}
                placeholder="PrimerApellido SegundoApellido Nombre"
                disabled={loading}
              />
              <small className="form-hint">Formato: PrimerApellido SegundoApellido Nombre</small>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="cedula">
                <FiCreditCard className="label-icon" />
                Cédula / Identificación
              </label>
              <input
                type="text"
                id="cedula"
                name="cedula"
                value={formData.cedula}
                onChange={handleInputChange}
                placeholder="123456789"
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="telefono">
                <FiPhone className="label-icon" />
                Teléfono
              </label>
              <input
                type="tel"
                id="telefono"
                name="telefono"
                value={formData.telefono}
                onChange={handleInputChange}
                placeholder="88888888"
                disabled={loading}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="email">
                <FiMail className="label-icon" />
                Correo Electrónico
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="usuario@estudiantec.cr"
                disabled={loading}
              />
              <small className="form-hint">Usar dominio @estudiantec.cr o @itcr.cr</small>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="contrasenna">
                <FiLock className="label-icon" />
                Contraseña
              </label>
              <input
                type="password"
                id="contrasenna"
                name="contrasenna"
                value={formData.contrasenna}
                onChange={handleInputChange}
                placeholder="••••••••"
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="confirmarContrasenna">
                <FiLock className="label-icon" />
                Confirmar Contraseña
              </label>
              <input
                type="password"
                id="confirmarContrasenna"
                name="confirmarContrasenna"
                value={formData.confirmarContrasenna}
                onChange={handleInputChange}
                placeholder="••••••••"
                disabled={loading}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="idRol">
                <FiUsers className="label-icon" />
                Rol
              </label>
              <select
                id="idRol"
                name="idRol"
                value={formData.idRol}
                onChange={handleInputChange}
                disabled={loading}
              >
                <option value="">Seleccione un rol</option>
                {roles.map(rol => (
                  <option key={rol.id} value={rol.id}>
                    {rol.nombre}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="idDepartamento">
                <FiBox className="label-icon" />
                Departamento
              </label>
              <select
                id="idDepartamento"
                name="idDepartamento"
                value={formData.idDepartamento}
                onChange={handleInputChange}
                disabled={loading}
              >
                <option value="">Seleccione un departamento</option>
                {departamentos.map(depto => (
                  <option key={depto.id} value={depto.id}>
                    {depto.nombre}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {error && <div className="alert alert-error">{error}</div>}

          <button 
            type="submit" 
            className="signup-button"
            disabled={loading}
          >
            {loading ? 'Registrando...' : 'Crear Cuenta'}
          </button>

          <div className="signup-footer">
            <span>¿Ya tienes una cuenta?</span>
            <button 
              type="button"
              className="link-button"
              onClick={() => navigate('/login')}
            >
              Iniciar Sesión
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Signup;