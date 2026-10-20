"use client";

import { useEffect, useState } from "react";
import Swal from "sweetalert2";
import { reservarCita } from "../../services/citas.service";
import { formatearFechaLarga } from "../../utils/citas";
import { construirEnlaceGoogleCalendar } from "../../utils/calendario";
import { useAuth } from "../../context/AuthContext";

const REGEX_TELEFONO_SV = /^(\+?503[\s-]?)?[2-7]\d{3}[\s-]?\d{4}$/;

function escaparHTML(texto) {
    if (texto === null || texto === undefined) return "";
    return String(texto)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

// Modal de reserva: el dueño de la mascota elige su mascota y escribe el
// motivo de la consulta para tomar un horario generado a partir del
// horario semanal del veterinario (ver DisponibilidadCitas). `cita` aquí
// es un bloque calculado ({ veterinario, fecha, hora, duracionMinutos }),
// todavía no existe como documento hasta que se confirma la reserva.
export default function ReservarCitaModal({ cita, mascotas, onClose, onSuccess }) {

    const { userRole } = useAuth();
    const esCliente = userRole === "Cliente";

    const [formData, setFormData] = useState({
        mascotaId: "",
        propietario: "",
        telefono: "",
        motivo: "",
    });

    const [enviando, setEnviando] = useState(false);

    useEffect(() => {
        if (cita) {
            // Si el cliente tiene una sola mascota, preseleccionarla y autocompletar datos
            if (esCliente && mascotas.length === 1) {
                const unica = mascotas[0];
                setFormData({
                    mascotaId: unica.id,
                    propietario: String(unica.propietario ?? ""),
                    telefono: String(unica.telefono ?? ""),
                    motivo: "",
                });
            } else {
                setFormData({
                    mascotaId: "",
                    propietario: "",
                    telefono: "",
                    motivo: "",
                });
            }
        }
    }, [cita, mascotas, esCliente]);

    if (!cita) return null;

    function handleChange(e) {
        const { name, value } = e.target;

        // En el input de teléfono: solo dígitos, espacio, guion y "+" al inicio
        if (name === "telefono") {
            if (!/^\+?[0-9\s-]*$/.test(value)) {
                return;
            }
        }

        setFormData((prev) => {

            const siguiente = { ...prev, [name]: value };

            // Al elegir la mascota, autocompleta propietario/teléfono si
            // ya los tenemos registrados (se pueden ajustar a mano).
            if (name === "mascotaId") {
                const mascota = mascotas.find((m) => m.id === value);

                if (mascota) {
                    siguiente.propietario = String(mascota.propietario ?? "");
                    siguiente.telefono = String(mascota.telefono ?? "");
                }
            }

            return siguiente;

        });
    }

    async function handleSubmit(e) {
        e.preventDefault();

        if (!formData.mascotaId || !formData.propietario || !formData.telefono || !formData.motivo) {
            Swal.fire({
                icon: "warning",
                title: "Campos incompletos",
                text: "Complete todos los campos para reservar la cita.",
                confirmButtonColor: "#1d4ed8",
            });
            return;
        }

        if (!REGEX_TELEFONO_SV.test(String(formData.telefono ?? "").trim())) {
            Swal.fire({
                icon: "warning",
                title: "Teléfono inválido",
                text: "Ingresa un número de teléfono válido de El Salvador (ej. 7123-4567 o +503 7123-4567).",
                confirmButtonColor: "#1d4ed8",
            });
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

            const mascotaElegida = mascotas.find((m) => m.id === formData.mascotaId);
            const nombreMascota = mascotaElegida?.nombre || "tu mascota";
            const enlaceCalendar = construirEnlaceGoogleCalendar({
                titulo: `Cita veterinaria de ${nombreMascota}`,
                fecha: cita.fecha,
                hora: cita.hora,
                duracionMinutos: cita.duracionMinutos || 30,
                detalles: `Veterinario: Dr(a). ${cita.veterinario}\nMotivo: ${formData.motivo}`,
            });

            await Swal.fire({
                icon: "success",
                title: "¡Cita reservada correctamente!",
                html: `
                    <div style="text-align: left; font-size: 0.95rem; margin-top: 0.5rem; line-height: 1.6; color: #374151;">
                        <p><strong>Mascota:</strong> ${escaparHTML(nombreMascota)}</p>
                        <p><strong>Fecha:</strong> ${escaparHTML(formatearFechaLarga(cita.fecha))}</p>
                        <p><strong>Hora:</strong> ${escaparHTML(cita.hora)}</p>
                        <p><strong>Veterinario:</strong> Dr(a). ${escaparHTML(cita.veterinario)}</p>
                    </div>
                    ${
                        enlaceCalendar
                            ? `
                        <div style="margin-top: 1.25rem; text-align: center;">
                            <a
                                href="${escaparHTML(enlaceCalendar)}"
                                target="_blank"
                                rel="noopener noreferrer"
                                style="display: inline-block; background-color: #1d4ed8; color: #ffffff; padding: 9px 18px; border-radius: 8px; font-weight: 600; text-decoration: none; font-size: 0.875rem;"
                            >
                                + Agregar a mi calendario
                            </a>
                        </div>
                    `
                            : ""
                    }
                `,
                confirmButtonText: "Aceptar",
                confirmButtonColor: "#1d4ed8",
            });

            await onSuccess();
            onClose();

        } catch (error) {

            console.error(error);

            await Swal.fire({
                icon: "error",
                title: "Error al reservar",
                text: error.response?.data?.message || "Ocurrió un error al reservar la cita.",
                confirmButtonColor: "#1d4ed8",
            });

            // 409: alguien más reservó este horario primero. Se avisa y
            // se refresca la disponibilidad para que ese bloque desaparezca.
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
                                    {esCliente
                                        ? mascota.nombre
                                        : `${mascota.nombre} (${mascota.propietario})`}
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
                            type="tel"
                            inputMode="tel"
                            name="telefono"
                            maxLength={15}
                            placeholder="7123-4567"
                            value={formData.telefono}
                            onChange={handleChange}
                            className="w-full border rounded-lg px-3 py-2"
                        />
                    </div>

                    <div>
                        <div className="flex justify-between items-center mb-1">
                            <label className="font-medium">Motivo de la consulta</label>
                            <span className="text-xs text-gray-400">
                                {formData.motivo.length}/200
                            </span>
                        </div>
                        <textarea
                            name="motivo"
                            value={formData.motivo}
                            onChange={handleChange}
                            maxLength={200}
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
