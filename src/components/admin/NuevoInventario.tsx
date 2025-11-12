import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, addDoc, getDocs, query, where, Timestamp } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { Estado, TipoRecurso, Medida } from '../../types/Inventario';
import './NuevoInventario.css';

const NuevoInventario = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [estados, setEstados] = useState<Estado[]>([]);
  const [tiposRecurso, setTiposRecurso] = useState<TipoRecurso[]>([]);
  const [medidas, setMedidas] = useState<Medida[]>([]);

  const [formData, setFormData] = useState({
    nombre: '',
    codigo_inventario: '',
    descripcion: '',
    cantidad: 1,
    id_estado: '',
    id_medida: '',
    id_tipo_recurso: '',
    fecha_ultimo_mantenimiento: ''
  });

  useEffect(() => {
    cargarCatalogos();
  }, []);

  const cargarCatalogos = async () => {
    setLoading(true);
    try {
      console.log('🔄 Cargando catálogos...');

      const [estadosSnap, tiposSnap, medidasSnap] = await Promise.all([
        getDocs(collection(db, 'estado')),
        getDocs(collection(db, 'tipo_recurso')),
        getDocs(collection(db, 'medida'))
      ]);

      const estadosData = estadosSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Estado));
      const tiposData = tiposSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as TipoRecurso));
      const medidasData = medidasSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Medida));

      setEstados(estadosData);
      setTiposRecurso(tiposData);
      setMedidas(medidasData);

      // Valores por defecto
      if (estadosData.length > 0) setFormData(prev => ({ ...prev, id_estado: estadosData[0].id }));
      if (medidasData.length > 0) setFormData(prev => ({ ...prev, id_medida: medidasData[0].id }));
      if (tiposData.length > 0) setFormData(prev => ({ ...prev, id_tipo_recurso: tiposData[0].id }));

      console.log('Catálogos cargados');
      setLoading(false);
    } catch (err: any) {
      console.error('Error cargando catálogos:', err);
      setError('Error al cargar los catálogos: ' + err.message);
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'cantidad' ? parseInt(value) || 0 : value
    }));
  };

  const validateForm = async () => {
    if (!formData.nombre || !formData.codigo_inventario) {
      setError('Por favor complete los campos obligatorios');
      return false;
    }

    if (formData.cantidad <= 0) {
      setError('La cantidad debe ser mayor a 0');
      return false;
    }

    // Validar que el código sea único
    const codigoUpper = formData.codigo_inventario.toUpperCase();
    const codigoQuery = query(
      collection(db, 'recurso'),
      where('codigo_inventario', '==', codigoUpper)
    );
    const codigoSnapshot = await getDocs(codigoQuery);

    if (!codigoSnapshot.empty) {
      setError('El código de inventario ya existe');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!(await validateForm())) {
      return;
    }

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      console.log('Guardando recurso...');

      // Obtener nombre del estado seleccionado y normalizarlo
      const estadoSeleccionado = estados.find(e => e.id === formData.id_estado);
      let nombreEstado = estadoSeleccionado?.nombre || 'Disponible';
      
      // Mapear a los nombres exactos especificados
      const estadoLower = nombreEstado.toLowerCase();
      if (estadoLower === 'disponible' || estadoLower === 'activo') {
        nombreEstado = 'Disponible';
      } else if (estadoLower.includes('mantenimiento')) {
        nombreEstado = 'En Mantenimiento';
      } else if (estadoLower === 'inactivo' || estadoLower.includes('fuera') || estadoLower.includes('servicio')) {
        nombreEstado = 'Fuera de Servicio';
      } else if (estadoLower === 'reservado') {
        nombreEstado = 'Reservado';
      }

      await addDoc(collection(db, 'recurso'), {
        nombre: formData.nombre,
        codigo_inventario: formData.codigo_inventario.toUpperCase(),
        descripcion: formData.descripcion,
        cantidad: formData.cantidad,
        cantidad_disponible: formData.cantidad,
        id_estado: formData.id_estado,
        estado: nombreEstado,
        id_medida: formData.id_medida,
        unidad: medidas.find(m => m.id === formData.id_medida)?.nombre || '',
        id_tipo_recurso: formData.id_tipo_recurso,
        tipo_recurso: tiposRecurso.find(t => t.id === formData.id_tipo_recurso)?.nombre || '',
        fecha_ultimo_mantenimiento: formData.fecha_ultimo_mantenimiento,
        fecha_creacion: Timestamp.now()
      });

      console.log('Recurso creado exitosamente');
      setSuccess('Recurso creado exitosamente');

      setTimeout(() => {
        navigate('/admin/inventario');
      }, 1500);

    } catch (err: any) {
      console.error('Error:', err);
      setError(err.message || 'Error al crear el recurso');
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
    <div className="nuevo-inventario">
      <div className="form-header">
        <h1>📦 Nuevo Recurso de Inventario</h1>
        <button 
          type="button"
          className="btn-back"
          onClick={() => navigate('/admin/inventario')}
        >
          ← Volver
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="form-card">
          <h2>Información Básica</h2>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="codigo_inventario">Código de Inventario *</label>
              <input
                type="text"
                id="codigo_inventario"
                name="codigo_inventario"
                value={formData.codigo_inventario}
                onChange={handleChange}
                required
                style={{ textTransform: 'uppercase' }}
                placeholder="Ej: EQ-001"
              />
            </div>

            <div className="form-group">
              <label htmlFor="nombre">Nombre del Recurso *</label>
              <input
                type="text"
                id="nombre"
                name="nombre"
                value={formData.nombre}
                onChange={handleChange}
                required
                placeholder="Ej: Computadora Dell"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="id_tipo_recurso">Tipo de Recurso *</label>
              <select
                id="id_tipo_recurso"
                name="id_tipo_recurso"
                value={formData.id_tipo_recurso}
                onChange={handleChange}
                required
              >
                {tiposRecurso.map(tipo => (
                  <option key={tipo.id} value={tipo.id}>
                    {tipo.nombre}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="id_estado">Estado *</label>
              <select
                id="id_estado"
                name="id_estado"
                value={formData.id_estado}
                onChange={handleChange}
                required
              >
                {estados.map(estado => {
                  let nombreMostrar = estado.nombre;
                  const nombreLower = estado.nombre.toLowerCase();
                  if (nombreLower === 'inactivo') nombreMostrar = 'Fuera de Servicio';
                  else if (nombreLower === 'activo' || nombreLower === 'disponible') nombreMostrar = 'Disponible';
                  else if (nombreLower.includes('mantenimiento')) nombreMostrar = 'En Mantenimiento';
                  else if (nombreLower === 'reservado') nombreMostrar = 'Reservado';
                  
                  return (
                    <option key={estado.id} value={estado.id}>
                      {nombreMostrar}
                    </option>
                  );
                })}
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="cantidad">Cantidad *</label>
              <input
                type="number"
                id="cantidad"
                name="cantidad"
                value={formData.cantidad}
                onChange={handleChange}
                required
                min="1"
              />
            </div>

            <div className="form-group">
              <label htmlFor="id_medida">Unidad de Medida *</label>
              <select
                id="id_medida"
                name="id_medida"
                value={formData.id_medida}
                onChange={handleChange}
                required
              >
                {medidas.map(medida => (
                  <option key={medida.id} value={medida.id}>
                    {medida.nombre}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="fecha_ultimo_mantenimiento">Fecha Último Mantenimiento</label>
              <input
                type="date"
                id="fecha_ultimo_mantenimiento"
                name="fecha_ultimo_mantenimiento"
                value={formData.fecha_ultimo_mantenimiento}
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
                placeholder="Detalles adicionales del recurso..."
              />
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
            onClick={() => navigate('/admin/inventario')}
            disabled={saving}
          >
            Cancelar
          </button>
          <button 
            type="submit" 
            className="btn-primary"
            disabled={saving}
          >
            {saving ? 'Guardando...' : 'Guardar Recurso'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default NuevoInventario;
