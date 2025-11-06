import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import './UserProfile.css';

interface UserData {
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
}

const UserProfile: React.FC = () => {
  const auth = getAuth();
  const db = getFirestore();
  const navigate = useNavigate();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [departamento, setDepartamento] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const user = auth.currentUser;
      if (!user) {
        navigate('/login');
        return;
      }

      const userDoc = await getDoc(doc(db, 'usuarios', user.uid));
      if (userDoc.exists()) {
        const data = userDoc.data() as UserData;
        setUserData(data);

        // Cargar nombre del departamento
        if (data.id_departamento) {
          const deptDoc = await getDoc(doc(db, 'departamentos', data.id_departamento));
          if (deptDoc.exists()) {
            setDepartamento(deptDoc.data().nombre);
          }
        }
      }
    } catch (error) {
      console.error('Error cargando datos del usuario:', error);
    } finally {
      setLoading(false);
    }
  };

  const getNombreCompleto = () => {
    if (!userData) return '';
    return [
      userData.primer_nombre,
      userData.segundo_nombre,
      userData.primer_apellido,
      userData.segundo_apellido
    ].filter(Boolean).join(' ');
  };

  const getRolNombre = () => {
    if (!userData) return '';
    switch (userData.id_rol) {
      case '1': return 'Estudiante';
      case '2': return 'Docente';
      case '3': return 'Administrador';
      case '4': return 'Técnico';
      default: return 'Usuario';
    }
  };

  if (loading) {
    return (
      <div className="profile-loading">
        <div className="spinner"></div>
        <p>Cargando perfil...</p>
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="profile-error">
        <p>No se pudo cargar la información del perfil</p>
        <button onClick={() => navigate('/user/dashboard')}>Volver al inicio</button>
      </div>
    );
  }

  return (
    <div className="user-profile">
      <div className="profile-header">
        <div className="profile-avatar-large">
          {getNombreCompleto().charAt(0).toUpperCase()}
        </div>
        <div className="profile-header-info">
          <h1>{getNombreCompleto()}</h1>
          <p className="profile-role">{getRolNombre()}</p>
          <span className={`status-badge ${userData.activo ? 'active' : 'inactive'}`}>
            {userData.activo ? 'Activo' : 'Inactivo'}
          </span>
        </div>
        <button 
          className="edit-profile-btn"
          onClick={() => navigate('/user/perfil/editar')}
        >
          ✏️ Editar Perfil
        </button>
      </div>

      <div className="profile-content">
        <div className="profile-section">
          <h2>Información Personal</h2>
          <div className="info-grid">
            <div className="info-item">
              <label>Cédula</label>
              <p>{userData.cedula}</p>
            </div>
            <div className="info-item">
              <label>Identificador</label>
              <p>{userData.identificador}</p>
            </div>
            <div className="info-item">
              <label>Primer Nombre</label>
              <p>{userData.primer_nombre}</p>
            </div>
            {userData.segundo_nombre && (
              <div className="info-item">
                <label>Segundo Nombre</label>
                <p>{userData.segundo_nombre}</p>
              </div>
            )}
            <div className="info-item">
              <label>Primer Apellido</label>
              <p>{userData.primer_apellido}</p>
            </div>
            {userData.segundo_apellido && (
              <div className="info-item">
                <label>Segundo Apellido</label>
                <p>{userData.segundo_apellido}</p>
              </div>
            )}
          </div>
        </div>

        <div className="profile-section">
          <h2>Información de Contacto</h2>
          <div className="info-grid">
            <div className="info-item">
              <label>Correo Electrónico</label>
              <p>{userData.email}</p>
            </div>
            <div className="info-item">
              <label>Teléfono</label>
              <p>{userData.telefono || 'No especificado'}</p>
            </div>
          </div>
        </div>

        <div className="profile-section">
          <h2>Información Académica</h2>
          <div className="info-grid">
            <div className="info-item">
              <label>Departamento</label>
              <p>{departamento || 'No especificado'}</p>
            </div>
            <div className="info-item">
              <label>Rol</label>
              <p>{getRolNombre()}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
