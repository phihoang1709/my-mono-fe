/// <reference types="vite/client" />

import { z } from 'zod';

const envSchema = z.object({
  // Frontend (Public)
  VITE_API_BASE_URL: z.url(),
  VITE_API_OPENAPI_URL: z.url(),
});

// Validate & Export
export const env = envSchema.parse(import.meta.env || process.env);