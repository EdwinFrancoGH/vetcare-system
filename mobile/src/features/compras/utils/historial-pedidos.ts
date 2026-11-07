export type EstadoPedido = 'pendiente' | 'listo' | 'entregado' | 'cancelado';

export type ProductoPedido = {
  productoId: string;
  nombre: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
};

export type PedidoCliente = {
  id: string;
  fechaPedido: string;
  fechaActualizacion?: string;
  estado: EstadoPedido;
  productos: ProductoPedido[];
  total: number;
  tipo?: 'retiro' | 'en_linea';
  pagado?: boolean;
  metodoPago?: string;
  motivoCancelacion?: string;
};

export class ErrorRespuestaPedidos extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ErrorRespuestaPedidos';
    this.status = status;
  }
}

export function crearServicioPedidosCliente(
  request: (url: string, init?: RequestInit) => Promise<Response>,
  apiUrl: string,
) {
  const rutaPedidos = `${apiUrl}/api/tienda/mis-pedidos`;
  return {
    async listar(): Promise<PedidoCliente[]> {
      return leerRespuestaPedidos(await request(rutaPedidos));
    },
    async cancelar(id: string): Promise<PedidoCliente> {
      const response = await request(`${rutaPedidos}/${encodeURIComponent(id)}/cancelar`, { method: 'PUT' });
      return leerRespuestaPedido(response);
    },
  };
}

export function sesionPerteneceAUsuario(uidEsperado: string, uidActual: string | null | undefined): boolean {
  return Boolean(uidEsperado && uidActual && uidEsperado === uidActual);
}

const etiquetasEstado: Record<EstadoPedido, string> = {
  pendiente: 'Pendiente',
  listo: 'Listo para retirar',
  entregado: 'Entregado',
  cancelado: 'Cancelado',
};

export function etiquetaEstadoPedido(estado: string): string {
  return Object.hasOwn(etiquetasEstado, estado)
    ? etiquetasEstado[estado as EstadoPedido]
    : `Estado: ${estado || 'desconocido'}`;
}

export function categoriaEstadoPedido(estado: string): EstadoPedido | 'desconocido' {
  return Object.hasOwn(etiquetasEstado, estado) ? estado as EstadoPedido : 'desconocido';
}

export function pedidoPuedeCancelarse(pedido: Pick<PedidoCliente, 'estado'>): boolean {
  return pedido.estado === 'pendiente';
}

export function clasificarErrorCancelacion(status?: number): 'estado_cambio' | 'sesion' | 'no_encontrado' | 'error' {
  if (status === 400 || status === 409) return 'estado_cambio';
  if (status === 401 || status === 403) return 'sesion';
  if (status === 404) return 'no_encontrado';
  return 'error';
}

export async function ejecutarCancelacionUnica<T>(
  id: string,
  enCurso: Set<string>,
  operacion: () => Promise<T>,
): Promise<{ ejecutada: boolean; resultado?: T }> {
  if (enCurso.has(id)) return { ejecutada: false };
  enCurso.add(id);
  try {
    return { ejecutada: true, resultado: await operacion() };
  } finally {
    enCurso.delete(id);
  }
}

export function reemplazarPedidoEnHistorial(pedidos: PedidoCliente[], actualizado: PedidoCliente): PedidoCliente[] {
  return pedidos.map((pedido) => pedido.id === actualizado.id ? actualizado : pedido);
}

export function formatearFechaPedido(fecha: string): string {
  const date = new Date(fecha);
  if (Number.isNaN(date.getTime())) return 'Fecha no disponible';
  return new Intl.DateTimeFormat('es-GT', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

export function formatearImportePedido(importe: number): string {
  const numero = Number(importe);
  return `$${(Number.isFinite(numero) ? numero : 0).toFixed(2)}`;
}

export function normalizarListaPedidos(datos: unknown): PedidoCliente[] {
  if (!Array.isArray(datos)) return [];
  return datos.filter((pedido): pedido is PedidoCliente => Boolean(
    pedido && typeof pedido === 'object' && typeof pedido.id === 'string'
      && typeof pedido.estado === 'string' && Array.isArray(pedido.productos),
  ));
}

export async function leerRespuestaPedidos(response: Pick<Response, 'ok' | 'status' | 'json'>): Promise<PedidoCliente[]> {
  const body = await response.json().catch(() => null);
  if (!response.ok) {
    throw new ErrorRespuestaPedidos(body?.message || body?.error || `No se pudieron cargar tus pedidos (${response.status}).`, response.status);
  }
  return normalizarListaPedidos(body?.data);
}

export async function leerRespuestaPedido(response: Pick<Response, 'ok' | 'status' | 'json'>): Promise<PedidoCliente> {
  const body = await response.json().catch(() => null);
  if (!response.ok) {
    throw new ErrorRespuestaPedidos(body?.message || body?.error || `No se pudo cancelar el pedido (${response.status}).`, response.status);
  }
  const pedido = normalizarListaPedidos(body?.data ? [body.data] : [])[0];
  if (!pedido) throw new ErrorRespuestaPedidos('El Backend no devolvió el pedido actualizado.', response.status);
  return pedido;
}
