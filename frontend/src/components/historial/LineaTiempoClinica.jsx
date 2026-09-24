"use client";

export default function LineaTiempoClinica({ eventos }) {

    if (eventos.length === 0) {
        return (
            <div className="bg-white rounded-xl shadow p-6">
                <h2 className="text-xl font-bold text-gray-800 mb-4">
                    Línea de Tiempo Clínica
                </h2>
                <p className="text-gray-500">Sin eventos registrados todavía.</p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl shadow p-6">

            <h2 className="text-xl font-bold text-gray-800 mb-4">
                Línea de Tiempo Clínica ({eventos.length})
            </h2>

            <ol className="relative border-l-2 border-gray-200 ml-2">
                {eventos.map((evento) => (
                    <li key={evento.id} className="relative mb-6 ml-6">

                        <span
                            className={`absolute -left-[29px] top-1 w-4 h-4 rounded-full ring-4 ring-white ${
                                evento.tipo === "consulta" ? "bg-blue-700" : "bg-green-600"
                            }`}
                        />

                        <p className="text-xs uppercase tracking-wide text-gray-400">
                            {evento.tipo === "consulta" ? "Consulta" : "Vacuna"} · {evento.fecha}
                        </p>

                        {evento.tipo === "consulta" ? (
                            <>
                                <p className="font-medium text-gray-900">
                                    {evento.datos.motivoConsulta}
                                </p>
                                <p className="text-gray-600 text-sm">
                                    Diagnóstico: {evento.datos.diagnostico}
                                </p>
                                {evento.datos.tratamiento && (
                                    <p className="text-gray-600 text-sm">
                                        Tratamiento: {evento.datos.tratamiento}
                                    </p>
                                )}
                                <p className="text-gray-600 text-sm">
                                    Peso: {evento.datos.peso} kg
                                </p>
                            </>
                        ) : (
                            <>
                                <p className="font-medium text-gray-900">
                                    {evento.datos.nombre}
                                </p>
                                {evento.datos.veterinario && (
                                    <p className="text-gray-600 text-sm">
                                        Veterinario: {evento.datos.veterinario}
                                    </p>
                                )}
                                {evento.datos.proximaFecha && (
                                    <p className="text-orange-600 text-sm">
                                        Próximo refuerzo: {evento.datos.proximaFecha}
                                    </p>
                                )}
                            </>
                        )}

                    </li>
                ))}
            </ol>

        </div>
    );

}
