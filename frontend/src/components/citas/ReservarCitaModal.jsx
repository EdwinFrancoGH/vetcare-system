"use client";

import { useEffect, useState } from "react";
import { reservarCita } from "../../services/citas.service";
import { formatearFechaLarga } from "../../utils/citas";

// Modal de reserva: el dueño de la mascota elige su mascota y escribe el
// motivo de la consulta para tomar un horario generado a partir del
// horario semanal del veterinario (ver DisponibilidadCitas). `cita` aquí
// es un bloque calculado ({ veterinario, fecha, hora, duracionMinutos }),
// todavía no existe como documento hasta que se confirma la reserva.
export default function ReservarCitaModal({ cita, mascotas, onClose, onSuccess }) {

    const [formData, setFormData] = useState({
        mascotaId: "",
        propietario: "",
        telefono: "",
        motivo: "",
    });

    const [enviando, setEnviando] = useState(false);

    useEffect(() => {
        setFormData({
            mascotaId: "",
            propietario: "",
            telefono: "",
            motivo: "",
        });
    }, [cita]);

    if (!cita) return null;

    function handleChange(e) {
        const { name, value } = e.target;

        setFormData((prev) => {

            const siguiente = { ...prev, [name]: value };

            // Al elegir la mascota, autocompleta propietario/teléfono si
            // ya los tenemos registrados (se pueden ajustar a mano).
            if (name === "mascotaId") {
                const mascota = mascotas.find((m) => m.id === value);

                if (mascota) {
                    siguiente.propietario = mascota.propietario || "";
                    siguiente.telefono = mascota.telefono || "";
                }
            }

            return siguiente;

        });
    }

    async function handleSubmit(e) {
        e.preventDefault();

        if (!formData.mascotaId || !formData.propietario || !formData.telefono || !formData.motivo) {
            alert("Complete todos los campos para reservar la cita.");
            return;
        }

        try {

            setEnviando(true);

            await reservarCita({
                veterinario: cita.veterinario,
                fecha: cita.fecha,
                hora: cita.hora,
                ...formData,
            });

            alert("¡Cita reservada correctamente!");

            await onSuccess();
            onClose();

        } catch (error) {

            console.error(error);

            // 409: alguien más reservó este horario primero. Se avisa y
            // se refresca la disponibilidad para que ese bloque desaparezca.
            alert(error.response?.data?.message || "Ocurrió un error al reservar la cita.");

            if (error.response?.status === 409) {
                await onSuccess();
                onClose();
            }

        } finally {

            setEnviando(false);

        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">

            <form
                onSubmit={handleSubmit}
                className="w-full max-w-lg rounded-xl bg-white shadow-2xl"
            >

                <div className="border-b px-6 py-4">
                    <h2 className="text-xl font-bold text-gray-800">
                        Reservar horario
                    </h2>
                    <p className="text-sm text-gray-500 mt-1 capitalize">
                        {formatearFechaLarga(cita.fecha)} · {cita.hora} · Dr(a). {cita.veterinario}
                    </p>
                </div>

                <div className="px-6 py-5 space-y-4 text-gray-600">

                    <div>
                        <label className="block mb-1 font-medium">Mascota</label>

                        <select
                            name="mascotaId"
                            value={formData.mascotaId}
                            onChange={handleChange}
                            className="w-full border rounded-lg px-3 py-2"
                        >
                            <option value="">Seleccione</option>
                            {mascotas.map((mascota) => (
                                <option key={mascota.id} value={mascota.id}>
                                    {mascota.nombre} ({mascota.propietario})
                                </option>
                            ))}
                        </select>

                        {mascotas.length === 0 && (
                            <p className="mt-2 text-sm text-amber-700">
                                Aún no tienes mascotas registradas. Regístrala primero en el menú &quot;Mascotas&quot;.
                            </p>
                        )}
                    </div>

                    <div>
                        <label className="block mb-1 font-medium">Propietario</label>
                        <input
                            type="text"
                            name="propietario"
                            value={formData.propietario}
                            onChange={handleChange}
                            className="w-full border rounded-lg px-3 py-2"
                        />
                    </div>

                    <div>
                        <label className="block mb-1 font-medium">Teléfono</label>
                        <input
                            type="text"
                            name="telefono"
                            value={formData.telefono}
                            onChange={handleChange}
                            className="w-full border rounded-lg px-3 py-2"
                        />
                    </div>

                    <div>
                        <label className="block mb-1 font-medium">Motivo de la consulta</label>
                        <textarea
                            name="motivo"
                            value={formData.motivo}
                            onChange={handleChange}
                            rows="3"
                            className="w-full border rounded-lg px-3 py-2"
                        />
                    </div>

                </div>

                <div className="flex justify-end gap-3 border-t px-6 py-4">

                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-lg border border-gray-300 px-4 py-2 transition hover:bg-gray-100"
                    >
                        Cancelar
                    </button>

                    <button
                        type="submit"
                        disabled={enviando}
                        className="rounded-lg bg-blue-700 px-4 py-2 text-white transition hover:bg-blue-800 disabled:opacity-60"
                    >
                        {enviando ? "Reservando..." : "Confirmar reserva"}
                    </button>

                </div>

            </form>

        </div>
    );

}
