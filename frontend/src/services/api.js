import axios from "axios";
import { auth } from "../lib/firebase";

// Antes del merge existían DOS versiones de este archivo: una apuntaba a
// localhost:5001 (rama auth/ventas) y otra a localhost:5000 hardcodeado
// (rama citas/historial). Ahora hay una sola fuente de verdad, configurable
// por variable de entorno, con el backend integrado corriendo en el 5000.
const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api",
    headers: {
        "Content-Type": "application/json",
    },
});

// Ahora que TODAS las rutas de datos requieren login (ver backend/src/app.js),
// cada petición necesita el token de Firebase del usuario autenticado.
// Antes de este merge, services/api.js nunca adjuntaba ese token: por eso
// mascotas/clientes (que ya exigían verifyToken) habrían fallado con 401
// en cuanto se intentara usarlos desde este cliente axios.
api.interceptors.request.use(async (config) => {
    const currentUser = auth.currentUser;

    if (currentUser) {
        const idToken = await currentUser.getIdToken();
        config.headers.Authorization = `Bearer ${idToken}`;
    }

    return config;
});

export default api;
