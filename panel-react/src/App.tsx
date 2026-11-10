import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { GlobalStateProvider, useGlobalState } from './context/GlobalStateContext';
import { NavbarReact } from './components/NavbarReact';
import { ProtectedRoute } from './components/ProtectedRoute';
import { LoginPage } from './pages/LoginPage';
import { ExecutivePanelPage } from './pages/ExecutivePanelPage';
import { CitasManagerPage } from './pages/CitasManagerPage';
import { SecurityAuditPage } from './pages/SecurityAuditPage';

const ToastContainer: React.FC = () => {
  const { toasts, cerrarToast } = useGlobalState();

  return (
    <div className="react-toast-stack">
      {toasts.map((t) => (
        <div key={t.id} className={`react-toast toast-${t.tipo}`}>
          <div className="toast-content">
            <strong>{t.titulo}</strong>
            <p>{t.mensaje}</p>
          </div>
          <button type="button" onClick={() => cerrarToast(t.id)}>
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>
      ))}
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <GlobalStateProvider>
      <BrowserRouter>
        <div className="react-app-shell">
          <NavbarReact />
          <ToastContainer />
          <main className="react-main-area">
            <Routes>
              <Route path="/" element={<Navigate to="/panel" replace />} />
              <Route path="/login" element={<LoginPage />} />
              <Route
                path="/panel"
                element={
                  <ProtectedRoute>
                    <ExecutivePanelPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/citas"
                element={
                  <ProtectedRoute>
                    <CitasManagerPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/seguridad"
                element={
                  <ProtectedRoute>
                    <SecurityAuditPage />
                  </ProtectedRoute>
                }
              />
              <Route path="*" element={<Navigate to="/panel" replace />} />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </GlobalStateProvider>
  );
};

export default App;

