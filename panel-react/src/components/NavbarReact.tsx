import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useGlobalState } from '../context/GlobalStateContext';

export const NavbarReact: React.FC = () => {
  const {
    usuario,
    isAuthenticated,
    serverOnline,
    databaseMode,
    logout,
    sincronizarDatos
  } = useGlobalState();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="react-navbar">
      <div className="react-navbar-inner">
        <div className="brand-block">
          <div className="react-logo-badge">
            <i className="fa-brands fa-react"></i>
          </div>
          <div>
            <div className="brand-title">Medisys Panel React</div>
            <div className="brand-sub">SPA Secundaria • Context API & Axios JWT (PA3)</div>
          </div>
        </div>

        {isAuthenticated && (
          <nav className="react-nav-links">
            <NavLink to="/panel" className={({ isActive }) => `r-nav-link ${isActive ? 'active' : ''}`}>
              <i className="fa-solid fa-chart-line"></i>
              <span>Centro Ejecutivo</span>
            </NavLink>
            <NavLink to="/citas" className={({ isActive }) => `r-nav-link ${isActive ? 'active' : ''}`}>
              <i className="fa-solid fa-calendar-check"></i>
              <span>Gestor CRUD Citas</span>
            </NavLink>
            <NavLink to="/seguridad" className={({ isActive }) => `r-nav-link ${isActive ? 'active' : ''}`}>
              <i className="fa-solid fa-shield-halved"></i>
              <span>Seguridad JWT & Roles</span>
            </NavLink>
            <a
              href="http://localhost:4200"
              target="_blank"
              rel="noreferrer"
              className="r-nav-link angular-switch"
              title="Ir a la Interfaz Principal en Angular (:4200)"
            >
              <i className="fa-brands fa-angular"></i>
              <span>App Angular (:4200)</span>
            </a>
          </nav>
        )}

        <div className="navbar-actions">
          <button
            type="button"
            onClick={sincronizarDatos}
            className={`status-pill ${serverOnline ? 'online' : 'offline'}`}
            title="Sincronizar con Express y MongoDB"
          >
            <span className="dot"></span>
            <span>{serverOnline ? `API: ${databaseMode}` : 'API Desconectada'}</span>
          </button>

          {isAuthenticated && usuario && (
            <div className="user-controls">
              <div className="user-chip">
                <span className={`role-tag role-${usuario.rol}`}>{usuario.rol.toUpperCase()}</span>
                <span className="u-name">{usuario.nombre}</span>
              </div>
              <button type="button" className="btn-exit" onClick={handleLogout}>
                <i className="fa-solid fa-power-off"></i>
                <span>Salir</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

