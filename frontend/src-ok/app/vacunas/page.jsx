"use client";

import { useEffect, useState } from "react";
import { obtenerVacunas, eliminarVacuna } from "../../services/vacunas.service";
import { obtenerMascotas } from "../../services/mascotas.service";
import VacunasTable from "../../components/vacunas/VacunasTable";
import VacunaForm from "../../components/vacunas/VacunaForm";
import ConfirmModal from "../../components/ui/ConfirmModal";

export default function VacunasPage() {

    const [vacunas, setVacunas] = useState([]);
    const [mascotas, setMascotas] = useState([]);
    const [mostrarFormulario, setMostrarFormulario] = useState(false);
    const [vacunaEditar, setVacunaEditar] = useState(null);

    const [showModal, setShowModal] = useState(false);
    const [vacunaSeleccionada, setVacunaSeleccionada] = useState(null);

    useEffect(() => {
        cargarDatos();
    }, []);

    async function cargarDatos() {

        try {

            const [respVacunas, respMascotas] = await Promise.all([
                obtenerVacunas(),
                obtenerMascotas(),
            ]);

            setVacunas(respVacunas.data.data);
            setMascotas(respMascotas.data.data);

        } catch (error) {

            console.error("Error al cargar vacunas:", error);

        }

    }

    // FUNCION EDITAR VACUNA
    function editarVacuna(vacuna) {
        setVacunaEditar(vacuna);
        setMostrarFormulario(true);
    }

    // FUNCION ELIMINAR VACUNA
    function borrarVacuna(id) {
        setVacunaSeleccionada(id);
        setShowModal(true);
    }

    async function confirmarEliminar() {

        try {

            await eliminarVacuna(vacunaSeleccionada);

            cargarDatos();

            setShowModal(false);
            setVacunaSeleccionada(null);

        } catch (error) {

            console.error(error);

            alert("Error al eliminar.");

        }

    }

    return (

        <div>

            <div className="flex justify-between items-center mb-6">

                <h1 className="text-4xl font-bold text-gray-900">
                    Vacunas
                </h1>

                <button
                    onClick={() => setMostrarFormulario(true)}
                    className="bg-blue-700 hover:bg-blue-800 text-white px-5 py-2 rounded-lg"
                >
                    Nueva Vacuna
                </button>

            </div>

            {mostrarFormulario && (
                <VacunaForm
                    vacuna={vacunaEditar}
                    mascotas={mascotas}
                    onClose={() => {
                        setMostrarFormulario(false);
                        setVacunaEditar(null);
                    }}
                    onSuccess={cargarDatos}
                />
            )}

            <VacunasTable
                vacunas={vacunas}
                mascotas={mascotas}
                onEditar={editarVacuna}
                onEliminar={borrarVacuna}
            />

            <ConfirmModal
                open={showModal}
                title="Eliminar vacuna"
                message="¿Está seguro de eliminar esta vacuna? Esta acción no se puede deshacer."
                onCancel={() => {
                    setShowModal(false);
                    setVacunaSeleccionada(null);
                }}
                onConfirm={confirmarEliminar}
            />

        </div>

    );

}
