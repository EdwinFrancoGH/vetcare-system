import db from "../config/firebase.js";

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

};