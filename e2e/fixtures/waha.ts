const WAHA_BASE_URL = process.env.WAHA_BASE_URL ?? "";
const WAHA_SESSION_ID = process.env.WAHA_SESSION_ID ?? "";
const WAHA_API_KEY = process.env.WAHA_API_KEY ?? "";

const INBOUND_DIRECTION = "incoming";

export function chatIdFor(phoneE164: string): string {
  return `${phoneE164.replace(/^\+/, "")}@c.us`;
}

interface WahaMessage {
  body?: string;
  timestamp?: number;
  direction?: string;
}

interface WahaMessagesResponse {
  messages?: WahaMessage[];
  total?: number;
}

function timestampMsOf(message: WahaMessage): number {
  const timestampSeconds = message.timestamp ?? 0;
  return timestampSeconds * 1000;
}

async function fetchMessages(chatId: string, limit: number): Promise<WahaMessage[]> {
  const headers = { "X-API-Key": WAHA_API_KEY, Accept: "application/json" };
  const encoded = encodeURIComponent(chatId);
  const url = `${WAHA_BASE_URL}/api/sessions/${WAHA_SESSION_ID}/messages?chatId=${encoded}&limit=${limit}`;
  const res = await fetch(url, { headers });
  if (!res.ok) {
    throw new Error(`WAHA message read failed with status ${res.status}.`);
  }
  const data = (await res.json()) as WahaMessagesResponse;
  return Array.isArray(data.messages) ? data.messages : [];
}

export async function waitForOtp(opts: {
  phoneE164: string;
  match: RegExp;
  sinceMs: number;
  timeoutMs?: number;
  pollMs?: number;
  limit?: number;
}): Promise<string> {
  const chatId = chatIdFor(opts.phoneE164);
  const timeoutMs = opts.timeoutMs ?? 45_000;
  const pollMs = opts.pollMs ?? 2_000;
  const limit = opts.limit ?? 10;
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    const messages = await fetchMessages(chatId, limit);
    const candidates = messages
      .filter((m) => m.direction === INBOUND_DIRECTION)
      .filter((m) => typeof m.body === "string")
      .filter((m) => timestampMsOf(m) >= opts.sinceMs - 1000)
      .sort((a, b) => timestampMsOf(b) - timestampMsOf(a));
    for (const message of candidates) {
      const found = opts.match.exec(message.body ?? "");
      if (found?.[1]) return found[1];
    }
    await new Promise((resolve) => setTimeout(resolve, pollMs));
  }
  throw new Error(
    `No OTP matching ${opts.match} arrived for chat ${chatId} within ${timeoutMs}ms.`,
  );
}
