// src/db/data-source.ts

import 'dotenv/config'; // Load .env before anything else
import { DataSource } from 'typeorm';
import { dataSourceOptions } from '../../open-api-backend/src/config/typeorm.config';

const dataSource = new DataSource({
  ...dataSourceOptions,
  migrations: ['db/migrations/*.ts'],
  migrationsRun: true,
  migrationsTableName: 'migrations'
});

export default dataSource;
