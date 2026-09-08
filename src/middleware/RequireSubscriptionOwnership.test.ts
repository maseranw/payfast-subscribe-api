import { describe, it, expect, vi, beforeEach } from "vitest";
import { Request, Response, NextFunction } from "express";

const getUser = vi.fn();
const getSubscriptionOwnerByToken = vi.fn();

vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn().mockImplementation(() => ({
    auth: { getUser },
  })),
}));

vi.mock("../services/SupabaseService", () => ({
  SupabaseService: vi.fn().mockImplementation(() => ({
    getSubscriptionOwnerByToken,
  })),
}));

function buildMockResponse(): Response {
  const res: Partial<Response> = {};
  res.status = vi.fn().mockReturnThis();
  res.json = vi.fn().mockReturnThis();
  return res as Response;
}

describe("requireSubscriptionOwnership", () => {
  let res: Response;
  let next: NextFunction;

  beforeEach(async () => {
    vi.clearAllMocks();
    res = buildMockResponse();
    next = vi.fn();
  });

  async function loadMiddleware() {
    const mod = await import("./RequireSubscriptionOwnership");
    return mod.requireSubscriptionOwnership;
  }

  it("rejects with 401 when the Authorization header is missing", async () => {
    const requireSubscriptionOwnership = await loadMiddleware();
    const req = { headers: {}, params: { token: "tok-1" } } as unknown as Request;

    await requireSubscriptionOwnership(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it("rejects with 401 when the session token is invalid", async () => {
    getUser.mockResolvedValue({ data: { user: null }, error: { message: "invalid" } });
    const requireSubscriptionOwnership = await loadMiddleware();
    const req = {
      headers: { authorization: "Bearer bad-token" },
      params: { token: "tok-1" },
    } as unknown as Request;

    await requireSubscriptionOwnership(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it("rejects with 404 when the subscription token has no owner on record", async () => {
    getUser.mockResolvedValue({ data: { user: { id: "user-1" } }, error: null });
    getSubscriptionOwnerByToken.mockResolvedValue(null);
    const requireSubscriptionOwnership = await loadMiddleware();
    const req = {
      headers: { authorization: "Bearer good-token" },
      params: { token: "tok-1" },
    } as unknown as Request;

    await requireSubscriptionOwnership(req, res, next);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(next).not.toHaveBeenCalled();
  });

  it("rejects with 403 when the caller does not own the subscription", async () => {
    getUser.mockResolvedValue({ data: { user: { id: "user-1" } }, error: null });
    getSubscriptionOwnerByToken.mockResolvedValue("user-2");
    const requireSubscriptionOwnership = await loadMiddleware();
    const req = {
      headers: { authorization: "Bearer good-token" },
      params: { token: "tok-1" },
    } as unknown as Request;

    await requireSubscriptionOwnership(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  it("calls next when the caller owns the subscription", async () => {
    getUser.mockResolvedValue({ data: { user: { id: "user-1" } }, error: null });
    getSubscriptionOwnerByToken.mockResolvedValue("user-1");
    const requireSubscriptionOwnership = await loadMiddleware();
    const req = {
      headers: { authorization: "Bearer good-token" },
      params: { token: "tok-1" },
    } as unknown as Request;

    await requireSubscriptionOwnership(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });
});
