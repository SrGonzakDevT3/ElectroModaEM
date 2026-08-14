# ElectroModa — BD/Login en Linux

Esta versión reemplaza el cliente PostgreSQL manual por `pg` (node-postgres).
No se modificaron imágenes ni CSS.

## 1. Reinstalar dependencias

Como `pg` es una dependencia nueva, hacelo una vez:

```bash
rm -rf node_modules package-lock.json .next
npm install
```

## 2. Configurar `.env.local`

```env
DB_HOST=127.0.0.1
DB_PORT=5432
DB_NAME=electromoda
DB_USER=postgres
DB_PASSWORD=TU_PASSWORD_REAL_DE_POSTGRES
DB_SSL=false
DB_SSL_REJECT_UNAUTHORIZED=true
DB_CONNECTION_TIMEOUT_MS=8000
```

El password es el de PostgreSQL, no el de pgAdmin ni el del usuario de Linux.

## 3. Recrear la estructura desde pgAdmin 4

- Seleccionar la base `electromoda`.
- Abrir Query Tool.
- Ejecutar `db/electromoda.sql` completo.
- El resultado final debe indicar:
  - `tablas_electromoda = 9`
  - `productos_iniciales = 15`

Para comprobar después puede ejecutarse `db/verificar.sql`.

## 4. Comprobar PostgreSQL SIN Next

```bash
npm run db:check
```

Ahora este comando se conecta directamente a PostgreSQL; no necesita `npm run dev`.
Debe mostrar `Conexión correcta` y `Tablas encontradas: 9/9`.

## 5. Iniciar Next

```bash
npm run dev:clean
```

Después probar primero `/registro` y crear una cuenta de cliente.

## Nota sobre el log anterior

Si se ejecuta el antiguo `db:check` después de presionar Ctrl+C sobre Next,
`fetch failed` es normal porque ya no existe un servidor escuchando en puerto 3000.
Esta versión elimina esa dependencia.
