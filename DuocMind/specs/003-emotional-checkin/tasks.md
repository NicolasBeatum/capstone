# Tareas — Check-in emocional modular

**Plan:** `plan.md` (aprobado)

- [x] T001 Crear `data/types.ts` con `TestQuestion`, `ScaleOption`, `TestResult` e `Instrument`
- [x] T002 Crear `data/who5.ts` con 5 ítems, escala 0-5 y scoring suma×4 (corte ≤ 50)
- [x] T003 Crear `data/phq9.ts` con 9 ítems, escala 0-3, rangos 0-27 y `PHQ9_ITEM9_ID`
- [x] T004 Crear `data/gad7.ts` con 7 ítems, escala 0-3 y rangos 0-21
- [x] T005 Crear `data/sondeoInicial.ts` con PHQ-2 + GAD-2 y subscores por dimensión
- [x] T006 Crear `routingRules.ts` con cortes PHQ-2 ≥ 3 / GAD-2 ≥ 2, ítem 9 y derivación moderada+
- [x] T007 Crear componente genérico `TestRunner` (sin preguntas ni escala hardcodeadas)
- [x] T008 Crear `InstrumentResult` con puntaje/categoría real, derivación y acción secundaria
- [x] T009 Crear `TestOffer` para ofrecer tests completos y cierre del flujo
- [x] T010 Crear `DailyCheckinScreen` orquestando WHO-5 → sondeo → PHQ-9 → GAD-7 → resultado
- [x] T011 Crear `crisis-resources.tsx` y la intercepción del ítem 9 con `router.replace`
- [x] T012 Convertir `daily-test.tsx` en wrapper de ruta (conserva `/views/tests/daily-test`)
- [x] T013 Estilos: agregar `referral*`/`resource*`, eliminar clases del resultado ficticio
- [x] T014 Verificar `npm run typecheck` sin errores ni referencias rotas

Pendiente fuera de esta entrega: pruebas manuales en Android de los flujos clínicos (ver plan.md).
