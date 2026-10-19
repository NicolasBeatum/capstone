# Spec — Check-in emocional con historial personal

**Estado:** APROBADA
**Incremento:** 004-emotional-checkin-history

## Problema

La pantalla de check-in permite seleccionar un ánimo, pero el inicio de sesión actual es simulado, no existe persistencia y no se muestra un historial personal. El modelo actual requiere una emoción específica aunque la pantalla ya no pide una.

## Alcance propuesto

- Conectar registro e inicio de sesión por correo y contraseña con Supabase Auth; crear el perfil `estudiante` con los datos requeridos por el esquema.
- Persistir la selección del ánimo solo después de una confirmación explícita.
- Añadir temporalmente la emoción específica `Sin especificar` para cada emoción general y asociarla al ánimo seleccionado, sin atribuir al estudiante una emoción concreta que no eligió.
- Mostrar debajo del selector el historial del estudiante autenticado, ordenado del más reciente al más antiguo, leyendo los registros personales desde Supabase.
- Mantener los datos emocionales aislados por `auth.uid()` y nunca usar una clave privilegiada en la aplicación.
- Conservar escrituras confirmadas sin conexión en Android mediante almacenamiento local cifrado y sincronizarlas al recuperar conectividad.
- Permitir que el estudiante elimine sus registros y definir retención y eliminación de los datos de cuenta y perfil.

## Datos y privacidad

El registro contiene el ánimo general, fecha/hora y el identificador del estudiante. La emoción específica `Sin especificar` es un valor técnico temporal, no una emoción reportada por la persona. No se guardan comentarios libres.

No se deben usar datos personales o emocionales reales hasta verificar el cifrado local, el aislamiento RLS, la eliminación y el periodo de retención. Las pruebas usan cuentas y datos sintéticos.

## Criterios de aceptación propuestos

1. El registro e inicio de sesión crean y restauran una sesión Supabase real; errores de autenticación se presentan sin revelar credenciales.
2. El perfil estudiante se obtiene por `auth.uid()` y no se aceptan IDs de estudiante proporcionados libremente por la interfaz.
3. El catálogo contiene de forma idempotente `Sin especificar` asociado a cada ánimo general.
4. Confirmar un ánimo guarda un registro que referencia el ánimo correcto a través de su emoción específica temporal; cancelar o fallar la operación no muestra éxito.
5. La pantalla muestra el historial del usuario actual debajo del selector, con ánimo y fecha/hora, y se actualiza al guardar.
6. RLS impide leer, insertar o eliminar registros de otra persona; no se usa `service_role` en el cliente.
7. En Android, una escritura confirmada sin conexión permanece cifrada localmente y se sincroniza sin duplicados al volver la conexión.
8. El estudiante puede eliminar un registro propio y la política de retención aprobada se aplica de forma verificable.
9. Las pruebas cubren autenticación, mapeo del catálogo, persistencia, estados de error/offline, eliminación y aislamiento entre usuarios.

## Enmienda 2026-10-07: ánimo general directo

Aprobada por la persona responsable el 2026-10-07. Reemplaza la emoción específica `Sin especificar` por una referencia directa a `emocion_general` en `registro_emocional`, y elimina la tabla `emocion_especifica`, que el producto no usa. Los criterios 3 y 4 y el modelo de datos se leen con este cambio: el registro guarda el ánimo general sin intermediario técnico. Los registros existentes conservan su ánimo general.

## Decisiones pendientes de aprobación

- Confirmar los campos obligatorios del perfil durante el registro: RUT, nombre y apellido, ya que el esquema los exige.
- Aprobar la retención propuesta: cada registro se conserva hasta que el estudiante lo elimine; definir además el tratamiento del perfil y sus datos al cerrar una cuenta.
- Aprobar el mecanismo de almacenamiento local cifrado y su sincronización offline en Android.
- Confirmar si `Sin especificar` es solo una solución temporal de compatibilidad del esquema y en qué incremento se reemplazará por un modelo que permita guardar el ánimo general directamente.

## Fuera de alcance

- Diagnósticos, recomendaciones clínicas o envío automático de información a terceros.
- Guardar respuestas detalladas de instrumentos psicométricos.
- Usar datos reales antes de aprobar y verificar las garantías de privacidad descritas.
