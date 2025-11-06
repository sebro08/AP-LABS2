import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, orderBy, limit, getDocs, where, Timestamp } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { BitacoraEntry } from '../../types/Bitacora';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import './GestionBitacora.css';

const GestionBitacora = () => {
  const [bitacora, setBitacora] = useState<BitacoraEntry[]>([]);
  const [bitacoraFiltrada, setBitacoraFiltrada] = useState<BitacoraEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterModulo, setFilterModulo] = useState('todos');
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportOptions, setExportOptions] = useState({
    fechaInicio: '',
    fechaFin: '',
    formatoExcel: true,
    formatoPDF: true
  });

  useEffect(() => {
    cargarBitacora();
  }, []);

  useEffect(() => {
    filtrarBitacora();
  }, [searchTerm, filterModulo, bitacora]);

  const cargarBitacora = async () => {
    setLoading(true);
    try {
      const bitacoraRef = collection(db, 'bitacora');
      const q = query(
        bitacoraRef,
        orderBy('timestamp', 'desc'),
        limit(200)
      );

      const snapshot = await getDocs(q);
      const entries: BitacoraEntry[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as BitacoraEntry));

      setBitacora(entries);
      setLoading(false);
    } catch (error: any) {
      console.error('Error cargando bitácora:', error);
      alert('Error al cargar la bitácora: ' + error.message);
      setLoading(false);
    }
  };

  const filtrarBitacora = () => {
    let filtered = [...bitacora];

    // Filtrar por búsqueda
    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      filtered = filtered.filter(entry =>
        entry.usuario_nombre.toLowerCase().includes(lowerSearch) ||
        entry.usuario_email.toLowerCase().includes(lowerSearch) ||
        entry.accion_detalle.toLowerCase().includes(lowerSearch) ||
        entry.modulo.toLowerCase().includes(lowerSearch) ||
        entry.recurso_nombre?.toLowerCase().includes(lowerSearch) ||
        entry.recurso_codigo?.toLowerCase().includes(lowerSearch)
      );
    }

    // Filtrar por módulo
    if (filterModulo !== 'todos') {
      filtered = filtered.filter(entry => entry.modulo === filterModulo);
    }

    setBitacoraFiltrada(filtered);
  };

  const modulosUnicos = Array.from(new Set(bitacora.map(e => e.modulo))).sort();

  const handleExportModalOpen = () => {
    const hoy = new Date().toISOString().split('T')[0];
    setExportOptions({
      fechaInicio: '',
      fechaFin: hoy,
      formatoExcel: true,
      formatoPDF: true
    });
    setShowExportModal(true);
  };

  const handleExport = async () => {
    if (!exportOptions.fechaInicio || !exportOptions.fechaFin) {
      alert('Debe seleccionar un rango de fechas');
      return;
    }

    if (!exportOptions.formatoExcel && !exportOptions.formatoPDF) {
      alert('Debe seleccionar al menos un formato de exportación');
      return;
    }

    try {
      // Consultar bitácora en el rango de fechas
      const startDate = new Date(exportOptions.fechaInicio);
      startDate.setHours(0, 0, 0, 0);

      const endDate = new Date(exportOptions.fechaFin);
      endDate.setHours(23, 59, 59, 999);

      const bitacoraRef = collection(db, 'bitacora');
      const q = query(
        bitacoraRef,
        where('timestamp', '>=', Timestamp.fromDate(startDate)),
        where('timestamp', '<=', Timestamp.fromDate(endDate)),
        orderBy('timestamp', 'desc')
      );

      const snapshot = await getDocs(q);
      const entries: BitacoraEntry[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as BitacoraEntry));

      if (entries.length === 0) {
        alert('No hay registros en el rango de fechas seleccionado');
        return;
      }

      const dateRange = `${exportOptions.fechaInicio}_${exportOptions.fechaFin}`;

      if (exportOptions.formatoExcel) {
        exportToCSV(entries, dateRange);
      }

      if (exportOptions.formatoPDF) {
        exportToPDF(entries, dateRange);
      }

      setShowExportModal(false);
      alert(`✅ Exportación completada. ${entries.length} registros exportados.`);
    } catch (error: any) {
      console.error('Error exportando:', error);
      alert('Error al exportar: ' + error.message);
    }
  };

  const exportToCSV = (data: BitacoraEntry[], dateRange: string) => {
    // BOM para compatibilidad UTF-8 con Excel
    let csv = '\uFEFF';

    // Encabezados
    csv += 'Usuario,Email,Rol,Recurso,Código Recurso,Acción,Módulo,Fecha,Hora,Observaciones\n';

    // Filas de datos
    data.forEach(entry => {
      const row = [
        escapeCsv(entry.usuario_nombre),
        escapeCsv(entry.usuario_email),
        escapeCsv(entry.usuario_rol),
        escapeCsv(entry.recurso_nombre || ''),
        escapeCsv(entry.recurso_codigo || ''),
        escapeCsv(entry.accion_detalle),
        escapeCsv(entry.modulo),
        escapeCsv(entry.fecha_formateada),
        escapeCsv(entry.hora_formateada),
        escapeCsv(entry.observaciones || '')
      ];
      csv += row.join(',') + '\n';
    });

    // Descargar
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `Bitacora_${dateRange}_${Date.now()}.csv`;
    link.click();
  };

  const escapeCsv = (text: string): string => {
    if (!text) return '';
    const needsQuotes = text.includes(',') || text.includes('"') || text.includes('\n');
    return needsQuotes ? `"${text.replace(/"/g, '""')}"` : text;
  };

  const exportToPDF = (data: BitacoraEntry[], dateRange: string) => {
    const doc = new jsPDF({ orientation: 'landscape' });

    // Título
    doc.setFontSize(18);
    doc.text('BITÁCORA DEL SISTEMA', doc.internal.pageSize.getWidth() / 2, 20, { align: 'center' });

    // Información
    doc.setFontSize(10);
    doc.text(`Rango de fechas: ${exportOptions.fechaInicio} al ${exportOptions.fechaFin}`, 20, 35);
    doc.text(`Fecha de exportación: ${new Date().toLocaleString('es-ES')}`, 20, 42);
    doc.text(`Total de registros: ${data.length}`, 20, 49);

    // Tabla
    const tableData = data.map(entry => [
      entry.usuario_nombre,
      entry.usuario_rol,
      entry.recurso_nombre || 'N/A',
      `${entry.fecha_formateada} ${entry.hora_formateada}`,
      entry.accion_detalle,
      entry.modulo
    ]);

    autoTable(doc, {
      startY: 60,
      head: [['Usuario', 'Rol', 'Recurso', 'Fecha/Hora', 'Acción', 'Módulo']],
      body: tableData,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [102, 126, 234] }
    });

    doc.save(`Bitacora_${dateRange}_${Date.now()}.pdf`);
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Cargando bitácora...</p>
      </div>
    );
  }

  return (
    <div className="gestion-bitacora">
      <div className="page-header">
        <h1>📋 Bitácora del Sistema</h1>
        <button className="btn-primary" onClick={handleExportModalOpen}>
          📊 Exportar Bitácora
        </button>
      </div>

      <div className="filters-section">
        <div className="search-box">
          <input
            type="text"
            placeholder="🔍 Buscar por usuario, acción, recurso o módulo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="filters-row">
          <div className="filter-group">
            <label>Módulo:</label>
            <select value={filterModulo} onChange={(e) => setFilterModulo(e.target.value)}>
              <option value="todos">Todos los Módulos</option>
              {modulosUnicos.map(modulo => (
                <option key={modulo} value={modulo}>{modulo}</option>
              ))}
            </select>
          </div>

          {(searchTerm || filterModulo !== 'todos') && (
            <button
              className="btn-clear-filters"
              onClick={() => {
                setSearchTerm('');
                setFilterModulo('todos');
              }}
            >
              Limpiar Filtros
            </button>
          )}
        </div>
      </div>

      <div className="summary-cards">
        <div className="summary-card">
          <div className="summary-icon">📋</div>
          <div className="summary-info">
            <div className="summary-value">{bitacora.length}</div>
            <div className="summary-label">Total Registros</div>
          </div>
        </div>
        <div className="summary-card">
          <div className="summary-icon">🔍</div>
          <div className="summary-info">
            <div className="summary-value">{bitacoraFiltrada.length}</div>
            <div className="summary-label">Resultados</div>
          </div>
        </div>
        <div className="summary-card">
          <div className="summary-icon">📁</div>
          <div className="summary-info">
            <div className="summary-value">{modulosUnicos.length}</div>
            <div className="summary-label">Módulos Activos</div>
          </div>
        </div>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Usuario</th>
              <th>Rol</th>
              <th>Recurso</th>
              <th>Acción</th>
              <th>Módulo</th>
              <th>Fecha</th>
              <th>Hora</th>
            </tr>
          </thead>
          <tbody>
            {bitacoraFiltrada.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '30px' }}>
                  No se encontraron registros
                </td>
              </tr>
            ) : (
              bitacoraFiltrada.map((entry) => (
                <tr key={entry.id}>
                  <td>
                    <strong>{entry.usuario_nombre}</strong>
                    <br />
                    <small style={{ color: '#718096' }}>{entry.usuario_email}</small>
                  </td>
                  <td>
                    <span className="rol-badge">{entry.usuario_rol}</span>
                  </td>
                  <td>
                    {entry.recurso_nombre ? (
                      <>
                        <strong>{entry.recurso_nombre}</strong>
                        {entry.recurso_codigo && (
                          <>
                            <br />
                            <small style={{ color: '#718096' }}>{entry.recurso_codigo}</small>
                          </>
                        )}
                      </>
                    ) : (
                      <span style={{ color: '#a0aec0' }}>N/A</span>
                    )}
                  </td>
                  <td>{entry.accion_detalle}</td>
                  <td>
                    <span className="modulo-badge">{entry.modulo}</span>
                  </td>
                  <td>{entry.fecha_formateada}</td>
                  <td>{entry.hora_formateada}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal de Exportación */}
      {showExportModal && (
        <div className="modal-overlay" onClick={() => setShowExportModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>📊 Exportar Bitácora</h2>
              <button className="btn-close" onClick={() => setShowExportModal(false)}>×</button>
            </div>

            <div className="modal-body">
              <div className="form-group">
                <label htmlFor="fechaInicio">
                  Fecha Inicial <span className="required">*</span>
                </label>
                <input
                  type="date"
                  id="fechaInicio"
                  value={exportOptions.fechaInicio}
                  onChange={(e) => setExportOptions({ ...exportOptions, fechaInicio: e.target.value })}
                  max={exportOptions.fechaFin || undefined}
                />
              </div>

              <div className="form-group">
                <label htmlFor="fechaFin">
                  Fecha Final <span className="required">*</span>
                </label>
                <input
                  type="date"
                  id="fechaFin"
                  value={exportOptions.fechaFin}
                  onChange={(e) => setExportOptions({ ...exportOptions, fechaFin: e.target.value })}
                  min={exportOptions.fechaInicio || undefined}
                />
              </div>

              <div className="form-group">
                <label>Formato de Exportación</label>
                <div className="checkbox-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={exportOptions.formatoExcel}
                      onChange={(e) => setExportOptions({ ...exportOptions, formatoExcel: e.target.checked })}
                    />
                    <span>📊 Excel (CSV)</span>
                  </label>
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={exportOptions.formatoPDF}
                      onChange={(e) => setExportOptions({ ...exportOptions, formatoPDF: e.target.checked })}
                    />
                    <span>📄 PDF</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setShowExportModal(false)}>
                Cancelar
              </button>
              <button className="btn-primary" onClick={handleExport}>
                📥 Exportar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GestionBitacora;
