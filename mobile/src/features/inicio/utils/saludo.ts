// Saludo según la hora del día (experiencia de usuario en el Home).
//   05:00 - 11:59 -> Buenos días    (sol)
//   12:00 - 18:59 -> Buenas tardes  (sol con nubes)
//   19:00 - 04:59 -> Buenas noches  (luna)

export type MomentoDia = 'manana' | 'tarde' | 'noche';

export type Saludo = {
  momento: MomentoDia;
  texto: string;
  icono: 'sunny' | 'partly-sunny' | 'moon';
  color: string;
};

const SALUDOS: Record<MomentoDia, Omit<Saludo, 'momento'>> = {
  manana: { texto: 'Buenos días', icono: 'sunny', color: '#FACC15' },
  tarde: { texto: 'Buenas tardes', icono: 'partly-sunny', color: '#FDBA74' },
  noche: { texto: 'Buenas noches', icono: 'moon', color: '#C4B5FD' },
};

export function obtenerMomentoDia(fecha: Date = new Date()): MomentoDia {
  const hora = fecha.getHours();
  if (hora >= 5 && hora < 12) return 'manana';
  if (hora >= 12 && hora < 19) return 'tarde';
  return 'noche';
}

export function obtenerSaludo(fecha: Date = new Date()): Saludo {
  const momento = obtenerMomentoDia(fecha);
  return { momento, ...SALUDOS[momento] };
}
