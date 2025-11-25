import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import './NuevoDepartamento.css';
import { FiBox } from 'react-icons/fi';

const NuevoDepartamento = () => {
  const navigate = useNavigate();
  
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
    
    if (!validateForm()) {
      return;
    }

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      console.log('Guardando departamento...');
      
      await addDoc(collection(db, 'departamentos'), {
        nombre: formData.nombre,
        codigo: formData.codigo.toUpperCase(),
        descripcion: formData.descripcion,
        telefono: formData.telefono,
        email: formData.email,
        activo: formData.activo,
        fecha_creacion: new Date().toISOString()
      });

      console.log('Departamento creado exitosamente');
      setSuccess('Departamento creado exitosamente');
      
      setTimeout(() => {
        navigate('/admin/departamentos');
      }, 1500);

    } catch (err: any) {
      console.error('❌ Error:', err);
      setError(err.message || 'Error al crear el departamento');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="nuevo-departamento">
      <div className="form-header">
        <h1><FiBox /> Nuevo Departamento</h1>
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
                placeholder="DEPT-001"
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
                placeholder="Departamento de Computación"
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
                placeholder="2550-1234"
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
                placeholder="depto@itcr.ac.cr"
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
                placeholder="Descripción del departamento..."
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
            {saving ? 'Guardando...' : 'Guardar Departamento'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default NuevoDepartamento;
