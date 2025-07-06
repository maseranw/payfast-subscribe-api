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

export interface ITNData {
  m_payment_id: string;
  pf_payment_id: string;
  payment_status: string;
  item_name: string;
  item_description: string;
  amount_gross: string;
  amount_fee: string;
  amount_net: string;
  custom_str1: string;
  custom_str2: string;
  custom_str3: string;
  custom_str4: string;
  custom_int1: string;
  custom_int2: string;
  custom_int3: string;
  custom_int4: string;
  custom_int5: string;
  name_first: string;
  name_last: string;
  email_address: string;
  merchant_id: string;
  token: string;
  billing_date: string;
  signature: string;
}
export interface CallbackPayload {
  token: string;
  subscriptionId?: string;
  status: number;
  payload: any;
}

export type PaymentUpdateCallback = (itnData: ITNData) => Promise<void>;
export type CancelCallback = (data: CallbackPayload) => Promise<void>;
export type PauseCallback = (data: CallbackPayload) => Promise<void>;
export type UnpauseCallback = (data: CallbackPayload) => Promise<void>;
export type FetchCallback = (data: CallbackPayload) => Promise<void>;