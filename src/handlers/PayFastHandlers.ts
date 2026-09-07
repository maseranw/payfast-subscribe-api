import { PfData } from '@ngelekanyo/payfast-subscribe';
import { CallbackPayload } from '../interfaces/PayFastInterfaces';
import { SupabaseService } from '../services/SupabaseService';
import { mapPayfastStatusToLocalStatus } from '../services/SubscriptionService';

const supabaseService = new SupabaseService(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export const handlePaymentCreation = async (itnData: PfData): Promise<void> => {
  try {
    console.log('Payment received:', itnData);
    if (itnData.payment_status !== 'COMPLETE') {
      throw new Error('Payment not completed');
    }

    await supabaseService.updateSubscriptionStatus({
      subscriptionId: itnData.m_payment_id,
      payfastPaymentId: itnData.pf_payment_id,
      payfastToken: itnData.token,
      status: 'active',
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Payment creation processing failed: ${errorMessage}`);
  }
};

export const handleCancel = async (data: CallbackPayload): Promise<void> => {
  try {
    console.log('Cancel callback called:', data);
    if (data.status !== 200) {
      throw new Error(`Cancellation failed with status ${data.status}`);
    }

    if (data.subscriptionId) {
      await supabaseService.updateSubscriptionStatus({
        subscriptionId: data.subscriptionId,
        status: 'cancelled',
      });
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message: 'Unknown error';
    throw new Error(`Cancel processing failed: ${errorMessage}`);
  }
};

export const handlePause = async (data: CallbackPayload): Promise<void> => {
  try {
    console.log('Pause callback called:', data);
    if (data.status !== 200) {
      throw new Error(`Pause failed with status ${data.status}`);
    }

    await supabaseService.updateSubscriptionStatusByToken({
      payfastToken: data.token,
      status: 'paused',
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Pause processing failed: ${errorMessage}`);
  }
};

export const handleUnpause = async (data: CallbackPayload): Promise<void> => {
  try {
    console.log('Unpause callback called:', data);
    if (data.status !== 200) {
      throw new Error(`Unpause failed with status ${data.status}`);
    }

    await supabaseService.updateSubscriptionStatusByToken({
      payfastToken: data.token,
      status: 'active',
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Unpause processing failed: ${errorMessage}`);
  }
};

export const handleFetch = async (data: CallbackPayload): Promise<void> => {
  try {
    console.log('Fetch callback called:', data);
    if (data.status !== 200) {
      throw new Error(`Fetch failed with status ${data.status}`);
    }

    const subscriptionResponse = data.payload?.data?.response ?? data.payload?.response ?? data.payload ?? {};
    const payfastStatus = subscriptionResponse.status;
    const mappedStatus = mapPayfastStatusToLocalStatus(payfastStatus);

    if (!mappedStatus) {
      console.error(`Fetch processing skipped: unrecognized PayFast subscription status "${payfastStatus}"`);
      return;
    }

    if (!data.token) {
      throw new Error('PayFast token missing from fetch callback');
    }

    await supabaseService.updateSubscriptionStatusByToken({
      payfastToken: data.token,
      status: mappedStatus,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Fetch processing failed: ${errorMessage}`);
  }
};