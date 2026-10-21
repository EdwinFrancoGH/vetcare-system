// Cálculo de disponibilidad de citas a partir del horario semanal de
// atención de un veterinario (ver services/horarios.service.js), en
// bloques de duración fija (por defecto 60 minutos) para que nunca
// queden huecos de minutos sueltos entre una cita y otra.

export const DIAS_SEMANA = [
    "domingo",
    "lunes",
    "martes",
    "miercoles",
    "jueves",
    "viernes",
    "sabado",
];

const DURACION_MINIMA_MINUTOS = 60;

function sumarMinutos(horaHHmm, minutos) {

    const [horas, mins] = horaHHmm.split(":").map(Number);
    const totalMinutos = horas * 60 + mins + minutos;

    const horasResultado = Math.floor(totalMinutos / 60).toString().padStart(2, "0");
    const minsResultado = (totalMinutos % 60).toString().padStart(2, "0");

    return `${horasResultado}:${minsResultado}`;

}

// Parsea una fecha "YYYY-MM-DD" como fecha UTC pura, para no arrastrar
// desfases de zona horaria al recorrer días o al pedir el día de la semana.
function parseFechaISO(fechaISO) {
    const [anio, mes, dia] = fechaISO.split("-").map(Number);
    return new Date(Date.UTC(anio, mes - 1, dia));
}

function formatearFechaISO(fecha) {
    return fecha.toISOString().slice(0, 10);
}

export function sumarDiasISO(fechaISO, dias) {
    const fecha = parseFechaISO(fechaISO);
    fecha.setUTCDate(fecha.getUTCDate() + dias);
    return formatearFechaISO(fecha);
}

// Genera las horas de inicio de cada bloque de una franja, ej:
// generarBloques("08:00", "17:00", 60) -> ["08:00", "09:00", ..., "16:00"]
// El último bloque que no alcanza a completar la duración dentro de la
// franja simplemente no se ofrece (así nunca hay citas más cortas).
export function generarBloques(inicio, fin, duracionMinutos) {

    const bloques = [];
    let actual = inicio;

    while (sumarMinutos(actual, duracionMinutos) <= fin) {
        bloques.push(actual);
        actual = sumarMinutos(actual, duracionMinutos);
    }

    return bloques;

}

// ¿La combinación fecha+hora cae dentro del horario de atención del
// veterinario y coincide con el inicio de uno de sus bloques?
export function esHorarioValido({ horario, fecha, hora }) {

    if (!horario) return false;

    const nombreDia = DIAS_SEMANA[parseFechaISO(fecha).getUTCDay()];
    const franja = horario.franjas?.[nombreDia];

    if (!franja || !franja.inicio || !franja.fin) {
        return false;
    }

    const duracion = horario.duracionCitaMinutos || DURACION_MINIMA_MINUTOS;
    const bloques = generarBloques(franja.inicio, franja.fin, duracion);

    return bloques.includes(hora);

}

// Genera todos los horarios disponibles de UN veterinario entre `desde`
// y `hasta` (fechas ISO, ambas inclusive), a partir de su horario
// semanal, descartando los que ya están reservados/confirmados.
export function generarDisponibilidad({ horario, citasExistentes = [], desde, hasta }) {

    const duracion = horario.duracionCitaMinutos || DURACION_MINIMA_MINUTOS;

    const ocupados = new Set(
        citasExistentes
            .filter((cita) => cita.estado === "reservada" || cita.estado === "confirmada")
            .map((cita) => `${cita.fecha}_${cita.hora}`)
    );

    const disponibilidad = [];

    for (
        let fecha = parseFechaISO(desde);
        fecha <= parseFechaISO(hasta);
        fecha.setUTCDate(fecha.getUTCDate() + 1)
    ) {

        const fechaISO = formatearFechaISO(fecha);
        const nombreDia = DIAS_SEMANA[fecha.getUTCDay()];
        const franja = horario.franjas?.[nombreDia];

        if (!franja || !franja.inicio || !franja.fin) {
            continue;
        }

        const bloques = generarBloques(franja.inicio, franja.fin, duracion);

        bloques.forEach((hora) => {

            if (!ocupados.has(`${fechaISO}_${hora}`)) {

                disponibilidad.push({
                    veterinario: horario.veterinario,
                    fecha: fechaISO,
                    hora,
                    duracionMinutos: duracion,
                });

            }

        });

    }

    return disponibilidad;

}
