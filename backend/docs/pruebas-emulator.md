# PreparaciÃ³n de Firebase Emulator para VetCare

## Estado comprobado

El repositorio no contiene `firebase.json`, `.firebaserc`, `firestore.rules` ni
`firestore.indexes.json`. No se encontraron `firebase-tools` ni
`@firebase/rules-unit-testing` en las dependencias instaladas del proyecto y el
comando `firebase` no estÃ¡ disponible. El backend sÃ­ tiene `firebase-admin`, y
Express estÃ¡ disponible para pruebas de rutas. Por tanto, Emulator Suite no estÃ¡
configurado y no se ejecutaron pruebas de emulador.

La aplicaciÃ³n usa Firebase Admin SDK en el backend. Admin SDK omite Firestore
Security Rules; sus endpoints deben probarse contra Auth/Firestore Emulator y
sus middlewares de autenticaciÃ³n/rol. No hay actualmente un archivo de reglas
que permita probar reglas Firestore. La exportaciÃ³n `getFirestore()` de Web no
se usa para lecturas/escrituras en `frontend/src` ni `mobile/src`.

## ConfiguraciÃ³n mÃ­nima propuesta

En un entorno local aislado, preparar `firebase.json` con Auth y Firestore en
puertos locales, proyecto `demo-vetcare`, y reglas explÃ­citas si se decide
probar acceso directo desde clientes:

```json
{
  "emulators": {
    "auth": { "port": 9099 },
    "firestore": { "port": 8080 },
    "ui": { "enabled": false },
    "singleProjectMode": true
  }
}
```

No se debe reutilizar un `firebase-key.json` de producciÃ³n. Antes de levantar el
backend contra el emulador, su inicializaciÃ³n Admin debe permitir explÃ­citamente
modo emulator por variables de entorno y llamar `initializeApp({ projectId:
"demo-vetcare" })` sin credenciales de producciÃ³n. Solo entonces exportar:

```powershell
$env:GCLOUD_PROJECT = "demo-vetcare"
$env:FIRESTORE_EMULATOR_HOST = "127.0.0.1:8080"
$env:FIREBASE_AUTH_EMULATOR_HOST = "127.0.0.1:9099"
```

En el entorno de desarrollo donde se autorice instalar las herramientas, usar
Firebase CLI y levantar solo emuladores locales:

```sh
firebase emulators:start --only auth,firestore --project demo-vetcare
```

Después, crear usuarios y perfiles de prueba (Administrador, Veterinario,
Recepcionista y Cliente) exclusivamente en los emuladores; ejecutar el backend
con las tres variables anteriores y enviar solicitudes HTTP con tokens de Auth
Emulator. Verificar respuestas 403 de Recepcionista en cada método de
`/api/historiales` y `/api/vacunas`, aislamiento cliente/mascota, reintentos
concurrentes, inventario, recuperación después de borrar el documento auxiliar y
payloads diferentes. Para probar Firestore Security Rules se necesitará además
definir `firestore.rules` de mínimo privilegio y agregar `@firebase/rules-unit-testing`;
esas pruebas son distintas de las rutas Admin SDK.

No se instalaron herramientas, no se crearon archivos de configuración de
Firebase y no se usaron credenciales o datos reales durante esta tarea.
