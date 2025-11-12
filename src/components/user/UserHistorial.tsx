import { useState, useEffect } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useAuth } from '../../context/AuthContext';
import { registrarEnBitacora } from '../../utils/bitacoraHelper';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { FiCalendar, FiUsers, FiPackage, FiCheckCircle, FiClock, FiSearch, FiDownload, FiFileText, FiBarChart } from 'react-icons/fi';
import './UserHistorial.css';

interface HistorialItem {
  id: string;
  tipo: 'laboratorio' | 'recurso';
  nombre: string;
  fecha_reserva: string;
  fecha_devolucion: string;
  fecha_devolucion_real?: string;
  cantidad?: number;
  unidad?: string;
  horarios?: string;
  participantes?: number;
  motivo: string;
  comentario?: string;
  estado: number;
}

interface FiltrosExportacion {
  fechaInicio: string;
  fechaFin: string;
  tipoReporte: 'completo' | 'laboratorios' | 'recursos';
  formato: 'pdf' | 'excel' | 'ambos';
}

const UserHistorial = () => {
  const { user } = useAuth();
  const [historial, setHistorial] = useState<HistorialItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTipo, setFilterTipo] = useState<'todos' | 'laboratorio' | 'recurso'>('todos');
  const [showDetalle, setShowDetalle] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [itemSeleccionado, setItemSeleccionado] = useState<HistorialItem | null>(null);
  const [loadingExport, setLoadingExport] = useState(false);

  const [filtrosExport, setFiltrosExport] = useState<FiltrosExportacion>({
    fechaInicio: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0],
    fechaFin: new Date().toISOString().split('T')[0],
    tipoReporte: 'completo',
    formato: 'ambos'
  });

  useEffect(() => {
    if (user) {
      cargarHistorial();
    }
  }, [user]);

  const cargarHistorial = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const historialData: HistorialItem[] = [];

      // Cargar historial de laboratorios (estado = 2 significa devuelto/completado)
      const labsQuery = query(
        collection(db, 'reserva_labs'),
        where('id_usuario', '==', user.uid),
        where('estado', '==', 2)
      );
      const labsSnapshot = await getDocs(labsQuery);

      for (const docSnap of labsSnapshot.docs) {
        const data = docSnap.data();
        
        // Obtener datos del laboratorio
        const labDoc = await getDocs(collection(db, 'laboratorios'));
        const lab = labDoc.docs.find(doc => doc.id === data.id_lab);
        const labData = lab?.data();

        // Formatear horarios
        const horariosStr = data.horarios?.map((h: any) => 
          `${h.hora_inicio}-${h.hora_fin}`
        ).join(', ') || 'N/A';

        historialData.push({
          id: docSnap.id,
          tipo: 'laboratorio',
          nombre: labData?.nombre || 'Laboratorio desconocido',
          fecha_reserva: data.dia || '',
          fecha_devolucion: data.dia || '',
          fecha_devolucion_real: data.fecha_devolucion_real || '',
          horarios: horariosStr,
          participantes: data.participantes || 0,
          motivo: data.motivo || '',
          comentario: data.comentario || '',
          estado: data.estado
        });
      }

      // Cargar historial de recursos (estado = 2 significa devuelto/completado)
      const recursosQuery = query(
        collection(db, 'reserva_recurso'),
        where('id_usuario', '==', user.uid),
        where('estado', '==', 2)
      );
      const recursosSnapshot = await getDocs(recursosQuery);

      // Cargar medidas para los recursos
      const medidasSnapshot = await getDocs(collection(db, 'medida'));
      const medidasMap = new Map();
      medidasSnapshot.docs.forEach(doc => {
        medidasMap.set(doc.id, doc.data().nombre);
      });

      for (const docSnap of recursosSnapshot.docs) {
        const data = docSnap.data();
        
        // Obtener datos del recurso
        const recursoDoc = await getDocs(collection(db, 'recurso'));
        const recurso = recursoDoc.docs.find(doc => doc.id === data.id_recurso);
        const recursoData = recurso?.data();

        historialData.push({
          id: docSnap.id,
          tipo: 'recurso',
          nombre: recursoData?.nombre || 'Recurso desconocido',
          fecha_reserva: data.fecha_reserva || '',
          fecha_devolucion: data.fecha_devolucion || '',
          fecha_devolucion_real: data.fecha_devolucion_real || '',
          cantidad: data.cantidad || 0,
          unidad: medidasMap.get(data.id_medida) || '',
          motivo: data.motivo || '',
          comentario: data.comentario || '',
          estado: data.estado
        });
      }

      // Ordenar por fecha de devolución real más reciente
      historialData.sort((a, b) => {
        const fechaA = a.fecha_devolucion_real || a.fecha_devolucion;
        const fechaB = b.fecha_devolucion_real || b.fecha_devolucion;
        return new Date(fechaB).getTime() - new Date(fechaA).getTime();
      });

      setHistorial(historialData);
    } catch (error) {
      console.error('Error cargando historial:', error);
      alert('Error al cargar el historial');
    } finally {
      setLoading(false);
    }
  };

  const formatearFecha = (fecha: string) => {
    if (!fecha) return 'N/A';
    try {
      // Si es una fecha ISO
      if (fecha.includes('T')) {
        return new Date(fecha).toLocaleDateString('es-ES', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit'
        });
      }
      // Si es formato DD/MM/YYYY
      if (fecha.includes('/')) {
        return fecha;
      }
      // Si es formato YYYY-MM-DD
      const [year, month, day] = fecha.split('-');
      return `${day}/${month}/${year}`;
    } catch (error) {
      return fecha;
    }
  };

  const obtenerHistorialFiltrado = () => {
    const fechaInicio = new Date(filtrosExport.fechaInicio).getTime();
    const fechaFin = new Date(filtrosExport.fechaFin).getTime();

    return historial.filter(item => {
      // Filtrar por tipo
      if (filtrosExport.tipoReporte === 'laboratorios' && item.tipo !== 'laboratorio') return false;
      if (filtrosExport.tipoReporte === 'recursos' && item.tipo !== 'recurso') return false;

      // Filtrar por fecha
      const fechaItem = new Date(item.fecha_devolucion_real || item.fecha_devolucion).getTime();
      return fechaItem >= fechaInicio && fechaItem <= fechaFin;
    });
  };

  const exportarPDF = async () => {
    try {
      const doc = new jsPDF();
      let yPos = 20;

      // Título
      doc.setFontSize(18);
      doc.text('HISTORIAL DE USO - AP-LABS', 15, yPos);
      yPos += 10;

      doc.setFontSize(10);
      doc.text(`Usuario: ${user?.nombre || 'N/A'}`, 15, yPos);
      yPos += 5;
      doc.text(`Email: ${user?.email || 'N/A'}`, 15, yPos);
      yPos += 5;
      doc.text(`Período: ${filtrosExport.fechaInicio} al ${filtrosExport.fechaFin}`, 15, yPos);
      yPos += 5;
      doc.text(`Generado: ${new Date().toLocaleString('es-ES')}`, 15, yPos);
      yPos += 15;

      const datosHistorial = obtenerHistorialFiltrado();

      // Estadísticas
      doc.setFontSize(14);
      doc.text('RESUMEN', 15, yPos);
      yPos += 10;

      const totalLabs = datosHistorial.filter(h => h.tipo === 'laboratorio').length;
      const totalRecursos = datosHistorial.filter(h => h.tipo === 'recurso').length;

      const statsData = [
        ['Total de Laboratorios Usados', totalLabs.toString()],
        ['Total de Recursos Usados', totalRecursos.toString()],
        ['Total de Reservas Completadas', datosHistorial.length.toString()]
      ];

      autoTable(doc, {
        startY: yPos,
        head: [['Indicador', 'Valor']],
        body: statsData,
        theme: 'grid',
        headStyles: { fillColor: [102, 126, 234] }
      });

      yPos = (doc as any).lastAutoTable.finalY + 15;

      // Historial de Laboratorios
      if (filtrosExport.tipoReporte === 'completo' || filtrosExport.tipoReporte === 'laboratorios') {
        const laboratorios = datosHistorial.filter(h => h.tipo === 'laboratorio');
        
        if (laboratorios.length > 0) {
          if (yPos > 200) {
            doc.addPage();
            yPos = 20;
          }

          doc.setFontSize(14);
          doc.text(`HISTORIAL DE LABORATORIOS (${laboratorios.length})`, 15, yPos);
          yPos += 10;

          const labsData = laboratorios.map(l => [
            l.nombre,
            formatearFecha(l.fecha_reserva),
            l.horarios || 'N/A',
            l.participantes?.toString() || '0',
            formatearFecha(l.fecha_devolucion_real || l.fecha_devolucion),
            l.motivo
          ]);

          autoTable(doc, {
            startY: yPos,
            head: [['Laboratorio', 'Fecha Reserva', 'Horarios', 'Participantes', 'Devuelto', 'Motivo']],
            body: labsData,
            theme: 'striped',
            headStyles: { fillColor: [102, 126, 234] },
            styles: { fontSize: 8 }
          });

          yPos = (doc as any).lastAutoTable.finalY + 15;
        }
      }

      // Historial de Recursos
      if (filtrosExport.tipoReporte === 'completo' || filtrosExport.tipoReporte === 'recursos') {
        const recursos = datosHistorial.filter(h => h.tipo === 'recurso');
        
        if (recursos.length > 0) {
          if (yPos > 200) {
            doc.addPage();
            yPos = 20;
          }

          doc.setFontSize(14);
          doc.text(`HISTORIAL DE RECURSOS (${recursos.length})`, 15, yPos);
          yPos += 10;

          const recursosData = recursos.map(r => [
            r.nombre,
            formatearFecha(r.fecha_reserva),
            formatearFecha(r.fecha_devolucion),
            r.cantidad?.toString() || '0',
            r.unidad || '',
            formatearFecha(r.fecha_devolucion_real || r.fecha_devolucion),
            r.motivo
          ]);

          autoTable(doc, {
            startY: yPos,
            head: [['Recurso', 'Fecha Reserva', 'Fecha Programada', 'Cantidad', 'Unidad', 'Devuelto', 'Motivo']],
            body: recursosData,
            theme: 'striped',
            headStyles: { fillColor: [102, 126, 234] },
            styles: { fontSize: 8 }
          });
        }
      }

      // Guardar PDF
      const tipoReporte = filtrosExport.tipoReporte === 'completo' ? 'Completo' : 
                          filtrosExport.tipoReporte === 'laboratorios' ? 'Laboratorios' : 'Recursos';
      doc.save(`Historial_${tipoReporte}_${filtrosExport.fechaInicio}_${filtrosExport.fechaFin}.pdf`);

    } catch (error) {
      console.error('Error generando PDF:', error);
      alert('Error al generar el PDF');
    }
  };

  const exportarExcel = () => {
    try {
      const workbook = XLSX.utils.book_new();
      const datosHistorial = obtenerHistorialFiltrado();

      // Preparar datos para una sola hoja
      const dataCompleta: any[][] = [];

      // ===== SECCIÓN 1: ENCABEZADO =====
      dataCompleta.push(['HISTORIAL DE USO - SISTEMA AP-LABS']);
      dataCompleta.push([]); // Línea en blanco

      // ===== SECCIÓN 2: INFORMACIÓN DEL USUARIO =====
      dataCompleta.push(['INFORMACIÓN DEL USUARIO']);
      dataCompleta.push(['Usuario:', user?.nombre || 'N/A']);
      dataCompleta.push(['Email:', user?.email || 'N/A']);
      dataCompleta.push(['Período:', `${filtrosExport.fechaInicio} al ${filtrosExport.fechaFin}`]);
      dataCompleta.push(['Generado:', new Date().toLocaleString('es-ES')]);
      dataCompleta.push([]); // Línea en blanco

      // ===== SECCIÓN 3: RESUMEN ESTADÍSTICO =====
      dataCompleta.push(['RESUMEN ESTADÍSTICO']);
      dataCompleta.push(['Indicador', 'Valor']);
      dataCompleta.push(['Total de Laboratorios Usados', datosHistorial.filter(h => h.tipo === 'laboratorio').length]);
      dataCompleta.push(['Total de Recursos Usados', datosHistorial.filter(h => h.tipo === 'recurso').length]);
      dataCompleta.push(['Total de Reservas Completadas', datosHistorial.length]);
      dataCompleta.push([]); // Línea en blanco
      dataCompleta.push([]); // Línea en blanco

      // ===== SECCIÓN 4: HISTORIAL DE LABORATORIOS =====
      if (filtrosExport.tipoReporte === 'completo' || filtrosExport.tipoReporte === 'laboratorios') {
        const laboratorios = datosHistorial.filter(h => h.tipo === 'laboratorio');
        
        if (laboratorios.length > 0) {
          dataCompleta.push([`HISTORIAL DE LABORATORIOS (${laboratorios.length} registros)`]);
          dataCompleta.push([]); // Línea en blanco
          
          // Encabezados de la tabla
          dataCompleta.push([
            'Laboratorio',
            'Fecha Reserva',
            'Horarios',
            'Participantes',
            'Fecha Devolución',
            'Motivo',
            'Comentarios'
          ]);
          
          // Datos de laboratorios
          laboratorios.forEach(l => {
            dataCompleta.push([
              l.nombre,
              formatearFecha(l.fecha_reserva),
              l.horarios || 'N/A',
              l.participantes || 0,
              formatearFecha(l.fecha_devolucion_real || l.fecha_devolucion),
              l.motivo,
              l.comentario || 'Sin comentarios'
            ]);
          });
          
          dataCompleta.push([]); // Línea en blanco
          dataCompleta.push([]); // Línea en blanco
        }
      }

      // ===== SECCIÓN 5: HISTORIAL DE RECURSOS =====
      if (filtrosExport.tipoReporte === 'completo' || filtrosExport.tipoReporte === 'recursos') {
        const recursos = datosHistorial.filter(h => h.tipo === 'recurso');
        
        if (recursos.length > 0) {
          dataCompleta.push([`HISTORIAL DE RECURSOS (${recursos.length} registros)`]);
          dataCompleta.push([]); // Línea en blanco
          
          // Encabezados de la tabla
          dataCompleta.push([
            'Recurso',
            'Fecha Reserva',
            'Fecha Programada',
            'Cantidad',
            'Unidad',
            'Fecha Devolución Real',
            'Motivo',
            'Comentarios'
          ]);
          
          // Datos de recursos
          recursos.forEach(r => {
            dataCompleta.push([
              r.nombre,
              formatearFecha(r.fecha_reserva),
              formatearFecha(r.fecha_devolucion),
              r.cantidad || 0,
              r.unidad || '',
              formatearFecha(r.fecha_devolucion_real || r.fecha_devolucion),
              r.motivo,
              r.comentario || 'Sin comentarios'
            ]);
          });
        }
      }

      // Crear la hoja de cálculo
      const worksheet = XLSX.utils.aoa_to_sheet(dataCompleta);

      // ===== CONFIGURAR ANCHOS DE COLUMNAS =====
      worksheet['!cols'] = [
        { wch: 25 }, // Columna A
        { wch: 18 }, // Columna B
        { wch: 20 }, // Columna C
        { wch: 13 }, // Columna D
        { wch: 18 }, // Columna E
        { wch: 30 }, // Columna F
        { wch: 30 }, // Columna G
        { wch: 30 }  // Columna H
      ];

      // ===== APLICAR MERGES (FUSIONES) =====
      if (!worksheet['!merges']) worksheet['!merges'] = [];
      
      let currentRow = 0;
      
      // Merge del título principal (fila 1)
      worksheet['!merges'].push({
        s: { r: currentRow, c: 0 },
        e: { r: currentRow, c: 7 }
      });
      currentRow += 2; // Saltar título + línea en blanco

      // Merge del subtítulo "INFORMACIÓN DEL USUARIO" (fila 3)
      worksheet['!merges'].push({
        s: { r: currentRow, c: 0 },
        e: { r: currentRow, c: 7 }
      });
      currentRow += 6; // Saltar sección de usuario + línea en blanco

      // Merge del subtítulo "RESUMEN ESTADÍSTICO" (fila 9)
      worksheet['!merges'].push({
        s: { r: currentRow, c: 0 },
        e: { r: currentRow, c: 7 }
      });
      currentRow += 6; // Saltar resumen + 2 líneas en blanco

      // ===== CALCULAR POSICIÓN DE SECCIONES DE LABORATORIOS Y RECURSOS =====
      if (filtrosExport.tipoReporte === 'completo' || filtrosExport.tipoReporte === 'laboratorios') {
        const laboratorios = datosHistorial.filter(h => h.tipo === 'laboratorio');
        if (laboratorios.length > 0) {
          // Merge del título de laboratorios
          worksheet['!merges'].push({
            s: { r: currentRow, c: 0 },
            e: { r: currentRow, c: 7 }
          });
          currentRow += 2 + laboratorios.length + 2; // Título + espacio + datos + 2 líneas en blanco
        }
      }

      if (filtrosExport.tipoReporte === 'completo' || filtrosExport.tipoReporte === 'recursos') {
        const recursos = datosHistorial.filter(h => h.tipo === 'recurso');
        if (recursos.length > 0) {
          // Merge del título de recursos
          worksheet['!merges'].push({
            s: { r: currentRow, c: 0 },
            e: { r: currentRow, c: 7 }
          });
        }
      }

      // Agregar la hoja al libro
      const tipoReporte = filtrosExport.tipoReporte === 'completo' ? 'Completo' : 
                          filtrosExport.tipoReporte === 'laboratorios' ? 'Laboratorios' : 'Recursos';
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Historial Completo');

      // Guardar archivo
      XLSX.writeFile(workbook, `Historial_${tipoReporte}_${filtrosExport.fechaInicio}_${filtrosExport.fechaFin}.xlsx`);

    } catch (error) {
      console.error('Error generando Excel:', error);
      alert('Error al generar el archivo Excel');
    }
  };

  const handleExportar = async () => {
    if (!user) return;

    setLoadingExport(true);
    try {
      if (filtrosExport.formato === 'pdf' || filtrosExport.formato === 'ambos') {
        await exportarPDF();
      }

      if (filtrosExport.formato === 'excel' || filtrosExport.formato === 'ambos') {
        exportarExcel();
      }

      // Registrar en bitácora
      await registrarEnBitacora({
        usuario_nombre: user.nombre,
        usuario_email: user.email,
        usuario_rol: user.rol,
        accion: 'Exportar Historial',
        accion_detalle: `Exportó historial de ${filtrosExport.tipoReporte} en formato ${filtrosExport.formato}`,
        modulo: 'Historial de Usuario',
        observaciones: `Período: ${filtrosExport.fechaInicio} al ${filtrosExport.fechaFin}`
      });

      alert('Historial exportado exitosamente');
      setShowExportModal(false);

    } catch (error: any) {
      console.error('Error exportando historial:', error);
      alert('Error al exportar el historial: ' + error.message);
    } finally {
      setLoadingExport(false);
    }
  };

  const handleVerDetalle = (item: HistorialItem) => {
    setItemSeleccionado(item);
    setShowDetalle(true);
  };

  const historialFiltrado = historial.filter(item => {
    const matchSearch = item.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       item.motivo.toLowerCase().includes(searchTerm.toLowerCase());
    const matchTipo = filterTipo === 'todos' || item.tipo === filterTipo;
    return matchSearch && matchTipo;
  });

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Cargando historial...</p>
      </div>
    );
  }

  return (
    <div className="user-historial">
      <div className="historial-header">
        <h1><FiBarChart className="header-icon" /> Historial de Uso</h1>
        <p className="subtitle">Consulta tu historial de reservas completadas</p>
      </div>

      {/* Botón de Exportar */}
      <div className="export-section">
        <button 
          className="btn-export"
          onClick={() => setShowExportModal(true)}
        >
          <FiDownload /> Exportar Historial
        </button>
      </div>

      {/* Filtros */}
      <div className="filtros-section">
        <div className="search-box">
          <FiSearch className="search-icon" />
          <input
            type="text"
            placeholder="Buscar por nombre o motivo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="filter-group">
          <label>Tipo:</label>
          <select value={filterTipo} onChange={(e) => setFilterTipo(e.target.value as any)}>
            <option value="todos">Todos</option>
            <option value="laboratorio">Laboratorios</option>
            <option value="recurso">Recursos</option>
          </select>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="stats-cards">
        <div className="stat-card">
          <div className="stat-icon"><FiPackage /></div>
          <div className="stat-info">
            <h3>{historial.filter(h => h.tipo === 'laboratorio').length}</h3>
            <p>Laboratorios Usados</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon"><FiPackage /></div>
          <div className="stat-info">
            <h3>{historial.filter(h => h.tipo === 'recurso').length}</h3>
            <p>Recursos Usados</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon"><FiCheckCircle /></div>
          <div className="stat-info">
            <h3>{historial.length}</h3>
            <p>Total Devoluciones</p>
          </div>
        </div>
      </div>

      {/* Lista de historial */}
      <div className="historial-list">
        {historialFiltrado.length > 0 ? (
          historialFiltrado.map(item => (
            <div key={item.id} className="historial-item">
              <div className="item-icon">
                {item.tipo === 'laboratorio' ? <FiPackage /> : <FiPackage />}
              </div>
              <div className="item-content">
                <div className="item-header">
                  <h3>{item.nombre}</h3>
                  <span className={`badge badge-${item.tipo}`}>
                    {item.tipo === 'laboratorio' ? 'Laboratorio' : 'Recurso'}
                  </span>
                </div>
                <div className="item-details">
                  {item.tipo === 'laboratorio' ? (
                    <>
                      <p><FiCalendar className="inline-icon" /> <strong>Fecha:</strong> {formatearFecha(item.fecha_reserva)}</p>
                      <p><FiClock className="inline-icon" /> <strong>Horarios:</strong> {item.horarios}</p>
                      <p><FiUsers className="inline-icon" /> <strong>Participantes:</strong> {item.participantes}</p>
                    </>
                  ) : (
                    <>
                      <p><FiCalendar className="inline-icon" /> <strong>Reserva:</strong> {formatearFecha(item.fecha_reserva)}</p>
                      <p><FiCalendar className="inline-icon" /> <strong>Devolución:</strong> {formatearFecha(item.fecha_devolucion)}</p>
                      <p><FiPackage className="inline-icon" /> <strong>Cantidad:</strong> {item.cantidad} {item.unidad}</p>
                    </>
                  )}
                  {item.fecha_devolucion_real && (
                    <p><FiCheckCircle className="inline-icon" /> <strong>Devuelto:</strong> {formatearFecha(item.fecha_devolucion_real)}</p>
                  )}
                </div>
              </div>
              <button 
                className="btn-ver-detalle"
                onClick={() => handleVerDetalle(item)}
              >
                Ver Detalle
              </button>
            </div>
          ))
        ) : (
          <div className="no-results">
            <FiFileText className="empty-icon" />
            <p>No se encontraron registros en el historial</p>
            {searchTerm && (
              <button className="btn-clear" onClick={() => setSearchTerm('')}>
                Limpiar búsqueda
              </button>
            )}
          </div>
        )}
      </div>

      {/* Modal de Exportación */}
      {showExportModal && (
        <div className="modal-overlay" onClick={() => setShowExportModal(false)}>
          <div className="modal-export" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2><FiDownload /> Exportar Historial</h2>
              <button className="btn-close" onClick={() => setShowExportModal(false)}>×</button>
            </div>

            <div className="modal-body">
              <div className="form-group">
                <label>Tipo de Reporte:</label>
                <select
                  value={filtrosExport.tipoReporte}
                  onChange={(e) => setFiltrosExport({ ...filtrosExport, tipoReporte: e.target.value as any })}
                >
                  <option value="completo">Historial Completo</option>
                  <option value="laboratorios">Solo Laboratorios</option>
                  <option value="recursos">Solo Recursos</option>
                </select>
              </div>

              <div className="form-group">
                <label>Fecha Inicio:</label>
                <input
                  type="date"
                  value={filtrosExport.fechaInicio}
                  onChange={(e) => setFiltrosExport({ ...filtrosExport, fechaInicio: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Fecha Fin:</label>
                <input
                  type="date"
                  value={filtrosExport.fechaFin}
                  onChange={(e) => setFiltrosExport({ ...filtrosExport, fechaFin: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Formato:</label>
                <select
                  value={filtrosExport.formato}
                  onChange={(e) => setFiltrosExport({ ...filtrosExport, formato: e.target.value as any })}
                >
                  <option value="ambos">PDF + Excel</option>
                  <option value="pdf">Solo PDF</option>
                  <option value="excel">Solo Excel</option>
                </select>
              </div>

              <div className="info-box">
                <p>Se exportarán <strong>{obtenerHistorialFiltrado().length}</strong> registros del periodo seleccionado.</p>
              </div>
            </div>

            <div className="modal-footer">
              <button 
                className="btn-secondary" 
                onClick={() => setShowExportModal(false)}
                disabled={loadingExport}
              >
                Cancelar
              </button>
              <button 
                className="btn-primary" 
                onClick={handleExportar}
                disabled={loadingExport}
              >
                {loadingExport ? 'Exportando...' : <><FiDownload /> Exportar</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de detalle */}
      {showDetalle && itemSeleccionado && (
        <div className="modal-overlay" onClick={() => setShowDetalle(false)}>
          <div className="modal-detalle" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>
                {itemSeleccionado.tipo === 'laboratorio' ? <FiPackage /> : <FiPackage />} 
                {' '}{itemSeleccionado.nombre}
              </h2>
              <button className="btn-close" onClick={() => setShowDetalle(false)}>×</button>
            </div>

            <div className="modal-body">
              <div className="detalle-section">
                <h3><FiFileText className="section-icon" /> Información General</h3>
                <div className="detalle-grid">
                  <div className="detalle-item">
                    <strong>Tipo:</strong>
                    <span className={`badge badge-${itemSeleccionado.tipo}`}>
                      {itemSeleccionado.tipo === 'laboratorio' ? 'Laboratorio' : 'Recurso'}
                    </span>
                  </div>
                  <div className="detalle-item">
                    <strong>Estado:</strong>
                    <span className="badge badge-completado"><FiCheckCircle /> Completado</span>
                  </div>
                </div>
              </div>

              <div className="detalle-section">
                <h3><FiCalendar className="section-icon" /> Fechas</h3>
                <div className="detalle-grid">
                  <div className="detalle-item">
                    <strong>Fecha de Reserva:</strong>
                    <span>{formatearFecha(itemSeleccionado.fecha_reserva)}</span>
                  </div>
                  {itemSeleccionado.tipo === 'recurso' && (
                    <div className="detalle-item">
                      <strong>Fecha de Devolución Programada:</strong>
                      <span>{formatearFecha(itemSeleccionado.fecha_devolucion)}</span>
                    </div>
                  )}
                  {itemSeleccionado.fecha_devolucion_real && (
                    <div className="detalle-item">
                      <strong>Fecha de Devolución Real:</strong>
                      <span>{formatearFecha(itemSeleccionado.fecha_devolucion_real)}</span>
                    </div>
                  )}
                </div>
              </div>

              {itemSeleccionado.tipo === 'laboratorio' ? (
                <div className="detalle-section">
                  <h3><FiPackage className="section-icon" /> Detalles del Laboratorio</h3>
                  <div className="detalle-grid">
                    <div className="detalle-item">
                      <strong>Horarios:</strong>
                      <span>{itemSeleccionado.horarios}</span>
                    </div>
                    <div className="detalle-item">
                      <strong>Participantes:</strong>
                      <span>{itemSeleccionado.participantes} personas</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="detalle-section">
                  <h3><FiPackage className="section-icon" /> Detalles del Recurso</h3>
                  <div className="detalle-grid">
                    <div className="detalle-item">
                      <strong>Cantidad:</strong>
                      <span>{itemSeleccionado.cantidad} {itemSeleccionado.unidad}</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="detalle-section">
                <h3><FiFileText className="section-icon" /> Motivo</h3>
                <p className="motivo-text">{itemSeleccionado.motivo}</p>
              </div>

              {itemSeleccionado.comentario && (
                <div className="detalle-section">
                  <h3><FiFileText className="section-icon" /> Comentarios</h3>
                  <p className="comentario-text">{itemSeleccionado.comentario}</p>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button className="btn-cerrar" onClick={() => setShowDetalle(false)}>
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserHistorial;
