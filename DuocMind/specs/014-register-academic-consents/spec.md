# Spec 014 — Datos académicos y consentimientos en el registro

| Campo | Valor |
| --- | --- |
| Versión | 0.2.0 |
| Estado | APROBADA |
| Fecha | 2026-10-30 |
| Incremento | 014-register-academic-consents |
| Plataformas | Android y previsualización web |
| Aprobación | 0.2.0: confirmada por el usuario el 2026-10-30 («deja los consentimientos como opcionales, menos los terminos, apruebo specs») |

## 1. Problema y resultado esperado

El registro (`RegisterScreen`) solo pide correo, contraseña y la aceptación de
términos. No pide sede, carrera ni semestre, que se necesitan para los
dashboards de estrés por carrera y semestre, ni pide los consentimientos de
privacidad que sustentan ese uso.

Resultado observable: al crear una cuenta, la persona elige su sede, su carrera
y su semestre desde listas, y puede aceptar o no dos consentimientos de
privacidad, el primero con acceso al documento detallado.

## 2. Alcance propuesto

- Tres selectores en el registro: sede, carrera y semestre.
- Sede y carrera se leen de Supabase (`sede`, `carrera`); la carrera se filtra por
  la sede elegida.
- Semestre: opciones del 1 al 13.
- Dos casillas de consentimiento, opcionales:
  1. Entregar datos de forma anónima para dashboards de nivel de estrés por
     carrera, semestre y similares. Incluye un texto tocable que abre el PDF
     «Política de Privacidad y Consentimientos – App de Bienestar Emocional».
  2. Autorizar contacto por los datos registrados en caso de emergencia
     (niveles de estrés peligrosos).
- El PDF se empaqueta dentro de la app y se abre desde ella.
- Estados de carga, vacío y error de los catálogos.

Fuera de alcance:

- Guardar en la base de datos las selecciones y los consentimientos. En este
  incremento solo viven en el estado de la pantalla; no hay migraciones.
- Crear la fila `estudiante_carrera` o cualquier otra escritura de carrera.
- Cargar los catálogos `sede` y `carrera` (se cargan desde el Dashboard).
- Usar los consentimientos para dashboards o alertas.
- Cambiar el checkbox actual de términos, que sigue siendo obligatorio.
- Migraciones remotas y despliegues.

## 3. Requisitos funcionales

### RF-001 — Selectores académicos

1. Sede y carrera son selecciones entre opciones, nunca texto libre.
2. Las opciones de sede vienen de la tabla `sede`; las de carrera, de `carrera`
   filtradas por la sede elegida.
3. Mientras no se elija sede, el selector de carrera está deshabilitado. Cambiar
   la sede limpia la carrera elegida.
4. El semestre ofrece los valores 1 a 13.
5. Las listas se ordenan alfabéticamente (semestre, numéricamente).
6. Sede, carrera y semestre son obligatorios para crear la cuenta.

### RF-002 — Estados del catálogo

1. Mientras carga se muestra `GotaLoader`, sin bloquear el resto del formulario.
2. Si el catálogo está vacío o no pudo obtenerse, se informa en español claro y
   se ofrece reintentar. No se permite continuar sin sede y carrera.

### RF-003 — Consentimientos

1. Hay dos casillas independientes, desmarcadas por defecto y opcionales.
2. El texto del primer consentimiento incluye un enlace tocable al PDF.
3. Marcar o no marcar un consentimiento no impide crear la cuenta.
4. El checkbox actual de términos y privacidad se mantiene y sigue siendo
   obligatorio.
5. Los valores quedan disponibles en el estado de la pantalla para que un
   incremento posterior los persista.

### RF-004 — Documento de consentimientos

1. El PDF va empaquetado en la app y se abre sin conexión.
2. Si no se puede abrir, se informa con un mensaje en español y el formulario
   sigue utilizable.

## 4. Requisitos no funcionales

- **Privacidad.** No se registran en logs las selecciones ni los consentimientos.
  Los catálogos son públicos; no se usan claves privilegiadas.
- **Arquitectura.** La pantalla usa un caso de uso con gateway para leer los
  catálogos; no consulta Supabase directamente. Reglas de validación en
  `application`/`domain`.
- **Accesibilidad.** Etiquetas en español, rol de checkbox y estado en las casillas,
  objetivos táctiles de al menos 44 px.
- **Movimiento.** Entradas con `Reveal`, botones con `ScalePress`, carga con
  `GotaLoader`; respetan `useReducedMotion`.
- **Proporcionalidad.** Sin tablas ni migraciones; una dependencia nueva solo si
  el plan justifica que abrir un PDF local no se resuelve con las instaladas.

## 5. Hallazgos que condicionan el plan

1. **No hay selector previo.** Ninguna pantalla móvil lee `sede` ni `carrera`; hay
   que crear el gateway y el caso de uso. El panel admin usa el mismo patrón.
2. **Catálogos sin datos conocidos.** Las migraciones no los siembran; solo los
   fixtures sintéticos. Con tablas vacías el registro quedaría bloqueado (RF-002).
3. **Abrir un PDF local en Android** no es directo con `expo-linking`. El plan debe
   elegir el mecanismo (por ejemplo `expo-asset` con `expo-sharing` o un lanzador
   de intents) y justificar la dependencia.
4. **Semestre sin modelo.** No existe columna ni catálogo de semestre; el incremento
   posterior que persista los datos debe definirlo.
5. **Registro y perfil están separados.** El RUT, nombre y apellido se piden en
   `ProfileScreen`, después de confirmar el correo; el registro no crea todavía
   filas de estudiante.

## 6. Criterios de aceptación

| ID | Criterio | Verificación prevista |
| --- | --- | --- |
| CA-001 | Sede y carrera se eligen de listas obtenidas de Supabase. | Prueba de caso de uso con gateway simulado. |
| CA-002 | La carrera solo ofrece las de la sede elegida y se limpia al cambiar de sede. | Prueba de dominio. |
| CA-003 | El semestre ofrece 1 a 13. | Prueba de dominio. |
| CA-004 | Sin sede, carrera o semestre no se crea la cuenta y se indica cuál falta. | Prueba de validación. |
| CA-005 | Catálogo vacío o con error muestra mensaje y reintento. | Prueba de caso de uso y comprobación en pantalla. |
| CA-006 | Los dos consentimientos son opcionales; la cuenta se crea con cualquier combinación. | Prueba de validación. |
| CA-007 | El checkbox de términos sigue siendo obligatorio. | Prueba de regresión. |
| CA-008 | El enlace abre el PDF empaquetado, también sin conexión. | Validación manual en Android. |
| CA-009 | No se escribe en la base de datos ni se registran los valores en logs. | Revisión del código. |

## 7. Decisiones

1. **Origen de sede y carrera.** Aprobado por el usuario: Supabase.
2. **Rango de semestre.** Aprobado por el usuario: 1 a 13.
3. **PDF.** Aprobado por el usuario: empaquetado en la app.
4. **Consentimientos opcionales.** Aprobado por el usuario: ambos opcionales; los
   términos siguen siendo obligatorios.
5. **Ubicación del PDF.** Propuesta aprobada con la spec: copiar el documento a
   `assets/` con un nombre sin espacios ni tildes.

## 8. Referencias

- Pantalla actual: `src/features/auth/screens/RegisterScreen.tsx`.
- Esquema: `supabase/migrations/20260927224730_bienestar_schema.sql` (`sede`,
  `carrera` y su política de lectura pública).
- Patrón de selectores: `admin-web/src/pages/Students.tsx`.
- Documento: `docs/Política de Privacidad y Consentimientos – App de Bienestar Emocional.pdf`.

Este documento no autoriza migraciones remotas, despliegues, commits ni push.

### Historial de revisiones

- **0.1.0 — 2026-10-30:** borrador inicial.
- **0.2.0 — 2026-10-30:** aprobada por el usuario; decisión 4 confirmada.
