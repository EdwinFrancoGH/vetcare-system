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

import mascotasRoutes from "./routes/mascotas.routes.js";//importacion de la ruta
import productosRoutes from "./routes/productos.routes.js";
import inventarioRoutes from "./routes/inventario.routes.js";
import ventasRoutes from "./routes/ventas.routes.js";
import reportesRoutes from "./routes/reportes.routes.js";

const app = express();

app.use(cors());
app.use(express.json());
//ruta usamos la ruta
app.use("/api/mascotas", mascotasRoutes);
app.use("/api/productos", productosRoutes);
app.use("/api/inventario", inventarioRoutes);
app.use("/api/ventas", ventasRoutes);
app.use("/api/reportes", reportesRoutes);

app.get("/", (req, res) => {
    res.json({
        mensaje: "VetCare API funcionando"
    });
});

export default app;