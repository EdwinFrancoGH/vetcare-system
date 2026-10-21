import { Router } from "express";
import {
    obtenerPedidos,
    actualizarEstadoPedido
} from "../controllers/pedidos.controller.js";

const router = Router();

router.get("/", obtenerPedidos);
router.put("/:id/estado", actualizarEstadoPedido);

export default router;
