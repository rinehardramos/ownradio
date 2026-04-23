const API_URL = process.env.NEXT_PUBLIC_API_URL;

export async function GET() {
  let apiHealth: Record<string, unknown> | null = null;

  if (API_URL) {
    try {
      const res = await fetch(`${API_URL}/health`, {
        signal: AbortSignal.timeout(5000),
        cache: "no-store",
      });
      apiHealth = (await res.json()) as Record<string, unknown>;
    } catch (e) {
      apiHealth = { status: "unreachable", error: String(e) };
    }
  }

  const ok = apiHealth?.status === "ok";

  return Response.json(
    {
      status: ok ? "ok" : "degraded",
      version: process.env.NEXT_PUBLIC_BUILD_VERSION || "dev",
      timestamp: new Date().toISOString(),
      checks: {
        apiUrl: API_URL || "NOT_SET",
        apiConnectivity: apiHealth ? apiHealth.status : "not_configured",
      },
    },
    { status: ok ? 200 : 503 }
  );
}
