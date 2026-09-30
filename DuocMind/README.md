# DuocMind

Proyecto Expo SDK 57 con TypeScript, preparado para Android y previsualización web. La pantalla inicial comprueba la disponibilidad del backend de desarrollo.

## Ejecución local

Requisito previo obligatorio: el archivo `.env` con la URL y la clave **publicable** del proyecto Supabase de desarrollo `Duocmind`.

```bash
npm ci
cp .env.example .env   # omitir si el .env ya existe
npm run web
```

Para obtener la clave: panel de Supabase → Project Settings → API → copiar `Publishable key` (empieza con `sb_publishable_`). Pegarla en `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` de `.env`. Nunca usar una clave `secret` o `service_role` en variables `EXPO_PUBLIC_`. El archivo `.env` se ignora en Git y Docker. Recargar la app después de cambiar sus valores.

Si el `.env` falta o tiene los marcadores sin reemplazar, la pantalla inicial muestra **"Falta configuración"**: significa exactamente eso, no es un error de dependencias.

**Ojo con los comandos:**
- `npm run start` (o `npm start`): abre el servidor Metro. No muestra la app en el navegador; presionar `w` dentro de la terminal para lanzar la web, o usar directamente `npm run web`.
- `npm run web`: sirve la previsualización web directamente en `http://localhost:8081`.
- `npm run android`: abre el flujo de Expo en Android; por sí solo no compila SQLCipher en Expo Go.
- `npx expo run:android`: genera/compila un development build nativo. Es el flujo necesario para probar la outbox SQLCipher y el comportamiento offline en Android.

La pantalla inicial muestra el resultado de una comprobación remota de Supabase Auth. Este estado no verifica escrituras en tablas ni persistencia offline. El check-in requiere aplicar la migración documentada y usar una cuenta Auth con perfil estudiante; revisa [configurar-env-supabase.md](docs/configurar-env-supabase.md) antes de probar el guardado. La vista web no acredita el cifrado de SQLite.

## Ejecución con Docker

Requisito previo: el mismo `.env` descrito arriba, presente en esta carpeta (el compose lo monta dentro del contenedor).

```bash
docker compose up --build
```

Al iniciar el contenedor, `npm ci` sincroniza el volumen de `node_modules` con `package-lock.json`: instala dependencias nuevas y quita las que ya no están declaradas. La primera ejecución o un cambio de dependencias puede tardar unos segundos más y necesitar acceso al registro de npm.

La previsualización queda disponible en `http://localhost:8081`. Docker se usa solo para desarrollo; el build nativo Android debe ejecutarse con `npx expo run:android` desde un entorno con Android SDK.
