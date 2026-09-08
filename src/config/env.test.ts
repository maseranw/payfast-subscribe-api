import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { validateEnv } from "./env";

describe("validateEnv", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(process, "exit").mockImplementation(((code?: number) => {
      throw new Error(`process.exit called with ${code}`);
    }) as never);
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    vi.restoreAllMocks();
  });

  it("exits with code 1 and logs the missing variable when SUPABASE_URL is unset", () => {
    process.env.SUPABASE_URL = "";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "service-role-key";

    expect(() => validateEnv()).toThrow("process.exit called with 1");

    expect(console.error).toHaveBeenCalledWith(
      expect.stringContaining("SUPABASE_URL")
    );
    expect(process.exit).toHaveBeenCalledWith(1);
  });

  it("exits with code 1 and logs the missing variable when SUPABASE_SERVICE_ROLE_KEY is unset", () => {
    process.env.SUPABASE_URL = "https://example.supabase.co";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "";

    expect(() => validateEnv()).toThrow("process.exit called with 1");

    expect(console.error).toHaveBeenCalledWith(
      expect.stringContaining("SUPABASE_SERVICE_ROLE_KEY")
    );
    expect(process.exit).toHaveBeenCalledWith(1);
  });

  it("exits with code 1 and logs the missing variable when SUPABASE_ANON_KEY is unset", () => {
    process.env.SUPABASE_URL = "https://example.supabase.co";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "service-role-key";
    process.env.SUPABASE_ANON_KEY = "";

    expect(() => validateEnv()).toThrow("process.exit called with 1");

    expect(console.error).toHaveBeenCalledWith(
      expect.stringContaining("SUPABASE_ANON_KEY")
    );
    expect(process.exit).toHaveBeenCalledWith(1);
  });

  it("does not exit when all required variables are set", () => {
    process.env.SUPABASE_URL = "https://example.supabase.co";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "service-role-key";
    process.env.SUPABASE_ANON_KEY = "anon-key";
    process.env.NODE_ENV = "development";

    expect(() => validateEnv()).not.toThrow();
    expect(process.exit).not.toHaveBeenCalled();
  });
});
