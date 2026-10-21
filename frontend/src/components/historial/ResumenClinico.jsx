"use client";

import BotonAgregarCalendar from "../ui/BotonAgregarCalendar";

const ICONO_TENDENCIA = {
    sube: "↑",
    baja: "↓",
    estable: "→",
};

export default function ResumenClinico({ resumen, nombreMascota }) {

    const {
        totalConsultas,
        ultimaConsulta,
        diagnosticoVigente,
        tratamientoVigente,
        pesoActual,
        tendenciaPeso,
        proximaAccion,
    } = resumen;

    return (
        <div className="bg-white rounded-xl shadow p-6">

            <h2 className="text-xl font-bold text-gray-800 mb-4">
                Resumen Clínico
            </h2>

            {!ultimaConsulta && (
                <p className="text-gray-500">
                    Aún no hay consultas registradas para generar un resumen.
                </p>
            )}

            {ultimaConsulta && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-gray-700">

                    <div>
                        <p className="text-sm text-gray-500">Última consulta</p>
                        <p className="font-medium">{ultimaConsulta.fecha}</p>
                    </div>

                    <div>
                        <p className="text-sm text-gray-500">Diagnóstico vigente</p>
                        <p className="font-medium">{diagnosticoVigente || "—"}</p>
                    </div>

                    <div>
                        <p className="text-sm text-gray-500">Peso actual</p>
                        <p className="font-medium">
                            {pesoActual !== null ? `${pesoActual} kg` : "—"}
                            {tendenciaPeso && (
                                <span className="ml-1 text-gray-500">
                                    {ICONO_TENDENCIA[tendenciaPeso]}
                                </span>
                            )}
                        </p>
                    </div>

                    <div>
                        <p className="text-sm text-gray-500">Consultas registradas</p>
                        <p className="font-medium">{totalConsultas}</p>
                    </div>

                    {tratamientoVigente && (
                        <div className="col-span-2 md:col-span-4">
                            <p className="text-sm text-gray-500">Tratamiento vigente</p>
                            <p className="font-medium">{tratamientoVigente}</p>
                        </div>
                    )}

                    <div className="col-span-2 md:col-span-4">
                        <p className="text-sm text-gray-500">Próxima acción pendiente</p>
                        <div className="flex items-center justify-between gap-3">
                            <p className="font-medium">
                                {proximaAccion
                                    ? `${proximaAccion.tipo} — ${proximaAccion.fecha}`
                                    : "Sin pendientes registrados"}
                            </p>
                            {proximaAccion && (
                                <BotonAgregarCalendar
                                    titulo={`${proximaAccion.tipo} - ${nombreMascota || "Mascota"}`}
                                    fecha={proximaAccion.fecha}
                                    detalles={`Próxima acción de ${nombreMascota || "la mascota"} en VetCare.`}
                                />
                            )}
                        </div>
                    </div>

                </div>
            )}

        </div>
    );

}
