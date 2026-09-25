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
- `npm run android`: para probar en Android con Expo Go.

La pantalla inicial muestra el resultado de una comprobación remota de Supabase Auth. Este estado no verifica consultas a tablas ni persistencia offline.

## Ejecución con Docker

Requisito previo: el mismo `.env` descrito arriba, presente en esta carpeta (el compose lo monta dentro del contenedor).

```bash
docker compose up --build
```

La previsualización queda disponible en `http://localhost:8081`. Docker se usa solo para desarrollo; la aplicación Android se ejecuta con `npm run android` y Expo Go.
