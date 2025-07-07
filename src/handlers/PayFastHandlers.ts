import { ITNData, CallbackPayload } from "../interfaces/PayFastInterfaces";
import { SupabaseService } from "../services/SupabaseService";
import { Server as SocketIOServer } from "socket.io";
import { getSocketIOInstance } from "../socket";

const supabaseService = new SupabaseService(
  process.env.SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

export const handlePaymentCreation = async (
  itnData: ITNData
): Promise<void> => {
  try {
    console.log("💰 Payment received:", itnData);
    if (itnData.payment_status !== "COMPLETE") {
      throw new Error("Payment not completed");
    }

    await supabaseService.updateSubscriptionStatus({
      subscriptionId: itnData.m_payment_id,
      payfastPaymentId: itnData.pf_payment_id,
      payfastToken: itnData.token,
      status: "active",
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    throw new Error(`Payment creation processing failed: ${errorMessage}`);
  }
};

export const handleCancel = async (data: CallbackPayload): Promise<void> => {
  try {
    console.log("Cancel callback called:", data);

    if (data.status !== 200) {
      throw new Error(`Cancellation failed with status ${data.status}`);
    }

    if (data.subscriptionId) {
      await supabaseService.updateSubscriptionStatus({
        subscriptionId: data.subscriptionId,
        status: "cancelled",
      });

      const io = getSocketIOInstance();
      io.emit("subscription_cancelled", {
        subscriptionId: data.subscriptionId,
        timestamp: new Date().toISOString(),
      });

      console.log("🛰️ subscription_cancelled event emitted");
    }
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    throw new Error(`Cancel processing failed: ${errorMessage}`);
  }
};

export const handlePause = async (data: CallbackPayload): Promise<void> => {
  try {
    console.log("⏸️ Pause callback called:", data);
    if (data.status !== 200) {
      throw new Error(`Pause failed with status ${data.status}`);
    }

    await supabaseService.updateSubscriptionStatusByToken({
      payfastToken: data.token,
      status: "paused",
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    throw new Error(`Pause processing failed: ${errorMessage}`);
  }
};

export const handleUnpause = async (data: CallbackPayload): Promise<void> => {
  try {
    console.log("▶️ Unpause callback called:", data);
    if (data.status !== 200) {
      throw new Error(`Unpause failed with status ${data.status}`);
    }

    await supabaseService.updateSubscriptionStatusByToken({
      payfastToken: data.token,
      status: "active",
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    throw new Error(`Unpause processing failed: ${errorMessage}`);
  }
};

export const handleFetch = async (data: CallbackPayload): Promise<void> => {
  try {
    console.log("📄 Fetch callback called:", data);
    if (data.status !== 200) {
      throw new Error(`Fetch failed with status ${data.status}`);
    }
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    throw new Error(`Fetch processing failed: ${errorMessage}`);
  }
};
