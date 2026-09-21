"use client";

import { useEffect, useState } from "react";
import { crearVacuna, actualizarVacuna } from "../../services/vacunas.service";

export default function VacunaForm({ vacuna, mascotas, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    mascotaId: "",
    nombre: "",
    fecha: "",
    proximaFecha: "",
    veterinario: "",
    lote: "",
    observaciones: "",
  });

  // Autocompleta el formulario cuando se edita una vacuna existente
  useEffect(() => {

    if (vacuna) {

      setFormData({
        mascotaId: vacuna.mascotaId || "",
        nombre: vacuna.nombre || "",
        fecha: vacuna.fecha || "",
        proximaFecha: vacuna.proximaFecha || "",
        veterinario: vacuna.veterinario || "",
        lote: vacuna.lote || "",
        observaciones: vacuna.observaciones || "",
      });

    }

  }, [vacuna]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {

    e.preventDefault();

    if (
      !formData.mascotaId ||
      !formData.nombre ||
      !formData.fecha
    ) {

      alert("Complete los campos obligatorios.");
      return;

    }

    try {

      if (vacuna) {

        await actualizarVacuna(vacuna.id, formData);

        alert("Vacuna actualizada correctamente.");

      } else {

        await crearVacuna(formData);

        alert("Vacuna registrada correctamente.");

      }

      await onSuccess();
      onClose();

    } catch (error) {

      console.error(error);

      alert(error.response?.data?.mensaje || "Ocurrió un error.");

    }

  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white rounded-xl shadow-lg p-6 mb-6"
    >

      <h2 className="text-2xl font-bold text-gray-800 mb-6">
        {vacuna ? "Editar Vacuna" : "Nueva Vacuna"}
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-600">

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
                {mascota.nombre} ({mascota.propietario})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block mb-1 font-medium">Nombre de la vacuna</label>

          <input
            type="text"
            name="nombre"
            value={formData.nombre}
            onChange={handleChange}
            className="w-full border rounded-lg px-3 py-2"
          />
        </div>

        <div>
          <label className="block mb-1 font-medium">Fecha de aplicación</label>

          <input
            type="date"
            name="fecha"
            value={formData.fecha}
            onChange={handleChange}
            className="w-full border rounded-lg px-3 py-2"
          />
        </div>

        <div>
          <label className="block mb-1 font-medium">Próxima fecha (refuerzo)</label>

          <input
            type="date"
            name="proximaFecha"
            value={formData.proximaFecha}
            onChange={handleChange}
            className="w-full border rounded-lg px-3 py-2"
          />
        </div>

        <div>
          <label className="block mb-1 font-medium">Veterinario</label>

          <input
            type="text"
            name="veterinario"
            value={formData.veterinario}
            onChange={handleChange}
            className="w-full border rounded-lg px-3 py-2"
          />
        </div>

        <div>
          <label className="block mb-1 font-medium">Lote</label>

          <input
            type="text"
            name="lote"
            value={formData.lote}
            onChange={handleChange}
            className="w-full border rounded-lg px-3 py-2"
          />
        </div>

      </div>

      <div className="mt-4">
        <label className="block mb-1 font-medium text-gray-600">Observaciones</label>

        <textarea
          name="observaciones"
          value={formData.observaciones}
          onChange={handleChange}
          rows="2"
          className="w-full border rounded-lg px-3 py-2 text-gray-600"
        />
      </div>

      <div className="flex gap-3 mt-6">

        <button
          type="submit"
          className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg"
        >
          Guardar
        </button>

        <button
          type="button"
          onClick={onClose}
          className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-lg"
        >
          Cancelar
        </button>

      </div>

    </form>
  );
}
