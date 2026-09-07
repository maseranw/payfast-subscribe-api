export type LocalSubscriptionStatus = 'active' | 'paused' | 'cancelled';

export interface SubscriptionUpdateData {
  subscriptionId: string;
  payfastPaymentId?: string;
  payfastToken?: string;
  status: LocalSubscriptionStatus | 'pending';
}

export interface SubscriptionUpdateByTokenData {
  payfastToken: string;
  status: LocalSubscriptionStatus;
}

export interface Subscription {
  id: string;
  payfast_subscription_id?: string;
  payfast_token?: string;
  status: string;
  current_period_start?: string;
  current_period_end?: string;
  cancel_at_period_end?: boolean;
  updated_at: string;
}