import { describe, it, expect, vi, beforeEach } from "vitest";

const updateSubscriptionStatus = vi.fn();

vi.mock("../services/SupabaseService", () => ({
  SupabaseService: vi.fn().mockImplementation(() => ({
    updateSubscriptionStatus,
    updateSubscriptionStatusByToken: vi.fn(),
  })),
}));

describe("handlePaymentCreation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "log").mockImplementation(() => {});
  });

  it("acknowledges without activating the subscription for a non-COMPLETE payment status", async () => {
    const { handlePaymentCreation } = await import("./PayFastHandlers");

    await expect(
      handlePaymentCreation({
        m_payment_id: "PAY-1",
        payment_status: "FAILED",
      } as any)
    ).resolves.toBeUndefined();

    expect(updateSubscriptionStatus).not.toHaveBeenCalled();
  });

  it("activates the subscription for a COMPLETE payment status", async () => {
    updateSubscriptionStatus.mockResolvedValue([]);
    const { handlePaymentCreation } = await import("./PayFastHandlers");

    await handlePaymentCreation({
      m_payment_id: "PAY-1",
      pf_payment_id: "PF-1",
      token: "token-1",
      payment_status: "COMPLETE",
    } as any);

    expect(updateSubscriptionStatus).toHaveBeenCalledWith({
      subscriptionId: "PAY-1",
      payfastPaymentId: "PF-1",
      payfastToken: "token-1",
      status: "active",
    });
  });

  it("throws when the Supabase update itself fails for a COMPLETE payment", async () => {
    updateSubscriptionStatus.mockRejectedValue(new Error("db down"));
    const { handlePaymentCreation } = await import("./PayFastHandlers");

    await expect(
      handlePaymentCreation({
        m_payment_id: "PAY-1",
        payment_status: "COMPLETE",
      } as any)
    ).rejects.toThrow("Payment creation processing failed: db down");
  });
});
