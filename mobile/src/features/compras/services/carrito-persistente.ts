import type { ProductoTienda } from './tienda.service';

export type CarritoGuardado = {
  carrito: Record<string, { producto: ProductoTienda; cantidad: number }>;
  tipoPedido: 'retiro' | 'en_linea';
};

const claveCarrito = (uid: string) => `vetcare:cart:v1:${encodeURIComponent(uid)}`;
const colasEscritura = new Map<string, Promise<void>>();

export const crearGestorCarritoPersistente = (storage: {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
}) => ({
  async cargar(uid: string): Promise<CarritoGuardado | null> {
    if (!uid) return null;
    const raw = await storage.getItem(claveCarrito(uid));
    if (!raw) return null;
    try {
      const value = JSON.parse(raw);
      if (value?.version !== 1 || value?.uid !== uid || !['retiro', 'en_linea'].includes(value.tipoPedido) || !Array.isArray(value.items)) return null;
      const carrito: CarritoGuardado['carrito'] = {};
      for (const entry of value.items) {
        const producto = entry?.producto;
        const cantidad = Number(entry?.cantidad);
        if (!producto?.id || !Number.isSafeInteger(cantidad) || cantidad <= 0) continue;
        carrito[producto.id] = {
          producto: {
            id: producto.id,
            nombre: String(producto.nombre || ''),
            precio: Number.isFinite(Number(producto.precio)) ? Number(producto.precio) : 0,
            stock: Number.isSafeInteger(Number(producto.stock)) ? Number(producto.stock) : 0,
            ...(typeof producto.categoria === 'string' ? { categoria: producto.categoria } : {}),
            ...(typeof producto.descripcion === 'string' ? { descripcion: producto.descripcion } : {}),
            ...(typeof producto.imagenUrl === 'string' ? { imagenUrl: producto.imagenUrl } : {}),
            ...(typeof producto.activo === 'boolean' ? { activo: producto.activo } : {}),
            ...(typeof producto.disponible === 'boolean' ? { disponible: producto.disponible } : {}),
          },
          cantidad,
        };
      }
      return { carrito, tipoPedido: value.tipoPedido };
    } catch {
      return null;
    }
  },
  async guardar(uid: string, carrito: CarritoGuardado['carrito'], tipoPedido: CarritoGuardado['tipoPedido']): Promise<void> {
    if (!uid) return;
    const storageId = claveCarrito(uid);
    const value = {
      version: 1,
      uid,
      tipoPedido,
      items: Object.values(carrito).map(({ producto, cantidad }) => ({
        producto: {
          id: producto.id,
          nombre: producto.nombre,
          categoria: producto.categoria,
          precio: producto.precio,
          stock: producto.stock,
          descripcion: producto.descripcion,
          imagenUrl: producto.imagenUrl,
          activo: producto.activo,
          disponible: producto.disponible,
        },
        cantidad,
      })),
    };
    const previous = colasEscritura.get(storageId) || Promise.resolve();
    const write = previous.catch(() => undefined).then(() => value.items.length
      ? storage.setItem(storageId, JSON.stringify(value))
      : storage.removeItem(storageId));
    colasEscritura.set(storageId, write);
    try { await write; } finally { if (colasEscritura.get(storageId) === write) colasEscritura.delete(storageId); }
  },
  async agregar(uid: string, producto: ProductoTienda, cantidad: number): Promise<number> {
    if (!uid || !producto?.id || !Number.isSafeInteger(cantidad) || cantidad <= 0) return 0;
    const guardado = await this.cargar(uid);
    const carrito = guardado?.carrito || {};
    const stock = Number(producto.stock);
    if (!Number.isSafeInteger(stock) || stock <= 0) return carrito[producto.id]?.cantidad || 0;
    const maximo = Math.min(stock, 20);
    const actual = carrito[producto.id]?.cantidad || 0;
    const siguiente = Math.min(actual + cantidad, maximo);
    carrito[producto.id] = { producto: { ...producto, disponible: true }, cantidad: siguiente };
    await this.guardar(uid, carrito, guardado?.tipoPedido || 'retiro');
    return siguiente;
  },
});
