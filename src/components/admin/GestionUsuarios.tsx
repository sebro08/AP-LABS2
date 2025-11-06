import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { Usuario, Rol, Departamento } from '../../types/Usuario';
import './GestionUsuarios.css';

const GestionUsuarios = () => {
  const navigate = useNavigate();
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [roles, setRoles] = useState<Rol[]>([]);
  const [departamentos, setDepartamentos] = useState<Departamento[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRol, setFilterRol] = useState('');
  const [filterEstado, setFilterEstado] = useState('');

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    setLoading(true);
    setError('');
    try {
      console.log('🔄 Iniciando carga de datos...');
      
      // Cargar roles
      try {
        const rolesSnapshot = await getDocs(collection(db, 'rol'));
        const rolesData = rolesSnapshot.docs.map(doc => ({
          id: doc.id,
          nombre: doc.data().nombre || 'Sin nombre'
        }));
        setRoles(rolesData);
        console.log('✅ Roles cargados:', rolesData.length);
      } catch (err) {
        console.warn('⚠️ No se pudo cargar roles:', err);
        setRoles([]);
      }

      // Cargar departamentos
      try {
        const deptosSnapshot = await getDocs(collection(db, 'departamentos'));
        const deptosData = deptosSnapshot.docs.map(doc => ({
          id: doc.id,
          nombre: doc.data().nombre || 'Sin nombre'
        }));
        setDepartamentos(deptosData);
        console.log('✅ Departamentos cargados:', deptosData.length);
      } catch (err) {
        console.warn('⚠️ No se pudo cargar departamentos:', err);
        setDepartamentos([]);
      }

      // Cargar usuarios
      const usuariosSnapshot = await getDocs(collection(db, 'usuarios'));
      const usuariosData = usuariosSnapshot.docs.map(doc => {
        const data = doc.data();
        // Normalizar datos - puede venir como 'id_rol' o 'roleId'
        return {
          id: doc.id,
          email: data.email || '',
          primer_nombre: data.primer_nombre || data.nombre || '',
          segundo_nombre: data.segundo_nombre || '',
          primer_apellido: data.primer_apellido || '',
          segundo_apellido: data.segundo_apellido || '',
          identificador: data.identificador || '',
          telefono: data.telefono || '',
          id_departamento: data.id_departamento || data.departamento || '',
          id_rol: data.id_rol || data.roleId || '',
          activo: data.activo !== undefined ? data.activo : true
        } as Usuario;
      });
      
      setUsuarios(usuariosData);
      console.log('✅ Datos cargados:', usuariosData.length, 'usuarios');
      console.log('📋 Primer usuario:', usuariosData[0]);
    } catch (error: any) {
      console.error('❌ Error cargando datos:', error);
      setError(`Error cargando usuarios: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const toggleEstadoUsuario = async (usuario: Usuario) => {
    try {
      const nuevoEstado = !usuario.activo;
      await updateDoc(doc(db, 'usuarios', usuario.id), {
        activo: nuevoEstado
      });

      setUsuarios(usuarios.map(u => 
        u.id === usuario.id ? { ...u, activo: nuevoEstado } : u
      ));

      console.log(`✅ Usuario ${nuevoEstado ? 'activado' : 'desactivado'}`);
    } catch (error) {
      console.error('❌ Error cambiando estado:', error);
    }
  };

  const eliminarUsuario = async (usuarioId: string, nombreUsuario: string) => {
    const confirmar = window.confirm(`¿Estás seguro que deseas eliminar al usuario "${nombreUsuario}"?\n\nEsta acción no se puede deshacer.`);
    
    if (confirmar) {
      try {
        await deleteDoc(doc(db, 'usuarios', usuarioId));
        
        // Actualizar la lista local
        setUsuarios(usuarios.filter(u => u.id !== usuarioId));
        
        console.log('✅ Usuario eliminado correctamente');
      } catch (err) {
        console.error('❌ Error al eliminar usuario:', err);
        setError('Error al eliminar el usuario');
      }
    }
  };

  const getNombreCompleto = (usuario: Usuario) => {
    return [
      usuario.primer_nombre,
      usuario.segundo_nombre,
      usuario.primer_apellido,
      usuario.segundo_apellido
    ].filter(Boolean).join(' ');
  };

  const getRolNombre = (rolId: string) => {
    const rol = roles.find(r => r.id === rolId);
    return rol?.nombre || 'Sin rol';
  };

  const getDepartamentoNombre = (deptoId?: string) => {
    if (!deptoId) return '-';
    const depto = departamentos.find(d => d.id === deptoId);
    return depto?.nombre || '-';
  };

  // Filtrar usuarios
  const usuariosFiltrados = usuarios.filter(usuario => {
    const nombreCompleto = getNombreCompleto(usuario).toLowerCase();
    const email = usuario.email.toLowerCase();
    const busqueda = searchTerm.toLowerCase();

    const coincideBusqueda = nombreCompleto.includes(busqueda) || 
                            email.includes(busqueda) ||
                            (usuario.identificador && usuario.identificador.includes(busqueda));

    const coincideRol = !filterRol || usuario.id_rol === filterRol;
    const coincideEstado = !filterEstado || 
                          (filterEstado === 'activo' && usuario.activo) ||
                          (filterEstado === 'inactivo' && !usuario.activo);

    return coincideBusqueda && coincideRol && coincideEstado;
  });

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Cargando usuarios...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <div className="error-icon">⚠️</div>
        <h2>Error al cargar datos</h2>
        <p>{error}</p>
        <button className="btn-primary" onClick={cargarDatos}>
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="gestion-usuarios">
      <div className="page-header">
        <h1>Gestión de Usuarios</h1>
        <button 
          className="btn-primary"
          onClick={() => navigate('/admin/usuarios/nuevo')}
        >
          <span>➕</span> Nuevo Usuario
        </button>
      </div>

      {/* Filtros y búsqueda */}
      <div className="filters-section">
        <div className="search-box">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Buscar por nombre, email o identificador..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="filters">
          <select 
            value={filterRol} 
            onChange={(e) => setFilterRol(e.target.value)}
            className="filter-select"
          >
            <option value="">Todos los roles</option>
            {roles.map(rol => (
              <option key={rol.id} value={rol.id}>{rol.nombre}</option>
            ))}
          </select>

          <select 
            value={filterEstado} 
            onChange={(e) => setFilterEstado(e.target.value)}
            className="filter-select"
          >
            <option value="">Todos los estados</option>
            <option value="activo">Activos</option>
            <option value="inactivo">Inactivos</option>
          </select>

          <button 
            className="btn-secondary"
            onClick={() => {
              setSearchTerm('');
              setFilterRol('');
              setFilterEstado('');
            }}
          >
            Limpiar filtros
          </button>
        </div>
      </div>

      {/* Resumen */}
      <div className="summary-cards">
        <div className="summary-card">
          <div className="summary-icon">👥</div>
          <div className="summary-info">
            <div className="summary-value">{usuarios.length}</div>
            <div className="summary-label">Total Usuarios</div>
          </div>
        </div>
        <div className="summary-card">
          <div className="summary-icon">✅</div>
          <div className="summary-info">
            <div className="summary-value">{usuarios.filter(u => u.activo).length}</div>
            <div className="summary-label">Activos</div>
          </div>
        </div>
        <div className="summary-card">
          <div className="summary-icon">❌</div>
          <div className="summary-info">
            <div className="summary-value">{usuarios.filter(u => !u.activo).length}</div>
            <div className="summary-label">Inactivos</div>
          </div>
        </div>
        <div className="summary-card">
          <div className="summary-icon">🔍</div>
          <div className="summary-info">
            <div className="summary-value">{usuariosFiltrados.length}</div>
            <div className="summary-label">Resultados</div>
          </div>
        </div>
      </div>

      {/* Tabla de usuarios */}
      <div className="table-container">
        <table className="usuarios-table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Email</th>
              <th>Identificador</th>
              <th>Rol</th>
              <th>Departamento</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {usuariosFiltrados.length === 0 ? (
              <tr>
                <td colSpan={7} className="no-data">
                  No se encontraron usuarios
                </td>
              </tr>
            ) : (
              usuariosFiltrados.map(usuario => (
                <tr key={usuario.id}>
                  <td>
                    <div className="user-name">
                      {getNombreCompleto(usuario)}
                    </div>
                  </td>
                  <td>{usuario.email}</td>
                  <td>{usuario.identificador || '-'}</td>
                  <td>
                    <span className={`badge badge-rol-${usuario.id_rol}`}>
                      {getRolNombre(usuario.id_rol)}
                    </span>
                  </td>
                  <td>{getDepartamentoNombre(usuario.id_departamento)}</td>
                  <td>
                    <span className={`badge ${usuario.activo ? 'badge-active' : 'badge-inactive'}`}>
                      {usuario.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button 
                        className="btn-icon btn-toggle"
                        onClick={() => toggleEstadoUsuario(usuario)}
                        title={usuario.activo ? 'Desactivar' : 'Activar'}
                      >
                        {usuario.activo ? '🔴' : '🟢'}
                      </button>
                      <button 
                        className="btn-icon btn-edit"
                        onClick={() => navigate(`/admin/usuarios/editar/${usuario.id}`)}
                        title="Editar"
                      >
                        ✏️
                      </button>
                      <button
                        className="btn-icon btn-delete"
                        onClick={() => eliminarUsuario(usuario.id, getNombreCompleto(usuario))}
                        title="Eliminar"
                      >
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default GestionUsuarios;
