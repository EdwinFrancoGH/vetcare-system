import { API_URL } from '@/config/api';
import { apiFetch } from '@/lib/api-client';
import { crearServicioPedidosCliente, type PedidoCliente } from '../utils/historial-pedidos';

export type { PedidoCliente, EstadoPedido, ProductoPedido } from '../utils/historial-pedidos';

const pedidosCliente = crearServicioPedidosCliente((url, init) => apiFetch(url, init), API_URL);

export const obtenerMisPedidos = (): Promise<PedidoCliente[]> => pedidosCliente.listar();

export const cancelarPedidoPropio = (id: string): Promise<PedidoCliente> => pedidosCliente.cancelar(id);
