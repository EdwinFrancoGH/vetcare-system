"use client";

import { useCallback, useEffect, useState } from "react";
import Swal from "sweetalert2";
import { obtenerMascotas } from "../../services/mascotas.service";
import { obtenerHistoriales } from "../../services/historial.service";
import { obtenerVacunas } from "../../services/vacunas.service";
import { calcularAlertasGlobales } from "../../utils/estadoClinico";
import BusquedaInteligente from "./BusquedaInteligente";
import PanelAlertas from "./PanelAlertas";
import { useAuth } from "../../context/AuthContext";

export default function DashboardPersonal() {
    const { userRole } = useAuth();
    const [mascotas, setMascotas] = useState([]);
    const [historiales, setHistoriales] = useState([]);
    const [vacunas, setVacunas] = useState([]);
    const [cargando, setCargando] = useState(true);

    const cargarDatos = useCallback(async () => {
        try {
            const [respMascotas, respHistoriales, respVacunas] = await Promise.all([
                obtenerMascotas(),
                userRole === "Recepcionista" ? Promise.resolve(null) : obtenerHistoriales(),
                userRole === "Recepcionista" ? Promise.resolve(null) : obtenerVacunas(),
            ]);

            setMascotas(respMascotas.data.data);
            setHistoriales(respHistoriales?.data?.historiales || []);
            setVacunas(respVacunas?.data?.data || []);
        } catch (error) {
            console.error("Error al cargar el dashboard:", error);
            Swal.fire("Error", "No se pudieron cargar los datos. Verifica tu conexión e inténtalo de nuevo.", "error");
        } finally {
            setCargando(false);
        }
    }, [userRole]);

    useEffect(() => {
        if (userRole) cargarDatos();
    }, [userRole, cargarDatos]);

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
