/*let mascotas = [
    {
        id: 1,
        nombre: "Max",
        especie: "Perro",
        edad: 5
    },
    {
        id: 2,
        nombre: "Michi",
        especie: "Gato",
        edad: 2
    }
];

export const obtenerTodas = () => {
    return mascotas;
};

export const obtenerPorId = (id) => {
    return mascotas.find(m => m.id == id);
};

export const crear = (datos) => {

    const mascota = {
        id: mascotas.length + 1,
        ...datos
    };

    mascotas.push(mascota);

    return mascota;

};

export const actualizar = (id, datos) => {

    const indice = mascotas.findIndex(m => m.id == id);

    if (indice !== -1) {

        mascotas[indice] = {
            ...mascotas[indice],
            ...datos
        };

        return mascotas[indice];
    }

    return null;

};

export const eliminar = (id) => {

    mascotas = mascotas.filter(m => m.id != id);

};*/
import db from "../config/firebase.js";

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
    const docRef = await db.collection("mascotas").add(datos);

    return {
        id: docRef.id,
        ...datos
    };
};

// Actualizar una mascota
export const actualizar = async (id, datos) => {
    const docRef = db.collection("mascotas").doc(id);

    const doc = await docRef.get();

    if (!doc.exists) {
        return null;
    }

    await docRef.update(datos);

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
};