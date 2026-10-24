import { API_URL } from '@/config/api';
import { apiFetch } from '@/lib/api-client';

export const listarCitasDeMascota = (mascotaId: string, init?: RequestInit) =>
  apiFetch(`${API_URL}/api/citas/mascota/${encodeURIComponent(mascotaId)}`, init);

export const listarHorariosDisponibles = (init?: RequestInit) =>
  apiFetch(`${API_URL}/api/citas/disponibles`, init);

export const reservarCita = (init: RequestInit) =>
  apiFetch(`${API_URL}/api/citas/reservar`, init);

export const obtenerCita = (citaId: string, init?: RequestInit) =>
  apiFetch(`${API_URL}/api/citas/${encodeURIComponent(citaId)}`, init);

export const solicitarCancelacionCita = (citaId: string, init: RequestInit) =>
  apiFetch(`${API_URL}/api/citas/${encodeURIComponent(citaId)}/cancelar`, init);
