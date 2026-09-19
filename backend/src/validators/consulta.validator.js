// El validator revisa los datos de la consulta
// antes de enviarlos al service y a Firebase.

export const validarConsulta = (consulta) => {
    const errores = {};

    if (!consulta.citaId || consulta.citaId.trim() === "") {
        errores.citaId = "La cita es obligatoria";
    }

    if (!consulta.mascotaId || consulta.mascotaId.trim() === "") {
        errores.mascotaId = "La mascota es obligatoria";
    }

    if (!consulta.veterinarioId || consulta.veterinarioId.trim() === "") {
        errores.veterinarioId = "El veterinario es obligatorio";
    }

    if (!consulta.fecha || consulta.fecha.trim() === "") {
        errores.fecha = "La fecha es obligatoria";
    }

    if (!consulta.motivo || consulta.motivo.trim() === "") {
        errores.motivo = "El motivo de la consulta es obligatorio";
    }

    if (!consulta.sintomas || consulta.sintomas.trim() === "") {
        errores.sintomas = "Los síntomas son obligatorios";
    }

    if (consulta.estado) {
        const estadosPermitidos = [
            "PENDIENTE",
            "EN_ATENCION",
            "FINALIZADA",
            "CANCELADA"
        ];

        if (!estadosPermitidos.includes(consulta.estado)) {
            errores.estado = "El estado de la consulta no es válido";
        }
    }

    return {
        valido: Object.keys(errores).length === 0,
        errores
    };
};