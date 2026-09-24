import db from "../config/firebase.js";

// Obtener todos los productos
export const obtenerTodos = async () => {
    const snapshot = await db.collection("productos").get();

    return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    }));
};

// Obtener un producto por ID
export const obtenerPorId = async (id) => {
    const doc = await db.collection("productos").doc(id).get();

    if (!doc.exists) {
        return null;
    }

    return {
        id: doc.id,
        ...doc.data()
    };
};

// Crear un producto
export const crear = async (datos) => {
    const producto = {
        nombre: datos.nombre,
        categoria: datos.categoria,
        descripcion: datos.descripcion || "",
        precio: Number(datos.precio),
        stock: Number(datos.stock),
        stockMinimo: Number(datos.stockMinimo),
        fechaVencimiento: datos.fechaVencimiento || null,
        activo: datos.activo ?? true,
        fechaRegistro: new Date().toISOString(),
        fechaActualizacion: new Date().toISOString()
    };

    const docRef = await db.collection("productos").add(producto);

    return {
        id: docRef.id,
        ...producto
    };
};

// Actualizar un producto
export const actualizar = async (id, datos) => {
    const docRef = db.collection("productos").doc(id);

    const doc = await docRef.get();

    if (!doc.exists) {
        return null;
    }

    // Evita modificar el ID si viene en el body
    delete datos.id;

    const productoActualizado = {
        ...datos,
        fechaActualizacion: new Date().toISOString()
    };

    // Convertir valores numéricos si fueron enviados
    if (datos.precio !== undefined) {
        productoActualizado.precio = Number(datos.precio);
    }

    if (datos.stock !== undefined) {
        productoActualizado.stock = Number(datos.stock);
    }

    if (datos.stockMinimo !== undefined) {
        productoActualizado.stockMinimo = Number(datos.stockMinimo);
    }

    await docRef.update(productoActualizado);

    const actualizado = await docRef.get();

    return {
        id: actualizado.id,
        ...actualizado.data()
    };
};

// Eliminar un producto
export const eliminar = async (id) => {
    const docRef = db.collection("productos").doc(id);

    const doc = await docRef.get();

    if (!doc.exists) {
        return false;
    }

    await docRef.delete();

    return true;
};

// Obtener productos con stock bajo
export const obtenerStockBajo = async () => {
    const productos = await obtenerTodos();

    return productos.filter(producto =>
        Number(producto.stock) <= Number(producto.stockMinimo)
    );
};