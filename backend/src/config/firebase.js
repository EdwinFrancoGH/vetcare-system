/*import admin from "firebase-admin";
import serviceAccount from "../../credentials/firebase-key.json" with { type: "json" };//ACCESO A LA CREDENCIAL DE FIREBASE

console.log(admin);
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

export default db;*/

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