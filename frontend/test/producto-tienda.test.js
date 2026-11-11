import test from "node:test";
import assert from "node:assert/strict";
import { limitarCantidadProducto, obtenerImagenHttps } from "../src/utils/productoTienda.js";

test("la imagen de producto solo acepta URLs HTTPS válidas", () => {
    assert.equal(obtenerImagenHttps("https://cdn.example.test/producto.jpg"), "https://cdn.example.test/producto.jpg");
    assert.equal(obtenerImagenHttps("http://cdn.example.test/producto.jpg"), null);
    assert.equal(obtenerImagenHttps("no es una URL"), null);
    assert.equal(obtenerImagenHttps(""), null);
});

test("la cantidad para agregar queda limitada por stock y por el máximo de carrito", () => {
    assert.equal(limitarCantidadProducto(5, 3), 3);
    assert.equal(limitarCantidadProducto(30, 40), 20);
    assert.equal(limitarCantidadProducto(2, 0), 0);
});
