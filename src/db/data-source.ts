// src/db/data-source.ts

import 'dotenv/config'; // Load .env before anything else
import { DataSource } from 'typeorm';
import { dataSourceOptions } from '../config/typeorm.config';

const dataSource = new DataSource({
  ...dataSourceOptions,
  migrations: ['src/db/migrations/*.ts'],
  migrationsRun: true
});

export default dataSource;
