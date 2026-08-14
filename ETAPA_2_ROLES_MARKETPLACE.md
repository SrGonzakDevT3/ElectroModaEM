# ElectroModa — Etapa 2: roles, marketplace, reseñas y denuncias

Esta versión parte de la versión estable que ya utiliza `pg`.

## IMPORTANTE: no recrear la base si ya funciona

Si tu base `electromoda` actual ya tiene usuarios y funciona:

1. Hacé una copia de seguridad desde pgAdmin 4 si querés conservar pruebas.
2. Entrá a la base `electromoda`.
3. Abrí **Query Tool**.
4. Ejecutá únicamente:

   `db/migrations/002_roles_marketplace_reviews.sql`

5. Luego, en Linux:

```bash
npm install
npm run db:check
```

El resultado esperado es:

`Tablas encontradas: 14/14`

6. Limpiá la caché de Next:

```bash
npm run dev:clean
```

## Si querés crear una base completamente nueva

Usá:

`db/electromoda.sql`

Ese archivo sí recrea todas las tablas desde cero.

## Roles

### Admin original
- Se identifica con `role = 'admin'` + `is_admin_owner = TRUE`.
- Tiene todos los permisos de moderación.
- Está protegido: no puede ser baneado/eliminado por co-admins.
- Puede moderar co-admins.

### Co-admin
- Se identifica con `role = 'admin'` + `is_admin_owner = FALSE`.
- Puede responder soporte.
- Puede banear/eliminar clientes y empresas.
- Puede ascender clientes/empresas a co-admin.
- Puede moderar productos y denuncias.
- No puede modificar al admin original ni a otros admins.

### Distribuidora / PyME
- `role = 'company'`.
- Tiene `/empresa/productos`.
- Puede publicar productos con:
  - categoría;
  - tipo/subcategoría;
  - descripción;
  - hashtags `#...`;
  - hasta 5 imágenes;
  - precio cliente;
  - precio distribuidora;
  - stock;
  - talles opcionales;
  - colores opcionales.
- Puede retirar sus publicaciones.
- Administración puede monitorizar sus productos.

### Cliente
- `role = 'customer'`.
- Puede comprar.
- Puede elegir talle/color si el vendedor los habilitó.
- Puede puntuar productos de 1 a 5 estrellas.
- Puede escribir/editar/eliminar su reseña.
- Puede denunciar productos.

## Rutas nuevas

### Distribuidora
- `/empresa/productos`
- `/empresa/productos/nuevo`

### Producto
- `/producto/[id]`

### Administración
- `/admin/usuarios`
- `/admin/productos`
- `/admin/denuncias`
- `/admin/soporte`

## Fotos subidas por vendedores

Se guardan localmente en:

`public/uploads/products/<ID_VENDEDOR>/`

Esto es apropiado para la entrega local de la facultad. Para un despliegue real en servidores efímeros convendría usar almacenamiento externo (S3, Cloudinary, etc.), pero no es necesario para esta entrega.

## Estética

No se modificó `src/app/globals.css` ni se reemplazaron las imágenes existentes. Las pantallas nuevas reutilizan las mismas clases y componentes visuales del proyecto.
