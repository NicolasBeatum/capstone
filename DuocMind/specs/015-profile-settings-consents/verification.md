# Verificación 015 — Configuración de permisos opcionales desde el perfil

| Campo | Valor |
| --- | --- |
| Fecha | 2026-10-30 |
| Entorno | Windows 11, Node v26.10.0 (el proyecto pide >=24 <25), npm 11.19.1 |

## Resultados

| Comando | Resultado |
| --- | --- |
| `npm run typecheck` | Sin errores. |
| `npm test` | 276 pruebas, 276 correctas, 0 fallos (incluye `consentStore`, `consentSettings` y `registrationConsents`). |
| `npx expo export --platform web` | Exporta sin errores con la ruta `/settings` incluida. |

## Criterios

| ID | Estado |
| --- | --- |
| CA-002 a CA-007 | Cubiertos por pruebas automáticas. |
| CA-009 | Revisión de la pantalla: muestra «Por ahora tu elección se guarda en este dispositivo». |
| CA-001, CA-008, CA-010 | Pendientes en Android (T009). |

## Limitaciones

- No se probó la pantalla en un dispositivo ni la navegación desde el menú.
- El traspaso desde el registro solo se probó con almacenamiento simulado.
- El archivo generado `.expo/types/router.d.ts` (ignorado por git) estaba desactualizado y hacía fallar `typecheck` con la ruta nueva; se eliminó y `expo start` lo regenera.
