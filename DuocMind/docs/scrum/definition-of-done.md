# Definition of Done — DuocMind

| Campo | Valor |
| --- | --- |
| Versión | 1.0.0 |
| Fecha | 2026-11-01 |
| Fuente | `docs/constitution.md` versión 2.0.0 (principios III, V y VI) y `DuocMind/AGENTS.md` |

> Esta definición de terminado no agrega reglas nuevas: ordena en una lista de verificación las puertas de cumplimiento de la constitución y las reglas de trabajo de `AGENTS.md`. La constitución prevalece si hubiera diferencias.

## Nivel 1 — Tarea (`tasks.md`)

Una tarea se marca `[x]` solo si cumple todo lo siguiente:

- [ ] El cambio está completo, no parcial ni bloqueado.
- [ ] Su **prueba específica** pasa (dominio, integración, interfaz o recorrido, según el riesgo).
- [ ] `npm run typecheck` pasa sin errores (TypeScript estricto).
- [ ] Las pruebas del proyecto pasan sin deshabilitar ni relajar ninguna.
- [ ] El código y la casilla `[x]` se entregan juntos en el mismo cambio.
- [ ] Si corrige un defecto, incluye una prueba que lo reproduce y evita su regresión.
- [ ] Una verificación fallida no se oculta ni se actualiza sin revisar el comportamiento.

## Nivel 2 — Incremento (spec)

Un incremento se considera terminado si, además:

- [ ] La spec, el plan y las tareas fueron aprobados **antes** de implementar (orden `spec → plan → tasks → implementación`).
- [ ] Cada criterio de aceptación (CA) tiene una prueba automatizada o una comprobación reproducible identificada.
- [ ] Existe trazabilidad: requisito → criterio → decisión de plan → tarea → cambio → prueba → resultado.
- [ ] `verification.md` registra los comandos ejecutados, los resultados y los pendientes.
- [ ] Hay **validación en Android** (la previsualización web no la reemplaza).
- [ ] Las pantallas no consultan directamente servicios remotos ni almacenamiento (capas separadas).

## Nivel 3 — Calidad y accesibilidad

- [ ] La interfaz contempla lectores de pantalla, contraste, escalado de texto y objetivos táctiles adecuados.
- [ ] Hay estados comprensibles de carga, error, vacío, sin conexión y conflicto cuando aplican.
- [ ] Se respeta la preferencia de reducir movimiento (`useReducedMotion`).
- [ ] El movimiento usa los tokens de `src/shared/motion/motionTokens.ts`, sin rebotes; los botones usan `ScalePress` y las cargas `GotaLoader`.
- [ ] El código y los identificadores están en inglés; la documentación, los textos de interfaz y las etiquetas de accesibilidad, en español.
- [ ] Los textos de bienestar se redactan en español claro y empático, sin presentar inferencias como diagnóstico.

## Nivel 4 — Privacidad y seguridad

- [ ] Se recolecta solo lo necesario, con finalidad, propietario, ubicación, retención y eliminación definidos.
- [ ] No hay secretos, claves privilegiadas ni datos reales en el cliente, el repositorio, los logs ni CI.
- [ ] El acceso a datos de usuarios aplica privilegios mínimos y aislamiento por propietario, con pruebas que lo demuestran.
- [ ] Logs, errores y pruebas no revelan respuestas emocionales, sesiones ni credenciales.
- [ ] Las pruebas usan cuentas y datos sintéticos.

## Nivel 5 — Entrega

- [ ] El cambio llega mediante pull request desde una rama `feature/*`, `fix/*`, `docs/*` o `chore/*` hacia `dev`.
- [ ] CI está en verde (`validate.yml` y `admin.yml`) y hay al menos una aprobación para integrar a `main`.
- [ ] Dependencias, configuración, migraciones y documentación necesarias están versionadas.
- [ ] Todo cambio de esquema o configuración remota es revisable, verificable y tiene estrategia de reversión.
- [ ] El commit sigue el formato `tipo: descripción en español`.
- [ ] El pull request identifica el incremento y las tareas, resume riesgos y pruebas, y señala migraciones o cambios de contrato.
- [ ] La autoría de commits y pull requests corresponde solo a personas: sin trailers `Co-Authored-By`, `Generated-by` ni créditos de herramientas.
- [ ] Las dependencias se actualizan manualmente, en cambios pequeños y verificados por CI.

## Cómo se aplica

- **Tarea:** la revisa quien la implementa y quien aprueba el pull request.
- **Incremento:** se cierra cuando todos sus criterios de aceptación tienen resultado registrado. Si queda un pendiente, como la prueba en Android, la spec **permanece abierta** y se registra en `verification.md`.
- **Excepciones:** una excepción al orden requiere autorización explícita, alcance, riesgo, responsable, mitigación y fecha de expiración. No puede debilitar privacidad, consentimiento ni aislamiento.
