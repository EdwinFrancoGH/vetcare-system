import { API_URL } from '@/config/api';
import { apiFetch } from '@/lib/api-client';

export const listarMascotas = (init?: RequestInit) =>
  apiFetch(`${API_URL}/api/mascotas`, init);

export const obtenerMascota = (id: string, init?: RequestInit) =>
  apiFetch(`${API_URL}/api/mascotas/${encodeURIComponent(id)}`, init);

export const crearMascota = (init: RequestInit) =>
  apiFetch(`${API_URL}/api/mascotas`, init);

export const obtenerHistorialMascota = (id: string, init?: RequestInit) =>
  apiFetch(`${API_URL}/api/historiales/mascota/${encodeURIComponent(id)}`, init);

export const obtenerVacunasMascota = (id: string, init?: RequestInit) =>
  apiFetch(`${API_URL}/api/vacunas/mascota/${encodeURIComponent(id)}`, init);
