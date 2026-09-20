# Plan 002 — Conexión básica con Supabase

| Campo | Valor |
| --- | --- |
| Versión | 0.1.0 |
| Estado | APROBADO para implementación por la solicitud del usuario de ejecutar el plan presentado |
| Fecha | 2026-09-20 |
| Spec | `spec.md` versión 0.1.0 |
| Proyecto remoto | `Duocmind` (`ashgvanzjeaeekpygqgy`) |

## 1. Solución

La pantalla inicial inicia una comprobación al montarse y permite repetirla con un botón. Presenta `Comprobando…`, `Backend conectado`, `Falta configuración`, `Sin red` o `Backend no disponible`. Nunca presenta el estado conectado por el solo hecho de construir un cliente.

La capa de aplicación expone un resultado `connected | missing-config | offline | unavailable` mediante `checkBackendConnection()`. La pantalla solo invoca ese caso de uso y transforma el resultado en texto. Un adaptador de infraestructura valida la configuración, crea un cliente con `@supabase/supabase-js` y efectúa la solicitud de salud. La pantalla no importa Supabase ni NetInfo. El estado `checking` pertenece únicamente a la presentación.

El cliente se construye de forma diferida tras validar `process.env.EXPO_PUBLIC_SUPABASE_URL` y `process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`; se desactivan `persistSession`, `autoRefreshToken` y `detectSessionInUrl`. No se instala almacenamiento de sesiones ni se realizan operaciones de autenticación. Se incorpora `react-native-url-polyfill` para la compatibilidad de React Native. Las dependencias quedan fijadas en `package.json` y `package-lock.json`.

Una configuración local es válida si la URL es HTTPS del proyecto existente, sin usuario, contraseña, parámetros ni fragmento, y la clave no está vacía y usa el prefijo `sb_publishable_`. La URL puede tener una barra final. Una variable ausente o con formato inválido produce `missing-config` sin solicitar la red; una clave bien formada pero rechazada por el proyecto produce `unavailable`. El archivo `.env.example` usa marcadores ficticios; el README indica cómo crear `.env`, excluido de Git y Docker.

La comprobación real usa `GET /auth/v1/health` con el encabezado `apikey` y un límite de espera de diez segundos. Solo una respuesta HTTP satisfactoria con cuerpo JSON de Auth esperado produce `connected`; respuestas HTTP fallidas, inesperadas o agotadas producen `unavailable`. No se inspeccionan tablas ni se solicita una identidad. Este endpoint verifica la disponibilidad de Auth y del acceso HTTP al proyecto, sin prometer disponibilidad de la Data API.

`@react-native-community/netinfo` permite clasificar la conectividad en Android y web. Si indica explícitamente ausencia de conexión o de acceso a Internet, el resultado es `offline`. Si el estado es desconocido, se intenta la comprobación. Tras un error de transporte, se refresca NetInfo: solo la ausencia confirmada se clasifica como `offline`; lo demás es `unavailable`. Las respuestas HTTP fallidas no se clasifican como falta de red. La pantalla ofrece reintento manual y descarta resultados de una comprobación anterior si el usuario inicia otra o sale de la pantalla.

## 2. Trazabilidad y pruebas

| Requisito y criterio | Decisión | Comprobación |
| --- | --- | --- |
| RF-001; CA-001, CA-006 | Validación previa, variables públicas y `.env.example` ficticio | Configuración ausente, parcial y mal formada sin solicitud; inspección de archivos y mensajes. |
| RF-002; CA-002 | Solicitud de salud autenticada con clave publicable | Respuesta real del proyecto reactivado; clave incorrecta y respuesta fallida no conectan. |
| RF-002; CA-003 | NetInfo, estados `offline` y `unavailable`, reintento | Red desactivada, fallo remoto con red y recuperación seguida de reintento. |
| RF-003; CA-004 | Misma ruta Expo para Android y web | Prueba de humo y registro del entorno y resultado en ambas plataformas. |
| RF-003; CA-005 | Caso de uso y adaptador fuera de la ruta | Inspección de importaciones y ejecución con resultados controlados. |

Se ejecuta `npm run typecheck` y se comprueban los cambios con las herramientas disponibles. La spec no se cierra sin una prueba Android real. La web y una solicitud HTTP desde el entorno de desarrollo no sustituyen esa prueba.

## 3. Operación remota, riesgos y recuperación

El proyecto se observó `INACTIVE` al planificar. Después de aprobar los artefactos, se reactiva **ese mismo proyecto** y se verifica que pase a activo antes de probar la pantalla. Se registra el estado posterior. No se crean proyectos, tablas, datos, políticas ni migraciones.

La clave publicable y las variables `EXPO_PUBLIC_` son visibles en el bundle; nunca se introduce una clave privilegiada. Los errores visibles son mensajes fijos, sin URL completa, clave ni cuerpo de respuesta. Si la reactivación falla, se consulta el estado remoto y se deja CA-002 abierta, sin repetir ciegamente la operación. Para revertir el código se revierten los cambios de este incremento. Una eventual pausa posterior del proyecto es otra operación remota y requiere autorización y comprobación de que no hay trabajo que dependa de él.
