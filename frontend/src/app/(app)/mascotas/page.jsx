"use client";

import { useEffect, useState } from "react";
import { obtenerMascotas, eliminarMascota } from "../../../services/mascotas.service";
import { obtenerVacunasPorMascota } from "../../../services/vacunas.service";
import MascotasTable from "../../../components/mascotas/MascotasTable";
import MascotaCard from "../../../components/mascotas/MascotaCard";
import MascotaForm from "../../../components/mascotas/MascotaForm";
import ConfirmModal from "../../../components/ui/ConfirmModal";
import RequireRole from "../../../components/auth/RequireRole";
import { useAuth } from "../../../context/AuthContext";
import { FaPaw, FaPlus } from "react-icons/fa";
import Swal from "sweetalert2";

function MascotasPage() {
    const { userRole } = useAuth();
    const esCliente = userRole === "Cliente";

    const [mascotas, setMascotas] = useState([]);
    const [vacunasPorMascota, setVacunasPorMascota] = useState({});
    const [, setCargando] = useState(true);

    const [mostrarFormulario, setMostrarFormulario] = useState(false);
    const [mascotaEditar, setMascotaEditar] = useState(null);

    const [showModal, setShowModal] = useState(false);
    const [mascotaSeleccionada, setMascotaSeleccionada] = useState(null);

    useEffect(() => {
        cargarMascotas();
    }, [esCliente]);

    async function cargarMascotas() {
        try {
            setCargando(true);
            const respuesta = await obtenerMascotas();
            const listaMascotas = respuesta.data?.data || [];
            setMascotas(listaMascotas);

            if (esCliente && listaMascotas.length > 0) {
                const resultados = await Promise.allSettled(
                    listaMascotas.map((m) => obtenerVacunasPorMascota(m.id))
                );
                const mapa = {};
                resultados.forEach((res, index) => {
                    const id = listaMascotas[index]?.id;
                    if (id) {
                        mapa[id] = res.status === "fulfilled" ? (res.value.data?.data || []) : [];
                    }
                });
                setVacunasPorMascota(mapa);
            } else {
                setVacunasPorMascota({});
            }
        } catch (error) {
            console.error("Error al cargar mascotas:", error);
            Swal.fire("Error", "No se pudieron cargar los datos. Verifica tu conexión e inténtalo de nuevo.", "error");
        } finally {
            setCargando(false);
        }
    }

    function editarMascota(mascota) {
        setMascotaEditar(mascota);
        setMostrarFormulario(true);
    }

    function borrarMascota(id) {
        setMascotaSeleccionada(id);
        setShowModal(true);
    }

    async function confirmarEliminar() {
        try {
            await eliminarMascota(mascotaSeleccionada);
            cargarMascotas();
            setShowModal(false);
            setMascotaSeleccionada(null);
        } catch (error) {
            console.error(error);
            Swal.fire("Error", "No se pudo eliminar la mascota.", "error");
        }
    }

    return (
        <div>
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
                <div>
                    <h1 className="text-4xl font-bold text-gray-900">
                        {esCliente ? "Mis Mascotas" : "Gestión de Mascotas"}
                    </h1>
                    {esCliente && (
                        <p className="text-gray-500 mt-1">
                            Tienes {mascotas.length} mascota{mascotas.length === 1 ? "" : "s"} registrada{mascotas.length === 1 ? "" : "s"}.
                        </p>
                    )}
                </div>

                <button
                    onClick={() => {
                        setMascotaEditar(null);
                        setMostrarFormulario(true);
                    }}
                    className="bg-blue-700 hover:bg-blue-800 text-white px-5 py-2 rounded-lg font-medium shadow-sm transition-colors self-start sm:self-auto"
                >
                    Nueva Mascota
                </button>
            </div>

            {mostrarFormulario && (
                <MascotaForm
                    mascota={mascotaEditar}
                    onClose={() => {
                        setMostrarFormulario(false);
                        setMascotaEditar(null);
                    }}
                    onSuccess={cargarMascotas}
                />
            )}

            {/* Vista condicional: Tarjetas para Cliente, Tabla para Personal */}
            {esCliente ? (
                mascotas.length === 0 ? (
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center flex flex-col items-center justify-center my-6">
                        <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center text-4xl mb-4">
                            <FaPaw />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">
                            Aún no has registrado mascotas
                        </h3>
                        <p className="text-gray-500 max-w-md mb-6 text-sm">
                            Registra a tu compañero para llevar el control de sus vacunas, citas y todo su historial médico.
                        </p>
                        <button
                            type="button"
                            onClick={() => {
                                setMascotaEditar(null);
                                setMostrarFormulario(true);
                            }}
                            className="bg-blue-700 hover:bg-blue-800 text-white px-6 py-2.5 rounded-xl font-semibold shadow transition-colors inline-flex items-center gap-2"
                        >
                            <FaPlus className="w-4 h-4" />
                            Registrar mi primera mascota
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {mascotas.map((mascota) => (
                            <MascotaCard
                                key={mascota.id}
                                mascota={mascota}
                                vacunas={vacunasPorMascota[mascota.id] || []}
                                onEditar={editarMascota}
                                onEliminar={borrarMascota}
                            />
                        ))}
                    </div>
                )
            ) : (
                <MascotasTable
                    mascotas={mascotas}
                    onEditar={editarMascota}
                    onEliminar={borrarMascota}
                    mostrarFicha={true}
                />
            )}

            {/* Modal de confirmación para eliminar */}
            <ConfirmModal
                open={showModal}
                title="Eliminar mascota"
                message="¿Está seguro de eliminar esta mascota? Esta acción no se puede deshacer."
                onCancel={() => {
                    setShowModal(false);
                    setMascotaSeleccionada(null);
                }}
                onConfirm={confirmarEliminar}
            />
        </div>
    );
}

export default function MascotasPageGuard() {
    return (
        <RequireRole roles={["Administrador", "Recepcionista", "Veterinario", "Cliente"]}>
            <MascotasPage />
        </RequireRole>
    );
}