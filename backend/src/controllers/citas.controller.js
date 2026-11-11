import {
    obtenerTodas,
    obtenerPorId,
    obtenerPorMascota,
    obtenerPorVeterinario,
    crearSiDisponible,
    reprogramarSiDisponible,
    actualizarSiDisponible,
} from "../services/citas.service.js";

import {
    obtenerTodos as obtenerTodosLosHorarios,
    obtenerPorVeterinario as obtenerHorarioDeVeterinario
} from "../services/horarios.service.js";

import { obtenerPorId as obtenerMascotaPorId } from "../services/mascotas.service.js";

import { validarCita } from "../validators/cita.validator.js";
import { generarDisponibilidad, sumarDiasISO } from "../utils/disponibilidad.js";

// Ventana de tiempo por defecto que se muestra como disponible cuando el
// cliente no indica "desde"/"hasta" (2 semanas hacia adelante).
const DIAS_VENTANA_DEFECTO = 13;

// Estados que ya no compiten por un horario (uno cancelado libera el bloque)
const ESTADOS_QUE_OCUPAN_HORARIO = ["reservada", "confirmada"];
const ESTADOS_FINALIZADOS = ["cancelada", "completada"];

// OJO: "new Date().toISOString()" da la fecha en UTC, no en la hora de
// El Salvador (UTC-6) — entre las 6:00 p.m. y la medianoche locales, UTC
// ya está en el día siguiente, y "hoy" quedaba adelantado un día. Eso
// hacía que las citas de "hoy" desaparecieran de "Mis Próximas Consultas"
// (cita.fecha >= hoy daba falso). Se calcula explícitamente en la zona
// horaria de la clínica para que "hoy" sea siempre el día real allí.
function fechaHoyISO() {
    return new Intl.DateTimeFormat("en-CA", { timeZone: "America/El_Salvador" }).format(new Date());
}

function horaActualElSalvador() {
    return new Intl.DateTimeFormat("en-GB", {
        timeZone: "America/El_Salvador",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false
    }).format(new Date());
}

function ordenarPorFechaHora(citas) {
    return [...citas].sort((a, b) => {
        const claveA = `${a.fecha || ""} ${a.hora || ""}`;
        const claveB = `${b.fecha || ""} ${b.hora || ""}`;
        return claveA.localeCompare(claveB);
    });
}

// Determina el estado "de historial" de una cita ya resuelta o vencida.
// Devuelve null cuando la cita todavía está vigente (reservada o
// confirmada para una fecha futura), porque esa no es historial: sigue
// en "Mis Próximas Consultas".
//
// - "cancelada"  -> se canceló, sin importar la fecha.
// - "completada" -> el médico la marcó como atendida.
// - "confirmada" -> se había confirmado y su fecha ya pasó (se asume atendida).
// - "perdida"    -> se quedó reservada, nunca se confirmó ni se canceló,
//                   y su fecha ya pasó: no hay forma de saber si el
//                   paciente llegó, así que se cuenta como cita perdida.
function calcularEstadoHistorial(cita, hoy) {

    if (cita.estado === "cancelada") return "cancelada";
    if (cita.estado === "completada") return "completada";

    if (cita.fecha < hoy) {
        return cita.estado === "confirmada" ? "confirmada" : "perdida";
    }

    return null;

}

// Obtener todas las citas ya agendadas
export const obtenerCitas = async (req, res) => {
    try {
        const citas = await obtenerTodas();

        res.status(200).json({
            ok: true,
            message: "Citas obtenidas correctamente.",
            data: ordenarPorFechaHora(citas)
        });

    } catch (error) {
        res.status(500).json({
            ok: false,
            message: "Error al obtener las citas.",
            error: error.message
        });
    }
};

// Horarios disponibles, calculados a partir del horario semanal de
// atención (ver módulo /api/horarios) menos las citas ya reservadas o
// confirmadas. Parámetros opcionales por query string:
// ?veterinario=  -> solo ese médico (si se omite, todos los que tengan horario configurado)
// ?desde=YYYY-MM-DD&hasta=YYYY-MM-DD -> ventana de fechas (por defecto: hoy + 2 semanas)
export const obtenerCitasDisponibles = async (req, res) => {
    try {
        const { veterinario, desde, hasta } = req.query;

        const fechaDesde = desde || fechaHoyISO();
        const fechaHasta = hasta || sumarDiasISO(fechaDesde, DIAS_VENTANA_DEFECTO);

        const horarios = veterinario
            ? [await obtenerHorarioDeVeterinario(veterinario)].filter(Boolean)
            : await obtenerTodosLosHorarios();

        const disponibilidad = [];

        for (const horario of horarios) {

            const citasDelVeterinario = await obtenerPorVeterinario(horario.veterinario);

            disponibilidad.push(
                ...generarDisponibilidad({
                    horario,
                    citasExistentes: citasDelVeterinario,
                    desde: fechaDesde,
                    hasta: fechaHasta,
                })
            );

        }

        res.status(200).json({
            ok: true,
            message: "Horarios disponibles obtenidos correctamente.",
            data: ordenarPorFechaHora(disponibilidad)
        });

    } catch (error) {
        res.status(500).json({
            ok: false,
            message: "Error al obtener los horarios disponibles.",
            error: error.message
        });
    }
};

// Próximas consultas de un médico (reservadas o confirmadas, desde hoy).
// Si no se indica ?veterinario=, devuelve las de todos los médicos.
export const obtenerProximasConsultas = async (req, res) => {
    try {
        const { veterinario } = req.query;

        const citas = veterinario
            ? await obtenerPorVeterinario(veterinario)
            : await obtenerTodas();

        const hoy = fechaHoyISO();

        const proximas = citas.filter((cita) =>
            cita.fecha >= hoy && !ESTADOS_FINALIZADOS.includes(cita.estado)
        );

        res.status(200).json({
            ok: true,
            message: "Próximas consultas obtenidas correctamente.",
            data: ordenarPorFechaHora(proximas)
        });

    } catch (error) {
        res.status(500).json({
            ok: false,
            message: "Error al obtener las próximas consultas.",
            error: error.message
        });
    }
};

// Historial de citas ya resueltas o vencidas: perdidas, confirmadas
// (atendidas), completadas y canceladas. Parámetros opcionales:
// ?veterinario=  -> solo las de ese médico
// ?estado=       -> solo "perdida" | "confirmada" | "completada" | "cancelada"
// Se devuelven ordenadas de la más reciente a la más antigua.
export const obtenerHistorialCitas = async (req, res) => {
    try {
        const { veterinario, estado } = req.query;

        const citas = veterinario
            ? await obtenerPorVeterinario(veterinario)
            : await obtenerTodas();

        const hoy = fechaHoyISO();

        const historial = citas
            .map((cita) => ({ ...cita, estadoHistorial: calcularEstadoHistorial(cita, hoy) }))
            .filter((cita) => cita.estadoHistorial !== null)
            .filter((cita) => !estado || cita.estadoHistorial === estado);

        const ordenado = ordenarPorFechaHora(historial).reverse();

        res.status(200).json({
            ok: true,
            message: "Historial de citas obtenido correctamente.",
            data: ordenado
        });

    } catch (error) {
        res.status(500).json({
            ok: false,
            message: "Error al obtener el historial de citas.",
            error: error.message
        });
    }
};

// Citas de una mascota específica
export const obtenerCitasPorMascota = async (req, res) => {
    try {
        const { mascotaId } = req.params;

        // Un Cliente solo puede ver las citas de sus propias mascotas.
        if (req.userRole === "Cliente") {
            const mascota = await obtenerMascotaPorId(mascotaId);

            if (!mascota || mascota.propietarioUid !== req.user.uid) {
                return res.status(404).json({
                    ok: false,
                    message: "Mascota no encontrada."
                });
            }
        }

        const citas = await obtenerPorMascota(mascotaId);

        res.status(200).json({
            ok: true,
            message: "Citas de la mascota obtenidas correctamente.",
            data: ordenarPorFechaHora(citas)
        });

    } catch (error) {
        res.status(500).json({
            ok: false,
            message: "Error al obtener las citas de la mascota.",
            error: error.message
        });
    }
};

// Obtener una cita por ID
export const obtenerCitaPorId = async (req, res) => {
    try {
        const { id } = req.params;

        const cita = await obtenerPorId(id);

        if (!cita) {
            return res.status(404).json({
                ok: false,
                message: "Cita no encontrada."
            });
        }

        // Corrección de seguridad: si es Cliente, verificar que la cita pertenezca a una de sus mascotas
        if (req.userRole === "Cliente") {
            const mascota = await obtenerMascotaPorId(cita.mascotaId);

            if (!mascota || mascota.propietarioUid !== req.user.uid) {
                return res.status(404).json({
                    ok: false,
                    message: "Cita no encontrada."
                });
            }
        }

        res.status(200).json({
            ok: true,
            message: "Cita obtenida correctamente.",
            data: cita
        });

    } catch (error) {
        res.status(500).json({
            ok: false,
            message: "Error al obtener la cita.",
            error: error.message
        });
    }
};

// Registrar una cita directamente (uso del médico/admin, ej. un paciente
// que llama por teléfono). Igual que reservarCita valida que el horario
// exista y esté libre, pero queda con estado "confirmada" de una vez.
export const crearCita = async (req, res) => {
    try {

        const errorValidacion = validarCita(req.body);

        if (errorValidacion) {
            return res.status(400).json({
                ok: false,
                message: errorValidacion
            });
        }

        // Validación: rechazar citas en fecha u hora pasada
        const hoy = fechaHoyISO();
        const horaActual = horaActualElSalvador();
        if (req.body.fecha < hoy || (req.body.fecha === hoy && req.body.hora < horaActual)) {
            return res.status(400).json({
                ok: false,
                message: "No se puede agendar una cita en una fecha pasada."
            });
        }

        const resultado = await agendarCita(req.body, "confirmada");

        if (resultado.error) {
            return res.status(resultado.status).json({
                ok: false,
                message: resultado.error,
                ...(resultado.codigo ? { code: resultado.codigo } : {})
            });
        }

        res.status(201).json({
            ok: true,
            message: "Cita registrada correctamente.",
            data: resultado.cita
        });

    } catch (error) {
        res.status(500).json({
            ok: false,
            message: "Error al crear la cita.",
            error: error.message
        });
    }
};

// Reservar un horario disponible (lo hace el dueño de la mascota). No
// existe un documento previo de "horario disponible": se valida contra
// el horario semanal del veterinario y se crea la cita directamente.
export const reservarCita = async (req, res) => {
    try {

        const errorValidacion = validarCita(req.body);

        if (errorValidacion) {
            return res.status(400).json({
                ok: false,
                message: errorValidacion
            });
        }

        // Validación: rechazar citas en fecha u hora pasada
        const hoy = fechaHoyISO();
        const horaActual = horaActualElSalvador();
        if (req.body.fecha < hoy || (req.body.fecha === hoy && req.body.hora < horaActual)) {
            return res.status(400).json({
                ok: false,
                message: "No se puede agendar una cita en una fecha pasada."
            });
        }

        const datos = { ...req.body };

        // Un Cliente solo puede reservar para una mascota suya
        // (req.userRole lo carga cargarRol, ver app.js).
        if (req.userRole === "Cliente") {
            const mascota = await obtenerMascotaPorId(datos.mascotaId);

            if (!mascota || mascota.propietarioUid !== req.user.uid) {
                return res.status(403).json({
                    ok: false,
                    message: "Solo puedes reservar citas para tus propias mascotas."
                });
            }

            datos.clienteUid = req.user.uid;
        }

        const resultado = await agendarCita(
            datos,
            "reservada",
            req.userRole === "Cliente" ? req.user.uid : null
        );

        if (resultado.error) {
            return res.status(resultado.status).json({
                ok: false,
                message: resultado.error,
                ...(resultado.codigo ? { code: resultado.codigo } : {})
            });
        }

        res.status(201).json({
            ok: true,
            message: "Cita reservada correctamente.",
            data: resultado.cita
        });

    } catch (error) {
        res.status(500).json({
            ok: false,
            message: "Error al reservar la cita.",
            error: error.message
        });
    }
};

// Lógica compartida por crearCita y reservarCita: valida que el horario
// pedido exista dentro del horario semanal del veterinario y que nadie
// más lo haya tomado todavía, y crea la cita.
async function agendarCita(datos, estadoInicial, propietarioUid = null) {
    const resultado = await crearSiDisponible({
        ...datos,
        estado: estadoInicial,
    }, propietarioUid);

    if (resultado.error === "MASCOTA_NO_ENCONTRADA") {
        return { error: "La mascota asociada no existe.", status: 404 };
    }
    if (resultado.error === "MASCOTA_ARCHIVADA") {
        return { error: "No se pueden agendar citas para una mascota archivada.", status: 409 };
    }
    if (resultado.error === "MASCOTA_NO_PROPIA") {
        return { error: "Solo puedes reservar citas para tus propias mascotas.", status: 403 };
    }
    if (resultado.error === "CITA_HORARIO_OCUPADO") {
        return { error: "Ese horario ya fue reservado por otra persona.", status: 409 };
    }
    if (resultado.error === "HORARIO_NO_ENCONTRADO") {
        return { error: "Ese veterinario no tiene un horario de atención configurado.", status: 400 };
    }
    if (resultado.error === "HORARIO_INVALIDO") {
        return { error: "Ese horario no está dentro del horario de atención del veterinario.", status: 400 };
    }
    if (resultado.error === "SERVICIO_REQUERIDO") {
        return { error: "Selecciona un servicio veterinario para la cita.", status: 400 };
    }
    if (resultado.error === "SERVICIO_NO_DISPONIBLE") {
        return {
            error: "El servicio seleccionado ya no está disponible. Actualiza el catálogo y elige otro servicio.",
            status: 409,
            codigo: "SERVICIO_NO_DISPONIBLE"
        };
    }
    if (resultado.error === "SERVICIO_INVALIDO") {
        return {
            error: "El servicio seleccionado no tiene una tarifa válida. Contacta con la clínica.",
            status: 409,
            codigo: "SERVICIO_NO_DISPONIBLE"
        };
    }

    return { cita: resultado.cita };

}

// Actualizar una cita (edición general: estado, datos de la reserva, etc.)
export const actualizarCita = async (req, res) => {
    try {
        const { id } = req.params;

        const existente = await obtenerPorId(id);
        if (!existente) {
            return res.status(404).json({ ok: false, message: "Cita no encontrada." });
        }
        const errorValidacion = validarCita({ ...existente, ...req.body });
        if (errorValidacion) {
            return res.status(400).json({ ok: false, message: errorValidacion });
        }
        const citaActualizada = await actualizarSiDisponible(id, req.body);

        if (citaActualizada === undefined) {
            return res.status(404).json({
                ok: false,
                message: "Cita no encontrada."
            });
        }

        if (citaActualizada === null) {
            return res.status(409).json({
                ok: false,
                message: "Ese horario ya fue reservado por otra persona."
            });
        }

        if (citaActualizada.error === "TRANSICION_INVALIDA") {
            return res.status(400).json({
                ok: false,
                message: "La transición de estado de la cita no es válida."
            });
        }
        if (citaActualizada.error === "CAMPOS_INVALIDOS") {
            return res.status(400).json({ ok: false, message: "La solicitud contiene campos no permitidos." });
        }
        if (citaActualizada.error === "REPROGRAMACION_REQUERIDA") {
            return res.status(400).json({ ok: false, message: "Utiliza la operación de reprogramación para cambiar fecha, hora o veterinario." });
        }
        if (citaActualizada.error === "MASCOTA_NO_ENCONTRADA") {
            return res.status(404).json({ ok: false, message: "La mascota asociada no existe." });
        }
        if (citaActualizada.error === "MASCOTA_ARCHIVADA") {
            return res.status(409).json({ ok: false, message: "No se puede cambiar la cita a una mascota archivada." });
        }
        if (citaActualizada.error === "PAGO_IMPIDE_CANCELACION") {
            return res.status(409).json({ ok: false, message: "La cita tiene un pago reportado, en revisión o aprobado. Resuelve el estado financiero antes de cancelarla." });
        }

        res.status(200).json({
            ok: true,
            message: "Cita actualizada correctamente.",
            data: citaActualizada
        });

    } catch (error) {
        res.status(500).json({
            ok: false,
            message: "Error al actualizar la cita.",
            error: error.message
        });
    }
};

// Reprograma una cita activa como una única transacción, sin liberar la
// reserva original hasta confirmar que el nuevo horario está disponible.
export const reprogramarCita = async (req, res) => {
    try {
        if (!["Administrador", "Recepcionista", "Veterinario"].includes(req.userRole)) {
            return res.status(403).json({ ok: false, message: "No tienes permisos para reprogramar citas." });
        }
        const { id } = req.params;
        const datos = req.body || {};
        const campos = Object.keys(datos);
        if (campos.length !== 3 || campos.some((campo) => !["veterinario", "fecha", "hora"].includes(campo))) {
            return res.status(400).json({ ok: false, message: "Indica únicamente veterinario, fecha y hora para reprogramar." });
        }

        const existente = await obtenerPorId(id);
        if (!existente) return res.status(404).json({ ok: false, message: "Cita no encontrada." });
        if (!ESTADOS_QUE_OCUPAN_HORARIO.includes(existente.estado)) {
            return res.status(409).json({ ok: false, message: "Solo se pueden reprogramar citas reservadas o confirmadas." });
        }
        const citaPropuesta = { ...existente, ...datos };
        const errorValidacion = validarCita(citaPropuesta);
        if (errorValidacion) return res.status(400).json({ ok: false, message: errorValidacion });

        const hoy = fechaHoyISO();
        const horaActual = horaActualElSalvador();
        if (datos.fecha < hoy || (datos.fecha === hoy && datos.hora < horaActual)) {
            return res.status(400).json({ ok: false, message: "No se puede reprogramar una cita a una fecha u hora pasada." });
        }

        const resultado = await reprogramarSiDisponible(id, datos);
        const errores = {
            CITA_NO_ENCONTRADA: [404, "Cita no encontrada."],
            ESTADO_NO_REPROGRAMABLE: [409, "Solo se pueden reprogramar citas reservadas o confirmadas."],
            MASCOTA_NO_ENCONTRADA: [404, "La mascota asociada no existe."],
            MASCOTA_ARCHIVADA: [409, "No se puede reprogramar una cita de una mascota archivada."],
            PROPIETARIO_CAMBIADO: [409, "La propiedad actual de la mascota no coincide con la cita."],
            HORARIO_NO_ENCONTRADO: [400, "Ese veterinario no tiene un horario configurado."],
            HORARIO_INVALIDO: [400, "El nuevo horario no pertenece a la disponibilidad del veterinario."],
            CITA_HORARIO_OCUPADO: [409, "El nuevo horario ya está ocupado o se solapa con otra cita."],
            CAMPOS_INVALIDOS: [400, "La solicitud contiene campos no permitidos."]
        };
        if (resultado.error && errores[resultado.error]) {
            const [status, message] = errores[resultado.error];
            return res.status(status).json({ ok: false, message });
        }

        return res.status(200).json({ ok: true, message: "Cita reprogramada correctamente.", data: resultado });
    } catch (error) {
        return res.status(500).json({ ok: false, message: "Error al reprogramar la cita.", error: error.message });
    }
};

// Cancelar una cita (no la borra, solo cambia su estado y libera el horario)
export const cancelarCita = async (req, res) => {
    try {
        const { id } = req.params;

        const cita = await obtenerPorId(id);

        if (!cita) {
            return res.status(404).json({
                ok: false,
                message: "Cita no encontrada."
            });
        }

        // Corrección de seguridad: si es Cliente, verificar que la cita pertenezca a una de sus mascotas
        if (req.userRole === "Cliente") {
            const mascota = await obtenerMascotaPorId(cita.mascotaId);

            if (!mascota || mascota.propietarioUid !== req.user.uid) {
                return res.status(404).json({
                    ok: false,
                    message: "Cita no encontrada."
                });
            }
        }

        // Validación: no permitir cancelar una cita con estado cancelada o completada
        if (cita.estado === "cancelada" || cita.estado === "completada") {
            return res.status(400).json({
                ok: false,
                message: `No se puede cancelar una cita con estado '${cita.estado}'.`
            });
        }

        const citaCancelada = await actualizarSiDisponible(id, { estado: "cancelada" });

        if (citaCancelada === undefined) {
            return res.status(404).json({ ok: false, message: "Cita no encontrada." });
        }

        if (citaCancelada?.error === "TRANSICION_INVALIDA") {
            return res.status(400).json({
                ok: false,
                message: `No se puede cancelar una cita con estado '${cita.estado}'.`
            });
        }
        if (citaCancelada?.error === "PAGO_IMPIDE_CANCELACION") {
            return res.status(409).json({ ok: false, message: "La cita tiene un pago reportado, en revisión o aprobado. Resuelve el estado financiero antes de cancelarla." });
        }

        res.status(200).json({
            ok: true,
            message: "Cita cancelada correctamente.",
            data: citaCancelada
        });

    } catch (error) {
        res.status(500).json({
            ok: false,
            message: "Error al cancelar la cita.",
            error: error.message
        });
    }
};

// Se mantiene la ruta DELETE por compatibilidad, pero el comportamiento es
// lógico: nunca se elimina el historial operativo de la cita.
export const crearControladorEliminarCita = ({ obtenerCita, actualizarCita }) => async (req, res) => {
    try {
        const { id } = req.params;

        const cita = await obtenerCita(id);

        if (!cita) {
            return res.status(404).json({
                ok: false,
                message: "Cita no encontrada."
            });
        }

        const resultado = await actualizarCita(id, { estado: "cancelada" });
        if (resultado?.error === "PAGO_IMPIDE_CANCELACION") {
            return res.status(409).json({ ok: false, message: "La cita tiene un pago reportado, en revisión o aprobado. Resuelve el estado financiero antes de cancelarla." });
        }
        if (resultado?.error === "TRANSICION_INVALIDA") {
            return res.status(409).json({ ok: false, message: `No se puede cancelar una cita con estado '${cita.estado}'.` });
        }

        res.status(200).json({
            ok: true,
            message: "La solicitud se conservó como cancelación lógica.",
            data: resultado
        });

    } catch (error) {
        res.status(500).json({
            ok: false,
            message: "Error al eliminar la cita.",
            error: error.message
        });
    }
};

export const eliminarCita = crearControladorEliminarCita({
    obtenerCita: obtenerPorId,
    actualizarCita: actualizarSiDisponible
});
