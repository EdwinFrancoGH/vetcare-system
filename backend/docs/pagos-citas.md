# Pagos reportados de citas veterinarias

## Métodos admitidos

El endpoint acepta únicamente `Efectivo`, `Tarjeta` y `Transferencia`. Son los valores que ya aparecen en los selectores de ventas y en el flujo de entrega de pedidos; no se agregan métodos nuevos. Esta etapa registra el método y la declaración del cliente, pero no confirma que se haya recibido dinero.

## Identidad, importe e historial

El documento principal usa `pagos/{citaId}`, por lo que hay como máximo un registro principal por cita sin depender de documentos TTL. El cliente solo aporta método y referencia. UID, rol, servicio, importe y moneda provienen de la sesión y de los datos congelados de la cita. Citas antiguas sin tarifa válida requieren que personal autorizado asigne servicio y precio antes de aceptar un reporte; no se consulta la tarifa actual del catálogo.

Cada intento genera un evento nuevo en `pagos/{citaId}/eventos`. Un pago rechazado puede reportarse de nuevo; el documento principal representa el intento actual y los eventos conservan los anteriores. No existe endpoint de revisión, aprobación o rechazo en esta etapa.

## Cancelación de citas

La cancelación se bloquea cuando el pago está `reportado`, `en_revision` o `aprobado`. Los estados reportado y en revisión deben resolverse antes de cancelar. Un pago aprobado requiere gestionar una devolución manual antes de cancelar; el sistema no cambia ese pago ni hace devoluciones.

Un pago `rechazado` no bloquea la cancelación porque no existe una aprobación financiera. Completar una cita sigue siendo independiente del estado del pago. Tanto el reporte como la cancelación leen y escriben los documentos de cita/pago implicados en transacciones para resolver carreras de forma serializable.

## Rutas

- `POST /api/citas/:id/pago/reportar`: rol Cliente, propietario de la cita.
- `GET /api/citas/:id/pago`: propietario, Administrador o Recepcionista. Veterinario no recibe datos financieros.

No hay ruta de eliminación de pagos ni de revisión administrativa en esta etapa.
