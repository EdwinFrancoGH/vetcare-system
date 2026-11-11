import { createHash } from 'node:crypto';

const hash = (value) => createHash('sha256').update(value).digest('hex');

const stableStringify = (value) => {
    if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`;
    if (value && typeof value === 'object') {
        return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`).join(',')}}`;
    }
    return JSON.stringify(value);
};

export const validarClaveIdempotencia = (key) =>
    typeof key === 'string' && /^[A-Za-z0-9._:-]{8,200}$/.test(key);

export const DIAS_RETENCION_IDEMPOTENCIA = 90;
const MILISEGUNDOS_RETENCION = DIAS_RETENCION_IDEMPOTENCIA * 24 * 60 * 60 * 1000;

export const fechaExpiracionIdempotencia = (fecha = new Date()) =>
    new Date(fecha.getTime() + MILISEGUNDOS_RETENCION);

export const crearClavePersistente = ({ scope, actorUid, key, payload }) => ({
    id: hash(`${scope}\0${actorUid}\0${key}`),
    payloadHash: hash(stableStringify(payload))
});

export const exigirClaveIdempotencia = (req, res, next) => {
    const key = req.get('Idempotency-Key');
    if (!validarClaveIdempotencia(key)) {
        return res.status(400).json({
            ok: false,
            message: 'Se requiere un encabezado Idempotency-Key válido para procesar la operación.'
        });
    }
    req.idempotencyKey = key;
    return next();
};
