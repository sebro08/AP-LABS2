import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getAuth } from 'firebase/auth';
import { getFirestore, collection, query, where, getDocs } from 'firebase/firestore';
import './UserDashboard.css';

interface QuickStats {
  solicitudesPendientes: number;
  mensajesNoLeidos: number;
  reservasActivas: number;
  notificacionesNuevas: number;
}

const UserDashboard: React.FC = () => {
  const auth = getAuth();
  const db = getFirestore();
  const [stats, setStats] = useState<QuickStats>({
    solicitudesPendientes: 0,
    mensajesNoLeidos: 0,
    reservasActivas: 0,
    notificacionesNuevas: 0
  });
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState('Usuario');

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      // Cargar nombre del usuario
      const userDoc = await getDocs(query(collection(db, 'usuarios'), where('__name__', '==', user.uid)));
      if (!userDoc.empty) {
        const userData = userDoc.docs[0].data();
        const nombre = [userData.primer_nombre, userData.primer_apellido].filter(Boolean).join(' ');
        setUserName(nombre);
      }

      // Cargar estadísticas
      const [solicitudes, mensajes, reservas, notificaciones] = await Promise.all([
        loadSolicitudesPendientes(user.uid),
        loadMensajesNoLeidos(user.uid),
        loadReservasActivas(user.uid),
        loadNotificacionesNuevas(user.uid)
      ]);

      setStats({
        solicitudesPendientes: solicitudes,
        mensajesNoLeidos: mensajes,
        reservasActivas: reservas,
        notificacionesNuevas: notificaciones
      });
    } catch (error) {
      console.error('Error cargando datos del dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSolicitudesPendientes = async (userId: string): Promise<number> => {
    try {
      const labsQuery = query(
        collection(db, 'solicitudes_labs'),
        where('id_usuario', '==', userId),
        where('estado_solicitud', '==', 'pendiente')
      );
      const recursosQuery = query(
        collection(db, 'solicitudes_recursos'),
        where('id_usuario', '==', userId),
        where('estado_solicitud', '==', 'pendiente')
      );

      const [labsSnapshot, recursosSnapshot] = await Promise.all([
        getDocs(labsQuery),
        getDocs(recursosQuery)
      ]);

      return labsSnapshot.size + recursosSnapshot.size;
    } catch (error) {
      console.error('Error cargando solicitudes pendientes:', error);
      return 0;
    }
  };

  const loadMensajesNoLeidos = async (userId: string): Promise<number> => {
    try {
      const mensajesQuery = query(
        collection(db, 'mensajes'),
        where('id_destinatario', '==', userId),
        where('leido', '==', false)
      );
      const snapshot = await getDocs(mensajesQuery);
      return snapshot.size;
    } catch (error) {
      console.error('Error cargando mensajes no leídos:', error);
      return 0;
    }
  };

  const loadReservasActivas = async (userId: string): Promise<number> => {
    try {
      const labsQuery = query(
        collection(db, 'solicitudes_labs'),
        where('id_usuario', '==', userId),
        where('estado_solicitud', '==', 'aprobada')
      );
      const recursosQuery = query(
        collection(db, 'solicitudes_recursos'),
        where('id_usuario', '==', userId),
        where('estado_solicitud', '==', 'aprobada')
      );

      const [labsSnapshot, recursosSnapshot] = await Promise.all([
        getDocs(labsQuery),
        getDocs(recursosQuery)
      ]);

      return labsSnapshot.size + recursosSnapshot.size;
    } catch (error) {
      console.error('Error cargando reservas activas:', error);
      return 0;
    }
  };

  const loadNotificacionesNuevas = async (userId: string): Promise<number> => {
    try {
      const notifQuery = query(
        collection(db, 'notificaciones'),
        where('id_destinatario', '==', userId),
        where('leida', '==', false)
      );
      const snapshot = await getDocs(notifQuery);
      return snapshot.size;
    } catch (error) {
      console.error('Error cargando notificaciones nuevas:', error);
      return 0;
    }
  };

  const quickActions = [
    {
      title: 'Nueva Reserva',
      description: 'Solicitar laboratorio o recurso',
      icon: '🏢',
      link: '/user/reservas',
      color: '#3b82f6'
    },
    {
      title: 'Mis Solicitudes',
      description: 'Ver estado de solicitudes',
      icon: '📋',
      link: '/user/mis-solicitudes',
      color: '#8b5cf6'
    },
    {
      title: 'Mensajes',
      description: 'Bandeja de entrada',
      icon: '💬',
      link: '/user/mensajes',
      color: '#10b981'
    },
    {
      title: 'Historial',
      description: 'Ver historial de uso',
      icon: '📊',
      link: '/user/historial',
      color: '#f59e0b'
    }
  ];

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="spinner"></div>
        <p>Cargando dashboard...</p>
      </div>
    );
  }

  return (
    <div className="user-dashboard">
      <div className="welcome-section">
        <h1>¡Bienvenido, {userName}!</h1>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card blue">
          <div className="stat-icon">📋</div>
          <div className="stat-content">
            <h3>{stats.solicitudesPendientes}</h3>
            <p>Solicitudes Pendientes</p>
          </div>
        </div>

        <div className="stat-card green">
          <div className="stat-icon">💬</div>
          <div className="stat-content">
            <h3>{stats.mensajesNoLeidos}</h3>
            <p>Mensajes No Leídos</p>
          </div>
        </div>

        <div className="stat-card purple">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <h3>{stats.reservasActivas}</h3>
            <p>Reservas Activas</p>
          </div>
        </div>

        <div className="stat-card orange">
          <div className="stat-icon">🔔</div>
          <div className="stat-content">
            <h3>{stats.notificacionesNuevas}</h3>
            <p>Notificaciones Nuevas</p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="quick-actions-section">
        <h2>Acciones Rápidas</h2>
        <div className="actions-grid">
          {quickActions.map((action, index) => (
            <Link
              key={index}
              to={action.link}
              className="action-card"
              style={{ borderLeftColor: action.color }}
            >
              <div className="action-icon" style={{ backgroundColor: action.color }}>
                {action.icon}
              </div>
              <div className="action-content">
                <h3>{action.title}</h3>
                <p>{action.description}</p>
              </div>
              <div className="action-arrow">→</div>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="recent-activity">
        <h2>Actividad Reciente</h2>
        <div className="activity-list">
          {stats.solicitudesPendientes > 0 && (
            <div className="activity-item">
              <div className="activity-icon pending">⏳</div>
              <div className="activity-content">
                <p className="activity-title">Tienes solicitudes pendientes</p>
                <p className="activity-time">{stats.solicitudesPendientes} solicitud(es) esperando aprobación</p>
              </div>
            </div>
          )}
          
          {stats.mensajesNoLeidos > 0 && (
            <div className="activity-item">
              <div className="activity-icon message">💬</div>
              <div className="activity-content">
                <p className="activity-title">Mensajes nuevos</p>
                <p className="activity-time">{stats.mensajesNoLeidos} mensaje(s) sin leer</p>
              </div>
            </div>
          )}

          {stats.reservasActivas > 0 && (
            <div className="activity-item">
              <div className="activity-icon success">✅</div>
              <div className="activity-content">
                <p className="activity-title">Reservas activas</p>
                <p className="activity-time">{stats.reservasActivas} reserva(s) aprobada(s)</p>
              </div>
            </div>
          )}

          {stats.solicitudesPendientes === 0 && stats.mensajesNoLeidos === 0 && stats.reservasActivas === 0 && (
            <div className="no-activity">
              <p>No hay actividad reciente</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;
