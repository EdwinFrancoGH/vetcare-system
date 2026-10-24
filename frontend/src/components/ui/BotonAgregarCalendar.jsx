"use client";

import { construirEnlaceGoogleCalendar } from "../../utils/calendario";

export default function BotonAgregarCalendar({
    titulo,
    fecha,
    detalles,
    ubicacion,
    hora,
    duracionMinutos,
    className,
    children,
}) {

    const enlace = construirEnlaceGoogleCalendar({
        titulo,
        fecha,
        detalles,
        ubicacion,
        hora,
        duracionMinutos,
    });

    if (!enlace) {
        return null;
    }

    return (
        <a
            href={enlace}
            target="_blank"
            rel="noopener noreferrer"
            className={
                className ||
                "inline-flex items-center gap-1 text-xs font-medium text-blue-700 hover:underline"
            }
        >
            {children || "+ Agregar a Calendar"}
        </a>
    );

}
