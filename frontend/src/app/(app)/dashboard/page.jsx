"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
    FaDog,
    FaCat,
    FaPaw,
    FaCalendarAlt,
    FaPlus,
    FaTimes,
    FaSyringe,
    FaCheckCircle,
    FaExclamationTriangle,
} from "react-icons/fa";
import { obtenerMascotas } from "../../../services/mascotas.service";
import { obtenerHistoriales } from "../../../services/historial.service";
import { obtenerVacunas, obtenerVacunasPorMascota } from "../../../services/vacunas.service";
import { obtenerCitasPorMascota, cancelarCita } from "../../../services/citas.service";
import { calcularAlertasGlobales, ultimaDosisPorVacuna } from "../../../utils/estadoClinico";
import {
    formatearFechaLarga,
    formatearFechaCorta,
    hoyISO,
    sumarDiasISO,
    COLOR_ESTADO_CITA,
    ETIQUETA_ESTADO_CITA,
} from "../../../utils/citas";
import BusquedaInteligente from "../../../components/dashboard/BusquedaInteligente";
import PanelAlertas from "../../../components/dashboard/PanelAlertas";
import RequireRole from "../../../components/auth/RequireRole";
import { useAuth } from "../../../context/AuthContext";
import Swal from "sweetalert2";

// Panel clínico: personal (Administrador / Recepcionista / Veterinario).
function Dashboard() {

    const [mascotas, setMascotas] = useState([]);
    const [historiales, setHistoriales] = useState([]);
    const [vacunas, setVacunas] = useState([]);
    const [cargando, setCargando] = useState(true);

    useEffect(() => {
        cargarDatos();
    }, []);

    async function cargarDatos() {

        try {

            const [respMascotas, respHistoriales, respVacunas] = await Promise.all([
                obtenerMascotas(),
                obtenerHistoriales(),
                obtenerVacunas(),
            ]);

            setMascotas(respMascotas.data.data);
            setHistoriales(respHistoriales.data.historiales);
            setVacunas(respVacunas.data.data);

        } catch (error) {

            console.error("Error al cargar el dashboard:", error);
            Swal.fire("Error", "No se pudieron cargar los datos. Verifica tu conexión e inténtalo de nuevo.", "error");

        } finally {

            setCargando(false);

        }

    }

    const alertas = calcularAlertasGlobales(mascotas, historiales, vacunas);

    return (

        <div>

            <h1 className="text-4xl font-bold text-gray-900">
                Dashboard
            </h1>

            <p className="mt-2 mb-6 text-gray-600">
                Bienvenido a VetCare.
            </p>

            {cargando ? (
                <p className="text-gray-500">Cargando...</p>
            ) : (
                <div className="space-y-6">

                    <BusquedaInteligente
                        mascotas={mascotas}
                        historiales={historiales}
                        vacunas={vacunas}
                    />

                    <PanelAlertas alertas={alertas} />

                </div>
            )}

        </div>

    );

}

// Panel del Cliente (dueño de mascota): sus mascotas, próximas citas y citas anteriores.
const ESTADOS_ACTIVOS = ["reservada", "confirmada"];

function getEspecieConfig(especie = "") {
    const esp = (especie || "").toLowerCase().trim();
    if (esp === "perro") {
        return {
            bg: "bg-blue-100 text-blue-700 border-blue-200",
            icon: <FaDog className="text-sm" />,
        };
    }
    if (esp === "gato") {
        return {
            bg: "bg-purple-100 text-purple-700 border-purple-200",
            icon: <FaCat className="text-sm" />,
        };
    }
    return {
        bg: "bg-gray-100 text-gray-700 border-gray-200",
        icon: <FaPaw className="text-sm" />,
    };
}

function DashboardCliente() {

    const { userData } = useAuth();

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

            const hoy = hoyISO();

            const todasLasCitas = citasResultados
                .filter((r) => r.status === "fulfilled")
                .flatMap((r) => r.value.data.data || []);

            const todasLasVacunas = vacunasResultados
                .filter((r) => r.status === "fulfilled")
                .flatMap((r) => r.value.data.data || []);

            setVacunas(todasLasVacunas);

            // Próximas citas: fecha >= hoy y en estado reservada o confirmada
            const citasProximas = todasLasCitas
                .filter((c) => ESTADOS_ACTIVOS.includes(c.estado) && c.fecha >= hoy)
                .sort((a, b) => `${a.fecha} ${a.hora}`.localeCompare(`${b.fecha} ${b.hora}`));

            // Citas anteriores: fecha < hoy o en estado cancelada / completada / perdida
            const citasAnteriores = todasLasCitas
                .filter((c) => c.fecha < hoy || c.estado === "cancelada" || c.estado === "completada" || c.estado === "perdida")
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
    const maniana = sumarDiasISO(hoy, 1);

    // Próxima cita para el encabezado
    const primeraCitaProxima = proximas[0] || null;

    // Solo la última dosis por vacuna cuenta para pendientes y recordatorios
    const vacunasUltimaDosis = ultimaDosisPorVacuna(vacunas);

    // Métricas de vacunas
    const vacunasVencidas = vacunasUltimaDosis.filter((v) => {
        const pFecha = (v.proximaFecha || "").slice(0, 10);
        return pFecha && pFecha < hoy;
    });
    const vacunasPorVencer = vacunasUltimaDosis.filter((v) => {
        const pFecha = (v.proximaFecha || "").slice(0, 10);
        return pFecha && pFecha >= hoy && pFecha <= limite30Dias;
    });
    const totalVacunasPendientes = vacunasVencidas.length + vacunasPorVencer.length;

    // Próxima vacuna por mascota
    function getProximaVacunaMascota(mascotaId) {
        const deEstaMascota = vacunasUltimaDosis
            .filter((v) => v.mascotaId === mascotaId && v.proximaFecha)
            .sort((a, b) => (a.proximaFecha || "").slice(0, 10).localeCompare((b.proximaFecha || "").slice(0, 10)));

        if (deEstaMascota.length === 0) {
            return {
                texto: "Sin vacunas pendientes",
                clase: "text-gray-500",
            };
        }

        const prox = deEstaMascota[0];
        const fechaCorta = formatearFechaCorta(prox.proximaFecha);
        const pFecha = (prox.proximaFecha || "").slice(0, 10);

        if (pFecha < hoy) {
            return {
                texto: `Próxima vacuna: ${prox.nombre} – ${fechaCorta}`,
                clase: "text-red-700 font-semibold",
            };
        }

        if (pFecha <= limite30Dias) {
            return {
                texto: `Próxima vacuna: ${prox.nombre} – ${fechaCorta}`,
                clase: "text-amber-800 font-semibold",
            };
        }

        return {
            texto: `Próxima vacuna: ${prox.nombre} – ${fechaCorta}`,
            clase: "text-gray-700 font-medium",
        };
    }

    // Recordatorios (2.5)
    const recordatorios = [];

    vacunasUltimaDosis.forEach((v) => {
        if (!v.proximaFecha) return;
        const nombre = nombreMascota(v.mascotaId);
        const fechaCorta = formatearFechaCorta(v.proximaFecha);
        const pFecha = (v.proximaFecha || "").slice(0, 10);

        if (pFecha < hoy) {
            recordatorios.push({
                id: `v-vencida-${v.id}`,
                fecha: v.proximaFecha,
                tipo: "vencida",
                mensaje: `La vacuna ${v.nombre} de ${nombre} venció el ${fechaCorta}`,
            });
        } else if (pFecha <= limite30Dias) {
            recordatorios.push({
                id: `v-porvencer-${v.id}`,
                fecha: v.proximaFecha,
                tipo: "por-vencer",
                mensaje: `La vacuna ${v.nombre} de ${nombre} vence el ${fechaCorta}`,
            });
        }
    });

    proximas.forEach((c) => {
        if (c.fecha === hoy) {
            recordatorios.push({
                id: `c-hoy-${c.id}`,
                fecha: c.fecha,
                tipo: "cita",
                mensaje: `Hoy tienes cita con ${c.veterinario} a las ${c.hora}`,
            });
        } else if (c.fecha === maniana) {
            recordatorios.push({
                id: `c-maniana-${c.id}`,
                fecha: c.fecha,
                tipo: "cita",
                mensaje: `Mañana tienes cita con ${c.veterinario} a las ${c.hora}`,
            });
        }
    });

    recordatorios.sort((a, b) => a.fecha.localeCompare(b.fecha));

    // Filtrado de tablas
    const proximasFiltradas = filtroMascota
        ? proximas.filter((c) => c.mascotaId === filtroMascota)
        : proximas;

    const anterioresFiltradas = filtroMascota
        ? anteriores.filter((c) => c.mascotaId === filtroMascota)
        : anteriores;

    const anterioresVisibles = mostrarTodasAnteriores
        ? anterioresFiltradas
        : anterioresFiltradas.slice(0, 10);

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

                    {/* 2.1 Encabezado de bienvenida */}
                    <div className="bg-gradient-to-r from-blue-700 to-blue-900 text-white rounded-2xl shadow-lg p-6 sm:p-8">
                        <h1 className="text-3xl sm:text-4xl font-bold">
                            Hola{userData?.name ? `, ${userData.name}` : ""}
                        </h1>
                        <p className="mt-2 text-blue-100 text-base sm:text-lg max-w-2xl">
                            {primeraCitaProxima
                                ? `Tu próxima cita es el ${formatearFechaLarga(primeraCitaProxima.fecha)} a las ${primeraCitaProxima.hora} con ${primeraCitaProxima.veterinario}.`
                                : "No tienes citas programadas. ¿Quieres agendar una?"}
                        </p>

                        <div className="flex flex-wrap gap-3 mt-6">
                            <Link
                                href="/mascotas"
                                className="flex items-center gap-2 bg-white text-blue-900 hover:bg-blue-50 font-medium px-4 py-2.5 rounded-lg shadow-sm transition text-sm"
                            >
                                <FaPlus className="text-xs" /> Registrar / gestionar mascotas
                            </Link>
                            <Link
                                href="/citas"
                                className="flex items-center gap-2 border border-white text-white hover:bg-white/10 font-medium px-4 py-2.5 rounded-lg transition text-sm"
                            >
                                <FaCalendarAlt className="text-xs" /> Agendar una cita
                            </Link>
                        </div>
                    </div>

                    {/* 2.2 Tres tarjetas de resumen */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-white rounded-xl shadow p-5 flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">
                                <FaDog className="text-2xl" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Mis mascotas</p>
                                <p className="text-3xl font-bold text-gray-900">{mascotas.length}</p>
                            </div>
                        </div>

                        <div className="bg-white rounded-xl shadow p-5 flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">
                                <FaCalendarAlt className="text-2xl" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Próximas citas</p>
                                <p className="text-3xl font-bold text-gray-900">{proximas.length}</p>
                            </div>
                        </div>

                        <div
                            className={`rounded-xl shadow p-5 flex items-center gap-4 border ${
                                vacunasVencidas.length > 0
                                    ? "bg-red-50 border-red-200 text-red-700"
                                    : vacunasPorVencer.length > 0
                                    ? "bg-amber-50 border-amber-200 text-amber-800"
                                    : "bg-green-50 border-green-200 text-green-700"
                            }`}
                        >
                            <div
                                className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                                    vacunasVencidas.length > 0
                                        ? "bg-red-100 text-red-700"
                                        : vacunasPorVencer.length > 0
                                        ? "bg-amber-100 text-amber-800"
                                        : "bg-green-100 text-green-700"
                                }`}
                            >
                                {totalVacunasPendientes === 0 ? (
                                    <FaCheckCircle className="text-2xl" />
                                ) : (
                                    <FaSyringe className="text-2xl" />
                                )}
                            </div>
                            <div>
                                <p className="text-sm font-medium opacity-90">Vacunas pendientes</p>
                                {totalVacunasPendientes === 0 ? (
                                    <p className="text-xl font-bold">Todo al día ✓</p>
                                ) : (
                                    <div className="flex items-baseline gap-2">
                                        <p className="text-3xl font-bold">{totalVacunasPendientes}</p>
                                        <span className="text-xs font-semibold">
                                            {vacunasVencidas.length > 0
                                                ? `(${vacunasVencidas.length} ${vacunasVencidas.length === 1 ? "vencida" : "vencidas"})`
                                                : `(${vacunasPorVencer.length} por vencer)`}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* 2.4 Sección "Mis mascotas" */}
                    <div className="space-y-3">
                        <div className="flex justify-between items-center">
                            <h2 className="text-xl font-bold text-gray-800">Mis mascotas</h2>
                            {mascotas.length > 0 && (
                                <Link
                                    href="/mascotas"
                                    className="text-sm font-semibold text-blue-700 hover:text-blue-900 transition"
                                >
                                    Ver todas ({mascotas.length}) &rarr;
                                </Link>
                            )}
                        </div>

                        {mascotas.length === 0 ? (
                            <div className="bg-white rounded-xl shadow p-8 text-center flex flex-col items-center">
                                <div className="w-16 h-16 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center mb-3">
                                    <FaPaw className="text-3xl" />
                                </div>
                                <p className="text-gray-700 font-semibold text-lg mb-1">
                                    Aún no has registrado mascotas
                                </p>
                                <p className="text-gray-500 text-sm mb-4">
                                    Registra a tu mascota para llevar el control de sus vacunas, citas e historial.
                                </p>
                                <Link
                                    href="/mascotas"
                                    className="bg-blue-700 hover:bg-blue-800 text-white text-sm font-medium px-5 py-2.5 rounded-lg shadow transition"
                                >
                                    Registrar mi primera mascota
                                </Link>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {mascotas.map((m) => {
                                    const espConfig = getEspecieConfig(m.especie);
                                    const pv = getProximaVacunaMascota(m.id);
                                    const inicial = m.nombre ? m.nombre.charAt(0).toUpperCase() : "?";

                                    return (
                                        <div
                                            key={m.id}
                                            className="bg-white rounded-xl shadow p-5 flex flex-col justify-between hover:shadow-md transition border border-gray-100"
                                        >
                                            <div>
                                                <div className="flex items-center gap-3 mb-3">
                                                    <div
                                                        className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg shrink-0 border ${espConfig.bg}`}
                                                    >
                                                        <span>{inicial}</span>
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <div className="flex items-center gap-1.5">
                                                            <h3 className="font-bold text-gray-900 truncate text-base">
                                                                {m.nombre}
                                                            </h3>
                                                            <span className="text-gray-400">
                                                                {espConfig.icon}
                                                            </span>
                                                        </div>
                                                        <p className="text-xs text-gray-500 truncate">
                                                            {m.especie} · {m.raza}
                                                        </p>
                                                        <p className="text-xs text-gray-400">
                                                            {m.edad} {m.edad === 1 ? "año" : "años"}
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="bg-gray-50 rounded-lg p-2.5 mb-4 text-xs">
                                                    <p className={pv.clase}>{pv.texto}</p>
                                                </div>
                                            </div>

                                            <div className="flex items-center justify-between gap-2 pt-3 border-t border-gray-100 text-xs font-semibold">
                                                <Link
                                                    href={`/mascotas/${m.id}`}
                                                    className="text-blue-700 hover:text-blue-900 hover:underline py-1"
                                                >
                                                    Ver ficha &rarr;
                                                </Link>
                                                <Link
                                                    href="/citas"
                                                    className="text-gray-600 hover:text-blue-700 py-1"
                                                >
                                                    Agendar cita
                                                </Link>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* 2.5 Sección "Recordatorios" (solo si hay algo) */}
                    {recordatorios.length > 0 && (
                        <div className="bg-white rounded-xl shadow p-5">
                            <h2 className="text-base sm:text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                                <FaExclamationTriangle className="text-amber-500" />
                                <span>Recordatorios</span>
                                <span className="text-xs font-normal text-gray-500">
                                    ({recordatorios.length})
                                </span>
                            </h2>
                            <div className="space-y-2">
                                {recordatorios.map((r) => (
                                    <div
                                        key={r.id}
                                        className={`p-3 rounded-lg border text-sm font-medium flex items-center gap-3 ${
                                            r.tipo === "vencida"
                                                ? "bg-red-50 border-red-200 text-red-800"
                                                : r.tipo === "por-vencer"
                                                ? "bg-amber-50 border-amber-200 text-amber-800"
                                                : "bg-blue-50 border-blue-200 text-blue-800"
                                        }`}
                                    >
                                        {r.tipo === "cita" ? (
                                            <FaCalendarAlt className="shrink-0 text-base" />
                                        ) : (
                                            <FaSyringe className="shrink-0 text-base" />
                                        )}
                                        <span>{r.mensaje}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Filtro por mascota: solo se muestra si el Cliente tiene más de una mascota */}
                    {mascotas.length > 1 && (
                        <div className="flex items-center gap-3 bg-white rounded-xl shadow p-4">
                            <label htmlFor="filtro-mascota" className="text-sm font-medium text-gray-700">
                                Filtrar por mascota:
                            </label>
                            <select
                                id="filtro-mascota"
                                value={filtroMascota}
                                onChange={(e) => setFiltroMascota(e.target.value)}
                                className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-800 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">Todas las mascotas</option>
                                {mascotas.map((m) => (
                                    <option key={m.id} value={m.id}>
                                        {m.nombre}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* Tabla: Mis próximas citas */}
                    <div className="bg-white rounded-xl shadow overflow-hidden">
                        <div className="px-5 py-4 border-b font-semibold text-gray-800">
                            Mis próximas citas
                        </div>

                        {proximasFiltradas.length === 0 ? (
                            <div className="p-8 text-center flex flex-col items-center">
                                <FaCalendarAlt className="text-4xl text-gray-300 mb-2" />
                                <p className="text-gray-500 mb-3">
                                    {filtroMascota
                                        ? "No hay citas próximas para esta mascota."
                                        : "No tienes citas próximas."}
                                </p>
                                <Link
                                    href="/citas"
                                    className="inline-flex items-center gap-2 bg-blue-700 hover:bg-blue-800 text-white text-sm font-medium px-4 py-2 rounded-lg transition shadow-sm"
                                >
                                    <FaCalendarAlt className="text-xs" /> Agendar una cita
                                </Link>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="min-w-full">
                                    <thead className="bg-blue-900 text-white">
                                        <tr>
                                            <th className="p-3 text-left">Fecha</th>
                                            <th className="p-3 text-left">Hora</th>
                                            <th className="p-3 text-left">Mascota</th>
                                            <th className="p-3 text-left">Veterinario</th>
                                            <th className="p-3 text-left">Estado</th>
                                            <th className="p-3 text-center">Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {proximasFiltradas.map((c) => (
                                            <tr key={c.id} className="border-b text-gray-900 hover:bg-gray-50">
                                                <td className="p-3 capitalize">{formatearFechaLarga(c.fecha)}</td>
                                                <td className="p-3">{c.hora}</td>
                                                <td className="p-3 font-medium">{nombreMascota(c.mascotaId)}</td>
                                                <td className="p-3">{c.veterinario}</td>
                                                <td className="p-3">
                                                    <span
                                                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                                            COLOR_ESTADO_CITA[c.estado] || "bg-gray-100 text-gray-700"
                                                        }`}
                                                    >
                                                        {ETIQUETA_ESTADO_CITA[c.estado] || c.estado}
                                                    </span>
                                                </td>
                                                <td className="p-3 text-center">
                                                    {ESTADOS_ACTIVOS.includes(c.estado) && (
                                                        <button
                                                            type="button"
                                                            onClick={() => handleCancelarCita(c)}
                                                            disabled={cancelandoId === c.id}
                                                            aria-label="Cancelar cita"
                                                            title="Cancelar cita"
                                                            className="inline-flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-medium px-3 py-1.5 rounded transition disabled:opacity-50 disabled:cursor-not-allowed"
                                                        >
                                                            <FaTimes className="text-xs" />
                                                            {cancelandoId === c.id ? "Cancelando..." : "Cancelar"}
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>

                    {/* Tabla: Citas anteriores */}
                    <div className="bg-white rounded-xl shadow overflow-hidden">
                        <div className="px-5 py-4 border-b font-semibold text-gray-800 flex justify-between items-center">
                            <span>Citas anteriores</span>
                            {anterioresFiltradas.length > 0 && (
                                <span className="text-xs text-gray-500 font-normal">
                                    {anterioresFiltradas.length} {anterioresFiltradas.length === 1 ? "cita" : "citas"}
                                </span>
                            )}
                        </div>

                        {anterioresFiltradas.length === 0 ? (
                            <p className="p-5 text-gray-500">
                                Aún no tienes citas anteriores.
                            </p>
                        ) : (
                            <>
                                <div className="overflow-x-auto">
                                    <table className="min-w-full">
                                        <thead className="bg-blue-900 text-white">
                                            <tr>
                                                <th className="p-3 text-left">Fecha</th>
                                                <th className="p-3 text-left">Hora</th>
                                                <th className="p-3 text-left">Mascota</th>
                                                <th className="p-3 text-left">Veterinario</th>
                                                <th className="p-3 text-left">Motivo</th>
                                                <th className="p-3 text-left">Estado</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {anterioresVisibles.map((c) => {
                                                const hoy = hoyISO();
                                                const esPasadaActiva = c.fecha < hoy && ["reservada", "confirmada"].includes(c.estado);
                                                const estadoVisual = esPasadaActiva ? "perdida" : c.estado;

                                                return (
                                                    <tr key={c.id} className="border-b text-gray-900 hover:bg-gray-50">
                                                        <td className="p-3 capitalize">{formatearFechaLarga(c.fecha)}</td>
                                                        <td className="p-3">{c.hora}</td>
                                                        <td className="p-3 font-medium">{nombreMascota(c.mascotaId)}</td>
                                                        <td className="p-3">{c.veterinario}</td>
                                                        <td className="p-3">{c.motivo || "—"}</td>
                                                        <td className="p-3">
                                                            <span
                                                                className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                                                    COLOR_ESTADO_CITA[estadoVisual] || "bg-gray-100 text-gray-700"
                                                                }`}
                                                            >
                                                                {ETIQUETA_ESTADO_CITA[estadoVisual] || estadoVisual}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>

                                {anterioresFiltradas.length > 10 && (
                                    <div className="p-4 border-t text-center bg-gray-50">
                                        <button
                                            type="button"
                                            onClick={() => setMostrarTodasAnteriores((prev) => !prev)}
                                            className="text-sm font-semibold text-blue-700 hover:text-blue-900 transition"
                                        >
                                            {mostrarTodasAnteriores
                                                ? "Ver menos"
                                                : `Ver todas (${anterioresFiltradas.length} citas)`}
                                        </button>
                                    </div>
                                )}
                            </>
                        )}
                    </div>

                </div>
            )}

        </div>

    );

}

export default function DashboardGuard() {
    const { userRole } = useAuth();

    if (userRole === "Cliente") {
        return <DashboardCliente />;
    }

    return (
        <RequireRole roles={["Administrador", "Recepcionista", "Veterinario"]}>
            <Dashboard />
        </RequireRole>
    );
}
