# Tareas 020 — Importar el horario desde el boletín de carga académica de Duoc

| Campo | Valor |
| --- | --- |
| Versión | 0.1.0 |
| Estado | APROBADAS |
| Fecha | 2026-11-14 |
| Spec | `spec.md` 0.3.0, APROBADA |
| Plan | `plan.md` 0.1.0, APROBADO |
| Rama | `feature/ocr-horario-duoc` |
| Aprobación de tareas | El usuario aprobó el plan el 2026-11-14 («adelante») tras la propuesta de redactar las tareas e implementar a continuación |

## Reglas de ejecución

Ejecutar en orden, una tarea por vez. Una tarea se marca `[x]` cuando su cambio está
completo y `npm run typecheck` y `npm test` pasan. No autorizan commits, push,
despliegues ni migraciones remotas.

## Tareas

- [x] T001 Crear `tests/fixtures/duocTimetable.mjs`, que genera boletines PDF sintéticos con el formato de SAP (nombre y RUT ficticios, celdas partidas, celda cortada entre páginas, detalle de clases). **Verificación:** las pruebas de T002 y T003 lo usan. **CA-001.**
- [x] T002 Agregar `domain/pdfText.ts` con `extractPdfText`. **Verificación:** `tests/duocTimetable.test.mjs` (textos, coordenadas, acentos, archivo vacío o comprimido). **CA-004.**
- [x] T003 Agregar `domain/duocTimetable.ts` con `parseDuocTimetable`: semestre, grilla, continuación entre páginas, unión de módulos, detalle, nombres legibles y `DuocTimetableError`. **Verificación:** `tests/duocTimetable.test.mjs`. **CA-001 a CA-004, CA-007.**
- [x] T004 Verificar en local los cuatro boletines reales con un script fuera del repositorio. **Verificación:** salida comparada con cada PDF. **CA-005.**
- [x] T005 Agregar `PlannerService.applyImport` y exponerlo en `usePlanner`. **Verificación:** `tests/plannerService.test.mjs`. **CA-006.**
- [x] T006 Agregar `application/scheduleImport.ts` (`buildImport`, `findSameSemester`, `nextFreeSemesterName`). **Verificación:** `tests/scheduleImport.test.mjs`. **CA-006, CA-010, CA-011.**
- [x] T007 Instalar `expo-document-picker` y `expo-file-system` con `npx expo install`; agregar `pickTimetableFile.ts` y `timetableFile.native.ts`/`.web.ts` (límite de 2 MB y borrado de la copia en caché). **Verificación:** typecheck. **RF-001.**
- [ ] T008 Agregar `ScheduleImportScreen`, `ImportPreview`, la ruta `/schedule-import` y la acción «Importar desde Duoc» en «Mis horarios». **Verificación:** typecheck, `expo export --platform web` y recorrido web sin solicitudes de red. **CA-006, CA-007.**
- [ ] T009 Recorrido Android con un build de desarrollo: importar, cancelar, archivo ajeno, semestre repetido, TalkBack y texto ampliado. **CA-006, CA-008.**

## Estado de las tareas abiertas

- **T004:** los cuatro boletines reales se reconstruyen igual que su PDF, incluidas las
  8 clases de Portafolio 4 unidas en 4 fechas y sin nombre ni RUT en el resultado. El
  script quedó fuera del repositorio.
- **T008:** código listo; `npm run typecheck`, `npm test` y `expo export --platform web`
  pasan, y la ruta `/schedule-import` se exporta. Falta el recorrido web con sesión
  iniciada: revisar la vista previa y confirmar que no hay solicitudes de red al importar.
- **T009:** pendiente; requiere un build de desarrollo nuevo por `expo-document-picker` y
  `expo-file-system`.
