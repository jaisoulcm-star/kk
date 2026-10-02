import { z } from "zod";
import dotenv from "dotenv";

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.string().default("3000").transform((val) => parseInt(val, 10)),
  DATABASE_URL: z.string().url().default("postgresql://postgres:postgres@localhost:5432/ecommerce_db"),
  JWT_SECRET: z.string().min(32, "JWT secret must be at least 32 characters long").default("super-secret-production-jwt-key-minimum-32-chars!"),
  JWT_EXPIRES_IN: z.string().default("15m"),
  REFRESH_TOKEN_EXPIRES_IN: z.string().default("7d"),
  STRIPE_SECRET_KEY: z.string().optional().default("sk_test_mock_stripe_key_123"),
  STRIPE_WEBHOOK_SECRET: z.string().optional().default("whsec_mock_stripe_webhook_secret_123"),
  CORS_ORIGIN: z.string().default("http://localhost:3000"),
});

export const env = envSchema.parse(process.env);
