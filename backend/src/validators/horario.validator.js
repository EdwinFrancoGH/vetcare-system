// Validación del horario semanal de atención de un veterinario.
//
// Modelo de datos (colección "horariosAtencion", un documento por
// veterinario, usando su nombre como ID):
// - veterinario         (string, requerido)
// - franjas             (objeto, requerido) -> una entrada por día:
//     { lunes: { inicio: "08:00", fin: "17:00" } | null, martes: ..., ... }
// - duracionCitaMinutos (number, opcional, default 60, mínimo 60) -> para
//   que cada cita ocupe un bloque completo y no queden huecos de minutos.
const DIAS = ["lunes", "martes", "miercoles", "jueves", "viernes", "sabado", "domingo"];

const REGEX_HORA = /^([01]\d|2[0-3]):[0-5]\d$/;

const DURACION_MINIMA_MINUTOS = 60;

export const validarHorario = (datos) => {

    const { veterinario, franjas, duracionCitaMinutos } = datos;

    if (!veterinario || veterinario.trim() === "") {
        return "El veterinario es obligatorio.";
    }

    if (!franjas || typeof franjas !== "object") {
        return "Debe indicar el horario de atención por día.";
    }

    const algunDiaActivo = DIAS.some((dia) => franjas[dia]);

    if (!algunDiaActivo) {
        return "Debe activar al menos un día de atención.";
    }

    for (const dia of DIAS) {

        const franja = franjas[dia];

        if (!franja) continue;

        if (!REGEX_HORA.test(franja.inicio) || !REGEX_HORA.test(franja.fin)) {
            return `El horario del día "${dia}" debe tener formato HH:mm.`;
        }

        if (franja.inicio >= franja.fin) {
            return `La hora de inicio del día "${dia}" debe ser antes que la hora de fin.`;
        }

    }

    if (
        duracionCitaMinutos !== undefined &&
        duracionCitaMinutos !== null &&
        duracionCitaMinutos !== "" &&
        Number(duracionCitaMinutos) < DURACION_MINIMA_MINUTOS
    ) {
        return `La duración de cada cita debe ser de al menos ${DURACION_MINIMA_MINUTOS} minutos, para no dejar huecos de minutos entre citas.`;
    }

    return null;

};
