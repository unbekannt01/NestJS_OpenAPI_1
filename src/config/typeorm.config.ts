// src/config/typeorm.config.ts

import { registerAs } from '@nestjs/config';
import { Car } from 'src/search/entity/car.entity';
import { RecentSearch } from 'src/search/entity/recent-search.entity';
import { User } from 'src/user/entities/user.entity'; 

export const typeOrmConfig = registerAs('typeorm', () => ({
  type: 'postgres',
  host: process.env['DB_HOST'],
  port: parseInt(process.env['DB_PORT'] || '5432', 10),
  username: process.env['DB_USER'],
  password: process.env['DB_PASS'],
  database: process.env['DB_NAME'],
  entities: [User, RecentSearch,Car],
  synchronize: true,
}));
