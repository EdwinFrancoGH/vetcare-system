import {
    obtenerInventario,
    registrarEntrada,
    registrarSalida
} from "../services/inventario.service.js";

// Obtener inventario completo
export const listarInventario = async (req, res) => {
    try {
        const inventario = await obtenerInventario();

        res.status(200).json({
            ok: true,
            message: "Inventario obtenido correctamente.",
            data: inventario
        });

    } catch (error) {
        res.status(500).json({
            ok: false,
            message: "Error al obtener el inventario.",
            error: error.message
        });
    }
};

// Registrar entrada de inventario
export const entradaInventario = async (req, res) => {
    try {
        const { productoId, cantidad } = req.body;

        if (!productoId) {
            return res.status(400).json({
                ok: false,
                message: "El ID del producto es obligatorio."
            });
        }

        const cantidadNumero = Number(cantidad);

        if (!Number.isInteger(cantidadNumero) || cantidadNumero <= 0) {
            return res.status(400).json({
                ok: false,
                message: "La cantidad debe ser un número entero mayor a 0."
            });
        }

        const resultado = await registrarEntrada(
            productoId,
            cantidadNumero
        );

        if (!resultado) {
            return res.status(404).json({
                ok: false,
                message: "Producto no encontrado."
            });
        }

        res.status(200).json({
            ok: true,
            message: "Entrada de inventario registrada correctamente.",
            data: resultado
        });

    } catch (error) {
        res.status(500).json({
            ok: false,
            message: "Error al registrar la entrada de inventario.",
            error: error.message
        });
    }
};

// Registrar salida de inventario
export const salidaInventario = async (req, res) => {
    try {
        const { productoId, cantidad } = req.body;

        if (!productoId) {
            return res.status(400).json({
                ok: false,
                message: "El ID del producto es obligatorio."
            });
        }

        const cantidadNumero = Number(cantidad);

        if (!Number.isInteger(cantidadNumero) || cantidadNumero <= 0) {
            return res.status(400).json({
                ok: false,
                message: "La cantidad debe ser un número entero mayor a 0."
            });
        }

        const resultado = await registrarSalida(
            productoId,
            cantidadNumero
        );

        if (resultado?.error === "PRODUCTO_NO_ENCONTRADO") {
            return res.status(404).json({
                ok: false,
                message: "Producto no encontrado."
            });
        }

        if (resultado?.error === "STOCK_INSUFICIENTE") {
            return res.status(400).json({
                ok: false,
                message: "Stock insuficiente para realizar la salida.",
                stockActual: resultado.stockActual
            });
        }

        res.status(200).json({
            ok: true,
            message: "Salida de inventario registrada correctamente.",
            data: resultado
        });

    } catch (error) {
        res.status(500).json({
            ok: false,
            message: "Error al registrar la salida de inventario.",
            error: error.message
        });
    }
};