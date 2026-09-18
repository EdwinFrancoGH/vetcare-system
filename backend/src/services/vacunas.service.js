import db from "../config/firebase.js";

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
};