# VetCare — versión integrada (citas/historial + login + ventas)

Este proyecto integra los módulos de gestión veterinaria, autenticación y administración. Incluye una aplicación web, un backend API y una aplicación móvil.

- **Base (versión estable):** módulos de Mascotas, Historial Clínico, Vacunas, Citas y Horarios.
- **Módulos integrados:** Login/registro con Firebase Authentication, Clientes, Productos, Inventario, Ventas, Reportes y Usuarios.
- **Aplicación móvil:** desarrollada con React Native y Expo, conectada al backend.

La integración del backend y frontend se realizó reconciliando los archivos que tenían arquitecturas incompatibles, incluyendo `app.js`, `config/firebase.js`, los layouts y `services/api.js`.

## Estructura

```text
vetcare-system/
├── backend/   (Express + Firebase Admin)
│   └── src/
│       ├── app.js
│       ├── config/firebase.js
│       ├── server.js
│       ├── middlewares/
│       ├── controllers/
│       ├── routes/
│       ├── services/
│       └── validators/
├── frontend/  (Next.js App Router)
│   └── src/
│       ├── app/
│       ├── context/
│       ├── lib/
│       ├── components/
│       └── services/
├── mobile/    (React Native + Expo)
│   └── src/
│       ├── app/
│       └── config/
└── README.md
```

## Qué se resolvió en la integración

1. `config/firebase.js` exporta los servicios de Firebase Admin necesarios para acceder a Firestore y verificar la autenticación.
2. `app.js` registra las rutas de los módulos clínicos, autenticación y administración.
3. El frontend utiliza un servicio API que adjunta el token de Firebase en las peticiones protegidas.
4. Se organizaron los layouts y las rutas de autenticación y aplicación para evitar duplicaciones en Next.js.
5. Se agregaron servicios para clientes y usuarios y se ajustaron páginas administrativas.
6. Se mantuvo una estructura compartida de backend para que el frontend web y la aplicación móvil consuman la misma API.

## Verificación

- Se realizó una comprobación de sintaxis de los archivos JavaScript y JSX durante la integración inicial.
- Se revisaron los imports relativos y la correspondencia de los endpoints del frontend con las rutas del backend.
- Se comprobó localmente que el backend inicia y responde en el endpoint raíz.
- Se verificaron desde el emulador Android el login móvil, la consulta y registro de mascotas, los historiales médicos, las vacunas y el flujo de citas.

Las pruebas deben repetirse en el entorno de cada integrante después de configurar las dependencias, variables de entorno y credenciales autorizadas.

## Pasos para levantar el proyecto

### Backend

```bash
cd backend
npm install
```

Configura el archivo `.env` con las variables requeridas por el backend. Si existe `backend/.env.example`, úsalo como referencia.

Configura las credenciales de Firebase Admin siguiendo el procedimiento autorizado del equipo. No publiques claves privadas ni archivos de credenciales.

Inicia el servidor:

```bash
npm run dev
```

El backend utiliza el puerto `5000` por defecto, salvo que la configuración indique otro.

Para comprobar que responde, abre otra terminal y ejecuta:

```bash
curl http://localhost:5000/
```

La respuesta esperada es similar a:

```json
{
  "mensaje": "VetCare API funcionando"
}
```

### Frontend

```bash
cd frontend
npm install
```

Configura las variables de entorno en `.env.local`, utilizando `frontend/.env.local.example` si está disponible.

Inicia la aplicación web:

```bash
npm run dev
```

La aplicación normalmente estará disponible en `http://localhost:3000`.

Revisa la configuración de Firebase en `frontend/src/lib/firebase.js` y confirma que corresponda al proyecto autorizado.

### Mobile (React Native + Expo)

La aplicación móvil permite iniciar sesión, consultar y registrar mascotas, revisar historiales clínicos y vacunas, y gestionar citas.

Instala las dependencias:

```bash
cd mobile
npm install
```

Configura las variables de Firebase en `mobile/.env`. Confirma los nombres exactos de las variables con los archivos de configuración del proyecto. No subas este archivo a GitHub.

Revisa la URL del backend en:

```text
mobile/src/config/api.js
```

Para utilizar el emulador Android de Android Studio, la URL debe apuntar al equipo anfitrión:

```javascript
export const API_URL = 'http://10.0.2.2:5000';
```

Inicia Expo:

```bash
npx expo start
```

Mantén el backend en ejecución mientras utilizas la aplicación móvil.

## Ejecución en Android Studio

La aplicación móvil se probó utilizando el emulador **Google Pixel 8** de Android Studio. Esto se refiere al dispositivo virtual, no a una prueba en un teléfono físico.

1. Abre Android Studio.
2. Accede a `Tools > Device Manager`.
3. Inicia el emulador virtual Google Pixel 8.
4. Inicia el backend en una terminal y confirma que escucha en el puerto `5000`.
5. Abre otra terminal, entra en `mobile` y ejecuta `npx expo start`.
6. Presiona `a` en la terminal de Expo para abrir la aplicación en el emulador.

La dirección `10.0.2.2` permite que el emulador Android se comunique con el backend que se ejecuta en la computadora anfitriona.

Si se utiliza un dispositivo Android físico, configura la dirección IP local de la computadora que ejecuta el backend y asegúrate de que ambos dispositivos tengan conectividad de red.

## Pendientes conocidos

- El diseño visual de algunos módulos web todavía utiliza estilos diferentes.
- La pantalla de registro hace referencia a la imagen decorativa `/images/pets.jpg`; confirma que exista en `frontend/public/images/` o ajusta la página.
- El flujo de registro de cuentas debe mantenerse alineado con las reglas de creación de usuarios y roles del equipo.

## Seguridad

- No subir archivos `.env`, `.env.local` ni claves privadas de Firebase.
- No publicar `backend/credentials/firebase-key.json`.
- No compartir contraseñas ni credenciales personales.
- Mantener correctamente configuradas las reglas de acceso de Firestore y los permisos del backend.
- No utilizar reglas de Firestore en modo de prueba para producción.

## Flujo de trabajo con Git

Actualizar la rama principal:

```bash
git switch main
git pull origin main
```

Crear una rama para los cambios propios:

```bash
git switch -c feature/nombre-de-la-funcionalidad
```

Publicar la rama:

```bash
git push -u origin feature/nombre-de-la-funcionalidad
```

Después, abrir un Pull Request hacia la rama de integración acordada por el equipo. Evitar subir cambios directamente a `main` sin revisión.

## Repositorio

https://github.com/EdwinFrancoGH/vetcare-system

La rama `main` contiene los cambios integrados mediante el Pull Request #10.

---

**VetCare — Centro Veterinario La Mascota**

Proyecto académico de desarrollo de software multiplataforma.
