# Configurar las variables de Supabase

En `DuocMind/.env`, configura la URL del proyecto y su clave publicable:

```dotenv
EXPO_PUBLIC_SUPABASE_URL=https://ashgvanzjeaeekpygqgqy.supabase.co
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_REEMPLAZAR
```

Obtén la clave en Supabase Dashboard → proyecto **Duocmind** → **Project Settings → API Keys → Publishable key**. Copia el valor completo que comienza con `sb_publishable_` y reemplaza `sb_publishable_REEMPLAZAR`.

Guarda el archivo como `DuocMind/.env` (junto a `package.json`). Si aún no existe, puedes copiar `DuocMind/.env.example` y reemplazar sus dos marcadores. `.env` está excluido de Git: no lo subas ni pegues su contenido en un commit.

Usa solo la clave **Publishable** en `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. Nunca pongas una clave `Secret` o `service_role` en una variable `EXPO_PUBLIC_*`, porque Expo las incluye en la aplicación cliente.

Después de editar `.env`, detén y vuelve a iniciar Expo para que recargue las variables. La pantalla inicial debe mostrar que el backend está conectado. Esa comprobación consulta Supabase Auth; no prueba escrituras en tablas ni el registro de cuentas.

## Habilitar Auth y check-in

El check-in requiere una cuenta real de Supabase Auth y un perfil estudiante. Para pruebas usa cuentas y datos sintéticos; no uses información emocional real hasta verificar cifrado, políticas y retención.

Antes de probar el envío, aplica en el proyecto de desarrollo, en orden, `supabase/migrations/20260927230000_emotional_checkin_history.sql` y `supabase/migrations/20260928010000_grant_checkin_timestamp.sql` después de las dos migraciones existentes. La primera agrega el valor técnico `Sin especificar`, la clave idempotente y las políticas de borrado; la segunda permite que el usuario autenticado envíe la fecha original del check-in. No se aplican automáticamente ni modifican el proyecto remoto desde el cliente.

La eliminación de cuenta necesita desplegar `supabase/functions/delete-account` con Supabase CLI. La app borra primero la base emocional local y su clave tras la confirmación explícita; si no hay red, mantiene la sesión para reintentar pero no restaura los datos locales. La función usa los secretos de servidor `SUPABASE_URL`, `SUPABASE_ANON_KEY` y `SUPABASE_SERVICE_ROLE_KEY` disponibles en Supabase Edge Functions; nunca copies la clave `service_role` al `.env` ni a la app. La función autentica el JWT, anonimiza el perfil, elimina sus registros emocionales y resultados asociados y después elimina el usuario Auth.

```bash
supabase functions deploy delete-account
```

Verifica en Supabase que el usuario de prueba solo pueda leer, insertar y borrar su propio historial. El smoke test PostgreSQL sintético está en `tests/sql/checkin-migration-smoke.sql`; ejecutarlo no despliega cambios remotos.

## Android cifrado

La outbox local usa SQLCipher, con clave por cuenta guardada en SecureStore. Expo Go y la previsualización web no prueban esta compilación nativa cifrada. Genera y prueba un development build Android después de cambiar el plugin de `expo-sqlite`:

```bash
npx expo run:android
```

La app muestra un check-in como enviado solo después de Supabase; sin conexión se conserva cifrado y se muestra como pendiente hasta sincronizar. No marques el flujo nativo/offline como verificado basándote solo en `npm run typecheck` o la web.
