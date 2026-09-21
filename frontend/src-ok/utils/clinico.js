// Utilidades para construir la línea de tiempo clínica y el resumen
// automático de una mascota, a partir de su historial y sus vacunas.

// Une historial + vacunas en una sola lista de eventos, ordenada de
// más reciente a más antigua.
export function construirLineaTiempo(historiales = [], vacunas = []) {

    const eventosConsulta = historiales
        .filter((h) => !!h.fecha)
        .map((h) => ({
            tipo: "consulta",
            fecha: h.fecha,
            id: `consulta-${h.id}`,
            datos: h,
        }));

    const eventosVacuna = vacunas
        .filter((v) => !!v.fecha)
        .map((v) => ({
            tipo: "vacuna",
            fecha: v.fecha,
            id: `vacuna-${v.id}`,
            datos: v,
        }));

    return [...eventosConsulta, ...eventosVacuna].sort(
        (a, b) => new Date(b.fecha) - new Date(a.fecha)
    );

}

// Calcula un resumen clínico automático a partir del historial y las
// vacunas de una mascota: última consulta, diagnóstico vigente, peso
// actual y su tendencia, y la próxima acción pendiente más cercana
// (cita de seguimiento o refuerzo de vacuna).
export function generarResumenClinico(historiales = [], vacunas = []) {

    const historialesConFecha = historiales.filter((h) => !!h.fecha);

    const ordenados = [...historialesConFecha].sort(
        (a, b) => new Date(b.fecha) - new Date(a.fecha)
    );

    const ultimaConsulta = ordenados[0] || null;

    const historialesConPeso = ordenados.filter(
        (h) => h.peso !== undefined && h.peso !== null && h.peso !== ""
    );

    const pesoActual = historialesConPeso[0]?.peso ?? null;
    const pesoAnterior = historialesConPeso[1]?.peso ?? null;

    let tendenciaPeso = null; // "sube" | "baja" | "estable"

    if (pesoActual !== null && pesoAnterior !== null) {

        const diferencia = Number(pesoActual) - Number(pesoAnterior);

        if (Math.abs(diferencia) < 0.05) {
            tendenciaPeso = "estable";
        } else {
            tendenciaPeso = diferencia > 0 ? "sube" : "baja";
        }

    }

    // Próxima fecha pendiente registrada (cita de seguimiento o
    // refuerzo de vacuna), la más cercana en el tiempo.
    const pendientes = [
        ...historiales
            .filter((h) => !!h.proximaCita)
            .map((h) => ({ tipo: "Cita de seguimiento", fecha: h.proximaCita })),
        ...vacunas
            .filter((v) => !!v.proximaFecha)
            .map((v) => ({ tipo: `Refuerzo de ${v.nombre}`, fecha: v.proximaFecha })),
    ].sort((a, b) => new Date(a.fecha) - new Date(b.fecha));

    const proximaAccion = pendientes[0] || null;

    return {
        totalConsultas: historialesConFecha.length,
        totalVacunas: vacunas.length,
        ultimaConsulta,
        diagnosticoVigente: ultimaConsulta?.diagnostico || null,
        tratamientoVigente: ultimaConsulta?.tratamiento || null,
        pesoActual,
        pesoAnterior,
        tendenciaPeso,
        proximaAccion,
    };

}
