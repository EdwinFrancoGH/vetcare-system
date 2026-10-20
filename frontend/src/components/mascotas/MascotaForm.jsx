"use client";

import { useEffect, useState, useRef } from "react";
import { crearMascota, actualizarMascota } from "../../services/mascotas.service";
import { useAuth } from "../../context/AuthContext";
import { hoyISO } from "../../utils/citas";
import Swal from "sweetalert2";

const REGEX_LETRAS = /^[A-Za-zÁÉÍÓÚáéíóúÑñÜü\s'-]*$/;
const REGEX_TELEFONO_INPUT = /^\+?[\d\s-]*$/;
const REGEX_TELEFONO_VALIDO = /^(\+?503[\s-]?)?[2-7]\d{3}[\s-]?\d{4}$/;

function calcularEdadYMeses(fechaNacISO, hoyFecha = hoyISO()) {
    if (!fechaNacISO || typeof fechaNacISO !== "string") {
        return { edad: "", textoMeses: "" };
    }
    const [anioNac, mesNac, diaNac] = fechaNacISO.slice(0, 10).split("-").map(Number);
    const [anioHoy, mesHoy, diaHoy] = hoyFecha.slice(0, 10).split("-").map(Number);
    if (!anioNac || !mesNac || !diaNac || !anioHoy || !mesHoy || !diaHoy) {
        return { edad: "", textoMeses: "" };
    }

    let anios = anioHoy - anioNac;
    let meses = mesHoy - mesNac;
    let dias = diaHoy - diaNac;

    if (dias < 0) {
        meses -= 1;
    }
    if (meses < 0) {
        anios -= 1;
        meses += 12;
    }

    if (anios < 0) {
        return { edad: 0, textoMeses: "(0 meses)" };
    }

    if (anios === 0) {
        const totalMeses = Math.max(0, meses);
        return { edad: 0, textoMeses: `(${totalMeses} ${totalMeses === 1 ? "mes" : "meses"})` };
    }

    return { edad: anios, textoMeses: "" };
}

export default function MascotaForm({ mascota, onClose, onSuccess }) {
    const { userRole, userData } = useAuth();
    const esCliente = userRole === "Cliente";
    const hoy = hoyISO();

    const formRef = useRef(null);

    const [formData, setFormData] = useState({
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
    });

    const [textoMeses, setTextoMeses] = useState("");
    const [guardando, setGuardando] = useState(false);

    useEffect(() => {
        if (mascota) {
            const { edad, textoMeses: tm } = calcularEdadYMeses(mascota.fechaNacimiento, hoy);
            setFormData({
                nombre: String(mascota.nombre ?? ""),
                especie: String(mascota.especie ?? ""),
                raza: String(mascota.raza ?? ""),
                sexo: String(mascota.sexo ?? ""),
                edad: edad !== "" ? edad : (mascota.edad ?? ""),
                peso: mascota.peso !== undefined && mascota.peso !== null ? String(mascota.peso) : "",
                color: String(mascota.color ?? ""),
                fechaNacimiento: String(mascota.fechaNacimiento ?? ""),
                propietario: String(mascota.propietario ?? ""),
                telefono: String(mascota.telefono ?? ""),
                direccion: String(mascota.direccion ?? ""),
                estado: String(mascota.estado ?? "Activo"),
            });
            setTextoMeses(tm);
        } else {
            // Reiniciar a valores vacíos (con precarga de propietario y teléfono para el Cliente)
            setFormData({
                nombre: "",
                especie: "",
                raza: "",
                sexo: "",
                edad: "",
                peso: "",
                color: "",
                fechaNacimiento: "",
                propietario: esCliente ? String(userData?.name ?? "") : "",
                telefono: esCliente ? String(userData?.phone ?? userData?.telefono ?? "") : "",
                direccion: "",
                estado: "Activo",
            });
            setTextoMeses("");
        }

        // Scroll suave hacia el formulario al abrir (crear o editar)
        setTimeout(() => {
            formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 50);
    }, [mascota, esCliente, userData, hoy]);

    const handleChange = (e) => {
        const { name, value } = e.target;

        // 1.1 Letras, tildes, ñ, ü, espacios, guion y apóstrofo
        if (["nombre", "raza", "color", "propietario"].includes(name)) {
            if (!REGEX_LETRAS.test(value)) {
                return;
            }
        }

        // 1.1 Teléfono: solo dígitos, espacio, guion y "+" al inicio
        if (name === "telefono") {
            if (!REGEX_TELEFONO_INPUT.test(value)) {
                return;
            }
        }

        // 1.1 Peso: sin -, +, e, E
        if (name === "peso") {
            if (value.includes("-") || value.includes("+") || value.toLowerCase().includes("e")) {
                return;
            }
        }

        // 1.2 Edad calculada automáticamente con fechaNacimiento
        if (name === "fechaNacimiento") {
            const { edad, textoMeses: tm } = calcularEdadYMeses(value, hoy);
            setFormData((prev) => ({
                ...prev,
                fechaNacimiento: value,
                edad: edad,
            }));
            setTextoMeses(tm);
            return;
        }

        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handlePesoKeyDown = (e) => {
        if (["-", "+", "e", "E"].includes(e.key)) {
            e.preventDefault();
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const nombre = String(formData.nombre ?? "").trim();
        const especie = String(formData.especie ?? "").trim();
        const raza = String(formData.raza ?? "").trim();
        const sexo = String(formData.sexo ?? "").trim();
        const color = String(formData.color ?? "").trim();
        const fechaNacimiento = String(formData.fechaNacimiento ?? "").trim();
        const propietario = String(formData.propietario ?? "").trim();
        const telefono = String(formData.telefono ?? "").trim();
        const direccion = String(formData.direccion ?? "").trim();
        const pesoStr = String(formData.peso ?? "").trim();
        const pesoNum = Number(pesoStr);

        if (!nombre) {
            Swal.fire("Campo requerido", "El nombre de la mascota es obligatorio.", "warning");
            return;
        }
        if (!especie) {
            Swal.fire("Campo requerido", "Debe seleccionar la especie de la mascota.", "warning");
            return;
        }
        if (!raza) {
            Swal.fire("Campo requerido", "La raza de la mascota es obligatoria.", "warning");
            return;
        }
        if (!sexo) {
            Swal.fire("Campo requerido", "Debe seleccionar el sexo de la mascota.", "warning");
            return;
        }
        if (!color) {
            Swal.fire("Campo requerido", "El color de la mascota es obligatorio.", "warning");
            return;
        }
        if (!fechaNacimiento) {
            Swal.fire("Campo requerido", "La fecha de nacimiento es obligatoria.", "warning");
            return;
        }
        if (pesoStr === "" || pesoNum <= 0 || isNaN(pesoNum)) {
            Swal.fire("Campo inválido", "El peso debe ser mayor a 0 kg.", "warning");
            return;
        }
        if (!propietario) {
            Swal.fire("Campo requerido", "El nombre del propietario es obligatorio.", "warning");
            return;
        }
        if (!telefono) {
            Swal.fire("Campo requerido", "El teléfono de contacto es obligatorio.", "warning");
            return;
        }
        if (!REGEX_TELEFONO_VALIDO.test(telefono)) {
            Swal.fire("Teléfono inválido", "Ingrese un número de teléfono válido de El Salvador (8 dígitos, ej: 7123-4567 o +503 7123-4567).", "warning");
            return;
        }
        if (!direccion) {
            Swal.fire("Campo requerido", "La dirección es obligatoria.", "warning");
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
        } catch (error) {
            console.error("Error al guardar mascota:", error);
            Swal.fire("Error", error.response?.data?.message || "Ocurrió un error al guardar la mascota.", "error");
        } finally {
            setGuardando(false);
        }
    };

    return (
        <form
            ref={formRef}
            onSubmit={handleSubmit}
            className="bg-white rounded-xl shadow-lg p-6 mb-6"
        >
            <h2 className="text-2xl font-bold text-gray-800 mb-6">
                {mascota ? "Editar Mascota" : "Nueva Mascota"}
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-600">
                <div>
                    <label className="block mb-1 font-medium">Nombre</label>
                    <input
                        type="text"
                        name="nombre"
                        value={formData.nombre}
                        onChange={handleChange}
                        className="w-full border rounded-lg px-3 py-2"
                        placeholder="Ej: Max"
                    />
                </div>

                <div>
                    <label className="block mb-1 font-medium">Especie</label>
                    <select
                        name="especie"
                        value={formData.especie}
                        onChange={handleChange}
                        className="w-full border rounded-lg px-3 py-2"
                    >
                        <option value="">Seleccione</option>
                        <option value="Perro">Perro</option>
                        <option value="Gato">Gato</option>
                        <option value="Ave">Ave</option>
                        <option value="Conejo">Conejo</option>
                        <option value="Otro">Otro</option>
                    </select>
                </div>

                <div>
                    <label className="block mb-1 font-medium">Raza</label>
                    <input
                        type="text"
                        name="raza"
                        value={formData.raza}
                        onChange={handleChange}
                        className="w-full border rounded-lg px-3 py-2"
                        placeholder="Ej: Golden Retriever"
                    />
                </div>

                <div>
                    <label className="block mb-1 font-medium">Sexo</label>
                    <select
                        name="sexo"
                        value={formData.sexo}
                        onChange={handleChange}
                        className="w-full border rounded-lg px-3 py-2"
                    >
                        <option value="">Seleccione</option>
                        <option value="Macho">Macho</option>
                        <option value="Hembra">Hembra</option>
                    </select>
                </div>

                <div>
                    <label className="block mb-1 font-medium">Color</label>
                    <input
                        type="text"
                        name="color"
                        value={formData.color}
                        onChange={handleChange}
                        className="w-full border rounded-lg px-3 py-2"
                        placeholder="Ej: Dorado"
                    />
                </div>

                <div>
                    <label className="block mb-1 font-medium">Fecha de Nacimiento</label>
                    <input
                        type="date"
                        name="fechaNacimiento"
                        value={formData.fechaNacimiento}
                        onChange={handleChange}
                        max={hoy}
                        className="w-full border rounded-lg px-3 py-2"
                    />
                </div>

                <div>
                    <label className="block mb-1 font-medium">Edad (años)</label>
                    <div className="flex items-center gap-2">
                        <input
                            type="number"
                            name="edad"
                            value={formData.edad}
                            readOnly
                            placeholder="0"
                            className="w-full border rounded-lg px-3 py-2 bg-gray-100 text-gray-700 cursor-not-allowed"
                        />
                        {textoMeses && (
                            <span className="text-sm font-medium text-gray-600 whitespace-nowrap">
                                {textoMeses}
                            </span>
                        )}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Se calcula con la fecha de nacimiento</p>
                </div>

                <div>
                    <label className="block mb-1 font-medium">Peso (kg)</label>
                    <input
                        type="number"
                        min="0.1"
                        step="0.1"
                        inputMode="decimal"
                        name="peso"
                        value={formData.peso}
                        onChange={handleChange}
                        onKeyDown={handlePesoKeyDown}
                        placeholder="Ej: 8.5"
                        className="w-full border rounded-lg px-3 py-2"
                    />
                </div>

                <div>
                    <label className="block mb-1 font-medium">Propietario</label>
                    <input
                        type="text"
                        name="propietario"
                        value={formData.propietario}
                        onChange={handleChange}
                        className="w-full border rounded-lg px-3 py-2"
                        placeholder="Ej: Juan Pérez"
                    />
                </div>

                <div>
                    <label className="block mb-1 font-medium">Teléfono</label>
                    <input
                        type="text"
                        inputMode="tel"
                        maxLength={15}
                        placeholder="7123-4567"
                        name="telefono"
                        value={formData.telefono}
                        onChange={handleChange}
                        className="w-full border rounded-lg px-3 py-2"
                    />
                </div>
            </div>

            <div className="mt-4">
                <label className="block mb-1 font-medium text-gray-600">Dirección</label>
                <textarea
                    name="direccion"
                    value={formData.direccion}
                    onChange={handleChange}
                    rows="3"
                    placeholder="Ej: Calle Principal #123, San Salvador"
                    className="w-full border rounded-lg px-3 py-2 text-gray-600"
                />
            </div>

            <div className="mt-4">
                <label className="block mb-1 font-medium text-gray-600">Estado</label>
                <select
                    name="estado"
                    value={formData.estado}
                    onChange={handleChange}
                    className="w-full border rounded-lg px-3 py-2 text-gray-600"
                >
                    <option value="Activo">Activo</option>
                    <option value="En tratamiento">En tratamiento</option>
                    <option value="Inactivo">Inactivo</option>
                </select>
            </div>

            <div className="flex gap-3 mt-6">
                <button
                    type="submit"
                    disabled={guardando}
                    className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {guardando ? "Guardando..." : "Guardar"}
                </button>

                <button
                    type="button"
                    onClick={onClose}
                    disabled={guardando}
                    className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-lg font-medium transition disabled:opacity-50"
                >
                    Cancelar
                </button>
            </div>
        </form>
    );
}