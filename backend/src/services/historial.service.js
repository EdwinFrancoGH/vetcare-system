/*import db from "../config/firebase.js";

const coleccion = db.collection("historiales");

// Obtener todos los historiales
export const obtenerTodos = async () => {

    const snapshot = await coleccion.get();

    return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    }));

};

// Obtener historial por ID
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

// Crear historial
export const crear = async (historial) => {

    historial.createdAt = new Date();

    const nuevo = await coleccion.add(historial);

    const doc = await nuevo.get();

    return {
        id: doc.id,
        ...doc.data()
    };

};

// Actualizar historial
export const actualizar = async (id, historial) => {

    const docRef = coleccion.doc(id);

    const doc = await docRef.get();

    if (!doc.exists) {
        return null;
    }

    await docRef.update(historial);

    const actualizado = await docRef.get();

    return {
        id: actualizado.id,
        ...actualizado.data()
    };

};

// Eliminar historial
export const eliminar = async (id) => {

    const docRef = coleccion.doc(id);

    const doc = await docRef.get();

    if (!doc.exists) {
        return false;
    }

    await docRef.delete();

    return true;

};*/

import * as firestore from "./firestore.service.js";
import db from "../config/firebase.js";
const COLECCION = "historiales";


export const obtenerTodos = () =>
    firestore.obtenerTodos(COLECCION);

export const obtenerPorId = (id) =>
    firestore.obtenerPorId(COLECCION, id);

// Historial de una mascota específica (usado por la ficha de mascota,
// la línea de tiempo clínica y el resumen automático)
export const obtenerPorMascota = (mascotaId) =>
    firestore.obtenerPorCampo(COLECCION, "mascotaId", mascotaId);

export const crear = (datos) => db.runTransaction(async (transaction) => {
    const mascotaRef = db.collection("mascotas").doc(datos.mascotaId);
    const mascota = await transaction.get(mascotaRef);
    if (!mascota.exists) throw new Error("MASCOTA_NO_ENCONTRADA");
    if (mascota.data().archivada === true) throw new Error("MASCOTA_ARCHIVADA");

    const historialRef = db.collection(COLECCION).doc();
    const ahora = new Date().toISOString();
    const historial = { ...datos, createdAt: ahora, updatedAt: ahora };
    transaction.create(historialRef, historial);
    return { id: historialRef.id, ...historial };
});

export const actualizar = (id, datos) => db.runTransaction(async (transaction) => {
    const historialRef = db.collection(COLECCION).doc(id);
    const historialDoc = await transaction.get(historialRef);
    if (!historialDoc.exists) return null;

    if (datos.mascotaId && datos.mascotaId !== historialDoc.data().mascotaId) {
        const mascota = await transaction.get(db.collection("mascotas").doc(datos.mascotaId));
        if (!mascota.exists) throw new Error("MASCOTA_NO_ENCONTRADA");
        if (mascota.data().archivada === true) throw new Error("MASCOTA_ARCHIVADA");
    }

    const actualizacion = { ...datos, updatedAt: new Date().toISOString() };
    transaction.update(historialRef, actualizacion);
    return { id, ...historialDoc.data(), ...actualizacion };
});

export const eliminar = (id) =>
    firestore.eliminar(COLECCION, id);
