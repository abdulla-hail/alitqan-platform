import "server-only";

/** Server-only secrets. Importing this from a client component fails the build. */
export const serverEnv = {
  serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SECRET_KEY ?? "",
  setupToken: process.env.SETUP_TOKEN ?? "",
  ipHashSalt: process.env.IP_HASH_SALT ?? "",
  resendApiKey: process.env.RESEND_API_KEY ?? "",
  emailFrom: process.env.EMAIL_FROM ?? "",
  turnstileSecret: process.env.TURNSTILE_SECRET_KEY ?? "",
};
