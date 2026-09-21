//import express from "express";
//import mascotasRoutes from "./routes/mascotas.routes.js";//importacion de la ruta
/*
const express = require("express");
const cors = require("cors");
const mascotasRoutes = require("./routes/mascotas.routes");//lo cambiamos por el CommonJS import es de ES Modules


const app = express();

app.use(cors());
app.use(express.json());

//ruta agregada
app.use("/api/mascotas", mascotasRoutes);

app.get("/", (req, res) => {
    res.json({
        mensaje: "VetCare API funcionando"
    });
});

module.exports = app;
*/
import express from "express";
import cors from "cors";

import authRoutes from "./routes/auth.routes.js";
import mascotasRoutes from "./routes/mascotas.routes.js";//importacion de la ruta
import usersRoutes from "./routes/users.routes.js";
import clientesRoutes from "./routes/clientes.routes.js";
import { verifyToken } from "./middlewares/auth.middleware.js";

const app = express();

app.use(cors());
app.use(express.json());

// Rutas públicas y de autenticación
app.use("/api/auth", authRoutes);

//rutas protegidas (usamos verifyToken)
app.use("/api/mascotas", verifyToken, mascotasRoutes);
app.use("/api/clientes", verifyToken, clientesRoutes);

//rutas de administrador (usamos verifyToken y verifyAdmin internamente)
app.use("/api/users", usersRoutes);

app.get("/", (req, res) => {
    res.json({
        mensaje: "VetCare API funcionando"
    });
});

export default app;