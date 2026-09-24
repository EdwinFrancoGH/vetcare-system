/*"use client";

import { useEffect, useState } from "react";
import { obtenerMascotas } from "../../../services/mascotas.service";
import MascotasTable from "../../../components/mascotas/MascotasTable";

export default function MascotasPage() {

    const [mascotas, setMascotas] = useState([]);

    useEffect(() => {

        cargarMascotas();

    }, []);

    async function cargarMascotas() {

        try {

            const respuesta = await obtenerMascotas();

            setMascotas(respuesta.data.data);

        } catch (error) {

            console.error(error);

        }

    }

    return (

        <div>

            <div className="flex justify-between items-center mb-6">

                <h1 className="text-4xl font-bold text-gray-900">
                    Gestión de Mascotas
                </h1>

                <button
                    className="bg-blue-700 hover:bg-blue-800 text-white px-5 py-2 rounded-lg"
                >
                    Nueva Mascota
                </button>

            </div>

            <MascotasTable mascotas={mascotas} />

        </div>

    );

}*/

"use client";
import { useEffect, useState } from "react";
import { obtenerMascotas } from "../../../services/mascotas.service";
import MascotasTable from "../../../components/mascotas/MascotasTable";

import { eliminarMascota } from "../../../services/mascotas.service";//servicio de eliminar
import MascotaForm from "../../../components/mascotas/MascotaForm";//importamos el form
import ConfirmModal from "../../../components/ui/ConfirmModal";//modal de taiwin
import RequireRole from "../../../components/auth/RequireRole";


function MascotasPage() {

    const [mascotas, setMascotas] = useState([]);
    const [mostrarFormulario, setMostrarFormulario] = useState(false);
    const [mascotaEditar, setMascotaEditar] = useState(null);

    const [showModal, setShowModal] = useState(false);
    const [mascotaSeleccionada, setMascotaSeleccionada] = useState(null);

    useEffect(() => {
        cargarMascotas();
    }, []);

    async function cargarMascotas() {

        try {

            const respuesta = await obtenerMascotas();

            setMascotas(respuesta.data.data);

        } catch (error) {

            console.error("Error al cargar mascotas:", error);

        }

    }

    //FUNCION EDITAR MASCOTA
        function editarMascota(mascota) {
            setMascotaEditar(mascota);
            setMostrarFormulario(true);
        }
            //FUNCION ELIMINAR MASCOTA
        /*async function borrarMascota(id) {
            const confirmar = window.confirm(
                "¿Está seguro de eliminar esta mascota?"
            );
            if (!confirmar) return;
            try {
                await eliminarMascota(id);
                alert("Mascota eliminada correctamente.");
                cargarMascotas();
            } catch (error) {
                console.error(error);
                alert("Error al eliminar.");
            }
        }*/

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

                alert("Error al eliminar.");

            }
        }


    return (

        <div>

            <div className="flex justify-between items-center mb-6">

                <h1 className="text-4xl font-bold text-gray-900">
                    Gestión de Mascotas
                </h1>

                <button
                    onClick={() => setMostrarFormulario(true)}//abrir el formulario
                    className="bg-blue-700 hover:bg-blue-800 text-white px-5 py-2 rounded-lg"
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

            <MascotasTable
            mascotas={mascotas}
            onEditar={editarMascota}
            onEliminar={borrarMascota}
            />

            {/* AGREGO EL MODAL */}
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

// Mascotas/Historial/Vacunas muestran a TODOS los pacientes de la
// clínica (no están filtrados por dueño), así que se limitan al
// personal clínico. Un "Cliente" no debe listar mascotas ajenas.
export default function MascotasPageGuard() {
    return (
        <RequireRole roles={["Administrador", "Recepcionista", "Veterinario"]}>
            <MascotasPage />
        </RequireRole>
    );
}