/// <reference types="vite/client" />

import { z } from 'zod';

const envSchema = z.object({
  // Backend only
  DATABASE_URL: z.url().optional(), // Optional
  
  // Frontend (Public)
  VITE_API_URL: z.url(),
});

// Validate & Export
export const env = envSchema.parse(import.meta.env || process.env);