# Retención de claves de idempotencia

Los documentos auxiliares de `idempotencia` se conservan durante 90 días desde la creación de la operación. Cada pedido o venta guarda `idempotencyId` (hash del actor, ámbito y clave) y `idempotencyPayloadHash` en el recurso de negocio. Si el documento TTL ya no existe, la transacción localiza el recurso por `idempotencyId`, compara la huella y devuelve el original. Los metadatos durables permanecen mientras exista el pedido o la venta.

Cada transacción que crea un pedido o venta guarda `expiresAt` como timestamp. La política TTL debe configurarse una vez para el grupo `idempotencia` en cada proyecto/base de datos:

```sh
gcloud firestore fields ttls update expiresAt --collection-group=idempotencia --enable-ttl --database='(default)' --project=PROJECT_ID
```

TTL no es inmediato (la eliminación puede tardar hasta 24 horas). Solo elimina el auxiliar, no el recurso ni sus huellas durables. No se activó ni se consultó TTL en Firebase durante esta tarea.

La clave y huella pendientes se guardan localmente. Mobile también persiste por UID el carrito con datos públicos del catálogo, cantidades y tipo de pedido para permitir recuperación tras reiniciar. No se guardan contraseñas, tokens, correo ni nombre del cliente en estos registros.

## Registros históricos antes de TTL

Los documentos antiguos sin `expiresAt` no participan en TTL y pueden acumularse indefinidamente. Un `createdAt` guardado como texto tampoco sirve como campo TTL hasta convertirlo en timestamp. No asignes expiración antes de confirmar que el recurso enlazado conserva hashes durables.

Antes de activar TTL, inventaría en modo de solo lectura los documentos de `idempotencia` y clasifícalos:

- Sin `expiresAt`, o con valor que no sea timestamp: requiere revisión y posible migración.
- Sin `payloadHash`, `resourceType` o `resourceId`: falta información para una recuperación segura; deja el documento sin TTL y concílialo manualmente.
- Recurso indicado por `resourceType/resourceId` inexistente: déjalo sin TTL; el auxiliar podría ser el único registro del resultado.
- Recurso existente sin `idempotencyId` o `idempotencyPayloadHash`: escribe y verifica primero `idempotencyId` (ID del auxiliar) y `idempotencyPayloadHash` (el `payloadHash`).
- Huellas diferentes entre recurso y auxiliar: no sobrescribas; investiga y deja el documento sin TTL.

Para registros verificables, valida el recurso enlazado, escribe y verifica sus dos huellas durables, convierte `createdAt` a timestamp si es necesario y fija `expiresAt` a `createdAt + 90 días`. Ensaya primero en una copia aislada y procesa en lotes reanudables. No borres claves ni asignes expiración a registros ambiguos.

Antes de TTL, prueba en una copia aislada: crea una compra/venta, verifica sus campos durables, elimina solo el auxiliar y repite la misma clave y payload. Debe devolver el mismo ID sin cambiar inventario. Repite con otro payload: debe responder HTTP 409 sin otro descuento. Los registros históricos sin huellas durables necesitan conciliación individual; el fallback no puede reconstruir una huella que nunca se guardó.

Activa la política por proyecto y base de datos, confirmando el proyecto activo antes de aplicarla:

```sh
gcloud config set project PROJECT_ID
gcloud firestore fields ttls list --collection-group=idempotencia --database='(default)' --project=PROJECT_ID
gcloud firestore fields ttls update expiresAt --collection-group=idempotencia --enable-ttl --database='(default)' --project=PROJECT_ID
```

No ejecutes la activación hasta completar el inventario/migración y verificar que los documentos pendientes de conciliación no tengan un `expiresAt` válido.
