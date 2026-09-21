import db from "../config/firebase.js";

export const obtenerTodos = async (coleccion) => {
    const snapshot = await db.collection(coleccion).get();

    return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    }));
};

// Obtiene todos los documentos de una colección donde `campo` === `valor`.
// Se usa, por ejemplo, para traer el historial o las vacunas de una
// mascota específica (campo = "mascotaId").
export const obtenerPorCampo = async (coleccion, campo, valor) => {

    const snapshot = await db.collection(coleccion)
        .where(campo, "==", valor)
        .get();

    return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    }));
};

export const obtenerPorId = async (coleccion, id) => {

    const doc = await db.collection(coleccion).doc(id).get();

    if (!doc.exists) return null;

    return {
        id: doc.id,
        ...doc.data()
    };
};

export const crear = async (coleccion, datos) => {

    const referencia = await db.collection(coleccion).add(datos);

    return {
        id: referencia.id,
        ...datos
    };
};

export const actualizar = async (coleccion, id, datos) => {

    await db.collection(coleccion).doc(id).update(datos);

    return {
        id,
        ...datos
    };
};

export const eliminar = async (coleccion, id) => {

    await db.collection(coleccion).doc(id).delete();

    return true;
};