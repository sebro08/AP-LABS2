import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import './NuevoDepartamento.css';

const EditarDepartamento = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [formData, setFormData] = useState({
    nombre: '',
    codigo: '',
    descripcion: '',
    telefono: '',
    email: '',
    activo: true
  });

  useEffect(() => {
    cargarDatos();
  }, [id]);

  const cargarDatos = async () => {
    if (!id) return;
    
    setLoading(true);
    try {
      const deptoDoc = await getDoc(doc(db, 'departamentos', id));
      
      if (deptoDoc.exists()) {
        const deptoData = deptoDoc.data();
        setFormData({
          nombre: deptoData.nombre || '',
          codigo: deptoData.codigo || '',
          descripcion: deptoData.descripcion || '',
          telefono: deptoData.telefono || '',
          email: deptoData.email || '',
          activo: deptoData.activo !== undefined ? deptoData.activo : true
        });
      } else {
        setError('Departamento no encontrado');
      }

      setLoading(false);
    } catch (err: any) {
      console.error('Error cargando datos:', err);
      setError('Error al cargar los datos: ' + err.message);
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const validateForm = () => {
    if (!formData.nombre || !formData.codigo) {
      setError('Por favor complete todos los campos obligatorios');
      return false;
    }

    if (formData.email && !formData.email.includes('@')) {
      setError('Email inválido');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm() || !id) {
      return;
    }

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      console.log('Actualizando departamento...');
      
      await updateDoc(doc(db, 'departamentos', id), {
        nombre: formData.nombre,
        codigo: formData.codigo.toUpperCase(),
        descripcion: formData.descripcion,
        telefono: formData.telefono,
        email: formData.email,
        activo: formData.activo
      });

      console.log('Departamento actualizado exitosamente');
      setSuccess('Departamento actualizado exitosamente');
      
      setTimeout(() => {
        navigate('/admin/departamentos');
      }, 1500);

    } catch (err: any) {
      console.error('Error:', err);
      setError(err.message || 'Error al actualizar el departamento');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Cargando datos del departamento...</p>
      </div>
    );
  }

  return (
    <div className="nuevo-departamento">
      <div className="form-header">
        <h1>✏️ Editar Departamento</h1>
        <button 
          type="button"
          className="btn-back"
          onClick={() => navigate('/admin/departamentos')}
        >
          ← Volver
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="form-card">
          <h2>Información Básica</h2>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="codigo">Código *</label>
              <input
                type="text"
                id="codigo"
                name="codigo"
                value={formData.codigo}
                onChange={handleChange}
                required
                style={{ textTransform: 'uppercase' }}
              />
            </div>

            <div className="form-group">
              <label htmlFor="nombre">Nombre del Departamento *</label>
              <input
                type="text"
                id="nombre"
                name="nombre"
                value={formData.nombre}
                onChange={handleChange}
                required
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
              />
            </div>

            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group full-width">
              <label htmlFor="descripcion">Descripción</label>
              <textarea
                id="descripcion"
                name="descripcion"
                value={formData.descripcion}
                onChange={handleChange}
                rows={4}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group checkbox-group">
              <label>
                <input
                  type="checkbox"
                  name="activo"
                  checked={formData.activo}
                  onChange={handleChange}
                />
                <span>Departamento activo en el sistema</span>
              </label>
            </div>
          </div>
        </div>

        {error && (
          <div className="alert alert-error">
            ⚠️ {error}
          </div>
        )}

        {success && (
          <div className="alert alert-success">
            ✅ {success}
          </div>
        )}

        <div className="form-actions">
          <button 
            type="button" 
            className="btn-secondary"
            onClick={() => navigate('/admin/departamentos')}
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

export default EditarDepartamento;
