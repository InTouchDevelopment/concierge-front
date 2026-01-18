/**
 * Auth Service
 * Authentication helper functions
 */

import api from './api';

export async function login(email, password) {
  const response = await api.post('/api/admin/login', { email, password });
  const { token, admin } = response.data;
  
  localStorage.setItem('token', token);
  localStorage.setItem('admin', JSON.stringify(admin));
  
  return admin;
}

export async function register(email, password, name) {
  const response = await api.post('/api/admin/register', { email, password, name });
  const { token, admin } = response.data;
  
  localStorage.setItem('token', token);
  localStorage.setItem('admin', JSON.stringify(admin));
  
  return admin;
}

export function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('admin');
}

export function getCurrentAdmin() {
  const adminStr = localStorage.getItem('admin');
  return adminStr ? JSON.parse(adminStr) : null;
}

export function getToken() {
  return localStorage.getItem('token');
}

export function isAuthenticated() {
  return !!getToken();
}
