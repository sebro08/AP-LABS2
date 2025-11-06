import { useState, useEffect } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useAuth } from '../../context/AuthContext';
import { FiltrosReporte, EstadisticasGenerales, DatosReporte } from '../../types/Reporte';
import { registrarEnBitacora } from '../../utils/bitacoraHelper';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import './GestionReportes.css';

const GestionReportes = () => {
  const { user: currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [estadisticas, setEstadisticas] = useState<EstadisticasGenerales | null>(null);
  const [departamentos, setDepartamentos] = useState<any[]>([]);
  const [estados, setEstados] = useState<any[]>([]);

  const [filtros, setFiltros] = useState<FiltrosReporte>({
    fechaInicio: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0],
    fechaFin: new Date().toISOString().split('T')[0],
    tipoReporte: 'completo',
    formato: 'ambos'
  });

  useEffect(() => {
    cargarDatosIniciales();
  }, []);

  const cargarDatosIniciales = async () => {
    try {
      // Cargar estadísticas
      const stats = await obtenerEstadisticas();
      setEstadisticas(stats);

      // Cargar departamentos
      const deptSnapshot = await getDocs(collection(db, 'departamentos'));
      setDepartamentos(deptSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));

      // Cargar estados
      const estadosSnapshot = await getDocs(collection(db, 'estado'));
      setEstados(estadosSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));

    } catch (error) {
      console.error('Error cargando datos:', error);
    }
  };

  const obtenerEstadisticas = async (): Promise<EstadisticasGenerales> => {
    try {
      // Usuarios
      const usuariosSnapshot = await getDocs(collection(db, 'usuarios'));
      const usuarios = usuariosSnapshot.docs.map(doc => doc.data());
      const totalUsuarios = usuarios.length;
      const usuariosActivos = usuarios.filter(u => u.activo).length;

      // Laboratorios
      const labsSnapshot = await getDocs(collection(db, 'laboratorios'));
      const laboratorios = labsSnapshot.docs.map(doc => doc.data());
      const totalLaboratorios = laboratorios.length;
      const laboratoriosActivos = laboratorios.filter(l => l.activo).length;

      // Recursos
      const recursosSnapshot = await getDocs(collection(db, 'recurso'));
      const recursos = recursosSnapshot.docs.map(doc => doc.data());
      const totalRecursos = recursos.length;
      const recursosDisponibles = recursos.filter(r => r.id_estado === '1').length;
      const recursosEnMantenimiento = recursos.filter(r => r.id_estado === '3').length;

      // Solicitudes
      const solicitudesSnapshot = await getDocs(collection(db, 'solicitudes_recursos'));
      const solicitudes = solicitudesSnapshot.docs.map(doc => doc.data());
      const solicitudesPendientes = solicitudes.filter(s => s.id_estado === '1').length;
      const solicitudesAprobadas = solicitudes.filter(s => s.id_estado === '2').length;
      const solicitudesRechazadas = solicitudes.filter(s => s.id_estado === '3').length;

      // Mantenimientos
      const mantenimientosSnapshot = await getDocs(collection(db, 'mantenimiento'));
      const mantenimientos = mantenimientosSnapshot.docs.map(doc => doc.data());
      const mantenimientosProgramados = mantenimientos.filter(m => m.id_estado === '3').length;
      const mantenimientosCompletados = mantenimientos.filter(m => m.id_estado === '1').length;

      // Mensajes
      const mensajesSnapshot = await getDocs(collection(db, 'mensaje'));
      const mensajesEnviados = mensajesSnapshot.size;

      // Bitácora
      const bitacoraSnapshot = await getDocs(collection(db, 'bitacora'));
      const actividadesBitacora = bitacoraSnapshot.size;

      return {
        totalUsuarios,
        usuariosActivos,
        totalLaboratorios,
        laboratoriosActivos,
        totalRecursos,
        recursosDisponibles,
        recursosEnMantenimiento,
        solicitudesPendientes,
        solicitudesAprobadas,
        solicitudesRechazadas,
        mantenimientosProgramados,
        mantenimientosCompletados,
        mensajesEnviados,
        actividadesBitacora
      };
    } catch (error) {
      console.error('Error obteniendo estadísticas:', error);
      return {} as EstadisticasGenerales;
    }
  };

  const obtenerDatosReporte = async (): Promise<DatosReporte> => {
    const datos: DatosReporte = {};

    try {
      const fechaInicioTimestamp = new Date(filtros.fechaInicio).getTime();
      const fechaFinTimestamp = new Date(filtros.fechaFin).getTime();

      if (filtros.tipoReporte === 'usuarios' || filtros.tipoReporte === 'completo') {
        const usuariosSnapshot = await getDocs(collection(db, 'usuarios'));
        datos.usuarios = usuariosSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
      }

      if (filtros.tipoReporte === 'laboratorios' || filtros.tipoReporte === 'completo') {
        let q = collection(db, 'laboratorios');
        if (filtros.idDepartamento) {
          q = query(collection(db, 'laboratorios'), where('id_departamento', '==', filtros.idDepartamento)) as any;
        }
        const labsSnapshot = await getDocs(q);
        datos.laboratorios = labsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
      }

      if (filtros.tipoReporte === 'inventario' || filtros.tipoReporte === 'completo') {
        let q = collection(db, 'recurso');
        if (filtros.idEstado) {
          q = query(collection(db, 'recurso'), where('id_estado', '==', filtros.idEstado)) as any;
        }
        const recursosSnapshot = await getDocs(q);
        datos.recursos = recursosSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
      }

      if (filtros.tipoReporte === 'solicitudes' || filtros.tipoReporte === 'completo') {
        const solicitudesSnapshot = await getDocs(collection(db, 'solicitudes_recursos'));
        datos.solicitudes = solicitudesSnapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .filter((s: any) => {
            if (!s.fecha_solicitud) return true;
            const fechaSolicitud = new Date(s.fecha_solicitud).getTime();
            return fechaSolicitud >= fechaInicioTimestamp && fechaSolicitud <= fechaFinTimestamp;
          });
      }

      if (filtros.tipoReporte === 'mantenimientos' || filtros.tipoReporte === 'completo') {
        const mantenimientosSnapshot = await getDocs(collection(db, 'mantenimiento'));
        datos.mantenimientos = mantenimientosSnapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .filter((m: any) => {
            if (!m.fecha_programada) return true;
            const fechaMant = new Date(m.fecha_programada).getTime();
            return fechaMant >= fechaInicioTimestamp && fechaMant <= fechaFinTimestamp;
          });
      }

      if (filtros.tipoReporte === 'mensajes' || filtros.tipoReporte === 'completo') {
        const mensajesSnapshot = await getDocs(collection(db, 'mensaje'));
        datos.mensajes = mensajesSnapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .filter((m: any) => {
            if (!m.fecha_envio) return true;
            const fechaMensaje = new Date(m.fecha_envio).getTime();
            return fechaMensaje >= fechaInicioTimestamp && fechaMensaje <= fechaFinTimestamp;
          });
      }

      if (filtros.tipoReporte === 'bitacora' || filtros.tipoReporte === 'completo') {
        const bitacoraSnapshot = await getDocs(collection(db, 'bitacora'));
        datos.bitacora = bitacoraSnapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .filter((b: any) => {
            if (!b.timestamp) return true;
            const fechaBitacora = b.timestamp.toDate().getTime();
            return fechaBitacora >= fechaInicioTimestamp && fechaBitacora <= fechaFinTimestamp;
          });
      }

      datos.estadisticas = estadisticas || undefined;

    } catch (error) {
      console.error('Error obteniendo datos del reporte:', error);
    }

    return datos;
  };

  const exportarPDF = async (datos: DatosReporte) => {
    try {
      const doc = new jsPDF('landscape');
      let yPos = 20;

      // Título
      doc.setFontSize(18);
      doc.text('REPORTE GENERAL - SISTEMA AP-LABS', 15, yPos);
      yPos += 10;

      doc.setFontSize(10);
      doc.text(`Periodo: ${filtros.fechaInicio} al ${filtros.fechaFin}`, 15, yPos);
      yPos += 5;
      doc.text(`Generado: ${new Date().toLocaleString('es-ES')}`, 15, yPos);
      yPos += 15;

      // Estadísticas Generales
      if (datos.estadisticas) {
        doc.setFontSize(14);
        doc.text('ESTADISTICAS GENERALES', 15, yPos);
        yPos += 10;

        const statsData = [
          ['Total Usuarios', datos.estadisticas.totalUsuarios.toString()],
          ['Usuarios Activos', datos.estadisticas.usuariosActivos.toString()],
          ['Total Laboratorios', datos.estadisticas.totalLaboratorios.toString()],
          ['Laboratorios Activos', datos.estadisticas.laboratoriosActivos.toString()],
          ['Total Recursos', datos.estadisticas.totalRecursos.toString()],
          ['Recursos Disponibles', datos.estadisticas.recursosDisponibles.toString()],
          ['Recursos en Mantenimiento', datos.estadisticas.recursosEnMantenimiento.toString()],
          ['Solicitudes Pendientes', datos.estadisticas.solicitudesPendientes.toString()],
          ['Solicitudes Aprobadas', datos.estadisticas.solicitudesAprobadas.toString()],
          ['Solicitudes Rechazadas', datos.estadisticas.solicitudesRechazadas.toString()],
          ['Mantenimientos Programados', datos.estadisticas.mantenimientosProgramados.toString()],
          ['Mantenimientos Completados', datos.estadisticas.mantenimientosCompletados.toString()],
          ['Mensajes Enviados', datos.estadisticas.mensajesEnviados.toString()],
          ['Actividades Registradas', datos.estadisticas.actividadesBitacora.toString()]
        ];

        autoTable(doc, {
          startY: yPos,
          head: [['Indicador', 'Valor']],
          body: statsData,
          theme: 'grid',
          headStyles: { fillColor: [102, 126, 234] }
        });

        yPos = (doc as any).lastAutoTable.finalY + 15;
      }

      // Usuarios
      if (datos.usuarios && datos.usuarios.length > 0) {
        if (yPos > 170) {
          doc.addPage();
          yPos = 20;
        }

        doc.setFontSize(14);
        doc.text(`USUARIOS (${datos.usuarios.length})`, 15, yPos);
        yPos += 10;

        const usuariosData = datos.usuarios.slice(0, 50).map(u => [
          `${u.primer_nombre} ${u.primer_apellido}`,
          u.email || '',
          u.id_rol === '1' ? 'Estudiante' : u.id_rol === '2' ? 'Docente' : u.id_rol === '3' ? 'Admin' : 'Técnico',
          u.activo ? 'Activo' : 'Inactivo'
        ]);

        autoTable(doc, {
          startY: yPos,
          head: [['Nombre', 'Email', 'Rol', 'Estado']],
          body: usuariosData,
          theme: 'grid',
          headStyles: { fillColor: [102, 126, 234] }
        });

        yPos = (doc as any).lastAutoTable.finalY + 15;
      }

      // Laboratorios
      if (datos.laboratorios && datos.laboratorios.length > 0) {
        if (yPos > 170) {
          doc.addPage();
          yPos = 20;
        }

        doc.setFontSize(14);
        doc.text(`LABORATORIOS (${datos.laboratorios.length})`, 15, yPos);
        yPos += 10;

        const labsData = datos.laboratorios.slice(0, 50).map(l => [
          l.nombre || '',
          l.capacidad?.toString() || '',
          l.activo ? 'Activo' : 'Inactivo'
        ]);

        autoTable(doc, {
          startY: yPos,
          head: [['Nombre', 'Capacidad', 'Estado']],
          body: labsData,
          theme: 'grid',
          headStyles: { fillColor: [102, 126, 234] }
        });

        yPos = (doc as any).lastAutoTable.finalY + 15;
      }

      // Recursos
      if (datos.recursos && datos.recursos.length > 0) {
        if (yPos > 170) {
          doc.addPage();
          yPos = 20;
        }

        doc.setFontSize(14);
        doc.text(`RECURSOS (${datos.recursos.length})`, 15, yPos);
        yPos += 10;

        const recursosData = datos.recursos.slice(0, 50).map(r => [
          r.nombre || '',
          r.id_estado === '1' ? 'Disponible' : r.id_estado === '2' ? 'Reservado' : r.id_estado === '3' ? 'Mantenimiento' : 'Inactivo',
          r.cantidad?.toString() || ''
        ]);

        autoTable(doc, {
          startY: yPos,
          head: [['Nombre', 'Estado', 'Cantidad']],
          body: recursosData,
          theme: 'grid',
          headStyles: { fillColor: [102, 126, 234] }
        });
      }

      doc.save(`Reporte_General_${filtros.fechaInicio}_${filtros.fechaFin}.pdf`);

    } catch (error) {
      console.error('Error generando PDF:', error);
      alert('Error al generar el PDF');
    }
  };

  const exportarExcel = (datos: DatosReporte) => {
    try {
      let csvContent = '\uFEFF'; // BOM para UTF-8
      
      // Encabezado
      csvContent += `REPORTE GENERAL - SISTEMA AP-LABS\n`;
      csvContent += `Período: ${filtros.fechaInicio} al ${filtros.fechaFin}\n`;
      csvContent += `Generado: ${new Date().toLocaleString('es-ES')}\n\n`;

      // Estadísticas
      if (datos.estadisticas) {
        csvContent += `ESTADÍSTICAS GENERALES\n`;
        csvContent += `Indicador,Valor\n`;
        csvContent += `Total Usuarios,${datos.estadisticas.totalUsuarios}\n`;
        csvContent += `Usuarios Activos,${datos.estadisticas.usuariosActivos}\n`;
        csvContent += `Total Laboratorios,${datos.estadisticas.totalLaboratorios}\n`;
        csvContent += `Laboratorios Activos,${datos.estadisticas.laboratoriosActivos}\n`;
        csvContent += `Total Recursos,${datos.estadisticas.totalRecursos}\n`;
        csvContent += `Recursos Disponibles,${datos.estadisticas.recursosDisponibles}\n`;
        csvContent += `Recursos en Mantenimiento,${datos.estadisticas.recursosEnMantenimiento}\n`;
        csvContent += `Solicitudes Pendientes,${datos.estadisticas.solicitudesPendientes}\n`;
        csvContent += `Solicitudes Aprobadas,${datos.estadisticas.solicitudesAprobadas}\n`;
        csvContent += `Solicitudes Rechazadas,${datos.estadisticas.solicitudesRechazadas}\n`;
        csvContent += `Mantenimientos Programados,${datos.estadisticas.mantenimientosProgramados}\n`;
        csvContent += `Mantenimientos Completados,${datos.estadisticas.mantenimientosCompletados}\n`;
        csvContent += `Mensajes Enviados,${datos.estadisticas.mensajesEnviados}\n`;
        csvContent += `Actividades Registradas,${datos.estadisticas.actividadesBitacora}\n\n`;
      }

      // Usuarios
      if (datos.usuarios && datos.usuarios.length > 0) {
        csvContent += `\nUSUARIOS (${datos.usuarios.length})\n`;
        csvContent += `Nombre,Email,Rol,Estado\n`;
        datos.usuarios.forEach(u => {
          const rol = u.id_rol === '1' ? 'Estudiante' : u.id_rol === '2' ? 'Docente' : u.id_rol === '3' ? 'Admin' : 'Técnico';
          csvContent += `"${u.primer_nombre} ${u.primer_apellido}","${u.email || ''}","${rol}","${u.activo ? 'Activo' : 'Inactivo'}"\n`;
        });
      }

      // Laboratorios
      if (datos.laboratorios && datos.laboratorios.length > 0) {
        csvContent += `\nLABORATORIOS (${datos.laboratorios.length})\n`;
        csvContent += `Nombre,Capacidad,Estado\n`;
        datos.laboratorios.forEach(l => {
          csvContent += `"${l.nombre || ''}","${l.capacidad || ''}","${l.activo ? 'Activo' : 'Inactivo'}"\n`;
        });
      }

      // Recursos
      if (datos.recursos && datos.recursos.length > 0) {
        csvContent += `\nRECURSOS (${datos.recursos.length})\n`;
        csvContent += `Nombre,Estado,Cantidad\n`;
        datos.recursos.forEach(r => {
          const estado = r.id_estado === '1' ? 'Disponible' : r.id_estado === '2' ? 'Reservado' : r.id_estado === '3' ? 'Mantenimiento' : 'Inactivo';
          csvContent += `"${r.nombre || ''}","${estado}","${r.cantidad || ''}"\n`;
        });
      }

      // Solicitudes
      if (datos.solicitudes && datos.solicitudes.length > 0) {
        csvContent += `\nSOLICITUDES (${datos.solicitudes.length})\n`;
        csvContent += `Fecha,Estado,Observaciones\n`;
        datos.solicitudes.forEach(s => {
          const estado = s.id_estado === '1' ? 'Pendiente' : s.id_estado === '2' ? 'Aprobada' : 'Rechazada';
          csvContent += `"${s.fecha_solicitud || ''}","${estado}","${s.observaciones || ''}"\n`;
        });
      }

      // Crear y descargar
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `Reporte_General_${filtros.fechaInicio}_${filtros.fechaFin}.csv`;
      link.click();

    } catch (error) {
      console.error('Error generando Excel:', error);
      alert('Error al generar el archivo Excel');
    }
  };

  const handleGenerarReporte = async () => {
    if (!currentUser) return;

    setLoading(true);
    try {
      console.log('🔄 Generando reporte con filtros:', filtros);

      const datos = await obtenerDatosReporte();
      console.log('📊 Datos obtenidos:', datos);

      if (filtros.formato === 'pdf' || filtros.formato === 'ambos') {
        await exportarPDF(datos);
      }

      if (filtros.formato === 'excel' || filtros.formato === 'ambos') {
        exportarExcel(datos);
      }

      // Registrar en bitácora
      await registrarEnBitacora({
        usuario_nombre: currentUser.nombre,
        usuario_email: currentUser.email,
        usuario_rol: currentUser.rol,
        accion: 'Generar Reporte',
        accion_detalle: `Generó reporte de ${filtros.tipoReporte} en formato ${filtros.formato}`,
        modulo: 'Reportes',
        observaciones: `Período: ${filtros.fechaInicio} al ${filtros.fechaFin}`
      });

      alert('✅ Reporte generado exitosamente');

    } catch (error: any) {
      console.error('Error generando reporte:', error);
      alert('Error al generar el reporte: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="gestion-reportes">
      <div className="reportes-header">
        <h1>📊 Reportes Generales</h1>
        <p className="subtitle">Generación de reportes y estadísticas del sistema</p>
      </div>

      {/* Tarjetas de Estadísticas */}
      {estadisticas && (
        <div className="estadisticas-grid">
          <div className="stat-card">
            <div className="stat-icon">👥</div>
            <div className="stat-content">
              <div className="stat-label">Usuarios</div>
              <div className="stat-value">{estadisticas.totalUsuarios}</div>
              <div className="stat-detail">{estadisticas.usuariosActivos} activos</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">🧪</div>
            <div className="stat-content">
              <div className="stat-label">Laboratorios</div>
              <div className="stat-value">{estadisticas.totalLaboratorios}</div>
              <div className="stat-detail">{estadisticas.laboratoriosActivos} activos</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">📦</div>
            <div className="stat-content">
              <div className="stat-label">Recursos</div>
              <div className="stat-value">{estadisticas.totalRecursos}</div>
              <div className="stat-detail">{estadisticas.recursosDisponibles} disponibles</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">📋</div>
            <div className="stat-content">
              <div className="stat-label">Solicitudes</div>
              <div className="stat-value">{estadisticas.solicitudesPendientes}</div>
              <div className="stat-detail">Pendientes</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">🔧</div>
            <div className="stat-content">
              <div className="stat-label">Mantenimientos</div>
              <div className="stat-value">{estadisticas.mantenimientosProgramados}</div>
              <div className="stat-detail">Programados</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">💬</div>
            <div className="stat-content">
              <div className="stat-label">Mensajes</div>
              <div className="stat-value">{estadisticas.mensajesEnviados}</div>
              <div className="stat-detail">Total enviados</div>
            </div>
          </div>
        </div>
      )}

      {/* Formulario de Filtros */}
      <div className="filtros-container">
        <h2>🔍 Configurar Reporte</h2>
        
        <div className="filtros-grid">
          <div className="form-group">
            <label>Tipo de Reporte:</label>
            <select
              value={filtros.tipoReporte}
              onChange={(e) => setFiltros({ ...filtros, tipoReporte: e.target.value as any })}
            >
              <option value="completo">📊 Reporte Completo</option>
              <option value="usuarios">👥 Usuarios</option>
              <option value="laboratorios">🧪 Laboratorios</option>
              <option value="inventario">📦 Inventario</option>
              <option value="solicitudes">📋 Solicitudes</option>
              <option value="mantenimientos">🔧 Mantenimientos</option>
              <option value="mensajes">💬 Mensajes</option>
              <option value="bitacora">📖 Bitácora</option>
            </select>
          </div>

          <div className="form-group">
            <label>Fecha Inicio:</label>
            <input
              type="date"
              value={filtros.fechaInicio}
              onChange={(e) => setFiltros({ ...filtros, fechaInicio: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label>Fecha Fin:</label>
            <input
              type="date"
              value={filtros.fechaFin}
              onChange={(e) => setFiltros({ ...filtros, fechaFin: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label>Formato:</label>
            <select
              value={filtros.formato}
              onChange={(e) => setFiltros({ ...filtros, formato: e.target.value as any })}
            >
              <option value="ambos">📄 PDF + Excel</option>
              <option value="pdf">📄 Solo PDF</option>
              <option value="excel">📊 Solo Excel</option>
            </select>
          </div>

          {(filtros.tipoReporte === 'laboratorios' || filtros.tipoReporte === 'completo') && (
            <div className="form-group">
              <label>Departamento:</label>
              <select
                value={filtros.idDepartamento || ''}
                onChange={(e) => setFiltros({ ...filtros, idDepartamento: e.target.value || undefined })}
              >
                <option value="">Todos los departamentos</option>
                {departamentos.map(d => (
                  <option key={d.id} value={d.id}>{d.nombre}</option>
                ))}
              </select>
            </div>
          )}

          {(filtros.tipoReporte === 'inventario' || filtros.tipoReporte === 'completo') && (
            <div className="form-group">
              <label>Estado de Recursos:</label>
              <select
                value={filtros.idEstado || ''}
                onChange={(e) => setFiltros({ ...filtros, idEstado: e.target.value || undefined })}
              >
                <option value="">Todos los estados</option>
                {estados.map(e => (
                  <option key={e.id} value={e.id}>{e.nombre}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div className="actions-container">
          <button
            className="btn-primary"
            onClick={handleGenerarReporte}
            disabled={loading}
          >
            {loading ? '⏳ Generando...' : '📊 Generar Reporte'}
          </button>
        </div>
      </div>


    </div>
  );
};

export default GestionReportes;
