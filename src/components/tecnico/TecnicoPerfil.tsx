import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useNavigate } from 'react-router-dom';
import { FiUser, FiMail, FiPhone, FiCreditCard, FiUsers, FiEdit, FiBox, FiShield } from 'react-icons/fi';
import './TecnicoPerfil.css';

interface TecnicoData {
  cedula: string;
  primer_nombre: string;
  segundo_nombre?: string;
  primer_apellido: string;
  segundo_apellido?: string;
  email: string;
  telefono: string;
  id_departamento: string;
  id_rol: string;
  identificador: string;
  activo: boolean;
  uid: string;
}

const TecnicoProfile = () => {
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();
  const [tecnicoData, setTecnicoData] = useState<TecnicoData | null>(null);
  const [departamento, setDepartamento] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTecnicoData();
  }, []);

  const loadTecnicoData = async () => {
    try {
      if (!currentUser?.uid) {
        navigate('/login');
        return;
      }

      const tecnicoDoc = await getDoc(doc(db, 'usuarios', currentUser.uid));
      
      if (tecnicoDoc.exists()) {
        const data = tecnicoDoc.data() as TecnicoData;
        setTecnicoData(data);

        if (data.id_departamento) {
          const deptDoc = await getDoc(doc(db, 'departamentos', data.id_departamento));
          if (deptDoc.exists()) {
            setDepartamento(deptDoc.data().nombre);
          }
        }
      }
    } catch (error) {
      console.error('Error cargando datos del técnico:', error);
    } finally {
      setLoading(false);
    }
  };

  const getNombreCompleto = () => {
    if (!tecnicoData) return '';
    
    const partes = [
      tecnicoData.primer_nombre,
      tecnicoData.segundo_nombre,
      tecnicoData.primer_apellido,
      tecnicoData.segundo_apellido
    ].filter(Boolean);
    
    return partes.join(' ');
  };

  if (loading) {
    return (
      <div className="tecnico-profile-loading">
        <div className="loading-spinner"></div>
        <p>Cargando perfil...</p>
      </div>
    );
  }

  if (!tecnicoData) {
    return (
      <div className="tecnico-profile-error">
        <h2>Error al cargar el perfil</h2>
        <p>No se pudo obtener la información del técnico.</p>
      </div>
    );
  }

  return (
    <div className="tecnico-profile">
      <div className="profile-header">
        <div className="profile-avatar">
          <FiUser />
        </div>
        <div className="profile-info">
          <h1>{getNombreCompleto()}</h1>
          <p className="profile-role">
            <FiShield className="inline-icon" />
            Técnico de Laboratorio
          </p>
          <span className={`status-badge ${tecnicoData.activo ? 'active' : 'inactive'}`}>
            {tecnicoData.activo ? 'Activo' : 'Inactivo'}
          </span>
        </div>
        <button 
          className="btn-edit-profile"
          onClick={() => navigate('/tecnico/perfil/editar')}
        >
          <FiEdit /> Editar Perfil
        </button>
      </div>

      <div className="profile-content">
        {/* Información Personal */}
        <div className="profile-card">
          <div className="card-header">
            <h2>
              <FiUser className="header-icon" />
              Información Personal
            </h2>
          </div>
          <div className="info-grid">
            <div className="info-item">
              <label>Primer Nombre</label>
              <div className="info-value">{tecnicoData.primer_nombre}</div>
            </div>
            {tecnicoData.segundo_nombre && (
              <div className="info-item">
                <label>Segundo Nombre</label>
                <div className="info-value">{tecnicoData.segundo_nombre}</div>
              </div>
            )}
            <div className="info-item">
              <label>Primer Apellido</label>
              <div className="info-value">{tecnicoData.primer_apellido}</div>
            </div>
            {tecnicoData.segundo_apellido && (
              <div className="info-item">
                <label>Segundo Apellido</label>
                <div className="info-value">{tecnicoData.segundo_apellido}</div>
              </div>
            )}
            <div className="info-item">
              <label>
                <FiCreditCard className="inline-icon" />
                Cédula
              </label>
              <div className="info-value mono">{tecnicoData.cedula}</div>
            </div>
            <div className="info-item">
              <label>
                <FiCreditCard className="inline-icon" />
                Identificador
              </label>
              <div className="info-value mono">{tecnicoData.identificador}</div>
            </div>
          </div>
        </div>

        {/* Información de Contacto */}
        <div className="profile-card">
          <div className="card-header">
            <h2>
              <FiMail className="header-icon" />
              Información de Contacto
            </h2>
          </div>
          <div className="info-grid">
            <div className="info-item">
              <label>
                <FiMail className="inline-icon" />
                Correo Electrónico
              </label>
              <div className="info-value">{tecnicoData.email}</div>
            </div>
            <div className="info-item">
              <label>
                <FiPhone className="inline-icon" />
                Teléfono
              </label>
              <div className="info-value">{tecnicoData.telefono}</div>
            </div>
          </div>
        </div>

        {/* Información Laboral */}
        <div className="profile-card">
          <div className="card-header">
            <h2>
              <FiBox className="header-icon" />
              Información Laboral
            </h2>
          </div>
          <div className="info-grid">
            <div className="info-item">
              <label>
                <FiBox className="inline-icon" />
                Departamento
              </label>
              <div className="info-value">{departamento || 'No asignado'}</div>
            </div>
            <div className="info-item">
              <label>
                <FiUsers className="inline-icon" />
                Rol
              </label>
              <div className="info-value">
                <span className="rol-badge">Técnico</span>
              </div>
            </div>
            <div className="info-item">
              <label>Estado</label>
              <div className="info-value">
                <span className={`estado-badge ${tecnicoData.activo ? 'activo' : 'inactivo'}`}>
                  {tecnicoData.activo ? 'Activo' : 'Inactivo'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Información del Sistema */}
        <div className="profile-card">
          <div className="card-header">
            <h2>
              <FiShield className="header-icon" />
              Información del Sistema
            </h2>
          </div>
          <div className="sistema-info">
            <div className="info-item">
              <label>ID de Usuario</label>
              <div className="info-value mono">{tecnicoData.uid}</div>
            </div>
            <div className="info-item">
              <label>Permisos</label>
              <div className="info-value">
                Gestión de Inventario, Mantenimientos y Solicitudes
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TecnicoProfile;