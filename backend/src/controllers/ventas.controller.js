import {
    obtenerTodas,
    obtenerPorId,
    crearVenta
} from "../services/ventas.service.js";

// Obtener todas las ventas
export const obtenerVentas = async (req, res) => {
    try {
        const ventas = await obtenerTodas();

        res.status(200).json({
            ok: true,
            message: "Ventas obtenidas correctamente.",
            data: ventas
        });

    } catch (error) {
        res.status(500).json({
            ok: false,
            message: "Error al obtener las ventas.",
            error: error.message
        });
    }
};

// Obtener venta por ID
export const obtenerVentaPorId = async (req, res) => {
    try {
        const { id } = req.params;

        const venta = await obtenerPorId(id);

        if (!venta) {
            return res.status(404).json({
                ok: false,
                message: "Venta no encontrada."
            });
        }

        res.status(200).json({
            ok: true,
            message: "Venta obtenida correctamente.",
            data: venta
        });

    } catch (error) {
        res.status(500).json({
            ok: false,
            message: "Error al obtener la venta.",
            error: error.message
        });
    }
};

// Registrar nueva venta
export const registrarVenta = async (req, res) => {
    try {
        const { productos, cliente, metodoPago } = req.body;

        // Validar que exista al menos un producto
        if (!Array.isArray(productos) || productos.length === 0) {
            return res.status(400).json({
                ok: false,
                message: "La venta debe contener al menos un producto."
            });
        }

        // Validar cada producto
        for (const item of productos) {
            if (!item.productoId) {
                return res.status(400).json({
                    ok: false,
                    message: "El ID del producto es obligatorio."
                });
            }

            const cantidad = Number(item.cantidad);

            if (!Number.isInteger(cantidad) || cantidad <= 0) {
                return res.status(400).json({
                    ok: false,
                    message: "La cantidad debe ser un número entero mayor a 0."
                });
            }
        }

        const venta = await crearVenta({
            productos,
            cliente,
            metodoPago
        });

        res.status(201).json({
            ok: true,
            message: "Venta registrada correctamente.",
            data: venta
        });

    } catch (error) {

        // Producto inexistente
        if (error.message.startsWith("PRODUCTO_NO_ENCONTRADO:")) {
            return res.status(404).json({
                ok: false,
                message: "Uno de los productos no fue encontrado."
            });
        }

        // Stock insuficiente
        if (error.message.startsWith("STOCK_INSUFICIENTE:")) {
            const [, nombre, stockActual] = error.message.split(":");

            return res.status(400).json({
                ok: false,
                message: `Stock insuficiente para ${nombre}.`,
                stockActual: Number(stockActual)
            });
        }

        res.status(500).json({
            ok: false,
            message: "Error al registrar la venta.",
            error: error.message
        });
    }
};