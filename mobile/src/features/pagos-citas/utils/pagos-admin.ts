export const ROLES_REVISORES_PAGOS = ['Administrador', 'Recepcionista'] as const;
export const ESTADOS_PAGO_REVISABLES = ['reportado', 'en_revision'] as const;

export function esRolRevisorPagos(rol: unknown): boolean {
  return ROLES_REVISORES_PAGOS.includes(rol as (typeof ROLES_REVISORES_PAGOS)[number]);
}

export function puedeDecidirPago(pago: { estado?: string } | null | undefined): boolean {
  return Boolean(pago && ESTADOS_PAGO_REVISABLES.includes(pago.estado as (typeof ESTADOS_PAGO_REVISABLES)[number]));
}

export function crearPayloadRechazoPago(motivo: string): { motivoRechazo: string } {
  const motivoRechazo = typeof motivo === 'string' ? motivo.trim() : '';
  if (motivoRechazo.length < 3 || motivoRechazo.length > 500) {
    throw new Error('El motivo debe tener entre 3 y 500 caracteres.');
  }
  return { motivoRechazo };
}

export function formatearImportePago(montoCentavos: number, moneda: string): string {
  if (!Number.isSafeInteger(montoCentavos) || montoCentavos < 0 || moneda !== 'USD') return 'Importe no disponible';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(montoCentavos / 100);
}

export function etiquetaEstadoPago(estado?: string): string {
  const etiquetas: Record<string, string> = {
    pendiente: 'Pendiente', reportado: 'Reportado', en_revision: 'En revisión',
    aprobado: 'Aprobado', rechazado: 'Rechazado', anulado: 'Anulado',
  };
  return estado ? etiquetas[estado] || estado : 'Estado no disponible';
}

export function etiquetaEventoPago(tipo?: string): string {
  if (tipo === 'reporte') return 'Reporte del cliente';
  if (tipo === 'aprobacion') return 'Pago aprobado';
  if (tipo === 'rechazo') return 'Pago rechazado';
  return tipo || 'Evento de pago';
}

export function formatearFechaPago(fecha?: string): string {
  if (!fecha) return 'Fecha no disponible';
  const date = new Date(fecha);
  if (Number.isNaN(date.getTime())) return fecha;
  return new Intl.DateTimeFormat('es-GT', { dateStyle: 'medium', timeStyle: 'short' }).format(date);
}

export function mensajeErrorPago(error: unknown): string {
  const status = (error as { status?: number })?.status;
  if (status === 401) return 'Tu sesión expiró. Inicia sesión nuevamente.';
  if (status === 403) return 'Tu cuenta no tiene permiso para revisar pagos.';
  if (status === 409) return 'El pago cambió mientras lo revisabas. Se actualizará la información.';
  return (error as Error)?.message || 'No se pudo completar la operación. Inténtalo nuevamente.';
}

export async function ejecutarUnaVez<T>(bloqueos: Set<string>, clave: string, accion: () => Promise<T>): Promise<boolean> {
  if (bloqueos.has(clave)) return false;
  bloqueos.add(clave);
  try { await accion(); return true; } finally { bloqueos.delete(clave); }
}

export async function ejecutarDecisionPago({
  pago, decision, motivo, bloqueos, servicio, actualizar,
}: {
  pago: { citaId: string; estado?: string };
  decision: 'aprobar' | 'rechazar';
  motivo?: string;
  bloqueos: Set<string>;
  servicio: { aprobar: (citaId: string) => Promise<unknown>; rechazar: (citaId: string, motivo: string) => Promise<unknown> };
  actualizar: () => Promise<unknown>;
}): Promise<boolean> {
  if (!puedeDecidirPago(pago)) return false;
  return ejecutarUnaVez(bloqueos, pago.citaId, async () => {
    try {
      if (decision === 'aprobar') await servicio.aprobar(pago.citaId);
      else await servicio.rechazar(pago.citaId, crearPayloadRechazoPago(motivo || '').motivoRechazo);
    } catch (error) {
      await actualizar();
      throw error;
    }
    await actualizar();
  });
}
