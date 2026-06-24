# Admin Dashboard Specification

## Purpose

Panel de administración frontend para gestión de propiedades, tours y reservas. Incluye vistas diferenciadas por rol: admin (acceso total) y affiliate (acceso restringido a sus propios datos).

---

## Requirements

### Requirement: CRUD Propiedades (Admin)

El sistema MUST proveer páginas para crear, editar, eliminar y cambiar el estado activo/inactivo de propiedades. El soft-delete MUST marcar el registro como inactivo sin eliminar de la base de datos.

#### Scenario: Admin crea una propiedad

- GIVEN el usuario tiene rol `admin` y está autenticado
- WHEN envía el formulario con datos válidos de una propiedad nueva
- THEN la propiedad es persistida y aparece en la lista con estado activo
- AND se muestra notificación de éxito

#### Scenario: Admin edita una propiedad

- GIVEN existe una propiedad activa y el admin está en su página de edición
- WHEN modifica campos y confirma los cambios
- THEN los datos son actualizados y la lista refleja los cambios inmediatamente

#### Scenario: Admin elimina (soft-delete) una propiedad

- GIVEN existe una propiedad y el admin confirma la eliminación
- WHEN el admin ejecuta la acción eliminar
- THEN la propiedad es marcada como inactiva (soft-delete) y deja de aparecer en la lista activa
- AND el registro persiste en la base de datos

#### Scenario: Admin toggle activo/inactivo

- GIVEN existe una propiedad con cualquier estado
- WHEN el admin activa o desactiva el toggle
- THEN el estado cambia y la UI refleja el nuevo valor sin recargar la página

#### Scenario: Acceso denegado a rol no-admin

- GIVEN un usuario con rol `affiliate` intenta acceder a AdminPropertiesPage
- WHEN intenta navegar a la ruta protegida
- THEN es redirigido con error 403 o al dashboard de afiliado

---

### Requirement: CRUD Tours/Paquetes Turísticos (Admin)

El sistema MUST proveer las mismas operaciones CRUD y toggle que para propiedades, aplicadas a la entidad tour.

#### Scenario: Admin crea un tour

- GIVEN el usuario tiene rol `admin`
- WHEN completa y envía el formulario de nuevo tour con datos válidos
- THEN el tour es guardado y aparece en la lista con estado activo

#### Scenario: Admin elimina un tour

- GIVEN existe un tour registrado
- WHEN el admin confirma la eliminación
- THEN el tour es soft-deleted y removido de la lista activa

#### Scenario: Paginación en lista de tours

- GIVEN existen más de N tours (N = page size configurado)
- WHEN el admin navega a la lista de tours
- THEN la lista muestra la primera página con controles de paginación funcionales

---

### Requirement: Vista de Reservas Admin

El sistema MUST mostrar todas las reservas del sistema con filtros por tipo, status, userId, vendorId y rango de fechas.

#### Scenario: Admin filtra reservas por status

- GIVEN existen reservas con distintos estados
- WHEN el admin selecciona un filtro de status
- THEN la lista muestra únicamente reservas con ese estado

#### Scenario: Admin filtra reservas por userId

- GIVEN el admin ingresa un userId en el filtro
- WHEN aplica el filtro
- THEN la lista muestra solo las reservas del usuario indicado

#### Scenario: Paginación en lista de reservas

- GIVEN existen más reservas que el page size
- WHEN el admin navega entre páginas
- THEN cada página muestra el subconjunto correcto de reservas

---

### Requirement: Vista de Reservas y Comisiones para Afiliado

El sistema MUST mostrar al afiliado SOLO sus propias reservas y comisiones, filtradas por el userId extraído del token JWT. El sistema MUST NOT exponer reservas o comisiones de otros usuarios.

#### Scenario: Afiliado ve sus reservas

- GIVEN el usuario autenticado tiene rol `affiliate`
- WHEN accede a la vista de reservas
- THEN solo se muestran reservas donde `userId` coincide con el del token JWT

#### Scenario: Afiliado ve sus comisiones

- GIVEN el afiliado tiene comisiones registradas
- WHEN accede a la vista de comisiones
- THEN solo se muestran sus propias comisiones con montos y fechas

#### Scenario: Afiliado no puede ver datos de otros usuarios

- GIVEN el afiliado manipula la URL o parámetros de filtro con un userId ajeno
- WHEN realiza la consulta
- THEN el sistema ignora el userId del parámetro y usa el del token JWT

---

### Requirement: Paginación en Todas las Listas

Todas las listas del admin dashboard MUST implementar paginación del lado del servidor. La UI MUST mostrar controles de página (anterior/siguiente y número de página).

#### Scenario: Página vacía al final de la lista

- GIVEN el usuario navega más allá de la última página disponible
- WHEN la API retorna 0 resultados
- THEN se muestra un mensaje de lista vacía y se deshabilita el botón "siguiente"

---

### Requirement: Protección de Rutas por Rol

Las rutas de CRUD admin MUST estar protegidas con middleware que verifique rol `admin`. Las rutas de afiliado MUST verificar rol `affiliate` o `admin`.

#### Scenario: Token expirado en ruta protegida

- GIVEN el usuario tiene un token JWT expirado
- WHEN intenta acceder a cualquier ruta del admin dashboard
- THEN es redirigido al login con mensaje de sesión expirada
