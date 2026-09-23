import db from "../config/firebase.js";

const coleccion = db.collection("diagnosticos");
const consultasColeccion = db.collection("consultas");

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

export const crear = async (diagnostico) => {

    // Verificar que la consulta exista
    const consulta = await consultasColeccion
        .doc(diagnostico.consultaId)
        .get();

    if (!consulta.exists) {
        return {
            consultaNoEncontrada: true
        };
    }

    // Verificar si la consulta ya tiene un diagnóstico
    const diagnosticosExistentes = await coleccion
        .where("consultaId", "==", diagnostico.consultaId)
        .get();

    if (!diagnosticosExistentes.empty) {
        return {
            diagnosticoExistente: true
        };
    }

    const nuevoDiagnostico = {
        ...diagnostico,
        fechaRegistro: new Date().toISOString(),
        fechaActualizacion: new Date().toISOString()
    };

    const docRef = await coleccion.add(nuevoDiagnostico);

    return {
        consultaNoEncontrada: false,
        diagnosticoExistente: false,
        id: docRef.id,
        ...nuevoDiagnostico
    };
};

export const actualizar = async (id, diagnostico) => {
    const doc = await coleccion.doc(id).get();

    if (!doc.exists) {
        return null;
    }

    const datosActualizados = {
        ...diagnostico,
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