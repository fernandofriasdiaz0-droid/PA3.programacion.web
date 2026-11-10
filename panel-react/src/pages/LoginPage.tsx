import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGlobalState } from '../context/GlobalStateContext';
import { ESPECIALIDADES_LISTA, RolUsuario } from '../types/medisys.types';

export const LoginPage: React.FC = () => {
  const { isAuthenticated, login, register, isLoading } = useGlobalState();
  const navigate = useNavigate();

  const [modoRegistro, setModoRegistro] = useState(false);
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('admin@medisys.com');
  const [password, setPassword] = useState('Admin123!');
  const [rol, setRol] = useState<RolUsuario>('recepcionista');
  const [especialidad, setEspecialidad] = useState('Recepción y Admisión');

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/panel');
    }
  }, [isAuthenticated, navigate]);

  const cargarCredencialDemo = (tipo: RolUsuario) => {
    setModoRegistro(false);
    if (tipo === 'admin') {
      setEmail('admin@medisys.com');
      setPassword('Admin123!');
    } else if (tipo === 'medico') {
      setEmail('medico@medisys.com');
      setPassword('Medico123!');
    } else {
      setEmail('recepcion@medisys.com');
      setPassword('Recepcion123!');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (modoRegistro) {
      const ok = await register({ nombre, email, password, rol, especialidad });
      if (ok) navigate('/panel');
    } else {
      const ok = await login(email, password);
      if (ok) navigate('/panel');
    }
  };

  return (
    <div className="login-wrapper">
      <div className="login-card">
        <div className="login-top">
          <div className="login-icon">
            <i className="fa-brands fa-react"></i>
          </div>
          <h1>{modoRegistro ? 'Crear Cuenta en Medisys' : 'Panel Secundario React.js'}</h1>
          <p>
            Conectado al mismo Backend Express + MongoDB que Angular • Autenticación JWT y Bcrypt
          </p>
        </div>

        <div className="mode-tabs">
          <button
            type="button"
            className={`tab-btn ${!modoRegistro ? 'active' : ''}`}
            onClick={() => setModoRegistro(false)}
          >
            <i className="fa-solid fa-right-to-bracket"></i> Iniciar Sesión
          </button>
          <button
            type="button"
            className={`tab-btn ${modoRegistro ? 'active' : ''}`}
            onClick={() => {
              setModoRegistro(true);
              setEmail('');
              setPassword('');
            }}
          >
            <i className="fa-solid fa-user-plus"></i> Registrar Usuario
          </button>
        </div>

        {!modoRegistro && (
          <div className="demo-box">
            <span className="demo-title">
              <i className="fa-solid fa-bolt"></i> Acceso Rápido de Prueba por Rol (1 Clic):
            </span>
            <div className="demo-grid">
              <button type="button" className="demo-pill admin" onClick={() => cargarCredencialDemo('admin')}>
                <i className="fa-solid fa-user-shield"></i> Admin
              </button>
              <button type="button" className="demo-pill medico" onClick={() => cargarCredencialDemo('medico')}>
                <i className="fa-solid fa-user-doctor"></i> Médico
              </button>
              <button
                type="button"
                className="demo-pill recepcion"
                onClick={() => cargarCredencialDemo('recepcionista')}
              >
                <i className="fa-solid fa-headset"></i> Recepción
              </button>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="react-form">
          {modoRegistro && (
            <div className="field-group">
              <label>Nombre Completo</label>
              <input
                type="text"
                required
                minLength={3}
                placeholder="Ej. Dra. Valeria Gómez"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
              />
            </div>
          )}

          <div className="field-group">
            <label>Correo Electrónico</label>
            <input
              type="email"
              required
              placeholder="correo@medisys.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="field-group">
            <label>Contraseña (mínimo 6 caracteres)</label>
            <input
              type="password"
              required
              minLength={6}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {modoRegistro && (
            <div className="grid-2">
              <div className="field-group">
                <label>Rol en el Sistema (RBAC)</label>
                <select value={rol} onChange={(e) => setRol(e.target.value as RolUsuario)}>
                  <option value="recepcionista">Recepcionista</option>
                  <option value="medico">Médico Especialista</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>
              <div className="field-group">
                <label>Especialidad / Área</label>
                <select value={especialidad} onChange={(e) => setEspecialidad(e.target.value)}>
                  <option value="Recepción y Admisión">Recepción y Admisión</option>
                  <option value="Dirección Médica">Dirección Médica</option>
                  {ESPECIALIDADES_LISTA.map((esp) => (
                    <option key={esp} value={esp}>
                      {esp}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          <button type="submit" className="btn-primary-react" disabled={isLoading}>
            <i className={`fa-solid ${isLoading ? 'fa-spinner fa-spin' : 'fa-lock-open'}`}></i>
            <span>
              {isLoading
                ? 'Conectando con MongoDB...'
                : modoRegistro
                ? 'Registrar y Entrar al Panel'
                : 'Autenticar con JWT'}
            </span>
          </button>
        </form>
      </div>
    </div>
  );
};

