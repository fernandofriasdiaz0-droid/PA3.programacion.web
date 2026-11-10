import React, { useState } from 'react';
import { useGlobalState } from '../context/GlobalStateContext';
import {
  Cita,
  CitaEstado,
  CitaPrioridad,
  ESPECIALIDADES_LISTA,
  MEDICOS_POR_ESPECIALIDAD
} from '../types/medisys.types';

const ESTADOS: CitaEstado[] = ['Pendiente', 'Confirmada', 'En Atención', 'Completada', 'Cancelada'];
const PRIORIDADES: CitaPrioridad[] = ['Baja', 'Media', 'Alta', 'Urgente'];

export const CitasManagerPage: React.FC = () => {
  const {
    usuario,
    citas,
    citasFiltradas,
    filtros,
    isLoading,
    actualizarFiltros,
    limpiarFiltros,
    crearCita,
    actualizarCita,
    cambiarEstadoCita,
    eliminarCita,
    mostrarToast
  } = useGlobalState();

  const [modalFormAbierto, setModalFormAbierto] = useState(false);
  const [citaEditando, setCitaEditando] = useState<Cita | null>(null);
  const [citaParaEliminar, setCitaParaEliminar] = useState<Cita | null>(null);

  // Estado local del formulario modal (Hooks - T09)
  const [cliente, setCliente] = useState('');
  const [email, setEmail] = useState('');
  const [telefono, setTelefono] = useState('');
  const [especialidad, setEspecialidad] = useState(ESPECIALIDADES_LISTA[0]);
  const [profesional, setProfesional] = useState(MEDICOS_POR_ESPECIALIDAD[ESPECIALIDADES_LISTA[0]][0]);
  const [fecha, setFecha] = useState('2026-10-25');
  const [hora, setHora] = useState('09:30');
  const [motivo, setMotivo] = useState('');
  const [estado, setEstado] = useState<CitaEstado>('Pendiente');
  const [prioridad, setPrioridad] = useState<CitaPrioridad>('Media');
  const [costo, setCosto] = useState<number>(100);
  const [observaciones, setObservaciones] = useState('');

  const abrirModalNueva = () => {
    if (usuario?.rol === 'medico') {
      mostrarToast(
        'error',
        'Creación Restringida por Rol (RBAC)',
        'El rol MÉDICO solo puede actualizar el estado de atención de las citas, no agendar nuevas citas administrativas.'
      );
      return;
    }
    setCitaEditando(null);
    setCliente('');
    setEmail('');
    setTelefono('+51 987 000 111');
    const espInicial = ESPECIALIDADES_LISTA[0];
    setEspecialidad(espInicial);
    setProfesional(MEDICOS_POR_ESPECIALIDAD[espInicial][0]);
    setFecha(new Date(Date.now() + 86400000).toISOString().split('T')[0]);
    setHora('10:00');
    setMotivo('');
    setEstado('Pendiente');
    setPrioridad('Media');
    setCosto(120);
    setObservaciones('');
    setModalFormAbierto(true);
  };

  const abrirModalEditar = (c: Cita) => {
    if (usuario?.rol === 'medico') {
      mostrarToast(
        'error',
        'Edición Restringida por Rol (RBAC)',
        'El rol MÉDICO solo está autorizado para cambiar el ESTADO de atención en la tabla.'
      );
      return;
    }
    setCitaEditando(c);
    setCliente(c.cliente);
    setEmail(c.email);
    setTelefono(c.telefono);
    setEspecialidad(c.especialidad);
    setProfesional(c.profesional);
    setFecha(c.fecha);
    setHora(c.hora);
    setMotivo(c.motivo);
    setEstado(c.estado);
    setPrioridad(c.prioridad);
    setCosto(c.costo);
    setObservaciones(c.observaciones || '');
    setModalFormAbierto(true);
  };

  const handleEspecialidadChange = (nuevaEsp: string) => {
    setEspecialidad(nuevaEsp);
    const listaMedicos = MEDICOS_POR_ESPECIALIDAD[nuevaEsp] || ['Dr. Especialista'];
    setProfesional(listaMedicos[0]);
  };

  const handleGuardarFormulario = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cliente.trim().length < 3 || motivo.trim().length < 5) {
      mostrarToast(
        'error',
        'Validación de Formulario',
        'El nombre debe tener al menos 3 caracteres y el motivo al menos 5 caracteres.'
      );
      return;
    }

    const payload: Omit<Cita, '_id' | 'createdAt' | 'updatedAt'> = {
      cliente,
      email,
      telefono,
      especialidad,
      profesional,
      fecha,
      hora,
      motivo,
      estado,
      prioridad,
      costo: Number(costo),
      observaciones
    };

    if (citaEditando?._id) {
      const ok = await actualizarCita(citaEditando._id, payload);
      if (ok) setModalFormAbierto(false);
    } else {
      const ok = await crearCita(payload);
      if (ok) setModalFormAbierto(false);
    }
  };

  const confirmarEliminacion = async () => {
    if (!citaParaEliminar?._id) return;
    await eliminarCita(citaParaEliminar._id);
    setCitaParaEliminar(null);
  };

  const exportarCSV = () => {
    if (citasFiltradas.length === 0) {
      mostrarToast('info', 'Sin registros', 'No hay citas en la tabla actual para exportar.');
      return;
    }
    const cabeceras = ['Paciente', 'Email', 'Teléfono', 'Especialidad', 'Profesional', 'Fecha', 'Hora', 'Prioridad', 'Estado', 'Costo (S/)', 'Motivo'];
    const filas = citasFiltradas.map((c) => [
      `"${c.cliente.replace(/"/g, '""')}"`,
      `"${c.email}"`,
      `"Tel: ${c.telefono}"`,
      `"${c.especialidad}"`,
      `"${c.profesional}"`,
      c.fecha,
      c.hora,
      c.prioridad,
      c.estado,
      Number(c.costo).toFixed(2),
      `"${c.motivo.replace(/"/g, '""')}"`
    ]);
    const csv = '\uFEFF' + [cabeceras.join(';'), ...filas.map((f) => f.join(';'))].join('\r\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `reporte-citas-react-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    mostrarToast('success', 'CSV Exportado', `Se descargaron ${citasFiltradas.length} registros en formato Excel (.csv).`);
  };

  const filtrarMisCitas = () => {
    if (!usuario?.nombre) return;
    if (filtros.buscar === usuario.nombre) {
      actualizarFiltros({ buscar: '' });
    } else {
      actualizarFiltros({ buscar: usuario.nombre });
    }
  };

  return (
    <div className="panel-container">
      {/* Cabecera */}
      <div className="page-top-bar">
        <div>
          <h1>Gestor Operativo de Citas (CRUD Persistente)</h1>
          <p>
            Opera sobre la misma colección <code>citas</code> en MongoDB compartida con Angular •{' '}
            Mostrando <strong>{citasFiltradas.length}</strong> de <strong>{citas.length}</strong> registros
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
          {usuario?.rol === 'medico' && (
            <button type="button" className="btn-ghost" onClick={filtrarMisCitas}>
              <i className="fa-solid fa-stethoscope"></i>{' '}
              {filtros.buscar === usuario.nombre ? 'Ver Todas las Citas' : 'Mis Citas Asignadas'}
            </button>
          )}
          <button type="button" className="btn-ghost" onClick={exportarCSV}>
            <i className="fa-solid fa-file-csv"></i> Exportar CSV
          </button>
          {usuario?.rol !== 'medico' && (
            <button type="button" className="btn-cta-cyan" onClick={abrirModalNueva}>
              <i className="fa-solid fa-plus"></i>
              <span>Agendar Nueva Cita (React)</span>
            </button>
          )}
        </div>
      </div>

      {/* Filtros conectados al Estado Global (Context API - T10) */}
      <div className="filters-panel">
        <div className="search-field">
          <i className="fa-solid fa-magnifying-glass"></i>
          <input
            type="text"
            placeholder="Buscar por paciente, médico, especialidad o motivo..."
            value={filtros.buscar}
            onChange={(e) => actualizarFiltros({ buscar: e.target.value })}
          />
        </div>

        <select
          value={filtros.estado}
          onChange={(e) => actualizarFiltros({ estado: e.target.value })}
        >
          <option value="Todos">Todos los estados</option>
          {ESTADOS.map((est) => (
            <option key={est} value={est}>
              {est}
            </option>
          ))}
        </select>

        <select
          value={filtros.especialidad}
          onChange={(e) => actualizarFiltros({ especialidad: e.target.value })}
        >
          <option value="Todas">Todas las especialidades</option>
          {ESPECIALIDADES_LISTA.map((esp) => (
            <option key={esp} value={esp}>
              {esp}
            </option>
          ))}
        </select>

        <select
          value={filtros.prioridad}
          onChange={(e) => actualizarFiltros({ prioridad: e.target.value })}
        >
          <option value="Todas">Todas las prioridades</option>
          {PRIORIDADES.map((p) => (
            <option key={p} value={p}>
              Prioridad: {p}
            </option>
          ))}
        </select>

        <button type="button" className="btn-ghost" onClick={limpiarFiltros}>
          <i className="fa-solid fa-filter-circle-xmark"></i> Limpiar
        </button>
      </div>

      {/* Tabla CRUD */}
      <div className="panel-box table-wrapper">
        {isLoading ? (
          <div className="empty-box">
            <i className="fa-solid fa-spinner fa-spin"></i> Sincronizando con MongoDB...
          </div>
        ) : citasFiltradas.length === 0 ? (
          <div className="empty-box">No se encontraron citas médicas con los filtros aplicados.</div>
        ) : (
          <table className="react-table">
            <thead>
              <tr>
                <th>Paciente / Contacto</th>
                <th>Especialidad & Médico</th>
                <th>Fecha y Hora</th>
                <th>Prioridad</th>
                <th>Tarifa</th>
                <th>Estado</th>
                <th>Registrado Por</th>
                <th className="text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {citasFiltradas.map((cita) => (
                <tr key={cita._id}>
                  <td>
                    <div className="cell-main">{cita.cliente}</div>
                    <div className="cell-sub">
                      {cita.email} • {cita.telefono}
                    </div>
                  </td>
                  <td>
                    <span className="esp-tag">{cita.especialidad}</span>
                    <div className="cell-sub">{cita.profesional}</div>
                    <div className="cell-motive" title={cita.motivo}>
                      {cita.motivo}
                    </div>
                  </td>
                  <td>
                    <div className="cell-main">{cita.fecha}</div>
                    <div className="cell-sub">{cita.hora} hrs</div>
                  </td>
                  <td>
                    <span className={`prio-badge prio-${cita.prioridad.toLowerCase()}`}>
                      {cita.prioridad}
                    </span>
                  </td>
                  <td>
                    <strong>S/ {Number(cita.costo).toFixed(2)}</strong>
                  </td>
                  <td>
                    <select
                      className={`state-select state-${cita.estado.toLowerCase().replace(/\s+/g, '-')}`}
                      value={cita.estado}
                      onChange={(e) => cambiarEstadoCita(cita, e.target.value as CitaEstado)}
                    >
                      {ESTADOS.map((est) => (
                        <option key={est} value={est}>
                          {est}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <small className="author-tag">{cita.creadoPor || 'Sistema Medisys'}</small>
                  </td>
                  <td className="text-right">
                    <div className="row-btns">
                      <button
                        type="button"
                        className="icon-btn edit"
                        title={
                          usuario?.rol === 'medico'
                            ? 'Bloqueado para rol MÉDICO (solo cambio de estado)'
                            : 'Editar cita médica'
                        }
                        onClick={() => abrirModalEditar(cita)}
                      >
                        <i className={`fa-solid ${usuario?.rol === 'medico' ? 'fa-lock' : 'fa-pen'}`}></i>
                      </button>
                      <button
                        type="button"
                        className="icon-btn delete"
                        title={
                          usuario?.rol === 'admin'
                            ? 'Eliminar registro de MongoDB'
                            : 'Solo el rol ADMIN puede eliminar registros (prueba RBAC 403)'
                        }
                        onClick={() => setCitaParaEliminar(cita)}
                      >
                        <i className={`fa-solid ${usuario?.rol === 'admin' ? 'fa-trash' : 'fa-lock'}`}></i>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal de Crear / Editar Cita */}
      {modalFormAbierto && (
        <div className="modal-backdrop">
          <div className="modal-box">
            <div className="modal-head">
              <h3>
                {citaEditando ? `Editar Cita: ${citaEditando.cliente}` : 'Registrar Nueva Cita Médica'}
              </h3>
              <button type="button" className="close-btn" onClick={() => setModalFormAbierto(false)}>
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            <form onSubmit={handleGuardarFormulario} className="react-form">
              <div className="grid-2">
                <div className="field-group">
                  <label>Nombre del Paciente *</label>
                  <input
                    type="text"
                    required
                    minLength={3}
                    value={cliente}
                    onChange={(e) => setCliente(e.target.value)}
                    placeholder="Nombre y apellidos"
                  />
                </div>
                <div className="field-group">
                  <label>Correo Electrónico *</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="paciente@ejemplo.com"
                  />
                </div>
              </div>

              <div className="grid-3">
                <div className="field-group">
                  <label>Teléfono *</label>
                  <input
                    type="text"
                    required
                    value={telefono}
                    onChange={(e) => setTelefono(e.target.value)}
                  />
                </div>
                <div className="field-group">
                  <label>Especialidad *</label>
                  <select
                    value={especialidad}
                    onChange={(e) => handleEspecialidadChange(e.target.value)}
                  >
                    {ESPECIALIDADES_LISTA.map((esp) => (
                      <option key={esp} value={esp}>
                        {esp}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="field-group">
                  <label>Médico Asignado *</label>
                  <select value={profesional} onChange={(e) => setProfesional(e.target.value)}>
                    {(MEDICOS_POR_ESPECIALIDAD[especialidad] || [profesional]).map((med) => (
                      <option key={med} value={med}>
                        {med}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid-3">
                <div className="field-group">
                  <label>Fecha (YYYY-MM-DD) *</label>
                  <input
                    type="date"
                    required
                    value={fecha}
                    onChange={(e) => setFecha(e.target.value)}
                  />
                </div>
                <div className="field-group">
                  <label>Hora (HH:mm) *</label>
                  <input
                    type="time"
                    required
                    value={hora}
                    onChange={(e) => setHora(e.target.value)}
                  />
                </div>
                <div className="field-group">
                  <label>Costo Consulta (S/) *</label>
                  <input
                    type="number"
                    min={0}
                    step="0.5"
                    required
                    value={costo}
                    onChange={(e) => setCosto(Number(e.target.value))}
                  />
                </div>
              </div>

              <div className="grid-2">
                <div className="field-group">
                  <label>Estado de la Cita</label>
                  <select value={estado} onChange={(e) => setEstado(e.target.value as CitaEstado)}>
                    {ESTADOS.map((est) => (
                      <option key={est} value={est}>
                        {est}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="field-group">
                  <label>Prioridad Clínica</label>
                  <select
                    value={prioridad}
                    onChange={(e) => setPrioridad(e.target.value as CitaPrioridad)}
                  >
                    {PRIORIDADES.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="field-group">
                <label>Motivo de Consulta *</label>
                <input
                  type="text"
                  required
                  minLength={5}
                  value={motivo}
                  onChange={(e) => setMotivo(e.target.value)}
                  placeholder="Describe el motivo clínico de la atención"
                />
              </div>

              <div className="field-group">
                <label>Observaciones Clínicas</label>
                <input
                  type="text"
                  value={observaciones}
                  onChange={(e) => setObservaciones(e.target.value)}
                  placeholder="Indicaciones adicionales opcionales"
                />
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-ghost"
                  onClick={() => setModalFormAbierto(false)}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn-cta-cyan">
                  <i className="fa-solid fa-floppy-disk"></i>
                  <span>{citaEditando ? 'Guardar Cambios en MongoDB' : 'Registrar Cita'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Confirmación de Eliminación */}
      {citaParaEliminar && (
        <div className="modal-backdrop">
          <div className="modal-box small">
            <div className="modal-head">
              <h3>¿Confirmar eliminación en MongoDB?</h3>
              <button type="button" className="close-btn" onClick={() => setCitaParaEliminar(null)}>
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>
            <p className="confirm-text">
              Estás por eliminar la cita de <strong>{citaParaEliminar.cliente}</strong> (
              {citaParaEliminar.especialidad} - {citaParaEliminar.fecha}).
            </p>
            {usuario?.rol !== 'admin' && (
              <div className="rbac-warning">
                <i className="fa-solid fa-triangle-exclamation"></i> Tu rol actual es{' '}
                <strong>{usuario?.rol.toUpperCase()}</strong>. Si confirmas, el middleware RBAC del
                backend responderá con código <code>403 Forbidden</code> (demostración T07).
              </div>
            )}
            <div className="modal-actions">
              <button type="button" className="btn-ghost" onClick={() => setCitaParaEliminar(null)}>
                Cancelar
              </button>
              <button type="button" className="btn-danger" onClick={confirmarEliminacion}>
                <i className="fa-solid fa-trash"></i> Eliminar de MongoDB
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

