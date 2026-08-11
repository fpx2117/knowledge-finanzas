export type SendWhatsAppTemplateRequest = {
  to: string; // E.164, e.g. "+5491122334455"
  contentSid: string;
  variables: Record<string, string>;
};

export type SendWhatsAppTemplateResult = {
  providerMessageId: string;
};

export interface WhatsAppProvider {
  sendTemplateMessage(input: SendWhatsAppTemplateRequest): Promise<SendWhatsAppTemplateResult>;
}
