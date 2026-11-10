import React, { useEffect, useMemo } from 'react';
import { useGlobalState } from '../context/GlobalStateContext';
import { RolUsuario } from '../types/medisys.types';

export const SecurityAuditPage: React.FC = () => {
  const {
    usuario,
    token,
    usuariosRegistrados,
    cargarUsuarios,
    actualizarRolUsuario,
    simularTokenExpirado
  } = useGlobalState();

  useEffect(() => {
    cargarUsuarios();
  }, [cargarUsuarios]);

  const jwtDecodificado = useMemo(() => {
    if (!token) return null;
    try {
      const payloadPart = token.split('.')[1];
      if (!payloadPart) return null;
      const json = atob(payloadPart.replace(/-/g, '+').replace(/_/g, '/'));
      return JSON.parse(json) as {
        id: string;
        nombre: string;
        email: string;
        rol: string;
        iat?: number;
        exp?: number;
      };
    } catch {
      return null;
    }
  }, [token]);

  return (
    <div className="panel-container">
      <div className="page-top-bar">
        <div>
          <h1>Seguridad JWT, Control de Roles (RBAC) y Sesión (T07, T11)</h1>
          <p>
            Inspección en vivo del token JWT, simulación de expiración de sesión y gestión de usuarios
            persistentes en MongoDB.
          </p>
        </div>
        <button
          type="button"
          className="btn-danger"
          onClick={simularTokenExpirado}
          title="Reemplaza el token por uno expirado y realiza una petición a la API para demostrar el cierre automático de sesión (T11)"
        >
          <i className="fa-solid fa-stopwatch"></i>
          <span>Probar Expiración de Token (T11)</span>
        </button>
      </div>

      <div className="exec-two-cols">
        {/* Inspector de Sesión JWT */}
        <section className="panel-box">
          <div className="box-head">
            <div>
              <h2>Inspección de Token JWT Activo</h2>
              <p>Payload decodificado de la sesión actual almacenada en el cliente</p>
            </div>
          </div>

          {jwtDecodificado && (
            <div className="jwt-details">
              <div className="jwt-item">
                <span>Usuario Autenticado:</span>
                <strong>{jwtDecodificado.nombre}</strong>
              </div>
              <div className="jwt-item">
                <span>Correo Electrónico:</span>
                <strong>{jwtDecodificado.email}</strong>
              </div>
              <div className="jwt-item">
                <span>Rol Autorizado (RBAC):</span>
                <span className={`role-tag role-${jwtDecodificado.rol}`}>
                  {jwtDecodificado.rol.toUpperCase()}
                </span>
              </div>
              <div className="jwt-item">
                <span>Emitido (iat):</span>
                <code>
                  {jwtDecodificado.iat
                    ? new Date(jwtDecodificado.iat * 1000).toLocaleString()
                    : 'N/A'}
                </code>
              </div>
              <div className="jwt-item">
                <span>Expiración (exp):</span>
                <code>
                  {jwtDecodificado.exp
                    ? new Date(jwtDecodificado.exp * 1000).toLocaleString()
                    : 'N/A'}
                </code>
              </div>
              <div className="jwt-raw">
                <small>Firma Bearer JWT truncada:</small>
                <code>{token ? `${token.slice(0, 64)}...` : ''}</code>
              </div>
            </div>
          )}
        </section>

        {/* Matriz de Permisos por Rol (T07) */}
        <section className="panel-box">
          <div className="box-head">
            <div>
              <h2>Matriz de Autorización por Roles (RBAC)</h2>
              <p>Validada en el Backend Express mediante el middleware autorizarRoles</p>
            </div>
          </div>

          <table className="react-table compact">
            <thead>
              <tr>
                <th>Operación / Endpoint</th>
                <th>Recepción</th>
                <th>Médico</th>
                <th>Admin</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Consultar Citas y Estadísticas (GET)</td>
                <td>✅ Sí</td>
                <td>✅ Sí</td>
                <td>✅ Sí</td>
              </tr>
              <tr>
                <td>Registrar y Actualizar Citas (POST / PUT)</td>
                <td>✅ Sí</td>
                <td>✅ Sí</td>
                <td>✅ Sí</td>
              </tr>
              <tr>
                <td>Eliminar Citas de MongoDB (DELETE)</td>
                <td>❌ 403</td>
                <td>❌ 403</td>
                <td>✅ Sí</td>
              </tr>
              <tr>
                <td>Restaurar Base de Datos Seed (POST /seed)</td>
                <td>❌ 403</td>
                <td>❌ 403</td>
                <td>✅ Sí</td>
              </tr>
              <tr>
                <td>Modificar Roles de Usuarios (PATCH)</td>
                <td>❌ 403</td>
                <td>❌ 403</td>
                <td>✅ Sí</td>
              </tr>
            </tbody>
          </table>
        </section>
      </div>

      {/* Directorio de Usuarios Registrados en MongoDB */}
      <section className="panel-box" style={{ marginTop: '1.5rem' }}>
        <div className="box-head">
          <div>
            <h2>Usuarios Registrados en MongoDB ({usuariosRegistrados.length})</h2>
            <p>
              Contraseñas protegidas con hash <code>bcryptjs</code> (factor de costo 10).{' '}
              {usuario?.rol === 'admin'
                ? 'Como ADMIN puedes cambiar el rol de cualquier usuario en vivo.'
                : 'Inicia sesión como ADMIN para modificar roles.'}
            </p>
          </div>
        </div>

        <table className="react-table">
          <thead>
            <tr>
              <th>Nombre Completo</th>
              <th>Correo Electrónico</th>
              <th>Especialidad / Área</th>
              <th>Rol Asignado</th>
              <th>Último Acceso</th>
            </tr>
          </thead>
          <tbody>
            {usuariosRegistrados.map((u) => (
              <tr key={u._id}>
                <td>
                  <strong>{u.nombre}</strong>
                </td>
                <td>{u.email}</td>
                <td>{u.especialidad || 'General'}</td>
                <td>
                  <select
                    className="state-select"
                    value={u.rol}
                    disabled={usuario?.rol !== 'admin'}
                    onChange={(e) => actualizarRolUsuario(u._id, e.target.value as RolUsuario)}
                  >
                    <option value="admin">ADMIN</option>
                    <option value="medico">MEDICO</option>
                    <option value="recepcionista">RECEPCIONISTA</option>
                  </select>
                </td>
                <td>
                  <small>
                    {u.ultimoAcceso ? new Date(u.ultimoAcceso).toLocaleString() : 'Reciente'}
                  </small>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
};

