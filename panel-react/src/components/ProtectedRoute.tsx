import React from 'react';
import { Navigate } from 'react-router-dom';
import { useGlobalState } from '../context/GlobalStateContext';
import { RolUsuario } from '../types/medisys.types';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: RolUsuario[];
}

/**
 * Componente de Ruta Protegida en React Router DOM (T09, T11)
 * Verifica que exista una sesión JWT activa y, opcionalmente, valida el rol del usuario
 */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { isAuthenticated, usuario } = useGlobalState();

  if (!isAuthenticated || !usuario) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(usuario.rol)) {
    return <Navigate to="/panel" replace />;
  }

  return <>{children}</>;
};

