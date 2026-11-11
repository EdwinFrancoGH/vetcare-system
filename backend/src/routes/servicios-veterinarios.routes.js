import { Router } from "express";
import { verifyRoles } from "../middlewares/auth.middleware.js";
import {
    actualizarServicioVeterinarioController,
    cambiarEstadoServicioVeterinarioController,
    crearServicioVeterinarioController,
    obtenerServiciosVeterinarios,
} from "../controllers/servicios-veterinarios.controller.js";

const controladores = {
    listar: obtenerServiciosVeterinarios,
    crear: crearServicioVeterinarioController,
    actualizar: actualizarServicioVeterinarioController,
    cambiarEstado: cambiarEstadoServicioVeterinarioController,
};

export const crearRouterServiciosVeterinarios = (verificarRoles = verifyRoles, handlers = controladores) => {
    const router = Router();
    const soloAdministrador = verificarRoles("Administrador");

    router.get("/", handlers.listar);
    router.post("/", soloAdministrador, handlers.crear);
    router.patch("/:id", soloAdministrador, handlers.actualizar);
    router.patch("/:id/estado", soloAdministrador, handlers.cambiarEstado);

    return router;
};

export default crearRouterServiciosVeterinarios();
