import { LocalSubscriptionStatus } from "../interfaces/SupabaseInterfaces";

const PAYFAST_SUBSCRIPTION_STATUS_MAP: Record<number, LocalSubscriptionStatus> = {
  1: "active",
  2: "paused",
  3: "cancelled",
};

export function mapPayfastStatusToLocalStatus(
  payfastStatus: number
): LocalSubscriptionStatus | undefined {
  return PAYFAST_SUBSCRIPTION_STATUS_MAP[payfastStatus];
}

export function computeNextBillingDate(fromDate: Date, billingCycle: string | null): Date {
  const nextDate = new Date(fromDate);

  switch (billingCycle) {
    case "weekly":
      nextDate.setDate(nextDate.getDate() + 7);
      return nextDate;
    case "annual":
    case "annually":
    case "yearly":
      nextDate.setFullYear(nextDate.getFullYear() + 1);
      return nextDate;
    case "monthly":
      nextDate.setMonth(nextDate.getMonth() + 1);
      return nextDate;
    default:
      console.error(`Unrecognized billing_cycle "${billingCycle}", defaulting to monthly`);
      nextDate.setMonth(nextDate.getMonth() + 1);
      return nextDate;
  }
}
