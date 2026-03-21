import { Sequelize } from 'sequelize';
import { config } from './env';

// Allow test override
let _sequelize: Sequelize | null = null;

export function createSequelize(): Sequelize {
  if (_sequelize) return _sequelize;

  // MySQL for all environments (including tests with separate test DB)
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
    dialect: 'mysql',
    logging: config.nodeEnv === 'development' ? console.log : false,
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
export function resetSequelize(): void {
  _sequelize = null;
}

export async function connectDatabase(): Promise<void> {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully.');
  } catch (error) {
    console.error('❌ Unable to connect to the database:', error);
    throw error;
  }
}

export async function syncDatabase(force: boolean = false): Promise<void> {
  try {
    await sequelize.sync({ force });
    console.log('✅ Database synchronized.');
  } catch (error) {
    console.error('❌ Error synchronizing database:', error);
    throw error;
  }
}
