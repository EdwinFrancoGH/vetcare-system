import test from "node:test";
import assert from "node:assert/strict";
import express from "express";
import { crearVerifyRoles } from "../src/middlewares/auth.middleware.js";
import { crearRouterHistorial } from "../src/routes/historial.routes.js";
import { crearRouterVacunas } from "../src/routes/vacunas.routes.js";

const operaciones = [
    ["GET", "/historiales/"],
    ["GET", "/historiales/mascota/pet-1"],
    ["GET", "/historiales/record-1"],
    ["POST", "/historiales/"],
    ["PUT", "/historiales/record-1"],
    ["DELETE", "/historiales/record-1"],
    ["GET", "/vacunas/"],
    ["GET", "/vacunas/mascota/pet-1"],
    ["GET", "/vacunas/vaccine-1"],
    ["POST", "/vacunas/"],
    ["PUT", "/vacunas/vaccine-1"],
    ["DELETE", "/vacunas/vaccine-1"],
];

test("Recepcionista recibe 403 en todas las operaciones HTTP de historiales y vacunas", async (t) => {
    const app = express();
    app.use((req, _res, next) => { req.user = { uid: "receptionist-1" }; next(); });
    const verificarRecepcionista = crearVerifyRoles(async (uid) => uid === "receptionist-1" ? "Recepcionista" : null);
    app.use("/historiales", crearRouterHistorial(verificarRecepcionista));
    app.use("/vacunas", crearRouterVacunas(verificarRecepcionista));
    const server = app.listen(0, "127.0.0.1");
    await new Promise((resolve) => server.once("listening", resolve));
    t.after(() => new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve())));
    const address = server.address();
    const origin = `http://127.0.0.1:${address.port}`;

    for (const [method, path] of operaciones) {
        const response = await fetch(`${origin}${path}`, { method });
        assert.equal(response.status, 403, `${method} ${path}`);
    }
});

test("Administrador y Veterinario mantienen acceso; Cliente conserva lectura solamente", async () => {
    const rolesLeen = ["Administrador", "Veterinario", "Cliente"];
    const rolesModifican = ["Administrador", "Veterinario"];
    for (const role of rolesLeen) {
        let continuó = false;
        const guard = crearVerifyRoles(async () => role)(...rolesLeen);
        await guard({ user: { uid: "user-1" } }, { status: () => { throw new Error("No debía denegar"); } }, () => { continuó = true; });
        assert.equal(continuó, true, `${role} lectura`);
    }
    for (const role of rolesModifican) {
        let continuó = false;
        const guard = crearVerifyRoles(async () => role)(...rolesModifican);
        await guard({ user: { uid: "user-1" } }, { status: () => { throw new Error("No debía denegar"); } }, () => { continuó = true; });
        assert.equal(continuó, true, `${role} escritura`);
    }
});
