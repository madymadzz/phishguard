import { z } from "zod";

const envSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1, "Supabase Anon Key is required"),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, "Supabase Service Role Key is required").optional(),
  GOOGLE_SAFE_BROWSING_API_KEY: z.string().optional(),
  URLHAUS_AUTH_KEY: z.string().optional(),
  VIRUSTOTAL_API_KEY: z.string().optional(),
  GEMINI_API_KEY: z.string().optional(),
  GEMINI_MODEL: z.string().default("gemini-3.8-flash"),
});

// For client-side, we only validate client-accessible variables
const clientEnvSchema = envSchema.pick({
  NEXT_PUBLIC_APP_URL: true,
  NEXT_PUBLIC_SUPABASE_URL: true,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: true,
});

const isServer = typeof window === "undefined";

function validateEnv() {
  const envValues = {
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    GOOGLE_SAFE_BROWSING_API_KEY: process.env.GOOGLE_SAFE_BROWSING_API_KEY,
    URLHAUS_AUTH_KEY: process.env.URLHAUS_AUTH_KEY,
    VIRUSTOTAL_API_KEY: process.env.VIRUSTOTAL_API_KEY,
    GEMINI_API_KEY: process.env.GEMINI_API_KEY,
    GEMINI_MODEL: process.env.GEMINI_MODEL || "gemini-3.8-flash",
  };

  if (isServer) {
    const parsed = envSchema.safeParse(envValues);
    if (!parsed.success) {
      console.error("❌ Invalid environment variables:", parsed.error.flatten().fieldErrors);
      throw new Error("Invalid server environment configuration");
    }
    return parsed.data;
  } else {
    const parsed = clientEnvSchema.safeParse(envValues);
    if (!parsed.success) {
      console.error("❌ Invalid client environment variables:", parsed.error.flatten().fieldErrors);
      throw new Error("Invalid client environment configuration");
    }
    return parsed.data as z.infer<typeof envSchema>;
  }
}

export const env = validateEnv();
