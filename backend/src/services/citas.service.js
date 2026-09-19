//Estamos creando las operaciones básicas de nuestro módulo:
import db from "../config/firebase.js";

const coleccion = db.collection("citas");

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

export const crear = async (cita) => {
    const nuevaCita = {
        ...cita,
        estado: cita.estado || "PENDIENTE",
        fechaRegistro: new Date().toISOString(),
        fechaActualizacion: new Date().toISOString()
    };

    const docRef = await coleccion.add(nuevaCita);

    return {
        id: docRef.id,
        ...nuevaCita
    };
};

export const actualizar = async (id, cita) => {
    const doc = await coleccion.doc(id).get();

    if (!doc.exists) {
        return null;
    }

    const datosActualizados = {
        ...cita,
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