import { DataSourceOptions } from 'typeorm';
import { join } from 'path';
import { registerAs } from '@nestjs/config';
import { configService } from 'src/common/services/config.service';

export const dataSourceOptions = (): DataSourceOptions => {
  const useDatabaseUrl = configService.getValue('DATABASE_URL', false);
  console.log('Using DATABASE_URL:', !!useDatabaseUrl);

  const baseConfig = {
    entities: [join(__dirname, '..', '**', '*.entity.{ts,js}')],
    migrations: [join(__dirname, '..', '..', 'db', 'migrations', '*.{ts,js}')],
    synchronize: false,
    migrationsTableName: 'typeorm_migrations',
    migrationsRun: false,
    // logging: configService.getValue('TYPEORM_LOGGING', false) === 'true',
  };

  if (useDatabaseUrl) {
    return {
      type: (configService.getValue('DB_TYPE', false) as any) || 'postgres',
      url: useDatabaseUrl,
      ssl: {
        rejectUnauthorized: false,
      },
      ...baseConfig,
    };
  }

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
