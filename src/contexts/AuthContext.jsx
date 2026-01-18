/**
 * Auth Context
 * Global authentication state
 */

import { createContext, useContext, useState, useEffect } from 'react';
import { getCurrentAdmin, logout as logoutService, isAuthenticated } from '../services/auth';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing auth on mount
    if (isAuthenticated()) {
      setAdmin(getCurrentAdmin());
    }
    setLoading(false);
  }, []);

  const login = (adminData) => {
    setAdmin(adminData);
  };

  const logout = () => {
    logoutService();
    setAdmin(null);
  };

  const value = {
    admin,
    login,
    logout,
    isAuthenticated: !!admin,
    loading,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
