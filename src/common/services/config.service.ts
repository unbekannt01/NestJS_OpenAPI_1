import * as fs from 'fs';
import * as path from 'path';
import { config } from 'dotenv';

const nodeEnv = process.env.NODE_ENV || 'local';
const envFilePath = path.resolve(process.cwd(), `.env.${nodeEnv}`);

if (fs.existsSync(envFilePath)) {
  config({ path: envFilePath });
  console.log(`Loaded environment variables from ${envFilePath}`);
} else {
  console.warn(`${envFilePath} not found. Falling back to .env`);
  config();
}

export class ConfigService {
  constructor(private env: { [k: string]: string | undefined }) {}

  public getValue(key: string, throwOnMissing = true): string {
    const value = this.env[key];
    if (!value && throwOnMissing) {
      throw new Error(`config error - missing env.${key}`);
    }
    return value!;
  }

  public ensureValues(keys: string[]) {
    keys.forEach((k) => this.getValue(k, true));
    return this;
  }

  public getPort() {
    return this.getValue('PORT', true);
  }

  public getNumber(key: string): number {
    return Number(this.getValue(key));
  }

  public getBoolean(key: string): boolean {
    return this.getValue(key) === 'true';
  }

  // public isProduction() {
  //     const mode = this.getValue('MODE', false);
  //     return mode?.toLowerCase() === 'production';
  // }

  // public getTypeOrmConfig(): TypeOrmModuleOptions {
  //     return {
  //         type: 'postgres',
  //         host: this.getValue('DB_HOST'),
  //         port: parseInt(this.getValue('DB_PORT')),
  //         username: this.getValue('DB_USER_NAME'),
  //         password: this.getValue('DB_PASSWORD'),
  //         database: this.getValue('DB_DATABASE'),
  //         entities: [],
  //         autoLoadEntities: true,
  //         logging: true,
  //         synchronize: false,
  //     };
  // }
}

// Initialize config service with required variables
const configService = new ConfigService(process.env).ensureValues([
  'DB_HOST',
  'DB_PORT',
  'DB_USER',
  'DB_PASS',
  'DB_NAME',
  'JWT_SECRET',
  'JWT_EXPIRES_IN',
]);

export { configService };
