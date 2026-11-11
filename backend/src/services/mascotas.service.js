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
import db from "../config/firebase.js";

const COLECCION = "mascotas";

export const obtenerTodas = () =>
    firestore.obtenerTodos(COLECCION);

// Mascotas de un dueño concreto (usuario con rol "Cliente")
export const obtenerPorPropietario = (uid) =>
    firestore.obtenerPorCampo(COLECCION, "propietarioUid", uid);

export const obtenerPorId = (id) =>
    firestore.obtenerPorId(COLECCION, id);

export const crear = (datos) => {
    const ahora = new Date().toISOString();
    return firestore.crear(COLECCION, {
        ...datos,
        archivada: false,
        fechaRegistro: ahora,
        fechaActualizacion: ahora
    });
};

export const actualizar = (id, datos) =>
    db.runTransaction(async (transaction) => {
        const referencia = db.collection(COLECCION).doc(id);
        const documento = await transaction.get(referencia);
        if (!documento.exists || documento.data().archivada === true) return null;
        const actualizacion = { ...datos, fechaActualizacion: new Date().toISOString() };
        transaction.update(referencia, actualizacion);
        return { id, ...documento.data(), ...actualizacion };
    });

// Conserva citas e historial clínico como registros históricos asociados.
export const archivar = (id) => db.runTransaction(async (transaction) => {
    const referencia = db.collection(COLECCION).doc(id);
    const documento = await transaction.get(referencia);
    if (!documento.exists || documento.data().archivada === true) return false;

    const ahora = new Date().toISOString();
    transaction.update(referencia, {
        archivada: true,
        fechaArchivada: ahora,
        fechaActualizacion: ahora
    });
    return true;
});
