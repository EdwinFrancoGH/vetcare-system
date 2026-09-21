// Reglas de negocio para las alertas clínicas, la clasificación
// automática del estado del paciente y la detección de consultas
// frecuentes.
//
// Estas reglas no estaban definidas en el proyecto, así que se usan
// valores por defecto razonables para una clínica veterinaria. Son
// constantes: ajústalas aquí si tu criterio real es distinto.
export const DIAS_ALERTA_PROXIMO = 7;        // días de anticipación para avisar "próximo a vencer"
export const UMBRAL_CONSULTAS_FRECUENTES = 3; // nº de consultas para considerarse "frecuente"
export const DIAS_VENTANA_FRECUENCIA = 30;    // ventana de tiempo para contar consultas frecuentes

const MS_POR_DIA = 1000 * 60 * 60 * 24;

function diasEntre(fechaA, fechaB) {
    return (new Date(fechaA) - new Date(fechaB)) / MS_POR_DIA;
}

// Junta las próximas citas de seguimiento (historial.proximaCita) y los
// refuerzos de vacuna (vacuna.proximaFecha) de UNA mascota, y los separa
// en "vencidos" (la fecha ya pasó) y "próximos" (vencen dentro de
// DIAS_ALERTA_PROXIMO días).
export function calcularPendientes(historiales = [], vacunas = [], hoy = new Date()) {

    const pendientes = [
        ...historiales
            .filter((h) => !!h.proximaCita)
            .map((h) => ({
                tipo: "Cita de seguimiento",
                fecha: h.proximaCita,
                origen: h,
            })),
        ...vacunas
            .filter((v) => !!v.proximaFecha)
            .map((v) => ({
                tipo: `Refuerzo de ${v.nombre}`,
                fecha: v.proximaFecha,
                origen: v,
            })),
    ];

    const vencidos = pendientes.filter((p) => diasEntre(p.fecha, hoy) < 0);

    const proximos = pendientes.filter((p) => {
        const dias = diasEntre(p.fecha, hoy);
        return dias >= 0 && dias <= DIAS_ALERTA_PROXIMO;
    });

    return { vencidos, proximos };

}

// Clasificación automática del estado clínico de una mascota:
// - "Crítico"       -> tiene al menos un pendiente vencido.
// - "En seguimiento" -> no tiene vencidos, pero sí algo por vencer pronto.
// - "Estable"        -> tiene historial y no tiene pendientes.
// - "Sin historial"  -> todavía no se le ha registrado ninguna consulta.
//
// Es un estado calculado, independiente del campo manual "estado" que
// ya existe en Mascota (Activo/En tratamiento/Inactivo); no lo sobrescribe.
export function clasificarEstadoPaciente(historiales = [], vacunas = [], hoy = new Date()) {

    if (historiales.length === 0 && vacunas.length === 0) {
        return "Sin historial";
    }

    const { vencidos, proximos } = calcularPendientes(historiales, vacunas, hoy);

    if (vencidos.length > 0) {
        return "Crítico";
    }

    if (proximos.length > 0) {
        return "En seguimiento";
    }

    return "Estable";

}

// Detección de consultas frecuentes: UMBRAL_CONSULTAS_FRECUENTES o más
// consultas dentro de los últimos DIAS_VENTANA_FRECUENCIA días.
export function detectarConsultasFrecuentes(historiales = [], hoy = new Date()) {

    const recientes = historiales.filter((h) => {
        if (!h.fecha) return false;
        const dias = diasEntre(hoy, h.fecha);
        return dias >= 0 && dias <= DIAS_VENTANA_FRECUENCIA;
    });

    return {
        esFrecuente: recientes.length >= UMBRAL_CONSULTAS_FRECUENTES,
        cantidad: recientes.length,
    };

}

// Agrega vencidos, próximos, estado y frecuencia de TODAS las mascotas,
// para el panel de alertas del Dashboard.
export function calcularAlertasGlobales(mascotas = [], historiales = [], vacunas = []) {

    const hoy = new Date();

    return mascotas.map((mascota) => {

        const historialMascota = historiales.filter((h) => h.mascotaId === mascota.id);
        const vacunasMascota = vacunas.filter((v) => v.mascotaId === mascota.id);

        const { vencidos, proximos } = calcularPendientes(historialMascota, vacunasMascota, hoy);
        const estado = clasificarEstadoPaciente(historialMascota, vacunasMascota, hoy);
        const { esFrecuente, cantidad } = detectarConsultasFrecuentes(historialMascota, hoy);

        return {
            mascota,
            estado,
            vencidos,
            proximos,
            consultasFrecuentes: esFrecuente,
            cantidadConsultasRecientes: cantidad,
        };

    });

}
