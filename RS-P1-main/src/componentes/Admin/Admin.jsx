import React from 'react';
import { Link } from 'react-router-dom';
import './Admin.css';

const Admin = () => {
    return (
        <div className="admin-screen-container">
            <div className="overlay">
                <Link to="/monitoreo-proyectos" className="option">Monitoreo de proyectos</Link>
                <Link to="/monitoreo-donaciones" className="option">Monitoreo de donaciones</Link>
                <Link to="/usuarios" className="option">Gestión de usuarios</Link>
                <Link to="/estadisticas-sistema" className="option">Estadísticas del sistema</Link>
                <Link to="/login" className="option">Regresar</Link>
            </div>
        </div>
    );
}

export default Admin;

