// El validator revisa los datos del diagnóstico
// antes de enviarlos al service y a Firebase.

export const validarDiagnostico = (diagnostico) => {
    const errores = {};

    if (!diagnostico.consultaId || diagnostico.consultaId.trim() === "") {
        errores.consultaId = "La consulta es obligatoria";
    }

    if (!diagnostico.mascotaId || diagnostico.mascotaId.trim() === "") {
        errores.mascotaId = "La mascota es obligatoria";
    }

    if (!diagnostico.veterinarioId || diagnostico.veterinarioId.trim() === "") {
        errores.veterinarioId = "El veterinario es obligatorio";
    }

    if (!diagnostico.fecha || diagnostico.fecha.trim() === "") {
        errores.fecha = "La fecha es obligatoria";
    }

    if (!diagnostico.descripcion || diagnostico.descripcion.trim() === "") {
        errores.descripcion = "La descripción del diagnóstico es obligatoria";
    }

    return {
        valido: Object.keys(errores).length === 0,
        errores
    };
};