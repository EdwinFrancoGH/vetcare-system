import {
    obtenerTodos,
    obtenerPorId,
    crear,
    actualizar,
    eliminar,
    obtenerStockBajo
} from "../services/productos.service.js";

import { validarProducto } from "../validators/producto.validator.js";

// Obtener todos los productos
export const obtenerProductos = async (req, res) => {
    try {
        const productos = await obtenerTodos();

        res.status(200).json({
            ok: true,
            message: "Productos obtenidos correctamente.",
            data: productos
        });

    } catch (error) {
        res.status(500).json({
            ok: false,
            message: "Error al obtener los productos.",
            error: error.message
        });
    }
};

// Obtener producto por ID
export const obtenerProductoPorId = async (req, res) => {
    try {
        const { id } = req.params;

        const producto = await obtenerPorId(id);

        if (!producto) {
            return res.status(404).json({
                ok: false,
                message: "Producto no encontrado."
            });
        }

        res.status(200).json({
            ok: true,
            message: "Producto obtenido correctamente.",
            data: producto
        });

    } catch (error) {
        res.status(500).json({
            ok: false,
            message: "Error al obtener el producto.",
            error: error.message
        });
    }
};

// Crear producto
export const crearProducto = async (req, res) => {
    try {
        const errorValidacion = validarProducto(req.body);

        if (errorValidacion) {
            return res.status(400).json({
                ok: false,
                message: errorValidacion
            });
        }

        const nuevoProducto = await crear(req.body);

        res.status(201).json({
            ok: true,
            message: "Producto creado correctamente.",
            data: nuevoProducto
        });

    } catch (error) {
        res.status(500).json({
            ok: false,
            message: "Error al crear el producto.",
            error: error.message
        });
    }
};

// Actualizar producto
export const actualizarProducto = async (req, res) => {
    try {
        const { id } = req.params;

        const errorValidacion = validarProducto(req.body, true);

        if (errorValidacion) {
            return res.status(400).json({
                ok: false,
                message: errorValidacion
            });
        }

        const producto = await actualizar(id, req.body);

        if (!producto) {
            return res.status(404).json({
                ok: false,
                message: "Producto no encontrado."
            });
        }

        res.status(200).json({
            ok: true,
            message: "Producto actualizado correctamente.",
            data: producto
        });

    } catch (error) {
        res.status(500).json({
            ok: false,
            message: "Error al actualizar el producto.",
            error: error.message
        });
    }
};

// Eliminar producto
export const eliminarProducto = async (req, res) => {
    try {
        const { id } = req.params;

        const eliminado = await eliminar(id);

        if (!eliminado) {
            return res.status(404).json({
                ok: false,
                message: "Producto no encontrado."
            });
        }

        res.status(200).json({
            ok: true,
            message: "Producto eliminado correctamente."
        });

    } catch (error) {
        res.status(500).json({
            ok: false,
            message: "Error al eliminar el producto.",
            error: error.message
        });
    }
};

// Obtener productos con stock bajo
export const obtenerProductosStockBajo = async (req, res) => {
    try {
        const productos = await obtenerStockBajo();

        res.status(200).json({
            ok: true,
            message: "Productos con stock bajo obtenidos correctamente.",
            data: productos
        });

    } catch (error) {
        res.status(500).json({
            ok: false,
            message: "Error al obtener los productos con stock bajo.",
            error: error.message
        });
    }
};