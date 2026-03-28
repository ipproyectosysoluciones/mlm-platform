# Database Setup - PostgreSQL (Docker)

## Containers

| Container         | Puerto | Usuario  | Base de datos | Uso               |
| ----------------- | ------ | -------- | ------------- | ----------------- |
| mlm_postgres      | 5434   | mlm      | mlm_db        | Desarrollo        |
| mlm_postgres_test | 5435   | mlm_test | mlm_test      | Tests integración |

## Iniciar Containers

```bash
# Iniciar container de desarrollo
docker start mlm_postgres

# Iniciar container de tests
docker start mlm_postgres_test
```

## Crear Containers (primera vez)

```bash
# Desarrollo
docker run -d --name mlm_postgres \
  -e POSTGRES_USER=mlm \
  -e POSTGRES_PASSWORD=mlm123 \
  -e POSTGRES_DB=mlm_db \
  -p 5434:5432 \
  postgres:16-alpine

# Tests
docker run -d --name mlm_postgres_test \
  -e POSTGRES_USER=mlm_test \
  -e POSTGRES_PASSWORD=mlm_test \
  -e POSTGRES_DB=mlm_test \
  -p 5435:5432 \
  postgres:16-alpine
```

## Ejecutar Seed

```bash
cd backend
pnpm run seed
```

> El seed es **re-ejecutable**. Si ya existen registros, los salta automáticamente.

## Variables de Entorno (.env)

```env
# Desarrollo
DB_DIALECT=postgres
DB_HOST=localhost
DB_PORT=5434
DB_NAME=mlm_db
DB_USER=mlm
DB_PASSWORD=mlm123

# Tests
TEST_DB_HOST=127.0.0.1
TEST_DB_PORT=5435
TEST_DB_NAME=mlm_test
TEST_DB_USER=mlm_test
TEST_DB_PASSWORD=mlm_test
```

## ⚠️ Nota Importante sobre TEST*DB*\* Variables

`database.ts` da **PRIORIDAD** a `TEST_DB_*` vars sobre `DB_*` vars.

- Al ejecutar **seed**: Asegurar que `TEST_DB_*` apunte al container de **desarrollo** (5434)
- Al ejecutar **tests de integración**: Restaurar `TEST_DB_*` al container de **tests** (5435)

## Comandos Docker

```bash
# Ver estado
docker ps

# Ver logs
docker logs mlm_postgres

# Conectar por consola
docker exec -it mlm_postgres psql -U mlm -d mlm_db

# Resetear DB (elimina datos)
docker stop mlm_postgres && docker rm mlm_postgres
# Luego recrear con el comando de arriba

# Resetear DB tests
docker stop mlm_postgres_test && docker rm mlm_postgres_test
```
