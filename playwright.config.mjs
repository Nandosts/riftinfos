import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  snapshotPathTemplate: "{testDir}/__screenshots__/{testFilePath}/{arg}{ext}",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 2,
  timeout: 60000,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: "http://127.0.0.1:4179",
    locale: "pt-BR",
    timezoneId: "America/Sao_Paulo",
    animations: "disabled",
    reducedMotion: "reduce",
    trace: "on-first-retry",
  },
  expect: {
    toHaveScreenshot: {
      maxDiffPixels: 0,
      animations: "disabled",
    },
  },
  projects: [
    {
      name: "chromium-desktop",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1280, height: 900 },
        deviceScaleFactor: 1,
      },
    },
    {
      name: "chromium-mobile",
      use: {
        ...devices["Pixel 7"],
        viewport: { width: 390, height: 844 },
        deviceScaleFactor: 1,
      },
    },
  ],
  webServer: {
    command: "python3 -c \"import http.server, socketserver; socketserver.ThreadingTCPServer.allow_reuse_address = True; http.server.test(HandlerClass=http.server.SimpleHTTPRequestHandler, ServerClass=http.server.ThreadingHTTPServer, port=4179, bind='127.0.0.1')\"",
    url: "http://127.0.0.1:4179/index.html",
    reuseExistingServer: false,
    timeout: 15000,
  },
});

