"use client";

const ESTILOS_ESTADO = {
    pendiente: {
        etiqueta: "Pendiente",
        clases: "bg-amber-100 text-amber-800 border-amber-200"
    },
    listo: {
        etiqueta: "Listo para retirar",
        clases: "bg-blue-100 text-blue-800 border-blue-200"
    },
    entregado: {
        etiqueta: "Entregado",
        clases: "bg-emerald-100 text-emerald-800 border-emerald-200"
    },
    cancelado: {
        etiqueta: "Cancelado",
        clases: "bg-zinc-100 text-zinc-600 border-zinc-200"
    }
};

// Badge con código de color según el estado del pedido
export default function EstadoPedido({ estado }) {
    const config = ESTILOS_ESTADO[estado] || {
        etiqueta: estado || "Desconocido",
        clases: "bg-zinc-100 text-zinc-600 border-zinc-200"
    };

    return (
        <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs ` +
                `font-semibold border ${config.clases}`}
        >
            {config.etiqueta}
        </span>
    );
}
