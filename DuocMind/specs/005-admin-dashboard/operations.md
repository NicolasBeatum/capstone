# Operación local

Los comandos usan `tools/.local/runtime.json`, rechazan hosts remotos y no muestran claves.

## Autorización

`node tools/scripts/staff.mjs staff enable` habilita el primer funcionario sintético sin perfil ni administrador anterior. `staff revoke` revoca su siguiente operación; `dual` prueba una cuenta con perfil propio. En una futura operación autorizada de servidor, verificar el UUID Auth y ejecutar `INSERT INTO private.admin_staff(auth_user_id,enabled) VALUES (:uuid,true) ON CONFLICT(auth_user_id) DO UPDATE SET enabled=true`; revocar con `UPDATE ... SET enabled=false`. No conceder permisos desde metadatos ni desde el panel. El rol estudiantil es el acceso existente sin pertenencia administrativa.

## Registros operativos y Cron

Idempotencia y contadores solo se consultan con `expires_at > now()`. Vencen a las 24 horas aunque falle el proceso. `duocmind_admin_cleanup` ejecuta cada cinco minutos; en condiciones normales borra antes de 24 horas y cinco minutos y conserva siete días de historial técnico propio.

Desde PostgreSQL local, comprobar `SELECT jobid,schedule,active FROM cron.job WHERE jobname='duocmind_admin_cleanup'` y `SELECT status,start_time,end_time FROM cron.job_run_details WHERE jobid=:jobid ORDER BY start_time DESC LIMIT 10`. Ante fallo corregir la causa registrada, reactivar con `SELECT cron.alter_job(:jobid,active:=true)` y ejecutar `SELECT private.cleanup_admin_operations()` para recuperar el atraso. Confirmar ausencia de vencidos en ambas tablas y una ejecución posterior satisfactoria. Nunca copiar datos o secretos a incidencias. El job se crea únicamente al aplicar la migración en local; no se han programado trabajos remotos.

La prueba de fallo utiliza temporalmente un job sintético de un segundo; comprueba ejecución sin peticiones y recuperación del mismo comando. Se elimina al finalizar. El job operativo permanece en cinco minutos.

## Sesiones y datos

La API verifica cada JWT con Auth y revalida `auth.sessions` y la habilitación vigente en cada operación SQL. Las credenciales viven en Auth; no hay columna de rol ni contraseña en `estudiante`. Funcionario con perfil conserva solo acceso directo a sus propios datos. El listado administrativo usa una proyección de servidor sin RUT, teléfono, emociones ni resultados.

Sesión por pestaña, listados en memoria y limpieza ante 401/403. El cliente descarta respuestas después de cerrar/cambiar sesión. Los errores y cuerpos no se registran. No hay métricas de tips recibidos, asignaciones ni historial de reglas por alumno.

## Contenido y disponibilidad

Publicar un cuestionario congela su contenido. Activarlo reemplaza la versión activa en una transacción y aumenta revisiones; publicar conserva la versión anterior activa. Para editar contenido publicado, clonar una versión propia, guardar, publicar y activar por separado. No borrar versiones referenciadas ni editar los instrumentos protegidos. PSS-10 no tiene seed validado en el repositorio: la migración vincula el contenido existente y crea su catálogo vacío si no existe. No introducir preguntas inventadas como instrumento validado.

Eventos usan `America/Santiago`; seleccionar un desfase si la hora se repite y cambiar las horas inexistentes. Publicar/cancelar conserva la evidencia de publicación. Tips publicados admiten edición con revisión, reglas OR por catálogo emocional o versión/nivel publicado, y desactivación. Un consejo sin reglas es general. La distribución a Android no está implementada.

## Correo y recuperación

El servidor limita una solicitud por alumno/minuto y diez por funcionario/hora, con reserva atómica e idempotencia. Resuelve nuevamente el correo de Auth al enviar. Si no hay vínculo/correo, rechaza el envío. Un timeout queda incierto: comprobar el buzón y consultar el estado antes de iniciar una solicitud distinta; repetir el mismo UUID no envía otra vez.

La plantilla local `supabase/templates/recovery.html` usa hash solo cuando `.RedirectTo` coincide exactamente con `http://127.0.0.1:5173/recover`. En el resto de solicitudes conserva `ConfirmationURL`; Site URL no cambia. Auth local añade ese redirect a su allowlist y usa Mailpit. `/recover` limpia la URL, requiere validar el enlace explícitamente, utiliza cliente Auth independiente/sin persistencia y confirma el cambio de contraseña.

Una futura configuración remota debe revisar origen, literal de la plantilla, allowlist, SMTP y política de contraseña como un conjunto. Esta entrega no aplica esa configuración ni acredita entrega remota de correo.

## Recuperación ante problemas

Ante 409 conservar formulario, comparar la versión actual y recargar solo por decisión del funcionario. Ante pérdida de red no confirmar éxito; reintentar el mismo payload/UUID dentro de 24h o consultar el estado. Tras una respuesta de escritura confirmada, el editor conserva el ID del recurso aunque falle la lectura posterior. Ante revocación volver a habilitar exclusivamente por el operador si corresponde.

Para recuperar esquema/contenido detener escrituras, deshabilitar funcionarios y corregir mediante migración nueva conservando versiones e IDs. No reabrir lecturas de borradores ni borrar versiones referenciadas. Antes de una futura aplicación remota hacen falta inventario real, respaldo y autorización específica. El historial operativo tiene vencimiento propio; un fallo Cron no lo extiende.

## Verificaciones reproducibles y límites

Ver [README del panel](../../../admin-web/README.md) para arranque limpio y comandos de CI; [contratos](contracts.md) para API y [verificación](verification.md) para evidencia por tarea/criterio. Las pruebas usan exclusivamente datos sintéticos, reconstruyen la base local y pueden modificar/restaurar sus fixtures. No ejecutar scripts de fixture contra datos reales. CI no sube archivos de entorno, trazas ni logs de inicio con claves.

T023 se omite por decisión del usuario del 2026-10-04. No se acredita regresión nativa ni verificaciones pendientes de otras specs. Ningún contenido nuevo se descarga, ejecuta o presenta en Android mediante este incremento.
