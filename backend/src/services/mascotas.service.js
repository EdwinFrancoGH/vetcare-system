/*import db from "../config/firebase.js";

// Obtener todas las mascotas
export const obtenerTodas = async () => {
    const snapshot = await db.collection("mascotas").get();

    return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    }));
};

// Obtener una mascota por ID
export const obtenerPorId = async (id) => {
    const doc = await db.collection("mascotas").doc(id).get();

    if (!doc.exists) {
        return null;
    }

    return {
        id: doc.id,
        ...doc.data()
    };
};

// Crear una mascota
export const crear = async (datos) => {

    const mascota = {
        ...datos,
        fechaRegistro: new Date().toISOString(),
        fechaActualizacion: new Date().toISOString()
    };

    const docRef = await db.collection("mascotas").add(mascota);

    return {
        id: docRef.id,
        ...mascota
    };
};

// Actualizar una mascota
export const actualizar = async (id, datos) => {

    const docRef = db.collection("mascotas").doc(id);

    const doc = await docRef.get();

    if (!doc.exists) {
        return null;
    }

    // Evita modificar el ID si viene en el body
    delete datos.id;

    const mascotaActualizada = {
        ...datos,
        fechaActualizacion: new Date().toISOString()
    };

    await docRef.update(mascotaActualizada);

    const actualizado = await docRef.get();

    return {
        id: actualizado.id,
        ...actualizado.data()
    };
};

// Eliminar una mascota
export const eliminar = async (id) => {

    const docRef = db.collection("mascotas").doc(id);

    const doc = await docRef.get();

    if (!doc.exists) {
        return false;
    }

    await docRef.delete();

    return true;
};*/

import * as firestore from "./firestore.service.js";

const COLECCION = "mascotas";

export const obtenerTodas = () =>
    firestore.obtenerTodos(COLECCION);

export const obtenerPorId = (id) =>
    firestore.obtenerPorId(COLECCION, id);

export const crear = (datos) =>
    firestore.crear(COLECCION, datos);

export const actualizar = (id, datos) =>
    firestore.actualizar(COLECCION, id, datos);

export const eliminar = (id) =>
    firestore.eliminar(COLECCION, id);