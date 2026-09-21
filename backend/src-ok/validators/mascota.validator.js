/*export const validarMascota = (datos) => {

    const { nombre, especie, raza, edad } = datos;

    if (!nombre || nombre.trim() === "") {
        return "El nombre es obligatorio.";
    }

    if (!especie || especie.trim() === "") {
        return "La especie es obligatoria.";
    }

    if (!raza || raza.trim() === "") {
        return "La raza es obligatoria.";
    }

    if (edad === undefined || edad < 0) {
        return "La edad debe ser mayor o igual a cero.";
    }

    return null;
};*/
export const validarMascota = (datos) => {

    const {
        nombre,
        especie,
        raza,
        sexo,
        edad,
        peso,
        color,
        fechaNacimiento,
        propietario,
        telefono,
        direccion,
        estado
    } = datos;

    if (!nombre || nombre.trim() === "") {
        return "El nombre es obligatorio.";
    }

    if (!especie || especie.trim() === "") {
        return "La especie es obligatoria.";
    }

    if (!raza || raza.trim() === "") {
        return "La raza es obligatoria.";
    }

    if (!sexo || sexo.trim() === "") {
        return "El sexo es obligatorio.";
    }

    if (edad === undefined || edad < 0) {
        return "La edad debe ser mayor o igual a cero.";
    }

    if (peso === undefined || peso <= 0) {
        return "El peso debe ser mayor que cero.";
    }

    if (!color || color.trim() === "") {
        return "El color es obligatorio.";
    }

    if (!fechaNacimiento) {
        return "La fecha de nacimiento es obligatoria.";
    }

    if (!propietario || propietario.trim() === "") {
        return "El propietario es obligatorio.";
    }

    if (!telefono || telefono.trim() === "") {
        return "El teléfono es obligatorio.";
    }

    if (!direccion || direccion.trim() === "") {
        return "La dirección es obligatoria.";
    }

    if (!estado || estado.trim() === "") {
        return "El estado es obligatorio.";
    }

    return null;
}