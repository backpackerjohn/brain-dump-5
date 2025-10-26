/**
 * Environment variable validation
 * Validates and provides required environment variables with clear error messages
 */

interface EnvVars {
  VITE_SUPABASE_URL: string;
  VITE_SUPABASE_PUBLISHABLE_KEY: string;
}

function getEnvVar(key: keyof EnvVars): string {
  const value = import.meta.env[key];
  
  if (!value || value === '') {
    throw new Error(
      `Missing required environment variable: ${key}\n\n` +
      `Please add ${key} to your .env file.\n` +
      `If you're running this locally, copy .env.example to .env and fill in the values.`
    );
  }
  
  return value;
}

export function validateEnv(): EnvVars {
  try {
    return {
      VITE_SUPABASE_URL: getEnvVar('VITE_SUPABASE_URL'),
      VITE_SUPABASE_PUBLISHABLE_KEY: getEnvVar('VITE_SUPABASE_PUBLISHABLE_KEY'),
    };
  } catch (error) {
    console.error('Environment validation failed:', error);
    throw error;
  }
}
