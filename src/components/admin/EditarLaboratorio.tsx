import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc, collection, getDocs } from 'firebase/firestore';
import { db } from '../../firebase/config';
import './NuevoLaboratorio.css';

const EditarLaboratorio = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [encargados, setEncargados] = useState<any[]>([]);
  
  const [formData, setFormData] = useState({
    nombre: '',
    codigo: '',
    ubicacion: '',
    capacidad: 0,
    descripcion: '',
    estado: 'Disponible' as 'Disponible' | 'En Mantenimiento' | 'Fuera de Servicio',
    encargado: '',
    activo: true
  });

  useEffect(() => {
    cargarDatos();
  }, [id]);

  const cargarDatos = async () => {
    if (!id) return;
    
    setLoading(true);
    try {
      // Cargar encargados
      const usuariosSnapshot = await getDocs(collection(db, 'usuarios'));
      const usuariosData = usuariosSnapshot.docs
        .map(doc => ({
          id: doc.id,
          nombre: `${doc.data().primer_nombre || ''} ${doc.data().primer_apellido || ''}`.trim(),
          rol: doc.data().id_rol
        }))
        .filter(u => u.rol === '3' || u.rol === '4');
      
      setEncargados(usuariosData);

      // Cargar laboratorio
      const labDoc = await getDoc(doc(db, 'laboratorios', id));
      
      if (labDoc.exists()) {
        const labData = labDoc.data();
        setFormData({
          nombre: labData.nombre || '',
          codigo: labData.codigo || '',
          ubicacion: labData.ubicacion || '',
          capacidad: labData.capacidad || 0,
          descripcion: labData.descripcion || '',
          estado: labData.estado || 'Disponible',
          encargado: labData.encargado || '',
          activo: labData.activo !== undefined ? labData.activo : true
        });
      } else {
        setError('Laboratorio no encontrado');
      }

      setLoading(false);
    } catch (err: any) {
      console.error('Error cargando datos:', err);
      setError('Error al cargar los datos: ' + err.message);
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : 
              name === 'capacidad' ? parseInt(value) || 0 : value
    }));
  };

  const validateForm = () => {
    if (!formData.nombre || !formData.codigo || !formData.ubicacion) {
      setError('Por favor complete todos los campos obligatorios');
      return false;
    }

    if (formData.capacidad <= 0) {
      setError('La capacidad debe ser mayor a 0');
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
      console.log('Actualizando laboratorio...');
      
      await updateDoc(doc(db, 'laboratorios', id), {
        nombre: formData.nombre,
        codigo: formData.codigo.toUpperCase(),
        ubicacion: formData.ubicacion,
        capacidad: formData.capacidad,
        descripcion: formData.descripcion,
        estado: formData.estado,
        encargado: formData.encargado,
        activo: formData.activo
      });

      console.log('Laboratorio actualizado exitosamente');
      setSuccess('Laboratorio actualizado exitosamente');
      
      setTimeout(() => {
        navigate('/admin/laboratorios');
      }, 1500);

    } catch (err: any) {
      console.error('Error:', err);
      setError(err.message || 'Error al actualizar el laboratorio');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Cargando datos del laboratorio...</p>
      </div>
    );
  }

  return (
    <div className="nuevo-laboratorio">
      <div className="form-header">
        <h1>✏️ Editar Laboratorio</h1>
        <button 
          type="button"
          className="btn-back"
          onClick={() => navigate('/admin/laboratorios')}
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
              <label htmlFor="nombre">Nombre del Laboratorio *</label>
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
              <label htmlFor="ubicacion">Ubicación *</label>
              <input
                type="text"
                id="ubicacion"
                name="ubicacion"
                value={formData.ubicacion}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="capacidad">Capacidad (personas) *</label>
              <input
                type="number"
                id="capacidad"
                name="capacidad"
                value={formData.capacidad}
                onChange={handleChange}
                required
                min="1"
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
        </div>

        <div className="form-card">
          <h2>Estado y Configuración</h2>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="estado">Estado del Laboratorio *</label>
              <select
                id="estado"
                name="estado"
                value={formData.estado}
                onChange={handleChange}
                required
              >
                <option value="Disponible">Disponible</option>
                <option value="En Mantenimiento">En Mantenimiento</option>
                <option value="Fuera de Servicio">Fuera de Servicio</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="encargado">Encargado</label>
              <select
                id="encargado"
                name="encargado"
                value={formData.encargado}
                onChange={handleChange}
              >
                <option value="">Sin asignar</option>
                {encargados.map(enc => (
                  <option key={enc.id} value={enc.id}>
                    {enc.nombre}
                  </option>
                ))}
              </select>
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
                <span>Laboratorio activo en el sistema</span>
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
            onClick={() => navigate('/admin/laboratorios')}
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

export default EditarLaboratorio;
