"use client";

import { useEffect, useState } from "react";
import RequireRole from "../../../components/auth/RequireRole";
import {
    actualizarServicioVeterinario,
    cambiarEstadoServicioVeterinario,
    crearServicioVeterinario,
    obtenerServiciosVeterinarios,
} from "../../../services/servicios-veterinarios.service";

const formularioVacio = { nombre: "", descripcion: "", precioUsd: "" };

const formatearPrecio = (centavos) => new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
}).format(Number(centavos) / 100);

const convertirPrecioCentavos = (valor) => {
    const texto = String(valor).trim();
    if (!/^\d+(\.\d{1,2})?$/.test(texto)) return null;
    const [unidades, fraccion = ""] = texto.split(".");
    const centavos = Number(unidades) * 100 + Number(fraccion.padEnd(2, "0"));
    return Number.isSafeInteger(centavos) && centavos > 0 ? centavos : null;
};

function ServiciosVeterinariosPage() {
    const [servicios, setServicios] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [guardando, setGuardando] = useState(false);
    const [servicioEditando, setServicioEditando] = useState(null);
    const [mostrarFormulario, setMostrarFormulario] = useState(false);
    const [formulario, setFormulario] = useState(formularioVacio);
    const [error, setError] = useState("");
    const [mensaje, setMensaje] = useState("");

    const cargarServicios = async () => {
        try {
            setCargando(true);
            setError("");
            const respuesta = await obtenerServiciosVeterinarios();
            setServicios(respuesta.data?.data || []);
        } catch (err) {
            setError(err.response?.data?.message || "No se pudo cargar el catálogo de servicios.");
        } finally {
            setCargando(false);
        }
    };

    useEffect(() => {
        obtenerServiciosVeterinarios()
            .then((respuesta) => setServicios(respuesta.data?.data || []))
            .catch((err) => setError(err.response?.data?.message || "No se pudo cargar el catalogo de servicios."))
            .finally(() => setCargando(false));
    }, []);

    const limpiarFormulario = () => {
        setServicioEditando(null);
        setMostrarFormulario(false);
        setFormulario(formularioVacio);
        setError("");
    };

    const editar = (servicio) => {
        setServicioEditando(servicio);
        setMostrarFormulario(true);
        setFormulario({
            nombre: servicio.nombre,
            descripcion: servicio.descripcion || "",
            precioUsd: (Number(servicio.precioCentavos) / 100).toFixed(2),
        });
        setError("");
        setMensaje("");
    };

    const guardar = async (event) => {
        event.preventDefault();
        const precioCentavos = convertirPrecioCentavos(formulario.precioUsd);
        if (precioCentavos === null) {
            setError("Ingresa una tarifa positiva en USD, con máximo dos decimales.");
            return;
        }

        const datos = {
            nombre: formulario.nombre,
            descripcion: formulario.descripcion,
            precioCentavos,
        };
        try {
            setGuardando(true);
            setError("");
            if (servicioEditando) await actualizarServicioVeterinario(servicioEditando.id, datos);
            else await crearServicioVeterinario(datos);
            limpiarFormulario();
            setMensaje(servicioEditando ? "Servicio actualizado." : "Servicio creado.");
            await cargarServicios();
        } catch (err) {
            setError(err.response?.data?.message || "No se pudo guardar el servicio.");
        } finally {
            setGuardando(false);
        }
    };

    const cambiarActivo = async (servicio) => {
        const activoNuevo = servicio.activo !== true;
        const accion = activoNuevo ? "activar" : "desactivar";
        if (!window.confirm(`¿Deseas ${accion} el servicio “${servicio.nombre}”?`)) return;
        try {
            setError("");
            setMensaje("");
            await cambiarEstadoServicioVeterinario(servicio.id, activoNuevo);
            setMensaje(activoNuevo ? "Servicio activado." : "Servicio desactivado.");
            await cargarServicios();
        } catch (err) {
            setError(err.response?.data?.message || "No se pudo cambiar el estado del servicio.");
        }
    };

    return (
        <RequireRole roles={["Administrador"]}>
            <main className="mx-auto max-w-7xl">
                <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Servicios veterinarios</h1>
                        <p className="mt-2 text-gray-600">Administra el catálogo y sus tarifas fijas en USD.</p>
                    </div>
                    {!mostrarFormulario && (
                        <button
                            type="button"
                            onClick={() => { setFormulario(formularioVacio); setMostrarFormulario(true); setError(""); setMensaje(""); }}
                            className="rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white transition hover:bg-blue-700"
                        >
                            + Nuevo servicio
                        </button>
                    )}
                </header>

                {mensaje && <p role="status" className="mb-5 rounded-lg bg-green-100 p-4 text-green-800">{mensaje}</p>}
                {error && <p role="alert" className="mb-5 rounded-lg bg-red-100 p-4 text-red-700">{error}</p>}

                {mostrarFormulario && (
                    <form onSubmit={guardar} className="mb-8 rounded-xl bg-white p-6 shadow">
                        <h2 className="mb-5 text-xl font-bold text-gray-900">
                            {servicioEditando ? "Editar servicio" : "Nuevo servicio"}
                        </h2>
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <label className="text-sm font-medium text-gray-700">
                                Nombre
                                <input
                                    type="text"
                                    value={formulario.nombre}
                                    onChange={(event) => setFormulario({ ...formulario, nombre: event.target.value })}
                                    maxLength={120}
                                    required
                                    className="mt-1 w-full rounded-lg border border-gray-300 p-3 text-gray-900"
                                />
                            </label>
                            <label className="text-sm font-medium text-gray-700">
                                Tarifa (USD)
                                <input
                                    type="number"
                                    inputMode="decimal"
                                    min="0.01"
                                    step="0.01"
                                    value={formulario.precioUsd}
                                    onChange={(event) => setFormulario({ ...formulario, precioUsd: event.target.value })}
                                    required
                                    className="mt-1 w-full rounded-lg border border-gray-300 p-3 text-gray-900"
                                />
                            </label>
                            <label className="text-sm font-medium text-gray-700 md:col-span-2">
                                Descripción
                                <textarea
                                    value={formulario.descripcion}
                                    onChange={(event) => setFormulario({ ...formulario, descripcion: event.target.value })}
                                    maxLength={1000}
                                    rows={3}
                                    className="mt-1 w-full rounded-lg border border-gray-300 p-3 text-gray-900"
                                />
                            </label>
                        </div>
                        <div className="mt-5 flex justify-end gap-3">
                            <button type="button" onClick={limpiarFormulario} disabled={guardando} className="rounded-lg border border-gray-300 px-5 py-2 text-gray-700 hover:bg-gray-100">
                                Cancelar
                            </button>
                            <button type="submit" disabled={guardando} className="rounded-lg bg-blue-600 px-5 py-2 font-semibold text-white hover:bg-blue-700 disabled:opacity-60">
                                {guardando ? "Guardando…" : servicioEditando ? "Guardar cambios" : "Crear servicio"}
                            </button>
                        </div>
                    </form>
                )}

                <section className="overflow-hidden rounded-xl bg-white shadow">
                    {cargando ? <p className="p-6 text-gray-600">Cargando catálogo…</p> : servicios.length === 0 ? (
                        <p className="p-6 text-gray-600">No hay servicios veterinarios registrados.</p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Servicio</th>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Descripción</th>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Tarifa</th>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Estado</th>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {servicios.map((servicio) => (
                                        <tr key={servicio.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 font-medium text-gray-900">{servicio.nombre}</td>
                                            <td className="max-w-md px-6 py-4 text-gray-600">{servicio.descripcion || "—"}</td>
                                            <td className="px-6 py-4 font-semibold text-gray-900">{formatearPrecio(servicio.precioCentavos)}</td>
                                            <td className="px-6 py-4">
                                                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${servicio.activo ? "bg-green-100 text-green-800" : "bg-gray-200 text-gray-700"}`}>
                                                    {servicio.activo ? "Activo" : "Inactivo"}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-wrap gap-2">
                                                    <button type="button" onClick={() => editar(servicio)} className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-600">Editar</button>
                                                    <button type="button" onClick={() => cambiarActivo(servicio)} className={`rounded-lg px-4 py-2 text-sm font-semibold text-white ${servicio.activo ? "bg-gray-600 hover:bg-gray-700" : "bg-green-600 hover:bg-green-700"}`}>
                                                        {servicio.activo ? "Desactivar" : "Activar"}
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </section>
            </main>
        </RequireRole>
    );
}

export default ServiciosVeterinariosPage;
