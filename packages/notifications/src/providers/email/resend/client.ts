import { NotificationError } from "../../../errors";

const RESEND_API_BASE_URL = "https://api.resend.com";
const DEFAULT_TIMEOUT_MS = 8000;

export type ResendClientConfig = {
  apiKey: string;
  baseUrl?: string;
  timeoutMs?: number;
  fetchImpl?: typeof fetch;
};

export type ResendSendEmailRequest = {
  from: string;
  to: string;
  subject: string;
  html: string;
  text: string;
};

export type ResendSendEmailResponse = { id: string };

export function createResendClient(config: ResendClientConfig) {
  const baseUrl = config.baseUrl ?? RESEND_API_BASE_URL;
  const timeoutMs = config.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const fetchImpl = config.fetchImpl ?? fetch;

  return {
    async sendEmail(body: ResendSendEmailRequest): Promise<ResendSendEmailResponse> {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), timeoutMs);
      let response: Response;

      try {
        response = await fetchImpl(`${baseUrl}/emails`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${config.apiKey}`,
          },
          body: JSON.stringify(body),
          signal: controller.signal,
        });
      } catch (error) {
        throw new NotificationError("NOTIFICATION_PROVIDER_ERROR", { cause: error });
      } finally {
        clearTimeout(timeout);
      }

      if (response.status === 422 || response.status === 400) {
        // Resend rejects malformed/unverified recipients with 4xx — never worth retrying.
        throw new NotificationError("NOTIFICATION_INVALID_RECIPIENT", { cause: await safeReadBody(response) });
      }

      if (!response.ok) {
        throw new NotificationError("NOTIFICATION_PROVIDER_ERROR", { cause: await safeReadBody(response) });
      }

      return response.json() as Promise<ResendSendEmailResponse>;
    },
  };
}

async function safeReadBody(response: Response) {
  try {
    return await response.text();
  } catch {
    return undefined;
  }
}
