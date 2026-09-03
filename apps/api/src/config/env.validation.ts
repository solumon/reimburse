import Joi from 'joi';

export const envValidationSchema = Joi.object({
  ADMIN_PASSWORD_HASH: Joi.string()
    .pattern(/^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/)
    .required()
    .messages({ 'string.pattern.base': 'ADMIN_PASSWORD_HASH 必须是完整的 bcrypt 哈希' }),
  APP_FILES_DIR: Joi.string().default('./files'),
  APP_SQLITE_DIR: Joi.string().default('./sqlite'),
  COOKIE_SECURE: Joi.boolean().truthy('true').falsy('false').default(false),
  HOST: Joi.string().default('127.0.0.1'),
  NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
  PORT: Joi.number().port().default(8000),
  SESSION_SECRET: Joi.string().min(32).required(),
});
