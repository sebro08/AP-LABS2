import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs, addDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import './NuevoLaboratorio.css';
import { FiBox } from 'react-icons/fi';

const NuevoLaboratorio = () => {
  const navigate = useNavigate();
  
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
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

  const [encargados, setEncargados] = useState<any[]>([]);

  useEffect(() => {
    cargarEncargados();
  }, []);

  const cargarEncargados = async () => {
    try {
      // Cargar usuarios con rol de técnico o administrador
      const usuariosSnapshot = await getDocs(collection(db, 'usuarios'));
      const usuariosData = usuariosSnapshot.docs
        .map(doc => ({
          id: doc.id,
          nombre: `${doc.data().primer_nombre || ''} ${doc.data().primer_apellido || ''}`.trim(),
          rol: doc.data().id_rol
        }))
        .filter(u => u.rol === '3' || u.rol === '4'); // Administrador o Técnico
      
      setEncargados(usuariosData);
    } catch (err) {
      console.error('Error cargando encargados:', err);
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
    
    if (!validateForm()) {
      return;
    }

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      console.log('Guardando laboratorio...');
      
      await addDoc(collection(db, 'laboratorios'), {
        nombre: formData.nombre,
        codigo: formData.codigo.toUpperCase(),
        ubicacion: formData.ubicacion,
        capacidad: formData.capacidad,
        descripcion: formData.descripcion,
        estado: formData.estado,
        encargado: formData.encargado,
        activo: formData.activo,
        fecha_creacion: new Date().toISOString()
      });

      console.log('Laboratorio creado exitosamente');
      setSuccess('Laboratorio creado exitosamente');
      
      setTimeout(() => {
        navigate('/admin/laboratorios');
      }, 1500);

    } catch (err: any) {
      console.error('Error:', err);
      setError(err.message || 'Error al crear el laboratorio');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="nuevo-laboratorio">
      <div className="form-header">
        <h1><FiBox /> Nuevo Laboratorio</h1>
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
                placeholder="LAB-001"
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
                placeholder="Laboratorio de Química"
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
                placeholder="Edificio A, Piso 2"
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
                placeholder="20"
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
                placeholder="Descripción del laboratorio, equipos disponibles, etc."
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
            {saving ? 'Guardando...' : 'Guardar Laboratorio'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default NuevoLaboratorio;
