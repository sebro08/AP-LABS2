import { useState, useEffect } from 'react';
import { collection, getDocs, query, where, addDoc, updateDoc, doc, Timestamp } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useAuth } from '../../context/AuthContext';
import { registrarEnBitacora } from '../../utils/bitacoraHelper';
import './AdminCalendario.css';

interface Reserva {
  id: string;
  tipo: 'laboratorio' | 'recurso';
  nombre: string;
  usuario: string;
  fecha: string;
  hora_inicio?: string;
  hora_fin?: string;
  estado: string;
  id_item: string;
  id_usuario: string;
}

interface Bloqueo {
  id: string;
  tipo: 'laboratorio' | 'recurso';
  id_item: string;
  nombre_item: string;
  fecha_inicio: string;
  fecha_fin: string;
  motivo: string;
  activo: boolean;
}

type VistaCalendario = 'semanal' | 'mensual';

const AdminCalendario = () => {
  const { user } = useAuth();
  const [vista, setVista] = useState<VistaCalendario>('mensual');
  const [fechaActual, setFechaActual] = useState(new Date());
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [bloqueos, setBloqueos] = useState<Bloqueo[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Modal para crear bloqueo
  const [showModalBloqueo, setShowModalBloqueo] = useState(false);
  const [tipoBloqueo, setTipoBloqueo] = useState<'laboratorio' | 'recurso'>('laboratorio');
  const [itemsDisponibles, setItemsDisponibles] = useState<any[]>([]);
  const [itemSeleccionado, setItemSeleccionado] = useState('');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [motivoBloqueo, setMotivoBloqueo] = useState('');

  // Filtros
  const [filtroTipo, setFiltroTipo] = useState<'todas' | 'laboratorio' | 'recurso'>('todas');
  const [filtroEstado, setFiltroEstado] = useState<'todos' | 'pendiente' | 'aprobada' | 'rechazada'>('todos');

  useEffect(() => {
    cargarDatos();
  }, [fechaActual, vista]);

  useEffect(() => {
    if (showModalBloqueo) {
      cargarItemsDisponibles();
    }
  }, [tipoBloqueo, showModalBloqueo]);

  const cargarDatos = async () => {
    setLoading(true);
    try {
      await Promise.all([
        cargarReservas(),
        cargarBloqueos()
      ]);
    } catch (error) {
      console.error('Error cargando datos:', error);
    } finally {
      setLoading(false);
    }
  };

  const cargarReservas = async () => {
    try {
      const reservasData: Reserva[] = [];
      const { inicioRango, finRango } = obtenerRangoFechas();

      // Cargar reservas de laboratorios
      const labsSnapshot = await getDocs(collection(db, 'reserva_labs'));
      
      for (const docSnap of labsSnapshot.docs) {
        const data = docSnap.data();
        let fecha = '';
        
        if (data.fecha_reserva) {
          if (typeof data.fecha_reserva === 'string') {
            fecha = data.fecha_reserva;
          } else if (data.fecha_reserva.toDate) {
            fecha = data.fecha_reserva.toDate().toISOString().split('T')[0];
          } else if (data.fecha_reserva.seconds) {
            fecha = new Date(data.fecha_reserva.seconds * 1000).toISOString().split('T')[0];
          }
        }

        // Obtener nombre del laboratorio y usuario
        let nombreLab = 'Laboratorio';
        if (data.id_lab) {
          const labQuery = query(collection(db, 'laboratorios'), where('__name__', '==', data.id_lab));
          const labSnapshot = await getDocs(labQuery);
          if (!labSnapshot.empty) {
            nombreLab = labSnapshot.docs[0].data().nombre || 'Laboratorio';
          }
        }

        let nombreUsuario = 'Usuario';
        if (data.id_usuario) {
          const userQuery = query(collection(db, 'usuarios'), where('__name__', '==', data.id_usuario));
          const userSnapshot = await getDocs(userQuery);
          if (!userSnapshot.empty) {
            const userData = userSnapshot.docs[0].data();
            nombreUsuario = `${userData.primer_nombre} ${userData.primer_apellido}`;
          }
        }

        const fechaDate = new Date(fecha);
        if (fechaDate >= inicioRango && fechaDate <= finRango) {
          reservasData.push({
            id: docSnap.id,
            tipo: 'laboratorio',
            nombre: nombreLab,
            usuario: nombreUsuario,
            fecha: fecha,
            hora_inicio: data.hora_inicio,
            hora_fin: data.hora_fin,
            estado: data.estado === 0 ? 'Pendiente' : data.estado === 1 ? 'Aprobada' : 'Rechazada',
            id_item: data.id_lab || '',
            id_usuario: data.id_usuario || ''
          });
        }
      }

      // Cargar reservas de recursos
      const recursosSnapshot = await getDocs(collection(db, 'reserva_recurso'));

      for (const docSnap of recursosSnapshot.docs) {
        const data = docSnap.data();
        let fecha = '';
        
        if (data.fecha_reserva) {
          if (typeof data.fecha_reserva === 'string') {
            fecha = data.fecha_reserva;
          } else if (data.fecha_reserva.toDate) {
            fecha = data.fecha_reserva.toDate().toISOString().split('T')[0];
          } else if (data.fecha_reserva.seconds) {
            fecha = new Date(data.fecha_reserva.seconds * 1000).toISOString().split('T')[0];
          }
        }

        let nombreRecurso = 'Recurso';
        if (data.id_recurso) {
          const recursoQuery = query(collection(db, 'recurso'), where('__name__', '==', data.id_recurso));
          const recursoSnapshot = await getDocs(recursoQuery);
          if (!recursoSnapshot.empty) {
            nombreRecurso = recursoSnapshot.docs[0].data().nombre || 'Recurso';
          }
        }

        let nombreUsuario = 'Usuario';
        if (data.id_usuario) {
          const userQuery = query(collection(db, 'usuarios'), where('__name__', '==', data.id_usuario));
          const userSnapshot = await getDocs(userQuery);
          if (!userSnapshot.empty) {
            const userData = userSnapshot.docs[0].data();
            nombreUsuario = `${userData.primer_nombre} ${userData.primer_apellido}`;
          }
        }

        const fechaDate = new Date(fecha);
        if (fechaDate >= inicioRango && fechaDate <= finRango) {
          reservasData.push({
            id: docSnap.id,
            tipo: 'recurso',
            nombre: nombreRecurso,
            usuario: nombreUsuario,
            fecha: fecha,
            estado: data.estado === 0 ? 'Pendiente' : data.estado === 1 ? 'Aprobada' : 'Rechazada',
            id_item: data.id_recurso || '',
            id_usuario: data.id_usuario || ''
          });
        }
      }

      setReservas(reservasData);
    } catch (error) {
      console.error('Error cargando reservas:', error);
    }
  };

  const cargarBloqueos = async () => {
    try {
      const bloqueosSnapshot = await getDocs(collection(db, 'bloqueos'));
      const bloqueosData: Bloqueo[] = bloqueosSnapshot.docs.map(doc => ({
        id: doc.id,
        tipo: doc.data().tipo,
        id_item: doc.data().id_item,
        nombre_item: doc.data().nombre_item,
        fecha_inicio: doc.data().fecha_inicio,
        fecha_fin: doc.data().fecha_fin,
        motivo: doc.data().motivo,
        activo: doc.data().activo !== false
      }));
      setBloqueos(bloqueosData);
    } catch (error) {
      console.error('Error cargando bloqueos:', error);
    }
  };

  const cargarItemsDisponibles = async () => {
    try {
      if (tipoBloqueo === 'laboratorio') {
        const snapshot = await getDocs(collection(db, 'laboratorios'));
        const items = snapshot.docs.map(doc => ({
          id: doc.id,
          nombre: doc.data().nombre
        }));
        setItemsDisponibles(items);
      } else {
        const snapshot = await getDocs(collection(db, 'recurso'));
        const items = snapshot.docs.map(doc => ({
          id: doc.id,
          nombre: doc.data().nombre
        }));
        setItemsDisponibles(items);
      }
    } catch (error) {
      console.error('Error cargando items:', error);
    }
  };

  const obtenerRangoFechas = () => {
    const inicio = new Date(fechaActual);
    const fin = new Date(fechaActual);

    if (vista === 'semanal') {
      const dia = inicio.getDay();
      const diff = inicio.getDate() - dia + (dia === 0 ? -6 : 1);
      inicio.setDate(diff);
      inicio.setHours(0, 0, 0, 0);
      
      fin.setDate(inicio.getDate() + 6);
      fin.setHours(23, 59, 59, 999);
    } else {
      inicio.setDate(1);
      inicio.setHours(0, 0, 0, 0);
      
      fin.setMonth(inicio.getMonth() + 1);
      fin.setDate(0);
      fin.setHours(23, 59, 59, 999);
    }

    return { inicioRango: inicio, finRango: fin };
  };

  const obtenerDiasMes = () => {
    const year = fechaActual.getFullYear();
    const month = fechaActual.getMonth();
    
    const primerDia = new Date(year, month, 1);
    const ultimoDia = new Date(year, month + 1, 0);
    
    const dias = [];
    const primerDiaSemana = primerDia.getDay();
    const diasAnteriores = primerDiaSemana === 0 ? 6 : primerDiaSemana - 1;
    
    for (let i = diasAnteriores; i > 0; i--) {
      const fecha = new Date(year, month, 1 - i);
      dias.push({ fecha, esMesActual: false });
    }
    
    for (let i = 1; i <= ultimoDia.getDate(); i++) {
      const fecha = new Date(year, month, i);
      dias.push({ fecha, esMesActual: true });
    }
    
    const diasRestantes = 42 - dias.length;
    for (let i = 1; i <= diasRestantes; i++) {
      const fecha = new Date(year, month + 1, i);
      dias.push({ fecha, esMesActual: false });
    }
    
    return dias;
  };

  const cambiarMes = (direccion: number) => {
    const nuevaFecha = new Date(fechaActual);
    nuevaFecha.setMonth(nuevaFecha.getMonth() + direccion);
    setFechaActual(nuevaFecha);
  };

  const irHoy = () => {
    setFechaActual(new Date());
  };

  const obtenerReservasDelDia = (fecha: Date) => {
    const fechaStr = fecha.toISOString().split('T')[0];
    return reservas.filter(r => {
      const matchFecha = r.fecha === fechaStr;
      const matchTipo = filtroTipo === 'todas' || r.tipo === filtroTipo;
      const matchEstado = filtroEstado === 'todos' || r.estado.toLowerCase() === filtroEstado;
      return matchFecha && matchTipo && matchEstado;
    });
  };

  const esHoy = (fecha: Date) => {
    const hoy = new Date();
    return fecha.toDateString() === hoy.toDateString();
  };

  const handleCrearBloqueo = async () => {
    if (!itemSeleccionado || !fechaInicio || !fechaFin || !motivoBloqueo) {
      alert('Completa todos los campos');
      return;
    }

    if (new Date(fechaFin) < new Date(fechaInicio)) {
      alert('La fecha de fin debe ser posterior a la fecha de inicio');
      return;
    }

    setLoading(true);
    try {
      const itemData = itemsDisponibles.find(i => i.id === itemSeleccionado);
      
      await addDoc(collection(db, 'bloqueos'), {
        tipo: tipoBloqueo,
        id_item: itemSeleccionado,
        nombre_item: itemData?.nombre || '',
        fecha_inicio: fechaInicio,
        fecha_fin: fechaFin,
        motivo: motivoBloqueo,
        activo: true,
        creado_por: user?.email || 'admin',
        fecha_creacion: Timestamp.now()
      });

      // Actualizar estado del item bloqueado
      if (tipoBloqueo === 'laboratorio') {
        await updateDoc(doc(db, 'laboratorios', itemSeleccionado), {
          estado: 'En Mantenimiento'
        });
      }

      await registrarEnBitacora({
        usuario_nombre: user?.nombre || 'Admin',
        usuario_email: user?.email || '',
        usuario_rol: user?.rol || 'Administrador',
        accion: 'Crear Bloqueo',
        accion_detalle: `Bloqueo de ${tipoBloqueo}: ${itemData?.nombre} del ${fechaInicio} al ${fechaFin}`,
        modulo: 'Calendario Admin'
      });

      alert('✅ Bloqueo creado exitosamente');
      cerrarModalBloqueo();
      cargarDatos();
    } catch (error) {
      console.error('Error creando bloqueo:', error);
      alert('❌ Error al crear bloqueo');
    } finally {
      setLoading(false);
    }
  };

  const cerrarModalBloqueo = () => {
    setShowModalBloqueo(false);
    setItemSeleccionado('');
    setFechaInicio('');
    setFechaFin('');
    setMotivoBloqueo('');
  };

  const renderVistaMensual = () => {
    const diasMes = obtenerDiasMes();
    const nombresDias = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

    return (
      <div className="vista-mensual-admin">
        <div className="calendario-grid-admin mensual">
          <div className="dias-semana-header">
            {nombresDias.map(dia => (
              <div key={dia} className="dia-semana-nombre">{dia}</div>
            ))}
          </div>
          
          <div className="dias-grid-admin">
            {diasMes.map(({ fecha, esMesActual }, index) => {
              const reservasDelDia = obtenerReservasDelDia(fecha);
              const esHoyDia = esHoy(fecha);

              return (
                <div
                  key={index}
                  className={`dia-mes-admin ${!esMesActual ? 'otro-mes' : ''} ${esHoyDia ? 'hoy' : ''}`}
                >
                  <div className="dia-numero-admin">{fecha.getDate()}</div>
                  {esMesActual && reservasDelDia.length > 0 && (
                    <div className="reservas-dia-admin">
                      <span className="count-badge">{reservasDelDia.length}</span>
                      {reservasDelDia.slice(0, 3).map(r => (
                        <div key={r.id} className={`mini-reserva ${r.tipo} ${r.estado.toLowerCase()}`} title={`${r.nombre} - ${r.usuario}`}>
                          <span className="mini-icon">{r.tipo === 'laboratorio' ? '🔬' : '📦'}</span>
                          <span className="mini-text">{r.nombre.substring(0, 15)}</span>
                        </div>
                      ))}
                      {reservasDelDia.length > 3 && (
                        <div className="mas-reservas">+{reservasDelDia.length - 3} más</div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="admin-calendario">
      <div className="calendario-header-admin">
        <div>
          <h1>📅 Calendario del Sistema</h1>
          <p>Vista completa de reservas y bloqueos</p>
        </div>
        <button className="btn-crear-bloqueo" onClick={() => setShowModalBloqueo(true)}>
          🚫 Crear Bloqueo
        </button>
      </div>

      {/* Controles y Filtros */}
      <div className="calendario-controles-admin">
        <div className="navegacion-admin">
          <button className="nav-btn" onClick={() => cambiarMes(-1)}>
            ← Anterior
          </button>
          <button className="btn-hoy" onClick={irHoy}>
            Hoy
          </button>
          <button className="nav-btn" onClick={() => cambiarMes(1)}>
            Siguiente →
          </button>
        </div>

        <div className="fecha-actual-admin">
          <h2>{fechaActual.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}</h2>
        </div>

        <div className="filtros-admin">
          <select value={filtroTipo} onChange={(e) => setFiltroTipo(e.target.value as any)}>
            <option value="todas">Todos los tipos</option>
            <option value="laboratorio">Laboratorios</option>
            <option value="recurso">Recursos</option>
          </select>

          <select value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value as any)}>
            <option value="todos">Todos los estados</option>
            <option value="pendiente">Pendientes</option>
            <option value="aprobada">Aprobadas</option>
            <option value="rechazada">Rechazadas</option>
          </select>
        </div>
      </div>

      {/* Leyenda */}
      <div className="calendario-leyenda-admin">
        <div className="leyenda-item">
          <span className="leyenda-dot laboratorio"></span>
          <span>Laboratorio</span>
        </div>
        <div className="leyenda-item">
          <span className="leyenda-dot recurso"></span>
          <span>Recurso</span>
        </div>
        <div className="leyenda-item">
          <span className="leyenda-dot pendiente"></span>
          <span>Pendiente</span>
        </div>
        <div className="leyenda-item">
          <span className="leyenda-dot aprobada"></span>
          <span>Aprobada</span>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="stats-calendario">
        <div className="stat-item">
          <span className="stat-label">Total Reservas:</span>
          <span className="stat-value">{reservas.length}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Laboratorios:</span>
          <span className="stat-value">{reservas.filter(r => r.tipo === 'laboratorio').length}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Recursos:</span>
          <span className="stat-value">{reservas.filter(r => r.tipo === 'recurso').length}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Bloqueos Activos:</span>
          <span className="stat-value">{bloqueos.filter(b => b.activo).length}</span>
        </div>
      </div>

      {/* Calendario */}
      {loading ? (
        <div className="calendario-loading">
          <div className="spinner"></div>
          <p>Cargando calendario...</p>
        </div>
      ) : (
        renderVistaMensual()
      )}

      {/* Modal Crear Bloqueo */}
      {showModalBloqueo && (
        <div className="modal-overlay" onClick={cerrarModalBloqueo}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>🚫 Crear Bloqueo</h3>
            
            <div className="form-group">
              <label>Tipo</label>
              <select value={tipoBloqueo} onChange={(e) => setTipoBloqueo(e.target.value as any)}>
                <option value="laboratorio">Laboratorio</option>
                <option value="recurso">Recurso</option>
              </select>
            </div>

            <div className="form-group">
              <label>{tipoBloqueo === 'laboratorio' ? 'Laboratorio' : 'Recurso'} *</label>
              <select value={itemSeleccionado} onChange={(e) => setItemSeleccionado(e.target.value)}>
                <option value="">Seleccionar...</option>
                {itemsDisponibles.map(item => (
                  <option key={item.id} value={item.id}>{item.nombre}</option>
                ))}
              </select>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Fecha Inicio *</label>
                <input
                  type="date"
                  value={fechaInicio}
                  onChange={(e) => setFechaInicio(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>

              <div className="form-group">
                <label>Fecha Fin *</label>
                <input
                  type="date"
                  value={fechaFin}
                  onChange={(e) => setFechaFin(e.target.value)}
                  min={fechaInicio || new Date().toISOString().split('T')[0]}
                />
              </div>
            </div>

            <div className="form-group">
              <label>Motivo del Bloqueo *</label>
              <textarea
                value={motivoBloqueo}
                onChange={(e) => setMotivoBloqueo(e.target.value)}
                rows={4}
                placeholder="Describe el motivo del bloqueo (ej: Mantenimiento preventivo, reparación, etc.)"
              />
            </div>

            <div className="modal-actions">
              <button className="btn-primary" onClick={handleCrearBloqueo} disabled={loading}>
                {loading ? '⏳ Creando...' : '✅ Crear Bloqueo'}
              </button>
              <button className="btn-secondary" onClick={cerrarModalBloqueo}>
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCalendario;
