import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { MantenimientoDetalle } from '../../types/Mantenimiento';
import './DetalleMantenimiento.css';
import { FiCalendar, FiFilter } from 'react-icons/fi';

const DetalleMantenimiento = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [mantenimiento, setMantenimiento] = useState<MantenimientoDetalle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (id) {
      cargarMantenimiento();
    }
  }, [id]);

  const cargarMantenimiento = async () => {
    if (!id) return;

    setLoading(true);
    try {
      const mantenimientoDoc = await getDoc(doc(db, 'mantenimiento', id));
      
      if (!mantenimientoDoc.exists()) {
        setError('Mantenimiento no encontrado');
        setLoading(false);
        return;
      }

      const data = mantenimientoDoc.data();

      // Obtener nombre del recurso
      let nombreRecurso = 'Recurso desconocido';
      let codigoRecurso = '';
      if (data.id_recurso) {
        const recursoDoc = await getDoc(doc(db, 'recurso', data.id_recurso));
        if (recursoDoc.exists()) {
          nombreRecurso = recursoDoc.data().nombre;
          codigoRecurso = recursoDoc.data().codigo_inventario || '';
        }
      }

      // Obtener nombre del técnico
      let nombreTecnico = 'No asignado';
      let emailTecnico = '';
      if (data.id_tecnico) {
        const tecnicoDoc = await getDoc(doc(db, 'usuarios', data.id_tecnico));
        if (tecnicoDoc.exists()) {
          const tecnicoData = tecnicoDoc.data();
          nombreTecnico = `${tecnicoData.primer_nombre} ${tecnicoData.primer_apellido}`;
          emailTecnico = tecnicoData.correo || '';
        }
      }

      // Obtener tipo de mantenimiento
      let tipoMantenimiento = 'No especificado';
      if (data.id_tipo_mantenimiento) {
        const tipoDoc = await getDoc(doc(db, 'tipo_mantenimiento', data.id_tipo_mantenimiento));
        tipoMantenimiento = tipoDoc.exists() ? tipoDoc.data().nombre : 'No especificado';
      }

      // Obtener estado
      let estadoNombre = 'Sin estado';
      if (data.id_estado) {
        const estadoDoc = await getDoc(doc(db, 'estado', data.id_estado));
        estadoNombre = estadoDoc.exists() ? estadoDoc.data().nombre : 'Sin estado';
      }

      setMantenimiento({
        id: mantenimientoDoc.id,
        id_recurso: data.id_recurso || '',
        id_tipo_mantenimiento: data.id_tipo_mantenimiento || '',
        fecha_programada: data.fecha_programada || '',
        fecha_realizada: data.fecha_realizada || '',
        detalle: data.detalle || '',
        repuestos_usados: data.repuestos_usados || '',
        id_tecnico: data.id_tecnico || '',
        id_estado: data.id_estado || '',
        nombreRecurso: codigoRecurso ? `${codigoRecurso} - ${nombreRecurso}` : nombreRecurso,
        nombreTecnico: emailTecnico ? `${nombreTecnico} (${emailTecnico})` : nombreTecnico,
        tipoMantenimiento,
        estadoNombre
      });

      setLoading(false);
    } catch (error: any) {
      console.error('Error cargando mantenimiento:', error);
      setError('Error al cargar el mantenimiento: ' + error.message);
      setLoading(false);
    }
  };

  const formatearFecha = (fecha: string) => {
    if (!fecha) return '-';
    const [year, month, day] = fecha.split('-');
    return `${day}/${month}/${year}`;
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Cargando mantenimiento...</p>
      </div>
    );
  }

  if (error || !mantenimiento) {
    return (
      <div className="detalle-mantenimiento">
        <div className="form-header">
          <button className="btn-back" onClick={() => navigate('/admin/mantenimientos')}>
            ← Volver
          </button>
          <h1>Error</h1>
        </div>
        <div className="error-message">
          {error || 'No se pudo cargar el mantenimiento'}
        </div>
      </div>
    );
  }

  return (
    <div className="detalle-mantenimiento">
      <div className="form-header">
        <button className="btn-back" onClick={() => navigate('/admin/mantenimientos')}>
          ← Volver
        </button>
        <h1><FiFilter></FiFilter> Detalle del Mantenimiento</h1>
      </div>

      <div className="detalle-container">
        <div className="detalle-card">
          <div className="card-header">
            <h2>Información General</h2>
            <span className={`estado-badge estado-${mantenimiento.id_estado}`}>
              {mantenimiento.estadoNombre}
            </span>
          </div>

          <div className="detalle-grid">
            <div className="detalle-item">
              <label>Recurso/Equipo</label>
              <div className="detalle-value">
                <strong>{mantenimiento.nombreRecurso}</strong>
              </div>
            </div>

            <div className="detalle-item">
              <label>Tipo de Mantenimiento</label>
              <div className="detalle-value">
                <span className="tipo-badge">{mantenimiento.tipoMantenimiento}</span>
              </div>
            </div>

            <div className="detalle-item">
              <label>Técnico Responsable</label>
              <div className="detalle-value">{mantenimiento.nombreTecnico}</div>
            </div>

            <div className="detalle-item">
              <label>Estado</label>
              <div className="detalle-value">
                <span className={`estado-badge estado-${mantenimiento.id_estado}`}>
                  {mantenimiento.estadoNombre}
                </span>
              </div>
            </div>

            <div className="detalle-item">
              <label>Fecha Programada</label>
              <div className="detalle-value">
                {mantenimiento.fecha_programada ? (
                  <span className="fecha"><FiCalendar /> {formatearFecha(mantenimiento.fecha_programada)}</span>
                ) : (
                  <span className="no-disponible">No programada</span>
                )}
              </div>
            </div>

            <div className="detalle-item">
              <label>Fecha Realizada</label>
              <div className="detalle-value">
                {mantenimiento.fecha_realizada ? (
                  <span className="fecha"> {formatearFecha(mantenimiento.fecha_realizada)}</span>
                ) : (
                  <span className="no-disponible">Pendiente de realizar</span>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="detalle-card">
          <div className="card-header">
            <h2>Detalles del Trabajo</h2>
          </div>

          <div className="detalle-section">
            <label>Descripción del Mantenimiento</label>
            {mantenimiento.detalle ? (
              <div className="detalle-text">{mantenimiento.detalle}</div>
            ) : (
              <div className="no-disponible">Sin detalles proporcionados</div>
            )}
          </div>

          <div className="detalle-section">
            <label>Repuestos Utilizados</label>
            {mantenimiento.repuestos_usados ? (
              <div className="detalle-text">{mantenimiento.repuestos_usados}</div>
            ) : (
              <div className="no-disponible">No se utilizaron repuestos o no se especificaron</div>
            )}
          </div>
        </div>

        <div className="detalle-actions">
          <button
            className="btn-secondary"
            onClick={() => navigate('/admin/mantenimientos')}
          >
            ← Volver al Listado
          </button>
        </div>
      </div>
    </div>
  );
};

export default DetalleMantenimiento;
