const serializar = (valor) => {
    if (Array.isArray(valor)) return `[${valor.map(serializar).join(",")}]`;
    if (valor && typeof valor === "object") {
        return `{${Object.keys(valor).sort().map((key) => `${JSON.stringify(key)}:${serializar(valor[key])}`).join(",")}}`;
    }
    return JSON.stringify(valor);
};

export const huellaOperacion = async (payload) => {
    const bytes = new TextEncoder().encode(serializar(payload));
    const digest = await globalThis.crypto.subtle.digest("SHA-256", bytes);
    return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
};

export const crearGestorOperacionPendiente = ({ storage, hash = huellaOperacion, crearKey = (scope) => `web-${scope}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}` }) => {
    const enCurso = new Map();
    return {
        async obtener({ uid, scope, payload }) {
            if (!uid) throw new Error("Se requiere una sesión autenticada para procesar la operación.");
            const storageKey = `vetcare:idempotency:v1:${encodeURIComponent(uid)}:${scope}`;
            const enCursoActual = enCurso.get(storageKey);
            if (enCursoActual) {
                const fingerprintSolicitado = await hash(payload);
                if (fingerprintSolicitado !== await enCursoActual.fingerprint) {
                    throw new Error("Hay una operación pendiente con otros datos. Restaura esos datos y reinténtala antes de iniciar otra.");
                }
                return enCursoActual.promise;
            }
            const fingerprintEnCurso = hash(payload);
            const entrada = { fingerprint: fingerprintEnCurso, promise: null };
            const pending = (async () => {
                const fingerprint = await fingerprintEnCurso;
                const raw = storage.getItem(storageKey);
                const anterior = raw ? JSON.parse(raw) : null;
                if (anterior) {
                    if (anterior.fingerprint !== fingerprint) {
                        throw new Error("Hay una operación pendiente con otros datos. Restaura esos datos y reinténtala antes de iniciar otra.");
                    }
                    return anterior.key;
                }
                const record = { key: crearKey(scope), fingerprint, createdAt: Date.now() };
                storage.setItem(storageKey, JSON.stringify(record));
                return record.key;
            })();
            entrada.promise = pending;
            enCurso.set(storageKey, entrada);
            try { return await pending; } finally { if (enCurso.get(storageKey) === entrada) enCurso.delete(storageKey); }
        },
        async confirmar({ uid, scope, key }) {
            if (!uid) return;
            const storageKey = `vetcare:idempotency:v1:${encodeURIComponent(uid)}:${scope}`;
            const raw = storage.getItem(storageKey);
            if (raw && JSON.parse(raw).key === key) storage.removeItem(storageKey);
        },
    };
};
