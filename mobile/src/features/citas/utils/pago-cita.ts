export const METODOS_PAGO_CITA = ['Efectivo', 'Tarjeta', 'Transferencia'] as const;
export type MetodoPagoCita = (typeof METODOS_PAGO_CITA)[number];

export type PagoCita = {
  id?: string;
  estado: string;
  montoCentavos: number;
  moneda: 'USD';
  metodoPago?: MetodoPagoCita;
  referencia?: string | null;
  motivoRechazo?: string | null;
};

export function tieneTarifaCita(cita: {
  servicioId?: string;
  servicioNombre?: string;
  precioCentavos?: number;
  moneda?: string;
}): boolean {
  return typeof cita.servicioId === 'string' && Boolean(cita.servicioId.trim())
    && typeof cita.servicioNombre === 'string' && Boolean(cita.servicioNombre.trim())
    && Number.isSafeInteger(cita.precioCentavos) && (cita.precioCentavos ?? 0) > 0
    && cita.moneda === 'USD';
}

export function puedeReportarPagoCita(pago: PagoCita | null): boolean {
  return pago === null || pago.estado === 'pendiente' || pago.estado === 'rechazado';
}

export function etiquetaEstadoPago(estado?: string | null): string {
  const etiquetas: Record<string, string> = {
    pendiente: 'Pendiente',
    reportado: 'Reportado para revisión',
    en_revision: 'En revisión',
    aprobado: 'Aprobado',
    rechazado: 'Rechazado',
    anulado: 'Anulado',
  };
  return estado ? etiquetas[estado] || estado : 'Sin reporte';
}

export function formatearMontoPagoCita(centavos: number): string {
  if (!Number.isSafeInteger(centavos) || centavos < 0) return 'Importe no disponible';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(centavos / 100);
}

export function crearPayloadReportePago(metodoPago: string, referencia: string) {
  if (!(METODOS_PAGO_CITA as readonly string[]).includes(metodoPago)) {
    throw new Error('Selecciona un método de pago válido.');
  }
  const referenciaLimpia = referencia.trim();
  if (referenciaLimpia.length > 200) throw new Error('La referencia no puede superar 200 caracteres.');
  return referenciaLimpia ? { metodoPago: metodoPago as MetodoPagoCita, referencia: referenciaLimpia } : { metodoPago: metodoPago as MetodoPagoCita };
}

export async function ejecutarUnaVez<T>(bloqueos: Set<string>, clave: string, accion: () => Promise<T>): Promise<boolean> {
  if (bloqueos.has(clave)) return false;
  bloqueos.add(clave);
  try {
    await accion();
    return true;
  } finally {
    bloqueos.delete(clave);
  }
}
