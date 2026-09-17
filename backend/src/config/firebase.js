/*import admin from "firebase-admin";
import serviceAccount from "../../credentials/firebase-key.json" with { type: "json" };//ACCESO A LA CREDENCIAL DE FIREBASE

console.log(admin);
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

export default db;*/

import { initializeApp, cert } from "firebase-admin/app";//import admin from "firebase-admin";
import { getFirestore } from "firebase-admin/firestore";

import serviceAccount from "../../credentials/firebase-key.json" with { type: "json" };

initializeApp({
    credential: cert(serviceAccount),
});

const db = getFirestore();

export default db;