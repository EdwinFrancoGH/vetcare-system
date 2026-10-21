import {
    obtenerTodas,
    obtenerPorId,
    obtenerPorMascota,
    obtenerPorVeterinario,
    crear,
    actualizar,
    eliminar
} from "../services/citas.service.js";

import {
    obtenerTodos as obtenerTodosLosHorarios,
    obtenerPorVeterinario as obtenerHorarioDeVeterinario
} from "../services/horarios.service.js";

import { obtenerPorId as obtenerMascotaPorId } from "../services/mascotas.service.js";

import { validarCita } from "../validators/cita.validator.js";
import { generarDisponibilidad, esHorarioValido, sumarDiasISO } from "../utils/disponibilidad.js";

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

        const resultado = await agendarCita(req.body, "confirmada");

        if (resultado.error) {
            return res.status(resultado.status).json({
                ok: false,
                message: resultado.error
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

        const resultado = await agendarCita(datos, "reservada");

        if (resultado.error) {
            return res.status(resultado.status).json({
                ok: false,
                message: resultado.error
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
async function agendarCita(datos, estadoInicial) {

    const { veterinario, fecha, hora } = datos;

    const horario = await obtenerHorarioDeVeterinario(veterinario);

    if (!horario) {
        return { error: "Ese veterinario no tiene un horario de atención configurado.", status: 400 };
    }

    if (!esHorarioValido({ horario, fecha, hora })) {
        return { error: "Ese horario no está dentro del horario de atención del veterinario.", status: 400 };
    }

    const citasDelVeterinario = await obtenerPorVeterinario(veterinario);

    const yaOcupado = citasDelVeterinario.some((cita) =>
        cita.fecha === fecha &&
        cita.hora === hora &&
        ESTADOS_QUE_OCUPAN_HORARIO.includes(cita.estado)
    );

    if (yaOcupado) {
        return { error: "Ese horario ya fue reservado por otra persona.", status: 409 };
    }

    const cita = await crear({
        ...datos,
        duracionMinutos: horario.duracionCitaMinutos || 60,
        estado: estadoInicial,
    });

    return { cita };

}

// Actualizar una cita (edición general: estado, datos de la reserva, etc.)
export const actualizarCita = async (req, res) => {
    try {
        const { id } = req.params;

        const cita = await obtenerPorId(id);

        if (!cita) {
            return res.status(404).json({
                ok: false,
                message: "Cita no encontrada."
            });
        }

        const citaActualizada = await actualizar(id, req.body);

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

        const citaCancelada = await actualizar(id, { estado: "cancelada" });

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

// Eliminar una cita (borrado definitivo)
export const eliminarCita = async (req, res) => {
    try {
        const { id } = req.params;

        const cita = await obtenerPorId(id);

        if (!cita) {
            return res.status(404).json({
                ok: false,
                message: "Cita no encontrada."
            });
        }

        await eliminar(id);

        res.status(200).json({
            ok: true,
            message: "Cita eliminada correctamente."
        });

    } catch (error) {
        res.status(500).json({
            ok: false,
            message: "Error al eliminar la cita.",
            error: error.message
        });
    }
};
