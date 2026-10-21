// Validación del registro de Historial Clínico (Consulta)
//
// Modelo de datos de una consulta:
// - mascotaId       (string, requerido)  -> referencia a la mascota (colección "mascotas")
// - fecha           (string ISO, requerido) -> fecha en que ocurrió la consulta
// - motivoConsulta  (string, requerido)
// - diagnostico     (string, requerido)
// - tratamiento     (string, opcional)
// - peso            (number, requerido)  -> se usa para la gráfica de evolución de peso
// - veterinario     (string, opcional)
// - proximaCita     (string ISO, opcional) -> fecha sugerida de seguimiento, para alertas
// - observaciones   (string, opcional)
export const validarHistorial = (datos) => {

    const {
        mascotaId,
        fecha,
        motivoConsulta,
        diagnostico,
        tratamiento,
        peso,
        veterinario,
        proximaCita,
        observaciones
    } = datos;

    if (!mascotaId || mascotaId.trim() === "") {
        return "La mascota (mascotaId) es obligatoria.";
    }

    if (!fecha) {
        return "La fecha de la consulta es obligatoria.";
    }

    if (!motivoConsulta || motivoConsulta.trim() === "") {
        return "El motivo de la consulta es obligatorio.";
    }

    if (!diagnostico || diagnostico.trim() === "") {
        return "El diagnóstico es obligatorio.";
    }

    if (peso === undefined || peso === null || peso === "" || peso <= 0) {
        return "El peso debe ser mayor que cero.";
    }

    if (proximaCita && new Date(proximaCita) < new Date(fecha)) {
        return "La próxima cita no puede ser anterior a la fecha de la consulta.";
    }

    return null;

};
