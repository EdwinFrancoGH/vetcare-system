export type CitaListaMobile = {
  estado?: string;
  fecha?: string;
};

const ESTADOS_ACTIVOS = new Set(['reservada', 'confirmada']);
const ESTADOS_TERMINALES = new Set(['cancelada', 'completada']);

export function esRolClienteMobile(rol: unknown): boolean {
  return rol === 'Cliente';
}

export function clasificarCitaMobile(cita: CitaListaMobile, hoy: string) {
  const estado = String(cita.estado || '').toLowerCase();
  const fecha = String(cita.fecha || '').slice(0, 10);
  const vencida = Boolean(fecha) && fecha < hoy;
  const estadoVisible = vencida && estado === 'reservada' ? 'perdida' : estado;
  const activa = ESTADOS_ACTIVOS.has(estado) && !vencida;

  return {
    estadoVisible,
    activa,
    historial: ESTADOS_TERMINALES.has(estado) || (ESTADOS_ACTIVOS.has(estado) && vencida),
  };
}
