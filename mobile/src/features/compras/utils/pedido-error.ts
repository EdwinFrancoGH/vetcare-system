export type ClasificacionErrorPedido = 'definitivo' | 'autenticacion' | 'ambiguo';

export function clasificarErrorPedidoHttp(status?: number): ClasificacionErrorPedido {
  if (status === 400 || status === 404) return 'definitivo';
  if (status === 401 || status === 403) return 'autenticacion';
  return 'ambiguo';
}
