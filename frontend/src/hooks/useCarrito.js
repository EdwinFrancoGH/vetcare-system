"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { obtenerCarritoVisible } from "../utils/carritoUsuario";

const LIMITE_MAXIMO_UNIDADES = 20;

// Hook para gestionar el carrito de compras con persistencia por usuario
export function useCarrito() {
    const { user } = useAuth();
    const uid = user?.uid || null;

    const [carrito, setCarrito] = useState({ uid: null, items: [] });
    const carritoRef = useRef({ uid: null, items: [] });
    const { items, cargado } = obtenerCarritoVisible(carrito, uid);

    // Cargar el carrito específico del usuario autenticado
    useEffect(() => {
        let activa = true;
        Promise.resolve().then(() => {
            if (!activa) return;
            if (!uid) {
                const vacio = { uid: null, items: [] };
                carritoRef.current = vacio;
                setCarrito(vacio);
                return;
            }

            try {
                const guardado = localStorage.getItem(`vetcare_carrito_${uid}`);
                const parseado = guardado ? JSON.parse(guardado) : [];
                const siguiente = { uid, items: Array.isArray(parseado) ? parseado : [] };
                carritoRef.current = siguiente;
                setCarrito(siguiente);
            } catch (error) {
                console.error("Error leyendo carrito de localStorage:", error);
                const vacioUsuario = { uid, items: [] };
                carritoRef.current = vacioUsuario;
                setCarrito(vacioUsuario);
            }
        });
        return () => { activa = false; };
    }, [uid]);

    // Persistir en localStorage si hay un usuario autenticado
    const guardarEnStorage = (nuevosItems) => {
        if (!uid) return;
        try {
            localStorage.setItem(`vetcare_carrito_${uid}`, JSON.stringify(nuevosItems));
        } catch (error) {
            console.error("Error guardando carrito en localStorage:", error);
        }
    };

    // Agregar producto al carrito respetando stock y límite de 20 unidades
    const agregar = (producto, cantidad = 1) => {
        if (!uid || !cargado || !producto || !producto.id) return;

        const stockDisponible = Number(producto.stock) || 0;
        const tope = Math.min(stockDisponible, LIMITE_MAXIMO_UNIDADES);
        if (tope <= 0) return;

        setCarrito((prev) => {
            const prevItems = prev.uid === uid ? prev.items : [];
            const index = prevItems.findIndex((it) => it.productoId === producto.id);
            let actualizados;

            if (index >= 0) {
                const actual = prevItems[index];
                const nuevaCantidad = Math.min(actual.cantidad + cantidad, tope);
                actualizados = [...prevItems];
                actualizados[index] = {
                    ...actual,
                    cantidad: nuevaCantidad,
                    stock: stockDisponible,
                    precio: Number(producto.precio) || actual.precio
                };
            } else {
                const cantidadInicial = Math.min(Math.max(1, cantidad), tope);
                actualizados = [
                    ...prevItems,
                    {
                        productoId: producto.id,
                        nombre: producto.nombre,
                        precio: Number(producto.precio) || 0,
                        cantidad: cantidadInicial,
                        stock: stockDisponible
                    }
                ];
            }

            guardarEnStorage(actualizados);
            const siguiente = { uid, items: actualizados };
            carritoRef.current = siguiente;
            return siguiente;
        });
    };

    // Quitar producto del carrito
    const quitar = (productoId) => {
        if (!uid || !cargado) return;
        setCarrito((prev) => {
            const prevItems = prev.uid === uid ? prev.items : [];
            const filtrados = prevItems.filter((it) => it.productoId !== productoId);
            guardarEnStorage(filtrados);
            const siguiente = { uid, items: filtrados };
            carritoRef.current = siguiente;
            return siguiente;
        });
    };

    // Cambiar la cantidad de un producto específico
    const cambiarCantidad = (productoId, nuevaCantidad) => {
        if (!uid || !cargado) return;
        const cant = Number(nuevaCantidad);
        if (cant <= 0) {
            quitar(productoId);
            return;
        }

        setCarrito((prev) => {
            const prevItems = prev.uid === uid ? prev.items : [];
            const actualizados = prevItems.map((it) => {
                if (it.productoId !== productoId) return it;
                const tope = Math.min(Number(it.stock) || 0, LIMITE_MAXIMO_UNIDADES);
                const ajustada = Math.min(Math.max(1, cant), tope);
                return { ...it, cantidad: ajustada };
            });

            guardarEnStorage(actualizados);
            const siguiente = { uid, items: actualizados };
            carritoRef.current = siguiente;
            return siguiente;
        });
    };

    // Vaciar todo el carrito
    const vaciar = () => {
        if (!uid || !cargado) return;
        const vacio = { uid, items: [] };
        carritoRef.current = vacio;
        setCarrito(vacio);
        guardarEnStorage([]);
    };

    // Sincronizar items del carrito con los productos del catálogo
    const sincronizarConCatalogo = (catalogo = []) => {
        if (!Array.isArray(catalogo)) return 0;
        if (!uid || !cargado || carritoRef.current.uid !== uid) return 0;
        const actualItems = carritoRef.current.items;
        if (!actualItems || actualItems.length === 0) return 0;

        const mapaCatalogo = new Map(catalogo.map((p) => [p.id, p]));
        let cambios = 0;
        const actualizados = [];

        for (const item of actualItems) {
            const prod = mapaCatalogo.get(item.productoId);
            if (!prod) {
                cambios++;
                continue;
            }

            const stockCatalogo = Number(prod.stock) || 0;
            const precioCatalogo = Number(prod.precio) || 0;
            const nombreCatalogo = prod.nombre || item.nombre;
            const tope = Math.min(stockCatalogo, LIMITE_MAXIMO_UNIDADES);

            if (tope <= 0) {
                cambios++;
                continue;
            }

            const cantidadAjustada = Math.min(item.cantidad, tope);

            if (
                cantidadAjustada !== item.cantidad ||
                precioCatalogo !== item.precio ||
                stockCatalogo !== item.stock ||
                nombreCatalogo !== item.nombre
            ) {
                cambios++;
            }

            actualizados.push({
                ...item,
                nombre: nombreCatalogo,
                precio: precioCatalogo,
                stock: stockCatalogo,
                cantidad: cantidadAjustada
            });
        }

        if (cambios > 0) {
            const siguiente = { uid, items: actualizados };
            carritoRef.current = siguiente;
            setCarrito(siguiente);
            guardarEnStorage(actualizados);
        }

        return cambios;
    };

    // Cálculo del importe total acumulado
    const total = items.reduce(
        (acum, it) => acum + (Number(it.precio) || 0) * (Number(it.cantidad) || 0),
        0
    );

    // Suma de unidades de todos los productos en el carrito
    const cantidadTotal = items.reduce(
        (acum, it) => acum + (Number(it.cantidad) || 0),
        0
    );

    return {
        items,
        cargado,
        agregar,
        quitar,
        cambiarCantidad,
        vaciar,
        total,
        cantidadTotal,
        sincronizarConCatalogo
    };
}
