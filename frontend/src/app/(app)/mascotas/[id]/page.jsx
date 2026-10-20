"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { obtenerMascota } from "../../../../services/mascotas.service";
import { obtenerHistorialesPorMascota } from "../../../../services/historial.service";
import { obtenerVacunasPorMascota } from "../../../../services/vacunas.service";
import { construirLineaTiempo, generarResumenClinico } from "../../../../utils/clinico";
import {
    calcularPendientes,
    clasificarEstadoPaciente,
    detectarConsultasFrecuentes,
    DIAS_VENTANA_FRECUENCIA,
    ultimaDosisPorVacuna,
} from "../../../../utils/estadoClinico";
import ResumenClinico from "../../../../components/historial/ResumenClinico";
import GraficaPeso from "../../../../components/historial/GraficaPeso";
import LineaTiempoClinica from "../../../../components/historial/LineaTiempoClinica";
import AlertasPendientes from "../../../../components/historial/AlertasPendientes";
import RequireRole from "../../../../components/auth/RequireRole";
import { useAuth } from "../../../../context/AuthContext";
import { hoyISO, sumarDiasISO, formatearFechaCorta } from "../../../../utils/citas";
import Swal from "sweetalert2";

const COLOR_ESTADO_CLINICO = {
    "Crítico": "bg-red-100 text-red-800",
    "En seguimiento": "bg-orange-100 text-orange-800",
    "Estable": "bg-green-100 text-green-800",
    "Sin historial": "bg-gray-100 text-gray-600",
};

// Ficha de mascota: une los datos básicos de la mascota con su
// historial clínico y sus vacunas. Es la base sobre la que se van a
// construir la línea de tiempo clínica y el resumen automático.
function FichaMascotaPage() {

    const { id } = useParams();
    const { userRole } = useAuth();
    const esCliente = userRole === "Cliente";

    const [mascota, setMascota] = useState(null);
    const [historiales, setHistoriales] = useState([]);
    const [vacunas, setVacunas] = useState([]);
    const [cargando, setCargando] = useState(true);

    useEffect(() => {

        if (id) {
            cargarFicha();
        }

    }, [id]);

    async function cargarFicha() {

        try {

            const [respMascota, respHistoriales, respVacunas] = await Promise.all([
                obtenerMascota(id),
                obtenerHistorialesPorMascota(id),
                obtenerVacunasPorMascota(id),
            ]);

            setMascota(respMascota.data.data);

            const historialOrdenado = [...respHistoriales.data.historiales].sort(
                (a, b) => new Date(b.fecha) - new Date(a.fecha)
            );
            setHistoriales(historialOrdenado);

            const vacunasOrdenadas = [...respVacunas.data.data].sort(
                (a, b) => new Date(b.fecha) - new Date(a.fecha)
            );
            setVacunas(vacunasOrdenadas);

        } catch (error) {

            console.error("Error al cargar la ficha de la mascota:", error);
            // Si el backend responde 403 o 404 (mascota que no es suya o no existe), no mostrar alerta de conexión
            if (![403, 404].includes(error.response?.status)) {
                Swal.fire("Error", "No se pudieron cargar los datos. Verifica tu conexión e inténtalo de nuevo.", "error");
            }

        } finally {

            setCargando(false);

        }

    }

    if (cargando) {
        return <p className="text-gray-600">Cargando ficha...</p>;
    }

    if (!mascota) {
        return (
            <div>
                <Link href="/mascotas" className="text-blue-700 hover:underline">
                    &larr; {esCliente ? "Volver a Mis Mascotas" : "Volver a Mascotas"}
                </Link>
                <p className="text-gray-600 mt-4">Mascota no encontrada.</p>
            </div>
        );
    }

    const { vencidos, proximos } = calcularPendientes(historiales, vacunas);
    const estadoClinico = clasificarEstadoPaciente(historiales, vacunas);
    const frecuencia = detectarConsultasFrecuentes(historiales);

    return (

        <div>

            <Link href="/mascotas" className="text-blue-700 hover:underline">
                &larr; {esCliente ? "Volver a Mis Mascotas" : "Volver a Mascotas"}
            </Link>

            <div className="bg-white rounded-xl shadow p-6 my-6">

                <div className="flex justify-between items-start">

                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">{mascota.nombre}</h1>
                        <p className="text-gray-600 mt-1">
                            {mascota.especie} · {mascota.raza} · {mascota.sexo}
                        </p>
                    </div>

                    <div className="flex flex-col items-end gap-2">

                        <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                            {mascota.estado}
                        </span>

                        {!esCliente && (
                            <span
                                title="Estado clínico calculado a partir de pendientes vencidos y próximos"
                                className={`px-3 py-1 rounded-full text-sm font-medium ${COLOR_ESTADO_CLINICO[estadoClinico]}`}
                            >
                                Estado clínico: {estadoClinico}
                            </span>
                        )}

                    </div>

                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 text-gray-700">

                    <div>
                        <p className="text-sm text-gray-500">Propietario</p>
                        <p className="font-medium">{mascota.propietario}</p>
                    </div>

                    <div>
                        <p className="text-sm text-gray-500">Teléfono</p>
                        <p className="font-medium">{mascota.telefono}</p>
                    </div>

                    <div>
                        <p className="text-sm text-gray-500">Edad</p>
                        <p className="font-medium">{mascota.edad} años</p>
                    </div>

                    <div>
                        <p className="text-sm text-gray-500">Peso registrado</p>
                        <p className="font-medium">{mascota.peso} kg</p>
                    </div>

                </div>

            </div>

            <div className="space-y-6">

                <AlertasPendientes
                    vencidos={vencidos}
                    proximos={proximos}
                    nombreMascota={mascota.nombre}
                />

                {!esCliente && frecuencia.esFrecuente && (
                    <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-lg p-4">
                        <p className="font-semibold">
                            ⚠ Consultas frecuentes detectadas
                        </p>
                        <p className="text-sm">
                            {frecuencia.cantidad} consultas en los últimos {DIAS_VENTANA_FRECUENCIA} días.
                            Podría requerir seguimiento especial.
                        </p>
                    </div>
                )}

                {/* Si es Cliente y no hay historial, mostrar aviso claro en lugar de secciones vacías */}
                {esCliente && historiales.length === 0 ? (
                    <div className="bg-white rounded-xl shadow p-6">
                        <h2 className="text-xl font-bold text-gray-800 mb-2">
                            Historial Clínico
                        </h2>
                        <p className="text-gray-500">
                            Aún no hay consultas registradas para {mascota.nombre}.
                        </p>
                    </div>
                ) : (
                    <>
                        <ResumenClinico
                            resumen={generarResumenClinico(historiales, vacunas)}
                            nombreMascota={mascota.nombre}
                        />

                        <GraficaPeso historiales={historiales} />
                    </>
                )}

                {/* Carnet de vacunas para el Cliente (antes de la línea de tiempo) */}
                {esCliente && (
                    <div className="bg-white rounded-xl shadow p-6">
                        <h2 className="text-xl font-bold text-gray-800 mb-4">
                            Carnet de vacunas
                        </h2>

                        {vacunas.length === 0 ? (
                            <p className="text-gray-500">
                                Aún no hay vacunas registradas para {mascota.nombre}.
                            </p>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="min-w-full text-left">
                                    <thead className="bg-blue-900 text-white">
                                        <tr>
                                            <th className="p-4">Vacuna</th>
                                            <th className="p-4">Fecha de aplicación</th>
                                            <th className="p-4">Próxima dosis</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {(() => {
                                            const idsUltimaDosis = new Set(
                                                ultimaDosisPorVacuna(vacunas).map((v) => v.id)
                                            );
                                            const hoy = hoyISO();
                                            const limite30Dias = sumarDiasISO(hoy, 30);

                                            return vacunas.map((vacuna) => {
                                                const fechaProx = (vacuna.proximaFecha || "").slice(0, 10);
                                                const esUltimaDosis = idsUltimaDosis.has(vacuna.id);
                                                const esVencida = fechaProx && fechaProx < hoy;
                                                const esProxima = fechaProx && fechaProx >= hoy && fechaProx <= limite30Dias;

                                                return (
                                                    <tr key={vacuna.id} className="hover:bg-gray-50 text-gray-900">
                                                        <td className="p-4 font-medium">{vacuna.nombre}</td>
                                                        <td className="p-4">{formatearFechaCorta(vacuna.fecha)}</td>
                                                        <td className="p-4">
                                                            {vacuna.proximaFecha ? (
                                                                esUltimaDosis ? (
                                                                    <span
                                                                        className={
                                                                            esVencida
                                                                                ? "text-red-700 bg-red-100 px-2.5 py-1 rounded-full text-sm font-semibold"
                                                                                : esProxima
                                                                                ? "text-amber-800 bg-amber-100 px-2.5 py-1 rounded-full text-sm font-semibold"
                                                                                : "text-gray-700 font-medium"
                                                                        }
                                                                    >
                                                                        {formatearFechaCorta(vacuna.proximaFecha)}
                                                                    </span>
                                                                ) : (
                                                                    <span className="text-gray-400 text-sm">
                                                                        {formatearFechaCorta(vacuna.proximaFecha)} (refuerzo aplicado)
                                                                    </span>
                                                                )
                                                            ) : (
                                                                <span className="text-gray-400">—</span>
                                                            )}
                                                        </td>
                                                    </tr>
                                                );
                                            });
                                        })()}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}

                {/* Línea de tiempo clínica: el personal siempre la ve; el cliente la ve cuando hay historial */}
                {(!esCliente || historiales.length > 0) && (
                    <LineaTiempoClinica eventos={construirLineaTiempo(historiales, vacunas)} />
                )}

            </div>

        </div>

    );

}

export default function FichaMascotaPageGuard() {
    return (
        <RequireRole roles={["Administrador", "Recepcionista", "Veterinario", "Cliente"]}>
            <FichaMascotaPage />
        </RequireRole>
    );
}
