import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, getDoc, updateDoc } from 'firebase/firestore';
import { FiArrowLeft } from 'react-icons/fi';
import './EditUserProfile.css';

interface UserData {
  cedula: string;
  primer_nombre: string;
  segundo_nombre?: string;
  primer_apellido: string;
  segundo_apellido?: string;
  email: string;
  telefono: string;
  id_departamento: string;
  id_rol: string;
  identificador: string;
}

const EditUserProfile: React.FC = () => {
  const auth = getAuth();
  const db = getFirestore();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    primer_nombre: '',
    segundo_nombre: '',
    primer_apellido: '',
    segundo_apellido: '',
    telefono: '',
  });

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const user = auth.currentUser;
      if (!user) {
        navigate('/login');
        return;
      }

      const userDoc = await getDoc(doc(db, 'usuarios', user.uid));
      if (userDoc.exists()) {
        const data = userDoc.data() as UserData;
        setFormData({
          primer_nombre: data.primer_nombre || '',
          segundo_nombre: data.segundo_nombre || '',
          primer_apellido: data.primer_apellido || '',
          segundo_apellido: data.segundo_apellido || '',
          telefono: data.telefono || '',
        });
      }
    } catch (error) {
      console.error('Error cargando datos del usuario:', error);
      setError('Error al cargar los datos del usuario');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validaciones
    if (!formData.primer_nombre.trim()) {
      setError('El primer nombre es obligatorio');
      return;
    }
    if (!formData.primer_apellido.trim()) {
      setError('El primer apellido es obligatorio');
      return;
    }

    setSaving(true);

    try {
      const user = auth.currentUser;
      if (!user) {
        navigate('/login');
        return;
      }

      await updateDoc(doc(db, 'usuarios', user.uid), {
        primer_nombre: formData.primer_nombre.trim(),
        segundo_nombre: formData.segundo_nombre.trim(),
        primer_apellido: formData.primer_apellido.trim(),
        segundo_apellido: formData.segundo_apellido.trim(),
        telefono: formData.telefono.trim(),
      });

      setSuccess('Perfil actualizado correctamente');
      setTimeout(() => {
        navigate('/user/perfil');
      }, 1500);
    } catch (error) {
      console.error('Error actualizando perfil:', error);
      setError('Error al actualizar el perfil. Intente nuevamente.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    navigate('/user/perfil');
  };

  if (loading) {
    return (
      <div className="edit-profile-loading">
        <div className="spinner"></div>
        <p>Cargando datos...</p>
      </div>
    );
  }

  return (
    <div className="edit-user-profile">
      <div className="edit-profile-header">
        <button className="back-btn" onClick={handleCancel}>
          <FiArrowLeft /> Volver
        </button>
        <h1>Editar Perfil</h1>
        <p>Actualiza tu información personal</p>
      </div>

      <form onSubmit={handleSubmit} className="edit-profile-form">
        <div className="form-section">
          <h2>Información Personal</h2>
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="primer_nombre">
                Primer Nombre <span className="required">*</span>
              </label>
              <input
                type="text"
                id="primer_nombre"
                name="primer_nombre"
                value={formData.primer_nombre}
                onChange={handleChange}
                required
                disabled={saving}
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
                disabled={saving}
              />
            </div>

            <div className="form-group">
              <label htmlFor="primer_apellido">
                Primer Apellido <span className="required">*</span>
              </label>
              <input
                type="text"
                id="primer_apellido"
                name="primer_apellido"
                value={formData.primer_apellido}
                onChange={handleChange}
                required
                disabled={saving}
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
                disabled={saving}
              />
            </div>
          </div>
        </div>

        <div className="form-section">
          <h2>Información de Contacto</h2>
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="telefono">Teléfono</label>
              <input
                type="tel"
                id="telefono"
                name="telefono"
                value={formData.telefono}
                onChange={handleChange}
                placeholder="Ej: 8888-8888"
                disabled={saving}
              />
            </div>
          </div>
        </div>

        {error && (
          <div className="alert alert-error">
            {error}
          </div>
        )}

        {success && (
          <div className="alert alert-success">
            {success}
          </div>
        )}

        <div className="form-actions">
          <button
            type="button"
            className="btn-cancel"
            onClick={handleCancel}
            disabled={saving}
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="btn-save"
            disabled={saving}
          >
            {saving ? 'Guardando...' : 'Guardar Cambios'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditUserProfile;
