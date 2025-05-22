import { registerAs } from '@nestjs/config';
import { DataSourceOptions } from 'typeorm';
import { join } from 'path';

const isDevelopment = process.env.NODE_ENV === 'development';

export const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  ...(process.env.DATABASE_URL
    ? {
        url: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false },
      }
    : {
        host:
          process.env.DB_HOST ||
          'ep-square-glade-a4oan1qm.us-east-1.aws.neon.tech',
        port: parseInt(process.env.DB_PORT || '5432', 10),
        username: process.env.DB_USER || 'neondb_owner',
        password: process.env.DB_PASS || 'npg_Yc5ywvu4GPnj',
        database: process.env.DB_NAME || 'neondb',
        ssl: true,
      }),
  entities: [join(__dirname, '..', '**', '*.entity.{ts,js}')],
  migrations: [join(__dirname, '..', 'db', 'migrations', '*.{ts,js}')],
  synchronize: !isDevelopment,
};

// Config for NestJS module
export const typeOrmConfig = registerAs('typeorm', () => ({
  ...dataSourceOptions,
  synchronize: false, // recommended for production to disable synchronize
}));
