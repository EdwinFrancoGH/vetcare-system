import db from "../config/firebase.js";

const coleccion = db.collection("consultas");
const citasColeccion = db.collection("citas");

export const obtenerTodas = async () => {
    const snapshot = await coleccion.get();

    return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data()
    }));
};

export const obtenerPorId = async (id) => {
    const doc = await coleccion.doc(id).get();

    if (!doc.exists) {
        return null;
    }

    return {
        id: doc.id,
        ...doc.data()
    };
};

export const crear = async (consulta) => {

    // Verificar que la cita exista
    const cita = await citasColeccion.doc(consulta.citaId).get();

    if (!cita.exists) {
        return {
            citaNoEncontrada: true
        };
    }

    const datosCita = cita.data();

    // Verificar si la cita ya tiene una consulta
    const consultasExistentes = await coleccion
        .where("citaId", "==", consulta.citaId)
        .get();

    if (!consultasExistentes.empty) {
        return {
            consultaExistente: true
        };
    }

    // Evitar crear una consulta para una cita ya atendida
    if (datosCita.estado === "ATENDIDA") {
        return {
            citaYaAtendida: true
        };
    }

    // Crear la consulta
    const nuevaConsulta = {
        ...consulta,
        estado: consulta.estado || "PENDIENTE",
        fechaRegistro: new Date().toISOString(),
        fechaActualizacion: new Date().toISOString()
    };

    const docRef = await coleccion.add(nuevaConsulta);

    return {
        citaNoEncontrada: false,
        citaYaAtendida: false,
        consultaExistente: false,
        id: docRef.id,
        ...nuevaConsulta
    };
};

export const actualizar = async (id, consulta) => {
    const doc = await coleccion.doc(id).get();

    if (!doc.exists) {
        return null;
    }

    const datosActualizados = {
        ...consulta,
        fechaActualizacion: new Date().toISOString()
    };

    delete datosActualizados.id;

    await coleccion.doc(id).update(datosActualizados);

    const actualizado = await coleccion.doc(id).get();

    return {
        id: actualizado.id,
        ...actualizado.data()
    };
};

export const eliminar = async (id) => {
    const doc = await coleccion.doc(id).get();

    if (!doc.exists) {
        return false;
    }

    await coleccion.doc(id).delete();

    return true;
};