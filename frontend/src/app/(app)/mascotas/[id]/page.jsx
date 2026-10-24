"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { FaNotesMedical, FaHistory } from "react-icons/fa";
import Swal from "sweetalert2";

import { obtenerMascota } from "../../../../services/mascotas.service";
import { obtenerHistorialesPorMascota } from "../../../../services/historial.service";
import { obtenerVacunasPorMascota } from "../../../../services/vacunas.service";
import { construirLineaTiempo, generarResumenClinico } from "../../../../utils/clinico";
import {
    calcularPendientes,
    clasificarEstadoPaciente,
    detectarConsultasFrecuentes,
    DIAS_VENTANA_FRECUENCIA,
} from "../../../../utils/estadoClinico";
import { useAuth } from "../../../../context/AuthContext";

import ResumenClinico from "../../../../components/historial/ResumenClinico";
import GraficaPeso from "../../../../components/historial/GraficaPeso";
import LineaTiempoClinica from "../../../../components/historial/LineaTiempoClinica";
import AlertasPendientes from "../../../../components/historial/AlertasPendientes";
import MascotaForm from "../../../../components/mascotas/MascotaForm";
import RequireRole from "../../../../components/auth/RequireRole";

import FichaEncabezado from "../../../../components/mascotas/ficha/FichaEncabezado";
import FichaEstadisticas from "../../../../components/mascotas/ficha/FichaEstadisticas";
import FichaContacto from "../../../../components/mascotas/ficha/FichaContacto";
import FichaPestanas from "../../../../components/mascotas/ficha/FichaPestanas";
import CarnetVacunas from "../../../../components/mascotas/ficha/CarnetVacunas";

function FichaMascotaPage() {
    const { id } = useParams();
    const { userRole } = useAuth();
    const esCliente = userRole === "Cliente";

    const [mascota, setMascota] = useState(null);
    const [historiales, setHistoriales] = useState([]);
    const [vacunas, setVacunas] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [tabActiva, setTabActiva] = useState("resumen");
    const [mostrarModalEditar, setMostrarModalEditar] = useState(false);

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
            if (![403, 404].includes(error.response?.status)) {
                Swal.fire("Error", "No se pudieron cargar los datos. Verifica tu conexión e inténtalo de nuevo.", "error");
            }
        } finally {
            setCargando(false);
        }
    }

    if (cargando) {
        return (
            <div className="py-12 text-center text-gray-500">
                <p>Cargando ficha de la mascota...</p>
            </div>
        );
    }

    if (!mascota) {
        return (
            <div className="py-8">
                <Link href="/mascotas" className="text-blue-700 hover:underline font-medium">
                    &larr; {esCliente ? "Volver a Mis Mascotas" : "Volver a Mascotas"}
                </Link>
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center mt-6">
                    <p className="text-gray-700 font-semibold text-lg">Mascota no encontrada</p>
                    <p className="text-gray-500 text-sm mt-1">
                        La mascota solicitada no existe o no tienes permisos para verla.
                    </p>
                </div>
            </div>
        );
    }

    const { vencidos, proximos } = calcularPendientes(historiales, vacunas);
    const estadoClinico = clasificarEstadoPaciente(historiales, vacunas);
    const frecuencia = detectarConsultasFrecuentes(historiales);
    const resumenClinicoData = generarResumenClinico(historiales, vacunas);

    return (
        <div className="space-y-6">
            <div className="hidden print:block mb-4 pb-2 border-b border-gray-300">
                <h1 className="text-2xl font-bold text-gray-900">
                    VetCare — Carnet de vacunas
                </h1>
                <p className="text-sm text-gray-600 mt-1">
                    Paciente: {mascota.nombre} · {mascota.especie} · Propietario: {mascota.propietario}
                </p>
            </div>

            <div className="print:hidden">
                <Link
                    href="/mascotas"
                    className="inline-flex items-center text-sm font-semibold text-blue-700 hover:text-blue-900 transition"
                >
                    &larr; {esCliente ? "Volver a Mis Mascotas" : "Volver a Mascotas"}
                </Link>
            </div>

            <FichaEncabezado
                mascota={mascota}
                esCliente={esCliente}
                estadoClinico={estadoClinico}
                onEditar={() => setMostrarModalEditar(true)}
            />

            <FichaEstadisticas
                mascota={mascota}
                resumenClinico={resumenClinicoData}
                vacunas={vacunas}
            />

            <FichaContacto mascota={mascota} />

            <FichaPestanas
                tabActiva={tabActiva}
                setTabActiva={setTabActiva}
                totalHistorial={historiales.length}
                totalVacunas={vacunas.length}
                tieneAlertas={vencidos.length > 0 || proximos.length > 0}
            />

            {tabActiva === "resumen" && (
                <div className="space-y-6 print:hidden">
                    <AlertasPendientes
                        vencidos={vencidos}
                        proximos={proximos}
                        nombreMascota={mascota.nombre}
                    />

                    {!esCliente && frecuencia.esFrecuente && (
                        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-2xl p-4">
                            <p className="font-semibold text-sm">
                                ⚠ Consultas frecuentes detectadas
                            </p>
                            <p className="text-xs mt-1">
                                {frecuencia.cantidad} consultas en los últimos {DIAS_VENTANA_FRECUENCIA} días.
                                Podría requerir seguimiento especial.
                            </p>
                        </div>
                    )}

                    {historiales.length === 0 ? (
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center flex flex-col items-center">
                            <div className="w-14 h-14 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
                                <FaNotesMedical className="w-6 h-6" />
                            </div>
                            <h3 className="font-bold text-gray-800 text-base mb-1">
                                Sin consultas registradas
                            </h3>
                            <p className="text-sm text-gray-500 max-w-md">
                                Aún no hay consultas clínicas registradas para {mascota.nombre}.
                            </p>
                        </div>
                    ) : (
                        <>
                            <ResumenClinico
                                resumen={resumenClinicoData}
                                nombreMascota={mascota.nombre}
                            />
                            <GraficaPeso historiales={historiales} />
                        </>
                    )}
                </div>
            )}

            {tabActiva === "historial" && (
                <div className="space-y-6 print:hidden">
                    {historiales.length === 0 && (!esCliente ? vacunas.length === 0 : true) ? (
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center flex flex-col items-center">
                            <div className="w-14 h-14 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
                                <FaHistory className="w-6 h-6" />
                            </div>
                            <h3 className="font-bold text-gray-800 text-base mb-1">
                                Sin historial registrado
                            </h3>
                            <p className="text-sm text-gray-500 max-w-md">
                                No se han registrado consultas médicas para {mascota.nombre} todavía.
                            </p>
                        </div>
                    ) : (
                        <LineaTiempoClinica eventos={construirLineaTiempo(historiales, vacunas)} />
                    )}
                </div>
            )}

            <CarnetVacunas
                vacunas={vacunas}
                nombreMascota={mascota.nombre}
                tabActiva={tabActiva}
            />

            {mostrarModalEditar && (
                <MascotaForm
                    mascota={mascota}
                    onClose={() => setMostrarModalEditar(false)}
                    onSuccess={async () => {
                        setMostrarModalEditar(false);
                        await cargarFicha();
                    }}
                />
            )}
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
