"use client";

import { useEffect, useState } from "react";
import { crearHistorial, actualizarHistorial } from "../../services/historial.service";

export default function HistorialForm({ historial, mascotas, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    mascotaId: "",
    fecha: "",
    motivoConsulta: "",
    diagnostico: "",
    tratamiento: "",
    peso: "",
    veterinario: "",
    proximaCita: "",
    observaciones: "",
  });

  // Autocompleta el formulario cuando se edita una consulta existente
  useEffect(() => {

    if (historial) {

      setFormData({
        mascotaId: historial.mascotaId || "",
        fecha: historial.fecha || "",
        motivoConsulta: historial.motivoConsulta || "",
        diagnostico: historial.diagnostico || "",
        tratamiento: historial.tratamiento || "",
        peso: historial.peso || "",
        veterinario: historial.veterinario || "",
        proximaCita: historial.proximaCita || "",
        observaciones: historial.observaciones || "",
      });

    }

  }, [historial]);

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
      !formData.fecha ||
      !formData.motivoConsulta ||
      !formData.diagnostico ||
      !formData.peso
    ) {

      alert("Complete los campos obligatorios.");
      return;

    }

    try {

      if (historial) {

        await actualizarHistorial(historial.id, formData);

        alert("Consulta actualizada correctamente.");

      } else {

        await crearHistorial(formData);

        alert("Consulta registrada correctamente.");

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
        {historial ? "Editar Consulta" : "Nueva Consulta"}
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
          <label className="block mb-1 font-medium">Fecha</label>

          <input
            type="date"
            name="fecha"
            value={formData.fecha}
            onChange={handleChange}
            className="w-full border rounded-lg px-3 py-2"
          />
        </div>

        <div>
          <label className="block mb-1 font-medium">Motivo de la consulta</label>

          <input
            type="text"
            name="motivoConsulta"
            value={formData.motivoConsulta}
            onChange={handleChange}
            className="w-full border rounded-lg px-3 py-2"
          />
        </div>

        <div>
          <label className="block mb-1 font-medium">Peso (kg)</label>

          <input
            type="number"
            step="0.1"
            name="peso"
            value={formData.peso}
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
          <label className="block mb-1 font-medium">Próxima cita</label>

          <input
            type="date"
            name="proximaCita"
            value={formData.proximaCita}
            onChange={handleChange}
            className="w-full border rounded-lg px-3 py-2"
          />
        </div>

      </div>

      <div className="mt-4">
        <label className="block mb-1 font-medium text-gray-600">Diagnóstico</label>

        <textarea
          name="diagnostico"
          value={formData.diagnostico}
          onChange={handleChange}
          rows="2"
          className="w-full border rounded-lg px-3 py-2 text-gray-600"
        />
      </div>

      <div className="mt-4">
        <label className="block mb-1 font-medium text-gray-600">Tratamiento</label>

        <textarea
          name="tratamiento"
          value={formData.tratamiento}
          onChange={handleChange}
          rows="2"
          className="w-full border rounded-lg px-3 py-2 text-gray-600"
        />
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
