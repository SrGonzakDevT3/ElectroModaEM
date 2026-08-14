# ElectroModa — BD y autenticación

Esta versión corrige la comunicación directa con PostgreSQL y mantiene intacta la estética existente.

## 1. Importante: limpiar la caché de Next

Desde la carpeta donde está `package.json`:

```bash
rm -rf .next
```

O directamente:

```bash
npm run dev:clean
```

## 2. Configurar PostgreSQL

Copiar `.env.example` como `.env.local` y completar los datos reales de PostgreSQL:

```env
DB_HOST=127.0.0.1
DB_PORT=5432
DB_NAME=electromoda
DB_USER=postgres
DB_PASSWORD=TU_PASSWORD_REAL_DE_POSTGRES
DB_SSL=false
```

Para PostgreSQL local administrado desde pgAdmin 4, `DB_SSL=false` es la configuración recomendada para este proyecto.

## 3. Recrear la base de ElectroModa

En pgAdmin 4:

1. Confirmar que existe la base `electromoda`.
2. Seleccionar ESA base en el árbol de pgAdmin.
3. Abrir **Query Tool**.
4. Ejecutar completo `db/electromoda.sql`.

El script es intencionalmente destructivo para las tablas de ElectroModa: elimina la estructura anterior y la recrea limpia.

Los mensajes antiguos como:

```text
NOTICE: table "..." does not exist, skipping
```

no eran errores: eran avisos normales generados por `DROP TABLE IF EXISTS`. En esta versión esos avisos se silencian para que pgAdmin muestre solamente advertencias o errores reales.

Además, toda la creación ahora corre dentro de una transacción. Si falta una tabla al final, el script aborta en vez de dejar una instalación incompleta.

## 4. Resultado esperado en pgAdmin

Al finalizar `db/electromoda.sql`, pgAdmin debe mostrar una consulta con estas 9 tablas:

- `admin_designations`
- `cart_items`
- `order_items`
- `orders`
- `products`
- `sessions`
- `support_messages`
- `support_tickets`
- `users`

La última consulta debe devolver:

```text
productos_iniciales = 15
```

También podés ejecutar `db/verificar.sql` en cualquier momento.

## 5. Probar la conexión desde Next.js

Iniciar la web:

```bash
npm run dev:clean
```

Después, en otra terminal:

```bash
npm run db:check
```

O abrir en el navegador:

```text
http://localhost:3000/api/db/health
```

Cuando la conexión funciona debe devolver `"ok": true`.

Si devuelve `password authentication failed`, revisar `DB_USER` y `DB_PASSWORD`.

Si devuelve `ECONNREFUSED`, comprobar que PostgreSQL esté iniciado y escuchando en el puerto configurado.

## 6. Registro y login

### Cliente

- ID automático
- DNI
- nombre de usuario
- email
- nombre
- apellido
- contraseña

### Empresa / distribuidora

- ID automático
- CUIT
- DNI del titular
- nombre y apellido del titular
- empresa / PyME
- email
- contraseña

Las contraseñas de usuarios de ElectroModa no se guardan en texto plano; se guarda un hash PBKDF2.

## 7. Administrador original

1. Crear primero una cuenta normal desde `/registro`.
2. Ejecutar en pgAdmin:

```sql
UPDATE users
SET role = 'admin',
    is_admin_owner = TRUE
WHERE email = 'tu-email@ejemplo.com';
```

3. Entrar desde `/admin/login`.
4. Desde `/admin/usuarios`, el administrador original puede designar otros administradores.

## 8. Soporte y carrito

Los tickets, sus mensajes y el carrito quedan persistidos en PostgreSQL. Los administradores ven el feed común de soporte y pueden responder o cambiar el estado de cada consulta.

## 9. Imágenes y estética

No se modificaron imágenes, rutas de imágenes ni hojas de estilo. Esta corrección se limita a la lógica necesaria de PostgreSQL y autenticación.
