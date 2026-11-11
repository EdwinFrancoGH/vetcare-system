/*import db from "../config/firebase.js";

const coleccion = db.collection("vacunas");

// Obtener todas
export const obtenerTodas = async () => {
    const snapshot = await coleccion.get();

    return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    }));
};

// Obtener por ID
export const obtenerPorId = async (id) => {
    const doc = await coleccion.doc(id).get();

    if (!doc.exists) return null;

    return {
        id: doc.id,
        ...doc.data()
    };
};

// Crear
export const crear = async (datos) => {
    const docRef = await coleccion.add(datos);

    return {
        id: docRef.id,
        ...datos
    };
};

// Actualizar
export const actualizar = async (id, datos) => {
    await coleccion.doc(id).update(datos);

    return {
        id,
        ...datos
    };
};

// Eliminar
export const eliminar = async (id) => {
    await coleccion.doc(id).delete();
};*/

import * as firestore from "./firestore.service.js";
import db from "../config/firebase.js";
const COLECCION = "vacunas";

export const obtenerTodas = () =>
    firestore.obtenerTodos(COLECCION);

export const obtenerPorId = (id) =>
    firestore.obtenerPorId(COLECCION, id);

// Vacunas de una mascota específica (usado por la ficha de mascota,
// la línea de tiempo clínica y las alertas de vencidos)
export const obtenerPorMascota = (mascotaId) =>
    firestore.obtenerPorCampo(COLECCION, "mascotaId", mascotaId);

export const crear = (datos) => db.runTransaction(async (transaction) => {
    const mascotaRef = db.collection("mascotas").doc(datos.mascotaId);
    const mascota = await transaction.get(mascotaRef);
    if (!mascota.exists) throw new Error("MASCOTA_NO_ENCONTRADA");
    if (mascota.data().archivada === true) throw new Error("MASCOTA_ARCHIVADA");

    const vacunaRef = db.collection(COLECCION).doc();
    const ahora = new Date().toISOString();
    const vacuna = { ...datos, createdAt: ahora, updatedAt: ahora };
    transaction.create(vacunaRef, vacuna);
    return { id: vacunaRef.id, ...vacuna };
});

export const actualizar = (id, datos) => db.runTransaction(async (transaction) => {
    const vacunaRef = db.collection(COLECCION).doc(id);
    const vacunaDoc = await transaction.get(vacunaRef);
    if (!vacunaDoc.exists) return null;

    if (datos.mascotaId && datos.mascotaId !== vacunaDoc.data().mascotaId) {
        const mascota = await transaction.get(db.collection("mascotas").doc(datos.mascotaId));
        if (!mascota.exists) throw new Error("MASCOTA_NO_ENCONTRADA");
        if (mascota.data().archivada === true) throw new Error("MASCOTA_ARCHIVADA");
    }

    const actualizacion = { ...datos, updatedAt: new Date().toISOString() };
    transaction.update(vacunaRef, actualizacion);
    return { id, ...vacunaDoc.data(), ...actualizacion };
});

export const eliminar = (id) =>
    firestore.eliminar(COLECCION, id);
