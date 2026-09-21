"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { buscarEnClinica } from "../../utils/busqueda";

export default function BusquedaInteligente({ mascotas, historiales, vacunas }) {

    const [termino, setTermino] = useState("");

    const resultados = useMemo(
        () => buscarEnClinica(termino, { mascotas, historiales, vacunas }),
        [termino, mascotas, historiales, vacunas]
    );

    const hayResultados =
        resultados.mascotas.length > 0 ||
        resultados.consultas.length > 0 ||
        resultados.vacunas.length > 0;

    return (
        <div className="bg-white rounded-xl shadow p-6">

            <h2 className="text-xl font-bold text-gray-800 mb-4">
                Búsqueda Inteligente
            </h2>

            <input
                type="text"
                value={termino}
                onChange={(e) => setTermino(e.target.value)}
                placeholder="Busca por mascota, propietario, especie, diagnóstico, vacuna..."
                className="w-full border rounded-lg px-4 py-2 text-gray-700"
            />

            {termino.trim() !== "" && (

                <div className="mt-4 space-y-4">

                    {!hayResultados && (
                        <p className="text-gray-500">Sin resultados para &quot;{termino}&quot;.</p>
                    )}

                    {resultados.mascotas.length > 0 && (
                        <div>
                            <p className="text-xs uppercase tracking-wide text-gray-400 mb-2">
                                Mascotas
                            </p>
                            <ul className="space-y-1">
                                {resultados.mascotas.map((m) => (
                                    <li key={m.id}>
                                        <Link
                                            href={`/mascotas/${m.id}`}
                                            className="text-blue-700 hover:underline"
                                        >
                                            {m.nombre}
                                        </Link>
                                        <span className="text-gray-500 text-sm">
                                            {" "}— {m.especie} · {m.propietario}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {resultados.consultas.length > 0 && (
                        <div>
                            <p className="text-xs uppercase tracking-wide text-gray-400 mb-2">
                                Consultas
                            </p>
                            <ul className="space-y-1">
                                {resultados.consultas.map((h) => (
                                    <li key={h.id}>
                                        <Link
                                            href={`/mascotas/${h.mascotaId}`}
                                            className="text-blue-700 hover:underline"
                                        >
                                            {h.mascota?.nombre || "Mascota"}
                                        </Link>
                                        <span className="text-gray-500 text-sm">
                                            {" "}— {h.fecha}: {h.diagnostico}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {resultados.vacunas.length > 0 && (
                        <div>
                            <p className="text-xs uppercase tracking-wide text-gray-400 mb-2">
                                Vacunas
                            </p>
                            <ul className="space-y-1">
                                {resultados.vacunas.map((v) => (
                                    <li key={v.id}>
                                        <Link
                                            href={`/mascotas/${v.mascotaId}`}
                                            className="text-blue-700 hover:underline"
                                        >
                                            {v.mascota?.nombre || "Mascota"}
                                        </Link>
                                        <span className="text-gray-500 text-sm">
                                            {" "}— {v.nombre} ({v.fecha})
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                </div>

            )}

        </div>
    );

}
