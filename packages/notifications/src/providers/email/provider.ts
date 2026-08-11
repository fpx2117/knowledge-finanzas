export type SendEmailRequest = {
  to: string;
  subject: string;
  html: string;
  text: string;
};

export type SendEmailResult = {
  providerMessageId: string;
};

export interface EmailProvider {
  sendEmail(input: SendEmailRequest): Promise<SendEmailResult>;
}
