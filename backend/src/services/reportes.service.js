import db from "../config/firebase.js";

// Obtener resumen general para reportes y dashboard
export const obtenerResumen = async () => {
    const [productosSnapshot, ventasSnapshot] = await Promise.all([
        db.collection("productos").get(),
        db.collection("ventas").get()
    ]);

    const productos = productosSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    }));

    const ventas = ventasSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    }));

    const totalProductos = productos.length;

    const unidadesInventario = productos.reduce(
        (total, producto) => total + Number(producto.stock || 0),
        0
    );

    const productosStockBajo = productos.filter(
        producto =>
            Number(producto.stock) <= Number(producto.stockMinimo)
    );

    const totalVentas = ventas.length;

    const ingresosTotales = ventas.reduce(
        (total, venta) => total + Number(venta.total || 0),
        0
    );

    return {
        totalProductos,
        unidadesInventario,
        productosStockBajo: productosStockBajo.length,
        totalVentas,
        ingresosTotales: Number(ingresosTotales.toFixed(2))
    };
};

// Obtener reporte de productos con stock bajo
export const obtenerReporteStockBajo = async () => {
    const snapshot = await db.collection("productos").get();

    return snapshot.docs
        .map(doc => ({
            id: doc.id,
            ...doc.data()
        }))
        .filter(
            producto =>
                Number(producto.stock) <= Number(producto.stockMinimo)
        );
};

// Obtener reporte de ventas
export const obtenerReporteVentas = async () => {
    const snapshot = await db.collection("ventas").get();

    const ventas = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    }));

    ventas.sort(
        (a, b) =>
            new Date(b.fechaVenta).getTime() -
            new Date(a.fechaVenta).getTime()
    );

    return ventas;
};