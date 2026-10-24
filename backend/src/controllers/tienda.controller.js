import { obtenerTodos as obtenerTodosProductos } from "../services/productos.service.js";
import {
    crearPedido as crearPedidoService,
    obtenerPorCliente,
    obtenerPorId,
    cambiarEstado,
    vencerPedidosAntiguos
} from "../services/pedidos.service.js";
import { validarPedido } from "../validators/pedido.validator.js";

// Catálogo público para clientes: solo productos activos con stock disponible
export const obtenerCatalogo = async (req, res) => {
    try {
        const productos = await obtenerTodosProductos();

        const catalogo = productos
            .filter((p) => p.activo !== false && Number(p.stock) > 0)
            .map((p) => {
                const item = {
                    id: p.id,
                    nombre: p.nombre,
                    categoria: p.categoria,
                    precio: Number(p.precio),
                    stock: Number(p.stock)
                };

                if (p.descripcion) {
                    item.descripcion = p.descripcion;
                }

                return item;
            });

        return res.status(200).json({
            ok: true,
            message: "Catálogo obtenido correctamente.",
            data: catalogo
        });
    } catch (error) {
        return res.status(500).json({
            ok: false,
            message: "Error al obtener el catálogo.",
            error: error.message
        });
    }
};

// Crear pedido para el cliente autenticado
export const crearPedido = async (req, res) => {
    try {
        const errorValidacion = validarPedido(req.body);

        if (errorValidacion) {
            return res.status(400).json({
                ok: false,
                message: errorValidacion
            });
        }

        const clienteUid = req.user.uid;
        const clienteEmail = req.user.email || "";
        const clienteNombre = req.userData?.name || req.user.name || "Cliente";

        const nuevoPedido = await crearPedidoService({
            clienteUid,
            clienteNombre,
            clienteEmail,
            productos: req.body.productos,
            tipo: req.body.tipo
        });

        return res.status(201).json({
            ok: true,
            message: "Pedido creado correctamente.",
            data: nuevoPedido
        });
    } catch (error) {
        if (error.message.startsWith("PRODUCTO_NO_ENCONTRADO:")) {
            return res.status(404).json({
                ok: false,
                message: "Uno de los productos no fue encontrado o no está disponible."
            });
        }

        if (error.message.startsWith("STOCK_INSUFICIENTE:")) {
            const [, nombre, stockActual] = error.message.split(":");

            return res.status(400).json({
                ok: false,
                message: `Stock insuficiente para ${nombre}.`,
                stockActual: Number(stockActual)
            });
        }

        return res.status(500).json({
            ok: false,
            message: "Error al crear el pedido.",
            error: error.message
        });
    }
};

// Obtener pedidos del cliente autenticado
export const obtenerMisPedidos = async (req, res) => {
    try {
        try {
            await vencerPedidosAntiguos();
        } catch (errorVencimiento) {
            console.error("Error al vencer pedidos antiguos:", errorVencimiento.message);
        }

        const pedidos = await obtenerPorCliente(req.user.uid);

        return res.status(200).json({
            ok: true,
            message: "Pedidos obtenidos correctamente.",
            data: pedidos
        });
    } catch (error) {
        return res.status(500).json({
            ok: false,
            message: "Error al obtener los pedidos.",
            error: error.message
        });
    }
};

// Cancelar un pedido propio solo si está en estado pendiente
export const cancelarMiPedido = async (req, res) => {
    try {
        const { id } = req.params;
        const pedido = await obtenerPorId(id);

        if (!pedido || pedido.clienteUid !== req.user.uid) {
            return res.status(404).json({
                ok: false,
                message: "Pedido no encontrado."
            });
        }

        if (pedido.estado !== "pendiente") {
            return res.status(400).json({
                ok: false,
                message: "Solo se pueden cancelar pedidos en estado pendiente."
            });
        }

        const resultado = await cambiarEstado(
            id,
            "cancelado",
            null,
            "Cancelado por el cliente"
        );

        return res.status(200).json({
            ok: true,
            message: "Pedido cancelado correctamente.",
            data: resultado.pedido
        });
    } catch (error) {
        if (error.message === "TRANSICION_INVALIDA") {
            return res.status(400).json({
                ok: false,
                message: "No se puede cancelar el pedido en su estado actual."
            });
        }

        return res.status(500).json({
            ok: false,
            message: "Error al cancelar el pedido.",
            error: error.message
        });
    }
};
