// Normaliza texto para comparar sin importar mayúsculas/minúsculas
// ni acentos (ej. "vacuna antirrábica" === "Vacuna Antirrabica").
function normalizar(texto) {
    return (texto || "")
        .toString()
        .normalize("NFD")
        .replace(/[̀-ͯ]/g, "")
        .toLowerCase();
}

// Búsqueda inteligente: un solo cuadro que busca en mascotas (nombre,
// especie, raza, propietario, color), en el historial clínico (motivo,
// diagnóstico, tratamiento) y en vacunas (nombre). Cada resultado del
// historial/vacunas se enlaza a la ficha de su mascota.
export function buscarEnClinica(termino, { mascotas = [], historiales = [], vacunas = [] }) {

    const q = normalizar(termino);

    if (!q) {
        return { mascotas: [], consultas: [], vacunas: [] };
    }

    const mascotasPorId = new Map(mascotas.map((m) => [m.id, m]));

    const mascotasEncontradas = mascotas.filter((m) =>
        [m.nombre, m.especie, m.raza, m.propietario, m.color].some((campo) =>
            normalizar(campo).includes(q)
        )
    );

    const consultasEncontradas = historiales
        .filter((h) =>
            [h.motivoConsulta, h.diagnostico, h.tratamiento].some((campo) =>
                normalizar(campo).includes(q)
            )
        )
        .map((h) => ({ ...h, mascota: mascotasPorId.get(h.mascotaId) }));

    const vacunasEncontradas = vacunas
        .filter((v) => normalizar(v.nombre).includes(q))
        .map((v) => ({ ...v, mascota: mascotasPorId.get(v.mascotaId) }));

    return {
        mascotas: mascotasEncontradas,
        consultas: consultasEncontradas,
        vacunas: vacunasEncontradas,
    };

}
