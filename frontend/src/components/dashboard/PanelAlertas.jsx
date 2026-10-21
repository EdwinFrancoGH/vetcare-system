"use client";

import Link from "next/link";

const COLOR_ESTADO = {
    "Crítico": "bg-red-100 text-red-800",
    "En seguimiento": "bg-orange-100 text-orange-800",
    "Estable": "bg-green-100 text-green-800",
    "Sin historial": "bg-gray-100 text-gray-600",
};

export default function PanelAlertas({ alertas }) {

    const conVencidos = alertas.filter((a) => a.vencidos.length > 0);
    const conProximos = alertas.filter(
        (a) => a.vencidos.length === 0 && a.proximos.length > 0
    );
    const frecuentes = alertas.filter((a) => a.consultasFrecuentes);

    const requierenAtencion = alertas.filter(
        (a) => a.estado === "Crítico" || a.estado === "En seguimiento"
    );

    return (
        <div className="bg-white rounded-xl shadow p-6">

            <h2 className="text-xl font-bold text-gray-800 mb-4">
                Alertas Clínicas
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">

                <div className="bg-red-50 rounded-lg p-4">
                    <p className="text-3xl font-bold text-red-700">{conVencidos.length}</p>
                    <p className="text-sm text-red-700">Mascotas con tratamientos vencidos</p>
                </div>

                <div className="bg-orange-50 rounded-lg p-4">
                    <p className="text-3xl font-bold text-orange-700">{conProximos.length}</p>
                    <p className="text-sm text-orange-700">Con citas/vacunas próximas (7 días)</p>
                </div>

                <div className="bg-yellow-50 rounded-lg p-4">
                    <p className="text-3xl font-bold text-yellow-700">{frecuentes.length}</p>
                    <p className="text-sm text-yellow-700">
                        Con consultas frecuentes (posible seguimiento especial)
                    </p>
                </div>

            </div>

            {alertas.length === 0 && (
                <p className="text-gray-500">No hay mascotas registradas todavía.</p>
            )}

            {alertas.length > 0 && requierenAtencion.length === 0 && (
                <p className="text-gray-500">
                    Ninguna mascota requiere atención inmediata en este momento.
                </p>
            )}

            <ul className="space-y-3">
                {requierenAtencion.map((a) => (
                    <li
                        key={a.mascota.id}
                        className="flex justify-between items-center border-b pb-2"
                    >
                        <div>
                            <Link
                                href={`/mascotas/${a.mascota.id}`}
                                className="font-medium text-blue-700 hover:underline"
                            >
                                {a.mascota.nombre}
                            </Link>
                            <span className="text-gray-500 text-sm"> — {a.mascota.propietario}</span>

                            {a.vencidos.length > 0 && (
                                <p className="text-red-600 text-sm">
                                    {a.vencidos.map((v) => v.tipo).join(", ")} vencido(s)
                                </p>
                            )}

                            {a.vencidos.length === 0 && a.proximos.length > 0 && (
                                <p className="text-orange-600 text-sm">
                                    {a.proximos.map((p) => `${p.tipo} (${p.fecha})`).join(", ")}
                                </p>
                            )}
                        </div>

                        <span
                            className={`px-3 py-1 rounded-full text-xs font-medium ${COLOR_ESTADO[a.estado]}`}
                        >
                            {a.estado}
                        </span>
                    </li>
                ))}
            </ul>

        </div>
    );

}
