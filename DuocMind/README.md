# DuocMind

Proyecto Expo SDK 57 con TypeScript, preparado para Android y previsualización web. La pantalla inicial comprueba la disponibilidad del backend de desarrollo.

## Ejecución local

```bash
npm ci
cp .env.example .env
npm run start
```

En `.env`, sustituir los marcadores por la URL y la clave **publicable** del proyecto Supabase de desarrollo `Duocmind`, disponibles en el panel del proyecto. Nunca usar una clave `secret` o `service_role` en variables `EXPO_PUBLIC_`. El archivo `.env` se ignora en Git y Docker. Recargar la app después de cambiar sus valores.

La pantalla inicial muestra el resultado de una comprobación remota de Supabase Auth. Este estado no verifica consultas a tablas ni persistencia offline.

## Ejecución con Docker

```bash
docker compose up --build
```

La previsualización queda disponible en `http://localhost:8081`. Docker se usa solo para desarrollo; la aplicación Android se ejecuta con `npm run android` y Expo Go.
