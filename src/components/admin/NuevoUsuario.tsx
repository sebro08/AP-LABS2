import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs, addDoc } from 'firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '../../firebase/config';
import { Rol, Departamento } from '../../types/Usuario';
import './NuevoUsuario.css';

const NuevoUsuario = () => {
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [roles, setRoles] = useState<Rol[]>([]);
  const [departamentos, setDepartamentos] = useState<Departamento[]>([]);
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    primer_nombre: '',
    segundo_nombre: '',
    primer_apellido: '',
    segundo_apellido: '',
    identificador: '',
    telefono: '',
    id_departamento: '',
    id_rol: '',
    activo: true
  });

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    setLoading(true);
    try {
      // Cargar roles
      const rolesSnapshot = await getDocs(collection(db, 'rol'));
      const rolesData = rolesSnapshot.docs.map(doc => ({
        id: doc.id,
        nombre: doc.data().nombre || 'Sin nombre'
      }));
      setRoles(rolesData);

      // Cargar departamentos
      const deptosSnapshot = await getDocs(collection(db, 'departamentos'));
      const deptosData = deptosSnapshot.docs.map(doc => ({
        id: doc.id,
        nombre: doc.data().nombre || 'Sin nombre'
      }));
      setDepartamentos(deptosData);

      setLoading(false);
    } catch (err: any) {
      console.error('Error cargando datos:', err);
      setError(`Error: ${err.message}`);
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const validateForm = () => {
    if (!formData.email || !formData.password || !formData.primer_nombre || !formData.primer_apellido || !formData.id_rol) {
      setError('Por favor complete todos los campos obligatorios');
      return false;
    }

    if (formData.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Las contraseñas no coinciden');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Email inválido');
      return false;
    }

    // Validar que el email sea del dominio ITCR
    if (!formData.email.endsWith('@itcr.ac.cr') && !formData.email.endsWith('@estudiantec.cr')) {
      setError('El correo debe ser del dominio @itcr.ac.cr o @estudiantec.cr');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      console.log('Creando usuario en Firebase Auth...');
      
      // Crear usuario en Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );

      console.log('Usuario creado en Auth:', userCredential.user.uid);
      console.log('Guardando datos en Firestore...');

      // Guardar datos adicionales en Firestore
      await addDoc(collection(db, 'usuarios'), {
        email: formData.email,
        primer_nombre: formData.primer_nombre,
        segundo_nombre: formData.segundo_nombre,
        primer_apellido: formData.primer_apellido,
        segundo_apellido: formData.segundo_apellido,
        identificador: formData.identificador,
        telefono: formData.telefono,
        id_departamento: formData.id_departamento,
        id_rol: formData.id_rol,
        activo: formData.activo,
        fecha_creacion: new Date().toISOString()
      });

      console.log('Usuario registrado exitosamente');
      setSuccess('Usuario registrado correctamente');
      
      setTimeout(() => {
        navigate('/admin/usuarios');
      }, 1500);
    } catch (err: any) {
      console.error('Error registrando usuario:', err);
      
      let errorMessage = 'Error al registrar usuario';
      if (err.code === 'auth/email-already-in-use') {
        errorMessage = 'Este email ya está registrado';
      } else if (err.code === 'auth/weak-password') {
        errorMessage = 'La contraseña es muy débil';
      } else if (err.code === 'auth/invalid-email') {
        errorMessage = 'Email inválido';
      } else {
        errorMessage = `Error: ${err.message}`;
      }
      
      setError(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Cargando formulario...</p>
      </div>
    );
  }

  return (
    <div className="nuevo-usuario">
      <div className="page-header">
        <div className="header-left">
          <button className="btn-back" onClick={() => navigate('/admin/usuarios')}>
            ← Volver
          </button>
          <h1>Registrar Nuevo Usuario</h1>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="form-container">
        <div className="form-card">
          <h2>Credenciales de Acceso</h2>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="email">Email *</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                placeholder="usuario@itcr.ac.cr"
              />
            </div>

            <div className="form-group">
              <label htmlFor="identificador">Carné/Identificador</label>
              <input
                type="text"
                id="identificador"
                name="identificador"
                value={formData.identificador}
                onChange={handleChange}
                placeholder="2023123456"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="password">Contraseña *</label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                placeholder="Mínimo 6 caracteres"
                minLength={6}
              />
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">Confirmar Contraseña *</label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                placeholder="Repita la contraseña"
              />
            </div>
          </div>
        </div>

        <div className="form-card">
          <h2>Información Personal</h2>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="primer_nombre">Primer Nombre *</label>
              <input
                type="text"
                id="primer_nombre"
                name="primer_nombre"
                value={formData.primer_nombre}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="segundo_nombre">Segundo Nombre</label>
              <input
                type="text"
                id="segundo_nombre"
                name="segundo_nombre"
                value={formData.segundo_nombre}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="primer_apellido">Primer Apellido *</label>
              <input
                type="text"
                id="primer_apellido"
                name="primer_apellido"
                value={formData.primer_apellido}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="segundo_apellido">Segundo Apellido</label>
              <input
                type="text"
                id="segundo_apellido"
                name="segundo_apellido"
                value={formData.segundo_apellido}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="telefono">Teléfono</label>
              <input
                type="tel"
                id="telefono"
                name="telefono"
                value={formData.telefono}
                onChange={handleChange}
                placeholder="8888-8888"
              />
            </div>
          </div>
        </div>

        <div className="form-card">
          <h2>Información del Sistema</h2>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="id_rol">Rol *</label>
              <select
                id="id_rol"
                name="id_rol"
                value={formData.id_rol}
                onChange={handleChange}
                required
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
              <label htmlFor="id_departamento">Departamento</label>
              <select
                id="id_departamento"
                name="id_departamento"
                value={formData.id_departamento}
                onChange={handleChange}
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

          <div className="form-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                name="activo"
                checked={formData.activo}
                onChange={handleChange}
              />
              <span>Usuario activo</span>
            </label>
          </div>
        </div>

        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <div className="form-actions">
          <button 
            type="button" 
            className="btn-secondary"
            onClick={() => navigate('/admin/usuarios')}
            disabled={saving}
          >
            Cancelar
          </button>
          <button 
            type="submit" 
            className="btn-primary"
            disabled={saving}
          >
            {saving ? 'Registrando...' : 'Registrar Usuario'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default NuevoUsuario;
