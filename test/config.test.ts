import { describe, it, expect } from "vitest";
import { parseArgs, loadConfig } from "../src/config.js";

describe("Server Config & CLI Parsing", () => {
  it("parses CLI flags correctly", () => {
    const config = parseArgs([
      "--url",
      "https://chemist.example.com/api/v1",
      "--api-key",
      "secret-token",
      "--timeout",
      "30000"
    ]);

    expect(config.apiUrl).toBe("https://chemist.example.com/api/v1");
    expect(config.apiKey).toBe("secret-token");
    expect(config.timeoutMs).toBe(30000);
  });

  it("handles shorthand CLI flags", () => {
    const config = parseArgs(["-u", "http://chemist-local:3000/api/v1", "-k", "tok", "-t", "45000", "-h"]);
    expect(config.apiUrl).toBe("http://chemist-local:3000/api/v1");
    expect(config.apiKey).toBe("tok");
    expect(config.timeoutMs).toBe(45000);
    expect(config.showHelp).toBe(true);
  });

  it("falls back to default apiUrl and timeoutMs", () => {
    const config = loadConfig([]);
    expect(config.apiUrl).toBe("http://localhost:3000/api/v1");
    expect(config.timeoutMs).toBe(60000);
  });
});
