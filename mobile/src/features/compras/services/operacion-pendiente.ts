const serializar = (valor: any): string => {
  if (Array.isArray(valor)) return `[${valor.map(serializar).join(',')}]`;
  if (valor && typeof valor === 'object') {
    return `{${Object.keys(valor).sort().map((key) => `${JSON.stringify(key)}:${serializar(valor[key])}`).join(',')}}`;
  }
  return JSON.stringify(valor);
};

// SHA-256 puro para evitar dependencias nativas adicionales y guardar solo
// una huella irreversible del payload, no sus datos personales.
const sha256 = (texto: string): string => {
  const bytes = unescape(encodeURIComponent(texto));
  const words: number[] = [];
  for (let i = 0; i < bytes.length; i += 1) words[i >> 2] = (words[i >> 2] || 0) | (bytes.charCodeAt(i) << (24 - (i % 4) * 8));
  words[bytes.length >> 2] = (words[bytes.length >> 2] || 0) | (0x80 << (24 - (bytes.length % 4) * 8));
  const bitLength = bytes.length * 8;
  words[(((bitLength + 64) >> 9) << 4) + 15] = bitLength;
  const k = [0x428a2f98,0x71374491,0xb5c0fbcf,0xe9b5dba5,0x3956c25b,0x59f111f1,0x923f82a4,0xab1c5ed5,0xd807aa98,0x12835b01,0x243185be,0x550c7dc3,0x72be5d74,0x80deb1fe,0x9bdc06a7,0xc19bf174,0xe49b69c1,0xefbe4786,0x0fc19dc6,0x240ca1cc,0x2de92c6f,0x4a7484aa,0x5cb0a9dc,0x76f988da,0x983e5152,0xa831c66d,0xb00327c8,0xbf597fc7,0xc6e00bf3,0xd5a79147,0x06ca6351,0x14292967,0x27b70a85,0x2e1b2138,0x4d2c6dfc,0x53380d13,0x650a7354,0x766a0abb,0x81c2c92e,0x92722c85,0xa2bfe8a1,0xa81a664b,0xc24b8b70,0xc76c51a3,0xd192e819,0xd6990624,0xf40e3585,0x106aa070,0x19a4c116,0x1e376c08,0x2748774c,0x34b0bcb5,0x391c0cb3,0x4ed8aa4a,0x5b9cca4f,0x682e6ff3,0x748f82ee,0x78a5636f,0x84c87814,0x8cc70208,0x90befffa,0xa4506ceb,0xbef9a3f7,0xc67178f2];
  let h = [0x6a09e667,0xbb67ae85,0x3c6ef372,0xa54ff53a,0x510e527f,0x9b05688c,0x1f83d9ab,0x5be0cd19];
  const r = (x: number, n: number) => (x >>> n) | (x << (32 - n));
  for (let offset = 0; offset < words.length; offset += 16) {
    const w = new Array<number>(64);
    for (let i = 0; i < 16; i += 1) w[i] = words[offset + i] || 0;
    for (let i = 16; i < 64; i += 1) { const a = w[i - 15]; const b = w[i - 2]; w[i] = (w[i - 16] + (r(a,7)^r(a,18)^(a>>>3)) + w[i - 7] + (r(b,17)^r(b,19)^(b>>>10))) | 0; }
    let [a,b,c,d,e,f,g,hh] = h;
    for (let i = 0; i < 64; i += 1) { const t1 = (hh + (r(e,6)^r(e,11)^r(e,25)) + ((e&f)^(~e&g)) + k[i] + w[i]) | 0; const t2 = ((r(a,2)^r(a,13)^r(a,22)) + ((a&b)^(a&c)^(b&c))) | 0; [hh,g,f,e,d,c,b,a] = [g,f,e,(d+t1)|0,c,b,a,(t1+t2)|0]; }
    h = h.map((value, index) => (value + [a,b,c,d,e,f,g,hh][index]) | 0);
  }
  return h.map((value) => (value >>> 0).toString(16).padStart(8, '0')).join('');
};

const locks = new Map<string, { fingerprint: Promise<string>; promise: Promise<string> }>();
const storageKey = (uid: string) => `vetcare:idempotency:v1:${encodeURIComponent(uid)}:pedido`;

export const huellaPedido = (payload: unknown): string => sha256(serializar(payload));
export const crearGestorPedidoPendiente = (storage: {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
}) => ({
  async obtener(uid: string, payload: unknown): Promise<string> {
    if (!uid) throw new Error('Se requiere una sesión autenticada para procesar la operación.');
    const key = storageKey(uid);
    const inFlight = locks.get(key);
    if (inFlight) {
      const requestedFingerprint = huellaPedido(payload);
      if (requestedFingerprint !== await inFlight.fingerprint) throw new Error('Hay una operación pendiente con otros datos. Restaura esos datos y reinténtala antes de iniciar otra.');
      return inFlight.promise;
    }
    const fingerprintPromise = Promise.resolve(huellaPedido(payload));
    const operation = (async () => {
      const fingerprint = await fingerprintPromise;
      const raw = await storage.getItem(key);
      const previous = raw ? JSON.parse(raw) : null;
      if (previous) {
        if (previous.fingerprint !== fingerprint) throw new Error('Hay una operación pendiente con otros datos. Restaura esos datos y reinténtala antes de iniciar otra.');
        return previous.key as string;
      }
      const record = { key: `mobile-pedido-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`, fingerprint, createdAt: Date.now() };
      await storage.setItem(key, JSON.stringify(record));
      return record.key;
    })();
    const lock = { fingerprint: fingerprintPromise, promise: operation };
    locks.set(key, lock);
    try { return await operation; } finally { if (locks.get(key) === lock) locks.delete(key); }
  },
  async confirmar(uid: string, key: string): Promise<void> {
    if (!uid) return;
    const storageId = storageKey(uid);
    const raw = await storage.getItem(storageId);
    if (raw && JSON.parse(raw).key === key) await storage.removeItem(storageId);
  },
  async resolverRechazoDefinitivo(uid: string, key: string, payload: unknown): Promise<boolean> {
    if (!uid || !key) return false;
    const storageId = storageKey(uid);
    const raw = await storage.getItem(storageId);
    if (!raw) return false;
    const previous = JSON.parse(raw);
    if (previous.key !== key || previous.fingerprint !== huellaPedido(payload)) return false;
    await storage.removeItem(storageId);
    return true;
  },
  async hayPendiente(uid: string): Promise<boolean> {
    if (!uid) return false;
    return Boolean(await storage.getItem(storageKey(uid)));
  },
});
