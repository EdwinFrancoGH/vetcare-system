import { Router } from "express";
import { verifyRoles } from "../middlewares/auth.middleware.js";
import {
    aprobarPagoCitaController,
    listarPagosPendientesController,
    rechazarPagoCitaController,
} from "../controllers/pagos.controller.js";

const controladores = {
    pendientes: listarPagosPendientesController,
    aprobar: aprobarPagoCitaController,
    rechazar: rechazarPagoCitaController,
};

export const crearRouterPagos = (verificarRoles = verifyRoles, handlers = controladores) => {
    const router = Router();
    const soloPersonalFinanciero = verificarRoles("Administrador", "Recepcionista");

    router.get("/pendientes", soloPersonalFinanciero, handlers.pendientes);
    router.patch("/:citaId/aprobar", soloPersonalFinanciero, handlers.aprobar);
    router.patch("/:citaId/rechazar", soloPersonalFinanciero, handlers.rechazar);

    return router;
};

export default crearRouterPagos();
