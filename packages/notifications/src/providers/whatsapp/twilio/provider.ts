import type { SendWhatsAppTemplateRequest, SendWhatsAppTemplateResult, WhatsAppProvider } from "../provider";
import { createTwilioClient, type TwilioClientConfig } from "./client";

export function createTwilioWhatsAppProvider(config: TwilioClientConfig & { fromNumber: string }): WhatsAppProvider {
  const client = createTwilioClient(config);

  return {
    async sendTemplateMessage(input: SendWhatsAppTemplateRequest): Promise<SendWhatsAppTemplateResult> {
      const response = await client.createMessage({ from: config.fromNumber, to: input.to, contentSid: input.contentSid, contentVariables: input.variables });
      return { providerMessageId: response.sid };
    },
  };
}
