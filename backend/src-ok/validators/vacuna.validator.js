// Validación del registro de Vacunas
//
// Modelo de datos de una vacuna:
// - mascotaId      (string, requerido)  -> referencia a la mascota (colección "mascotas")
// - nombre         (string, requerido)  -> nombre/tipo de vacuna (ej. "Antirrábica")
// - fecha          (string ISO, requerido) -> fecha en que se aplicó la vacuna
// - proximaFecha   (string ISO, opcional) -> fecha del refuerzo/próxima dosis, para alertas
// - veterinario    (string, opcional)
// - lote           (string, opcional)
// - observaciones  (string, opcional)
export const validarVacuna = (datos) => {

    const {
        mascotaId,
        nombre,
        fecha,
        proximaFecha,
        veterinario,
        lote,
        observaciones
    } = datos;

    if (!mascotaId || mascotaId.trim() === "") {
        return "La mascota (mascotaId) es obligatoria.";
    }

    if (!nombre || nombre.trim() === "") {
        return "El nombre de la vacuna es obligatorio.";
    }

    if (!fecha) {
        return "La fecha de aplicación es obligatoria.";
    }

    if (proximaFecha && new Date(proximaFecha) < new Date(fecha)) {
        return "La próxima fecha no puede ser anterior a la fecha de aplicación.";
    }

    return null;

};
