# Spec 017 — Horario y semestres solo en el dispositivo

| Campo | Valor |
| --- | --- |
| Versión | 0.3.0 |
| Estado | APROBADA |
| Fecha | 2026-11-06 |
| Constitución | 2.0.0 |
| Plataformas | Android y previsualización web |
| Rama | `feature/horario-local` |
| Base | `origin/dev`, commit `d45c3429b5bacdb3a246c2cfbb2329cfba94b19c`, actualizado el 2026-11-06 |
| Aprobación | Confirmada explícitamente por el usuario el 2026-11-06: «adelante, apruebo». Las versiones 0.2.0 y 0.3.0 recogen sus aclaraciones posteriores del mismo día sobre versiones anteriores y datos corruptos. |
| Sustituye | Spec 013: RF-006 completo y las partes de RF-001.3, §4 y CA-007/CA-008 que exigen sincronizar el horario |

## 1. Problema y resultado esperado

La spec 013 guarda semestres, ramos y bloques en Supabase y mantiene una copia en
el dispositivo. Esa sincronización agrega cuatro tablas, un esquema privado, dos
RPC, revisiones, recibos y resolución de conflictos para un dato que solo usa la
propia persona. La solicitud del 2026-11-06 es quitar el horario de la base de
datos y conservar semestre y horario en el dispositivo, igual que las actividades.

El resultado esperado es que la agenda funcione como hoy, pero sin ninguna llamada
remota de horario. La aplicación ya guarda el horario primero en local, por lo que
el incremento retira la capa remota y no crea un almacenamiento nuevo.

## 2. Alcance

- Dejar de leer y escribir el horario en Supabase desde la aplicación.
- Retirar de la interfaz los estados de sincronización y la resolución de conflictos.
- Eliminar del esquema las tablas, RPC y el esquema privado del horario mediante
  una migración nueva.
- Mantener la detección de cuentas eliminadas, que hoy depende de la lectura remota.
- Actualizar pruebas y documentación que describen el contrato retirado.

Fuera de alcance: convertir o conservar datos de versiones anteriores de la
aplicación; importar a los dispositivos el horario guardado en Supabase;
respaldo o exportación del horario; traspaso entre dispositivos; eliminar semestres
completos (sigue vigente RF-001.7 de la spec 013); cambios en actividades, eventos
institucionales, formularios, validaciones de horario o cifrado local.

## 3. Requisitos funcionales

### RF-001 — Horario local

1. Crear, editar y activar semestres, ramos y bloques funciona igual que en la
   spec 013, con o sin conexión, y se confirma al persistir en el dispositivo.
2. La aplicación no realiza ninguna solicitud de red para leer o guardar el horario.
3. El semestre activo se guarda solo en el dispositivo. Dos dispositivos de la
   misma cuenta tienen horarios independientes.
4. Las reglas de dominio de la spec 013 no cambian: validaciones, límites,
   solapamientos, duplicados y proyección en agenda e inicio.
5. El aislamiento por cuenta y el cifrado local no cambian: cada cuenta usa su
   propio almacén y otra cuenta no puede abrirlo.

### RF-002 — Datos locales ilegibles

1. La aplicación sigue en desarrollo y no hay versiones anteriores que mantener. No
   se convierten almacenes con el formato anterior.
2. Si el contenido guardado está corrupto o tiene un formato que no se reconoce, la
   aplicación lo limpia sola y continúa con un almacén vacío, sin diálogo ni aviso.
   La limpieza incluye horario, actividades, recibos e importaciones de esa cuenta.
3. La limpieza solo ocurre ante contenido ilegible. Un formulario inválido, una cuota
   llena, un fallo de lectura o escritura del almacenamiento y un fallo de cifrado o
   de clave no borran datos, porque pueden ser pasajeros.

### RF-003 — Interfaz

1. Desaparecen los textos «Pendiente de sincronizar», «Horario sincronizado» y
   «Sincronizando horario…», y el flujo «Revisa ambas versiones».
2. La agenda muestra un aviso fijo y breve: «Esto se guarda en este dispositivo».
3. Los errores de guardado local se siguen mostrando con una acción para reintentar.

### RF-004 — Cuentas eliminadas

1. Cuando el servidor confirma que la cuenta ya no existe, el dispositivo bloquea y
   borra su almacén local, como exige hoy el plan 013 §8.
2. Esa comprobación usa Supabase Auth y deja de depender de `load_personal_schedule`.
3. Un fallo de red no se interpreta como cuenta eliminada ni borra datos.

### RF-005 — Retiro del esquema remoto

1. Una migración nueva elimina `schedule_block`, `schedule_subject`,
   `schedule_semester`, `personal_schedule`, las RPC `load_personal_schedule` y
   `save_personal_schedule`, y el esquema `schedule_private`. No se edita la
   migración `20261018175733_personal_semester_schedule.sql`.
2. Los datos remotos del horario se eliminan sin exportarlos. La migración se aplica
   y verifica primero en local. Ejecutarla en producción requiere una confirmación
   explícita en ese momento, por ser irreversible.
3. La eliminación no afecta tablas ajenas al horario. El ensayo de
   `tools/tests/planner-migration.mjs` ya comprueba ese orden y conserva `asignatura`.

## 4. Privacidad y riesgos

- El horario deja de salir del dispositivo, lo que reduce los datos personales
  almacenados en el servidor.
- Riesgo aceptado: perder el teléfono, reinstalar la aplicación o borrar sus datos
  pierde el horario. Es la misma condición que ya tienen las actividades.
- Riesgo aceptado: un error de programación que rechace datos válidos los borraría
  sin aviso. Se acepta mientras la aplicación siga en desarrollo.
- Estado de producción consultado el 2026-11-06, solo con conteos: 1 cuenta con
  horario de 8 usuarios de Auth, 1 semestre, 1 ramo, 2 bloques y 3 recibos. El
  usuario aceptó perderlos.

## 5. Criterios de aceptación

| ID | Resultado observable | Verificación prevista |
| --- | --- | --- |
| CA-001 | Crear y editar horario sin conexión o con conexión produce el mismo resultado y persiste tras reiniciar. | Pruebas de servicio y almacén; recorrido Android. |
| CA-002 | Ninguna operación de horario llama a Supabase. | Prueba de servicio sin gateway remoto y revisión de solicitudes en el recorrido web. |
| CA-003 | Un almacén corrupto o con el formato anterior se limpia solo y la agenda abre vacía, sin error. | Prueba de almacén en SQLite y web. |
| CA-004 | Un formulario inválido, una cuota llena, un fallo de almacenamiento o un fallo de clave no borran datos. | Prueba de almacén y de servicio. |
| CA-005 | La interfaz no muestra sincronización ni conflictos, e informa que el horario es local. | Búsqueda de textos y recorrido web. |
| CA-006 | Una cuenta eliminada limpia el dispositivo; un fallo de red no borra datos. | Pruebas de sesión con error `user_not_found` y error de red. |
| CA-007 | Una base nueva queda sin los objetos del horario y las demás tablas intactas. | `supabase db reset` local, consultas de catálogo y suite de backend. |
| CA-008 | Las validaciones aplicables del proyecto pasan. | `npm run typecheck`, `npm test`, `npm --prefix tools run test:backend`. |

## 6. Decisiones recogidas de la conversación

El 2026-11-06 el usuario confirmó:

1. **Datos de producción.** Se pueden borrar sin exportar. El horario y los semestres
   se guardan en el teléfono, porque no tiene sentido almacenarlos en la nube.
2. **Momento del retiro remoto.** No importa el orden entre publicar la aplicación y
   aplicar la migración.
3. **Aviso en la interfaz.** El texto es «Esto se guarda en este dispositivo».
4. **Versiones anteriores.** No importan, porque la aplicación sigue en desarrollo.
   Esto retira la conversión de datos locales que pedía la versión 0.1.1.
5. **Datos corruptos.** La aplicación los limpia sola, sin avisar. Sustituye la regla
   anterior de conservar el almacén ilegible e informar el error.

## 7. Aprobación y pasos posteriores

La spec fue aprobada el 2026-11-06. Conforme a `DuocMind/AGENTS.md`, el siguiente
paso es redactar y aprobar `plan.md`, después `tasks.md`, y recién entonces
implementar. Esta aprobación no autoriza aplicar migraciones remotas, commits ni push.
