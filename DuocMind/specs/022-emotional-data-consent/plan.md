# Plan 022 — Datos emocionales solo con consentimiento

| Campo | Valor |
| --- | --- |
| Versión | 0.1.0 |
| Estado | BORRADOR |
| Spec | `spec.md` 0.1.0 |

## Diseño

- `shared/consents/domain/consents.ts`: `allowsEmotionalUpload(choices)`, `CONSENT_DETAILS`
  y `CONSENT_UPLOAD_NOTE`.
- `shared/consents/application/consentSettings.ts`: `canUploadEmotionalData({ owners, store })`,
  nunca lanza.
- `shared/consents/infrastructure/emotionalUploadPolicy.ts`: `canUploadEmotionalDataNow()`
  con los gateways reales.
- `emotional-checkin/application/checkinHistory.ts`: `syncPendingCheckins` recibe la
  política como parámetro obligatorio (sin valor por defecto, para que ningún llamador
  suba datos por omisión); `saveConfirmedCheckin` recibe `canUpload` y devuelve
  `keptOnDevice`.
- `CheckinScreen` y `SaveOverlay`: tercer estado «solo en este dispositivo».
- `DailyTestScreen`: consulta la política antes de `saveStressTestApplication`.
- `shared/components/ConsentInfoModal.tsx`, usado por `RegisterScreen` (vía
  `ConsentCheckbox.onInfo`) y `SettingsScreen`.

## Seguridad y privacidad

No se registra el estado de consentimiento ni datos emocionales. La decisión se toma en el
dispositivo; el servidor sigue aplicando su propio filtro en el dashboard (spec 016).

## Riesgos

- Sin consentimiento el historial no se sincroniza entre dispositivos y se pierde al
  reinstalar.
- Sin consentimiento el aviso de 30 días del test no funciona, porque se basa en
  `aplicacion_test`.
- Bases SQLite locales anteriores tienen el CHECK sin `device`: guardar sin consentimiento
  falla hasta borrar los datos de la app (sin conversión, la app está en desarrollo).
- Si el consentimiento se revoca en otro dispositivo, este puede intentar subir un pendiente;
  la RLS lo rechaza y queda pendiente hasta que `loadConsents` actualice el estado local.

## Pruebas

`tests/checkinHistory.test.mjs` y `tests/consentSettings.test.mjs`; typecheck; recorrido
web y Android pendientes.

## Reversión

Revertir el commit y, si ya se aplicó, una migración que restaure el `with check` anterior de las dos políticas.
