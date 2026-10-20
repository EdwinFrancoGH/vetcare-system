"use client";

import { useEffect, useState } from "react";
import Swal from "sweetalert2";
import { obtenerMascotas } from "../../../services/mascotas.service";
import { obtenerVacunasPorMascota } from "../../../services/vacunas.service";
import { obtenerCitasPorMascota, cancelarCita } from "../../../services/citas.service";
import { ultimaDosisPorVacuna } from "../../../utils/estadoClinico";
import {
    formatearFechaLarga,
    formatearFechaCorta,
    esCitaProxima,
    hoyISO,
    sumarDiasISO,
} from "../../../utils/citas";
import { useAuth } from "../../../context/AuthContext";
import useRecordatoriosCliente from "../../../hooks/useRecordatoriosCliente";

import BienvenidaCliente from "./BienvenidaCliente";
import TarjetasResumen from "./TarjetasResumen";
import MisMascotasResumen from "./MisMascotasResumen";
import ListaRecordatorios from "./ListaRecordatorios";
import TablaProximasCitas from "./TablaProximasCitas";
import TablaCitasAnteriores from "./TablaCitasAnteriores";

export default function DashboardCliente() {
    const { userData } = useAuth();
    const { recordatorios, recargar: recargarRecordatorios } = useRecordatoriosCliente();

    const [mascotas, setMascotas] = useState([]);
    const [vacunas, setVacunas] = useState([]);
    const [proximas, setProximas] = useState([]);
    const [anteriores, setAnteriores] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState(null);
    const [filtroMascota, setFiltroMascota] = useState("");
    const [mostrarTodasAnteriores, setMostrarTodasAnteriores] = useState(false);
    const [cancelandoId, setCancelandoId] = useState(null);

    useEffect(() => {
        cargarDatos();
    }, []);

    async function cargarDatos() {
        try {
            const respMascotas = await obtenerMascotas();
            const misMascotas = respMascotas.data.data || [];
            setMascotas(misMascotas);

            const [citasResultados, vacunasResultados] = await Promise.all([
                Promise.allSettled(misMascotas.map((m) => obtenerCitasPorMascota(m.id))),
                Promise.allSettled(misMascotas.map((m) => obtenerVacunasPorMascota(m.id))),
            ]);

            const todasLasCitas = citasResultados
                .filter((r) => r.status === "fulfilled")
                .flatMap((r) => r.value.data.data || []);

            const todasLasVacunas = vacunasResultados
                .filter((r) => r.status === "fulfilled")
                .flatMap((r) => r.value.data.data || []);

            setVacunas(todasLasVacunas);

            const citasProximas = todasLasCitas
                .filter((c) => esCitaProxima(c))
                .sort((a, b) => `${a.fecha} ${a.hora}`.localeCompare(`${b.fecha} ${b.hora}`));

            const citasAnteriores = todasLasCitas
                .filter((c) => !esCitaProxima(c))
                .sort((a, b) => `${b.fecha} ${b.hora}`.localeCompare(`${a.fecha} ${a.hora}`));

            setProximas(citasProximas);
            setAnteriores(citasAnteriores);
        } catch (err) {
            console.error("Error al cargar el panel del cliente:", err);
            setError(
                err.response
                    ? err.response.data?.message || `Error del servidor (${err.response.status}).`
                    : "No se pudo conectar con el servidor. Verifica que el backend esté corriendo."
            );
        } finally {
            setCargando(false);
        }
    }

    const nombreMascota = (id) => mascotas.find((m) => m.id === id)?.nombre || "—";

    async function handleCancelarCita(cita) {
        const nombre = nombreMascota(cita.mascotaId);
        const fechaLarga = formatearFechaLarga(cita.fecha);

        const confirmacion = await Swal.fire({
            title: "¿Cancelar cita?",
            text: `¿Cancelar la cita de ${nombre} del ${fechaLarga} a las ${cita.hora}?`,
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#dc2626",
            cancelButtonColor: "#6b7280",
            confirmButtonText: "Sí, cancelar",
            cancelButtonText: "No",
        });

        if (!confirmacion.isConfirmed) return;

        try {
            setCancelandoId(cita.id);
            await cancelarCita(cita.id);
            await Swal.fire("¡Cancelada!", "La cita ha sido cancelada exitosamente.", "success");
            await cargarDatos();
            await recargarRecordatorios();
        } catch (err) {
            console.error("Error al cancelar la cita:", err);
            Swal.fire(
                "Error",
                err.response?.data?.message || "No se pudo cancelar la cita. Inténtalo de nuevo.",
                "error"
            );
        } finally {
            setCancelandoId(null);
        }
    }

    const hoy = hoyISO();
    const limite30Dias = sumarDiasISO(hoy, 30);
    const primeraCitaProxima = proximas[0] || null;

    const vacunasUltimaDosis = ultimaDosisPorVacuna(vacunas);
    const vacunasVencidas = vacunasUltimaDosis.filter((v) => {
        const pFecha = (v.proximaFecha || "").slice(0, 10);
        return pFecha && pFecha < hoy;
    });
    const vacunasPorVencer = vacunasUltimaDosis.filter((v) => {
        const pFecha = (v.proximaFecha || "").slice(0, 10);
        return pFecha && pFecha >= hoy && pFecha <= limite30Dias;
    });
    const totalVacunasPendientes = vacunasVencidas.length + vacunasPorVencer.length;

    function getProximaVacunaMascota(mascotaId) {
        const deEstaMascota = vacunasUltimaDosis
            .filter((v) => v.mascotaId === mascotaId && v.proximaFecha)
            .sort((a, b) => (a.proximaFecha || "").slice(0, 10).localeCompare((b.proximaFecha || "").slice(0, 10)));

        if (deEstaMascota.length === 0) {
            return {
                texto: "Sin vacunas pendientes",
                clase: "text-gray-500",
                vacuna: null,
                esVencida: false,
            };
        }

        const prox = deEstaMascota[0];
        const fechaCorta = formatearFechaCorta(prox.proximaFecha);
        const pFecha = (prox.proximaFecha || "").slice(0, 10);
        const esVencida = pFecha < hoy;

        if (esVencida) {
            return {
                texto: `Próxima vacuna: ${prox.nombre} – ${fechaCorta}`,
                clase: "text-red-700 font-semibold",
                vacuna: prox,
                esVencida: true,
            };
        }

        if (pFecha <= limite30Dias) {
            return {
                texto: `Próxima vacuna: ${prox.nombre} – ${fechaCorta}`,
                clase: "text-amber-800 font-semibold",
                vacuna: prox,
                esVencida: false,
            };
        }

        return {
            texto: `Próxima vacuna: ${prox.nombre} – ${fechaCorta}`,
            clase: "text-gray-700 font-medium",
            vacuna: prox,
            esVencida: false,
        };
    }

    return (
        <div>
            {error && (
                <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
                    {error}
                </div>
            )}

            {cargando ? (
                <p className="text-gray-500">Cargando...</p>
            ) : (
                <div className="space-y-6">
                    <BienvenidaCliente
                        nombreUsuario={userData?.name}
                        primeraCitaProxima={primeraCitaProxima}
                    />

                    <TarjetasResumen
                        totalMascotas={mascotas.length}
                        totalProximas={proximas.length}
                        vacunasVencidas={vacunasVencidas}
                        vacunasPorVencer={vacunasPorVencer}
                        totalVacunasPendientes={totalVacunasPendientes}
                    />

                    <MisMascotasResumen
                        mascotas={mascotas}
                        getProximaVacunaMascota={getProximaVacunaMascota}
                    />

                    <ListaRecordatorios recordatorios={recordatorios} />

                    <TablaProximasCitas
                        proximas={proximas}
                        mascotas={mascotas}
                        filtroMascota={filtroMascota}
                        setFiltroMascota={setFiltroMascota}
                        handleCancelarCita={handleCancelarCita}
                        cancelandoId={cancelandoId}
                        nombreMascota={nombreMascota}
                    />

                    <TablaCitasAnteriores
                        anteriores={anteriores}
                        filtroMascota={filtroMascota}
                        mostrarTodasAnteriores={mostrarTodasAnteriores}
                        setMostrarTodasAnteriores={setMostrarTodasAnteriores}
                        nombreMascota={nombreMascota}
                    />
                </div>
            )}
        </div>
    );
}
