export type PagoPendienteRevision = {
  id: string;
  citaId: string;
  cliente?: { uid?: string; nombre?: string; email?: string };
  servicio?: { id?: string | null; nombre?: string };
  montoCentavos: number;
  moneda: string;
  metodoPago?: string;
  referencia?: string | null;
  reportadoAt?: string;
  estado: string;
};

export type EventoPagoRevision = {
  id?: string;
  tipo?: string;
  intento?: number;
  estadoAnterior?: string;
  estado?: string;
  metodoPago?: string;
  referencia?: string;
  montoCentavos?: number;
  moneda?: string;
  actorUid?: string;
  actorRol?: string;
  motivoRechazo?: string;
  createdAt?: string;
};

export type DetallePagoRevision = PagoPendienteRevision & {
  clienteUid?: string;
  servicioId?: string;
  servicioNombre?: string;
  verificadoAt?: string;
  verificadorUid?: string;
  verificadorRol?: string;
  motivoRechazo?: string;
  numeroIntentos?: number;
  createdAt?: string;
  updatedAt?: string;
  historial?: EventoPagoRevision[];
};

type Requester = (input: string, init?: RequestInit) => Promise<Response>;

export function crearServicioPagosCitas(request: Requester, apiUrl: string) {
  async function solicitar<T>(ruta: string, init?: RequestInit): Promise<T> {
    const response = await request(`${apiUrl}${ruta}`, {
      ...init,
      headers: { 'Content-Type': 'application/json', ...init?.headers },
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) {
      const error = new Error(body.message || body.mensaje || 'No se pudo completar la solicitud.') as Error & { status?: number };
      error.status = response.status;
      throw error;
    }
    return body as T;
  }

  return {
    async obtenerPendientes(): Promise<PagoPendienteRevision[]> {
      const response = await solicitar<{ data?: PagoPendienteRevision[] }>('/api/pagos/pendientes');
      return Array.isArray(response.data) ? response.data : [];
    },
    async consultarDetalle(citaId: string): Promise<DetallePagoRevision | null> {
      const response = await solicitar<{ data?: DetallePagoRevision }>(`/api/citas/${encodeURIComponent(citaId)}/pago`);
      return response.data || null;
    },
    async aprobar(citaId: string): Promise<void> {
      await solicitar(`/api/pagos/${encodeURIComponent(citaId)}/aprobar`, { method: 'PATCH', body: '{}' });
    },
    async rechazar(citaId: string, motivoRechazo: string): Promise<void> {
      await solicitar(`/api/pagos/${encodeURIComponent(citaId)}/rechazar`, {
        method: 'PATCH',
        body: JSON.stringify({ motivoRechazo }),
      });
    },
  };
}
