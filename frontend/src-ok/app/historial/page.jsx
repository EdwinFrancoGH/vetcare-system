"use client";

import { useEffect, useState } from "react";
import { obtenerHistoriales, eliminarHistorial } from "../../services/historial.service";
import { obtenerMascotas } from "../../services/mascotas.service";
import HistorialTable from "../../components/historial/HistorialTable";
import HistorialForm from "../../components/historial/HistorialForm";
import FichaConsultaModal from "../../components/historial/FichaConsultaModal";
import ConfirmModal from "../../components/ui/ConfirmModal";

export default function HistorialPage() {

    const [historiales, setHistoriales] = useState([]);
    const [mascotas, setMascotas] = useState([]);
    const [mostrarFormulario, setMostrarFormulario] = useState(false);
    const [historialEditar, setHistorialEditar] = useState(null);

    const [showModal, setShowModal] = useState(false);
    const [historialSeleccionado, setHistorialSeleccionado] = useState(null);

    // Ficha de consulta (se abre al hacer clic en una fila de la tabla)
    const [mostrarFicha, setMostrarFicha] = useState(false);
    const [historialFicha, setHistorialFicha] = useState(null);

    useEffect(() => {
        cargarDatos();
    }, []);

    async function cargarDatos() {

        try {

            const [respHistoriales, respMascotas] = await Promise.all([
                obtenerHistoriales(),
                obtenerMascotas(),
            ]);

            setHistoriales(respHistoriales.data.historiales);
            setMascotas(respMascotas.data.data);

        } catch (error) {

            console.error("Error al cargar historial clínico:", error);

        }

    }

    // FUNCION VER FICHA (clic en la fila)
    function verFicha(historial) {
        setHistorialFicha(historial);
        setMostrarFicha(true);
    }

    // Permite pasar de la ficha directamente al formulario de edición
    function editarDesdeFicha(historial) {
        setMostrarFicha(false);
        setHistorialFicha(null);
        editarHistorial(historial);
    }

    // Resuelve la mascota completa de la consulta mostrada en la ficha
    function mascotaDeHistorial(historial) {
        if (!historial) return null;
        return mascotas.find((m) => m.id === historial.mascotaId) || null;
    }

    // FUNCION EDITAR CONSULTA
    function editarHistorial(historial) {
        setHistorialEditar(historial);
        setMostrarFormulario(true);
    }

    // FUNCION ELIMINAR CONSULTA
    function borrarHistorial(id) {
        setHistorialSeleccionado(id);
        setShowModal(true);
    }

    async function confirmarEliminar() {

        try {

            await eliminarHistorial(historialSeleccionado);

            cargarDatos();

            setShowModal(false);
            setHistorialSeleccionado(null);

        } catch (error) {

            console.error(error);

            alert("Error al eliminar.");

        }

    }

    return (

        <div>

            <div className="flex justify-between items-center mb-6">

                <h1 className="text-4xl font-bold text-gray-900">
                    Historial Clínico
                </h1>

                <button
                    onClick={() => setMostrarFormulario(true)}
                    className="bg-blue-700 hover:bg-blue-800 text-white px-5 py-2 rounded-lg"
                >
                    Nueva Consulta
                </button>

            </div>

            {mostrarFormulario && (
                <HistorialForm
                    historial={historialEditar}
                    mascotas={mascotas}
                    onClose={() => {
                        setMostrarFormulario(false);
                        setHistorialEditar(null);
                    }}
                    onSuccess={cargarDatos}
                />
            )}

            <HistorialTable
                historiales={historiales}
                mascotas={mascotas}
                onVerFicha={verFicha}
                onEditar={editarHistorial}
                onEliminar={borrarHistorial}
            />

            <FichaConsultaModal
                open={mostrarFicha}
                historial={historialFicha}
                mascota={mascotaDeHistorial(historialFicha)}
                onClose={() => {
                    setMostrarFicha(false);
                    setHistorialFicha(null);
                }}
                onEditar={editarDesdeFicha}
            />

            <ConfirmModal
                open={showModal}
                title="Eliminar consulta"
                message="¿Está seguro de eliminar esta consulta del historial? Esta acción no se puede deshacer."
                onCancel={() => {
                    setShowModal(false);
                    setHistorialSeleccionado(null);
                }}
                onConfirm={confirmarEliminar}
            />

        </div>

    );

}
