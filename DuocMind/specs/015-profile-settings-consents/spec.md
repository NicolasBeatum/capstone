# Spec 015 — Configuración de permisos opcionales desde el perfil

| Campo | Valor |
| --- | --- |
| Versión | 0.2.0 |
| Estado | APROBADA |
| Fecha | 2026-10-30 |
| Incremento | 015-profile-settings-consents |
| Plataformas | Android y previsualización web |
| Aprobación | 0.2.0: confirmada por el usuario el 2026-10-30 («Aprobada»), con el traspaso desde el registro |

## 1. Problema y resultado esperado

En el registro (spec 014) la persona acepta o no dos consentimientos opcionales de
privacidad, pero después no hay forma de cambiarlos. Un consentimiento debe poder
retirarse o concederse en cualquier momento.

Hoy, al tocar el avatar del dashboard se abre el menú de perfil
(`ProfileMenuModal`), que muestra el nombre y «Cerrar sesión». Este incremento
agrega una opción «Configuración» a ese menú, que lleva a una pantalla donde la
persona activa o desactiva cada consentimiento opcional.

Resultado observable: con sesión iniciada, avatar → «Configuración» → dos
interruptores con el texto de cada consentimiento; el cambio queda guardado y se
conserva al cerrar y abrir la app.

## 2. Alcance propuesto

- Opción «Configuración» en el menú de perfil, encima de «Cerrar sesión».
- Ruta y pantalla de configuración con los dos consentimientos opcionales:
  1. Entregar datos de forma anónima para dashboards de estrés por carrera y semestre.
  2. Autorizar contacto por los datos registrados en caso de emergencia.
- Enlace «Leer los consentimientos» al PDF empaquetado, junto al primero.
- Guardado local del estado de cada consentimiento, aislado por cuenta.
- Traspaso de lo elegido en el registro a esa configuración (decisión 1).
- Los términos y la política de privacidad no se gestionan aquí (son obligatorios).
- Borrar el estado local al eliminar la cuenta.

Fuera de alcance:

- Guardar los consentimientos en la base de datos y usarlos para dashboards o
  alertas (incremento posterior; la spec 014 ya los excluyó).
- Otras opciones de configuración (notificaciones, tema, idioma).
- Cambiar sede, carrera o semestre.
- Migraciones remotas y despliegues.

## 3. Requisitos funcionales

### RF-001 — Acceso

1. El menú de perfil muestra «Configuración» entre el nombre y «Cerrar sesión».
2. Tocarla cierra el menú y abre la pantalla de configuración.
3. La pantalla solo es accesible con sesión iniciada y tiene botón para volver.

### RF-002 — Consentimientos

1. Cada consentimiento tiene un interruptor independiente con su texto completo.
2. El estado se lee al abrir la pantalla; mientras carga se muestra `GotaLoader`.
3. Cambiar un interruptor lo guarda de inmediato y lo confirma con un mensaje
   breve; si no se pudo guardar, el interruptor vuelve a su valor anterior y se
   informa el problema en español.
4. Sin estado guardado, ambos consentimientos aparecen desactivados.
5. «Leer los consentimientos» abre el PDF empaquetado, también sin conexión.

### RF-003 — Almacenamiento

1. El estado se guarda en el dispositivo, por cuenta, en el almacenamiento seguro
   existente (`platformSecureKeyValueStorage`).
2. Una cuenta no ve el estado de otra en el mismo dispositivo.
3. Eliminar la cuenta borra el estado local de esa cuenta.
4. No se registran los valores en logs.

### RF-004 — Traspaso desde el registro

1. Lo elegido en el registro se conserva en el dispositivo hasta que la persona
   completa su perfil, momento en que pasa al estado de su cuenta y se borra el
   temporal.
2. Si no hubo elección en el registro, el estado inicial es desactivado.

## 4. Requisitos no funcionales

- **Privacidad.** Los consentimientos son datos personales sensibles: se guardan
  solo con la cuenta y no se escriben en logs ni errores.
- **Arquitectura.** El dominio y el almacenamiento de consentimientos se mueven a
  `shared/consents/` porque los usan el registro (`auth`) y la configuración; la
  pantalla usa un caso de uso con gateway de almacenamiento.
- **Accesibilidad.** Interruptores con `accessibilityRole="switch"` y estado,
  objetivos táctiles de al menos 44 px, textos en español.
- **Movimiento.** Botones con `ScalePress`, entrada con `Reveal`, carga con
  `GotaLoader`; respetan `useReducedMotion`.
- **Proporcionalidad.** Sin tablas, migraciones ni dependencias nuevas.

## 5. Hallazgos que condicionan el plan

1. **Los consentimientos del registro no se guardan en ningún lado.** Hoy son estado
   de pantalla y se pierden al salir; de ahí el traspaso de RF-004.
2. **El registro ocurre sin sesión.** Con confirmación de correo, la cuenta aún no
   existe en el dispositivo; por eso el traspaso espera a completar el perfil.
3. **El menú ya existe** en `features/dashboard/components/ProfileMenuModal.tsx`
   y lo abre `DashboardScreen`; solo esa pantalla tiene el avatar.
4. **El PDF y su apertura** (`privacyPolicyDocument.ts`) viven en `features/auth`;
   el plan debe moverlos a `shared/` para no importar entre funcionalidades.
5. **Persistencia remota pendiente.** Mientras no se guarden en Supabase, el
   cambio no afecta a dashboards ni a alertas; la pantalla debe decirlo con
   claridad para no prometer un efecto que aún no existe.

## 6. Criterios de aceptación

| ID | Criterio | Verificación prevista |
| --- | --- | --- |
| CA-001 | El menú de perfil ofrece «Configuración» y abre la pantalla. | Comprobación en pantalla. |
| CA-002 | Sin estado guardado, ambos consentimientos aparecen desactivados. | Prueba de caso de uso. |
| CA-003 | Activar o desactivar un consentimiento lo guarda y persiste al reabrir. | Prueba de almacenamiento. |
| CA-004 | Si el guardado falla, el interruptor vuelve a su valor y se informa. | Prueba de caso de uso. |
| CA-005 | Dos cuentas en el mismo dispositivo tienen estados independientes. | Prueba de almacenamiento por cuenta. |
| CA-006 | Eliminar la cuenta borra el estado de esa cuenta. | Prueba de almacenamiento. |
| CA-007 | Lo elegido en el registro aparece en la configuración tras completar el perfil. | Prueba de caso de uso. |
| CA-008 | El enlace abre el PDF, también sin conexión. | Validación manual en Android. |
| CA-009 | La pantalla avisa que el cambio aún no alimenta dashboards ni alertas. | Revisión de la pantalla. |
| CA-010 | El flujo funciona en Android. | Validación manual en Android. |

## 7. Decisiones

1. **Dónde vive el estado y cómo llega desde el registro.** Propuesta: guardado
   local por cuenta, con un valor temporal del registro que se traspasa al
   completar el perfil (RF-004). **Aprobado por el usuario** con el traspaso.
2. **Aviso de CA-009.** Texto fijo bajo los interruptores («Por ahora tu elección
   se guarda en este dispositivo»). Aprobado con la spec.

## 8. Referencias

- Menú actual: `src/features/dashboard/components/ProfileMenuModal.tsx`.
- Pantalla que lo abre: `src/features/dashboard/screens/DashboardScreen.tsx`.
- Registro y consentimientos: spec 014 y `src/features/auth/screens/RegisterScreen.tsx`.
- Almacenamiento seguro: `src/shared/backend/infrastructure/platformSecureStorage`.

Este documento no autoriza migraciones remotas, despliegues, commits ni push.

### Historial de revisiones

- **0.1.0 — 2026-10-30:** borrador inicial.
- **0.2.0 — 2026-10-30:** aprobada por el usuario con traspaso desde el registro.
- **Nota — 2026-11-06:** la spec 016 (RF-005 a RF-008) reemplaza el guardado solo local de RF-003 y el aviso de CA-009: cada cambio se registra primero en `estudiante_consentimiento` y el servidor prevalece sobre el dispositivo. Esta spec no se reescribe.
