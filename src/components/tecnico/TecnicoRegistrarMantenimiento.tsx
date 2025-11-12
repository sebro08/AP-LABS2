import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs, query, where, doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { FiArrowLeft, FiCheckCircle } from 'react-icons/fi';
import './TecnicoFormularioMantenimiento.css';

interface MantenimientoProgramado {
  id: string;
  id_recurso: string;
  nombreRecurso: string;
  codigoRecurso: string;
  id_tipo_mantenimiento: string;
  tipoMantenimiento: string;
  id_tecnico: string;
  nombreTecnico: string;
  fecha_programada: string;
  detalle: string;
  repuestos_usados: string;
}

const TecnicoRegistrarMantenimiento = () => {
  const navigate = useNavigate();
  const [mantenimientosProgramados, setMantenimientosProgramados] = useState<MantenimientoProgramado[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const [formData, setFormData] = useState({
    id_mantenimiento: '',
    fecha_realizada: '',
    detalle: '',
    repuestos_usados: ''
  });

  const [mantenimientoSeleccionado, setMantenimientoSeleccionado] = useState<MantenimientoProgramado | null>(null);

  useEffect(() => {
    cargarMantenimientosProgramados();
  }, []);

  const cargarMantenimientosProgramados = async () => {
    try {
      // Cargar solo mantenimientos programados (estado 3)
      const mantenimientosRef = collection(db, 'mantenimiento');
      const q = query(mantenimientosRef, where('id_estado', '==', '3'));
      const snapshot = await getDocs(q);

      const programados: MantenimientoProgramado[] = [];

      for (const docSnap of snapshot.docs) {
        const data = docSnap.data();

        // Obtener datos del recurso
        let nombreRecurso = 'Recurso desconocido';
        let codigoRecurso = '';
        if (data.id_recurso) {
          const recursoDoc = await getDoc(doc(db, 'recurso', data.id_recurso));
          if (recursoDoc.exists()) {
            nombreRecurso = recursoDoc.data().nombre;
            codigoRecurso = recursoDoc.data().codigo_inventario || '';
          }
        }

        // Obtener tipo de mantenimiento
        let tipoMantenimiento = 'No especificado';
        if (data.id_tipo_mantenimiento) {
          const tipoDoc = await getDoc(doc(db, 'tipo_mantenimiento', data.id_tipo_mantenimiento));
          if (tipoDoc.exists()) {
            tipoMantenimiento = tipoDoc.data().nombre;
          }
        }

        // Obtener técnico
        let nombreTecnico = 'No asignado';
        if (data.id_tecnico) {
          const tecnicoDoc = await getDoc(doc(db, 'usuarios', data.id_tecnico));
          if (tecnicoDoc.exists()) {
            const tecnicoData = tecnicoDoc.data();
            nombreTecnico = `${tecnicoData.primer_nombre} ${tecnicoData.primer_apellido}`;
          }
        }

        programados.push({
          id: docSnap.id,
          id_recurso: data.id_recurso || '',
          nombreRecurso,
          codigoRecurso,
          id_tipo_mantenimiento: data.id_tipo_mantenimiento || '',
          tipoMantenimiento,
          id_tecnico: data.id_tecnico || '',
          nombreTecnico,
          fecha_programada: data.fecha_programada || '',
          detalle: data.detalle || '',
          repuestos_usados: data.repuestos_usados || ''
        });
      }

      setMantenimientosProgramados(programados);
      setLoading(false);
    } catch (error: any) {
      console.error('Error cargando mantenimientos programados:', error);
      setMessage({ type: 'error', text: 'Error al cargar los datos: ' + error.message });
      setLoading(false);
    }
  };

  const handleMantenimientoChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const mantenimientoId = e.target.value;
    setFormData(prev => ({ ...prev, id_mantenimiento: mantenimientoId }));
    
    const mantSeleccionado = mantenimientosProgramados.find(m => m.id === mantenimientoId);
    setMantenimientoSeleccionado(mantSeleccionado || null);
    
    // Pre-llenar campos si el mantenimiento ya tiene información
    if (mantSeleccionado) {
      setFormData(prev => ({
        ...prev,
        detalle: mantSeleccionado.detalle || '',
        repuestos_usados: mantSeleccionado.repuestos_usados || ''
      }));
    }
    
    setMessage({ type: '', text: '' });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setMessage({ type: '', text: '' });
  };

  const validarFormulario = (): string | null => {
    if (!formData.id_mantenimiento) return 'Debe seleccionar un mantenimiento programado';
    if (!formData.fecha_realizada) return 'Debe seleccionar la fecha de realización';
    if (!formData.detalle.trim()) return 'Debe proporcionar detalles del mantenimiento realizado';

    // Validar que la fecha no sea futura
    const fechaSeleccionada = new Date(formData.fecha_realizada);
    const hoy = new Date();
    hoy.setHours(23, 59, 59, 999);

    if (fechaSeleccionada > hoy) {
      return 'La fecha de realización no puede ser una fecha futura';
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
      if (!mantenimientoSeleccionado) {
        setMessage({ type: 'error', text: 'No se ha seleccionado un mantenimiento' });
        setSaving(false);
        return;
      }

      // Actualizar el mantenimiento programado con los datos de realización
      const mantenimientoRef = doc(db, 'mantenimiento', formData.id_mantenimiento);
      await updateDoc(mantenimientoRef, {
        fecha_realizada: formData.fecha_realizada,
        detalle: formData.detalle,
        repuestos_usados: formData.repuestos_usados,
        id_estado: '1' // Completado
      });

      // Actualizar el recurso: fecha de último mantenimiento y estado a "1" (Disponible)
      const recursoRef = doc(db, 'recurso', mantenimientoSeleccionado.id_recurso);
      await updateDoc(recursoRef, {
        fecha_ultimo_mantenimiento: formData.fecha_realizada,
        id_estado: '1' // Volver a disponible
      });

      setMessage({ type: 'success', text: 'Mantenimiento registrado exitosamente' });
      
      setTimeout(() => {
        navigate('/tecnico/mantenimientos');
      }, 1500);
    } catch (error: any) {
      console.error('Error registrando mantenimiento:', error);
      setMessage({ type: 'error', text: 'Error al registrar: ' + error.message });
      setSaving(false);
    }
  };

  // Obtener la fecha máxima (hoy)
  const getFechaMaxima = () => {
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
        <h1><FiCheckCircle className="header-icon" /> Registrar Mantenimiento Realizado</h1>
      </div>

      <div className="form-container">
        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="form-group full-width">
              <label htmlFor="id_mantenimiento">
                Mantenimiento Programado <span className="required">*</span>
              </label>
              <select
                id="id_mantenimiento"
                name="id_mantenimiento"
                value={formData.id_mantenimiento}
                onChange={handleMantenimientoChange}
                required
              >
                <option value="">Seleccione un mantenimiento programado</option>
                {mantenimientosProgramados.map(mant => (
                  <option key={mant.id} value={mant.id}>
                    {mant.codigoRecurso} - {mant.nombreRecurso} | {mant.tipoMantenimiento} | Programado: {mant.fecha_programada}
                  </option>
                ))}
              </select>
              {mantenimientosProgramados.length === 0 && (
                <small className="form-hint" style={{color: '#e53e3e'}}>
                  No hay mantenimientos programados pendientes de registrar
                </small>
              )}
            </div>

            {mantenimientoSeleccionado && (
              <>
                <div className="form-group">
                  <label>Recurso/Equipo</label>
                  <input
                    type="text"
                    value={`${mantenimientoSeleccionado.codigoRecurso} - ${mantenimientoSeleccionado.nombreRecurso}`}
                    disabled
                    className="input-readonly"
                  />
                </div>

                <div className="form-group">
                  <label>Tipo de Mantenimiento</label>
                  <input
                    type="text"
                    value={mantenimientoSeleccionado.tipoMantenimiento}
                    disabled
                    className="input-readonly"
                  />
                </div>

                <div className="form-group">
                  <label>Técnico Responsable</label>
                  <input
                    type="text"
                    value={mantenimientoSeleccionado.nombreTecnico}
                    disabled
                    className="input-readonly"
                  />
                </div>

                <div className="form-group">
                  <label>Fecha Programada</label>
                  <input
                    type="text"
                    value={mantenimientoSeleccionado.fecha_programada}
                    disabled
                    className="input-readonly"
                  />
                </div>

                <div className="form-group full-width">
                  <label htmlFor="fecha_realizada">
                    Fecha de Realización <span className="required">*</span>
                  </label>
                  <input
                    type="date"
                    id="fecha_realizada"
                    name="fecha_realizada"
                    value={formData.fecha_realizada}
                    onChange={handleInputChange}
                    max={getFechaMaxima()}
                    required
                  />
                  <small className="form-hint">No puede ser una fecha futura</small>
                </div>
              </>
            )}

            {mantenimientoSeleccionado && (
              <>
                <div className="form-group full-width">
                  <label htmlFor="detalle">
                    Detalles del Mantenimiento Realizado <span className="required">*</span>
                  </label>
                  <textarea
                    id="detalle"
                    name="detalle"
                    value={formData.detalle}
                    onChange={handleInputChange}
                    rows={4}
                    placeholder="Describa el mantenimiento realizado (obligatorio)"
                    required
                  />
                  <small className="form-hint">Explique qué trabajos se realizaron</small>
                </div>

                <div className="form-group full-width">
                  <label htmlFor="repuestos_usados">
                    Repuestos Utilizados
                  </label>
                  <textarea
                    id="repuestos_usados"
                    name="repuestos_usados"
                    value={formData.repuestos_usados}
                    onChange={handleInputChange}
                    rows={3}
                    placeholder="Liste los repuestos que se utilizaron (opcional)"
                  />
                </div>
              </>
            )}
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
              disabled={saving || !mantenimientoSeleccionado}
            >
              {saving ? 'Registrando...' : <><FiCheckCircle /> Registrar Mantenimiento</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TecnicoRegistrarMantenimiento;
