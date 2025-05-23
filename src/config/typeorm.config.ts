import { registerAs } from '@nestjs/config';
import { DataSourceOptions } from 'typeorm';
import { join } from 'path';

/**
 * PostgreSQL Configuration
 * This configuration is used to set up the PostgreSQL database connection.
 * It uses environment variables to configure the database connection settings.
 */
export const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASS || 'buddy',
  database: process.env.DB_NAME || 'postgres',
  entities: [join(__dirname, '..', '**', '*.entity.{ts,js}')],
  migrations: [join(__dirname, '..', 'db', 'migrations', '*.{ts,js}')],
  synchronize: false,
};

/**
 * TypeORM Configuration
 * This configuration is used to set up the TypeORM database connection.
 * It uses environment variables to configure the database connection settings.
 */
export const typeOrmConfig = registerAs('typeorm', () => ({
  ...dataSourceOptions,
  synchronize: false,
}));
