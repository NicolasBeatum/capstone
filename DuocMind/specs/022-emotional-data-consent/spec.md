# Spec 022 — Datos emocionales solo con consentimiento

| Campo | Valor |
| --- | --- |
| Versión | 0.3.0 |
| Estado | BORRADOR |
| Fecha | 2026-11-15 |
| Incremento | 022-emotional-data-consent |
| Plataformas | Android y previsualización web |
| Aprobación | Alcance pedido por el usuario el 2026-11-15 («que sin consentimiento no se suba nada» y una explicación por consentimiento además del PDF). Documento pendiente de revisión. |

## 1. Problema y resultado esperado

Hoy los check-in, sus motivos y los resultados del test de estrés se envían siempre a
Supabase. El consentimiento `analitica_anonima` solo filtra lo que cuenta el dashboard
agregado (spec 016). Además, en el registro y en Mi perfil cada consentimiento solo
tiene una frase y el PDF completo.

Resultado observable:

1. Sin ningún consentimiento opcional activo, ni el check-in, ni sus motivos, ni el
   resultado del test llegan a la base de datos.
2. Junto a cada consentimiento opcional, «¿Qué se comparte?» abre una explicación breve.

## 2. Alcance

- Regla: los datos emocionales se suben si hay **al menos un** consentimiento activo
  (`analitica_anonima` o `contacto`), porque los dos los necesitan en el servidor.
- Check-in sin permiso: se guarda cifrado con estado `device` y **nunca** se sube, aunque
  después se active un consentimiento (decisión del usuario, 2026-11-15). Un check-in
  guardado con permiso que quedó pendiente espera si se revoca y se sube si se reactiva.
- Revocar no borra lo ya subido: se conserva hasta eliminar la cuenta y se explica en el
  modal y en Mi perfil (decisión del usuario, 2026-11-15).
- El servidor aplica la misma regla con RLS en `registro_emocional` y `aplicacion_test`
  (migración `20261115120000`). Los motivos dependen de su registro padre.
- Documento de privacidad 1.1 (`docs/` y `assets/privacy-consents.pdf`) alineado con lo
  que se usa: datos de cuenta reales, registros emocionales en el teléfono salvo opción A
  o B, y el panel de administración ve nombre, correo y carrera de cada estudiante.
- Test sin permiso: el resultado no se guarda (no hay almacenamiento local del test) y se
  informa al terminar. La derivación a recursos de crisis no cambia.
- El permiso se lee del estado local de consentimientos, que `loadConsents` mantiene igual
  al del servidor; ante cualquier error se responde que no (falla cerrado).
- Modal compartido `ConsentInfoModal` en registro y Mi perfil: qué se comparte, qué no,
  quién lo ve y qué pasa al desactivarlo, con enlace al documento completo.

- La carrera elegida en el registro se guarda: viaja en los metadatos de Auth y un disparador
  la asigna al crear el perfil (migración `20261115130000`). El semestre no se guarda.
- La fecha y el nivel del último test se guardan en el dispositivo; el aviso de 30 días usa
  el más reciente entre el dispositivo y el servidor.
- Mi perfil → «Borrar tus datos» (decisiones del usuario, 2026-11-15):
  - Datos emocionales enviados: se borran a los 7 días (check-ins, motivos y tests hasta la
    solicitud); la copia del teléfono, la cuenta y los consentimientos se mantienen.
  - Cuenta: se elimina a los 30 días y se cierra la sesión. Los datos del teléfono se
    conservan sin enviarse (el horario solo existe ahí) y se borran la primera vez que se abre
    el inicio de sesión o el dashboard después del plazo; si la app no se vuelve a abrir,
    quedan cifrados en el teléfono hasta desinstalarla. Al volver a iniciar sesión dentro del
    plazo se ofrece cancelar (recupera todo) o salir.
  - Desde la solicitud lo pedido no cuenta en el dashboard emocional; con la cuenta pendiente
    tampoco aparece en el registro de estudiantes ni puede subir datos emocionales.
  - pg_cron ejecuta las solicitudes vencidas cada hora (migración `20261115140000`). La Edge
    Function `delete-account`, que borraba la cuenta al instante, se retira del repositorio.

Fuera de alcance: guardar el semestre; aviso de eliminación pendiente en sesiones abiertas en
otros dispositivos.

## 3. Criterios de aceptación

- **CA-001** Sin consentimientos, `saveConfirmedCheckin` guarda con estado `device`, no
  llama al gateway remoto y una sincronización posterior con permiso tampoco lo sube.
- **CA-002** `syncPendingCheckins` no sube nada sin permiso y sube lo pendiente con permiso.
- **CA-003** Sin consentimientos, el test no inserta en `aplicacion_test`.
- **CA-004** El permiso falla cerrado sin sesión o si no se puede leer el almacenamiento.
- **CA-005** Cada consentimiento opcional muestra «¿Qué se comparte?» en registro y Mi
  perfil; tocarlo no cambia la casilla ni el interruptor.
- **CA-006** Sin consentimiento vigente, la RLS rechaza insertar en `registro_emocional` y
  `aplicacion_test`; con uno, acepta, incluido el reintento con `on conflict do nothing`.
- **CA-007** La carrera elegida en el registro queda en `estudiante_carrera` al crear el perfil.
- **CA-008** Pedir el borrado de datos o de cuenta devuelve la fecha (7 o 30 días), no reinicia
  el plazo si se repite y se puede cancelar; al vencer, el cron borra lo indicado.
- **CA-009** Iniciar sesión con la cuenta pendiente de eliminación muestra la pantalla para
  cancelarla o salir.
