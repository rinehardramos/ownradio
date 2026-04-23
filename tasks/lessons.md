# Lessons Learned

## [deploy] NEVER use localhost fallbacks for production env vars
**Trigger**: Any `process.env.X ?? "http://localhost:..."` pattern in frontend code.
**Why**: `NEXT_PUBLIC_*` vars are baked at build time. If missing, the fallback gets inlined into the JS bundle. Users' browsers try to hit `localhost:4000` — site loads but is completely non-functional. This caused multiple production outages (2026-04-23).
**Example**: `process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000"` silently broke production.
**Fix**: Throw on missing env vars; validate at build time in `next.config.ts`; CI validates before build.

## [deploy] ALWAYS verify deployments before tagging a release
**Trigger**: Any production deployment.
**Why**: A successful build does not mean a successful deploy. The health endpoint must return the expected version and status before the release is considered good.
**Fix**: `scripts/verify-deploy.ts` runs post-deploy; failure triggers auto-rollback; git tags only created after verification passes.
