// Creates the FIRST owner (super admin) from the command line — an alternative to /admin/setup.
// Works only while no active super admin exists (enforced by public.bootstrap_owner in SQL).
// Usage: npm run create-owner -- --email you@company.com --name "Your Name"
// The password is typed interactively (hidden) and never stored in the project.
import { createInterface } from "node:readline";
import { createClient } from "@supabase/supabase-js";

const arg = (k) => {
  const i = process.argv.indexOf(`--${k}`);
  return i > -1 ? process.argv[i + 1] : undefined;
};
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;
const email = arg("email");
const name = arg("name") || "Owner";
if (!url || !key || !email) {
  console.error("Needs NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY in .env.local and --email <address>");
  process.exit(1);
}

function askHidden(q) {
  return new Promise((resolve) => {
    const rl = createInterface({ input: process.stdin, output: process.stdout, terminal: true });
    rl._writeToOutput = (s) => { if (s.includes(q)) rl.output.write(s); };
    rl.question(q, (a) => { rl.close(); process.stdout.write("\n"); resolve(a); });
  });
}

const password = await askHidden("Owner password (min 12 chars): ");
if (password.length < 12) {
  console.error("Password too short.");
  process.exit(1);
}
const sb = createClient(url, key, { auth: { persistSession: false } });
const { count } = await sb.from("profiles").select("id", { count: "exact", head: true }).eq("role_key", "super_admin").eq("is_active", true);
if (count) {
  console.error("An owner already exists. Add more users from /admin/users.");
  process.exit(1);
}
const { data, error } = await sb.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { full_name: name } });
if (error) {
  console.error("Could not create user:", error.message);
  process.exit(1);
}
const { error: e2 } = await sb.rpc("bootstrap_owner", { target: data.user.id });
if (e2) {
  await sb.auth.admin.deleteUser(data.user.id);
  console.error("Bootstrap failed:", e2.message);
  process.exit(1);
}
console.log(`✓ Owner created: ${email}. Sign in at /admin/login`);
