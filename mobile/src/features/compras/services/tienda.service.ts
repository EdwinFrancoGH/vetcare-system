import { API_URL } from '@/config/api';
import { apiFetch } from '@/lib/api-client';

export type ProductoTienda = {
  id: string;
  nombre: string;
  categoria?: string;
  precio: number;
  stock: number;
  descripcion?: string;
};

export const obtenerCatalogoTienda = () =>
  apiFetch(`${API_URL}/api/tienda/productos`);

export const crearPedidoTienda = (productos: { productoId: string; cantidad: number }[], tipo: 'retiro' | 'en_linea') =>
  apiFetch(`${API_URL}/api/tienda/pedidos`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ productos, tipo }),
  });
