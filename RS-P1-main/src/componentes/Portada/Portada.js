import React from 'react';
import './Portada.css';
import { Link } from 'react-router-dom';

const MainPage = () => {
  return (
    <div className="main-container">
      <nav className="navbar">
        <ul className="nav-links">
          <li className="nav-link">Sobre nosotros</li>  {/* Texto sin enlace */}
          <li><Link to="/login" className="nav-link">Página Principal</Link></li> {/* Redirige a Login */}
          <li className="nav-link">Contactos</li>  {/* Texto sin enlace */}
        </ul>
      </nav>

      <div className="content-wrapper">
        <div className="center-content">
          <h1 className="company-name">MSIKCrowfund</h1>
          <h2 className="mission-title">Nuestra misión</h2>
          <p className="mission-text">
            Somos un sistema de crowdfunding diseñado para apoyar tu proyecto de una manera simple y eficaz.
          </p>
        </div>
      </div>
    </div>
  );
};

export default MainPage;

 