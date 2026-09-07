export interface PaymentData {
  amount: string;
  item_name: string;
  item_description?: string;
  name_first?: string;
  name_last?: string;
  email_address?: string;
  m_payment_id: string;
}

export interface PayFastResponse {
  paymentData: Record<string, string>;
  payfastUrl: string;
}

export interface CallbackPayload {
  token: string;
  subscriptionId?: string;
  status: number;
  payload: any;
}

export type PaymentUpdateCallback = (itnData: import('@ngelekanyo/payfast-subscribe').PfData) => Promise<void>;
export type CancelCallback = (data: CallbackPayload) => Promise<void>;
export type PauseCallback = (data: CallbackPayload) => Promise<void>;
export type UnpauseCallback = (data: CallbackPayload) => Promise<void>;
export type FetchCallback = (data: CallbackPayload) => Promise<void>;