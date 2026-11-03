export function isDevMode(): boolean {
  return process.env.NEXT_PUBLIC_DEV_MODE === "true";
}

export function getDemoJwtSecret(): string {
  const secret = process.env.DEMO_JWT_SECRET;
  if (!secret || secret.length < 16) {
    return "dev-secret-change-me-in-production-32chars";
  }
  return secret;
}

export function getAdminEmail(): string {
  return process.env.ADMIN_EMAIL || "admin@guardweb.local";
}

export function hasSupabase(): boolean {
  return !!(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

export function hasGithubToken(): boolean {
  return !!process.env.GITHUB_TOKEN;
}

export function hasHibpKey(): boolean {
  return !!process.env.HIBP_API_KEY;
}
