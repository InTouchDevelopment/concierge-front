/**
 * App Component
 * Main router configuration
 */

import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'; // Changed to HashRouter
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import EmailEdit from './pages/EmailEdit';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <HashRouter> {/* Changed to HashRouter */}
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/email/:id"
              element={
                <ProtectedRoute>
                  <EmailEdit />
                </ProtectedRoute>
              }
            />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </HashRouter> {/* Changed to HashRouter */}
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;