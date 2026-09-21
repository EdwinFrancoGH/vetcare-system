"use client";

import { useEffect, useState } from "react";
import { Users, Calendar as CalendarIcon, PawPrint, TrendingUp } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

import { obtenerMascotas } from "../../services/mascotas.service";
import { obtenerHistoriales } from "../../services/historial.service";
import { obtenerVacunas } from "../../services/vacunas.service";
import { calcularAlertasGlobales } from "../../utils/estadoClinico";

import BusquedaInteligente from "../../components/dashboard/BusquedaInteligente";
import PanelAlertas from "../../components/dashboard/PanelAlertas";

export default function DashboardPage() {

  const { userData } = useAuth();
  const displayName = userData?.name || "Usuario";

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

  const alertas = calcularAlertasGlobales(
    mascotas,
    historiales,
    vacunas
  );

  const stats = [
    {
      name: "Pacientes Activos",
      value: mascotas.length,
      icon: PawPrint,
      color: "text-indigo-500",
      bg: "bg-indigo-100",
    },
    {
      name: "Citas",
      value: "--",
      icon: CalendarIcon,
      color: "text-blue-500",
      bg: "bg-blue-100",
    },
    {
      name: "Clientes",
      value: "--",
      icon: Users,
      color: "text-purple-500",
      bg: "bg-purple-100",
    },
    {
      name: "Alertas",
      value: alertas.length,
      icon: TrendingUp,
      color: "text-orange-500",
      bg: "bg-orange-100",
    },
  ];

  return (
    <div className="space-y-6">

      <div>
        <h2 className="text-2xl font-bold">
          Bienvenido, {displayName}
        </h2>
        <p className="text-gray-500">
          Resumen general de VetCare.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;

          return (
            <div
              key={stat.name}
              className="bg-white rounded-xl shadow p-5"
            >
              <div className="flex justify-between">
                <div>
                  <p className="text-gray-500">{stat.name}</p>
                  <h3 className="text-3xl font-bold">{stat.value}</h3>
                </div>

                <div className={`${stat.bg} ${stat.color} p-3 rounded-lg`}>
                  <Icon size={22} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {cargando ? (
        <p>Cargando...</p>
      ) : (
        <>
          <BusquedaInteligente
            mascotas={mascotas}
            historiales={historiales}
            vacunas={vacunas}
          />

          <PanelAlertas alertas={alertas} />
        </>
      )}

    </div>
  );
}