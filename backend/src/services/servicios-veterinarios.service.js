import { createHash } from "node:crypto";
import db from "../config/firebase.js";
import { normalizarNombreServicio } from "../validators/servicio-veterinario.validator.js";

const COLECCION = "serviciosVeterinarios";
const COLECCION_NOMBRES = "serviciosVeterinariosNombres";
const claveNombre = (nombre) => createHash("sha256").update(normalizarNombreServicio(nombre)).digest("hex");

export class ErrorServicioVeterinario extends Error {
    constructor(codigo) {
        super(codigo);
        this.name = "ErrorServicioVeterinario";
        this.codigo = codigo;
    }
}

export const crearServicioServiciosVeterinarios = (firestoreDb) => ({
    async listar({ incluirInactivos = false } = {}) {
        const snapshot = await firestoreDb.collection(COLECCION).get();
        return snapshot.docs
            .map((doc) => ({ id: doc.id, ...doc.data() }))
            .filter((servicio) => incluirInactivos || servicio.activo === true)
            .sort((a, b) => a.nombre.localeCompare(b.nombre, "es", { sensitivity: "base" }));
    },

    async crear(datos, actorUid) {
        const idRef = firestoreDb.collection(COLECCION).doc();
        const nombreRef = firestoreDb.collection(COLECCION_NOMBRES).doc(claveNombre(datos.nombre));
        const ahora = new Date().toISOString();
        const servicio = {
            nombre: datos.nombre,
            descripcion: datos.descripcion || "",
            precioCentavos: datos.precioCentavos,
            moneda: "USD",
            activo: true,
            createdAt: ahora,
            updatedAt: ahora,
            createdByUid: actorUid,
            updatedByUid: actorUid,
        };

        await firestoreDb.runTransaction(async (transaction) => {
            const nombreDoc = await transaction.get(nombreRef);
            if (nombreDoc.exists) throw new ErrorServicioVeterinario("NOMBRE_DUPLICADO");
            transaction.create(idRef, servicio);
            transaction.create(nombreRef, { servicioId: idRef.id });
        });

        return { id: idRef.id, ...servicio };
    },

    async actualizar(id, datos, actorUid) {
        const servicioRef = firestoreDb.collection(COLECCION).doc(id);
        const ahora = new Date().toISOString();
        let resultado = null;

        await firestoreDb.runTransaction(async (transaction) => {
            const servicioDoc = await transaction.get(servicioRef);
            if (!servicioDoc.exists) return;
            const existente = servicioDoc.data();
            const nombreNuevo = datos.nombre ?? existente.nombre;
            const nombreAnteriorRef = firestoreDb.collection(COLECCION_NOMBRES).doc(claveNombre(existente.nombre));
            const nombreNuevoRef = firestoreDb.collection(COLECCION_NOMBRES).doc(claveNombre(nombreNuevo));
            const nombreCambio = claveNombre(existente.nombre) !== claveNombre(nombreNuevo);

            // Todas las lecturas se completan antes de escribir.
            const nombreNuevoDoc = await transaction.get(nombreNuevoRef);
            const nombreAnteriorDoc = nombreCambio ? await transaction.get(nombreAnteriorRef) : null;
            if (nombreNuevoDoc.exists && nombreNuevoDoc.data().servicioId !== id) {
                throw new ErrorServicioVeterinario("NOMBRE_DUPLICADO");
            }

            const actualizacion = {
                ...datos,
                ...(datos.descripcion === undefined ? {} : { descripcion: datos.descripcion }),
                ...(datos.nombre === undefined ? {} : { nombre: nombreNuevo }),
                updatedAt: ahora,
                updatedByUid: actorUid,
            };

            if (nombreCambio && nombreAnteriorDoc?.exists && nombreAnteriorDoc.data().servicioId === id) {
                transaction.delete(nombreAnteriorRef);
            }
            if (!nombreNuevoDoc.exists) transaction.create(nombreNuevoRef, { servicioId: id });
            transaction.update(servicioRef, actualizacion);
            resultado = { id, ...existente, ...actualizacion };
        });

        return resultado;
    },

    async cambiarEstado(id, activo, actorUid) {
        const servicioRef = firestoreDb.collection(COLECCION).doc(id);
        const ahora = new Date().toISOString();
        let resultado = null;

        await firestoreDb.runTransaction(async (transaction) => {
            const servicioDoc = await transaction.get(servicioRef);
            if (!servicioDoc.exists) return;
            const existente = servicioDoc.data();
            const actualizacion = { activo, updatedAt: ahora, updatedByUid: actorUid };
            transaction.update(servicioRef, actualizacion);
            resultado = { id, ...existente, ...actualizacion };
        });

        return resultado;
    },
});

const servicio = crearServicioServiciosVeterinarios(db);
export const listarServiciosVeterinarios = (opciones) => servicio.listar(opciones);
export const crearServicioVeterinario = (datos, actorUid) => servicio.crear(datos, actorUid);
export const actualizarServicioVeterinario = (id, datos, actorUid) => servicio.actualizar(id, datos, actorUid);
export const cambiarEstadoServicioVeterinario = (id, activo, actorUid) => servicio.cambiarEstado(id, activo, actorUid);
