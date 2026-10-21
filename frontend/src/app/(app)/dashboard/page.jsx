"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FaDog, FaCalendarAlt, FaPlus } from "react-icons/fa";
import { obtenerMascotas } from "../../../services/mascotas.service";
import { obtenerHistoriales } from "../../../services/historial.service";
import { obtenerVacunas } from "../../../services/vacunas.service";
import { obtenerCitasPorMascota } from "../../../services/citas.service";
import { calcularAlertasGlobales } from "../../../utils/estadoClinico";
import { formatearFechaLarga, hoyISO } from "../../../utils/citas";
import BusquedaInteligente from "../../../components/dashboard/BusquedaInteligente";
import PanelAlertas from "../../../components/dashboard/PanelAlertas";
import RequireRole from "../../../components/auth/RequireRole";
import { useAuth } from "../../../context/AuthContext";

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

// Panel del Cliente (dueño de mascota): sus mascotas y sus próximas
// citas. No usa historiales/vacunas globales (solo son del personal).
const ESTADOS_ACTIVOS = ["reservada", "confirmada"];

function DashboardCliente() {

    const { userData } = useAuth();

    const [mascotas, setMascotas] = useState([]);
    const [proximas, setProximas] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        cargarDatos();
    }, []);

    async function cargarDatos() {

        try {

            const respMascotas = await obtenerMascotas();
            const misMascotas = respMascotas.data.data || [];
            setMascotas(misMascotas);

            const resultados = await Promise.allSettled(
                misMascotas.map((m) => obtenerCitasPorMascota(m.id))
            );

            const hoy = hoyISO();
            const citas = resultados
                .filter((r) => r.status === "fulfilled")
                .flatMap((r) => r.value.data.data || [])
                .filter((c) => ESTADOS_ACTIVOS.includes(c.estado) && c.fecha >= hoy)
                .sort((a, b) => `${a.fecha} ${a.hora}`.localeCompare(`${b.fecha} ${b.hora}`));

            setProximas(citas);

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

    return (

        <div>

            <h1 className="text-4xl font-bold text-gray-900">
                Hola{userData?.name ? `, ${userData.name}` : ""}
            </h1>

            <p className="mt-2 mb-6 text-gray-600">
                Aquí puedes ver tus mascotas y tus próximas citas.
            </p>

            {error && (
                <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
                    {error}
                </div>
            )}

            {cargando ? (
                <p className="text-gray-500">Cargando...</p>
            ) : (
                <div className="space-y-6">

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                        <div className="bg-white rounded-xl shadow p-5 flex items-center gap-4">
                            <FaDog className="text-3xl text-blue-700" />
                            <div>
                                <p className="text-sm text-gray-500">Mis mascotas</p>
                                <p className="text-3xl font-bold text-gray-900">{mascotas.length}</p>
                            </div>
                        </div>

                        <div className="bg-white rounded-xl shadow p-5 flex items-center gap-4">
                            <FaCalendarAlt className="text-3xl text-blue-700" />
                            <div>
                                <p className="text-sm text-gray-500">Próximas citas</p>
                                <p className="text-3xl font-bold text-gray-900">{proximas.length}</p>
                            </div>
                        </div>

                    </div>

                    <div className="flex flex-wrap gap-3">
                        <Link
                            href="/mascotas"
                            className="flex items-center gap-2 bg-blue-700 hover:bg-blue-800 text-white px-5 py-2 rounded-lg"
                        >
                            <FaPlus /> Registrar / gestionar mascotas
                        </Link>
                        <Link
                            href="/citas"
                            className="flex items-center gap-2 bg-white border border-blue-700 text-blue-700 hover:bg-blue-50 px-5 py-2 rounded-lg"
                        >
                            <FaCalendarAlt /> Agendar una cita
                        </Link>
                    </div>

                    <div className="bg-white rounded-xl shadow overflow-hidden">
                        <div className="px-5 py-4 border-b font-semibold text-gray-800">
                            Mis próximas citas
                        </div>

                        {proximas.length === 0 ? (
                            <p className="p-5 text-gray-500">
                                No tienes citas próximas.
                            </p>
                        ) : (
                            <table className="min-w-full">
                                <thead className="bg-blue-900 text-white">
                                    <tr>
                                        <th className="p-3 text-left">Fecha</th>
                                        <th className="p-3 text-left">Hora</th>
                                        <th className="p-3 text-left">Mascota</th>
                                        <th className="p-3 text-left">Veterinario</th>
                                        <th className="p-3 text-left">Estado</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {proximas.map((c) => (
                                        <tr key={c.id} className="border-b text-gray-900">
                                            <td className="p-3 capitalize">{formatearFechaLarga(c.fecha)}</td>
                                            <td className="p-3">{c.hora}</td>
                                            <td className="p-3">{nombreMascota(c.mascotaId)}</td>
                                            <td className="p-3">{c.veterinario}</td>
                                            <td className="p-3 capitalize">{c.estado}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
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
