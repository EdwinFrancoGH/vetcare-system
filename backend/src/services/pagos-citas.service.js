import db from "../config/firebase.js";

const COLECCION_PAGOS = "pagos";
const COLECCION_CITAS = "citas";
const COLECCION_MASCOTAS = "mascotas";
const ESTADOS_REPORTE_ACTIVO = new Set(["reportado", "en_revision", "aprobado"]);
const ESTADOS_REVISABLES = new Set(["reportado", "en_revision"]);
const ROLES_REVISORES = new Set(["Administrador", "Recepcionista"]);
const ESTADOS_HISTORIAL = new Set(["aprobado", "rechazado", "anulado"]);

export class ErrorPagoCita extends Error {
    constructor(codigo) {
        super(codigo);
        this.name = "ErrorPagoCita";
        this.codigo = codigo;
    }
}

const crearErrorRevision = (codigo) => new ErrorPagoCita(codigo);

// Busca nombre y correo de varios usuarios (sin repetir lecturas).
async function obtenerUsuarios(firestoreDb, uids) {
    const unicos = [...new Set(uids.filter((uid) => typeof uid === "string" && uid))];
    const entradas = await Promise.all(unicos.map(async (uid) => {
        const usuario = await firestoreDb.collection("usuarios").doc(uid).get();
        const datos = usuario.exists ? usuario.data() : {};
        return [uid, {
            uid,
            nombre: typeof datos.name === "string" && datos.name.trim() ? datos.name.trim() : "Cliente",
            ...(typeof datos.email === "string" && datos.email.trim() ? { email: datos.email.trim() } : {}),
        }];
    }));
    return new Map(entradas);
}

// Devuelve { id, nombre } de la mascota de cada cita (cita -> mascotaId -> mascota).
async function obtenerMascotasDeCitas(firestoreDb, citaIds) {
    const unicos = [...new Set(citaIds.filter(Boolean))];
    const entradas = await Promise.all(unicos.map(async (citaId) => {
        const citaDoc = await firestoreDb.collection(COLECCION_CITAS).doc(citaId).get();
        const mascotaId = citaDoc.exists ? citaDoc.data().mascotaId : null;
        if (!mascotaId) return [citaId, null];
        const mascotaDoc = await firestoreDb.collection(COLECCION_MASCOTAS).doc(mascotaId).get();
        const nombre = mascotaDoc.exists ? mascotaDoc.data().nombre : null;
        return [citaId, { id: mascotaId, nombre: typeof nombre === "string" && nombre.trim() ? nombre.trim() : "Mascota" }];
    }));
    return new Map(entradas.filter(([, mascota]) => mascota));
}

// Información mínima de un pago para los listados del personal.
function resumirPago(pago, usuarios) {
    return {
        id: pago.id,
        citaId: pago.citaId || pago.id,
        cliente: pago.clienteUid
            ? usuarios.get(pago.clienteUid)
            : { uid: null, nombre: "Cliente no disponible" },
        servicio: { id: pago.servicioId || null, nombre: pago.servicioNombre || "Servicio no disponible" },
        montoCentavos: pago.montoCentavos,
        moneda: pago.moneda,
        metodoPago: pago.metodoPago,
        referencia: pago.referencia || null,
        reportadoAt: pago.reportadoAt,
        estado: pago.estado,
    };
}

export const crearServicioPagosCitas = (firestoreDb) => ({
    async listarPendientes() {
        const resultado = await firestoreDb.collection(COLECCION_PAGOS)
            .where("estado", "in", [...ESTADOS_REVISABLES])
            .get();
        const pagos = resultado.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
            .sort((a, b) => String(a.reportadoAt || "").localeCompare(String(b.reportadoAt || "")));

        const clientes = await obtenerUsuarios(firestoreDb, pagos.map((pago) => pago.clienteUid));
        return pagos.map((pago) => resumirPago(pago, clientes));
    },

    // Historial: pagos que ya fueron revisados (aprobados, rechazados o anulados),
    // del más reciente al más antiguo.
    async listarHistorial() {
        const resultado = await firestoreDb.collection(COLECCION_PAGOS)
            .where("estado", "in", [...ESTADOS_HISTORIAL])
            .get();
        const fechaOrden = (pago) => String(pago.verificadoAt || pago.updatedAt || pago.reportadoAt || "");
        const pagos = resultado.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
            .sort((a, b) => fechaOrden(b).localeCompare(fechaOrden(a)));

        const usuarios = await obtenerUsuarios(firestoreDb, [
            ...pagos.map((pago) => pago.clienteUid),
            ...pagos.map((pago) => pago.verificadorUid),
        ]);
        const mascotas = await obtenerMascotasDeCitas(firestoreDb, pagos.map((pago) => pago.citaId || pago.id));

        return pagos.map((pago) => ({
            ...resumirPago(pago, usuarios),
            mascota: mascotas.get(pago.citaId || pago.id) || { id: null, nombre: "Mascota no disponible" },
            verificadoAt: pago.verificadoAt || null,
            verificador: pago.verificadorUid
                ? { uid: pago.verificadorUid, nombre: usuarios.get(pago.verificadorUid)?.nombre || "Usuario", rol: pago.verificadorRol || null }
                : null,
            motivoRechazo: pago.motivoRechazo || null,
            numeroIntentos: Number.isSafeInteger(pago.numeroIntentos) ? pago.numeroIntentos : 1,
        }));
    },

    async aprobar({ citaId, verificadorUid, verificadorRol }) {
        if (!ROLES_REVISORES.has(verificadorRol) || !verificadorUid) throw crearErrorRevision("NO_AUTORIZADO");
        const pagoRef = firestoreDb.collection(COLECCION_PAGOS).doc(citaId);
        const pagosCitaQuery = firestoreDb.collection(COLECCION_PAGOS).where("citaId", "==", citaId);
        const eventoRef = pagoRef.collection("eventos").doc();
        let resultado;

        await firestoreDb.runTransaction(async (transaction) => {
            const pagoDoc = await transaction.get(pagoRef);
            const pagosDeCita = await transaction.get(pagosCitaQuery);
            if (!pagoDoc.exists) throw crearErrorRevision("PAGO_NO_ENCONTRADO");
            const anterior = pagoDoc.data();
            if (pagosDeCita.docs.some((doc) => doc.id !== citaId && doc.data().estado === "aprobado")) {
                throw crearErrorRevision("PAGO_APROBADO_EXISTENTE");
            }
            if (anterior.estado === "aprobado") throw crearErrorRevision("PAGO_YA_APROBADO");
            if (!ESTADOS_REVISABLES.has(anterior.estado)) throw crearErrorRevision("PAGO_NO_REVISABLE");

            const ahora = new Date().toISOString();
            const cambios = {
                estado: "aprobado",
                verificadoAt: ahora,
                verificadorUid,
                verificadorRol,
                updatedAt: ahora,
            };
            const evento = {
                tipo: "aprobacion",
                estadoAnterior: anterior.estado,
                estado: "aprobado",
                actorUid: verificadorUid,
                actorRol: verificadorRol,
                createdAt: ahora,
            };

            transaction.update(pagoRef, cambios);
            transaction.create(eventoRef, evento);
            resultado = { id: citaId, ...anterior, ...cambios };
        });

        return resultado;
    },

    async rechazar({ citaId, verificadorUid, verificadorRol, motivoRechazo }) {
        if (!ROLES_REVISORES.has(verificadorRol) || !verificadorUid) throw crearErrorRevision("NO_AUTORIZADO");
        const pagoRef = firestoreDb.collection(COLECCION_PAGOS).doc(citaId);
        const eventoRef = pagoRef.collection("eventos").doc();
        let resultado;

        await firestoreDb.runTransaction(async (transaction) => {
            const pagoDoc = await transaction.get(pagoRef);
            if (!pagoDoc.exists) throw crearErrorRevision("PAGO_NO_ENCONTRADO");
            const anterior = pagoDoc.data();
            if (anterior.estado === "aprobado") throw crearErrorRevision("PAGO_YA_APROBADO");
            if (!ESTADOS_REVISABLES.has(anterior.estado)) throw crearErrorRevision("PAGO_NO_REVISABLE");

            const ahora = new Date().toISOString();
            const cambios = {
                estado: "rechazado",
                motivoRechazo,
                verificadoAt: ahora,
                verificadorUid,
                verificadorRol,
                updatedAt: ahora,
            };
            const evento = {
                tipo: "rechazo",
                estadoAnterior: anterior.estado,
                estado: "rechazado",
                motivoRechazo,
                actorUid: verificadorUid,
                actorRol: verificadorRol,
                createdAt: ahora,
            };

            transaction.update(pagoRef, cambios);
            transaction.create(eventoRef, evento);
            resultado = { id: citaId, ...anterior, ...cambios };
        });

        return resultado;
    },

    async reportar({ citaId, clienteUid, metodoPago, referencia = null }) {
        const citaRef = firestoreDb.collection(COLECCION_CITAS).doc(citaId);
        const mascotaRef = (mascotaId) => firestoreDb.collection(COLECCION_MASCOTAS).doc(mascotaId);
        const pagoRef = firestoreDb.collection(COLECCION_PAGOS).doc(citaId);
        const eventoRef = pagoRef.collection("eventos").doc();
        let resultado;

        await firestoreDb.runTransaction(async (transaction) => {
            const citaDoc = await transaction.get(citaRef);
            if (!citaDoc.exists) throw new ErrorPagoCita("CITA_NO_ENCONTRADA");
            const cita = citaDoc.data();
            const mascotaDoc = cita.mascotaId ? await transaction.get(mascotaRef(cita.mascotaId)) : null;
            const pagoDoc = await transaction.get(pagoRef);

            if (!mascotaDoc?.exists || mascotaDoc.data().propietarioUid !== clienteUid
                || (cita.clienteUid && cita.clienteUid !== clienteUid)) {
                throw new ErrorPagoCita("CITA_NO_PROPIA");
            }
            if (cita.estado !== "completada") throw new ErrorPagoCita("CITA_NO_COMPLETADA");
            if (typeof cita.servicioId !== "string" || !cita.servicioId.trim()
                || typeof cita.servicioNombre !== "string" || !cita.servicioNombre.trim()
                || !Number.isSafeInteger(cita.precioCentavos) || cita.precioCentavos <= 0
                || cita.moneda !== "USD") {
                throw new ErrorPagoCita("CITA_SIN_TARIFA");
            }

            const anterior = pagoDoc.exists ? pagoDoc.data() : null;
            if (anterior?.citaId && anterior.citaId !== citaId) throw new ErrorPagoCita("PAGO_INCONSISTENTE");
            if (anterior && ESTADOS_REPORTE_ACTIVO.has(anterior.estado)) {
                throw new ErrorPagoCita(anterior.estado === "aprobado" ? "PAGO_YA_APROBADO" : "PAGO_YA_REPORTADO");
            }
            if (anterior && !["rechazado", "pendiente"].includes(anterior.estado)) {
                throw new ErrorPagoCita("PAGO_NO_REPORTABLE");
            }

            const ahora = new Date().toISOString();
            const numeroIntento = (Number.isSafeInteger(anterior?.numeroIntentos) ? anterior.numeroIntentos : 0) + 1;
            const pago = {
                citaId,
                clienteUid,
                servicioId: cita.servicioId,
                servicioNombre: cita.servicioNombre,
                montoCentavos: cita.precioCentavos,
                moneda: "USD",
                metodoPago,
                referencia,
                estado: "reportado",
                reportadoAt: ahora,
                verificadoAt: null,
                verificadorUid: null,
                verificadorRol: null,
                motivoRechazo: null,
                numeroIntentos: numeroIntento,
                createdAt: anterior?.createdAt || ahora,
                updatedAt: ahora,
            };
            const evento = {
                tipo: "reporte",
                intento: numeroIntento,
                estadoAnterior: anterior?.estado || null,
                estado: "reportado",
                metodoPago,
                referencia,
                montoCentavos: cita.precioCentavos,
                moneda: "USD",
                actorUid: clienteUid,
                actorRol: "Cliente",
                createdAt: ahora,
            };

            // La cita, mascota y pago se leyeron antes de cualquier escritura.
            if (pagoDoc.exists) transaction.update(pagoRef, pago);
            else transaction.create(pagoRef, pago);
            transaction.create(eventoRef, evento);
            resultado = { pago: { id: citaId, ...pago }, repetido: false };
        });

        return resultado;
    },

    async consultar(citaId, actorUid, actorRol) {
        const citaDoc = await firestoreDb.collection(COLECCION_CITAS).doc(citaId).get();
        if (!citaDoc.exists) return { error: "CITA_NO_ENCONTRADA" };
        const cita = citaDoc.data();
        const esPersonalFinanciero = ["Administrador", "Recepcionista"].includes(actorRol);
        if (!esPersonalFinanciero) {
            if (actorRol !== "Cliente" || !cita.mascotaId) return { error: "NO_AUTORIZADO" };
            const mascotaDoc = await firestoreDb.collection(COLECCION_MASCOTAS).doc(cita.mascotaId).get();
            if (!mascotaDoc.exists || mascotaDoc.data().propietarioUid !== actorUid
                || (cita.clienteUid && cita.clienteUid !== actorUid)) {
                return { error: "NO_AUTORIZADO" };
            }
        }

        const pagoRef = firestoreDb.collection(COLECCION_PAGOS).doc(citaId);
        const pagoDoc = await pagoRef.get();
        if (!pagoDoc.exists) return { pago: null };
        const eventosSnapshot = await pagoRef.collection("eventos").get();
        const eventos = eventosSnapshot.docs
            .map((doc) => ({ id: doc.id, ...doc.data() }))
            .sort((a, b) => String(a.createdAt || "").localeCompare(String(b.createdAt || "")) || a.intento - b.intento);
        return { pago: { id: citaId, ...pagoDoc.data(), historial: eventos } };
    },
});

const servicio = crearServicioPagosCitas(db);
export const reportarPagoCita = (datos) => servicio.reportar(datos);
export const consultarPagoCita = (citaId, actorUid, actorRol) => servicio.consultar(citaId, actorUid, actorRol);
export const listarPagosPendientes = () => servicio.listarPendientes();
export const listarHistorialPagos = () => servicio.listarHistorial();
export const aprobarPagoCita = (datos) => servicio.aprobar(datos);
export const rechazarPagoCita = (datos) => servicio.rechazar(datos);
