import * as Joi from 'joi';

export const validationSchema = Joi.object({
  // Environment & App
  NODE_ENV: Joi.string()
    .valid('local', 'development', 'production')
    .default('local'),
  PORT: Joi.number().default(3001),
  FRONTEND_BASE_URL: Joi.string().uri().required(),

  // Database
  DB_HOST: Joi.string().required(),
  DB_PORT: Joi.number().required(),
  DB_USER: Joi.string().required(),
  DB_PASS: Joi.string().required(),
  DB_NAME: Joi.string().required(),
  DB_TYPE: Joi.string()
    .valid('postgres', 'mysql', 'mariadb', 'sqlite')
    .required(),

  // JWT
  JWT_SECRET: Joi.string().required(),
  JWT_EXPIRES_IN: Joi.string().default('1h'),
  JWT_REFRESH_EXPIRES_IN: Joi.string().default('7d'),

  // SMTP
  SMTP_HOST: Joi.string().required(),
  SMTP_PORT: Joi.number().default(587),
  SMTP_USER: Joi.string().email().required(),
  SMTP_PASS: Joi.string().required(),
  SMTP_SECURE: Joi.boolean().truthy('true').falsy('false').default(false),

  // Google OAuth
  GOOGLE_CLIENT_ID: Joi.string().required(),
  GOOGLE_CLIENT_SECRET: Joi.string().required(),
  GOOGLE_CALLBACK_URL: Joi.string().uri().required(),

  // Twilio (Optional)
  TWILIO_ACCOUNT_SID: Joi.string().optional(),
  TWILIO_AUTH_TOKEN: Joi.string().optional(),
  TWILIO_PHONE_NUMBER: Joi.string().optional(),
  TWILIO_VERIFY_SERVICE_SID: Joi.string().optional(),

  // Security
  MAX_LOGIN_ATTEMPTS: Joi.number().default(10),
  LOCKOUT_DURATION: Joi.number().default(900000),
  OTP_EXPIRY: Joi.number().default(120000),
  EMAIL_VERIFICATION_TOKEN_EXPIRATION_MS: Joi.number(),

  // App Settings
  APP_NAME: Joi.string().default('MyApp Local'),
  ENABLE_SWAGGER: Joi.boolean().truthy('true').falsy('false').default(true),
  ENABLE_DEBUG_LOGS: Joi.boolean().truthy('true').falsy('false').default(true),
  ENABLE_SMS: Joi.boolean().truthy('true').falsy('false').default(false),
  ENABLE_GOOGLE_OAUTH: Joi.boolean()
    .truthy('true')
    .falsy('false')
    .default(true),
});
