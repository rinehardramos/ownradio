import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  timeout: 30_000,
  projects: [
    // --- Next.js app ---
    {
      name: "nextjs-app",
      use: {
        ...devices["Pixel 7"],
        baseURL: "http://localhost:3000",
        screenshot: "on",
        video: "on",
        trace: "on",
      },
      testMatch: "**/nextjs/**/*.spec.ts",
    },
  ],
  reporter: [["html", { open: "always" }]],
});
