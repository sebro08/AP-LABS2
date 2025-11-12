import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs, addDoc, query, where, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { FiArrowLeft, FiCalendar } from 'react-icons/fi';
import './TecnicoFormularioMantenimiento.css';

interface Recurso {
  id: string;
  nombre: string;
  codigo_inventario: string;
}

interface TipoMantenimiento {
  id: string;
  nombre: string;
}

interface Tecnico {
  id: string;
  nombre: string;
}

const TecnicoProgramarMantenimiento = () => {
  const navigate = useNavigate();
  const [recursos, setRecursos] = useState<Recurso[]>([]);
  const [tipos, setTipos] = useState<TipoMantenimiento[]>([]);
  const [tecnicos, setTecnicos] = useState<Tecnico[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const [formData, setFormData] = useState({
    id_recurso: '',
    id_tipo_mantenimiento: '',
    fecha_programada: '',
    detalle: '',
    repuestos_usados: '',
    id_tecnico: ''
  });

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      // Cargar recursos
      const recursosSnapshot = await getDocs(collection(db, 'recurso'));
      const recursosData: Recurso[] = recursosSnapshot.docs.map(doc => ({
        id: doc.id,
        nombre: doc.data().nombre || 'Sin nombre',
        codigo_inventario: doc.data().codigo_inventario || ''
      }));
      setRecursos(recursosData);

      // Cargar tipos de mantenimiento
      const tiposSnapshot = await getDocs(collection(db, 'tipo_mantenimiento'));
      const tiposData: TipoMantenimiento[] = tiposSnapshot.docs.map(doc => ({
        id: doc.id,
        nombre: doc.data().nombre || 'Sin nombre'
      }));
      setTipos(tiposData);

      // Cargar técnicos (usuarios con rol 4)
      const usuariosRef = collection(db, 'usuarios');
      const q = query(usuariosRef, where('id_rol', '==', '4'));
      const tecnicosSnapshot = await getDocs(q);
      const tecnicosData: Tecnico[] = tecnicosSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          nombre: `${data.primer_nombre || ''} ${data.primer_apellido || ''}`.trim()
        };
      });
      setTecnicos(tecnicosData);

      setLoading(false);
    } catch (error: any) {
      console.error('Error cargando datos:', error);
      setMessage({ type: 'error', text: 'Error al cargar los datos: ' + error.message });
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setMessage({ type: '', text: '' });
  };

  const validarFormulario = (): string | null => {
    if (!formData.id_recurso) return 'Debe seleccionar un recurso';
    if (!formData.id_tipo_mantenimiento) return 'Debe seleccionar un tipo de mantenimiento';
    if (!formData.fecha_programada) return 'Debe seleccionar una fecha programada';
    if (!formData.id_tecnico) return 'Debe seleccionar un técnico responsable';

    // Validar que la fecha sea futura
    const fechaSeleccionada = new Date(formData.fecha_programada);
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    if (fechaSeleccionada < hoy) {
      return 'La fecha programada debe ser hoy o una fecha futura';
    }

    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const errorValidacion = validarFormulario();
    if (errorValidacion) {
      setMessage({ type: 'error', text: errorValidacion });
      return;
    }

    setSaving(true);
    setMessage({ type: '', text: '' });

    try {
      // Crear el mantenimiento con estado "3" (Programado)
      const nuevoMantenimiento = {
        id_recurso: formData.id_recurso,
        id_tipo_mantenimiento: formData.id_tipo_mantenimiento,
        fecha_programada: formData.fecha_programada,
        fecha_realizada: '', // Vacío porque aún no se ha realizado
        detalle: formData.detalle,
        repuestos_usados: formData.repuestos_usados,
        id_tecnico: formData.id_tecnico,
        id_estado: '3' // Programado
      };

      await addDoc(collection(db, 'mantenimiento'), nuevoMantenimiento);

      // Actualizar el estado del recurso a "3" (En Mantenimiento)
      const recursoRef = doc(db, 'recurso', formData.id_recurso);
      await updateDoc(recursoRef, {
        id_estado: '3'
      });

      setMessage({ type: 'success', text: 'Mantenimiento programado exitosamente' });
      
      setTimeout(() => {
        navigate('/tecnico/mantenimientos');
      }, 1500);
    } catch (error: any) {
      console.error('Error programando mantenimiento:', error);
      setMessage({ type: 'error', text: 'Error al programar: ' + error.message });
      setSaving(false);
    }
  };

  // Obtener la fecha mínima (hoy)
  const getFechaMinima = () => {
    const hoy = new Date();
    return hoy.toISOString().split('T')[0];
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
    <div className="tecnico-formulario-mantenimiento">
      <div className="form-header">
        <button className="btn-back" onClick={() => navigate('/tecnico/mantenimientos')}>
          <FiArrowLeft /> Volver
        </button>
        <h1><FiCalendar className="header-icon" /> Programar Mantenimiento</h1>
      </div>

      <div className="form-container">
        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="id_recurso">
                Recurso/Equipo <span className="required">*</span>
              </label>
              <select
                id="id_recurso"
                name="id_recurso"
                value={formData.id_recurso}
                onChange={handleInputChange}
                required
              >
                <option value="">Seleccione un recurso</option>
                {recursos.map(recurso => (
                  <option key={recurso.id} value={recurso.id}>
                    {recurso.codigo_inventario} - {recurso.nombre}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="id_tipo_mantenimiento">
                Tipo de Mantenimiento <span className="required">*</span>
              </label>
              <select
                id="id_tipo_mantenimiento"
                name="id_tipo_mantenimiento"
                value={formData.id_tipo_mantenimiento}
                onChange={handleInputChange}
                required
              >
                <option value="">Seleccione un tipo</option>
                {tipos.map(tipo => (
                  <option key={tipo.id} value={tipo.id}>
                    {tipo.nombre}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="fecha_programada">
                Fecha Programada <span className="required">*</span>
              </label>
              <input
                type="date"
                id="fecha_programada"
                name="fecha_programada"
                value={formData.fecha_programada}
                onChange={handleInputChange}
                min={getFechaMinima()}
                required
              />
              <small className="form-hint">Debe ser hoy o una fecha futura</small>
            </div>

            <div className="form-group">
              <label htmlFor="id_tecnico">
                Técnico Responsable <span className="required">*</span>
              </label>
              <select
                id="id_tecnico"
                name="id_tecnico"
                value={formData.id_tecnico}
                onChange={handleInputChange}
                required
              >
                <option value="">Seleccione un técnico</option>
                {tecnicos.map(tecnico => (
                  <option key={tecnico.id} value={tecnico.id}>
                    {tecnico.nombre}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group full-width">
              <label htmlFor="detalle">
                Detalles del Mantenimiento
              </label>
              <textarea
                id="detalle"
                name="detalle"
                value={formData.detalle}
                onChange={handleInputChange}
                rows={4}
                placeholder="Describa los detalles del mantenimiento a realizar (opcional)"
              />
            </div>

            <div className="form-group full-width">
              <label htmlFor="repuestos_usados">
                Repuestos Necesarios
              </label>
              <textarea
                id="repuestos_usados"
                name="repuestos_usados"
                value={formData.repuestos_usados}
                onChange={handleInputChange}
                rows={3}
                placeholder="Liste los repuestos que se necesitarán (opcional)"
              />
            </div>
          </div>

          {message.text && (
            <div className={`message ${message.type}`}>
              {message.text}
            </div>
          )}

          <div className="form-actions">
            <button
              type="button"
              className="btn-secondary"
              onClick={() => navigate('/tecnico/mantenimientos')}
              disabled={saving}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={saving}
            >
              {saving ? 'Programando...' : <><FiCalendar /> Programar Mantenimiento</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TecnicoProgramarMantenimiento;
