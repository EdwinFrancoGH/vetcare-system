"use client";

import { useEffect, useState } from "react";
import { obtenerMascotas } from "../../services/mascotas.service";
import { obtenerHistoriales } from "../../services/historial.service";
import { obtenerVacunas } from "../../services/vacunas.service";
import { calcularAlertasGlobales } from "../../utils/estadoClinico";
import BusquedaInteligente from "../../components/dashboard/BusquedaInteligente";
import PanelAlertas from "../../components/dashboard/PanelAlertas";

export default function Dashboard() {

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
