import { Router } from "express";
import {
    obtenerPedidos,
    actualizarEstadoPedido,
    extenderPlazoPedido
} from "../controllers/pedidos.controller.js";

const router = Router();

router.get("/", obtenerPedidos);
router.put("/:id/estado", actualizarEstadoPedido);
router.put("/:id/extender", extenderPlazoPedido);

export default router;

