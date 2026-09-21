"use client";

import { useMemo, useState } from "react";

// Gráfica de línea, autocontenida en SVG (sin librerías externas,
// ya que el proyecto no trae un package.json con dependencias de
// gráficas). Color de la serie tomado de la paleta azul ya usada
// en el resto de la interfaz (bg-blue-700 / bg-blue-900).
const VIEW_W = 640;
const VIEW_H = 260;
const PADDING = { top: 24, right: 24, bottom: 32, left: 44 };
const COLOR_LINEA = "#2a78d6";

function redondearTicks(min, max, cantidad = 4) {

    if (min === max) {
        return [min - 1, min, min + 1];
    }

    const paso = (max - min) / (cantidad - 1);
    const ticks = [];

    for (let i = 0; i < cantidad; i++) {
        ticks.push(Math.round((min + paso * i) * 10) / 10);
    }

    return ticks;

}

export default function GraficaPeso({ historiales }) {

    const puntos = useMemo(() => {

        return (historiales || [])
            .filter(
                (h) =>
                    h.fecha &&
                    h.peso !== undefined &&
                    h.peso !== null &&
                    h.peso !== ""
            )
            .map((h) => ({ fecha: h.fecha, peso: Number(h.peso) }))
            .sort((a, b) => new Date(a.fecha) - new Date(b.fecha));

    }, [historiales]);

    const [activo, setActivo] = useState(null);

    if (puntos.length < 2) {
        return (
            <div className="bg-white rounded-xl shadow p-6">
                <h2 className="text-xl font-bold text-gray-800 mb-4">
                    Evolución del Peso
                </h2>
                <p className="text-gray-500">
                    Se necesitan al menos dos consultas con peso registrado para
                    graficar la evolución.
                </p>
            </div>
        );
    }

    const pesos = puntos.map((p) => p.peso);
    const pesoMin = Math.min(...pesos);
    const pesoMax = Math.max(...pesos);
    const margenY = Math.max((pesoMax - pesoMin) * 0.2, 0.5);
    const dominioMin = pesoMin - margenY;
    const dominioMax = pesoMax + margenY;

    const fechaMin = new Date(puntos[0].fecha).getTime();
    const fechaMax = new Date(puntos[puntos.length - 1].fecha).getTime();
    const rangoFechas = fechaMax - fechaMin || 1;

    const anchoUtil = VIEW_W - PADDING.left - PADDING.right;
    const altoUtil = VIEW_H - PADDING.top - PADDING.bottom;

    function coordX(fecha) {
        const t = (new Date(fecha).getTime() - fechaMin) / rangoFechas;
        return PADDING.left + t * anchoUtil;
    }

    function coordY(peso) {
        const t = (peso - dominioMin) / (dominioMax - dominioMin);
        return PADDING.top + (1 - t) * altoUtil;
    }

    const coordenadas = puntos.map((p) => ({
        ...p,
        x: coordX(p.fecha),
        y: coordY(p.peso),
    }));

    const lineaPath = coordenadas
        .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
        .join(" ");

    const ticksY = redondearTicks(dominioMin, dominioMax, 4);
    const ultimo = coordenadas[coordenadas.length - 1];

    function manejarMovimiento(e) {

        const rect = e.currentTarget.getBoundingClientRect();
        const xRelativo = ((e.clientX - rect.left) / rect.width) * VIEW_W;

        let indiceCercano = 0;
        let distanciaMinima = Infinity;

        coordenadas.forEach((p, i) => {
            const distancia = Math.abs(p.x - xRelativo);
            if (distancia < distanciaMinima) {
                distanciaMinima = distancia;
                indiceCercano = i;
            }
        });

        setActivo(indiceCercano);

    }

    return (
        <div className="bg-white rounded-xl shadow p-6">

            <h2 className="text-xl font-bold text-gray-800 mb-4">
                Evolución del Peso
            </h2>

            <div className="relative">

                <svg
                    viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
                    className="w-full h-auto"
                    onMouseMove={manejarMovimiento}
                    onMouseLeave={() => setActivo(null)}
                >

                    {ticksY.map((tick) => (
                        <g key={tick}>
                            <line
                                x1={PADDING.left}
                                x2={VIEW_W - PADDING.right}
                                y1={coordY(tick)}
                                y2={coordY(tick)}
                                stroke="#e5e7eb"
                                strokeWidth="1"
                            />
                            <text
                                x={PADDING.left - 8}
                                y={coordY(tick)}
                                textAnchor="end"
                                dominantBaseline="middle"
                                fontSize="10"
                                fill="#6b7280"
                            >
                                {tick} kg
                            </text>
                        </g>
                    ))}

                    <path
                        d={lineaPath}
                        fill="none"
                        stroke={COLOR_LINEA}
                        strokeWidth="2"
                        strokeLinejoin="round"
                        strokeLinecap="round"
                    />

                    {coordenadas.map((p, i) => (
                        <circle
                            key={p.fecha + i}
                            cx={p.x}
                            cy={p.y}
                            r={activo === i ? 6 : 4}
                            fill={COLOR_LINEA}
                            stroke="#ffffff"
                            strokeWidth="2"
                        />
                    ))}

                    {activo !== null && (
                        <line
                            x1={coordenadas[activo].x}
                            x2={coordenadas[activo].x}
                            y1={PADDING.top}
                            y2={VIEW_H - PADDING.bottom}
                            stroke="#9ca3af"
                            strokeWidth="1"
                            strokeDasharray="3,3"
                        />
                    )}

                    <text
                        x={ultimo.x + 8}
                        y={ultimo.y}
                        fontSize="11"
                        fontWeight="600"
                        fill="#111827"
                        dominantBaseline="middle"
                    >
                        {ultimo.peso} kg
                    </text>

                    <text x={PADDING.left} y={VIEW_H - 8} fontSize="10" fill="#6b7280">
                        {puntos[0].fecha}
                    </text>

                    <text
                        x={VIEW_W - PADDING.right}
                        y={VIEW_H - 8}
                        fontSize="10"
                        fill="#6b7280"
                        textAnchor="end"
                    >
                        {puntos[puntos.length - 1].fecha}
                    </text>

                </svg>

                {activo !== null && (
                    <div
                        className="absolute bg-gray-900 text-white text-xs rounded px-2 py-1 pointer-events-none"
                        style={{
                            left: `${(coordenadas[activo].x / VIEW_W) * 100}%`,
                            top: `${(coordenadas[activo].y / VIEW_H) * 100}%`,
                            transform: "translate(-50%, -130%)",
                            whiteSpace: "nowrap",
                        }}
                    >
                        {coordenadas[activo].fecha}: {coordenadas[activo].peso} kg
                    </div>
                )}

            </div>

        </div>
    );

}
