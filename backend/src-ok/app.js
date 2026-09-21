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

import mascotasRoutes from "./routes/mascotas.routes.js";//importacion de la ruta de mascotas
import historialRoutes from "./routes/historial.routes.js";//importacion de la ruta de historial clinico
import vacunasRoutes from "./routes/vacunas.routes.js";//importacion de la ruta de vacunas
import citasRoutes from "./routes/citas.routes.js";//importacion de la ruta de citas
import horariosRoutes from "./routes/horarios.routes.js";//importacion de la ruta de horarios de atencion

const app = express();

app.use(cors());
app.use(express.json());

//ruta usamos la ruta de la api inicial
app.use("/api/mascotas", mascotasRoutes);
app.use("/api/historiales", historialRoutes);
app.use("/api/vacunas", vacunasRoutes);
app.use("/api/citas", citasRoutes);
app.use("/api/horarios", horariosRoutes);

app.get("/", (req, res) => {
    res.json({
        mensaje: "VetCare API funcionando"
    });
});

export default app;