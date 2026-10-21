"use client";

import { useCallback, useEffect, useState } from "react";
import { obtenerMascotas } from "../services/mascotas.service";
import { obtenerVacunasPorMascota } from "../services/vacunas.service";
import { obtenerCitasPorMascota } from "../services/citas.service";
import { obtenerMisPedidos } from "../services/tienda.service";
import { ultimaDosisPorVacuna } from "../utils/estadoClinico";
import { describirPedido } from "../utils/descripcionPedido";
import { formatearFechaPedido } from "../utils/fechasPedido";
import {
    obtenerFechaLimitePedido,
    esVencimientoHoyOManyana
} from "../utils/vencimientoPedido";
import {
    formatearFechaCorta,
    esCitaProxima,
    hoyISO,
    sumarDiasISO,
} from "../utils/citas";
import { useAuth } from "../context/AuthContext";

const EVENTO_ACTUALIZAR = "vetcare:recordatorios-actualizar";

export default function useRecordatoriosCliente() {
    const { user, userRole } = useAuth();
    const esCliente = !!user && userRole === "Cliente";

    const [recordatorios, setRecordatorios] = useState([]);
    const [cargando, setCargando] = useState(false);

    const cargar = useCallback(async () => {
        if (!esCliente) {
            setRecordatorios([]);
            return;
        }

        try {
            setCargando(true);

            const [respMascotasRes, respPedidosRes] = await Promise.allSettled([
                obtenerMascotas(),
                obtenerMisPedidos()
            ]);

            const misMascotas = respMascotasRes.status === "fulfilled"
                ? (respMascotasRes.value.data?.data || [])
                : [];

            const misPedidos = respPedidosRes.status === "fulfilled"
                ? (respPedidosRes.value.data?.data || [])
                : [];

            let todasLasCitas = [];
            let todasLasVacunas = [];

            if (misMascotas.length > 0) {
                const [citasResultados, vacunasResultados] = await Promise.all([
                    Promise.allSettled(misMascotas.map((m) => obtenerCitasPorMascota(m.id))),
                    Promise.allSettled(misMascotas.map((m) => obtenerVacunasPorMascota(m.id))),
                ]);

                todasLasCitas = citasResultados
                    .filter((r) => r.status === "fulfilled")
                    .flatMap((r) => r.value.data?.data || []);

                todasLasVacunas = vacunasResultados
                    .filter((r) => r.status === "fulfilled")
                    .flatMap((r) => r.value.data?.data || []);
            }

            const vacunasUltimaDosis = ultimaDosisPorVacuna(todasLasVacunas);

            const hoy = hoyISO();
            const limite30Dias = sumarDiasISO(hoy, 30);
            const maniana = sumarDiasISO(hoy, 1);

            const nombreMascota = (id) =>
                misMascotas.find((m) => m.id === id)?.nombre || "—";

            const nuevos = [];

            // Vacunas: vencidas y por vencer en los próximos 30 días
            vacunasUltimaDosis.forEach((v) => {
                if (!v.proximaFecha) return;
                const nombre = nombreMascota(v.mascotaId);
                const fechaCorta = formatearFechaCorta(v.proximaFecha);
                const pFecha = (v.proximaFecha || "").slice(0, 10);

                if (pFecha < hoy) {
                    nuevos.push({
                        id: `v-vencida-${v.id}`,
                        fecha: v.proximaFecha,
                        tipo: "vencida",
                        mensaje: `La vacuna ${v.nombre} de ${nombre} venció el ${fechaCorta}`,
                    });
                } else if (pFecha <= limite30Dias) {
                    nuevos.push({
                        id: `v-porvencer-${v.id}`,
                        fecha: v.proximaFecha,
                        tipo: "por-vencer",
                        mensaje: `La vacuna ${v.nombre} de ${nombre} vence el ${fechaCorta}`,
                    });
                }
            });

            // Citas: hoy o mañana (solo si es próxima según esCitaProxima)
            const citasProximas = todasLasCitas.filter((c) => esCitaProxima(c));

            citasProximas.forEach((c) => {
                if (c.fecha === hoy) {
                    nuevos.push({
                        id: `c-hoy-${c.id}`,
                        fecha: c.fecha,
                        tipo: "cita",
                        mensaje: `Hoy tienes cita con ${c.veterinario} a las ${c.hora}`,
                    });
                } else if (c.fecha === maniana) {
                    nuevos.push({
                        id: `c-maniana-${c.id}`,
                        fecha: c.fecha,
                        tipo: "cita",
                        mensaje: `Mañana tienes cita con ${c.veterinario} a las ${c.hora}`,
                    });
                }
            });

            // Recordatorios de pedidos en tienda
            misPedidos.forEach((p) => {
                const desc = describirPedido(p);
                const fechaLimite = obtenerFechaLimitePedido(p);
                const esRetiro = p.tipo === "retiro";
                const activo = p.estado === "pendiente" || p.estado === "listo";
                const vencePronto = esRetiro && activo && esVencimientoHoyOManyana(fechaLimite);

                if (vencePronto) {
                    const fechaTxt = formatearFechaPedido(fechaLimite);
                    nuevos.push({
                        id: `p-vence-${p.id}`,
                        fecha: fechaLimite,
                        tipo: "por-vencer",
                        mensaje: `Tu pedido de ${desc} vence el ${fechaTxt}. Si no lo retiras se cancelará.`
                    });
                } else if (p.estado === "listo") {
                    nuevos.push({
                        id: `p-listo-${p.id}`,
                        fecha: p.fechaPedido,
                        tipo: "cita",
                        mensaje: `Tu pedido de ${desc} está listo para retirar`
                    });
                }
            });

            nuevos.sort((a, b) => (a.fecha || "").localeCompare(b.fecha || ""));
            setRecordatorios(nuevos);

        } catch (error) {
            console.error("Error al cargar recordatorios del cliente:", error);
        } finally {
            setCargando(false);
        }

    }, [esCliente]);

    useEffect(() => {
        cargar();
    }, [cargar]);

    useEffect(() => {
        if (!esCliente) return;

        function handleActualizar() {
            cargar();
        }

        window.addEventListener(EVENTO_ACTUALIZAR, handleActualizar);
        return () => {
            window.removeEventListener(EVENTO_ACTUALIZAR, handleActualizar);
        };
    }, [esCliente, cargar]);

    const recargar = useCallback(async () => {
        await cargar();
        if (typeof window !== "undefined") {
            window.dispatchEvent(new CustomEvent(EVENTO_ACTUALIZAR));
        }
    }, [cargar]);

    return {
        recordatorios,
        cargando,
        recargar,
    };
}

