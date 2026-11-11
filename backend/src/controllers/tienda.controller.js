import { obtenerTodos as obtenerTodosProductos, obtenerPorId as obtenerProductoPorId } from "../services/productos.service.js";
import {
    crearPedido as crearPedidoService,
    obtenerPorCliente,
    obtenerPorId,
    cambiarEstado,
    vencerPedidosAntiguos
} from "../services/pedidos.service.js";
import { validarPedido } from "../validators/pedido.validator.js";

// Catálogo público para clientes: solo productos activos con stock disponible
export const crearControladorObtenerCatalogo = (obtenerProductos = obtenerTodosProductos) => async (req, res) => {
    try {
        const productos = await obtenerProductos();

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

                if (typeof p.imagenUrl === "string" && p.imagenUrl.startsWith("https://")) {
                    item.imagenUrl = p.imagenUrl;
                }

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

export const obtenerCatalogo = crearControladorObtenerCatalogo();

// Detalle público de producto activo, incluso si está agotado.
export const crearControladorObtenerProductoTienda = (buscar = obtenerProductoPorId) => async (req, res) => {
    try {
        const producto = await buscar(req.params.id);
        if (!producto || producto.activo === false) {
            return res.status(404).json({ ok: false, message: "Producto no encontrado." });
        }

        const data = {
            id: producto.id,
            nombre: producto.nombre,
            categoria: producto.categoria || "General",
            descripcion: producto.descripcion || "",
            precio: Number(producto.precio),
            stock: Number(producto.stock) || 0
        };
        if (typeof producto.imagenUrl === "string") {
            try {
                const imagen = new URL(producto.imagenUrl);
                if (imagen.protocol === "https:") data.imagenUrl = imagen.href;
            } catch {
                // Una URL inválida se omite y la interfaz muestra el icono de categoría.
            }
        }

        return res.status(200).json({ ok: true, message: "Producto obtenido correctamente.", data });
    } catch (error) {
        return res.status(500).json({ ok: false, message: "Error al obtener el producto.", error: error.message });
    }
};

export const obtenerProductoTienda = crearControladorObtenerProductoTienda();

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
            tipo: req.body.tipo,
            idempotencyKey: req.idempotencyKey
        });

        res.set('Idempotency-Replayed', String(nuevoPedido.repetido));
        return res.status(nuevoPedido.repetido ? 200 : 201).json({
            ok: true,
            message: "Pedido creado correctamente.",
            data: nuevoPedido.pedido
        });
    } catch (error) {
        if (error.message === "IDEMPOTENCY_KEY_REUSED") {
            return res.status(409).json({ ok: false, message: "La clave de solicitud ya se usó con otros datos." });
        }

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

        if (error.message.startsWith("PRODUCTO_INVALIDO") || error.message === "TOTAL_INVALIDO") {
            return res.status(400).json({
                ok: false,
                message: "Los datos de productos o cantidades no son válidos."
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
export const crearControladorObtenerMisPedidos = ({ listar = obtenerPorCliente, vencer = vencerPedidosAntiguos } = {}) => async (req, res) => {
    try {
        try {
            await vencer();
        } catch (errorVencimiento) {
            console.error("Error al vencer pedidos antiguos:", errorVencimiento.message);
        }

        const pedidos = await listar(req.user.uid);

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

export const obtenerMisPedidos = crearControladorObtenerMisPedidos();

// Cancelar un pedido propio solo si está en estado pendiente
export const crearControladorCancelarMiPedido = ({ buscar = obtenerPorId, actualizar = cambiarEstado } = {}) => async (req, res) => {
    try {
        const { id } = req.params;
        const pedido = await buscar(id);

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

        const resultado = await actualizar(
            id,
            "cancelado",
            null,
            "Cancelado por el cliente",
            { uid: req.user?.uid || null, role: "Cliente" }
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

export const cancelarMiPedido = crearControladorCancelarMiPedido();
