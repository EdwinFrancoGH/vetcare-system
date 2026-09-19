//no guarda citas. Su función es revisar los datos antes de que lleguen a Firebase.
export const validarCita = (cita) => {
    const errores = {};

    if (!cita.mascotaId || cita.mascotaId.trim() === "") {
        errores.mascotaId = "La mascota es obligatoria";
    }

    if (!cita.veterinarioId || cita.veterinarioId.trim() === "") {
        errores.veterinarioId = "El veterinario es obligatorio";
    }

    if (!cita.fecha || cita.fecha.trim() === "") {
        errores.fecha = "La fecha es obligatoria";
    }

    if (!cita.hora || cita.hora.trim() === "") {
        errores.hora = "La hora es obligatoria";
    }

    if (!cita.motivo || cita.motivo.trim() === "") {
        errores.motivo = "El motivo de la cita es obligatorio";
    }

    if (cita.estado) {
        const estadosPermitidos = [
            "PENDIENTE",
            "CONFIRMADA",
            "CANCELADA",
            "ATENDIDA"
        ];

        if (!estadosPermitidos.includes(cita.estado)) {
            errores.estado = "El estado de la cita no es válido";
        }
    }

    return {
        valido: Object.keys(errores).length === 0,
        errores
    };
};