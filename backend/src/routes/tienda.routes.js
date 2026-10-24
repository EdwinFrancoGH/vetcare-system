import { Router } from "express";
import {
    obtenerCatalogo,
    crearPedido,
    obtenerMisPedidos,
    cancelarMiPedido
} from "../controllers/tienda.controller.js";
import { verifyRoles } from "../middlewares/auth.middleware.js";

const router = Router();

const soloCliente = verifyRoles("Cliente");

// Catálogo visible para cualquier usuario autenticado
router.get("/productos", obtenerCatalogo);

// Rutas exclusivas para rol Cliente
router.post("/pedidos", soloCliente, crearPedido);
router.get("/mis-pedidos", soloCliente, obtenerMisPedidos);
router.put("/mis-pedidos/:id/cancelar", soloCliente, cancelarMiPedido);

export default router;
