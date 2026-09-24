"use client";

import { AlertCircle } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

// Envuelve el contenido de una página dentro de app/(app)/ y solo lo
// muestra si el rol del usuario logueado está en la lista permitida.
// Esto es SOLO la capa de interfaz (evita que alguien vea un menú o una
// pantalla que no le corresponde si teclea la URL directamente); la
// protección real de los datos vive en el backend (ver
// backend/src/middlewares/auth.middleware.js -> verifyRoles), que
// rechaza la petición aunque alguien se salte esta pantalla.
export default function RequireRole({ roles, children }) {
    const { userRole } = useAuth();

    if (!roles.includes(userRole)) {
        return (
            <div className="flex flex-col items-center justify-center h-96 text-zinc-500">
                <AlertCircle size={48} className="mb-4 text-red-400" />
                <h2 className="text-xl font-bold text-zinc-800">Acceso Denegado</h2>
                <p>No tienes permisos para ver esta página.</p>
            </div>
        );
    }

    return <>{children}</>;
}
