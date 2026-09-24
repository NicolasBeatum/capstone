# Plan — Check-in emocional modular

**Spec:** `spec.md` (aprobada) · **Estado:** APROBADO

## Arquitectura

```
src/features/emotional-checkin/
├── data/
│   ├── types.ts            # TestQuestion, ScaleOption, TestResult, Instrument
│   ├── who5.ts             # ítems, escala 0-5, scoring suma×4 con corte ≤50
│   ├── phq9.ts             # ítems, escala 0-3, rangos 0-27, PHQ9_ITEM9_ID
│   ├── gad7.ts             # ítems, escala 0-3, rangos 0-21
│   └── sondeoInicial.ts    # PHQ-2 (2 ítems) + GAD-2 (1 ítem), subscores
├── components/
│   ├── TestRunner.tsx      # motor genérico de preguntas (UI reutilizada)
│   ├── InstrumentResult.tsx# tarjeta de resultado + derivación + acción secundaria
│   └── TestOffer.tsx       # interludio: ofrecer test completo / cerrar flujo
├── screens/
│   └── DailyCheckinScreen.tsx  # orquestador (máquina de estados por pasos)
└── routingRules.ts         # funciones puras de decisión (cortes PHQ-2/GAD-2, ítem 9, derivación)

src/app/views/tests/
├── daily-test.tsx          # wrapper de ruta (conserva /views/tests/daily-test)
└── crisis-resources.tsx    # ruta /views/tests/crisis-resources
```

## Decisiones

- **Datos y scoring puros** en `data/`: funciones sin dependencias de React; cada instrumento
  expone `interpretation` por categoría para que la orquestación no hardcodee textos.
- **`TestRunner` sin estado de negocio**: solo navegación entre ítems y entrega de respuestas;
  la intercepción del ítem 9 se hace vía callback `onAnswer` para no acoplar el componente al
  PHQ-9.
- **Orquestación por pasos** (`Step` union) en `DailyCheckinScreen`: cada instrumento se monta
  con `key={instrument.id}` para resetear el estado interno del runner al cambiar de instrumento.
- **Reglas de ruteo como funciones puras** en `routingRules.ts`, con constantes de corte
  exportadas; facilita verificación y futuras pruebas unitarias.
- **Crisis sin resultado intermedio**: `router.replace` a `/views/tests/crisis-resources` evita
  volver al test con el botón atrás.
- **Estilos**: se reutiliza `daily-test.styles.ts` (identidad visual); se agregan claves
  `referral*` y `resource*`; se eliminan las clases del resultado ficticio (`resultEmotion*`,
  `loading*`).

## Riesgos

- Textos de instrumentos: versiones validadas en español; cualquier edición futura requiere
  validación clínica (fuera de alcance).
- La línea *4141 y Salud Responde son recursos de Chile; verificar vigencia antes de producción.

## Pruebas y verificación

- `npm run typecheck` (TypeScript estricto).
- Flujos manuales pendientes en Android: WHO-5 normal, WHO-5 bajo → sondeo, sondeo → PHQ-9,
  sondeo → GAD-7, ambos ofrecidos en cadena, ítem 9 > 0 → crisis, rangos moderados → derivación.

## Reversión

Eliminar `src/features/emotional-checkin/`, restaurar `daily-test.tsx` anterior y las clases de
estilo eliminadas desde git (`git checkout` de los archivos afectados). Sin migraciones ni
cambios de contrato con backend.
