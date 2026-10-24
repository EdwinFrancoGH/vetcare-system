"use client";

import { useState, useMemo } from "react";
import MascotaRow from "./MascotaRow";
import { FaSearch } from "react-icons/fa";

function normalizarTexto(texto) {
    return (texto || "")
        .toString()
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
}

export default function MascotasTable({ mascotas = [], onEditar, onEliminar, mostrarFicha = true }) {
    const [busqueda, setBusqueda] = useState("");
    const [especieFiltro, setEspecieFiltro] = useState("Todas");

    const especies = useMemo(() => {
        const set = new Set();
        for (const m of mascotas) {
            if (m.especie && m.especie.trim()) {
                set.add(m.especie.trim());
            }
        }
        return Array.from(set).sort((a, b) => a.localeCompare(b));
    }, [mascotas]);

    const mascotasFiltradas = useMemo(() => {
        return mascotas.filter((m) => {
            const matchEspecie =
                especieFiltro === "Todas" ||
                (m.especie || "").trim().toLowerCase() === especieFiltro.trim().toLowerCase();

            if (!matchEspecie) return false;

            if (!busqueda.trim()) return true;

            const q = normalizarTexto(busqueda);
            const nombreNorm = normalizarTexto(m.nombre);
            const propNorm = normalizarTexto(m.propietario);

            return nombreNorm.includes(q) || propNorm.includes(q);
        });
    }, [mascotas, busqueda, especieFiltro]);

    return (
        <div className="space-y-4">
            {/* Buscador, filtro de especie y contador */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 flex-1">
                    {/* Buscador */}
                    <div className="relative flex-1 max-w-md">
                        <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                            <FaSearch className="w-4 h-4" />
                        </span>
                        <input
                            type="text"
                            value={busqueda}
                            onChange={(e) => setBusqueda(e.target.value)}
                            placeholder="Buscar por nombre o propietario..."
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                        />
                    </div>

                    {/* Selector de especie */}
                    <div className="flex items-center gap-2">
                        <label htmlFor="especieFiltro" className="text-sm font-medium text-gray-700 whitespace-nowrap">
                            Especie:
                        </label>
                        <select
                            id="especieFiltro"
                            value={especieFiltro}
                            onChange={(e) => setEspecieFiltro(e.target.value)}
                            className="border border-gray-300 rounded-lg py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
                        >
                            <option value="Todas">Todas</option>
                            {especies.map((esp) => (
                                <option key={esp} value={esp}>
                                    {esp}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Contador */}
                <div className="text-sm text-gray-600 font-medium">
                    Mostrando {mascotasFiltradas.length} de {mascotas.length} mascotas
                </div>
            </div>

            {/* Tabla */}
            <div className="bg-white rounded-xl shadow overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-[640px] w-full">
                        <thead className="bg-blue-900 text-white">
                            <tr>
                                <th className="p-4 text-left">Nombre</th>
                                <th className="p-4 text-left">Propietario</th>
                                <th className="p-4 text-left">Especie</th>
                                <th className="p-4 text-left">Raza</th>
                                <th className="p-4 text-left">Sexo</th>
                                <th className="p-4 text-left">Edad</th>
                                <th className="p-4 text-center">Acciones</th>
                            </tr>
                        </thead>

                        <tbody>
                            {mascotas.length === 0 && (
                                <tr>
                                    <td colSpan={7} className="p-6 text-center text-gray-500">
                                        No hay mascotas registradas todavía.
                                    </td>
                                </tr>
                            )}
                            {mascotas.length > 0 && mascotasFiltradas.length === 0 && (
                                <tr>
                                    <td colSpan={7} className="p-6 text-center text-gray-500">
                                        No se encontraron mascotas que coincidan con los filtros.
                                    </td>
                                </tr>
                            )}
                            {mascotasFiltradas.map((mascota) => (
                                <MascotaRow
                                    key={mascota.id}
                                    mascota={mascota}
                                    onEditar={onEditar}
                                    onEliminar={onEliminar}
                                    mostrarFicha={mostrarFicha}
                                />
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}