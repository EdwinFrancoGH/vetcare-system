// Validación del módulo de Citas.
//
// Modelo de datos de una cita (colección "citas"): son siempre citas
// reales ya agendadas — la disponibilidad en sí no se guarda como
// documento, se calcula al vuelo a partir del horario semanal del
// veterinario (ver utils/disponibilidad.js y horarios.service.js).
//
// - veterinario       (string, requerido)
// - fecha             (string ISO "YYYY-MM-DD", requerido)
// - hora              (string "HH:mm", requerido)          -> debe coincidir
//                        con uno de los bloques del horario del veterinario
// - duracionMinutos   (number, opcional, la fija el horario del veterinario)
// - mascotaId         (string, requerido)
// - propietario       (string, requerido)
// - telefono          (string, requerido)
// - motivo            (string, requerido)
// - estado            ("reservada" | "confirmada" | "cancelada" | "completada")
export const validarCita = (datos) => {

    const {
        veterinario,
        fecha,
        hora,
        mascotaId,
        propietario,
        telefono,
        motivo
    } = datos;

    if (typeof veterinario !== "string" || veterinario.trim() === "") {
        return "El veterinario es obligatorio.";
    }

    if (typeof fecha !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
        return "La fecha debe tener formato YYYY-MM-DD.";
    }
    const [anio, mes, dia] = fecha.split("-").map(Number);
    const fechaValida = new Date(Date.UTC(anio, mes - 1, dia));
    if (fechaValida.toISOString().slice(0, 10) !== fecha) return "La fecha de la cita no es válida.";

    if (typeof hora !== "string" || !/^([01]\d|2[0-3]):[0-5]\d$/.test(hora)) {
        return "La hora debe tener formato HH:mm.";
    }

    if (typeof mascotaId !== "string" || mascotaId.trim() === "") {
        return "La mascota (mascotaId) es obligatoria.";
    }

    if (typeof propietario !== "string" || propietario.trim() === "") {
        return "El nombre del propietario es obligatorio.";
    }

    if (typeof telefono !== "string" || telefono.trim() === "") {
        return "El teléfono de contacto es obligatorio.";
    }

    const TELEFONO_REGEX = /^(\+?503[\s-]?)?[2-7]\d{3}[\s-]?\d{4}$/;
    if (!TELEFONO_REGEX.test(telefono.trim())) {
        return "El teléfono debe tener 8 dígitos (ej. 7123-4567).";
    }

    if (typeof motivo !== "string" || motivo.trim() === "") {
        return "El motivo de la cita es obligatorio.";
    }

    return null;

};
