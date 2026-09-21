// Integración con Google Calendar por botón manual: no requiere OAuth
// ni backend. Genera un enlace que abre Google Calendar con el evento
// ya prellenado (fecha, título, detalles); el usuario solo confirma
// "Guardar" en su propia cuenta.
//
// Se modelan como eventos de todo el día porque el historial y las
// vacunas solo guardan fecha, no hora.
export function construirEnlaceGoogleCalendar({ titulo, fecha, detalles = "", ubicacion = "" }) {

    if (!fecha) {
        return null;
    }

    const inicio = fecha.replace(/-/g, "");

    // Google Calendar trata el final de un evento de todo el día como
    // exclusivo, así que para un evento de un solo día el "fin" es el
    // día siguiente.
    const fechaFinObj = new Date(fecha);
    fechaFinObj.setDate(fechaFinObj.getDate() + 1);
    const fin = fechaFinObj.toISOString().slice(0, 10).replace(/-/g, "");

    const params = new URLSearchParams({
        action: "TEMPLATE",
        text: titulo,
        dates: `${inicio}/${fin}`,
        details: detalles,
        location: ubicacion,
    });

    return `https://calendar.google.com/calendar/render?${params.toString()}`;

}
