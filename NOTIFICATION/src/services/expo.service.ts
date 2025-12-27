import axios from 'axios';
import logger from '@/utils/logger';

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

export interface ExpoMessage {
  to: string;
  title: string;
  body: string;
  data?: { [key: string]: any };
}

export const sendExpoNotification = async (
  tokens: string[],
  title:  string,
  body: string,
  imageUrl?: string
) => {
  try {
    const messages: ExpoMessage[] = tokens.map((token) => {
      const message: any = {
        to: token,
        title,
        body,
        sound: 'default',
      };

      // Add image using richContent if imageUrl is provided
      if (imageUrl) {
        message.richContent = {
          image: imageUrl,
        };
      }

      return message;
    });

    // Expo API accepts array of messages
    const response = await axios.post(EXPO_PUSH_URL, messages, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    logger.info(
      { tokensCount: tokens.length, response: response.data },
      'Expo notification sent'
    );

    return {
      success: true,
      data: response.data,
    };
  } catch (error: any) {
    logger.error({ error: error.message }, 'Expo notification failed');
    return {
      success: false,
      error: error.message,
    };
  }
};

// Optional: Handle Expo push receipts
export const checkExpoReceipts = async (receiptIds: string[]) => {
  try {
    const response = await axios.post(
      'https://exp.host/--/api/v2/push/getReceipts',
      { ids: receiptIds }
    );
    return response.data;
  } catch (error: any) {
    logger.error({ error: error.message }, 'Failed to check receipts');
    throw error;
  }
};
