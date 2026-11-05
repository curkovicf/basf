import Joi from 'joi';

/** Validated once at startup, so a misconfigured container fails fast with a clear message. */
export const environmentValidationSchema = Joi.object({
  DATABASE_URL: Joi.string()
    .uri({ scheme: ['postgresql', 'postgres'] })
    .required(),
  API_PORT: Joi.number().integer().min(1).max(65535).default(3100),
  // Reviews accepted per client IP per minute.
  REVIEW_RATE_LIMIT: Joi.number().integer().min(1).default(5),
  // Number of reverse proxies in front of the API; 0 when it is reached directly.
  TRUST_PROXY: Joi.number().integer().min(0).default(0),
});
