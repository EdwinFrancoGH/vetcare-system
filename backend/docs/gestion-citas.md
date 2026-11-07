# Integridad y ciclo de vida de citas

## Reservas y reprogramaciones

La reserva y reprogramación leen el documento de horario semanal, la mascota, el bloque determinista de `citasBloqueos` y las citas activas del veterinario/fecha dentro de una transacción. Todas las lecturas se hacen antes de las escrituras. El documento de bloqueo, cuyo ID deriva de veterinario, fecha y hora, serializa solicitudes concurrentes al mismo inicio de bloque. La consulta transaccional también detecta citas históricas que todavía no tengan bloqueo y conflictos de intervalos.

El bloqueo se crea junto con la cita. Reprogramar crea el bloqueo nuevo, retira el anterior y modifica la cita en la misma transacción; si falla cualquier validación, se conserva el horario original. Cancelar o completar libera el bloqueo sin borrar la cita. Los bloqueos no tienen TTL: solo se eliminan transaccionalmente cuando la cita deja de ocupar el horario.

Las citas existentes anteriores a este mecanismo no necesitan una migración inmediata para evitar conflictos: se contrastan con las citas activas al reservar o reprogramar. Al reprogramarlas se crea su nuevo bloqueo. Antes de despliegue, revisar en una copia de datos que no haya citas activas solapadas por médico y fecha, especialmente registros antiguos con duración distinta o campos incompletos.

El endpoint `DELETE /api/citas/:id` se conserva por compatibilidad, pero ahora solicita cancelación lógica; no borra el documento. Las citas completadas no pueden cancelarse mediante ese endpoint.

## Estados vencidos

Los estados persistidos válidos son `reservada`, `confirmada`, `cancelada` y `completada`. La consulta de historial deriva `perdida` cuando una cita reservada ya pasó de fecha y deriva `confirmada` para una confirmada vencida. Esos valores de historial no se escriben en el documento de cita.

No hay un proceso automático que marque citas vencidas. Se mantiene el cálculo derivado para evitar una tarea programada que cambie datos sin revisión. Si el negocio necesita persistir `perdida`, la opción compatible es introducir una acción explícita de personal con transición auditada; una tarea automática sería una decisión posterior con reglas de zona horaria, tolerancia y recuperación definidas.

## Verificación

Las pruebas `backend/test/citas.test.js` usan una implementación simulada del almacenamiento y verifican transacciones, bloqueos, concurrencia serializada y permisos de ruta. No son pruebas de Firebase Emulator. La atomicidad y los reintentos optimistas de Firestore deben confirmarse con Emulator antes de producción; no se debe usar Firebase de producción para esa validación.
