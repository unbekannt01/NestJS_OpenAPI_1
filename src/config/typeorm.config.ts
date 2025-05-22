import { registerAs } from '@nestjs/config';
import { DataSourceOptions } from 'typeorm';
import { join } from 'path';

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

// Config for NestJS module
export const typeOrmConfig = registerAs('typeorm', () => ({
  ...dataSourceOptions,
  synchronize: false,
}));
