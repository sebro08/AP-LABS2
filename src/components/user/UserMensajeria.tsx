import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, addDoc, deleteDoc, updateDoc, doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { Mensaje, MensajeDisplay } from '../../types/Mensaje';
import { Usuario } from '../../types/Usuario';
import { useAuth } from '../../context/AuthContext';
import { registrarEnBitacora } from '../../utils/bitacoraHelper';
import './UserMensajeria.css';

const UserMensajeria = () => {
  const { user: currentUser } = useAuth();
  const [tabActiva, setTabActiva] = useState<'bandeja' | 'enviados' | 'redactar' | 'archivados'>('bandeja');
  const [mensajes, setMensajes] = useState<MensajeDisplay[]>([]);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [mensajeSeleccionado, setMensajeSeleccionado] = useState<MensajeDisplay | null>(null);
  const [showDetalle, setShowDetalle] = useState(false);

  // Form data para redactar mensaje
  const [formData, setFormData] = useState({
    destinatario: '',
    asunto: '',
    contenido: ''
  });

  useEffect(() => {
    cargarUsuarios();
  }, []);

  useEffect(() => {
    if (tabActiva !== 'redactar') {
      cargarMensajes();
    }
  }, [tabActiva, currentUser]);

  const cargarUsuarios = async () => {
    try {
      const usuariosSnapshot = await getDocs(collection(db, 'usuarios'));
      const usuariosData: Usuario[] = usuariosSnapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Usuario))
        .filter(u => u.activo); // Solo usuarios activos
      
      console.log('👥 Usuarios cargados:', usuariosData.length);
      setUsuarios(usuariosData);
    } catch (error) {
      console.error('Error cargando usuarios:', error);
    }
  };

  const cargarMensajes = async () => {
    if (!currentUser) return;
    
    setLoading(true);
    try {
      // Buscar el ID del usuario en Firestore usando el email
      const usuariosRef = collection(db, 'usuarios');
      let qUsuario = query(usuariosRef, where('email', '==', currentUser.email));
      let usuarioSnapshot = await getDocs(qUsuario);
      
      // Si no lo encuentra por email, intentar por correo
      if (usuarioSnapshot.empty) {
        console.error('❌ Usuario no encontrado en Firestore con email:', currentUser.email);
        qUsuario = query(usuariosRef, where('correo', '==', currentUser.email));
        usuarioSnapshot = await getDocs(qUsuario);
        if (usuarioSnapshot.empty) {
          setLoading(false);
          return;
        }
      }
      
      const usuarioId = usuarioSnapshot.docs[0].id;
      console.log('🔍 Usuario ID:', usuarioId, 'Email:', currentUser.email);

      const mensajesRef = collection(db, 'mensaje');
      let q;

      switch (tabActiva) {
        case 'bandeja':
          // Mensajes recibidos no archivados
          q = query(
            mensajesRef,
            where('destinatario', '==', usuarioId),
            where('archivado', '==', false)
          );
          break;
        case 'enviados':
          // Mensajes enviados
          q = query(
            mensajesRef,
            where('remitente', '==', usuarioId),
            where('enviado', '==', true)
          );
          break;
        case 'archivados':
          // Mensajes archivados
          q = query(
            mensajesRef,
            where('destinatario', '==', usuarioId),
            where('archivado', '==', true)
          );
          break;
        default:
          setMensajes([]);
          setLoading(false);
          return;
      }

      const snapshot = await getDocs(q);
      console.log('📨 Mensajes encontrados:', snapshot.size);
      const mensajesData: MensajeDisplay[] = [];

      for (const docSnap of snapshot.docs) {
        const data = docSnap.data() as Mensaje;
        console.log('📧 Mensaje:', docSnap.id, data);

        // Obtener remitente
        let remitenteNombre = 'Usuario desconocido';
        let remitenteEmail = '';
        if (data.remitente) {
          const remitenteDoc = await getDoc(doc(db, 'usuarios', data.remitente));
          if (remitenteDoc.exists()) {
            const remitenteData = remitenteDoc.data();
            const nombreCompleto = [
              remitenteData.primer_nombre,
              remitenteData.segundo_nombre,
              remitenteData.primer_apellido,
              remitenteData.segundo_apellido
            ].filter(Boolean).join(' ');
            remitenteNombre = nombreCompleto || 'Usuario desconocido';
            remitenteEmail = remitenteData.email || remitenteData.correo || '';
          }
        }

        // Obtener destinatario
        let destinatarioNombre = 'Usuario desconocido';
        let destinatarioEmail = '';
        if (data.destinatario) {
          const destinatarioDoc = await getDoc(doc(db, 'usuarios', data.destinatario));
          if (destinatarioDoc.exists()) {
            const destinatarioData = destinatarioDoc.data();
            const nombreCompleto = [
              destinatarioData.primer_nombre,
              destinatarioData.segundo_nombre,
              destinatarioData.primer_apellido,
              destinatarioData.segundo_apellido
            ].filter(Boolean).join(' ');
            destinatarioNombre = nombreCompleto || 'Usuario desconocido';
            destinatarioEmail = destinatarioData.email || destinatarioData.correo || '';
          }
        }

        mensajesData.push({
          ...data,
          id: docSnap.id,
          remitenteNombre,
          remitenteEmail,
          destinatarioNombre,
          destinatarioEmail
        });
      }

      // Ordenar por fecha_envio en cliente (más recientes primero)
      mensajesData.sort((a, b) => {
        const dateA = new Date(a.fecha_envio).getTime();
        const dateB = new Date(b.fecha_envio).getTime();
        return dateB - dateA;
      });

      setMensajes(mensajesData);
      setLoading(false);
    } catch (error: any) {
      console.error('Error cargando mensajes:', error);
      alert('Error al cargar mensajes: ' + error.message);
      setLoading(false);
    }
  };

  const mensajesFiltrados = mensajes.filter(m => {
    if (!searchTerm) return true;
    const lowerSearch = searchTerm.toLowerCase();
    return (
      m.asunto.toLowerCase().includes(lowerSearch) ||
      m.contenido.toLowerCase().includes(lowerSearch) ||
      m.remitenteNombre?.toLowerCase().includes(lowerSearch) ||
      m.remitenteEmail?.toLowerCase().includes(lowerSearch) ||
      m.destinatarioNombre?.toLowerCase().includes(lowerSearch) ||
      m.destinatarioEmail?.toLowerCase().includes(lowerSearch)
    );
  });

  const handleVerMensaje = async (mensaje: MensajeDisplay) => {
    setMensajeSeleccionado(mensaje);
    setShowDetalle(true);

    // Buscar el ID del usuario actual en Firestore
    const usuariosRef = collection(db, 'usuarios');
    let qUsuario = query(usuariosRef, where('email', '==', currentUser?.email));
    let usuarioSnapshot = await getDocs(qUsuario);
    if (usuarioSnapshot.empty) {
      qUsuario = query(usuariosRef, where('correo', '==', currentUser?.email));
      usuarioSnapshot = await getDocs(qUsuario);
    }
    const usuarioId = usuarioSnapshot.empty ? null : usuarioSnapshot.docs[0].id;

    // Marcar como leído si es recibido y no leído
    if (usuarioId && mensaje.destinatario === usuarioId && !mensaje.recibido) {
      try {
        await updateDoc(doc(db, 'mensaje', mensaje.id), {
          recibido: true
        });
        cargarMensajes();
      } catch (error) {
        console.error('Error marcando mensaje como leído:', error);
      }
    }
  };

  const handleResponder = (mensaje: MensajeDisplay) => {
    setFormData({
      destinatario: mensaje.remitente,
      asunto: mensaje.asunto.startsWith('Re:') ? mensaje.asunto : `Re: ${mensaje.asunto}`,
      contenido: `\n\n---\nEn respuesta a:\n${mensaje.contenido}`
    });
    setTabActiva('redactar');
    setShowDetalle(false);
  };

  const handleArchivar = async (mensajeId: string, archivar: boolean) => {
    try {
      await updateDoc(doc(db, 'mensaje', mensajeId), {
        archivado: archivar
      });
      
      if (currentUser) {
        await registrarEnBitacora({
          usuario_nombre: currentUser.nombre,
          usuario_email: currentUser.email,
          usuario_rol: currentUser.rol,
          accion: archivar ? 'Archivar' : 'Desarchivar',
          accion_detalle: `${archivar ? 'Archivó' : 'Desarchivó'} un mensaje`,
          modulo: 'Mensajería'
        });
      }

      cargarMensajes();
      setShowDetalle(false);
    } catch (error: any) {
      console.error('Error archivando mensaje:', error);
      alert('Error: ' + error.message);
    }
  };

  const handleEliminar = async (mensajeId: string) => {
    if (!confirm('¿Está seguro de eliminar este mensaje? Esta acción no se puede deshacer.')) {
      return;
    }

    try {
      await deleteDoc(doc(db, 'mensaje', mensajeId));
      
      if (currentUser) {
        await registrarEnBitacora({
          usuario_nombre: currentUser.nombre,
          usuario_email: currentUser.email,
          usuario_rol: currentUser.rol,
          accion: 'Eliminar',
          accion_detalle: `Eliminó un mensaje`,
          modulo: 'Mensajería'
        });
      }

      cargarMensajes();
      setShowDetalle(false);
    } catch (error: any) {
      console.error('Error eliminando mensaje:', error);
      alert('Error: ' + error.message);
    }
  };

  const handleEnviarMensaje = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentUser) {
      alert('Usuario no autenticado');
      return;
    }

    if (!formData.destinatario || !formData.asunto || !formData.contenido) {
      alert('Todos los campos son obligatorios');
      return;
    }

    try {
      // Buscar el ID del usuario actual en Firestore
      const usuariosRef = collection(db, 'usuarios');
      let qUsuario = query(usuariosRef, where('email', '==', currentUser.email));
      let usuarioSnapshot = await getDocs(qUsuario);
      
      // Si no lo encuentra por email, intentar por correo
      if (usuarioSnapshot.empty) {
        console.log('⚠️ No encontrado por email, intentando por correo...');
        qUsuario = query(usuariosRef, where('correo', '==', currentUser.email));
        usuarioSnapshot = await getDocs(qUsuario);
      }
      
      if (usuarioSnapshot.empty) {
        console.error('❌ Usuario no encontrado. Email buscado:', currentUser.email);
        alert('Error: Usuario no encontrado en la base de datos');
        return;
      }
      
      const usuarioId = usuarioSnapshot.docs[0].id;
      console.log('✅ Usuario remitente encontrado. ID:', usuarioId);

      const now = new Date();
      const fecha_envio = now.toISOString();

      const nuevoMensaje = {
        remitente: usuarioId,
        destinatario: formData.destinatario,
        asunto: formData.asunto,
        contenido: formData.contenido,
        fecha_envio,
        recibido: false,
        archivado: false,
        enviado: true
      };

      await addDoc(collection(db, 'mensaje'), nuevoMensaje);

      const destinatarioUsuario = usuarios.find(u => u.id === formData.destinatario);
      
      await registrarEnBitacora({
        usuario_nombre: currentUser.nombre,
        usuario_email: currentUser.email,
        usuario_rol: currentUser.rol,
        accion: 'Enviar',
        accion_detalle: `Envió mensaje a ${destinatarioUsuario?.primer_nombre} ${destinatarioUsuario?.primer_apellido}`,
        modulo: 'Mensajería',
        observaciones: `Asunto: ${formData.asunto}`
      });

      alert('✅ Mensaje enviado correctamente');
      setFormData({ destinatario: '', asunto: '', contenido: '' });
      setTabActiva('enviados');
    } catch (error: any) {
      console.error('Error enviando mensaje:', error);
      alert('Error al enviar mensaje: ' + error.message);
    }
  };

  // Buscar el ID del usuario para contar no leídos
  const [usuarioIdActual, setUsuarioIdActual] = useState<string | null>(null);
  
  useEffect(() => {
    const obtenerUsuarioId = async () => {
      if (currentUser?.email) {
        const usuariosRef = collection(db, 'usuarios');
        let qUsuario = query(usuariosRef, where('email', '==', currentUser.email));
        let usuarioSnapshot = await getDocs(qUsuario);
        if (usuarioSnapshot.empty) {
          qUsuario = query(usuariosRef, where('correo', '==', currentUser.email));
          usuarioSnapshot = await getDocs(qUsuario);
        }
        if (!usuarioSnapshot.empty) {
          setUsuarioIdActual(usuarioSnapshot.docs[0].id);
        }
      }
    };
    obtenerUsuarioId();
  }, [currentUser]);

  const mensajesNoLeidos = mensajes.filter(m => !m.recibido && m.destinatario === usuarioIdActual).length;

  return (
    <div className="gestion-mensajeria">
      <div className="page-header">
        <h1>✉️ Mensajería</h1>
      </div>

      <div className="tabs-container">
        <button
          className={`tab ${tabActiva === 'bandeja' ? 'active' : ''}`}
          onClick={() => { setTabActiva('bandeja'); setShowDetalle(false); }}
        >
          📥 Bandeja de Entrada
          {mensajesNoLeidos > 0 && <span className="badge">{mensajesNoLeidos}</span>}
        </button>
        <button
          className={`tab ${tabActiva === 'enviados' ? 'active' : ''}`}
          onClick={() => { setTabActiva('enviados'); setShowDetalle(false); }}
        >
          📤 Enviados
        </button>
        <button
          className={`tab ${tabActiva === 'redactar' ? 'active' : ''}`}
          onClick={() => { setTabActiva('redactar'); setShowDetalle(false); }}
        >
          ✍️ Redactar
        </button>
        <button
          className={`tab ${tabActiva === 'archivados' ? 'active' : ''}`}
          onClick={() => { setTabActiva('archivados'); setShowDetalle(false); }}
        >
          📁 Archivados
        </button>
      </div>

      {tabActiva === 'redactar' ? (
        <div className="form-container">
          <h2>✍️ Nuevo Mensaje</h2>
          <form onSubmit={handleEnviarMensaje}>
            <div className="form-group">
              <label htmlFor="destinatario">
                Para: <span className="required">*</span>
              </label>
              <select
                id="destinatario"
                value={formData.destinatario}
                onChange={(e) => setFormData({ ...formData, destinatario: e.target.value })}
                required
              >
                <option value="">Seleccione un destinatario</option>
                {usuarios.map(u => {
                  const nombreCompleto = [
                    u.primer_nombre,
                    u.segundo_nombre,
                    u.primer_apellido,
                    u.segundo_apellido
                  ].filter(Boolean).join(' ');
                  const emailUsuario = u.email;
                  return (
                    <option key={u.id} value={u.id}>
                      {nombreCompleto} ({emailUsuario})
                    </option>
                  );
                })}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="asunto">
                Asunto: <span className="required">*</span>
              </label>
              <input
                type="text"
                id="asunto"
                value={formData.asunto}
                onChange={(e) => setFormData({ ...formData, asunto: e.target.value })}
                placeholder="Escriba el asunto del mensaje"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="contenido">
                Mensaje: <span className="required">*</span>
              </label>
              <textarea
                id="contenido"
                value={formData.contenido}
                onChange={(e) => setFormData({ ...formData, contenido: e.target.value })}
                rows={10}
                placeholder="Escriba su mensaje aquí..."
                required
              />
            </div>

            <div className="form-actions">
              <button type="button" className="btn-secondary" onClick={() => setFormData({ destinatario: '', asunto: '', contenido: '' })}>
                Limpiar
              </button>
              <button type="submit" className="btn-primary">
                📨 Enviar Mensaje
              </button>
            </div>
          </form>
        </div>
      ) : (
        <>
          {!showDetalle ? (
            <>
              <div className="search-box">
                <input
                  type="text"
                  placeholder="🔍 Buscar mensajes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              {loading ? (
                <div className="loading-container">
                  <div className="spinner"></div>
                  <p>Cargando mensajes...</p>
                </div>
              ) : (
                <div className="mensajes-list">
                  {mensajesFiltrados.length === 0 ? (
                    <div className="empty-state">
                      <p>No hay mensajes en esta sección</p>
                    </div>
                  ) : (
                    mensajesFiltrados.map(mensaje => (
                      <div
                        key={mensaje.id}
                        className={`mensaje-item ${!mensaje.recibido && mensaje.destinatario === usuarioIdActual ? 'no-leido' : ''}`}
                        onClick={() => handleVerMensaje(mensaje)}
                      >
                        <div className="mensaje-header">
                          <div className="mensaje-usuario">
                            <strong>
                              {tabActiva === 'enviados' ? `Para: ${mensaje.destinatarioNombre}` : `De: ${mensaje.remitenteNombre}`}
                            </strong>
                            <span className="mensaje-email">
                              {tabActiva === 'enviados' ? mensaje.destinatarioEmail : mensaje.remitenteEmail}
                            </span>
                          </div>
                          <span className="mensaje-fecha">
                            {new Date(mensaje.fecha_envio).toLocaleString('es-ES')}
                          </span>
                        </div>
                        <div className="mensaje-asunto">{mensaje.asunto}</div>
                        <div className="mensaje-preview">{mensaje.contenido.substring(0, 100)}...</div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </>
          ) : mensajeSeleccionado && (
            <div className="mensaje-detalle">
              <button className="btn-back" onClick={() => setShowDetalle(false)}>
                ← Volver
              </button>
              
              <div className="detalle-header">
                <h2>{mensajeSeleccionado.asunto}</h2>
                <div className="detalle-info">
                  <div className="info-row">
                    <strong>De:</strong> {mensajeSeleccionado.remitenteNombre} ({mensajeSeleccionado.remitenteEmail})
                  </div>
                  <div className="info-row">
                    <strong>Para:</strong> {mensajeSeleccionado.destinatarioNombre} ({mensajeSeleccionado.destinatarioEmail})
                  </div>
                  <div className="info-row">
                    <strong>Fecha:</strong> {new Date(mensajeSeleccionado.fecha_envio).toLocaleString('es-ES')}
                  </div>
                </div>
              </div>

              <div className="detalle-contenido">
                {mensajeSeleccionado.contenido}
              </div>

              <div className="detalle-actions">
                {mensajeSeleccionado.destinatario === usuarioIdActual && (
                  <>
                    <button className="btn-primary" onClick={() => handleResponder(mensajeSeleccionado)}>
                      ↩️ Responder
                    </button>
                    <button
                      className="btn-secondary"
                      onClick={() => handleArchivar(mensajeSeleccionado.id, !mensajeSeleccionado.archivado)}
                    >
                      {mensajeSeleccionado.archivado ? '📂 Desarchivar' : '📁 Archivar'}
                    </button>
                  </>
                )}
                <button className="btn-danger" onClick={() => handleEliminar(mensajeSeleccionado.id)}>
                  🗑️ Eliminar
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default UserMensajeria;
