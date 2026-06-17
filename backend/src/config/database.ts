import { Sequelize } from 'sequelize';
import { config } from './env';
import { logger } from '../utils/logger';

// Allow test override
let _sequelize: Sequelize | null = null;

// PostgreSQL-only project
// DB_DIALECT env var kept for backwards compatibility but defaults to postgres
const dbDialect = (process.env.DB_DIALECT || 'postgres') as 'mysql' | 'postgres';

export function createSequelize(): Sequelize {
  if (_sequelize) return _sequelize;

  const dbName = process.env.TEST_DB_NAME || config.db.name;
  const dbUser = process.env.TEST_DB_USER || config.db.user;
  const dbPass = process.env.TEST_DB_PASSWORD || config.db.password;
  const dbHost = process.env.TEST_DB_HOST || config.db.host;
  const dbPort = parseInt(process.env.TEST_DB_PORT || String(config.db.port));

  _sequelize = new Sequelize({
    database: dbName,
    username: dbUser,
    password: dbPass,
    host: dbHost,
    port: dbPort,
    dialect: dbDialect,
    logging: false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
    define: {
      timestamps: true,
      underscored: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    },
  });

  return _sequelize;
}

export const sequelize = createSequelize();

// For testing - reset the instance
export async function resetSequelize(): Promise<void> {
  if (_sequelize) {
    try {
      await _sequelize.close();
    } catch {
      // Ignore close errors
    }
  }
  _sequelize = null;
}

export async function connectDatabase(): Promise<void> {
  try {
    await sequelize.authenticate();
    logger.info('Database connection established successfully');
  } catch (error) {
    logger.error({ err: error }, 'Unable to connect to the database');
    throw error;
  }
}

export async function syncDatabase(force: boolean = false): Promise<void> {
  try {
    await sequelize.sync({ force });
    logger.info('Database synchronized');
  } catch (error) {
    logger.error({ err: error }, 'Error synchronizing database');
    throw error;
  }
}
