"use client";

import { useEffect, useState } from "react";
import { obtenerHorarioPorVeterinario, guardarHorario } from "../../services/horarios.service";
import { DIAS, ETIQUETA_DIA } from "../../utils/citas";

const FRANJA_VACIA = { activo: false, inicio: "08:00", fin: "17:00" };

function horarioVacio() {
    return DIAS.reduce((acc, dia) => {
        acc[dia] = { ...FRANJA_VACIA };
        return acc;
    }, {});
}

// Formulario del médico para configurar su horario semanal de atención
// (ej. lunes a viernes de 8:00 a 17:00, sábado de 9:00 a 12:00). A partir
// de este horario, el backend genera los bloques de disponibilidad de 1
// hora que ve el cliente en DisponibilidadCitas — ya no se publican
// horarios sueltos uno por uno.
export default function HorarioAtencionForm({ veterinario, onSuccess }) {

    const [franjas, setFranjas] = useState(horarioVacio());
    const [duracionCitaMinutos, setDuracionCitaMinutos] = useState(60);
    const [cargando, setCargando] = useState(false);
    const [guardando, setGuardando] = useState(false);
    const [encontrado, setEncontrado] = useState(false);

    useEffect(() => {

        if (veterinario && veterinario.trim()) {
            cargarHorario(veterinario.trim());
        } else {
            setFranjas(horarioVacio());
            setDuracionCitaMinutos(60);
            setEncontrado(false);
        }

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [veterinario]);

    async function cargarHorario(nombre) {

        try {

            setCargando(true);

            const respuesta = await obtenerHorarioPorVeterinario(nombre);
            const horario = respuesta.data.data;

            const siguientesFranjas = horarioVacio();

            DIAS.forEach((dia) => {
                const franja = horario.franjas?.[dia];
                if (franja) {
                    siguientesFranjas[dia] = { activo: true, inicio: franja.inicio, fin: franja.fin };
                }
            });

            setFranjas(siguientesFranjas);
            setDuracionCitaMinutos(horario.duracionCitaMinutos || 60);
            setEncontrado(true);

        } catch (error) {

            // 404: ese médico todavía no tiene horario configurado, se
            // parte de un formulario vacío para crearlo.
            setFranjas(horarioVacio());
            setDuracionCitaMinutos(60);
            setEncontrado(false);

        } finally {

            setCargando(false);

        }

    }

    function actualizarFranja(dia, campo, valor) {
        setFranjas((prev) => ({
            ...prev,
            [dia]: { ...prev[dia], [campo]: valor },
        }));
    }

    async function handleSubmit(e) {

        e.preventDefault();

        if (!veterinario || !veterinario.trim()) {
            alert("Escriba el nombre del veterinario para configurar su horario.");
            return;
        }

        const algunDiaActivo = DIAS.some((dia) => franjas[dia].activo);

        if (!algunDiaActivo) {
            alert("Active al menos un día de atención.");
            return;
        }

        const franjasParaGuardar = DIAS.reduce((acc, dia) => {
            acc[dia] = franjas[dia].activo
                ? { inicio: franjas[dia].inicio, fin: franjas[dia].fin }
                : null;
            return acc;
        }, {});

        try {

            setGuardando(true);

            await guardarHorario(veterinario.trim(), {
                franjas: franjasParaGuardar,
                duracionCitaMinutos: Number(duracionCitaMinutos),
            });

            alert("Horario de atención guardado correctamente.");

            if (onSuccess) {
                await onSuccess();
            }

        } catch (error) {

            console.error(error);

            alert(error.response?.data?.message || "Ocurrió un error al guardar el horario.");

        } finally {

            setGuardando(false);

        }

    }

    return (
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow p-6 mb-6">

            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800">
                    Horario de Atención Semanal
                </h3>
                {cargando && <span className="text-sm text-gray-400">Cargando...</span>}
            </div>

            {!veterinario?.trim() && (
                <p className="text-sm text-gray-500 mb-4">
                    Escribe tu nombre en el campo &quot;Veterinario&quot; de arriba para configurar tu horario.
                </p>
            )}

            <div className="space-y-3">
                {DIAS.map((dia) => (
                    <div key={dia} className="flex flex-wrap items-center gap-3 border-b pb-3 last:border-b-0">

                        <label className="flex items-center gap-2 w-32 font-medium text-gray-700">
                            <input
                                type="checkbox"
                                checked={franjas[dia].activo}
                                onChange={(e) => actualizarFranja(dia, "activo", e.target.checked)}
                            />
                            {ETIQUETA_DIA[dia]}
                        </label>

                        <input
                            type="time"
                            disabled={!franjas[dia].activo}
                            value={franjas[dia].inicio}
                            onChange={(e) => actualizarFranja(dia, "inicio", e.target.value)}
                            className="border rounded-lg px-3 py-1 disabled:bg-gray-100 disabled:text-gray-400"
                        />

                        <span className="text-gray-500">a</span>

                        <input
                            type="time"
                            disabled={!franjas[dia].activo}
                            value={franjas[dia].fin}
                            onChange={(e) => actualizarFranja(dia, "fin", e.target.value)}
                            className="border rounded-lg px-3 py-1 disabled:bg-gray-100 disabled:text-gray-400"
                        />

                    </div>
                ))}
            </div>

            <div className="flex items-end gap-4 mt-4">

                <div>
                    <label className="block mb-1 font-medium text-gray-700">
                        Duración de cada cita (min)
                    </label>
                    <input
                        type="number"
                        min="60"
                        step="30"
                        value={duracionCitaMinutos}
                        onChange={(e) => setDuracionCitaMinutos(e.target.value)}
                        className="border rounded-lg px-3 py-2 w-32"
                    />
                    <p className="text-xs text-gray-400 mt-1">Mínimo 60 min, para no dejar huecos.</p>
                </div>

                <button
                    type="submit"
                    disabled={guardando}
                    className="bg-blue-700 hover:bg-blue-800 text-white px-5 py-2 rounded-lg disabled:opacity-60"
                >
                    {guardando ? "Guardando..." : encontrado ? "Actualizar horario" : "Guardar horario"}
                </button>

            </div>

        </form>
    );

}
