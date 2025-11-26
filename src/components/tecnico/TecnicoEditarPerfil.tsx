import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc, collection, getDocs } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useAuth } from '../../context/AuthContext';
import { FiArrowLeft, FiUser, FiMail, FiPhone, FiCreditCard, FiBox, FiSave, FiAlertCircle } from 'react-icons/fi';
import './TecnicoEditarPerfil.css';

interface Departamento {
  id: string;
  nombre: string;
}

const TecnicoEditarPerfil = () => {
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [departamentos, setDepartamentos] = useState<Departamento[]>([]);

  const [formData, setFormData] = useState({
    primer_nombre: '',
    segundo_nombre: '',
    primer_apellido: '',
    segundo_apellido: '',
    email: '',
    telefono: '',
    cedula: '',
    identificador: '',
    id_departamento: ''
  });

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      if (!currentUser?.uid) {
        navigate('/login');
        return;
      }

      // Cargar datos del técnico
      const tecnicoDoc = await getDoc(doc(db, 'usuarios', currentUser.uid));
      if (tecnicoDoc.exists()) {
        const data = tecnicoDoc.data();
        setFormData({
          primer_nombre: data.primer_nombre || '',
          segundo_nombre: data.segundo_nombre || '',
          primer_apellido: data.primer_apellido || '',
          segundo_apellido: data.segundo_apellido || '',
          email: data.email || '',
          telefono: data.telefono || '',
          cedula: data.cedula || '',
          identificador: data.identificador || '',
          id_departamento: data.id_departamento || ''
        });
      }

      // Cargar departamentos
      const deptosSnapshot = await getDocs(collection(db, 'departamentos'));
      const deptosList: Departamento[] = [];
      deptosSnapshot.forEach(doc => {
        deptosList.push({
          id: doc.id,
          nombre: doc.data().nombre
        });
      });
      setDepartamentos(deptosList);

    } catch (error) {
      console.error('Error cargando datos:', error);
      setError('Error al cargar la información');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.primer_nombre || !formData.primer_apellido || !formData.email || !formData.telefono) {
      setError('Los campos marcados con * son obligatorios');
      return;
    }

    setSaving(true);

    try {
      if (!currentUser?.uid) return;

      await updateDoc(doc(db, 'usuarios', currentUser.uid), {
        primer_nombre: formData.primer_nombre,
        segundo_nombre: formData.segundo_nombre,
        primer_apellido: formData.primer_apellido,
        segundo_apellido: formData.segundo_apellido,
        telefono: formData.telefono,
        cedula: formData.cedula,
        identificador: formData.identificador,
        id_departamento: formData.id_departamento
      });

      alert('Perfil actualizado exitosamente');
      navigate('/tecnico/perfil');

    } catch (error) {
      console.error('Error actualizando perfil:', error);
      setError('Error al actualizar el perfil');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="editar-perfil-loading">
        <div className="spinner"></div>
        <p>Cargando...</p>
      </div>
    );
  }

  return (
    <div className="tecnico-editar-perfil">
      <div className="editar-perfil-header">
        <button className="btn-back" onClick={() => navigate('/tecnico/perfil')}>
          <FiArrowLeft /> Volver al Perfil
        </button>
        <h1><FiUser /> Editar Mi Perfil</h1>
      </div>

      <form onSubmit={handleSubmit} className="editar-perfil-form">
        {error && (
          <div className="alert alert-error">
            <FiAlertCircle /> {error}
          </div>
        )}

        <div className="form-section">
          <h2>Información Personal</h2>
          <div className="form-grid">
            <div className="form-group">
              <label>
                <FiUser className="label-icon" />
                Primer Nombre *
              </label>
              <input
                type="text"
                name="primer_nombre"
                value={formData.primer_nombre}
                onChange={handleChange}
                disabled={saving}
                required
              />
            </div>

            <div className="form-group">
              <label>
                <FiUser className="label-icon" />
                Segundo Nombre
              </label>
              <input
                type="text"
                name="segundo_nombre"
                value={formData.segundo_nombre}
                onChange={handleChange}
                disabled={saving}
              />
            </div>

            <div className="form-group">
              <label>
                <FiUser className="label-icon" />
                Primer Apellido *
              </label>
              <input
                type="text"
                name="primer_apellido"
                value={formData.primer_apellido}
                onChange={handleChange}
                disabled={saving}
                required
              />
            </div>

            <div className="form-group">
              <label>
                <FiUser className="label-icon" />
                Segundo Apellido
              </label>
              <input
                type="text"
                name="segundo_apellido"
                value={formData.segundo_apellido}
                onChange={handleChange}
                disabled={saving}
              />
            </div>

            <div className="form-group">
              <label>
                <FiCreditCard className="label-icon" />
                Cédula *
              </label>
              <input
                type="text"
                name="cedula"
                value={formData.cedula}
                onChange={handleChange}
                disabled={saving}
                required
              />
            </div>

            <div className="form-group">
              <label>
                <FiCreditCard className="label-icon" />
                Identificador
              </label>
              <input
                type="text"
                name="identificador"
                value={formData.identificador}
                onChange={handleChange}
                disabled={saving}
              />
            </div>
          </div>
        </div>

        <div className="form-section">
          <h2>Información de Contacto</h2>
          <div className="form-grid">
            <div className="form-group">
              <label>
                <FiMail className="label-icon" />
                Correo Electrónico *
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                disabled
                title="El correo no se puede modificar"
              />
              <small className="form-hint">El correo electrónico no se puede modificar</small>
            </div>

            <div className="form-group">
              <label>
                <FiPhone className="label-icon" />
                Teléfono *
              </label>
              <input
                type="tel"
                name="telefono"
                value={formData.telefono}
                onChange={handleChange}
                disabled={saving}
                required
              />
            </div>
          </div>
        </div>

        <div className="form-section">
          <h2>Información Laboral</h2>
          <div className="form-grid">
            <div className="form-group">
              <label>
                <FiBox className="label-icon" />
                Departamento
              </label>
              <select
                name="id_departamento"
                value={formData.id_departamento}
                onChange={handleChange}
                disabled={saving}
              >
                <option value="">Seleccione un departamento</option>
                {departamentos.map(dept => (
                  <option key={dept.id} value={dept.id}>
                    {dept.nombre}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="form-actions">
          <button
            type="button"
            className="btn-cancel"
            onClick={() => navigate('/tecnico/perfil')}
            disabled={saving}
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="btn-save"
            disabled={saving}
          >
            <FiSave /> {saving ? 'Guardando...' : 'Guardar Cambios'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default TecnicoEditarPerfil;