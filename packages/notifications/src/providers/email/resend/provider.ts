import type { EmailProvider, SendEmailRequest, SendEmailResult } from "../provider";
import { createResendClient, type ResendClientConfig } from "./client";

export function createResendEmailProvider(config: ResendClientConfig & { fromEmail: string }): EmailProvider {
  const client = createResendClient(config);

  return {
    async sendEmail(input: SendEmailRequest): Promise<SendEmailResult> {
      const response = await client.sendEmail({ from: config.fromEmail, to: input.to, subject: input.subject, html: input.html, text: input.text });
      return { providerMessageId: response.id };
    },
  };
}
