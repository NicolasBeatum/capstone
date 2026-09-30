# Spec — Check-in emocional modular con instrumentos clínicos

**Estado:** APROBADA
**Incremento:** 003-emotional-checkin

## Problema

El check-in emocional vive en un solo archivo (`daily-test.tsx`) con preguntas hardcodeadas y un
resultado ficticio ("% de coincidencia"), sin capacidad de soportar instrumentos psicométricos
reales ni derivación a apoyo.

## Alcance

Refactor del módulo de check-in emocional a una arquitectura modular que soporte múltiples
instrumentos psicológicos validados, cada uno con su propia escala de respuesta y lógica de
scoring, manteniendo la identidad visual actual (colores, tipografía, estilos de
`daily-test.styles`).

## Instrumentos (textos validados, no modificables)

1. **WHO-5 (Índice de Bienestar OMS)** — 5 ítems, escala 0-5 ("En ningún momento" a "Todo el
   tiempo"). Scoring: suma (0-25) × 4 = porcentaje 0-100. Corte validado: ≤ 50 indica bajo
   bienestar (motivo de seguimiento).
2. **PHQ-9 (depresión)** — 9 ítems, escala 0-3 ("Nunca" a "Casi todos los días"). Suma 0-27 con
   rangos: 0-4 mínimo, 5-9 leve, 10-14 moderado, 15-19 moderadamente severo, 20-27 severo. El
   ítem 9 (ideación de autolesión) con valor > 0 interrumpe el flujo y navega a recursos de
   crisis, sin mostrar resultado normal.
3. **GAD-7 (ansiedad)** — 7 ítems, escala 0-3. Suma 0-21 con rangos: 0-4 mínimo, 5-9 leve,
   10-14 moderado, 15-21 severo.
4. **Sondeo inicial** — 3 preguntas (PHQ-2 de 2 ítems + GAD-2 de 1 ítem), escala 0-3, para
   decidir si se ofrece el test completo.

## Reglas de ruteo

- Check-in diario simple "mal"/"muy mal" → ofrecer sondeo inicial (vía parámetro `?mood=`).
- Sondeo: subescala de ánimo (PHQ-2) ≥ 3 → ofrecer PHQ-9 completo.
- Sondeo: subescala de ansiedad (GAD-2) ≥ 2 → ofrecer GAD-7 completo.
- PHQ-9 ítem 9 > 0 → navegación inmediata a CrisisResourcesScreen, sin resultado normal.
- PHQ-9/GAD-7 en rango moderado o superior → mostrar opción de derivación al área de bienestar
  estudiantil (ruta `/views/wellness`).
- WHO-5 ≤ 50 → ofrecer el sondeo inicial como seguimiento (corte validado OMS).

## Resultados observables / criterios de aceptación

1. `src/features/emotional-checkin/data/` contiene un archivo por instrumento (who5.ts, phq9.ts,
   gad7.ts, sondeoInicial.ts) exportando preguntas, opciones de escala y función de scoring que
   devuelve puntaje + categoría.
2. `TestRunner` es genérico: recibe preguntas, opciones y `onComplete(respuestas)`; reutiliza el
   diseño visual actual sin contenido hardcodeado.
3. `routingRules.ts` implementa las reglas anteriores como funciones puras verificables.
4. `DailyCheckinScreen` orquesta el flujo completo (WHO-5 → sondeo → PHQ-9 → GAD-7 → resultado
   → derivación) según las reglas.
5. El resultado se basa en las categorías reales de cada escala; no existe scoring inventado.
6. La ruta `/views/tests/daily-test` se conserva (wrapper) y se agrega
   `/views/tests/crisis-resources`.
7. `npm run typecheck` pasa sin errores.

## Fuera de alcance

- Persistencia de respuestas (backend/SQLite): el módulo no registra datos; se incorpora en un
  incremento futuro junto al historial.
- Cableado del check-in simple existente (`checkin/index.tsx`) hacia `?mood=mal`: los ánimos
  actuales (Calmo/Estresado/Alegre/Cansado) no incluyen "mal"/"muy mal"; la regla queda
  implementada y lista para cuando esos estados existan.
- Traducción/adaptación de textos de instrumentos (son versiones validadas, no modificables).
