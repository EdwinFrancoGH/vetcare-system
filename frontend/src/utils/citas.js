// Utilidades del módulo de Citas: agrupar horarios disponibles por
// fecha, navegación por semana y estilos/badges de estado reutilizables
// entre la vista Cliente y la vista Médico.

export const DIAS = ["lunes", "martes", "miercoles", "jueves", "viernes", "sabado", "domingo"];

export const ETIQUETA_DIA = {
    lunes: "Lunes",
    martes: "Martes",
    miercoles: "Miércoles",
    jueves: "Jueves",
    viernes: "Viernes",
    sabado: "Sábado",
    domingo: "Domingo",
};

// Índice de getDay()/getUTCDay() (0 = domingo) por nombre de día
const INDICE_DIA_JS = {
    domingo: 0,
    lunes: 1,
    martes: 2,
    miercoles: 3,
    jueves: 4,
    viernes: 5,
    sabado: 6,
};

function parseFechaISO(fechaISO) {
    const [anio, mes, dia] = fechaISO.split("-").map(Number);
    return new Date(Date.UTC(anio, mes - 1, dia));
}

function formatearISO(fecha) {
    return fecha.toISOString().slice(0, 10);
}

// OJO: igual que en el backend (ver citas.controller.js), "hoy" se calcula
// explícitamente en la hora de El Salvador y no con toISOString() (UTC),
// para que no se adelante un día entre las 6:00 p.m. y la medianoche.
export function hoyISO() {
    return new Intl.DateTimeFormat("en-CA", { timeZone: "America/El_Salvador" }).format(new Date());
}

export function sumarDiasISO(fechaISO, dias) {
    const fecha = parseFechaISO(fechaISO);
    fecha.setUTCDate(fecha.getUTCDate() + dias);
    return formatearISO(fecha);
}

// Devuelve el lunes de la semana que contiene `fechaISO` (o de hoy si se omite)
export function inicioDeSemana(fechaISO = hoyISO()) {
    const fecha = parseFechaISO(fechaISO);
    const diaSemana = fecha.getUTCDay(); // 0=domingo..6=sabado
    const offsetHastaLunes = diaSemana === 0 ? -6 : 1 - diaSemana;
    fecha.setUTCDate(fecha.getUTCDate() + offsetHastaLunes);
    return formatearISO(fecha);
}

// Agrupa una lista de citas por fecha, ya ordenadas por hora dentro de
// cada día. Devuelve un array de { fecha, citas } ordenado por fecha.
export function agruparCitasPorFecha(citas = []) {

    const porFecha = new Map();

    [...citas]
        .sort((a, b) => `${a.fecha} ${a.hora}`.localeCompare(`${b.fecha} ${b.hora}`))
        .forEach((cita) => {

            if (!porFecha.has(cita.fecha)) {
                porFecha.set(cita.fecha, []);
            }

            porFecha.get(cita.fecha).push(cita);

        });

    return Array.from(porFecha.entries())
        .sort(([fechaA], [fechaB]) => fechaA.localeCompare(fechaB))
        .map(([fecha, citasDelDia]) => ({ fecha, citas: citasDelDia }));

}

// Formatea "YYYY-MM-DD" a algo legible en español, ej: "lun. 22 sep. 2026"
export function formatearFechaLarga(fechaISO) {

    if (!fechaISO) return "—";

    const fecha = parseFechaISO(fechaISO);

    if (Number.isNaN(fecha.getTime())) return fechaISO;

    return fecha.toLocaleDateString("es-ES", {
        weekday: "short",
        day: "2-digit",
        month: "short",
        year: "numeric",
        timeZone: "UTC",
    });

}

export const ETIQUETA_ESTADO_CITA = {
    reservada: "Reservada",
    confirmada: "Confirmada",
    cancelada: "Cancelada",
    completada: "Completada",
    perdida: "Perdida",
};

export const COLOR_ESTADO_CITA = {
    reservada: "bg-yellow-100 text-yellow-800",
    confirmada: "bg-green-100 text-green-800",
    cancelada: "bg-red-100 text-red-800",
    completada: "bg-gray-200 text-gray-700",
    perdida: "bg-orange-100 text-orange-800",
};

// Filtros del historial de citas (ver components/citas/HistorialCitas.jsx)
export const FILTROS_HISTORIAL_CITAS = [
    { valor: "", etiqueta: "Todas" },
    { valor: "perdida", etiqueta: "Perdidas" },
    { valor: "confirmada", etiqueta: "Confirmadas" },
    { valor: "completada", etiqueta: "Completadas" },
    { valor: "cancelada", etiqueta: "Canceladas" },
];
