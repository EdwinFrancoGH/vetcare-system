export type ServicioVeterinario = {
  id: string;
  nombre: string;
  descripcion: string;
  precioCentavos: number;
  moneda: 'USD';
  activo: true;
};

export type DatosReservaCita = {
  veterinario: string;
  fecha: string;
  hora: string;
  mascotaId: string;
  propietario: string;
  telefono: string;
  motivo: string;
  servicioId: string;
};

type RespuestaCatalogo = {
  ok?: boolean;
  data?: unknown;
  message?: string;
};

type Fetcher = (input: string, init?: RequestInit) => Promise<Response>;

export function crearClienteServiciosVeterinarios(request: Fetcher, apiUrl: string) {
  return async (init?: RequestInit): Promise<ServicioVeterinario[]> => {
    const response = await request(`${apiUrl}/api/servicios-veterinarios`, init);
    const payload = await response.json();
    if (!response.ok) {
      throw new Error(payload?.message || 'No se pudo cargar el catálogo de servicios.');
    }
    return normalizarServiciosVeterinarios(payload);
  };
}

export function normalizarServiciosVeterinarios(respuesta: RespuestaCatalogo): ServicioVeterinario[] {
  if (!Array.isArray(respuesta?.data)) {
    throw new Error(respuesta?.message || 'La respuesta del catálogo de servicios no es válida.');
  }

  return respuesta.data.filter((item): item is ServicioVeterinario =>
    Boolean(item)
    && typeof item.id === 'string'
    && item.id.trim().length > 0
    && typeof item.nombre === 'string'
    && item.nombre.trim().length > 0
    && typeof item.descripcion === 'string'
    && Number.isSafeInteger(item.precioCentavos)
    && item.precioCentavos > 0
    && item.moneda === 'USD'
    && item.activo === true,
  );
}

export function formatearPrecioVeterinario(precioCentavos: number): string {
  if (!Number.isSafeInteger(precioCentavos) || precioCentavos <= 0) return 'Tarifa no disponible';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    currencyDisplay: 'code',
  }).format(precioCentavos / 100);
}

export function servicioSeleccionadoActivo(servicioId: string, servicios: ServicioVeterinario[]): boolean {
  return Boolean(servicioId && servicios.some((servicio) => servicio.id === servicioId && servicio.activo));
}

export function crearPayloadReservaCita(datos: DatosReservaCita): DatosReservaCita {
  return {
    veterinario: datos.veterinario,
    fecha: datos.fecha,
    hora: datos.hora,
    mascotaId: datos.mascotaId,
    propietario: datos.propietario,
    telefono: datos.telefono,
    motivo: datos.motivo,
    servicioId: datos.servicioId,
  };
}

export type ErrorReservaCita = Error & { status?: number; code?: string };

export function crearErrorReservaCita(message: string, status?: number, code?: string): ErrorReservaCita {
  return Object.assign(new Error(message), { status, code });
}

export function crearEjecutorReservaUnica() {
  let enCurso = false;
  return async function ejecutar<T>(operacion: () => Promise<T>): Promise<{ ejecutada: boolean; valor?: T }> {
    if (enCurso) return { ejecutada: false };
    enCurso = true;
    try {
      return { ejecutada: true, valor: await operacion() };
    } finally {
      enCurso = false;
    }
  };
}

export function formatearTarifaCita(cita: { precioCentavos?: number; moneda?: string }): string | null {
  const precioCentavos = cita.precioCentavos;
  if (typeof precioCentavos !== 'number' || !Number.isSafeInteger(precioCentavos) || precioCentavos <= 0 || cita.moneda !== 'USD') return null;
  return formatearPrecioVeterinario(precioCentavos);
}
