# Dashboard con compartición voluntaria — definición pendiente

Solicitud: permitir a Bienestar y Salud consultar información que un estudiante
haya elegido compartir, para facilitar su atención. El dashboard del registro ya
puede consultar nombre, correo Auth, carrera y sede. No concede acceso a datos
emocionales ni resultados individuales.

## Inventario relevante

- `registro_emocional` guarda ánimo y fecha/hora del alumno; su aislamiento actual
  es personal. El permiso administrativo de la Spec 005 no autoriza leerlo.
- `aplicacion_test` existe en el esquema, pero los ejecutores actuales de la app
  calculan resultados en sesión y no los persisten en esa tabla. Su existencia
  no acredita disponibilidad de resultados de cada estudiante.
- `alerta_bienestar` registra consentimiento para una derivación concreta. No es
  consentimiento para consultar un historial ni para compartir datos futuros.
- No existe un modelo de autorización revocable de compartición al dashboard.

## Decisión solicitada al usuario

Qué información podrá autorizar el alumno:

1. Ánimo más reciente y último resultado disponible de test.
2. Historial de ánimo y resultados.
3. Mantener por ahora únicamente datos de registro.

Esta decisión continúa pendiente; no se deduce del permiso de administrador ni
se establece por seleccionar «General» en la configuración de tips.

## Requisitos a definir y aprobar antes de habilitar compartición

- Finalidad, datos concretos, periodo visible y conservación/eliminación.
- Acción informada del alumno, desactivada por defecto, con destinatario claro
  (Bienestar y Salud), campos autorizados y fecha/versión de consentimiento.
- Concesión y revocación por la cuenta del alumno autenticado. El panel no puede
  habilitar el permiso en su nombre. Explicar el efecto de revocar y volver a
  consentir sobre datos previos y nuevos.
- Comprobación de permiso administrativo y consentimiento vigente en cada
  lectura; proteger también acceso directo a la API y solicitudes en curso.
- No ampliar acceso a respuestas de tests, datos de otros estudiantes ni
  atributos ajenos a la finalidad aprobada. Ausencia de datos disponible se
  representa como tal; no se fabrican resultados ni estados de riesgo.
- Definir el flujo de atención: no inferir diagnósticos ni contactar a terceros
  automáticamente por una emoción o resultado.
- Usar cuentas sintéticas; verificar aislamiento, revocación, eliminación,
  errores y garantías de almacenamiento antes de activar información real.

La implementación requiere una ampliación aprobada del alcance de privacidad y
su plan/tareas. La interfaz actual marca esta parte «Pendiente de habilitar» y
no muestra contadores ficticios de alumnos que comparten datos. La futura
integración de distribución de tests/tips/eventos permanece independiente.
