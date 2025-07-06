import { createClient, SupabaseClient } from "@supabase/supabase-js";
import {
  SubscriptionUpdateData,
  SubscriptionUpdateByTokenData,
  Subscription,
} from "../interfaces/SupabaseInterfaces";

export class SupabaseService {
  private supabase: SupabaseClient;

  constructor(url: string, serviceRoleKey: string) {
    if (!url || !serviceRoleKey) {
      throw new Error("Supabase URL and service role key are required");
    }
    this.supabase = createClient(url, serviceRoleKey);
  }

  async updateSubscriptionStatus(
    data: SubscriptionUpdateData
  ): Promise<Subscription[]> {
    const { subscriptionId, payfastPaymentId, payfastToken, status } = data;

    if (!subscriptionId) {
      throw new Error("Subscription ID is required");
    }

    // Fetch existing subscription
    const { data: existingSub, error: fetchError } = await this.supabase
      .from("subscriptions")
      .select("*")
      .eq("id", subscriptionId)
      .maybeSingle();

    if (fetchError) {
      throw new Error(`Failed to fetch subscription: ${fetchError.message}`);
    }
    if (!existingSub) {
      throw new Error("Subscription not found");
    }

    // Build update payload
    const currentDate = new Date();
    const nextBillingDate = new Date(currentDate);
    nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);

    const updateData: Partial<Subscription> = {
      status,
      payfast_subscription_id: payfastPaymentId,
      updated_at: currentDate.toISOString(),
    };

    if (payfastToken) {
      updateData.payfast_token = payfastToken;
    }

    if (status === "active") {
      updateData.current_period_start = currentDate.toISOString();
      updateData.current_period_end = nextBillingDate.toISOString();
    }
    if (status === "cancelled") {
      updateData.cancel_at_period_end = true;
    }

    // Update subscription
    const { data: subscriptionData, error: subscriptionError } =
      await this.supabase
        .from("subscriptions")
        .update(updateData)
        .eq("id", subscriptionId)
        .select();

    if (subscriptionError) {
      throw new Error(
        `Failed to update subscription: ${subscriptionError.message}`
      );
    }

    return subscriptionData as Subscription[];
  }

  async updateSubscriptionStatusByToken(
    subscriptionUpdateByTokenData: SubscriptionUpdateByTokenData
  ): Promise<Subscription[]> {
    const { payfastToken, status } = subscriptionUpdateByTokenData;

    if (!payfastToken) {
      throw new Error("PayFast token is required");
    }

    // Fetch the subscription by token
    const { data: existingSub, error: fetchError } = await this.supabase
      .from("subscriptions")
      .select("*")
      .eq("payfast_token", payfastToken)
      .maybeSingle();

    if (fetchError) {
      throw new Error(`Failed to fetch subscription: ${fetchError.message}`);
    }
    if (!existingSub) {
      throw new Error("Subscription not found");
    }

    const updateData: Partial<Subscription> = {
      status,
      updated_at: new Date().toISOString(),
    };

    const { data, error: updateError } = await this.supabase
      .from("subscriptions")
      .update(updateData)
      .eq("payfast_token", payfastToken)
      .select();

    if (updateError) {
      throw new Error(`Failed to update subscription: ${updateError.message}`);
    }

    return data as Subscription[];
  }
}
