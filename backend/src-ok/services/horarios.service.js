import db from "../config/firebase.js";

const COLECCION = "horariosAtencion";

// El horario semanal de un veterinario se guarda en un único documento
// por veterinario (su nombre como ID), a diferencia de las demás
// colecciones que usan IDs autogenerados: aquí interesa poder
// consultarlo y sobrescribirlo directamente por nombre.

export const obtenerTodos = async () => {

    const snapshot = await db.collection(COLECCION).get();

    return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
    }));

};

export const obtenerPorVeterinario = async (veterinario) => {

    const doc = await db.collection(COLECCION).doc(veterinario).get();

    if (!doc.exists) {
        return null;
    }

    return {
        id: doc.id,
        ...doc.data(),
    };

};

// Crea o reemplaza por completo el horario semanal de un veterinario.
export const guardar = async (veterinario, datos) => {

    await db.collection(COLECCION).doc(veterinario).set(datos);

    return obtenerPorVeterinario(veterinario);

};

export const eliminar = async (veterinario) => {

    await db.collection(COLECCION).doc(veterinario).delete();

    return true;

};
