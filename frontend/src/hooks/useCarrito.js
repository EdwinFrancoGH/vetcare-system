"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "../context/AuthContext";

const LIMITE_MAXIMO_UNIDADES = 20;

// Hook para gestionar el carrito de compras con persistencia por usuario
export function useCarrito() {
    const { user } = useAuth();
    const uid = user?.uid || null;

    const [items, setItems] = useState([]);
    const [cargado, setCargado] = useState(false);
    const itemsRef = useRef([]);

    // Mantener la referencia sincronizada para lecturas inmediatas
    useEffect(() => {
        itemsRef.current = items;
    }, [items]);

    // Cargar el carrito específico del usuario autenticado
    useEffect(() => {
        if (!uid) {
            setItems([]);
            itemsRef.current = [];
            setCargado(true);
            return;
        }

        try {
            const guardado = localStorage.getItem(`vetcare_carrito_${uid}`);
            if (guardado) {
                const parseado = JSON.parse(guardado);
                if (Array.isArray(parseado)) {
                    setItems(parseado);
                    itemsRef.current = parseado;
                } else {
                    setItems([]);
                    itemsRef.current = [];
                }
            } else {
                setItems([]);
                itemsRef.current = [];
            }
        } catch (error) {
            console.error("Error leyendo carrito de localStorage:", error);
            setItems([]);
            itemsRef.current = [];
        } finally {
            setCargado(true);
        }
    }, [uid]);

    // Persistir en localStorage si hay un usuario autenticado
    const guardarEnStorage = useCallback((nuevosItems) => {
        if (!uid) return;
        try {
            localStorage.setItem(`vetcare_carrito_${uid}`, JSON.stringify(nuevosItems));
        } catch (error) {
            console.error("Error guardando carrito en localStorage:", error);
        }
    }, [uid]);

    // Agregar producto al carrito respetando stock y límite de 20 unidades
    const agregar = useCallback((producto, cantidad = 1) => {
        if (!producto || !producto.id) return;

        const stockDisponible = Number(producto.stock) || 0;
        const tope = Math.min(stockDisponible, LIMITE_MAXIMO_UNIDADES);
        if (tope <= 0) return;

        setItems((prevItems) => {
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

            itemsRef.current = actualizados;
            guardarEnStorage(actualizados);
            return actualizados;
        });
    }, [guardarEnStorage]);

    // Quitar producto del carrito
    const quitar = useCallback((productoId) => {
        setItems((prevItems) => {
            const filtrados = prevItems.filter((it) => it.productoId !== productoId);
            itemsRef.current = filtrados;
            guardarEnStorage(filtrados);
            return filtrados;
        });
    }, [guardarEnStorage]);

    // Cambiar la cantidad de un producto específico
    const cambiarCantidad = useCallback((productoId, nuevaCantidad) => {
        const cant = Number(nuevaCantidad);
        if (cant <= 0) {
            quitar(productoId);
            return;
        }

        setItems((prevItems) => {
            const actualizados = prevItems.map((it) => {
                if (it.productoId !== productoId) return it;
                const tope = Math.min(Number(it.stock) || 0, LIMITE_MAXIMO_UNIDADES);
                const ajustada = Math.min(Math.max(1, cant), tope);
                return { ...it, cantidad: ajustada };
            });

            itemsRef.current = actualizados;
            guardarEnStorage(actualizados);
            return actualizados;
        });
    }, [quitar, guardarEnStorage]);

    // Vaciar todo el carrito
    const vaciar = useCallback(() => {
        setItems([]);
        itemsRef.current = [];
        guardarEnStorage([]);
    }, [guardarEnStorage]);

    // Sincronizar items del carrito con los productos del catálogo
    const sincronizarConCatalogo = useCallback((catalogo = []) => {
        if (!Array.isArray(catalogo)) return 0;
        const actualItems = itemsRef.current;
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
            itemsRef.current = actualizados;
            setItems(actualizados);
            guardarEnStorage(actualizados);
        }

        return cambios;
    }, [guardarEnStorage]);

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
