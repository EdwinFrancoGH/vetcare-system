import { API_URL } from '@/config/api';
import { apiFetch } from '@/lib/api-client';

export const obtenerMisPedidos = (init?: RequestInit) =>
  apiFetch(`${API_URL}/api/tienda/mis-pedidos`, init);
