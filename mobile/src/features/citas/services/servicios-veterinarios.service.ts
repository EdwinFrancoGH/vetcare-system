import { API_URL } from '@/config/api';
import { apiFetch } from '@/lib/api-client';
import { crearClienteServiciosVeterinarios } from '../utils/servicios-veterinarios';

export const listarServiciosVeterinarios = crearClienteServiciosVeterinarios(apiFetch, API_URL);
