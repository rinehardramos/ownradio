#!/usr/bin/env tsx
/**
 * Post-deploy health check verification.
 * Usage: npx tsx scripts/verify-deploy.ts --url=<health-endpoint> --expected-version=<version>
 *
 * Retries up to 5 times with exponential backoff.
 * Exits 0 on success, 1 on failure.
 */

function parseArgs(): { url: string; expectedVersion: string } {
  const urlFlag = process.argv.find((a) => a.startsWith("--url="));
  const versionFlag = process.argv.find((a) => a.startsWith("--expected-version="));

  if (!urlFlag || !versionFlag) {
    console.error("Usage: verify-deploy.ts --url=<health-endpoint> --expected-version=<version>");
    process.exit(2);
  }

  return {
    url: urlFlag.split("=").slice(1).join("="),
    expectedVersion: versionFlag.split("=").slice(1).join("="),
  };
}

async function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

interface HealthResponse {
  status: string;
  version: string;
  checks?: Record<string, unknown>;
}

async function checkHealth(url: string): Promise<HealthResponse> {
  const res = await fetch(url, {
    signal: AbortSignal.timeout(10000),
    headers: { Accept: "application/json" },
  });

  if (!res.ok) {
    throw new Error(`HTTP ${res.status} ${res.statusText}`);
  }

  return (await res.json()) as HealthResponse;
}

async function main() {
  const { url, expectedVersion } = parseArgs();
  const maxRetries = 5;
  const baseDelay = 10000; // 10s

  console.log(`Verifying deployment at ${url}`);
  console.log(`Expected version: ${expectedVersion}\n`);

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Attempt ${attempt}/${maxRetries}...`);
      const health = await checkHealth(url);

      console.log(`  status:  ${health.status}`);
      console.log(`  version: ${health.version}`);
      if (health.checks) console.log(`  checks:  ${JSON.stringify(health.checks)}`);

      if (health.status !== "ok") {
        throw new Error(`Health status is "${health.status}", expected "ok"`);
      }

      if (health.version !== expectedVersion) {
        throw new Error(
          `Version mismatch: got "${health.version}", expected "${expectedVersion}"`
        );
      }

      console.log(`\n✅ Deployment verified successfully`);
      process.exit(0);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.log(`  ❌ ${msg}`);

      if (attempt < maxRetries) {
        const delay = baseDelay * attempt;
        console.log(`  Retrying in ${delay / 1000}s...\n`);
        await sleep(delay);
      }
    }
  }

  console.error(`\n❌ Deployment verification failed after ${maxRetries} attempts`);
  process.exit(1);
}

main();
