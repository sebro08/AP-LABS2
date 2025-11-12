import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc, collection, getDocs } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { Rol, Departamento } from '../../types/Usuario';
import { FiAlertCircle, FiArrowLeft, FiCheck } from 'react-icons/fi';
import './EditarUsuario.css';

const EditarUsuario = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [roles, setRoles] = useState<Rol[]>([]);
  const [departamentos, setDepartamentos] = useState<Departamento[]>([]);
  
  const [formData, setFormData] = useState({
    email: '',
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
  }, [id]);

  const cargarDatos = async () => {
    if (!id) return;
    
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

      // Cargar usuario
      const userDoc = await getDoc(doc(db, 'usuarios', id));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        setFormData({
          email: userData.email || '',
          primer_nombre: userData.primer_nombre || '',
          segundo_nombre: userData.segundo_nombre || '',
          primer_apellido: userData.primer_apellido || '',
          segundo_apellido: userData.segundo_apellido || '',
          identificador: userData.identificador || '',
          telefono: userData.telefono || '',
          id_departamento: userData.id_departamento || '',
          id_rol: userData.id_rol || userData.roleId || '',
          activo: userData.activo !== undefined ? userData.activo : true
        });
      } else {
        setError('Usuario no encontrado');
      }
    } catch (err: any) {
      console.error('Error cargando datos:', err);
      setError(`Error: ${err.message}`);
    } finally {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      await updateDoc(doc(db, 'usuarios', id), {
        primer_nombre: formData.primer_nombre,
        segundo_nombre: formData.segundo_nombre,
        primer_apellido: formData.primer_apellido,
        segundo_apellido: formData.segundo_apellido,
        identificador: formData.identificador,
        telefono: formData.telefono,
        id_departamento: formData.id_departamento,
        id_rol: formData.id_rol,
        activo: formData.activo
      });

      setSuccess('Usuario actualizado correctamente');
      setTimeout(() => {
        navigate('/admin/usuarios');
      }, 1500);
    } catch (err: any) {
      console.error('Error guardando usuario:', err);
      setError(`Error al guardar: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Cargando usuario...</p>
      </div>
    );
  }

  if (error && !formData.email) {
    return (
      <div className="error-container">
        <div className="error-icon"><FiAlertCircle /></div>
        <h2>Error</h2>
        <p>{error}</p>
        <button className="btn-secondary" onClick={() => navigate('/admin/usuarios')}>
          Volver a la lista
        </button>
      </div>
    );
  }

  return (
    <div className="editar-usuario">
      <div className="page-header">
        <div className="header-left">
          <button className="btn-back" onClick={() => navigate('/admin/usuarios')}>
            <FiArrowLeft /> Volver
          </button>
          <h1>Editar Usuario</h1>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="form-container">
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
              <label htmlFor="identificador">Identificador (si aplica)</label>
              <input
                type="text"
                id="identificador"
                name="identificador"
                value={formData.identificador}
                onChange={handleChange}
                placeholder="Carné o ID del usuario"
              />
            </div>
          </div>
        </div>

        <div className="form-card">
          <h2>Información de Contacto</h2>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="email">Email *</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                disabled
                className="disabled-input"
              />
              <small>El email no puede ser modificado</small>
            </div>

            <div className="form-group">
              <label htmlFor="telefono">Teléfono</label>
              <input
                type="tel"
                id="telefono"
                name="telefono"
                value={formData.telefono}
                onChange={handleChange}
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
              <span><FiCheck /> Usuario activo</span>
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
            {saving ? 'Guardando...' : 'Guardar Cambios'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditarUsuario;
