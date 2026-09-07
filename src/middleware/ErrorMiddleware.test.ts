import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { Request, Response, NextFunction } from "express";
import { errorMiddleware } from "./ErrorMiddleware";

function buildMockResponse(): Response {
  const res: Partial<Response> = {};
  res.status = vi.fn().mockReturnThis();
  res.json = vi.fn().mockReturnThis();
  return res as Response;
}

describe("errorMiddleware", () => {
  let req: Request;
  let res: Response;
  let next: NextFunction;

  beforeEach(() => {
    req = { method: "POST", url: "/api/payfast/cancel" } as Request;
    res = buildMockResponse();
    next = vi.fn();
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns a 500 with a generic body and no leaked message for a generic error", () => {
    const error = new Error("column subscriptions.plan_id does not exist");

    errorMiddleware(error, req, res, next);

    expect(res.status).toHaveBeenCalledWith(500);
    const body = (res.json as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(body.error).toBe("Internal server error");
    expect(body.error).not.toContain("column");
  });

  it("returns a 404 with a safe generic body for a not-found error", () => {
    const error = new Error("Subscription not found");

    errorMiddleware(error, req, res, next);

    expect(res.status).toHaveBeenCalledWith(404);
    const body = (res.json as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(body.error).toBe("Resource not found");
  });

  it("treats not-found matching case-insensitively", () => {
    const error = new Error("Resource NOT FOUND in database");

    errorMiddleware(error, req, res, next);

    expect(res.status).toHaveBeenCalledWith(404);
  });
});
