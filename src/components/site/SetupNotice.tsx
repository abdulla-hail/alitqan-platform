/** Shown instead of the site when Supabase is not configured or the schema is missing. */
export function SetupNotice({ message }: { message?: string }) {
  return (
    <main style={{ fontFamily: "system-ui, sans-serif", maxWidth: 640, margin: "10vh auto", padding: 24, lineHeight: 1.6 }}>
      <h1 style={{ fontSize: 24 }}>ALITQAN — setup required</h1>
      <p>The website cannot reach its database yet. Complete these steps (see <code>docs/SETUP.md</code>):</p>
      <ol>
        <li>Create a Supabase project and copy its URL and keys into <code>.env.local</code>.</li>
        <li>Run <code>npm run db:migrate</code> and <code>npm run db:seed</code>.</li>
        <li>Restart the server.</li>
      </ol>
      {message && process.env.NODE_ENV !== "production" && (
        <p style={{ color: "#b42318", fontSize: 14 }}>Details: {message}</p>
      )}
    </main>
  );
}
