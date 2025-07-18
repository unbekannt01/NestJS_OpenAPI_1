import { config } from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

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
      console.error(
        `Missing environment variable: ${key} in ${process.env.NODE_ENV || 'local'} environment`,
      );
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
}

const getRequiredEnvVars = () => {
  const nodeEnv = process.env.NODE_ENV || 'local';

  const baseVars = [
    'NODE_ENV',
    'JWT_SECRET',
    'JWT_EXPIRES_IN',
    'JWT_REFRESH_EXPIRES_IN',
    'SMTP_HOST',
    'SMTP_PORT',
    'SMTP_USER',
    'SMTP_PASS',
    'SMTP_SECURE',
  ];

  if (nodeEnv === 'local') {
    return [...baseVars, 'DB_HOST', 'DB_PORT', 'DB_USER', 'DB_PASS', 'DB_NAME'];
  } else {
    // For development, DATABASE_URL might be used instead
    return [
      ...baseVars,
      // DATABASE_URL is optional, will fall back to individual DB vars if not present
    ];
  }
};

const configService = new ConfigService(process.env).ensureValues(
  getRequiredEnvVars(),
);

export { configService };
