import { API_URL } from '@/config/api';
import { apiFetch } from '@/lib/api-client';
import { rutaDetalleProducto } from '../utils/producto-tienda';
export { clasificarErrorPedidoHttp } from '../utils/pedido-error';

export type ProductoTienda = {
  id: string;
  nombre: string;
  categoria?: string;
  precio: number;
  stock: number;
  descripcion?: string;
  imagenUrl?: string;
  activo?: boolean;
  disponible?: boolean;
};

export const obtenerCatalogoTienda = () =>
  apiFetch(`${API_URL}/api/tienda/productos`);

export const obtenerProductoTienda = (id: string) =>
  apiFetch(`${API_URL}${rutaDetalleProducto(id)}`);

export const crearPedidoTienda = (productos: { productoId: string; cantidad: number }[], tipo: 'retiro' | 'en_linea', idempotencyKey: string) =>
  apiFetch(`${API_URL}/api/tienda/pedidos`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Idempotency-Key': idempotencyKey },
    body: JSON.stringify({ productos, tipo }),
  });
