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
        estado,
        fotoURL,
    } = datos;

    if (fotoURL) {
        if (typeof fotoURL !== "string" || fotoURL.length > 700_000) {
            return "La foto de la mascota es demasiado grande.";
        }
        if (!/^data:image\/(jpeg|png|webp);base64,/i.test(fotoURL)) {
            return "El formato de la foto de la mascota no es válido.";
        }
    }

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

    const fechaNac = new Date(fechaNacimiento);
    if (isNaN(fechaNac.getTime())) {
        return "La fecha de nacimiento no es válida.";
    }

    const hoyElSalvador = new Intl.DateTimeFormat("en-CA", { timeZone: "America/El_Salvador" }).format(new Date());
    const fechaNacString = typeof fechaNacimiento === "string" 
        ? fechaNacimiento.split("T")[0].trim() 
        : fechaNac.toISOString().split("T")[0];

    if (fechaNacString > hoyElSalvador) {
        return "La fecha de nacimiento no puede ser futura.";
    }

    if (!propietario || propietario.trim() === "") {
        return "El propietario es obligatorio.";
    }

    if (!telefono || telefono.trim() === "") {
        return "El teléfono es obligatorio.";
    }

    const TELEFONO_REGEX = /^(\+?503[\s-]?)?[2-7]\d{3}[\s-]?\d{4}$/;
    if (!TELEFONO_REGEX.test(telefono.trim())) {
        return "El teléfono debe tener 8 dígitos (ej. 7123-4567).";
    }

    if (!direccion || direccion.trim() === "") {
        return "La dirección es obligatoria.";
    }

    if (!estado || estado.trim() === "") {
        return "El estado es obligatorio.";
    }

    return null;
}
