"use client";

import { useEffect, useRef, useState } from "react";
import Swal from "sweetalert2";
import { FaCalendarAlt, FaClock, FaUserMd, FaTimes } from "react-icons/fa";
import { reservarCita } from "../../services/citas.service";
import { obtenerServiciosVeterinarios } from "../../services/servicios-veterinarios.service";
import { formatearFechaLarga } from "../../utils/citas";
import { construirEnlaceGoogleCalendar } from "../../utils/calendario";
import { useAuth } from "../../context/AuthContext";
import CampoFormulario from "../mascotas/formulario/CampoFormulario";
import SelectorMascotaCita from "./SelectorMascotaCita";
import ChipsMotivo from "./ChipsMotivo";

const REGEX_TELEFONO_SV = /^(\+?503[\s-]?)?[2-7]\d{3}[\s-]?\d{4}$/;
const formatoPrecioUSD = (centavos) => {
    if (!Number.isSafeInteger(centavos)) return "Tarifa no disponible";
    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        currencyDisplay: "code",
    }).format(centavos / 100);
};

function escaparHTML(texto) {
    if (texto === null || texto === undefined) return "";
    return String(texto)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

export default function ReservarCitaModal({ cita, mascotas = [], onClose, onSuccess }) {
    const { userRole, userData } = useAuth();
    const esCliente = userRole === "Cliente";
    const propInicial = esCliente ? String(userData?.name ?? "") : "";
    const telInicial = esCliente ? String(userData?.phone ?? userData?.telefono ?? "") : "";
    const unica = esCliente && mascotas.length === 1 ? mascotas[0] : null;

    const [formData, setFormData] = useState({
        mascotaId: unica ? unica.id : "",
        servicioId: "",
        propietario: unica ? String(unica.propietario || propInicial) : propInicial,
        telefono: unica ? String(unica.telefono || telInicial) : telInicial,
        motivo: "",
    });
    const [errores, setErrores] = useState({});
    const [enviando, setEnviando] = useState(false);
    const [servicios, setServicios] = useState([]);
    const [cargandoServicios, setCargandoServicios] = useState(true);
    const [errorServicios, setErrorServicios] = useState("");
    const envioEnCurso = useRef(false);

    useEffect(() => {
        if (!cita) return undefined;
        let vigente = true;
        obtenerServiciosVeterinarios()
            .then((respuesta) => {
                if (vigente) setServicios(respuesta.data?.data || []);
            })
            .catch((error) => {
                if (vigente) setErrorServicios(error.response?.data?.message || "No se pudo cargar el catalogo de servicios.");
            })
            .finally(() => {
                if (vigente) setCargandoServicios(false);
            });
        return () => { vigente = false; };
    }, [cita]);

    async function recargarServicios() {
        setCargandoServicios(true);
        setErrorServicios("");
        try {
            const respuesta = await obtenerServiciosVeterinarios();
            setServicios(respuesta.data?.data || []);
        } catch (error) {
            setErrorServicios(error.response?.data?.message || "No se pudo cargar el catalogo de servicios.");
        } finally {
            setCargandoServicios(false);
        }
    }

    if (!cita) return null;

    function handleSeleccionarMascota(id) {
        const m = mascotas.find((item) => item.id === id);
        setFormData((prev) => ({
            ...prev,
            mascotaId: id,
            propietario: m?.propietario ? String(m.propietario) : prev.propietario,
            telefono: m?.telefono ? String(m.telefono) : prev.telefono,
        }));
        setErrores((prev) => ({ ...prev, mascotaId: "" }));
    }

    function handleChange(e) {
        const { name, value } = e.target;
        if (name === "telefono" && !/^\+?[0-9\s-]*$/.test(value)) return;

        setFormData((prev) => {
            const siguiente = { ...prev, [name]: value };
            if (name === "mascotaId") {
                const mascota = mascotas.find((m) => m.id === value);
                if (mascota) {
                    siguiente.propietario = String(mascota.propietario ?? "");
                    siguiente.telefono = String(mascota.telefono ?? "");
                }
            }
            return siguiente;
        });
        setErrores((prev) => ({ ...prev, [name]: "" }));
    }

    async function handleSubmit(e) {
        e.preventDefault();
        if (envioEnCurso.current) return;
        const nuevosErrores = {};
        if (!formData.mascotaId) nuevosErrores.mascotaId = "Debe seleccionar una mascota.";
        if (!formData.servicioId) nuevosErrores.servicioId = "Debe seleccionar un servicio veterinario.";
        if (!String(formData.propietario ?? "").trim())
            nuevosErrores.propietario = "El nombre del propietario es obligatorio.";
        if (!String(formData.telefono ?? "").trim()) {
            nuevosErrores.telefono = "El teléfono de contacto es obligatorio.";
        } else if (!REGEX_TELEFONO_SV.test(String(formData.telefono ?? "").trim())) {
            nuevosErrores.telefono =
                "Ingresa un número de teléfono válido de El Salvador (ej. 7123-4567 o +503 7123-4567).";
        }
        if (!String(formData.motivo ?? "").trim())
            nuevosErrores.motivo = "El motivo de la consulta es obligatorio.";

        if (Object.keys(nuevosErrores).length > 0) {
            setErrores(nuevosErrores);
            const incompleto =
                !formData.mascotaId ||
                !formData.propietario ||
                !formData.telefono ||
                !formData.motivo;
            Swal.fire({
                icon: "warning",
                title: incompleto ? "Campos incompletos" : "Teléfono inválido",
                text: incompleto
                    ? "Complete todos los campos para reservar la cita."
                    : "Ingresa un número de teléfono válido de El Salvador (ej. 7123-4567 o +503 7123-4567).",
                confirmButtonColor: "#1d4ed8",
            });
            return;
        }

        envioEnCurso.current = true;
        try {
            setEnviando(true);
            const respuesta = await reservarCita({
                veterinario: cita.veterinario,
                fecha: cita.fecha,
                hora: cita.hora,
                ...formData,
            });
            const citaCreada = respuesta.data?.data;

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
                html:
                    `<div style="text-align: left; font-size: 0.95rem; margin-top: 0.5rem; line-height: 1.6; color: #374151;">
                    <p><strong>Mascota:</strong> ${escaparHTML(nombreMascota)}</p>
                    <p><strong>Fecha:</strong> ${escaparHTML(formatearFechaLarga(cita.fecha))}</p>
                    <p><strong>Hora:</strong> ${escaparHTML(cita.hora)}</p>
                    <p><strong>Veterinario:</strong> Dr(a). ${escaparHTML(cita.veterinario)}</p>
                    <p><strong>Servicio:</strong> ${escaparHTML(citaCreada?.servicioNombre || "Servicio veterinario")}</p>
                    <p><strong>Tarifa confirmada:</strong> ${escaparHTML(formatoPrecioUSD(citaCreada?.precioCentavos))}</p>
                </div>` +
                    (enlaceCalendar
                        ? `<div style="margin-top: 1.25rem; text-align: center;"><a href="${escaparHTML(enlaceCalendar)}" target="_blank" rel="noopener noreferrer" style="display: inline-block; background-color: #1d4ed8; color: #ffffff; padding: 9px 18px; border-radius: 8px; font-weight: 600; text-decoration: none; font-size: 0.875rem;">+ Agregar a mi calendario</a></div>`
                        : ""),
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
            if (error.response?.data?.code === "SERVICIO_NO_DISPONIBLE") {
                await recargarServicios();
            } else if (error.response?.status === 409) {
                await onSuccess();
                onClose();
            }
        } finally {
            setEnviando(false);
            envioEnCurso.current = false;
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
            <form
                onSubmit={handleSubmit}
                className="w-full max-w-lg rounded-2xl bg-white shadow-2xl overflow-hidden my-auto"
            >
                <div className="p-5 sm:p-6 border-b border-gray-100 bg-white">
                    <div className="flex items-center justify-between mb-3.5">
                        <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
                            Reservar horario
                        </h2>
                        <button
                            type="button"
                            onClick={onClose}
                            aria-label="Cerrar modal"
                            title="Cerrar modal"
                            className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-1.5 rounded-xl transition"
                        >
                            <FaTimes className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="bg-blue-50/70 border border-blue-100 rounded-xl p-3.5 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs sm:text-sm text-blue-900">
                        <span className="flex items-center gap-2 font-medium capitalize">
                            <FaCalendarAlt className="text-blue-600 shrink-0" />
                            {formatearFechaLarga(cita.fecha)}
                        </span>
                        <span className="flex items-center gap-2 font-medium">
                            <FaClock className="text-blue-600 shrink-0" />
                            {cita.hora}
                        </span>
                        <span className="flex items-center gap-2 font-medium">
                            <FaUserMd className="text-blue-600 shrink-0 text-base" />
                            Dr(a). {cita.veterinario}
                        </span>
                    </div>
                </div>

                <div className="p-5 sm:p-6 space-y-4">
                    <div>
                        <label htmlFor="servicioId" className="mb-1.5 block text-sm font-medium text-gray-700">
                            Servicio veterinario <span className="text-red-500">*</span>
                        </label>
                        {cargandoServicios ? (
                            <p role="status" className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm text-gray-600">Cargando servicios veterinarios...</p>
                        ) : errorServicios ? (
                            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                                <p role="alert">{errorServicios}</p>
                                <button type="button" onClick={recargarServicios} className="mt-2 font-semibold underline">Reintentar</button>
                            </div>
                        ) : servicios.length === 0 ? (
                            <p role="status" className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">No hay servicios activos para reservar en este momento.</p>
                        ) : (
                            <select
                                id="servicioId"
                                name="servicioId"
                                value={formData.servicioId}
                                onChange={handleChange}
                                required
                                aria-invalid={Boolean(errores.servicioId)}
                                className="w-full rounded-lg border border-gray-300 bg-white p-3 text-gray-900 focus:border-blue-500 focus:outline-none"
                            >
                                <option value="">Selecciona un servicio</option>
                                {servicios.filter((servicio) => servicio.activo === true).map((servicio) => (
                                    <option key={servicio.id} value={servicio.id}>
                                        {servicio.nombre} - {formatoPrecioUSD(servicio.precioCentavos)}
                                    </option>
                                ))}
                            </select>
                        )}
                        {errores.servicioId && <p className="mt-1 text-sm text-red-600">{errores.servicioId}</p>}
                    </div>
                    <SelectorMascotaCita
                        esCliente={esCliente}
                        mascotas={mascotas}
                        mascotaId={formData.mascotaId}
                        onSeleccionar={handleSeleccionarMascota}
                        onChange={handleChange}
                        error={errores.mascotaId}
                    />
                    <CampoFormulario
                        label="Propietario"
                        name="propietario"
                        value={formData.propietario}
                        onChange={handleChange}
                        placeholder="Nombre del propietario"
                        error={errores.propietario}
                        requerido
                    />
                    <CampoFormulario
                        label="Teléfono"
                        name="telefono"
                        type="tel"
                        inputMode="tel"
                        maxLength={15}
                        prefix="+503"
                        value={formData.telefono}
                        onChange={handleChange}
                        placeholder="7123-4567"
                        error={errores.telefono}
                        requerido
                    />

                    <div>
                        <div className="flex justify-between items-center mb-1.5">
                            <label className="text-sm font-medium text-gray-700">
                                Motivo de la consulta <span className="text-red-500 ml-0.5">*</span>
                            </label>
                            <span className="text-xs text-gray-400 font-mono">
                                {formData.motivo.length}/200
                            </span>
                        </div>
                        <ChipsMotivo
                            motivoActual={formData.motivo}
                            onSeleccionarChip={(chip) => {
                                setFormData((prev) => ({ ...prev, motivo: chip }));
                                setErrores((prev) => ({ ...prev, motivo: "" }));
                            }}
                        />
                        <CampoFormulario
                            as="textarea"
                            name="motivo"
                            value={formData.motivo}
                            onChange={handleChange}
                            maxLength={200}
                            rows="3"
                            placeholder="Describe el motivo de la consulta..."
                            error={errores.motivo}
                        />
                    </div>
                </div>

                <div className="flex justify-end gap-3 border-t border-gray-100 px-6 py-4 bg-gray-50/50 rounded-b-2xl">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={enviando}
                        className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100 hover:text-gray-900 disabled:opacity-50"
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        disabled={enviando || cargandoServicios || servicios.length === 0 || Boolean(errorServicios)}
                        className="rounded-lg bg-blue-700 px-5 py-2 text-sm font-semibold text-white transition hover:bg-blue-800 shadow-sm disabled:opacity-50"
                    >
                        {enviando ? "Reservando..." : "Confirmar reserva"}
                    </button>
                </div>
            </form>
        </div>
    );
}
