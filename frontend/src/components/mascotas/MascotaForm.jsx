/*"use client";

export default function MascotaForm({ onClose }) {

    return (

        <div className="bg-white rounded-lg shadow-lg p-6 mb-6 border">

            <h2 className="text-2xl font-bold mb-4">
                Nueva Mascota
            </h2>

            <p className="text-gray-600 mb-4">
                Aquí construiremos el formulario de registro.
            </p>

            <div className="flex gap-3">

                <button
                    className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                >
                    Guardar
                </button>

                <button
                    onClick={onClose}
                    className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
                >
                    Cancelar
                </button>

            </div>

        </div>

    );

}*/
"use client";

import { useEffect, useState } from "react";
import { crearMascota,actualizarMascota } from "../../services/mascotas.service";
import { useAuth } from "../../context/AuthContext";

export default function MascotaForm({ mascota, onClose, onSuccess }) {
  const { userRole, userData } = useAuth();
  const esCliente = userRole === "Cliente";

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


//automáticamente llena todos los campos.
useEffect(() => {

    if (mascota) {

        setFormData({
            nombre: mascota.nombre || "",
            especie: mascota.especie || "",
            raza: mascota.raza || "",
            sexo: mascota.sexo || "",
            edad: mascota.edad || "",
            peso: mascota.peso || "",
            color: mascota.color || "",
            fechaNacimiento: mascota.fechaNacimiento || "",
            propietario: mascota.propietario || "",
            telefono: mascota.telefono || "",
            direccion: mascota.direccion || "",
            estado: mascota.estado || "Activo",
        });

    } else if (esCliente) {
        // Un Cliente registra mascotas a su nombre: se precarga su nombre.
        setFormData((prev) => ({
            ...prev,
            propietario: prev.propietario || userData?.name || "",
            telefono: prev.telefono || userData?.phone || userData?.telefono || "",
        }));
    }

}, [mascota, esCliente, userData]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };


//AGREGANDO EL HANDLE SUBMIT
/*
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validación básica
    if (!formData.nombre || !formData.especie || !formData.propietario) {
        alert("Complete los campos obligatorios.");
        return;
    }

    try {
        await crearMascota(formData);

        alert("Mascota registrada correctamente.");

        // Recargar la tabla
        onSuccess();

        // Cerrar formulario
        onClose();

    } catch (error) {
        console.error(error);

        alert("Error al registrar la mascota.");
    }
};*/
const handleSubmit = async (e) => {

    e.preventDefault();

    if (
        !formData.nombre ||
        !formData.especie ||
        !formData.propietario
    ) {

        alert("Complete los campos obligatorios.");
        return;

    }

    try {

        if (mascota) {

            await actualizarMascota(mascota.id, formData);

            alert("Mascota actualizada correctamente.");

        } else {

            await crearMascota(formData);

            alert("Mascota registrada correctamente.");

        }
/*
 * Actualiza la tabla de mascotas.
 * Se utiliza await para esperar que termine
 * la consulta al backend antes de continuar.
 * Recargar la lista de mascotas antes de cerrar el formulario
 */
        await onSuccess();
        onClose();

    } catch (error) {

        console.error(error);

        alert(error.response?.data?.message || "Ocurrió un error.");

    }

};

  return (
    <form
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
          <label className="block mb-1 font-medium">Edad</label>

          <input
            type="number"
            name="edad"
            value={formData.edad}
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
          <label className="block mb-1 font-medium">Color</label>

          <input
            type="text"
            name="color"
            value={formData.color}
            onChange={handleChange}
            className="w-full border rounded-lg px-3 py-2"
          />
        </div>

        <div>
          <label className="block mb-1 font-medium">Fecha de Nacimiento</label>

          <input
            type="date"
            name="fechaNacimiento"
            value={formData.fechaNacimiento}
            onChange={handleChange}
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
          />
        </div>

        <div>
          <label className="block mb-1 font-medium">Teléfono</label>

          <input
            type="text"
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