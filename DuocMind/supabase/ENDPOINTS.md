# API de datos de DuocMind

Proyecto de desarrollo: `Duocmind` (`ashgvanzjeaeekpygqgy`). La migración crea el esquema PostgREST en `public`.

## Conexión

- URL del proyecto: `https://ashgvanzjeaeekpygqgy.supabase.co`
- Base de la API REST: `https://ashgvanzjeaeekpygqgy.supabase.co/rest/v1`
- Autenticación: encabezado `apikey: <PUBLISHABLE_KEY>` y `Authorization: Bearer <JWT_DE_SESION>` para operaciones de usuarios.
- Usa la clave publicable del proyecto. Nunca incluyas una clave `secret` o `service_role` en la app, un archivo `EXPO_PUBLIC_*`, un commit o una petición desde el navegador.
- Los identificadores son `bigint` autogenerados. Omite la PK en los `POST`; pide `Prefer: return=representation` si necesitas el ID generado.

## Rutas de lectura

Las siguientes tablas permiten `GET` público con la clave publicable. No contienen información personal:

| Recurso REST | Uso |
| --- | --- |
| `/sede` | Sedes |
| `/carrera` | Carreras por sede |
| `/asignatura` | Catálogo de asignaturas |
| `/carrera_asignatura` | Asignaturas disponibles por carrera |
| `/estado`, `/tipo_evento` | Catálogos de agenda |
| `/emocion_general`, `/emocion_especifica` | Opciones del check-in |
| `/test_bienestar`, `/test_resultado_nivel`, `/pregunta_test`, `/opcion_respuesta` | Instrumentos, versiones, rangos y preguntas configurados |
| `/material_apoyo`, `/material_emocion`, `/material_test` | Recursos y reglas de recomendación |
| `/tipo_alerta`, `/estado_alerta` | Catálogos de derivación |

Ejemplo:

```http
GET /rest/v1/emocion_general?select=id_emocion,nombre_emocion,valor_escala&order=valor_escala.asc
apikey: <PUBLISHABLE_KEY>
```

## Rutas de estudiante autenticado

RLS limita las filas personales al `auth.uid()` asociado a `estudiante.auth_user_id`. Alguien autenticado no obtiene datos de otros estudiantes.

| Recurso REST | Operaciones habilitadas | Condiciones |
| --- | --- | --- |
| `/estudiante` | `GET`, `POST` | El alta usa el usuario de la sesión (`auth_user_id` tiene `auth.uid()` por defecto). La app no puede cambiar ese vínculo. |
| `/estudiante_carrera` | `GET` | Historial de carrera. Su carga inicial corresponde al equipo administrador. |
| `/estudiante_asignatura` | `GET`, `POST` | La inscripción debe corresponder a una carrera vigente del estudiante y a una asignatura de esa carrera. |
| `/evento_academico` | `GET`, `POST` | Debe pertenecer a una inscripción del mismo estudiante. |
| `/registro_emocional` | `GET`, `POST` | Guarda emoción, estudiante e historial de carrera opcional. No admite comentarios libres. |
| `/aplicacion_test` | `GET`, `POST` | Guarda puntaje agregado, versión del instrumento y nivel válido; no guarda respuestas individuales. |
| `/alerta_bienestar` | `GET`, `POST` | El `POST` exige consentimiento explícito con fecha y versión del texto informado. No se envía aviso automático al equipo de bienestar. |

Las rutas de estudiante, carrera, inscripciones, eventos, registros emocionales, aplicaciones y derivaciones no están accesibles para `anon`. Para las tablas sensibles, la app solo tiene `SELECT` e `INSERT`; no puede reescribir el historial de resultados.

## Ejemplos de escritura

Los siguientes ejemplos se ejecutan desde una sesión iniciada en Supabase Auth. Sustituye IDs por valores obtenidos de las rutas de catálogo y de la respuesta del alta del estudiante.

Alta de perfil después del registro en Auth:

```http
POST /rest/v1/estudiante
apikey: <PUBLISHABLE_KEY>
Authorization: Bearer <JWT_DE_SESION>
Content-Type: application/json
Prefer: return=representation

{
  "rut": "12.345.678-9",
  "primer_nombre": "Estudiante",
  "primer_apellido": "Prueba",
  "numero_telefonico": "+56 9 1234 5678",
  "correo": "estudiante@example.test"
}
```

Check-in emocional:

```http
POST /rest/v1/registro_emocional
apikey: <PUBLISHABLE_KEY>
Authorization: Bearer <JWT_DE_SESION>
Content-Type: application/json
Prefer: return=representation

{
  "emocion_especifica_id_emocionesp": 1,
  "estudiante_id_estudiante": 1
}
```

Solicitud de derivación tras aceptar el consentimiento en la app:

```http
POST /rest/v1/alerta_bienestar
apikey: <PUBLISHABLE_KEY>
Authorization: Bearer <JWT_DE_SESION>
Content-Type: application/json
Prefer: return=representation

{
  "tipo_alerta_id_tipoalerta": 1,
  "estudiante_id_estudiante": 1,
  "estado_alerta_id_estado": 1,
  "consentimiento_derivacion": true,
  "consentimiento_fecha": "2026-09-27T22:00:00Z",
  "consentimiento_version": "derivacion-v1"
}
```

El ejemplo con IDs `1` es ilustrativo; no se deben asumir IDs. El API devuelve errores `401/403` si falta autenticación, privilegios o una política; `400` si una FK o restricción no se cumple.

## Cómo cargar datos para pruebas

1. Carga catálogos académicos y recursos desde **Supabase Dashboard → Table Editor** o **SQL Editor**, en orden de dependencias: `sede`, `carrera`, `asignatura`, `carrera_asignatura`; luego recursos e instrumentos (`test_bienestar`, `test_resultado_nivel`, `pregunta_test`, `opcion_respuesta`).
2. La migración ya insertó emociones generales (`Muy mal` a `Muy bien`), emociones específicas de ejemplo y estados/tipos básicos para agenda y derivaciones.
3. Para datos personales de prueba, usa cuentas y valores sintéticos. Registra primero un usuario en Auth y crea su perfil `estudiante`; después carga desde el Dashboard la fila de `estudiante_carrera` que corresponde a esa persona. La sesión autenticada podrá crear sus inscripciones, eventos y registros propios.
4. No entregues una clave `service_role` al compañero ni a la app. Los cambios de catálogos se hacen con acceso al Dashboard; la app pública solo puede leerlos.

## Decisiones y límites actuales

- `estudiante.id_estudiante` es estable. El historial de carrera está en `estudiante_carrera`; inscripciones usan claves compuestas para impedir que una carrera tenga asignaturas de otra.
- Fechas con hora usan `timestamptz`; teléfonos son texto para conservar `+56` y ceros iniciales.
- Las categorías de resultado están versionadas por instrumento. Un trigger valida que el puntaje total pertenezca al rango declarado para el nivel. La app calcula el puntaje porque las respuestas detalladas no se almacenan.
- Una alerta que asocia aplicación de test y estudiante debe apuntar al mismo dueño. La política de inserción exige consentimiento con fecha y versión.
- El equipo de bienestar todavía no tiene una política de lectura por rol. Por ahora la API de usuario no expone derivaciones a terceros; solo las ve el estudiante dueño y el equipo administrador puede revisarlas desde el Dashboard.
- Antes de usar información real, el equipo debe fijar retención y eliminación de datos y definir cómo se asignará el rol institucional de bienestar.
