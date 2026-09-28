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
