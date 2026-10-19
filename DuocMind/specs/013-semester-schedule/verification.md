# Verificación 013 — Horario por semestre

Rama local: `feature/agenda-semestres`. Spec, plan y tareas aprobados el 2026-10-18.
Sin push, PR, despliegues ni cambios remotos. Solo datos sintéticos en pruebas.

## Registro

La implementación se verifica por tarea; los resultados se agregan después de
ejecutar las comprobaciones. Android y las verificaciones de integración no se
acreditan mediante pruebas simuladas.

### T001

Typecheck correcto; npm test: 211 pruebas aprobadas. La ejecución restringida impedía spawnSync (EPERM); la misma suite fuera de esa restricción pasó sin cambios en las pruebas existentes. Dominio cubre semestres, campos opcionales, aislamiento de referencias y fechas inválidas.

### T002

Typecheck y npm test correctos: 214 pruebas. Bloques con salas independientes, cruces confirmados, duplicados, vigencia y conversión de Santiago en invierno/verano verificados con reloj controlado.

### T003

Migración aplicada solo al backend local, sin registrar ni modificar historial remoto. tools/tests/planner-schedule.mjs pasó: restricciones, RLS de dos cuentas, acceso anónimo/directo denegado, salas diferentes, primera escritura concurrente, CAS, recibos tras revisiones posteriores, rollback y cascada de Auth. Typecheck y 214 pruebas correctos.

### T004

Gateway puro probado con transporte inyectado: payload exclusivo de horario, recibos y respuestas validados, claves desconocidas rechazadas y errores de migración sin filtrar detalles. Typecheck y 216 pruebas correctos.

### T005

Almacén serializado validado con fallos de persistencia y datos corruptos; mantiene el estado anterior ante errores y rechaza operaciones tras cierre. Typecheck y 217 pruebas correctos.

### T006

Typecheck y 220 pruebas correctos. SQLite real (node:sqlite) verifica atomicidad/rollback y reapertura; adaptador web prueba escritores concurrentes, aislamiento, cuota y corrupción; apertura cifrada inyectada rechaza ausencia de SQLCipher y clave incorrecta sin crear esquema. Cifrado y reapertura reales de Android siguen pendientes en T020.

### T007

Pruebas de dominio local verifican copia con nuevo UUID, traslado conservando identidad, fecha por defecto/edición explícita, rechazo atómico de selección obsoleta y recibos idempotentes. Typecheck y 222 pruebas correctos. Ninguna operación recibe un gateway remoto.

### T008

Recuperación separada de la carga normal; lectura heredada sin escrituras y hash SHA-256 de registros válidos. Pruebas verifican selección vacía, idempotencia, datos inválidos y origen inmutable. Typecheck y 223 pruebas correctos.

### T009

Sesión con generación y bloqueo; propietario offline validado desde sesión persistida y perfil previamente verificado. Transporte fija JWT de la cuenta capturada en cada RPC y rechaza otra cuenta. Lectura se repite si hubo evento Auth concurrente. Typecheck y 225 pruebas correctos.

### T010

Servicio probado ante timeout posterior al commit, edición durante envío, conflicto con semestres remotos y respuesta de sesión antigua. Typecheck y 229 pruebas correctos. Backend local vuelve a pasar con recuperación del documento por un segundo cliente independiente.

### T011

Proveedor compartido conectado al layout, hooks refrescan tras navegar y el ciclo de vida pausa polling en segundo plano. Prueba de polling valida conexión, actualización de reloj y cleanup idempotente. Typecheck y 230 pruebas correctos; proveedor anterior se conserva temporalmente hasta integrar la agenda en T015.

### T012

Typecheck y 230 pruebas correctos. Recorrido Chromium real con cuenta sintética temporal: dos semestres, primer activo, activación explícita del segundo, ramo manual sin sigla/sección y recuperación tras recarga; sin errores de ejecución. Captura revisada en tools/.local/planner/semesters.png. El backend y la cuenta de prueba son locales.

### T013

Typecheck y 230 pruebas correctos. Chromium con cuenta temporal creó lunes 08:30–10:00 en Sala 301 y miércoles 11:00–12:30 en Laboratorio 402; ambas salas persistieron tras recarga. Editar el lunes a Sala 302 conservó Laboratorio 402. Captura blocks.png. Duplicados se validan antes de ofrecer confirmación de cruce.

### T014

Typecheck y 230 pruebas correctos. Chromium real creó una prueba general, la copió a Semestre 1 con nuevo UUID y la movió a Semestre 2 conservando identidad y fecha. Recuperó una actividad heredada solo tras advertencia/selección, conservó origen y datos tras recarga. Captura activities.png. Peticiones de horario inspeccionadas sin títulos de actividades. La ruta Pendientes ahora usa esta gestión real en lugar de Muy pronto.

### T015

Typecheck y 231 pruebas correctos, incluida composición de clase/actividad/evento con intervalo real. Chromium verificó agenda de lunes con Sala 302, evento institucional y actividad creada en el día; miércoles conserva Laboratorio 402. Activar un semestre vacío retira clases y conserva actividad/evento. Proveedor global retirado; captura agenda.png.

### T016

Typecheck y 233 pruebas correctos: límites de clase, salas, cruces simultáneos y pendientes reales. Se retiró dashboardSample y la sugerencia fija de prueba de mañana. Chromium verifica el inicio con horario real/vacío y actividades locales, sin nombres de muestra; regresiones de tutorial, perfil y emociones siguen en la suite. Captura dashboard.png.

### T017

Typecheck y 237 pruebas correctos. Cierre espera operaciones y conserva datos; destrucción y respuesta tardía no recrean el almacén. Bloqueo persistente de eliminación es idempotente y no invalida otra cuenta. Chromium comprobó salir de A, entrar a B sin actividades de A y volver a A conservando cuatro actividades. Backend local verifica cascada al borrar Auth. Prueba nativa y recorrido real de delete-account siguen en T020.

### T018

Regresión completa local aprobada: DOCKER_CONTEXT=default npm --prefix tools run test:backend, incluidos permisos, RLS, concurrencia, recibos, eventos y API administrativa. La primera ejecución detectó funciones locales ausentes (503); tras iniciar local:serve y comprobar local:ready pasó sin modificar expectativas. planner-migration ensaya instalación/reversión en una base temporal propia y la elimina al finalizar. CLI db advisors --local --level warn --fail-on error: sin hallazgos. Solo el historial local nuevo 20261018175733 se registró como aplicado; las discrepancias preexistentes del historial antiguo se conservaron. Typecheck y 237 pruebas aprobadas. No se aplicó la migración remota.

### T019

Validación final local aprobada: npm run typecheck y npm test (237); node --test tools/tests/*.test.mjs (7); Deno check de admin-api y recovery_test (1); administración typecheck, 9 pruebas, build y 33 recorridos Playwright. La primera ejecución administrativa usó una fixture revocada y un puerto distinto del origen configurado; se detuvo y se repitió con la fixture habilitada y 5173, sin cambiar el código ni relajar expectativas. Build conserva advertencias de tamaño de chunk y directivas de react-router. npm --prefix tools run test:planner pasó con cuentas temporales: dos clientes, salas independientes, duplicados/intervalos/cruces, recarga con backend cortado, conflicto comparado y resuelto, aislamiento de actividades y confirmación obsoleta rechazada. Se revisaron capturas a 390 px y a 320 px con texto al 150%, superficies de al menos 44 px, etiquetas y estado accesible de selección; se corrigieron botones anidados en tarjetas de eventos y el ancho mínimo de días de agenda. La regresión test:student-events pasó completa, incluida retirada offline con token vencido, intervalos, reprogramación y cambio de cuenta; sus selectores se actualizaron a las etiquetas actuales y a la recuperación heredada explícita, conservando comprobaciones. README, configuración y contratos actualizados. git diff --check correcto. Android no acreditado con estas pruebas.

### Ajuste T019 — Alta visible de clases desde Agenda (2026-10-18)

Solicitud: descubrir cómo registrar el horario al entrar en Agenda. La tarjeta
«Tu horario de clases» ofrece «Crear mi horario» o «Agregar clases»; un único
formulario registra semestre inicial, ramo nuevo/existente y varios bloques con
salas independientes. «Editar horario» queda como acceso secundario y las
actividades se enlazan desde el día. Guardado y errores permanecen visibles al pie;
los cruces tienen una revisión explícita antes de confirmar. La fecha de la agenda
pasa a la siguiente ocurrencia del primer bloque guardado, para mostrar el resultado.

Verificación del cambio: `npm run typecheck` correcto; `npm test`: 240 aprobadas.
Tres casos nuevos en `classRegistration.test.mjs` prueban creación completa,
conservación de bloques, cruces y rechazo sin mutaciones parciales.
`npm --prefix tools run test:planner` pasó completo: alta desde Agenda sin visitar
la gestión de semestres, dos salas, recarga, ramo existente, duplicados, cruces,
cancelación, error visible por nombre ausente y guardado fijo. También conserva
las comprobaciones de conflicto, desconexión y cambio de cuenta existentes.
`STUDENT_E2E_URL=http://localhost:8091 npm --prefix tools run test:student-events`
pasó completo con el nuevo enlace de actividades. No se repitió administración
ni el esquema, cuyos contratos no cambiaron.

Capturas revisadas: `agenda-empty-class-entry.png`, `agenda-class-entry.png`,
`class-entry-form.png` y `class-entry-320-enlarged.png` en `tools/.local/planner/`.
Objetivo visible sin scroll a 390 px; formulario a 320 px y texto al 150%, sin
ancho de página desbordado, controles de 44 px y guardado dentro del viewport.
Comprobación visual adicional en el navegador local de la cuenta de demostración.
`git diff --check` correcto. T019 vuelve a quedar verificada; T020 sigue abierta.
No se modificaron cuentas/datos de demostración mediante este ajuste, ni el
backend remoto; no hubo commits, push ni PR.

### Ajuste T019 — Actividades, conservación e intervalos (2026-10-18)

Solicitud aprobada en spec/plan 0.1.2: retirar Organización del formulario;
pruebas/tareas nuevas usan el semestre activo y exigen ramo, personales generales
admiten ramo opcional. Editar conserva el contexto histórico y los traslados
explícitos. Alternar el horario activo no cambia actividades, fechas ni ramos.
El formulario permite inicio/término del mismo día, y agenda, pendientes e inicio
usan ese intervalo. Los registros sin `endTime` conservan una hora y no se
reescriben al leerlos. No hay cambios del esquema ni del contrato remoto.

Verificación: `npm run typecheck` y `npm test`: **252 aprobadas**. Casos nuevos
cubren tipos, ramo opcional/obligatorio, edición histórica, cambio de activo con
formulario abierto, alternancia con sincronización conservando actividades,
intervalos inválidos, reapertura, copia/traslado y límites exactos del estado.
La primera ejecución detectó que el parser exigía el campo nuevo a datos antiguos;
se corrigió aceptándolo solo como opcional, con prueba de compatibilidad incluso
para registros históricos que cruzan medianoche.

`npm --prefix tools run test:planner` y
`STUDENT_E2E_URL=http://localhost:8091 npm --prefix tools run test:student-events`
finalizaron con código 0. El recorrido crea una personal 14:15–16:45 con ramo,
rechaza término igual al inicio, recarga y edita el término a 17:00, y comprueba
el intervalo en la copia de una prueba. Alterna el horario de ida y vuelta,
recarga y compara las actividades completas; conserva también pruebas de conflicto,
desconexión, segundo cliente, aislamiento y recuperación heredada. Un selector
de error se acotó al formulario para distinguirlo del aviso de pantalla; se
corrigió su aplicación a la comprobación anterior de bloques sin alterar expectativas.
No se repitieron administración/backend: sus contratos no cambiaron.

Capturas revisadas en `tools/.local/planner/`: `activity-duration-local.png`,
`personal-activity-optional-subject.png` y `academic-activity-active-semester.png`.
El navegador de demostración queda con el formulario abierto, sin guardar datos.
`git diff --check` correcto. T019 verificada; T020 permanece abierta, sin acreditar
Android con la previsualización. Cambios solo locales, sin commits, push ni PR.

## T020 — Pendiente de entorno Android

No hay `adb` ni `emulator` accesibles en este entorno, ni se dispone de un build
Android instalado y verificable. No se ejecutó el recorrido nativo y T020 permanece
abierta. La spec no está cerrada. SQLite de Node y Chromium no acreditan SQLCipher,
SecureStore, reinicio ni funcionamiento sin conexión en Android.

Para completar la tarea en un entorno con Android SDK y dispositivo de pruebas:

1. Generar e instalar un development build con el plugin SQLCipher configurado
   (`npx expo run:android` desde `DuocMind/`), usando backend y cuentas sintéticas
   accesibles desde ese dispositivo. Registrar dispositivo, versión y build.
2. Crear dos semestres y un ramo con lunes en sala 301 y miércoles en laboratorio
   402. Editar una sala, reiniciar y comprobar que ambas se conservan independientes.
3. Cortar la red, editar, cerrar/reabrir, verificar los cambios pendientes y
   reconectar. Confirmar recuperación sin duplicados en un segundo cliente.
4. Provocar cambios concurrentes, comparar ambas versiones y resolver el conflicto.
   Copiar/mover actividades con fechas conservadas y con una edición explícita.
5. Cambiar de cuenta, volver a la primera y eliminar una cuenta sintética con
   operaciones pendientes. Comprobar limpieza de base/clave y cascada remota;
   ensayar también apertura con clave correcta/incorrecta sin reemplazar la copia.

## Estado de entrega local

T001–T019 verificadas, incluidos los formularios por tipo e intervalos configurables; T020 pendiente. Rama `feature/agenda-semestres`. El 2026-10-19 el usuario autorizó commit,
push de esta rama y PR hacia `dev`; la validación Android pendiente se informa
en la entrega y no se considera completada por abrir el PR. La migración nueva solo se aplicó a Supabase local. No se ejecutaron
migraciones, despliegues ni cambios de configuración cloud.
