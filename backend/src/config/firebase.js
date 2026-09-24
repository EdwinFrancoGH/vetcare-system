// Configuración de Firebase Admin (backend).
// Se reconciliaron aquí las dos versiones que existían en las ramas
// "auth/ventas" y "citas/historial": esta es la única fuente de verdad.
//
// - Exporta `db` como export default (así lo consumen mascotas, historial,
//   vacunas, citas, horarios, productos, inventario, ventas y reportes).
// - Exporta también `{ db, auth }` con nombre (así los consume
//   auth.middleware.js, auth.controller.js y users.controller.js, que
//   necesitan Firebase Admin Auth para verificar tokens y administrar
//   usuarios).
// - Se restauró el guard de `getApps()` para no volver a inicializar la
//   app de Firebase si este módulo llega a cargarse más de una vez
//   (evita el error "Firebase app named '[DEFAULT]' already exists").
import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";

import serviceAccount from "../../credentials/firebase-key.json" with { type: "json" };

let app;
if (getApps().length === 0) {
    app = initializeApp({
        credential: cert(serviceAccount),
    });
} else {
    app = getApps()[0];
}

const db = getFirestore(app);
const auth = getAuth(app);

export { db, auth };
export default db;
