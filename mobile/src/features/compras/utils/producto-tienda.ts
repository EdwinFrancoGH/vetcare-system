import type { ProductoTienda } from '../services/tienda.service';

export function normalizarImagenHttps(valor: unknown): string | null {
  if (typeof valor !== 'string' || !valor.trim()) return null;
  try {
    const url = new URL(valor.trim());
    return url.protocol === 'https:' ? url.toString() : null;
  } catch {
    return null;
  }
}

export function limitarCantidadProducto(cantidad: number, stock: number): number {
  if (!Number.isSafeInteger(stock) || stock <= 0 || !Number.isFinite(cantidad)) return 0;
  return Math.min(Math.max(1, Math.floor(cantidad)), stock, 20);
}

export function productoActivoDisponible(producto: ProductoTienda): boolean {
  return producto.activo !== false && Number.isFinite(Number(producto.stock)) && Number(producto.stock) > 0;
}

export function iconoCategoriaProducto(categoria = ''):
  | 'nutrition-outline'
  | 'medkit-outline'
  | 'water-outline'
  | 'football-outline'
  | 'paw-outline' {
  const valor = categoria.toLowerCase();
  if (valor.includes('alim') || valor.includes('comid')) return 'nutrition-outline';
  if (valor.includes('medic') || valor.includes('farm')) return 'medkit-outline';
  if (valor.includes('hig') || valor.includes('limp')) return 'water-outline';
  if (valor.includes('juguet')) return 'football-outline';
  return 'paw-outline';
}

export function resolverImagenProducto(imagenUrl: unknown, fallo: boolean): { uri: string } | null {
  const uri = normalizarImagenHttps(imagenUrl);
  return uri && !fallo ? { uri } : null;
}

export async function agregarProductoDesdeDetalle(
  uid: string,
  producto: ProductoTienda,
  cantidad: number,
  operaciones: { hayPendiente(uid: string): Promise<boolean> },
  carrito: { agregar(uid: string, producto: ProductoTienda, cantidad: number): Promise<number> },
): Promise<number> {
  const unidades = limitarCantidadProducto(cantidad, Number(producto.stock));
  if (!uid || unidades <= 0) return 0;
  if (await operaciones.hayPendiente(uid)) throw new Error('Hay un pedido pendiente de reintento. Reinténtalo antes de editar el carrito.');
  return carrito.agregar(uid, producto, unidades);
}

export function rutaDetalleProducto(id: string): string {
  return `/api/tienda/productos/${encodeURIComponent(id)}`;
}

export type ItemCarritoTienda = { producto: ProductoTienda; cantidad: number };
export type CarritoTienda = Record<string, ItemCarritoTienda>;

export function compararCarritoConCatalogo(carrito: CarritoTienda, catalogo: ProductoTienda[]) {
  const actuales = new Map(catalogo.map((producto) => [producto.id, producto]));
  const cambios: string[] = [];
  const problemas: string[] = [];

  for (const { producto, cantidad } of Object.values(carrito)) {
    const actual = actuales.get(producto.id);
    if (!actual) {
      if (producto.disponible !== false) cambios.push(`${producto.nombre}: ya no está disponible en el catálogo.`);
      else problemas.push(`${producto.nombre}: ya no está disponible; elimínalo del carrito.`);
      continue;
    }
    if (Number(actual.precio) !== Number(producto.precio)) {
      cambios.push(`${producto.nombre}: el precio cambió de $${Number(producto.precio).toFixed(2)} a $${Number(actual.precio).toFixed(2)}.`);
    }
    if (Number(actual.stock) !== Number(producto.stock)) {
      cambios.push(`${producto.nombre}: las existencias cambiaron de ${producto.stock} a ${actual.stock}.`);
    }
    if (cantidad > Number(actual.stock)) {
      problemas.push(`${producto.nombre}: tienes ${cantidad} en el carrito y solo hay ${actual.stock}; ajusta la cantidad.`);
    }
  }
  return { cambios, problemas, requiereActualizar: cambios.length > 0 };
}

export function actualizarCarritoConCatalogo(carrito: CarritoTienda, catalogo: ProductoTienda[]): CarritoTienda {
  const actuales = new Map(catalogo.map((producto) => [producto.id, producto]));
  return Object.fromEntries(Object.entries(carrito).map(([id, item]) => {
    const actual = actuales.get(id);
    return [id, actual
      ? { ...item, producto: { ...actual, disponible: true } }
      : { ...item, producto: { ...item.producto, stock: 0, activo: false, disponible: false } }];
  }));
}

export function problemasCarritoActualizado(carrito: CarritoTienda): string[] {
  return Object.values(carrito).flatMap(({ producto, cantidad }) => {
    if (producto.disponible === false || producto.activo === false || producto.stock <= 0) {
      return [`${producto.nombre}: no está disponible; elimínalo del carrito.`];
    }
    if (cantidad > 20) return [`${producto.nombre}: reduce la cantidad a 20 unidades o menos.`];
    if (cantidad > producto.stock) return [`${producto.nombre}: ajusta la cantidad a ${producto.stock} o menos.`];
    return [];
  });
}
