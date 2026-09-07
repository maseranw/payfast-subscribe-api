export function validateEnv(): void {
  const requiredEnvVars = ["SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"];
  const missingEnvVars = requiredEnvVars.filter((name) => !process.env[name]);

  missingEnvVars.forEach((name) => {
    console.error(`Missing required environment variable: ${name}`);
  });

  if (missingEnvVars.length > 0) {
    process.exit(1);
  }

  if (process.env.NODE_ENV === "production" && !process.env.CLIENT_APP_URL) {
    console.error("CLIENT_APP_URL is not set; CORS will fall back to the localhost dev origin in production");
  }
}
