import { DataSourceOptions } from 'typeorm';
import { join } from 'path';
import { registerAs } from '@nestjs/config';
import { configService } from 'src/common/services/config.service'; // adjust path as needed

export const dataSourceOptions = (): DataSourceOptions => {
  const useDatabaseUrl = configService.getValue('DATABASE_URL', false);
  console.log('Connecting URL :', useDatabaseUrl);

  if (useDatabaseUrl) {
    return {
      type: (configService.getValue('DB_TYPE', false) as any) || 'postgres',
      url: useDatabaseUrl,
      entities: [join(__dirname, '..', '**', '*.entity.{ts,js}')],
      migrations: [join(__dirname, '..', 'db', 'migrations', '*.{ts,js}')],
      synchronize: false,
      ssl:
        configService.getValue('DB_SSL', false) === 'true'
          ? { rejectUnauthorized: false }
          : false,
      logging: configService.getValue('TYPEORM_LOGGING', false) === 'true',
    };
  }

  return {
    type: (configService.getValue('DB_TYPE', false) as any) || 'postgres',
    host: configService.getValue('DB_HOST'),
    port: Number(configService.getValue('DB_PORT')),
    username: configService.getValue('DB_USER'),
    password: configService.getValue('DB_PASS'),
    database: configService.getValue('DB_NAME'),
    entities: [join(__dirname, '..', '**', '*.entity.{ts,js}')],
    migrations: [join(__dirname, '..', 'db', 'migrations', '*.{ts,js}')],
    synchronize: false,
    ssl:
      configService.getValue('DB_SSL', false) === 'true'
        ? { rejectUnauthorized: false }
        : false,
    logging: configService.getValue('TYPEORM_LOGGING', false) === 'true',
  };
};

export const typeOrmConfig = registerAs('typeorm', () => ({
  ...dataSourceOptions(),
  synchronize: false,
}));
