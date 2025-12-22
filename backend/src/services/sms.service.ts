import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { formatToInternationalPhoneNumber } from './utils';
import axios from 'axios';

@Injectable()
export class SmsService {
  constructor(private readonly httpService: HttpService) {}

  async sendSMS(phoneNumber: string, message: string): Promise<void> {
    try {
      // Format phone number to international format
      let formattedPhone = phoneNumber;

      // Remove any non-digit characters
      formattedPhone = formattedPhone.replace(/\D/g, '');

      // If it starts with 0, replace with +234 (Nigeria)
      if (formattedPhone.startsWith('0')) {
        formattedPhone = formattedPhone.replace(/^0/, '+234');
      }
      // If it doesn't start with +, add +234
      else if (!formattedPhone.startsWith('+')) {
        formattedPhone = `+234${formattedPhone}`;
      }

      // Termii API configuration
      const termiiConfig = {
        apiKey: process.env.TERMII_API_KEY,
        senderId: process.env.TERMII_SENDER_ID || 'Greencard',
        type: 'plain',
        channel: 'generic',
      };

      // Prepare the request payload
      const payload = {
        to: formattedPhone,
        from: termiiConfig.senderId,
        sms: message,
        type: termiiConfig.type,
        channel: termiiConfig.channel,
        api_key: termiiConfig.apiKey,
      };

      // Make the API request to Termii
      const response = await axios.post(
        'https://api.ng.termii.com/api/sms/send',
        payload,
        {
          headers: {
            'Content-Type': 'application/json',
          },
        },
      );

      if (response.data.code === 'ok') {
        // SMS sent successfully
      } else {
        throw new Error(`Termii API error: ${response.data.message}`);
      }
    } catch (error) {
      throw new Error(`Failed to send SMS: ${error.message}`);
    }
  }
}
