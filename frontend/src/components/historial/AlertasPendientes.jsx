"use client";

import BotonAgregarCalendar from "../ui/BotonAgregarCalendar";

export default function AlertasPendientes({ vencidos, proximos, nombreMascota }) {

    if (vencidos.length === 0 && proximos.length === 0) {
        return null;
    }

    return (
        <div className="space-y-3">

            {vencidos.length > 0 && (
                <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4">
                    <p className="font-semibold mb-1">⚠ Tratamientos vencidos</p>
                    <ul className="text-sm space-y-1">
                        {vencidos.map((v, i) => (
                            <li key={i} className="flex items-center justify-between gap-3">
                                <span>{v.tipo} — vencido desde el {v.fecha}</span>
                                <BotonAgregarCalendar
                                    titulo={`${v.tipo} - ${nombreMascota || "Mascota"}`}
                                    fecha={v.fecha}
                                    detalles={`Pendiente vencido de ${nombreMascota || "la mascota"} en VetCare.`}
                                />
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {proximos.length > 0 && (
                <div className="bg-orange-50 border border-orange-200 text-orange-800 rounded-lg p-4">
                    <p className="font-semibold mb-1">Próximos a vencer</p>
                    <ul className="text-sm space-y-1">
                        {proximos.map((p, i) => (
                            <li key={i} className="flex items-center justify-between gap-3">
                                <span>{p.tipo} — {p.fecha}</span>
                                <BotonAgregarCalendar
                                    titulo={`${p.tipo} - ${nombreMascota || "Mascota"}`}
                                    fecha={p.fecha}
                                    detalles={`Pendiente de ${nombreMascota || "la mascota"} en VetCare.`}
                                />
                            </li>
                        ))}
                    </ul>
                </div>
            )}

        </div>
    );

}
