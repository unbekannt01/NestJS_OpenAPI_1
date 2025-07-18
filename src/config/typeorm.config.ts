import { DataSourceOptions } from 'typeorm';
import { join } from 'path';
import { configService } from 'src/common/services/config.service';
import { registerAs } from '@nestjs/config';

export const dataSourceOptions = (): DataSourceOptions => {
  const nodeEnv = process.env.NODE_ENV || 'local';
  const useDatabaseUrl = configService.getValue('DATABASE_URL', false);

  console.log('Current NODE_ENV:', nodeEnv);
  console.log('Using DATABASE_URL:', !!useDatabaseUrl);

  const baseConfig = {
    entities: [join(__dirname, '..', '**', '*.entity.{ts,js}')],
    migrations: [join(__dirname, '..', '..', 'db', 'migrations', '*.{ts,js}')],
    synchronize: false,
    migrationsTableName: 'typeorm_migrations',
    migrationsRun: false,
    logging: nodeEnv === 'local' ? true : false,
  };

  // For development environments with DATABASE_URL (like Railway)
  if (useDatabaseUrl && nodeEnv !== 'local') {
    console.log('Using DATABASE_URL configuration for environment:', nodeEnv);
    return {
      type: (configService.getValue('DB_TYPE', false) as any) || 'postgres',
      url: useDatabaseUrl,
      ssl: {
        rejectUnauthorized: false,
      },
      ...baseConfig,
    };
  }

  // For local development
  console.log('Using individual DB config for local environment');
  return {
    type: (configService.getValue('DB_TYPE', false) as any) || 'postgres',
    host: configService.getValue('DB_HOST'),
    port: Number(configService.getValue('DB_PORT')),
    username: configService.getValue('DB_USER'),
    password: configService.getValue('DB_PASS'),
    database: configService.getValue('DB_NAME'),
    ssl:
      configService.getValue('DB_SSL', false) === 'true'
        ? { rejectUnauthorized: false }
        : false,
    ...baseConfig,
  };
};

export const typeOrmConfig = registerAs('typeorm', () => ({
  ...dataSourceOptions(),
  synchronize: false,
}));
