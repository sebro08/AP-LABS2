import { useState, useEffect } from 'react';
import { collection, getDocs, query, where, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useAuth } from '../../context/AuthContext';
import { registrarEnBitacora } from '../../utils/bitacoraHelper';
import { crearNotificacion } from '../../utils/notificacionesHelper';
import { FiCalendar, FiChevronLeft, FiChevronRight, FiClock, FiUsers, FiPackage, FiSend } from 'react-icons/fi';
import { MdScience, MdEventAvailable, MdOutlineCalendarMonth } from 'react-icons/md';
import { BiCalendarWeek } from 'react-icons/bi';
import { AiOutlinePlus, AiOutlineLoading3Quarters } from 'react-icons/ai';
import { IoLocationOutline } from 'react-icons/io5';
import './UserCalendario.css';

interface Laboratorio {
  id: string;
  nombre: string;
  capacidad: number;
  estado: string;
  ubicacion: string;
}

interface Recurso {
  id: string;
  nombre: string;
  cantidad_disponible: number;
  unidad: string;
  tipo_recurso: string;
}

interface Reserva {
  id: string;
  tipo: 'laboratorio' | 'recurso';
  nombre: string;
  fecha: string;
  hora_inicio?: string;
  hora_fin?: string;
  estado: string;
  id_item: string;
}

type VistaCalendario = 'semanal' | 'mensual';

const UserCalendario = () => {
  const { user } = useAuth();
  const [vista, setVista] = useState<VistaCalendario>('semanal');
  const [fechaActual, setFechaActual] = useState(new Date());
  const [laboratorios, setLaboratorios] = useState<Laboratorio[]>([]);
  const [recursos, setRecursos] = useState<Recurso[]>([]);
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Modal para solicitud rápida
  const [showModal, setShowModal] = useState(false);
  const [diaSeleccionado, setDiaSeleccionado] = useState<Date | null>(null);
  const [itemSeleccionado, setItemSeleccionado] = useState<{tipo: 'laboratorio' | 'recurso', item: Laboratorio | Recurso} | null>(null);
  const [motivoSolicitud, setMotivoSolicitud] = useState('');
  const [horaInicio, setHoraInicio] = useState('');
  const [horaFin, setHoraFin] = useState('');
  const [cantidadRecurso, setCantidadRecurso] = useState('');
  const [participantes, setParticipantes] = useState('');

  useEffect(() => {
    cargarDatos();
  }, [fechaActual, vista]);

  const cargarDatos = async () => {
    setLoading(true);
    try {
      await Promise.all([
        cargarLaboratorios(),
        cargarRecursos(),
        cargarReservas()
      ]);
    } catch (error) {
      console.error('Error cargando datos:', error);
    } finally {
      setLoading(false);
    }
  };

  const cargarLaboratorios = async () => {
    try {
      const snapshot = await getDocs(collection(db, 'laboratorios'));
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        nombre: doc.data().nombre || '',
        capacidad: doc.data().capacidad || 0,
        estado: doc.data().estado || 'Disponible',
        ubicacion: doc.data().ubicacion || ''
      }));
      setLaboratorios(data);
    } catch (error) {
      console.error('Error cargando laboratorios:', error);
    }
  };

  const cargarRecursos = async () => {
    try {
      const estadosSnapshot = await getDocs(collection(db, 'estado'));
      const estadosMap = new Map();
      estadosSnapshot.docs.forEach(doc => {
        estadosMap.set(doc.id, doc.data().nombre);
      });

      const tiposSnapshot = await getDocs(collection(db, 'tipo_recurso'));
      const tiposMap = new Map();
      tiposSnapshot.docs.forEach(doc => {
        tiposMap.set(doc.id, doc.data().nombre);
      });

      const medidasSnapshot = await getDocs(collection(db, 'medida'));
      const medidasMap = new Map();
      medidasSnapshot.docs.forEach(doc => {
        medidasMap.set(doc.id, doc.data().nombre);
      });

      const snapshot = await getDocs(collection(db, 'recurso'));
      const data = snapshot.docs.map(doc => {
        const docData = doc.data();
        return {
          id: doc.id,
          nombre: docData.nombre || '',
          cantidad_disponible: docData.cantidad || 0,
          unidad: medidasMap.get(docData.id_medida) || '',
          tipo_recurso: tiposMap.get(docData.id_tipo_recurso) || ''
        };
      });
      setRecursos(data);
    } catch (error) {
      console.error('Error cargando recursos:', error);
    }
  };

  const cargarReservas = async () => {
    try {
      const reservasData: Reserva[] = [];
      const { inicioRango, finRango } = obtenerRangoFechas();

      // Cargar reservas de laboratorios
      const labsQuery = query(
        collection(db, 'reserva_labs'),
        where('estado', 'in', [0, 1]) // 0=pendiente, 1=activa
      );
      const labsSnapshot = await getDocs(labsQuery);
      
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

        // Obtener nombre del laboratorio
        let nombreLab = 'Laboratorio';
        if (data.id_lab) {
          const labDoc = await getDocs(query(collection(db, 'laboratorios'), where('__name__', '==', data.id_lab)));
          if (!labDoc.empty) {
            nombreLab = labDoc.docs[0].data().nombre || 'Laboratorio';
          }
        }

        const fechaDate = new Date(fecha);
        if (fechaDate >= inicioRango && fechaDate <= finRango) {
          reservasData.push({
            id: docSnap.id,
            tipo: 'laboratorio',
            nombre: nombreLab,
            fecha: fecha,
            hora_inicio: data.hora_inicio,
            hora_fin: data.hora_fin,
            estado: data.estado === 0 ? 'Pendiente' : 'Aprobada',
            id_item: data.id_lab || ''
          });
        }
      }

      // Cargar reservas de recursos
      const recursosQuery = query(
        collection(db, 'reserva_recurso'),
        where('estado', 'in', [0, 1])
      );
      const recursosSnapshot = await getDocs(recursosQuery);

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

        // Obtener nombre del recurso
        let nombreRecurso = 'Recurso';
        if (data.id_recurso) {
          const recursoDoc = await getDocs(query(collection(db, 'recurso'), where('__name__', '==', data.id_recurso)));
          if (!recursoDoc.empty) {
            nombreRecurso = recursoDoc.docs[0].data().nombre || 'Recurso';
          }
        }

        const fechaDate = new Date(fecha);
        if (fechaDate >= inicioRango && fechaDate <= finRango) {
          reservasData.push({
            id: docSnap.id,
            tipo: 'recurso',
            nombre: nombreRecurso,
            fecha: fecha,
            estado: data.estado === 0 ? 'Pendiente' : 'Aprobada',
            id_item: data.id_recurso || ''
          });
        }
      }

      setReservas(reservasData);
    } catch (error) {
      console.error('Error cargando reservas:', error);
    }
  };

  const obtenerRangoFechas = () => {
    const inicio = new Date(fechaActual);
    const fin = new Date(fechaActual);

    if (vista === 'semanal') {
      // Obtener el lunes de la semana actual
      const dia = inicio.getDay();
      const diff = inicio.getDate() - dia + (dia === 0 ? -6 : 1);
      inicio.setDate(diff);
      inicio.setHours(0, 0, 0, 0);
      
      // Fin es el domingo
      fin.setDate(inicio.getDate() + 6);
      fin.setHours(23, 59, 59, 999);
    } else {
      // Vista mensual
      inicio.setDate(1);
      inicio.setHours(0, 0, 0, 0);
      
      fin.setMonth(inicio.getMonth() + 1);
      fin.setDate(0);
      fin.setHours(23, 59, 59, 999);
    }

    return { inicioRango: inicio, finRango: fin };
  };

  const obtenerDiasSemana = () => {
    const dias = [];
    const inicio = new Date(fechaActual);
    const dia = inicio.getDay();
    const diff = inicio.getDate() - dia + (dia === 0 ? -6 : 1);
    inicio.setDate(diff);

    for (let i = 0; i < 7; i++) {
      const fecha = new Date(inicio);
      fecha.setDate(inicio.getDate() + i);
      dias.push(fecha);
    }

    return dias;
  };

  const obtenerDiasMes = () => {
    const year = fechaActual.getFullYear();
    const month = fechaActual.getMonth();
    
    const primerDia = new Date(year, month, 1);
    const ultimoDia = new Date(year, month + 1, 0);
    
    const dias = [];
    const primerDiaSemana = primerDia.getDay();
    const diasAnteriores = primerDiaSemana === 0 ? 6 : primerDiaSemana - 1;
    
    // Días del mes anterior
    for (let i = diasAnteriores; i > 0; i--) {
      const fecha = new Date(year, month, 1 - i);
      dias.push({ fecha, esMesActual: false });
    }
    
    // Días del mes actual
    for (let i = 1; i <= ultimoDia.getDate(); i++) {
      const fecha = new Date(year, month, i);
      dias.push({ fecha, esMesActual: true });
    }
    
    // Completar con días del siguiente mes
    const diasRestantes = 42 - dias.length;
    for (let i = 1; i <= diasRestantes; i++) {
      const fecha = new Date(year, month + 1, i);
      dias.push({ fecha, esMesActual: false });
    }
    
    return dias;
  };

  const cambiarSemana = (direccion: number) => {
    const nuevaFecha = new Date(fechaActual);
    nuevaFecha.setDate(nuevaFecha.getDate() + (direccion * 7));
    setFechaActual(nuevaFecha);
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
    return reservas.filter(r => r.fecha === fechaStr);
  };

  const esHoy = (fecha: Date) => {
    const hoy = new Date();
    return fecha.toDateString() === hoy.toDateString();
  };

  const abrirModalSolicitud = (fecha: Date, tipo: 'laboratorio' | 'recurso', item: Laboratorio | Recurso) => {
    setDiaSeleccionado(fecha);
    setItemSeleccionado({ tipo, item });
    setShowModal(true);
  };

  const cerrarModal = () => {
    setShowModal(false);
    setDiaSeleccionado(null);
    setItemSeleccionado(null);
    setMotivoSolicitud('');
    setHoraInicio('');
    setHoraFin('');
    setCantidadRecurso('');
    setParticipantes('');
  };

  const handleEnviarSolicitud = async () => {
    if (!user || !diaSeleccionado || !itemSeleccionado || !motivoSolicitud) {
      alert('Por favor completa todos los campos obligatorios');
      return;
    }

    setLoading(true);
    try {
      const fechaStr = diaSeleccionado.toISOString().split('T')[0];

      if (itemSeleccionado.tipo === 'laboratorio') {
        const lab = itemSeleccionado.item as Laboratorio;
        
        if (!horaInicio || !horaFin || !participantes) {
          alert('Completa todos los campos para laboratorio');
          setLoading(false);
          return;
        }

        const numParticipantes = parseInt(participantes);
        if (numParticipantes > lab.capacidad) {
          alert(`El número de participantes excede la capacidad (${lab.capacidad})`);
          setLoading(false);
          return;
        }

        await addDoc(collection(db, 'solicitudes_labs'), {
          id_usuario: user.uid,
          id_lab: lab.id,
          dia: fechaStr,
          fecha_solicitud: Timestamp.now(),
          horarios: [{ hora_inicio: horaInicio, hora_fin: horaFin }],
          motivo: motivoSolicitud,
          participantes: numParticipantes,
          recursos: [],
          estado_solicitud: 'pendiente'
        });

        await registrarEnBitacora({
          usuario_nombre: user.email || 'Usuario',
          usuario_email: user.email || '',
          usuario_rol: user.rol || 'Usuario',
          accion: 'Crear Solicitud',
          accion_detalle: `Solicitud de laboratorio ${lab.nombre} para ${fechaStr}`,
          modulo: 'Calendario'
        });

      } else {
        const rec = itemSeleccionado.item as Recurso;
        
        if (!cantidadRecurso) {
          alert('Especifica la cantidad del recurso');
          setLoading(false);
          return;
        }

        const cantidad = parseInt(cantidadRecurso);
        if (cantidad > rec.cantidad_disponible) {
          alert(`La cantidad excede la disponibilidad (${rec.cantidad_disponible})`);
          setLoading(false);
          return;
        }

        await addDoc(collection(db, 'solicitudes_recursos'), {
          id_usuario: user.uid,
          id_recurso: rec.id,
          cantidad: cantidad,
          fecha_solicitud: Timestamp.now(),
          fecha_reserva: fechaStr,
          fecha_devolucion: null,
          motivo: motivoSolicitud,
          id_medida: '1',
          estado_solicitud: 'pendiente'
        });

        await registrarEnBitacora({
          usuario_nombre: user.email || 'Usuario',
          usuario_email: user.email || '',
          usuario_rol: user.rol || 'Usuario',
          accion: 'Crear Solicitud',
          accion_detalle: `Solicitud de recurso ${rec.nombre} (${cantidad} ${rec.unidad}) para ${fechaStr}`,
          modulo: 'Calendario'
        });
      }

      alert('✅ Solicitud enviada correctamente');
      cerrarModal();
      cargarReservas();
    } catch (error) {
      console.error('Error enviando solicitud:', error);
      alert('❌ Error al enviar la solicitud');
    } finally {
      setLoading(false);
    }
  };

  const renderVistaSemanal = () => {
    const diasSemana = obtenerDiasSemana();
    const nombresDias = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

    return (
      <div className="vista-semanal">
        <div className="calendario-grid semanal">
          {diasSemana.map((dia, index) => {
            const reservasDelDia = obtenerReservasDelDia(dia);
            const esHoyDia = esHoy(dia);

            return (
              <div key={index} className={`dia-card ${esHoyDia ? 'hoy' : ''}`}>
                <div className="dia-header">
                  <div className="dia-nombre">{nombresDias[index]}</div>
                  <div className="dia-numero">{dia.getDate()}</div>
                  <div className="dia-mes">{dia.toLocaleDateString('es-ES', { month: 'short' })}</div>
                </div>
                
                <div className="dia-reservas">
                  {reservasDelDia.length > 0 ? (
                    reservasDelDia.map(reserva => (
                      <div key={reserva.id} className={`reserva-item ${reserva.tipo}`}>
                        <div className="reserva-tipo-icon">
                          {reserva.tipo === 'laboratorio' ? <MdScience /> : <FiPackage />}
                        </div>
                        <div className="reserva-info">
                          <div className="reserva-nombre">{reserva.nombre}</div>
                          {reserva.hora_inicio && (
                            <div className="reserva-hora">
                              <FiClock size={12} /> {reserva.hora_inicio} - {reserva.hora_fin}
                            </div>
                          )}
                          <div className={`reserva-estado ${reserva.estado.toLowerCase()}`}>
                            {reserva.estado}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="sin-reservas">Sin reservas</div>
                  )}
                </div>

                <div className="dia-acciones">
                  <button
                    className="btn-solicitar-rapido"
                    onClick={() => {
                      // Mostrar menú para seleccionar laboratorio o recurso
                      const tipo = window.confirm('¿Solicitar Laboratorio?\n\nAceptar = Laboratorio\nCancelar = Recurso');
                      if (tipo && laboratorios.length > 0) {
                        abrirModalSolicitud(dia, 'laboratorio', laboratorios[0]);
                      } else if (!tipo && recursos.length > 0) {
                        abrirModalSolicitud(dia, 'recurso', recursos[0]);
                      }
                    }}
                  >
                    <AiOutlinePlus /> Solicitar
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderVistaMensual = () => {
    const diasMes = obtenerDiasMes();
    const nombresDias = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

    return (
      <div className="vista-mensual">
        <div className="calendario-grid mensual">
          <div className="dias-semana-header">
            {nombresDias.map(dia => (
              <div key={dia} className="dia-semana-nombre">{dia}</div>
            ))}
          </div>
          
          <div className="dias-grid">
            {diasMes.map(({ fecha, esMesActual }, index) => {
              const reservasDelDia = obtenerReservasDelDia(fecha);
              const esHoyDia = esHoy(fecha);

              return (
                <div
                  key={index}
                  className={`dia-mes ${!esMesActual ? 'otro-mes' : ''} ${esHoyDia ? 'hoy' : ''}`}
                  onClick={() => {
                    if (esMesActual) {
                      const tipo = window.confirm('¿Solicitar Laboratorio?\n\nAceptar = Laboratorio\nCancelar = Recurso');
                      if (tipo && laboratorios.length > 0) {
                        abrirModalSolicitud(fecha, 'laboratorio', laboratorios[0]);
                      } else if (!tipo && recursos.length > 0) {
                        abrirModalSolicitud(fecha, 'recurso', recursos[0]);
                      }
                    }
                  }}
                >
                  <div className="dia-numero">{fecha.getDate()}</div>
                  {esMesActual && reservasDelDia.length > 0 && (
                    <div className="reservas-indicador">
                      <span className="reservas-count">{reservasDelDia.length}</span>
                      {reservasDelDia.slice(0, 2).map(r => (
                        <div key={r.id} className={`reserva-dot ${r.tipo}`} title={r.nombre}></div>
                      ))}
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
    <div className="user-calendario">
      <div className="calendario-header">
        <h1><FiCalendar className="header-icon" /> Calendario de Disponibilidad</h1>
        <p>Consulta la disponibilidad y solicita laboratorios y recursos</p>
      </div>

      {/* Controles */}
      <div className="calendario-controles">
        <div className="vista-selector">
          <button
            className={`vista-btn ${vista === 'semanal' ? 'active' : ''}`}
            onClick={() => setVista('semanal')}
          >
            <BiCalendarWeek /> Semanal
          </button>
          <button
            className={`vista-btn ${vista === 'mensual' ? 'active' : ''}`}
            onClick={() => setVista('mensual')}
          >
            <MdOutlineCalendarMonth /> Mensual
          </button>
        </div>

        <div className="navegacion">
          <button
            className="nav-btn"
            onClick={() => vista === 'semanal' ? cambiarSemana(-1) : cambiarMes(-1)}
          >
            <FiChevronLeft /> Anterior
          </button>
          
          <button className="btn-hoy" onClick={irHoy}>
            <MdEventAvailable /> Hoy
          </button>
          
          <button
            className="nav-btn"
            onClick={() => vista === 'semanal' ? cambiarSemana(1) : cambiarMes(1)}
          >
            Siguiente <FiChevronRight />
          </button>
        </div>

        <div className="fecha-actual">
          <h2>
            {vista === 'semanal'
              ? `Semana del ${obtenerDiasSemana()[0].toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })}`
              : fechaActual.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
          </h2>
        </div>
      </div>

      {/* Leyenda */}
      <div className="calendario-leyenda">
        <div className="leyenda-item">
          <MdScience className="leyenda-icon laboratorio" />
          <span>Laboratorio</span>
        </div>
        <div className="leyenda-item">
          <FiPackage className="leyenda-icon recurso" />
          <span>Recurso</span>
        </div>
        <div className="leyenda-item">
          <MdEventAvailable className="leyenda-icon hoy" />
          <span>Hoy</span>
        </div>
      </div>

      {/* Calendario */}
      {loading ? (
        <div className="calendario-loading">
          <div className="spinner"></div>
          <p>Cargando calendario...</p>
        </div>
      ) : vista === 'semanal' ? (
        renderVistaSemanal()
      ) : (
        renderVistaMensual()
      )}

      {/* Modal de solicitud */}
      {showModal && itemSeleccionado && diaSeleccionado && (
        <div className="modal-overlay" onClick={cerrarModal}>
          <div className="modal-content calendario-modal" onClick={(e) => e.stopPropagation()}>
            <h3>
              {itemSeleccionado.tipo === 'laboratorio' ? <MdScience /> : <FiPackage />} Nueva Solicitud
            </h3>
            <h4>{itemSeleccionado.item.nombre}</h4>
            <p className="fecha-seleccionada">
              <FiCalendar /> {diaSeleccionado.toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>

            {/* Selector de item */}
            <div className="form-group">
              <label>
                {itemSeleccionado.tipo === 'laboratorio' ? 'Laboratorio' : 'Recurso'}
              </label>
              <select
                value={itemSeleccionado.item.id}
                onChange={(e) => {
                  const items = itemSeleccionado.tipo === 'laboratorio' ? laboratorios : recursos;
                  const item = items.find(i => i.id === e.target.value);
                  if (item) {
                    setItemSeleccionado({ tipo: itemSeleccionado.tipo, item });
                  }
                }}
              >
                {(itemSeleccionado.tipo === 'laboratorio' ? laboratorios : recursos).map(item => (
                  <option key={item.id} value={item.id}>
                    {item.nombre}
                    {itemSeleccionado.tipo === 'laboratorio' 
                      ? ` (Capacidad: ${(item as Laboratorio).capacidad})`
                      : ` (Disponible: ${(item as Recurso).cantidad_disponible} ${(item as Recurso).unidad})`
                    }
                  </option>
                ))}
              </select>
            </div>

            {itemSeleccionado.tipo === 'laboratorio' ? (
              <>
                <div className="form-row">
                  <div className="form-group">
                    <label>Hora Inicio *</label>
                    <input
                      type="time"
                      value={horaInicio}
                      onChange={(e) => setHoraInicio(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label>Hora Fin *</label>
                    <input
                      type="time"
                      value={horaFin}
                      onChange={(e) => setHoraFin(e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Participantes *</label>
                  <input
                    type="number"
                    value={participantes}
                    onChange={(e) => setParticipantes(e.target.value)}
                    min="1"
                    max={(itemSeleccionado.item as Laboratorio).capacidad}
                    placeholder={`Máximo ${(itemSeleccionado.item as Laboratorio).capacidad}`}
                  />
                </div>
              </>
            ) : (
              <div className="form-group">
                <label>Cantidad *</label>
                <input
                  type="number"
                  value={cantidadRecurso}
                  onChange={(e) => setCantidadRecurso(e.target.value)}
                  min="1"
                  max={(itemSeleccionado.item as Recurso).cantidad_disponible}
                  placeholder={`Máximo ${(itemSeleccionado.item as Recurso).cantidad_disponible} ${(itemSeleccionado.item as Recurso).unidad}`}
                />
              </div>
            )}

            <div className="form-group">
              <label>Motivo de la Solicitud *</label>
              <textarea
                value={motivoSolicitud}
                onChange={(e) => setMotivoSolicitud(e.target.value)}
                rows={4}
                placeholder="Describe el motivo de tu solicitud..."
              />
            </div>

            <div className="modal-actions">
              <button
                className="btn-primary"
                onClick={handleEnviarSolicitud}
                disabled={loading}
              >
                {loading ? <><AiOutlineLoading3Quarters className="spinning-icon" /> Enviando...</> : <><FiSend /> Enviar Solicitud</>}
              </button>
              <button className="btn-secondary" onClick={cerrarModal}>
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserCalendario;
