# Verificación de evidencias — 19 de octubre de 2026

Rama de trabajo: `dev`, sincronizada por fast-forward con `origin/dev`, revisión `1d8b41da1a7c26f5afbbd46e332ce2e7f250a0b8`. Los cambios de esta entrega agregan documentación, evidencias y un workflow; no cambian código de la aplicación, del panel ni de Supabase.

| Comprobación | Resultado |
| --- | --- |
| Entrevistas | Ambas copias coinciden byte a byte con los documentos originales aportados. |
| Navegación | Enlaces relativos al código y a los documentos verificados desde su carpeta de origen. Enlaces simbólicos `DuocMind → ../../DuocMind` y `admin-web → ../../admin-web` resueltos a sus carpetas originales. |
| Esquema remoto | 30 tablas de `public`, 3 de `private` y 1 de `schedule_private`; las 34 tienen RLS habilitado, confirmado mediante una segunda consulta de catálogo. |
| SQL | 1190 sentencias aceptadas por el parser PostgreSQL de pglast 8.7. No se ejecutaron sobre la base de datos. |
| Diagrama | Generado desde el mismo JSON mediante Graphviz WASM; PNG de 2952 × 3283 píxeles y SVG ampliable revisados visualmente. Contiene 34 tablas y 43 relaciones FK, más la referencia externa a `auth.users`. |
| Workflow | `actionlint` validó `android-main-release.yml` sin errores; revisión de merge `dev → main`, cierre sin merge, otras ramas y ejecución manual restringida a `main`. |
| Primera versión | No existía release ni tag `v0.1.0` al consultar GitHub. El workflow vuelve a comprobarlo antes de compilar. |
| Tipos | `cd DuocMind && npm run typecheck`: correcto. |
| Pruebas | `cd DuocMind && npm test`: 252 aprobadas, 0 fallidas. La primera ejecución en sandbox bloqueó procesos hijos con EPERM; la ejecución autorizada fuera del sandbox pasó completa. |
| Higiene de diff | `git diff --check`: sin errores. |
| Herramientas locales | Generación y verificación repetidas con scripts locales. Herramientas y dependencias excluidas de Git por solicitud del usuario; las evidencias generadas se conservan. |
| APK actual de dev | Build r10, run `39195160705`, correcto; revisión exacta `1d8b41da1a7c26f5afbbd46e332ce2e7f250a0b8`. APK descargado, checksum SHA-256 coincidente, CRC ZIP válido, bundle JavaScript y biblioteca SQLite presentes. Firma y manifiesto verificados en CI. |

La nueva release se ejecutará cuando estos archivos lleguen a `main` mediante el merge indicado; la validación estática no acredita que ya se haya publicado. [APK.md](APK.md) dirige al apartado Releases. La descarga local de verificación se conserva entre las herramientas ignoradas por Git; no se mantiene una carpeta APK en las evidencias. No se ha probado instalación ni funcionamiento en un dispositivo Android durante esta entrega. No se realizaron migraciones ni escrituras remotas a Supabase.
