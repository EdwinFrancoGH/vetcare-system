export const validarProducto = (datos, esActualizacion = false) => {
    const {
        nombre,
        categoria,
        precio,
        stock,
        stockMinimo,
        fechaVencimiento
    } = datos;

    // En creación, nombre y categoría son obligatorios
    if (!esActualizacion) {
        if (!nombre || nombre.trim() === "") {
            return "El nombre del producto es obligatorio.";
        }

        if (!categoria || categoria.trim() === "") {
            return "La categoría del producto es obligatoria.";
        }

        if (precio === undefined || precio === null || precio === "") {
            return "El precio del producto es obligatorio.";
        }

        if (stock === undefined || stock === null || stock === "") {
            return "El stock del producto es obligatorio.";
        }

        if (
            stockMinimo === undefined ||
            stockMinimo === null ||
            stockMinimo === ""
        ) {
            return "El stock mínimo es obligatorio.";
        }
    }

    // Validaciones para creación y actualización
    if (nombre !== undefined) {
        if (typeof nombre !== "string" || nombre.trim().length < 2) {
            return "El nombre debe contener al menos 2 caracteres.";
        }
    }

    if (categoria !== undefined) {
        if (typeof categoria !== "string" || categoria.trim().length < 2) {
            return "La categoría no es válida.";
        }
    }

    if (precio !== undefined) {
        const precioNumero = Number(precio);

        if (!Number.isFinite(precioNumero) || precioNumero < 0) {
            return "El precio debe ser un número mayor o igual a 0.";
        }
    }

    if (stock !== undefined) {
        const stockNumero = Number(stock);

        if (!Number.isInteger(stockNumero) || stockNumero < 0) {
            return "El stock debe ser un número entero mayor o igual a 0.";
        }
    }

    if (stockMinimo !== undefined) {
        const stockMinimoNumero = Number(stockMinimo);

        if (!Number.isInteger(stockMinimoNumero) || stockMinimoNumero < 0) {
            return "El stock mínimo debe ser un número entero mayor o igual a 0.";
        }
    }

    if (fechaVencimiento) {
        const fecha = new Date(fechaVencimiento);

        if (Number.isNaN(fecha.getTime())) {
            return "La fecha de vencimiento no es válida.";
        }
    }

    return null;
};