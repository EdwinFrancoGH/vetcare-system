"use client";

import { FaBirthdayCake, FaWeightHanging, FaFileMedical, FaSyringe } from "react-icons/fa";
import { formatearEdad, formatearFechaCorta, hoyISO, sumarDiasISO } from "../../../utils/citas";
import { ultimaDosisPorVacuna } from "../../../utils/estadoClinico";

export default function FichaEstadisticas({ mascota, resumenClinico, vacunas = [] }) {
    const edadTexto = formatearEdad(mascota.fechaNacimiento, mascota.edad);
    const fechaNacSub = mascota.fechaNacimiento
        ? `Nac: ${formatearFechaCorta(mascota.fechaNacimiento)}`
        : "Sin fecha registrada";

    let pesoValor = resumenClinico?.pesoActual;
    let tendencia = resumenClinico?.tendenciaPeso;

    if (pesoValor === null || pesoValor === undefined) {
        pesoValor = mascota.peso !== undefined && mascota.peso !== null && mascota.peso !== "" ? mascota.peso : null;
    } else if (resumenClinico?.pesoAnterior === null && mascota.peso !== undefined && mascota.peso !== null && mascota.peso !== "") {
        const dif = Number(pesoValor) - Number(mascota.peso);
        if (Math.abs(dif) >= 0.05) {
            tendencia = dif > 0 ? "sube" : "baja";
        }
    }

    const ultConsulta = resumenClinico?.ultimaConsulta;
    const ultConsultaFecha = ultConsulta?.fecha ? formatearFechaCorta(ultConsulta.fecha) : "Sin consultas";
    const ultConsultaSub = ultConsulta?.motivoConsulta || ultConsulta?.diagnostico || (ultConsulta ? "Consulta registrada" : "Ninguna consulta aún");

    const vacunasFiltradas = ultimaDosisPorVacuna(vacunas);
    const vacunasConProx = vacunasFiltradas
        .filter((v) => !!v.proximaFecha)
        .sort((a, b) => (a.proximaFecha || "").slice(0, 10).localeCompare((b.proximaFecha || "").slice(0, 10)));

    const hoy = hoyISO();
    const limite30 = sumarDiasISO(hoy, 30);

    let proxVacunaTexto = "Al día ✓";
    let proxVacunaSub = "Sin vacunas pendientes";
    let proxVacunaColor = "text-emerald-600";

    if (vacunasConProx.length > 0) {
        const proxV = vacunasConProx[0];
        const pFecha = (proxV.proximaFecha || "").slice(0, 10);
        const esVencida = pFecha < hoy;
        const esProxima = pFecha >= hoy && pFecha <= limite30;

        proxVacunaTexto = proxV.nombre || "Vacuna";

        if (esVencida) {
            proxVacunaColor = "text-red-600 font-bold";
            proxVacunaSub = `Venció: ${formatearFechaCorta(pFecha)}`;
        } else if (esProxima) {
            proxVacunaColor = "text-amber-600 font-bold";
            proxVacunaSub = `Próx: ${formatearFechaCorta(pFecha)}`;
        } else {
            proxVacunaColor = "text-gray-900 font-semibold";
            proxVacunaSub = formatearFechaCorta(pFecha);
        }
    }

    return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 print:hidden">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-5 flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                    <FaBirthdayCake className="w-5 h-5" />
                </div>
                <div className="min-w-0 flex-1">
                    <p className="text-xs text-gray-500 font-medium">Edad</p>
                    <p className="text-base sm:text-lg font-bold text-gray-900 truncate">
                        {edadTexto}
                    </p>
                    <p className="text-[11px] text-gray-400 truncate">
                        {fechaNacSub}
                    </p>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-5 flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                    <FaWeightHanging className="w-5 h-5" />
                </div>
                <div className="min-w-0 flex-1">
                    <p className="text-xs text-gray-500 font-medium">Peso actual</p>
                    <p className="text-base sm:text-lg font-bold text-gray-900 truncate">
                        {pesoValor !== null ? `${pesoValor} kg` : "—"}
                        {tendencia === "sube" && (
                            <span className="ml-1 text-emerald-600 font-bold" title="Subió de peso">↑</span>
                        )}
                        {tendencia === "baja" && (
                            <span className="ml-1 text-red-500 font-bold" title="Bajó de peso">↓</span>
                        )}
                        {tendencia === "estable" && (
                            <span className="ml-1 text-gray-400 font-bold" title="Peso estable">→</span>
                        )}
                    </p>
                    <p className="text-[11px] text-gray-400 truncate">
                        {tendencia === "sube"
                            ? "Aumentó peso"
                            : tendencia === "baja"
                            ? "Disminuyó peso"
                            : "Peso registrado"}
                    </p>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-5 flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center shrink-0">
                    <FaFileMedical className="w-5 h-5" />
                </div>
                <div className="min-w-0 flex-1">
                    <p className="text-xs text-gray-500 font-medium">Última consulta</p>
                    <p className="text-base sm:text-lg font-bold text-gray-900 truncate">
                        {ultConsultaFecha}
                    </p>
                    <p className="text-[11px] text-gray-400 truncate">
                        {ultConsultaSub}
                    </p>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-5 flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                    <FaSyringe className="w-5 h-5" />
                </div>
                <div className="min-w-0 flex-1">
                    <p className="text-xs text-gray-500 font-medium">Próxima vacuna</p>
                    <p className={`text-base sm:text-lg font-bold truncate ${proxVacunaColor}`}>
                        {proxVacunaTexto}
                    </p>
                    <p className="text-[11px] text-gray-400 truncate">
                        {proxVacunaSub}
                    </p>
                </div>
            </div>
        </div>
    );
}
