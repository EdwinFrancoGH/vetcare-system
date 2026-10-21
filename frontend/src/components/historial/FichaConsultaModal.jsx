"use client";

import BotonAgregarCalendar from "../ui/BotonAgregarCalendar";

// Ficha clínica de una consulta puntual del historial. Se abre al hacer
// clic sobre una fila de HistorialTable (ver HistorialRow / HistorialTable)
// y muestra todos los campos de la consulta en formato de lectura, con
// accesos directos para editar o cerrar.
export default function FichaConsultaModal({
    open,
    historial,
    mascota,
    onClose,
    onEditar,
}) {

    if (!open || !historial) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">

            <div className="w-full max-w-2xl rounded-xl bg-white shadow-2xl max-h-[90vh] overflow-y-auto">

                {/* Encabezado */}
                <div className="flex items-start justify-between border-b px-6 py-4">

                    <div>
                        <h2 className="text-xl font-bold text-gray-800">
                            Ficha de Consulta
                        </h2>
                        <p className="text-sm text-gray-500 mt-1">
                            {mascota?.nombre || "—"}
                            {mascota?.propietario ? ` · Propietario: ${mascota.propietario}` : ""}
                        </p>
                    </div>

                    <button
                        onClick={onClose}
                        aria-label="Cerrar"
                        className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
                    >
                        &times;
                    </button>

                </div>

                {/* Contenido */}
                <div className="px-6 py-5 space-y-5 text-gray-700">

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">

                        <div>
                            <p className="text-sm text-gray-500">Fecha de la consulta</p>
                            <p className="font-medium">{historial.fecha || "—"}</p>
                        </div>

                        <div>
                            <p className="text-sm text-gray-500">Veterinario</p>
                            <p className="font-medium">{historial.veterinario || "—"}</p>
                        </div>

                        <div>
                            <p className="text-sm text-gray-500">Peso</p>
                            <p className="font-medium">
                                {historial.peso !== undefined && historial.peso !== "" ? `${historial.peso} kg` : "—"}
                            </p>
                        </div>

                    </div>

                    <div>
                        <p className="text-sm text-gray-500">Motivo de la consulta</p>
                        <p className="font-medium">{historial.motivoConsulta || "—"}</p>
                    </div>

                    <div>
                        <p className="text-sm text-gray-500">Diagnóstico</p>
                        <p className="font-medium whitespace-pre-line">{historial.diagnostico || "—"}</p>
                    </div>

                    {historial.tratamiento && (
                        <div>
                            <p className="text-sm text-gray-500">Tratamiento</p>
                            <p className="font-medium whitespace-pre-line">{historial.tratamiento}</p>
                        </div>
                    )}

                    {historial.observaciones && (
                        <div>
                            <p className="text-sm text-gray-500">Observaciones</p>
                            <p className="font-medium whitespace-pre-line">{historial.observaciones}</p>
                        </div>
                    )}

                    <div>
                        <p className="text-sm text-gray-500">Próxima cita sugerida</p>
                        <div className="flex items-center justify-between gap-3">
                            <p className="font-medium">{historial.proximaCita || "Sin próxima cita registrada"}</p>
                            {historial.proximaCita && (
                                <BotonAgregarCalendar
                                    titulo={`Seguimiento - ${mascota?.nombre || "Mascota"}`}
                                    fecha={historial.proximaCita}
                                    detalles={`Cita de seguimiento de ${mascota?.nombre || "la mascota"} en VetCare.`}
                                />
                            )}
                        </div>
                    </div>

                </div>

                {/* Botones */}
                <div className="flex justify-end gap-3 border-t px-6 py-4">

                    <button
                        onClick={onClose}
                        className="rounded-lg border border-gray-300 px-4 py-2 transition hover:bg-gray-100"
                    >
                        Cerrar
                    </button>

                    <button
                        onClick={() => onEditar(historial)}
                        className="rounded-lg bg-yellow-500 px-4 py-2 text-white transition hover:bg-yellow-600"
                    >
                        Editar consulta
                    </button>

                </div>

            </div>

        </div>
    );

}
