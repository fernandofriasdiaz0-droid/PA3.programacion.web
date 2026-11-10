import React from 'react';
import { Link } from 'react-router-dom';
import { useGlobalState } from '../context/GlobalStateContext';
import { CitaEstado } from '../types/medisys.types';

const ESTADOS_FLUJO: CitaEstado[] = [
  'Pendiente',
  'Confirmada',
  'En Atención',
  'Completada',
  'Cancelada'
];

export const ExecutivePanelPage: React.FC = () => {
  const {
    usuario,
    citas,
    estadisticas,
    isLoading,
    sincronizarDatos,
    cambiarEstadoCita,
    restaurarSeed
  } = useGlobalState();

  const especialidadesEntries = Object.entries(estadisticas.porEspecialidad || {});
  const prioridadesEntries = Object.entries(estadisticas.porPrioridad || {});

  const tasaConfirmacion =
    estadisticas.total > 0
      ? Math.round(
          ((estadisticas.confirmadas + estadisticas.completadas + (estadisticas.enAtencion || 0)) /
            estadisticas.total) *
            100
        )
      : 0;

  return (
    <div className="panel-container">
      {/* Banner Ejecutivo */}
      <section className="exec-hero">
        <div>
          <span className="exec-badge">
            <i className="fa-brands fa-react"></i> Panel Secundario en React.js • T09, T10 y T11
          </span>
          <h1>Centro de Control Ejecutivo & Monitoreo Clínico</h1>
          <p>
            Conectado en tiempo real a la misma colección MongoDB que Angular. Usuario activo:{' '}
            <strong>{usuario?.nombre}</strong> ({usuario?.rol.toUpperCase()}).
          </p>
        </div>
        <div className="exec-hero-btns">
          <button type="button" className="btn-outline-light" onClick={sincronizarDatos} disabled={isLoading}>
            <i className={`fa-solid fa-arrows-rotate ${isLoading ? 'fa-spin' : ''}`}></i>
            <span>Sincronizar MongoDB</span>
          </button>
          <button
            type="button"
            className="btn-outline-light"
            onClick={restaurarSeed}
            title="Solo permitido para el rol ADMIN"
          >
            <i className="fa-solid fa-database"></i>
            <span>Restaurar Seed (Admin)</span>
          </button>
          <Link to="/citas" className="btn-cta-cyan">
            <i className="fa-solid fa-table-list"></i>
            <span>Ir al Gestor CRUD</span>
          </Link>
        </div>
      </section>

      {/* KPIs Ejecutivos */}
      <section className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-top">
            <span>Citas Totales (MongoDB)</span>
            <i className="fa-solid fa-calendar-check kpi-icon blue"></i>
          </div>
          <div className="kpi-num">{estadisticas.total}</div>
          <small className="kpi-foot">Sincronizado con cliente Angular</small>
        </div>

        <div className="kpi-card">
          <div className="kpi-top">
            <span>Pendientes / Confirmadas</span>
            <i className="fa-solid fa-hourglass-half kpi-icon amber"></i>
          </div>
          <div className="kpi-num">
            {estadisticas.pendientes} / {estadisticas.confirmadas}
          </div>
          <small className="kpi-foot">En atención: {estadisticas.enAtencion || 0}</small>
        </div>

        <div className="kpi-card">
          <div className="kpi-top">
            <span>Tasa de Efectividad</span>
            <i className="fa-solid fa-chart-pie kpi-icon green"></i>
          </div>
          <div className="kpi-num">{tasaConfirmacion}%</div>
          <small className="kpi-foot">{estadisticas.completadas} completadas con éxito</small>
        </div>

        <div className="kpi-card highlight">
          <div className="kpi-top">
            <span>Ingresos Proyectados</span>
            <i className="fa-solid fa-sack-dollar kpi-icon cyan"></i>
          </div>
          <div className="kpi-num">S/ {estadisticas.ingresosEstimados.toFixed(2)}</div>
          <small className="kpi-foot">Excluye citas canceladas ({estadisticas.canceladas})</small>
        </div>
      </section>

      {/* Grilla Analítica */}
      <div className="exec-two-cols">
        {/* Columna 1: Tablero Rápido de Transición de Estados */}
        <section className="panel-box">
          <div className="box-head">
            <div>
              <h2>Control Rápido de Estados Clínicos</h2>
              <p>Cambia el estado de cualquier cita en MongoDB con actualización inmediata del Context API</p>
            </div>
            <Link to="/citas" className="link-small">
              Ver CRUD completo <i className="fa-solid fa-arrow-right"></i>
            </Link>
          </div>

          <div className="quick-list">
            {citas.slice(0, 6).map((cita) => (
              <div key={cita._id} className="quick-row">
                <div className="q-main">
                  <div className="q-avatar">{cita.cliente.charAt(0).toUpperCase()}</div>
                  <div>
                    <div className="q-name">
                      {cita.cliente}{' '}
                      <span className={`prio-badge prio-${cita.prioridad.toLowerCase()}`}>
                        {cita.prioridad}
                      </span>
                    </div>
                    <div className="q-meta">
                      <span>
                        <i className="fa-solid fa-stethoscope"></i> {cita.especialidad} ({cita.profesional})
                      </span>
                      <span>
                        <i className="fa-regular fa-clock"></i> {cita.fecha} • {cita.hora}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="q-actions">
                  <select
                    className={`state-select state-${cita.estado.toLowerCase().replace(/\s+/g, '-')}`}
                    value={cita.estado}
                    onChange={(e) => cambiarEstadoCita(cita, e.target.value as CitaEstado)}
                  >
                    {ESTADOS_FLUJO.map((est) => (
                      <option key={est} value={est}>
                        {est}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            ))}

            {citas.length === 0 && (
              <div className="empty-box">No hay citas registradas actualmente en MongoDB.</div>
            )}
          </div>
        </section>

        {/* Columna 2: Distribución por Especialidad y Prioridad */}
        <div className="side-stack">
          <section className="panel-box">
            <div className="box-head">
              <div>
                <h2>Demanda por Especialidad</h2>
                <p>Agregación en vivo desde el estado global</p>
              </div>
            </div>
            <div className="bars-list">
              {especialidadesEntries.map(([esp, cant]) => {
                const pct = estadisticas.total > 0 ? Math.round((cant / estadisticas.total) * 100) : 0;
                return (
                  <div key={esp} className="bar-item">
                    <div className="bar-labels">
                      <span>{esp}</span>
                      <strong>
                        {cant} cita(s) ({pct}%)
                      </strong>
                    </div>
                    <div className="bar-track">
                      <div className="bar-fill" style={{ width: `${pct}%` }}></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="panel-box">
            <div className="box-head">
              <div>
                <h2>Matriz de Prioridad Médica</h2>
                <p>Clasificación de triaje de pacientes activos</p>
              </div>
            </div>
            <div className="prio-chips-grid">
              {['Urgente', 'Alta', 'Media', 'Baja'].map((nivel) => {
                const count =
                  prioridadesEntries.find(([k]) => k === nivel)?.[1] ??
                  citas.filter((c) => c.prioridad === nivel).length;
                return (
                  <div key={nivel} className={`prio-summary-card prio-${nivel.toLowerCase()}`}>
                    <span className="p-label">Prioridad {nivel}</span>
                    <strong className="p-val">{count}</strong>
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

