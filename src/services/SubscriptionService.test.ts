import { describe, it, expect, vi, afterEach } from "vitest";
import { computeNextBillingDate, mapPayfastStatusToLocalStatus } from "./SubscriptionService";

describe("computeNextBillingDate", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("adds one month for a monthly billing cycle", () => {
    const from = new Date("2026-01-15T00:00:00.000Z");
    const result = computeNextBillingDate(from, "monthly");
    expect(result.toISOString()).toBe("2026-02-15T00:00:00.000Z");
  });

  it("adds one year for annual, annually, and yearly billing cycles", () => {
    const from = new Date("2026-01-15T00:00:00.000Z");
    expect(computeNextBillingDate(from, "annual").toISOString()).toBe("2027-01-15T00:00:00.000Z");
    expect(computeNextBillingDate(from, "annually").toISOString()).toBe("2027-01-15T00:00:00.000Z");
    expect(computeNextBillingDate(from, "yearly").toISOString()).toBe("2027-01-15T00:00:00.000Z");
  });

  it("adds seven days for a weekly billing cycle", () => {
    const from = new Date("2026-01-15T00:00:00.000Z");
    const result = computeNextBillingDate(from, "weekly");
    expect(result.toISOString()).toBe("2026-01-22T00:00:00.000Z");
  });

  it("falls back to adding one month and logs a warning for an unrecognized billing cycle", () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const from = new Date("2026-01-15T00:00:00.000Z");

    const result = computeNextBillingDate(from, "fortnightly");

    expect(result.toISOString()).toBe("2026-02-15T00:00:00.000Z");
    expect(errorSpy).toHaveBeenCalledTimes(1);
    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining("fortnightly"));
  });

  it("falls back to adding one month and logs a warning for a null billing cycle", () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const from = new Date("2026-01-15T00:00:00.000Z");

    const result = computeNextBillingDate(from, null);

    expect(result.toISOString()).toBe("2026-02-15T00:00:00.000Z");
    expect(errorSpy).toHaveBeenCalledTimes(1);
  });
});

describe("mapPayfastStatusToLocalStatus", () => {
  it("maps 1 to active", () => {
    expect(mapPayfastStatusToLocalStatus(1)).toBe("active");
  });

  it("maps 2 to paused", () => {
    expect(mapPayfastStatusToLocalStatus(2)).toBe("paused");
  });

  it("maps 3 to cancelled", () => {
    expect(mapPayfastStatusToLocalStatus(3)).toBe("cancelled");
  });

  it("returns undefined for an unrecognized status code", () => {
    expect(mapPayfastStatusToLocalStatus(99)).toBeUndefined();
  });
});
