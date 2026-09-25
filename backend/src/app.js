import express from "express";
import cors from "cors";

// --- Módulo Citas / Ficha clínica (rama "más estable") ---
import mascotasRoutes from "./routes/mascotas.routes.js";
import historialRoutes from "./routes/historial.routes.js";
import vacunasRoutes from "./routes/vacunas.routes.js";
import citasRoutes from "./routes/citas.routes.js";
import horariosRoutes from "./routes/horarios.routes.js";

// --- Módulo Autenticación / Ventas (integrado) ---
import authRoutes from "./routes/auth.routes.js";
import clientesRoutes from "./routes/clientes.routes.js";
import productosRoutes from "./routes/productos.routes.js";
import inventarioRoutes from "./routes/inventario.routes.js";
import ventasRoutes from "./routes/ventas.routes.js";
import reportesRoutes from "./routes/reportes.routes.js";
import usersRoutes from "./routes/users.routes.js";

import { verifyToken, verifyRoles, cargarRol } from "./middlewares/auth.middleware.js";

const app = express();

app.use(cors());
// límite subido de 100kb (default) a 2mb: la foto de perfil viaja como
// base64 dentro del JSON (ver users.controller.js -> updateProfile)
app.use(express.json({ limit: "2mb" }));

// Rutas públicas: solo login/registro pasa por aquí sin token.
// (el propio login/registro ocurre en el cliente contra Firebase Auth;
// este endpoint solo sincroniza el usuario recién autenticado en Firestore)
app.use("/api/auth", authRoutes);

// A partir de aquí, TODAS las rutas de datos requieren estar autenticado.
// Antes de este merge, "mascotas/historial/vacunas/citas/horarios" no
// tenían ninguna protección (la rama citas/historial nunca integró login).
// Ahora que el login se integró, se protegen igual que ventas/clientes.
//
// Además de estar autenticado, historiales/vacunas muestran a TODOS los
// pacientes de la clínica (no están filtrados por dueño), así que se
// limitan al personal (Administrador/Recepcionista/Veterinario). Mascotas
// sí está filtrada por dueño (propietarioUid): un Cliente ve solo las suyas. citas/horarios sí los usa un Cliente (reservar su cita),
// así que solo llevan verifyToken aquí; las rutas de citas/horarios que
// son exclusivas de personal se restringen dentro de sus propios
// routers (ver citas.routes.js y horarios.routes.js).
const SOLO_PERSONAL_CLINICO = verifyRoles("Administrador", "Recepcionista", "Veterinario");

// Mascotas: el personal ve todas; un Cliente solo ve y gestiona las
// suyas (filtradas por propietarioUid en mascotas.controller.js).
app.use("/api/mascotas", verifyToken, cargarRol, mascotasRoutes);
app.use("/api/historiales", verifyToken, SOLO_PERSONAL_CLINICO, historialRoutes);
app.use("/api/vacunas", verifyToken, SOLO_PERSONAL_CLINICO, vacunasRoutes);
app.use("/api/citas", verifyToken, cargarRol, citasRoutes);
app.use("/api/horarios", verifyToken, horariosRoutes);

// clientes.routes.js y users.routes.js ya aplican verifyToken (y
// verifyAdmin/verifyRoles donde corresponde) internamente con
// router.use(), por eso aquí no se duplica el middleware.
app.use("/api/clientes", clientesRoutes);
app.use("/api/users", usersRoutes);

// Módulos de Inventario y Ventas: son de gestión del negocio, no
// clínicos, así que un Veterinario tampoco los necesita — solo
// Administrador/Recepcionista.
const SOLO_ADMINISTRACION = verifyRoles("Administrador", "Recepcionista");

app.use("/api/productos", verifyToken, SOLO_ADMINISTRACION, productosRoutes);
app.use("/api/inventario", verifyToken, SOLO_ADMINISTRACION, inventarioRoutes);
app.use("/api/ventas", verifyToken, SOLO_ADMINISTRACION, ventasRoutes);
app.use("/api/reportes", verifyToken, SOLO_ADMINISTRACION, reportesRoutes);

app.get("/", (req, res) => {
    res.json({
        mensaje: "VetCare API funcionando"
    });
});

export default app;
