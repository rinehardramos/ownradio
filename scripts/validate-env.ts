#!/usr/bin/env tsx
/**
 * Build-time environment variable validation.
 * Usage: npx tsx scripts/validate-env.ts --app=web|api
 * Exits 1 if required vars are missing or invalid.
 */

const APP_REQUIREMENTS: Record<string, { required: string[]; urls?: string[] }> = {
  web: {
    required: ["NEXT_PUBLIC_API_URL", "NEXT_PUBLIC_WS_URL"],
    urls: ["NEXT_PUBLIC_API_URL", "NEXT_PUBLIC_WS_URL"],
  },
  api: {
    required: ["DATABASE_URL", "JWT_SECRET"],
  },
};

function parseApp(): string {
  const flag = process.argv.find((a) => a.startsWith("--app="));
  if (!flag) {
    console.error("Usage: validate-env.ts --app=web|api");
    process.exit(2);
  }
  const app = flag.split("=")[1];
  if (!APP_REQUIREMENTS[app]) {
    console.error(`Unknown app "${app}". Expected: ${Object.keys(APP_REQUIREMENTS).join(", ")}`);
    process.exit(2);
  }
  return app;
}

function validate(app: string): string[] {
  const spec = APP_REQUIREMENTS[app];
  const errors: string[] = [];

  for (const key of spec.required) {
    const val = process.env[key];
    if (!val || val.trim() === "") {
      errors.push(`${key} is missing or empty`);
      continue;
    }

    if (spec.urls?.includes(key)) {
      try {
        new URL(val);
      } catch {
        errors.push(`${key}="${val}" is not a valid URL`);
        continue;
      }

      if (process.env.NODE_ENV === "production" && /localhost|127\.0\.0\.1/.test(val)) {
        errors.push(`${key}="${val}" points to localhost in production`);
      }
    }
  }

  if (
    app === "api" &&
    process.env.NODE_ENV === "production" &&
    process.env.JWT_SECRET === "dev-secret-change-in-production"
  ) {
    errors.push("JWT_SECRET is still the dev default — change it for production");
  }

  return errors;
}

const app = parseApp();
const errors = validate(app);

if (errors.length > 0) {
  console.error(`\n❌ Environment validation failed for "${app}":\n`);
  for (const e of errors) console.error(`   • ${e}`);
  console.error("");
  process.exit(1);
}

console.log(`✅ Environment validated for "${app}"`);
