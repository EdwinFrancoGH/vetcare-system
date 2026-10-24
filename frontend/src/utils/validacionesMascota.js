export const REGEX_LETRAS = /^[A-Za-zÁÉÍÓÚáéíóúÑñÜü\s'-]*$/;
export const REGEX_TELEFONO_INPUT = /^\+?[\d\s-]*$/;
export const REGEX_TELEFONO_VALIDO = /^(\+?503[\s-]?)?[2-7]\d{3}[\s-]?\d{4}$/;

export function validarFormularioMascota(formData) {
    const nombre = String(formData?.nombre ?? "").trim();
    const especie = String(formData?.especie ?? "").trim();
    const raza = String(formData?.raza ?? "").trim();
    const sexo = String(formData?.sexo ?? "").trim();
    const color = String(formData?.color ?? "").trim();
    const fechaNacimiento = String(formData?.fechaNacimiento ?? "").trim();
    const propietario = String(formData?.propietario ?? "").trim();
    const telefono = String(formData?.telefono ?? "").trim();
    const direccion = String(formData?.direccion ?? "").trim();
    const pesoStr = String(formData?.peso ?? "").trim();
    const pesoNum = Number(pesoStr);

    const errores = {};

    if (!nombre) {
        errores.nombre = "El nombre de la mascota es obligatorio.";
    }
    if (!especie) {
        errores.especie = "Debe seleccionar la especie de la mascota.";
    }
    if (!raza) {
        errores.raza = "La raza de la mascota es obligatoria.";
    }
    if (!sexo) {
        errores.sexo = "Debe seleccionar el sexo de la mascota.";
    }
    if (!color) {
        errores.color = "El color de la mascota es obligatorio.";
    }
    if (!fechaNacimiento) {
        errores.fechaNacimiento = "La fecha de nacimiento es obligatoria.";
    }
    if (pesoStr === "" || pesoNum <= 0 || isNaN(pesoNum)) {
        errores.peso = "El peso debe ser mayor a 0 kg.";
    }
    if (!propietario) {
        errores.propietario = "El nombre del propietario es obligatorio.";
    }
    if (!telefono) {
        errores.telefono = "El teléfono de contacto es obligatorio.";
    } else if (!REGEX_TELEFONO_VALIDO.test(telefono)) {
        errores.telefono = "Ingrese un número de teléfono válido de El Salvador (8 dígitos, ej: 7123-4567 o +503 7123-4567).";
    }
    if (!direccion) {
        errores.direccion = "La dirección es obligatoria.";
    }

    const ordenCampos = [
        "nombre",
        "especie",
        "raza",
        "sexo",
        "color",
        "fechaNacimiento",
        "peso",
        "propietario",
        "telefono",
        "direccion",
    ];

    const primerCampo = ordenCampos.find((c) => errores[c]) || null;
    const primerMensaje = primerCampo ? errores[primerCampo] : null;

    let tituloSwal = "Campo requerido";
    if (primerCampo === "peso") {
        tituloSwal = "Campo inválido";
    } else if (primerCampo === "telefono" && telefono) {
        tituloSwal = "Teléfono inválido";
    }

    return {
        esValido: Object.keys(errores).length === 0,
        errores,
        primerCampo,
        primerMensaje,
        tituloSwal,
    };
}
