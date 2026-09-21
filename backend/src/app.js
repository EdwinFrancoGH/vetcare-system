import express from "express";
import cors from "cors";

// Rutas de autenticación
import authRoutes from "./routes/auth.routes.js";

// Rutas del sistema
import mascotasRoutes from "./routes/mascotas.routes.js";
import historialRoutes from "./routes/historial.routes.js";
import vacunasRoutes from "./routes/vacunas.routes.js";
import citasRoutes from "./routes/citas.routes.js";
import horariosRoutes from "./routes/horarios.routes.js";
import clientesRoutes from "./routes/clientes.routes.js";
import usersRoutes from "./routes/users.routes.js";

// Middlewares
import { verifyToken } from "./middlewares/auth.middleware.js";

const app = express();

app.use(cors());
app.use(express.json());

// ====================
// Rutas públicas
// ====================
app.use("/api/auth", authRoutes);

// ====================
// Rutas protegidas
// ====================
app.use("/api/mascotas", verifyToken, mascotasRoutes);
app.use("/api/clientes", verifyToken, clientesRoutes);
app.use("/api/historiales", verifyToken, historialRoutes);
app.use("/api/vacunas", verifyToken, vacunasRoutes);
app.use("/api/citas", verifyToken, citasRoutes);
app.use("/api/horarios", verifyToken, horariosRoutes);

// ====================
// Administración
// ====================
app.use("/api/users", usersRoutes);

// Ruta de prueba
app.get("/", (req, res) => {
    res.json({
        mensaje: "VetCare API funcionando"
    });
});

export default app;