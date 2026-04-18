import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  timeout: 30_000,
  projects: [
    // --- Mockup HTML server (existing) ---
    {
      name: "Mobile Chrome",
      use: {
        ...devices["Pixel 7"],
        baseURL: "http://localhost:3456",
        screenshot: "on",
        video: "on",
        trace: "on",
      },
      testMatch: /^(?!.*\/nextjs\/).*\.spec\.ts$/,
    },
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
  webServer: {
    command: "npx serve mockups -l 3456 --no-clipboard",
    port: 3456,
    reuseExistingServer: true,
  },
  reporter: [["html", { open: "always" }]],
});
