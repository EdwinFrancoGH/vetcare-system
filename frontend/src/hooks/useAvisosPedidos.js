"use client";

import { useCallback, useEffect, useState } from "react";
import { obtenerPedidos } from "../services/pedidos.service";
import { describirPedido } from "../utils/descripcionPedido";
import {
    obtenerFechaLimitePedido,
    esVencimientoHoyOManyana
} from "../utils/vencimientoPedido";
import { formatearFechaPedido } from "../utils/fechasPedido";

const INTERVALO_MS = 2 * 60 * 1000;
const TRES_DIAS_MS = 3 * 24 * 60 * 60 * 1000;
const UN_DIA_MS = 24 * 60 * 60 * 1000;

export default function useAvisosPedidos() {
    const [avisos, setAvisos] = useState([]);
    const [cargando, setCargando] = useState(false);

    const cargar = useCallback(async () => {
        try {
            setCargando(true);
            const res = await obtenerPedidos();
            const pedidos = res.data?.data || [];
            const lista = [];

            // Pedidos pendientes por preparar (un solo aviso resumen)
            const pendientes = pedidos.filter((p) => p.estado === "pendiente");
            if (pendientes.length > 0) {
                const n = pendientes.length;
                const texto = n === 1
                    ? "Tienes 1 pedido nuevo por preparar"
                    : `Tienes ${n} pedidos nuevos por preparar`;

                lista.push({
                    id: "aviso-pedidos-pendientes",
                    tipo: "cita",
                    categoria: "pedido",
                    mensaje: texto
                });
            }

            // Pedidos de retiro por vencer hoy o mañana
            pedidos.forEach((p) => {
                const esRetiroNoPagado = p.tipo === "retiro" && !p.pagado;
                const esActivo = p.estado === "pendiente" || p.estado === "listo";

                if (esRetiroNoPagado && esActivo) {
                    const limite = obtenerFechaLimitePedido(p);
                    if (limite && esVencimientoHoyOManyana(limite)) {
                        const desc = describirPedido(p);
                        const cliente = p.clienteNombre || "Cliente";
                        const fecha = formatearFechaPedido(limite);
                        lista.push({
                            id: `aviso-vence-${p.id}`,
                            tipo: "por-vencer",
                            categoria: "pedido",
                            mensaje: `El pedido de ${desc} de ${cliente} vence el ${fecha}`
                        });
                    }
                }
            });

            // Pedidos pagados con más de 3 días sin retirar
            const ahora = Date.now();
            pedidos.forEach((p) => {
                const esPagadoActivo = p.pagado
                    && (p.estado === "pendiente" || p.estado === "listo");

                if (esPagadoActivo && p.fechaPedido) {
                    const transcurrido = ahora - new Date(p.fechaPedido).getTime();
                    if (transcurrido > TRES_DIAS_MS) {
                        const dias = Math.floor(transcurrido / UN_DIA_MS);
                        const desc = describirPedido(p);
                        const cliente = p.clienteNombre || "Cliente";
                        lista.push({
                            id: `aviso-demorado-${p.id}`,
                            tipo: "vencida",
                            categoria: "pedido",
                            mensaje: `El pedido pagado de ${cliente} (${desc}) `
                                + `lleva ${dias} días sin retirarse`
                        });
                    }
                }
            });

            setAvisos(lista);
        } catch (error) {
            console.error("Error al cargar avisos de pedidos:", error);
            setAvisos([]);
        } finally {
            setCargando(false);
        }
    }, []);

    useEffect(() => {
        cargar();
        const intervalo = setInterval(cargar, INTERVALO_MS);
        return () => clearInterval(intervalo);
    }, [cargar]);

    return {
        avisos,
        cargando,
        recargar: cargar
    };
}
