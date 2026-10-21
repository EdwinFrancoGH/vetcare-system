# VetCare — versión integrada (citas/historial + login + ventas)

Este paquete es el resultado de fusionar a mano tus dos ramas:

- **Base (versión estable):** `vetcare-citas-y-ficha-historial...zip` → módulos de
  Mascotas, Historial Clínico, Vacunas, Citas y Horarios.
- **Integrado desde `src b.zip` / `src f.zip`:** Login/registro (Firebase Auth),
  Clientes, Productos, Inventario, Ventas, Reportes y Usuarios.

No fue un merge automático de Git: se reconstruyó archivo por archivo porque,
como vimos, las dos ramas habían reescrito los mismos archivos troncales
(`app.js`, `config/firebase.js`, el layout raíz, `Navbar`/`Sidebar`, `services/api.js`)
con arquitecturas incompatibles.

## Estructura

```
merged/
├── backend/   (Express + Firebase Admin)
│   └── src/
│       ├── app.js              <- reconciliado: registra TODAS las rutas
│       ├── config/firebase.js  <- reconciliado: exporta { db, auth } y default db
│       ├── server.js
│       ├── middlewares/auth.middleware.js
│       ├── controllers|routes|services|validators/  (citas/historial + ventas/auth)
│       └── .env.example
└── frontend/  (Next.js App Router)
    └── src/
        ├── app/
        │   ├── layout.js        <- layout raíz: solo <html>/<body> + AuthProvider
        │   ├── page.js           <- "/" redirige a /dashboard
        │   ├── (auth)/           <- login, register, forgot-password, reset-password (sin menú)
        │   └── (app)/            <- todo lo demás, protegido y con Sidebar/Navbar
        │       ├── layout.jsx    <- ProtectedRoute + Sidebar + Navbar
        │       ├── dashboard, mascotas, historial, citas, vacunas   (ya existían, sin cambios)
        │       └── clientes, productos, inventario, ventas, reportes, usuarios, profile  (integrados)
        ├── context/AuthContext.jsx
        ├── lib/firebase.js       (config del cliente Firebase)
        ├── components/auth/ProtectedRoute.jsx
        └── services/api.js       <- reconciliado: URL única + adjunta el token de Firebase
```

## Qué se resolvió del conflicto original

1. **`config/firebase.js`** ahora exporta `{ db, auth }` (con nombre) y `db` (default),
   y restaura el `getApps().length === 0` para no inicializar Firebase dos veces.
   Antes, la versión de la rama citas/historial había eliminado `auth`, lo que
   habría roto el login en cuanto se integrara.
2. **`app.js`** registra las cinco rutas de citas/historial **y** las siete de
   auth/ventas/clientes/usuarios. Como ahora sí existe login real, se protegieron
   con `verifyToken` las rutas que antes quedaban abiertas (mascotas, historiales,
   vacunas, citas, horarios, productos, inventario, ventas, reportes).
3. **`services/api.js`** del frontend es uno solo (antes había dos, apuntando a
   puertos distintos) y ahora sí adjunta el token de Firebase (`Authorization: Bearer …`)
   en cada petición vía un interceptor de axios — antes NINGUNA versión lo hacía,
   así que en cuanto una ruta exigía `verifyToken` el frontend recibía 401 sin
   remedio.
4. Se eliminó la duplicación **`layout.js` + `layout.jsx`** y **`page.js` + `page.jsx`**
   en la carpeta `app/` (Next.js no permite dos archivos de ruta para el mismo
   segmento). Ahora el layout raíz (`app/layout.js`) solo monta `AuthProvider`,
   y el menú (`Sidebar`/`Navbar`) vive en `app/(app)/layout.jsx`, protegido por
   `ProtectedRoute`. Las páginas de login/registro quedan en `app/(auth)/` sin
   ese menú.
5. **Ningún import usa el alias `@/`** (que dependía de un `jsconfig.json` que no
   venía en ninguno de los dos zips); todo quedó en rutas relativas explícitas,
   y de todas formas se incluyó un `jsconfig.json` como respaldo.
6. Se normalizaron **todos los saltos de línea a LF** (`.gitattributes` incluido)
   para que un futuro `git diff`/merge no vuelva a mostrar cada línea como
   "cambiada" solo por CRLF vs LF.
7. Se agregaron `services/clientes.service.js` y `services/users.service.js`
   nuevos, y se reescribieron `clientes/page.jsx`, `usuarios/page.jsx` y
   `profile/page.jsx` para usarlos (antes llamaban con `fetch()` a una URL
   fija `http://localhost:5000`, sin variable de entorno).

## Verificación que sí se hizo

- Los 112 archivos `.js`/`.jsx` del backend y del frontend pasaron un chequeo
  de sintaxis (parser de esbuild, incluyendo JSX) sin errores.
- Se verificó, archivo por archivo, que **todos los imports relativos**
  (`../../...`) resuelven a un archivo real dentro del proyecto — no quedó
  ninguna ruta rota por el cambio de profundidad de carpetas al introducir
  los grupos de rutas `(auth)` y `(app)`.
- Se verificó que cada endpoint que llaman los `services/*.service.js` del
  frontend (`/mascotas`, `/historiales`, `/vacunas`, `/citas`, `/horarios`,
  `/productos`, `/inventario`, `/ventas`, `/reportes`, `/clientes`, `/users`)
  tiene su contraparte montada en `backend/src/app.js`.

Lo que **no** se pudo verificar aquí (requiere tu entorno): no se corrió
`npm install` ni `next build` real, porque no había `package.json` en los
zips originales ni credenciales de Firebase. Antes de darlo por bueno,
corre los pasos de abajo.

## Pasos para levantarlo

**Backend**
```bash
cd backend
npm install
cp .env.example .env
# coloca tu credencial real en backend/credentials/firebase-key.json
npm run dev
```

**Frontend**
```bash
cd frontend
npm install
cp .env.local.example .env.local
npm run dev
```

`frontend/src/lib/firebase.js` trae el config del proyecto `vetcare-35909`
tal como estaba en tu rama de login — revisa que siga siendo el proyecto de
Firebase correcto antes de usarlo en producción.

## Pendientes que quedan a tu criterio (no bloquean que funcione)

- **Diseño no unificado del todo:** Dashboard/Mascotas/Historial/Citas/Vacunas
  usan el tema azul con `react-icons` (tu versión "estable"); Clientes,
  Productos, Inventario, Ventas, Reportes y Usuarios usan el tema
  índigo/zinc con `lucide-react` (tu versión de ventas). Ambos funcionan y
  están conectados al mismo backend, pero visualmente no son iguales todavía.
  Unificarlos es trabajo de diseño, no de "arreglar el merge", así que se
  dejó para que lo definas tú.
- La página de registro (`app/(auth)/register/page.jsx`) referencia una
  imagen decorativa `/images/pets.jpg` que no venía en ningún zip. No rompe
  el build, pero no se va a ver: agrega esa imagen en `frontend/public/images/`
  o quita ese bloque `<Image .../>`.
- El registro de nuevas cuentas (`/register`) crea el usuario en Firebase Auth
  desde el cliente; confirma que ese es el flujo que quieres (vs. que solo un
  Administrador cree usuarios desde `/usuarios`, que también existe).
