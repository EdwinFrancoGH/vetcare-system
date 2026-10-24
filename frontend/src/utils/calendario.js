// Integración con Google Calendar por botón manual: no requiere OAuth
// ni backend. Genera un enlace que abre Google Calendar con el evento
// ya prellenado (fecha, título, detalles); el usuario solo confirma
// "Guardar" en su propia cuenta.
//
// Se modelan como eventos de todo el día porque el historial y las
// vacunas solo guardan fecha, no hora.
export function construirEnlaceGoogleCalendar({
    titulo,
    fecha,
    detalles = "",
    ubicacion = "",
    hora,
    duracionMinutos = 30,
}) {

    if (!fecha) {
        return null;
    }

    let dates = "";

    if (!hora) {
        // Evento de todo el día:
        // Google Calendar trata el final de un evento de todo el día como
        // exclusivo, así que para un evento de un solo día el "fin" es el
        // día siguiente.
        const fechaSolo = fecha.slice(0, 10);
        const inicio = fechaSolo.replace(/-/g, "");

        const fechaFinObj = new Date(fechaSolo);
        fechaFinObj.setDate(fechaFinObj.getDate() + 1);
        const fin = fechaFinObj.toISOString().slice(0, 10).replace(/-/g, "");

        dates = `${inicio}/${fin}`;
    } else {
        // Evento con hora:
        // dates=YYYYMMDDTHHmm00/YYYYMMDDTHHmm00
        const fechaSolo = fecha.slice(0, 10);
        const [año, mes, dia] = fechaSolo.split("-").map(Number);
        const [horas, minutos] = hora.split(":").map(Number);
        const dur = Number(duracionMinutos) || 30;

        const pad = (n) => String(n).padStart(2, "0");
        const inicio = `${año}${pad(mes)}${pad(dia)}T${pad(horas)}${pad(minutos)}00`;

        // Cálculo de fin sumando minutos mediante aritmética UTC (sin desfase de zona horaria)
        const finMs = Date.UTC(año, mes - 1, dia, horas, minutos) + dur * 60 * 1000;
        const finDate = new Date(finMs);
        const fin = `${finDate.getUTCFullYear()}${pad(finDate.getUTCMonth() + 1)}${pad(finDate.getUTCDate())}T${pad(finDate.getUTCHours())}${pad(finDate.getUTCMinutes())}00`;

        dates = `${inicio}/${fin}`;
    }

    const params = new URLSearchParams({
        action: "TEMPLATE",
        text: titulo,
        dates,
        details: detalles,
        location: ubicacion,
    });

    if (hora) {
        params.set("ctz", "America/El_Salvador");
    }

    return `https://calendar.google.com/calendar/render?${params.toString()}`;

}
