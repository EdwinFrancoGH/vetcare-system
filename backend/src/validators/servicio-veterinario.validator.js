const CAMPOS_CREACION = new Set(["nombre", "descripcion", "precioCentavos", "moneda"]);
const CAMPOS_ACTUALIZACION = new Set(["nombre", "descripcion", "precioCentavos"]);

const esObjeto = (datos) => datos !== null && typeof datos === "object" && !Array.isArray(datos);

const nombreNormalizado = (nombre) => nombre
    .normalize("NFKC")
    .trim()
    .replace(/\s+/g, " ");

export const normalizarNombreServicio = (nombre) => nombreNormalizado(nombre)
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("es");

export const validarServicioVeterinario = (datos, esActualizacion = false) => {
    if (!esObjeto(datos)) return "El cuerpo de la solicitud debe ser un objeto.";

    const camposPermitidos = esActualizacion ? CAMPOS_ACTUALIZACION : CAMPOS_CREACION;
    const campoDesconocido = Object.keys(datos).find((campo) => !camposPermitidos.has(campo));
    if (campoDesconocido) return `El campo '${campoDesconocido}' no está permitido.`;
    if (esActualizacion && Object.keys(datos).length === 0) return "Indica al menos un campo para actualizar.";

    if (!esActualizacion || Object.hasOwn(datos, "nombre")) {
        if (typeof datos.nombre !== "string") return "El nombre del servicio es obligatorio.";
        const nombre = nombreNormalizado(datos.nombre);
        if (nombre.length < 2 || nombre.length > 120) {
            return "El nombre debe tener entre 2 y 120 caracteres.";
        }
    }

    if (!esActualizacion || Object.hasOwn(datos, "descripcion")) {
        if (datos.descripcion !== undefined
            && (typeof datos.descripcion !== "string" || datos.descripcion.trim().length > 1000)) {
            return "La descripción debe ser texto de hasta 1000 caracteres.";
        }
    }

    if (!esActualizacion || Object.hasOwn(datos, "precioCentavos")) {
        if (!Number.isSafeInteger(datos.precioCentavos) || datos.precioCentavos <= 0) {
            return "El precio debe ser un entero positivo expresado en centavos.";
        }
    }

    if (!esActualizacion && datos.moneda !== undefined && datos.moneda !== "USD") {
        return "La moneda del catálogo es USD.";
    }

    return null;
};

export const validarEstadoServicioVeterinario = (datos) => {
    if (!esObjeto(datos) || Object.keys(datos).length !== 1 || typeof datos.activo !== "boolean") {
        return "Indica únicamente el estado activo como booleano.";
    }
    return null;
};

export const normalizarDatosServicioVeterinario = (datos) => ({
    ...(datos.nombre !== undefined ? { nombre: nombreNormalizado(datos.nombre) } : {}),
    ...(datos.descripcion !== undefined ? { descripcion: datos.descripcion.trim() } : {}),
    ...(datos.precioCentavos !== undefined ? { precioCentavos: datos.precioCentavos } : {}),
});
