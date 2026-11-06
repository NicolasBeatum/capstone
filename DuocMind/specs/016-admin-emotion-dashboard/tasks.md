# Tareas 016 — Dashboard emocional agregado y alineación del panel

| Campo | Valor |
| --- | --- |
| Versión | 0.1.0 |
| Estado | APROBADAS |
| Fecha | 2026-11-06 |
| Spec | 016 0.1.0 |
| Plan | 016 0.1.0 |
| Aprobación de tareas | Nicolás Hernández, 2026-11-06 |

## Alineación

- [x] T001 Convertir `20261104120000_sync_remote_schema.sql` a UTF-8 sin cambiar su SQL y comprobar `supabase db reset` local.
- [x] T002 Retirar sede de tipos, contratos, páginas, pruebas y e2e de `admin-web`.
- [x] T003 Retirar Tips del panel y de la Edge Function.
- [x] T004 Actualizar fixtures y suite de backend al esquema vigente.

## Dashboard

- [x] T005 Crear la migración `20261106120000_admin_emotion_dashboard.sql`.
- [x] T006 Admitir `/emotions` en la Edge Function.
- [x] T007 Crear `tools/tests/emotions.mjs` con CA-004 a CA-011.
- [x] T008 Agregar tipos, contrato y gateway en el panel, con prueba de contrato.
- [x] T009 Crear hook, página, navegación y enlace desde Dashboard.
- [x] T010 Crear e2e de la página con datos y sin datos suficientes.

- [x] T015 Mostrar el estado de la escala en promedio, tendencia y carreras (RF-017).

## Consentimientos en la app

- [x] T011 Crear gateway remoto y reglas de sincronización con pruebas.
- [x] T012 Conectar Mi perfil y el registro.
- [ ] T013 Verificar el flujo en Android.

## Cierre

- [x] T014 Registrar resultados en `verification.md`.
