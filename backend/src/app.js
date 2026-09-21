import express from "express";
import cors from "cors";

import authRoutes from "./routes/auth.routes.js";
import mascotasRoutes from "./routes/mascotas.routes.js";
import productosRoutes from "./routes/productos.routes.js";
import inventarioRoutes from "./routes/inventario.routes.js";
import ventasRoutes from "./routes/ventas.routes.js";
import reportesRoutes from "./routes/reportes.routes.js";
import usersRoutes from "./routes/users.routes.js";
import clientesRoutes from "./routes/clientes.routes.js";

import { verifyToken } from "./middlewares/auth.middleware.js";

const app = express();

app.use(cors());
app.use(express.json());

// Rutas públicas y de autenticación
app.use("/api/auth", authRoutes);

// Rutas protegidas
app.use("/api/mascotas", verifyToken, mascotasRoutes);
app.use("/api/clientes", verifyToken, clientesRoutes);

// Módulos de Inventario y Ventas
app.use("/api/productos", productosRoutes);
app.use("/api/inventario", inventarioRoutes);
app.use("/api/ventas", ventasRoutes);
app.use("/api/reportes", reportesRoutes);

// Administración de usuarios
app.use("/api/users", usersRoutes);

app.get("/", (req, res) => {
    res.json({
        mensaje: "VetCare API funcionando"
    });
});

export default app;