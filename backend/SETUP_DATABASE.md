# Database Setup

## Option 1: Docker (Recommended)

```bash
./setup-db.sh
```

This will:

- Start MySQL 8.0 container
- Create `mlm_db` database
- Create `.env` file with credentials
- Start phpMyAdmin at http://localhost:8080

## Option 2: Local MySQL

1. Ensure MySQL is running
2. Create database:

```sql
CREATE DATABASE mlm_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

3. Update `.env` with your MySQL credentials

## Option 3: Using sudo

```bash
sudo mysql -e "CREATE DATABASE IF NOT EXISTS mlm_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
```

## Environment Variables

| Variable    | Description       | Default   |
| ----------- | ----------------- | --------- |
| DB_HOST     | MySQL host        | localhost |
| DB_PORT     | MySQL port        | 3306      |
| DB_NAME     | Database name     | mlm_db    |
| DB_USER     | Database user     | root      |
| DB_PASSWORD | Database password | (empty)   |

## Syncing the Database

After setting up, sync the database schema:

```bash
npm run dev -- --force-sync
```

## Docker Commands

```bash
# Start
docker-compose up -d

# Stop
docker-compose down

# View logs
docker-compose logs -f mysql

# Reset database
docker-compose down -v && docker-compose up -d
```
