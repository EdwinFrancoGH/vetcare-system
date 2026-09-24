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

    if (!veterinario || veterinario.trim() === "") {
        return "El veterinario es obligatorio.";
    }

    if (!fecha) {
        return "La fecha de la cita es obligatoria.";
    }

    if (!hora || hora.trim() === "") {
        return "La hora de la cita es obligatoria.";
    }

    if (!mascotaId || mascotaId.trim() === "") {
        return "La mascota (mascotaId) es obligatoria.";
    }

    if (!propietario || propietario.trim() === "") {
        return "El nombre del propietario es obligatorio.";
    }

    if (!telefono || telefono.trim() === "") {
        return "El teléfono de contacto es obligatorio.";
    }

    if (!motivo || motivo.trim() === "") {
        return "El motivo de la cita es obligatorio.";
    }

    return null;

};
