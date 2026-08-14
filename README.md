# ElectroModa

Proyecto de facultad (UNLP) para una tienda web de moda.

## Funcionalidades

### Roles

**Cliente**
- ID generado por PostgreSQL.
- DNI.
- Nombre de usuario.
- Email.
- Nombre y apellido.
- Contraseña.

**Empresa / Distribuidora**
- ID generado por PostgreSQL.
- CUIT.
- DNI del titular.
- Nombre y apellido del titular.
- Nombre de empresa / PyME.
- Email.
- Contraseña.
- Precio de distribuidora en el catálogo/carrito.

**Administradores**
- Acceso interno separado de clientes y empresas.
- El administrador original puede designar nuevos administradores.
- El administrador original puede activar/desactivar administradores designados.
- Los administradores comparten el feed de soporte.

## Soporte 24 horas

Los mensajes no dependen de que haya un administrador conectado en ese momento: quedan persistidos en PostgreSQL.

Flujo:

1. Cliente o empresa inicia sesión.
2. Envía una consulta desde `/mas-info/soporte`.
3. Se crea un `support_ticket` y su primer `support_message`.
4. Todos los administradores pueden verlo desde `/admin/soporte`.
5. Un administrador puede responder, tomar la consulta y cambiar su estado.
6. El usuario puede consultar el historial desde `/perfil/soporte`.

## Carrito

El carrito está asociado a la cuenta del usuario y se guarda en PostgreSQL. Permite agregar productos, cambiar cantidades y quitar productos. Los precios se calculan en ARS y, para cuentas de empresa, se utiliza el precio de distribuidora.

## PostgreSQL / pgAdmin 4

1. Crear una base llamada `electromoda`.
2. Abrir Query Tool en pgAdmin 4.
3. Ejecutar `db/electromoda.sql`.
4. Copiar `.env.example` a `.env.local` y completar los datos de PostgreSQL.
5. Ejecutar el proyecto con `npm install` y `npm run dev`.

### Designación del administrador original

Por seguridad no se incluye una contraseña de administrador fija en el código.

Registrar primero al usuario que será administrador y, desde pgAdmin 4, ejecutar:

```sql
UPDATE users
SET role = 'admin', is_admin_owner = TRUE
WHERE email = 'correo-del-admin@ejemplo.com';
```

Luego ese usuario ingresa desde la ruta interna `/admin/login` y puede designar los demás administradores desde `/admin/usuarios`.

## Nota de entrega

La estética existente se conserva: las pantallas nuevas reutilizan el mismo lenguaje visual de ElectroModa y no se rediseñó el catálogo original.

## Etapa 2 — Marketplace y moderación

La versión actual incluye:
- Admin original / co-admins.
- Moderación de usuarios.
- Publicaciones de distribuidoras/PyME con fotos, hashtags, talles y colores.
- Reseñas de 1–5 estrellas y comentarios.
- Denuncias de productos y feed administrativo.
- Carrito con variante de talle/color.

Si ya tenés una BD funcionando, **no ejecutes el esquema completo**. Ejecutá:
`db/migrations/002_roles_marketplace_reviews.sql`

Luego verificá con:
`npm run db:check`

Esperado: `14/14`.

