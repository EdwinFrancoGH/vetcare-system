import { createHash } from "node:crypto";
import * as firestore from "./firestore.service.js";
import db from "../config/firebase.js";
import { esHorarioValido } from "../utils/disponibilidad.js";

const COLECCION = "citas";
const COLECCION_MASCOTAS = "mascotas";
const COLECCION_HORARIOS = "horariosAtencion";
const COLECCION_BLOQUEOS = "citasBloqueos";
const COLECCION_PAGOS = "pagos";
const COLECCION_SERVICIOS = "serviciosVeterinarios";
const ESTADOS_ACTIVOS = new Set(["reservada", "confirmada"]);
const ESTADOS_PAGO_QUE_BLOQUEAN_CANCELACION = new Set(["reportado", "en_revision", "aprobado"]);
const TRANSICIONES_ESTADO = {
    reservada: new Set(["confirmada", "cancelada"]),
    confirmada: new Set(["completada", "cancelada"]),
    cancelada: new Set(),
    completada: new Set()
};
const CAMPOS_REPROGRAMABLES = new Set(["veterinario", "fecha", "hora"]);
const CAMPOS_ACTUALIZABLES = new Set(["estado", "mascotaId", "propietario", "telefono", "motivo"]);

const minutoDelDia = (hora) => {
    if (typeof hora !== "string" || !/^([01]\d|2[0-3]):[0-5]\d$/.test(hora)) return null;
    const [horas, minutos] = hora.split(":").map(Number);
    return horas * 60 + minutos;
};

const seSolapan = (horaA, duracionA, horaB, duracionB) => {
    const inicioA = minutoDelDia(horaA);
    const inicioB = minutoDelDia(horaB);
    if (inicioA === null || inicioB === null) return false;
    return inicioA < inicioB + duracionB && inicioB < inicioA + duracionA;
};

const idBloque = ({ veterinario, fecha, hora }) => createHash("sha256")
    .update(`${veterinario}\u0000${fecha}\u0000${hora}`)
    .digest("hex");

const validarHorarioSolicitado = (horario, datos) => {
    if (!horario || horario.veterinario !== datos.veterinario) return "HORARIO_NO_ENCONTRADO";
    return esHorarioValido({ horario, fecha: datos.fecha, hora: datos.hora })
        ? null
        : "HORARIO_INVALIDO";
};

const hayConflicto = (snapshot, { idExcluir, hora, duracionMinutos }) => snapshot.docs.some((doc) => {
    if (doc.id === idExcluir) return false;
    const cita = doc.data();
    if (!ESTADOS_ACTIVOS.has(cita.estado)) return false;
    const otraDuracion = Number(cita.duracionMinutos) > 0
        ? Number(cita.duracionMinutos)
        : duracionMinutos;
    return seSolapan(hora, duracionMinutos, cita.hora, otraDuracion);
});

export const crearServicioCitas = (firestoreDb) => {
    const crearSiDisponible = async (datos, propietarioUid = null) => firestoreDb.runTransaction(async (transaction) => {
        if (typeof datos.servicioId !== "string" || !datos.servicioId.trim() || datos.servicioId.includes("/")) {
            return { error: "SERVICIO_REQUERIDO" };
        }
        const servicioId = datos.servicioId.trim();
        const mascotaRef = firestoreDb.collection(COLECCION_MASCOTAS).doc(datos.mascotaId);
        const horarioRef = firestoreDb.collection(COLECCION_HORARIOS).doc(datos.veterinario);
        const servicioRef = firestoreDb.collection(COLECCION_SERVICIOS).doc(servicioId);
        const bloqueRef = firestoreDb.collection(COLECCION_BLOQUEOS).doc(idBloque(datos));
        const citasQuery = firestoreDb.collection(COLECCION)
            .where("veterinario", "==", datos.veterinario)
            .where("fecha", "==", datos.fecha);

        // Firestore exige completar todas las lecturas antes de encolar escrituras.
        const mascotaDoc = await transaction.get(mascotaRef);
        const horarioDoc = await transaction.get(horarioRef);
        const servicioDoc = await transaction.get(servicioRef);
        const bloqueDoc = await transaction.get(bloqueRef);
        const citasSnapshot = await transaction.get(citasQuery);

        if (!mascotaDoc.exists) return { error: "MASCOTA_NO_ENCONTRADA" };
        const mascota = mascotaDoc.data();
        if (mascota.archivada === true) return { error: "MASCOTA_ARCHIVADA" };
        if (propietarioUid && mascota.propietarioUid !== propietarioUid) {
            return { error: "MASCOTA_NO_PROPIA" };
        }
        if (!horarioDoc.exists) return { error: "HORARIO_NO_ENCONTRADO" };
        if (!servicioDoc.exists || servicioDoc.data().activo !== true) {
            return { error: "SERVICIO_NO_DISPONIBLE" };
        }
        const servicio = servicioDoc.data();
        if (typeof servicio.nombre !== "string" || !servicio.nombre.trim() || !Number.isSafeInteger(servicio.precioCentavos)
            || servicio.precioCentavos <= 0 || servicio.moneda !== "USD") {
            return { error: "SERVICIO_INVALIDO" };
        }
        const horario = horarioDoc.data();
        const errorHorario = validarHorarioSolicitado(horario, datos);
        if (errorHorario) return { error: errorHorario };

        const duracionMinutos = Number(horario.duracionCitaMinutos) || 60;
        if (bloqueDoc.exists || hayConflicto(citasSnapshot, { hora: datos.hora, duracionMinutos })) {
            return { error: "CITA_HORARIO_OCUPADO" };
        }

        const citaRef = firestoreDb.collection(COLECCION).doc();
        const ahora = new Date().toISOString();
        const datosSinTarifaCliente = { ...datos };
        delete datosSinTarifaCliente.servicioNombre;
        delete datosSinTarifaCliente.precioCentavos;
        delete datosSinTarifaCliente.moneda;
        const cita = {
            ...datosSinTarifaCliente,
            servicioId,
            servicioNombre: servicio.nombre,
            precioCentavos: servicio.precioCentavos,
            moneda: "USD",
            clienteUid: mascota.propietarioUid || null,
            duracionMinutos,
            fechaRegistro: ahora,
            fechaActualizacion: ahora
        };
        transaction.create(bloqueRef, { citaId: citaRef.id, veterinario: datos.veterinario, fecha: datos.fecha, hora: datos.hora });
        transaction.create(citaRef, cita);
        return { cita: { id: citaRef.id, ...cita } };
    });

    const reprogramarSiDisponible = async (id, datos) => firestoreDb.runTransaction(async (transaction) => {
        if (Object.keys(datos).some((campo) => !CAMPOS_REPROGRAMABLES.has(campo))) {
            return { error: "CAMPOS_INVALIDOS" };
        }
        if (![...CAMPOS_REPROGRAMABLES].every((campo) => typeof datos[campo] === "string" && datos[campo].trim())) {
            return { error: "HORARIO_INVALIDO" };
        }

        const citaRef = firestoreDb.collection(COLECCION).doc(id);
        const citaDoc = await transaction.get(citaRef);
        if (!citaDoc.exists) return { error: "CITA_NO_ENCONTRADA" };
        const existente = citaDoc.data();
        if (!ESTADOS_ACTIVOS.has(existente.estado)) return { error: "ESTADO_NO_REPROGRAMABLE" };

        const mascotaRef = firestoreDb.collection(COLECCION_MASCOTAS).doc(existente.mascotaId);
        const horarioRef = firestoreDb.collection(COLECCION_HORARIOS).doc(datos.veterinario);
        const bloqueAnteriorRef = firestoreDb.collection(COLECCION_BLOQUEOS).doc(idBloque(existente));
        const bloqueNuevoRef = firestoreDb.collection(COLECCION_BLOQUEOS).doc(idBloque(datos));
        const citasQuery = firestoreDb.collection(COLECCION)
            .where("veterinario", "==", datos.veterinario)
            .where("fecha", "==", datos.fecha);

        const mascotaDoc = await transaction.get(mascotaRef);
        const horarioDoc = await transaction.get(horarioRef);
        const bloqueAnteriorDoc = await transaction.get(bloqueAnteriorRef);
        const bloqueNuevoDoc = await transaction.get(bloqueNuevoRef);
        const citasSnapshot = await transaction.get(citasQuery);

        if (!mascotaDoc.exists) return { error: "MASCOTA_NO_ENCONTRADA" };
        const mascota = mascotaDoc.data();
        if (mascota.archivada === true) return { error: "MASCOTA_ARCHIVADA" };
        if (!mascota.propietarioUid || (existente.clienteUid && mascota.propietarioUid !== existente.clienteUid)) {
            return { error: "PROPIETARIO_CAMBIADO" };
        }
        if (!horarioDoc.exists) return { error: "HORARIO_NO_ENCONTRADO" };
        const horario = horarioDoc.data();
        const errorHorario = validarHorarioSolicitado(horario, datos);
        if (errorHorario) return { error: errorHorario };

        const duracionMinutos = Number(horario.duracionCitaMinutos) || 60;
        if ((bloqueNuevoDoc.exists && bloqueNuevoDoc.data().citaId !== id)
            || hayConflicto(citasSnapshot, { idExcluir: id, hora: datos.hora, duracionMinutos })) {
            return { error: "CITA_HORARIO_OCUPADO" };
        }

        const mismoBloque = bloqueAnteriorRef.id === bloqueNuevoRef.id;
        const ahora = new Date().toISOString();
        const actualizada = {
            veterinario: datos.veterinario,
            fecha: datos.fecha,
            hora: datos.hora,
            duracionMinutos,
            clienteUid: existente.clienteUid || mascota.propietarioUid,
            fechaActualizacion: ahora
        };

        // A partir de aquí solo hay escrituras: si falla cualquiera, Firestore no confirma ninguna.
        if (!mismoBloque) {
            if (bloqueAnteriorDoc.exists && bloqueAnteriorDoc.data().citaId === id) {
                transaction.delete(bloqueAnteriorRef);
            }
            if (!bloqueNuevoDoc.exists) {
                transaction.create(bloqueNuevoRef, { citaId: id, veterinario: datos.veterinario, fecha: datos.fecha, hora: datos.hora });
            }
        } else if (!bloqueNuevoDoc.exists) {
            // También inicializa el bloqueo al reprogramar una cita histórica sin bloqueo auxiliar.
            transaction.create(bloqueNuevoRef, { citaId: id, veterinario: datos.veterinario, fecha: datos.fecha, hora: datos.hora });
        }
        transaction.update(citaRef, actualizada);
        return { id, ...existente, ...actualizada };
    });

    const actualizarSiDisponible = async (id, datos) => firestoreDb.runTransaction(async (transaction) => {
        if ([...CAMPOS_REPROGRAMABLES, "duracionMinutos"].some((campo) => Object.hasOwn(datos, campo))) {
            return { error: "REPROGRAMACION_REQUERIDA" };
        }
        if (Object.keys(datos).some((campo) => !CAMPOS_ACTUALIZABLES.has(campo))) {
            return { error: "CAMPOS_INVALIDOS" };
        }
        const citaRef = firestoreDb.collection(COLECCION).doc(id);
        const citaDoc = await transaction.get(citaRef);
        if (!citaDoc.exists) return undefined;
        const existente = citaDoc.data();

        if (datos.estado !== undefined && datos.estado !== existente.estado
            && !TRANSICIONES_ESTADO[existente.estado]?.has(datos.estado)) {
            return { error: "TRANSICION_INVALIDA" };
        }

        const pagoDoc = datos.estado === "cancelada"
            ? await transaction.get(firestoreDb.collection(COLECCION_PAGOS).doc(id))
            : null;
        if (pagoDoc?.exists && ESTADOS_PAGO_QUE_BLOQUEAN_CANCELACION.has(pagoDoc.data().estado)) {
            return { error: "PAGO_IMPIDE_CANCELACION" };
        }

        const cambiaMascota = datos.mascotaId !== undefined && datos.mascotaId !== existente.mascotaId;
        const terminaCita = datos.estado !== undefined && !ESTADOS_ACTIVOS.has(datos.estado);
        const mascotaDoc = cambiaMascota
            ? await transaction.get(firestoreDb.collection(COLECCION_MASCOTAS).doc(datos.mascotaId))
            : null;
        const bloqueRef = terminaCita
            ? firestoreDb.collection(COLECCION_BLOQUEOS).doc(idBloque(existente))
            : null;
        const bloqueDoc = bloqueRef ? await transaction.get(bloqueRef) : null;

        if (mascotaDoc && !mascotaDoc.exists) return { error: "MASCOTA_NO_ENCONTRADA" };
        if (mascotaDoc?.data().archivada === true) return { error: "MASCOTA_ARCHIVADA" };
        const ahora = new Date().toISOString();
        const actualizacion = { ...datos, fechaActualizacion: ahora };
        if (mascotaDoc) actualizacion.clienteUid = mascotaDoc.data().propietarioUid || null;
        if (bloqueDoc?.exists && bloqueDoc.data().citaId === id) transaction.delete(bloqueRef);
        transaction.update(citaRef, actualizacion);
        return { id, ...existente, ...actualizacion };
    });

    return { crearSiDisponible, reprogramarSiDisponible, actualizarSiDisponible };
};

const servicio = crearServicioCitas(db);

export const obtenerTodas = () => firestore.obtenerTodos(COLECCION);
export const obtenerPorId = (id) => firestore.obtenerPorId(COLECCION, id);
export const obtenerPorMascota = (mascotaId) => firestore.obtenerPorCampo(COLECCION, "mascotaId", mascotaId);
export const obtenerPorVeterinario = (veterinario) => firestore.obtenerPorCampo(COLECCION, "veterinario", veterinario);
export const crearSiDisponible = servicio.crearSiDisponible;
export const reprogramarSiDisponible = servicio.reprogramarSiDisponible;
export const actualizarSiDisponible = servicio.actualizarSiDisponible;
