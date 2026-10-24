# Arquitectura de la aplicación móvil

La app está organizada por funcionalidades (feature-first) con separación ligera entre rutas, pantallas y acceso a la API. Es un monolito modular del lado móvil: las funcionalidades comparten el mismo proyecto y proceso, pero cada módulo agrupa sus pantallas y operaciones.

```text
src/
  app/                         Rutas Expo Router; adaptadores delgados
  features/
    inicio/screens/             Pantalla principal
    mascotas/screens/           Lista, formulario y detalle
    mascotas/services/          Operaciones HTTP de mascotas, historial y vacunas
    citas/screens/              Lista, reserva y detalle
    citas/services/             Operaciones HTTP de citas
  lib/api-client.ts             Cliente HTTP y token de Firebase
  config/                       Configuración de Firebase y URL de API
  components/                   Componentes visuales compartidos
  constants/                    Tema y valores compartidos
  hooks/                        Hooks reutilizables
```

## Responsabilidades

- `app/` conserva nombres de rutas y delega la pantalla al módulo correspondiente; los enlaces existentes siguen funcionando.
- `features/*/screens/` maneja interfaz, estado local y navegación de cada flujo.
- `features/*/services/` concentra los endpoints del backend por dominio.
- `lib/api-client.ts` agrega el token actual de Firebase cuando una solicitud aún no trae encabezado `Authorization`.
- El backend continúa siendo responsable de validar reglas de negocio y persistir datos.

## Patrón aplicado

Se aplica **arquitectura modular por funcionalidades (feature-first)** y una **separación ligera por capas**: rutas → pantallas → servicios → cliente HTTP → backend. Los componentes funcionales y hooks de React siguen siendo el patrón de implementación de la UI.

No es una implementación estricta de MVC, MVVM ni Clean Architecture. Se eligió una estructura proporcional al tamaño del cliente móvil, manteniendo una ruta clara para extraer lógica de estado a hooks o casos de uso si crece.
