import { API_URL } from '@/config/api';
import { apiFetch } from '@/lib/api-client';

export const listarCitasDeMascota = (mascotaId: string, init?: RequestInit) =>
  apiFetch(`${API_URL}/api/citas/mascota/${encodeURIComponent(mascotaId)}`, init);

export const listarHorariosDisponibles = (
  params: { veterinario?: string; desde?: string; hasta?: string } = {},
  init?: RequestInit,
) => {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value) query.set(key, value);
  });
  const suffix = query.size ? `?${query.toString()}` : '';
  return apiFetch(`${API_URL}/api/citas/disponibles${suffix}`, init);
};

export const reservarCita = (init: RequestInit) =>
  apiFetch(`${API_URL}/api/citas/reservar`, init);

export const obtenerCita = (citaId: string, init?: RequestInit) =>
  apiFetch(`${API_URL}/api/citas/${encodeURIComponent(citaId)}`, init);

export const solicitarCancelacionCita = (citaId: string, init: RequestInit) =>
  apiFetch(`${API_URL}/api/citas/${encodeURIComponent(citaId)}/cancelar`, init);
