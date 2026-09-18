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

const app = express();

app.use(cors());
app.use(express.json());

//ruta usamos la ruta de la api inicial
app.use("/api/mascotas", mascotasRoutes);
app.use("/api/historiales", historialRoutes);
app.use("/api/vacunas", vacunasRoutes);

app.get("/", (req, res) => {
    res.json({
        mensaje: "VetCare API funcionando"
    });
});

export default app;