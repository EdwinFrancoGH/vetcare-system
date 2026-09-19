import express from "express";

import cors from "cors";

import mascotasRoutes from "./routes/mascotas.routes.js";
import citasRoutes from "./routes/citas.routes.js";
import consultasRoutes from "./routes/consultas.routes.js";

const app = express();

app.use(cors());

app.use(express.json());

// Rutas de Mascotas
app.use("/api/mascotas", mascotasRoutes);

// Rutas de Citas
app.use("/api/citas", citasRoutes);

// Rutas de Consultas
app.use("/api/consultas", consultasRoutes);

app.get("/", (req, res) => {
    res.json({
        mensaje: "VetCare API funcionando"
    });
});

export default app;