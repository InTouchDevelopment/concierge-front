/**
 * Submissions API Service
 * Functions for interacting with submissions endpoints
 */

import api from './api';

export async function getSubmissions({ status, challengeType, search, page = 1, limit = 10 }) {
  const params = new URLSearchParams();
  
  if (status && status !== 'all') params.append('status', status);
  if (challengeType && challengeType !== 'all') params.append('challengeType', challengeType);
  if (search) params.append('search', search);
  params.append('page', page);
  params.append('limit', limit);
  
  const response = await api.get(`/api/admin/submissions?${params}`);
  return response.data;
}

export async function getSubmission(id) {
  const response = await api.get(`/api/admin/submissions/${id}`);
  return response.data;
}

export async function updateSubmission(id, data) {
  const response = await api.patch(`/api/admin/submissions/${id}`, data);
  return response.data;
}

export async function approveSubmission(id) {
  const response = await api.post(`/api/admin/submissions/${id}/approve`);
  return response.data;
}

export async function rejectSubmission(id) {
  const response = await api.post(`/api/admin/submissions/${id}/reject`);
  return response.data;
}

export async function getStats() {
  const response = await api.get('/api/admin/submissions/stats');
  return response.data;
}
