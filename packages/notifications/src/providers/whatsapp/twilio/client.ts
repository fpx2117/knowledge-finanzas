import { NotificationError } from "../../../errors";

const TWILIO_API_BASE_URL = "https://api.twilio.com/2010-04-01";
const DEFAULT_TIMEOUT_MS = 8000;

export type TwilioClientConfig = {
  accountSid: string;
  authToken: string;
  baseUrl?: string;
  timeoutMs?: number;
  fetchImpl?: typeof fetch;
};

export type TwilioCreateMessageRequest = {
  from: string;
  to: string;
  contentSid: string;
  contentVariables: Record<string, string>;
};

export type TwilioCreateMessageResponse = { sid: string };

export function createTwilioClient(config: TwilioClientConfig) {
  const baseUrl = config.baseUrl ?? TWILIO_API_BASE_URL;
  const timeoutMs = config.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const fetchImpl = config.fetchImpl ?? fetch;
  const basicAuth = Buffer.from(`${config.accountSid}:${config.authToken}`).toString("base64");

  return {
    async createMessage(body: TwilioCreateMessageRequest): Promise<TwilioCreateMessageResponse> {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), timeoutMs);
      let response: Response;

      const form = new URLSearchParams({
        From: `whatsapp:${body.from}`,
        To: `whatsapp:${body.to}`,
        ContentSid: body.contentSid,
        ContentVariables: JSON.stringify(body.contentVariables),
      });

      try {
        response = await fetchImpl(`${baseUrl}/Accounts/${encodeURIComponent(config.accountSid)}/Messages.json`, {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Authorization: `Basic ${basicAuth}`,
          },
          body: form.toString(),
          signal: controller.signal,
        });
      } catch (error) {
        throw new NotificationError("WHATSAPP_PROVIDER_ERROR", { cause: error });
      } finally {
        clearTimeout(timeout);
      }

      if (response.status === 400 || response.status === 404) {
        // Malformed/unverified recipient or unknown Content SID — never worth retrying as-is.
        throw new NotificationError("NOTIFICATION_INVALID_RECIPIENT", { cause: await safeReadBody(response) });
      }

      if (!response.ok) {
        throw new NotificationError("WHATSAPP_PROVIDER_ERROR", { cause: await safeReadBody(response) });
      }

      return response.json() as Promise<TwilioCreateMessageResponse>;
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
