"use client";

import { useEffect, useState, useRef } from "react";
import { FaPaw, FaHeartbeat, FaUser, FaCheckCircle } from "react-icons/fa";
import Swal from "sweetalert2";

import { crearMascota, actualizarMascota } from "../../services/mascotas.service";
import { useAuth } from "../../context/AuthContext";
import { hoyISO, calcularEdadYMeses } from "../../utils/citas";
import { ESPECIE_IDS, obtenerEspecie } from "../../utils/especies";
import { resizeImageToBase64 } from "../../utils/image";
import {
    REGEX_LETRAS,
    REGEX_TELEFONO_INPUT,
    validarFormularioMascota,
} from "../../utils/validacionesMascota";

import ModalFormulario from "./formulario/ModalFormulario";
import CampoFormulario from "./formulario/CampoFormulario";
import SelectorEspecie from "./formulario/SelectorEspecie";
import SelectorSexo from "./formulario/SelectorSexo";

const FORMULARIO_INICIAL = {
    nombre: "",
    especie: "",
    raza: "",
    sexo: "",
    edad: "",
    peso: "",
    color: "",
    fechaNacimiento: "",
    propietario: "",
    telefono: "",
    direccion: "",
    estado: "Activo",
    fotoURL: "",
};

export default function MascotaForm({ mascota, onClose, onSuccess }) {
    const { userRole, userData } = useAuth();
    const esCliente = userRole === "Cliente";
    const hoy = hoyISO();

    const formRef = useRef(null);
    const initialDataRef = useRef(null);

    const [formData, setFormData] = useState(FORMULARIO_INICIAL);
    const [guardando, setGuardando] = useState(false);
    const [errores, setErrores] = useState({});
    const [especieOtroTexto, setEspecieOtroTexto] = useState("");

    useEffect(() => {
        const ec = mascota ? calcularEdadYMeses(mascota.fechaNacimiento, hoy).edad : "";
        const init = mascota
            ? {
                  nombre: String(mascota.nombre ?? ""),
                  especie: String(mascota.especie ?? ""),
                  raza: String(mascota.raza ?? ""),
                  sexo: String(mascota.sexo ?? ""),
                  edad: ec !== "" ? ec : (mascota.edad ?? ""),
                  peso: mascota.peso != null ? String(mascota.peso) : "",
                  color: String(mascota.color ?? ""),
                  fechaNacimiento: String(mascota.fechaNacimiento ?? ""),
                  propietario: String(mascota.propietario ?? ""),
                  telefono: String(mascota.telefono ?? ""),
                  direccion: String(mascota.direccion ?? ""),
                  estado: String(mascota.estado ?? "Activo"),
                  fotoURL: String(mascota.fotoURL ?? ""),
              }
            : {
                  ...FORMULARIO_INICIAL,
                  propietario: esCliente ? String(userData?.name ?? "") : "",
                  telefono: esCliente ? String(userData?.phone ?? userData?.telefono ?? "") : "",
              };
        setFormData(init);
        initialDataRef.current = init;
        setErrores({});
        setEspecieOtroTexto(
            mascota?.especie && !ESPECIE_IDS.includes(mascota.especie) && mascota.especie !== "Otro"
                ? String(mascota.especie)
                : "",
        );
    }, [mascota, esCliente, userData, hoy]);

    const esModificado = () => {
        if (!initialDataRef.current) return false;
        return Object.keys(initialDataRef.current).some(
            (k) =>
                String(formData[k] ?? "").trim() !== String(initialDataRef.current[k] ?? "").trim(),
        );
    };

    const intentarCerrar = async () => {
        if (guardando) return;
        if (esModificado()) {
            const res = await Swal.fire({
                title: "¿Descartar los cambios?",
                text: "Hay información modificada que no se ha guardado. ¿Deseas salir?",
                icon: "warning",
                showCancelButton: true,
                confirmButtonColor: "#dc2626",
                cancelButtonColor: "#6b7280",
                confirmButtonText: "Sí, descartar",
                cancelButtonText: "Continuar editando",
            });
            if (res.isConfirmed) onClose();
        } else {
            onClose();
        }
    };

    const limpiarError = (campo) => {
        setErrores((prev) => {
            if (!prev[campo]) return prev;
            const nuevo = { ...prev };
            delete nuevo[campo];
            return nuevo;
        });
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        limpiarError(name);
        if (
            (name === "nombre" || name === "color" || name === "propietario") &&
            !REGEX_LETRAS.test(value)
        )
            return;
        if (name === "telefono" && !REGEX_TELEFONO_INPUT.test(value)) return;

        if (name === "fechaNacimiento") {
            const { edad } = calcularEdadYMeses(value, hoy);
            setFormData((prev) => ({ ...prev, fechaNacimiento: value, edad }));
            return;
        }
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSeleccionarFoto = async (e) => {
        const archivo = e.target.files?.[0];
        e.target.value = "";
        if (!archivo) return;

        try {
            const fotoURL = await resizeImageToBase64(archivo, { maxSize: 480, quality: 0.82 });
            setFormData((prev) => ({ ...prev, fotoURL }));
        } catch (error) {
            Swal.fire("No se pudo cargar la foto", error.message || "Selecciona un archivo de imagen válido.", "error");
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const validacion = validarFormularioMascota(formData);
        if (!validacion.esValido) {
            setErrores(validacion.errores);
            if (validacion.primerCampo) {
                const el = formRef.current?.querySelector(`[name="${validacion.primerCampo}"]`);
                if (el) {
                    el.focus?.();
                    el.scrollIntoView?.({ behavior: "smooth", block: "center" });
                }
                Swal.fire(validacion.tituloSwal, validacion.primerMensaje, "warning");
            }
            return;
        }

        try {
            setGuardando(true);
            const payload = {
                ...formData,
                peso: Number(formData.peso),
                edad: Number(formData.edad),
            };
            if (mascota) {
                await actualizarMascota(mascota.id, payload);
                await Swal.fire("¡Éxito!", "Mascota actualizada correctamente.", "success");
            } else {
                await crearMascota(payload);
                await Swal.fire("¡Éxito!", "Mascota registrada correctamente.", "success");
            }
            await onSuccess();
            onClose();
        } catch (err) {
            console.error("Error al guardar mascota:", err);
            Swal.fire(
                "Error",
                err.response?.data?.message || "Ocurrió un error al guardar la mascota.",
                "error",
            );
        } finally {
            setGuardando(false);
        }
    };

    const configEspecie = obtenerEspecie(formData.especie);
    const IconoEspecie = configEspecie.icon;
    const esOtroSeleccionado =
        formData.especie === "Otro" ||
        (Boolean(formData.especie) && !ESPECIE_IDS.includes(formData.especie));

    const handleSeleccionarEspecie = (id) => {
        limpiarError("especie");
        setFormData((prev) => ({
            ...prev,
            especie: id === "Otro" ? especieOtroTexto.trim() || "Otro" : id,
        }));
    };

    const handleCambioOtro = (e) => {
        if (!REGEX_LETRAS.test(e.target.value)) return;
        setEspecieOtroTexto(e.target.value);
        setFormData((prev) => ({ ...prev, especie: e.target.value.trim() || "Otro" }));
        limpiarError("especie");
    };

    const inicial = formData.nombre ? formData.nombre.trim().charAt(0).toUpperCase() : "";
    const subtituloEnVivo = `${formData.especie || "Especie"} · ${formData.raza || "Raza"}`;

    let chipEdad = null;
    if (formData.fechaNacimiento) {
        const { edad, textoMeses: tm } = calcularEdadYMeses(formData.fechaNacimiento, hoy);
        chipEdad =
            edad === 0
                ? `Tiene ${(tm || "").replace(/[()]/g, "").trim() || "0 meses"}`
                : edad !== ""
                  ? `Tiene ${edad} ${edad === 1 ? "año" : "años"}`
                  : null;
    }

    return (
        <ModalFormulario
            titulo={
                mascota
                    ? `Editar ${formData.nombre || mascota.nombre || "mascota"}`
                    : "Nueva mascota"
            }
            subtitulo={subtituloEnVivo}
            inicial={inicial}
            avatarBg={configEspecie.bg}
            IconoEspecie={configEspecie.icon}
            fotoURL={formData.fotoURL}
            onCerrar={intentarCerrar}
            formRef={formRef}
        >
            <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 p-5 sm:p-6 space-y-6">
                <section className="flex flex-col gap-4 rounded-xl border border-gray-100 bg-gray-50 p-4 sm:flex-row sm:items-center">
                    <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-white bg-white shadow-sm">
                        {formData.fotoURL ? (
                            <img src={formData.fotoURL} alt={`Foto de ${formData.nombre || "la mascota"}`} className="h-full w-full object-cover" />
                        ) : (
                            <IconoEspecie className="h-8 w-8 text-gray-400" />
                        )}
                    </div>
                    <div className="min-w-0 flex-1">
                        <p className="font-semibold text-gray-800">Foto de la mascota</p>
                        <p className="mt-1 text-xs text-gray-500">Elige una imagen para identificarla en su tarjeta y ficha.</p>
                        <div className="mt-3 flex flex-wrap items-center gap-2">
                            <label
                                htmlFor="fotoMascota"
                                className="cursor-pointer rounded-lg bg-blue-700 px-3 py-2 text-sm font-semibold text-white transition hover:bg-blue-800"
                            >
                                {formData.fotoURL ? "Cambiar foto" : "Agregar foto"}
                            </label>
                            {formData.fotoURL && (
                                <button
                                    type="button"
                                    onClick={() => setFormData((prev) => ({ ...prev, fotoURL: "" }))}
                                    className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-600 transition hover:bg-white"
                                >
                                    Quitar foto
                                </button>
                            )}
                            <input
                                id="fotoMascota"
                                type="file"
                                accept="image/*"
                                onChange={handleSeleccionarFoto}
                                className="sr-only"
                            />
                        </div>
                    </div>
                </section>

                <div className="space-y-4">
                    <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                        <FaPaw className="text-blue-600 w-4 h-4" />
                        <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500">
                            Datos de la mascota
                        </h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <CampoFormulario
                            label="Nombre"
                            name="nombre"
                            value={formData.nombre}
                            onChange={handleChange}
                            placeholder="Ej: Max"
                            error={errores.nombre}
                            requerido
                        />
                        <CampoFormulario
                            label="Color"
                            name="color"
                            value={formData.color}
                            onChange={handleChange}
                            placeholder="Ej: Dorado"
                            error={errores.color}
                            requerido
                        />
                        <SelectorEspecie
                            especie={formData.especie}
                            esOtroSeleccionado={esOtroSeleccionado}
                            onSeleccionarEspecie={handleSeleccionarEspecie}
                            especieOtroTexto={especieOtroTexto}
                            onChangeOtro={handleCambioOtro}
                            error={errores.especie}
                        />
                        <CampoFormulario
                            label="Raza"
                            name="raza"
                            value={formData.raza}
                            onChange={handleChange}
                            placeholder="Ej: Golden Retriever"
                            error={errores.raza}
                            requerido
                        />
                        <SelectorSexo
                            sexo={formData.sexo}
                            onSeleccionarSexo={(s) => {
                                setFormData((p) => ({ ...p, sexo: s }));
                                limpiarError("sexo");
                            }}
                            error={errores.sexo}
                        />
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                        <FaHeartbeat className="text-red-500 w-4 h-4" />
                        <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500">
                            Salud
                        </h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <CampoFormulario
                            label="Fecha de nacimiento"
                            name="fechaNacimiento"
                            type="date"
                            max={hoy}
                            value={formData.fechaNacimiento}
                            onChange={handleChange}
                            error={errores.fechaNacimiento}
                            requerido
                            badge={
                                chipEdad && (
                                    <span className="font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                                        {chipEdad}
                                    </span>
                                )
                            }
                        />
                        <CampoFormulario
                            label="Peso (kg)"
                            name="peso"
                            type="number"
                            step="0.01"
                            min="0.01"
                            value={formData.peso}
                            onChange={handleChange}
                            onKeyDown={(e) =>
                                ["-", "+", "e", "E"].includes(e.key) && e.preventDefault()
                            }
                            placeholder="Ej: 12.5"
                            error={errores.peso}
                            requerido
                        />
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                        <FaUser className="text-blue-600 w-4 h-4" />
                        <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500">
                            Propietario y Contacto
                        </h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <CampoFormulario
                            label="Propietario"
                            name="propietario"
                            value={formData.propietario}
                            onChange={handleChange}
                            placeholder="Nombre del dueño"
                            error={errores.propietario}
                            requerido
                        />
                        <CampoFormulario
                            label="Teléfono"
                            name="telefono"
                            type="tel"
                            inputMode="tel"
                            maxLength={15}
                            value={formData.telefono}
                            onChange={handleChange}
                            placeholder="7123-4567 o +503 7123-4567"
                            error={errores.telefono}
                            requerido
                        />
                        <CampoFormulario
                            label="Dirección"
                            name="direccion"
                            value={formData.direccion}
                            onChange={handleChange}
                            placeholder="Ej: Col. Escalón, Pasaje 2, San Salvador"
                            error={errores.direccion}
                            className="col-span-1 md:col-span-2"
                            requerido
                        />
                    </div>
                </div>

                {!esCliente && (
                    <div className="space-y-3 pt-2">
                        <label className="text-sm font-medium text-gray-700 block">
                            Estado del registro
                        </label>
                        <div className="grid grid-cols-2 gap-2 max-w-xs">
                            {["Activo", "Inactivo"].map((est) => (
                                <button
                                    key={est}
                                    type="button"
                                    onClick={() =>
                                        setFormData((prev) => ({ ...prev, estado: est }))
                                    }
                                    className={`py-2 px-3 rounded-lg text-sm font-semibold border transition ${formData.estado === est ? (est === "Activo" ? "bg-blue-50 text-blue-700 border-blue-600 shadow-sm" : "bg-gray-100 text-gray-700 border-gray-400 shadow-sm") : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"}`}
                                >
                                    {est}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-3 pt-4 border-t border-gray-100">
                    <button
                        type="button"
                        onClick={intentarCerrar}
                        disabled={guardando}
                        className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-gray-300 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition"
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        disabled={guardando}
                        className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-sm font-semibold shadow-sm transition flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        {guardando ? (
                            <>
                                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                <span>Guardando...</span>
                            </>
                        ) : (
                            <>
                                <FaCheckCircle className="w-4 h-4" />
                                <span>{mascota ? "Actualizar mascota" : "Guardar mascota"}</span>
                            </>
                        )}
                    </button>
                </div>
            </form>
        </ModalFormulario>
    );
}
