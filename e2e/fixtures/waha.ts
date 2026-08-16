const WAHA_BASE_URL = process.env.WAHA_BASE_URL ?? "";
const WAHA_SESSION_ID = process.env.WAHA_SESSION_ID ?? "";
const WAHA_API_KEY = process.env.WAHA_API_KEY ?? "";

export function chatIdFor(phoneE164: string): string {
  return `${phoneE164.replace(/^\+/, "")}@c.us`;
}

interface WahaMessage {
  body?: string;
  timestamp?: number;
}

async function fetchMessages(chatId: string): Promise<WahaMessage[]> {
  const headers = { "X-API-Key": WAHA_API_KEY, Accept: "application/json" };
  const encoded = encodeURIComponent(chatId);
  const primary = `${WAHA_BASE_URL}/api/sessions/${WAHA_SESSION_ID}/chats/${encoded}/messages?limit=10&downloadMedia=false`;
  let res = await fetch(primary, { headers });
  if (res.status === 404) {
    const fallback = `${WAHA_BASE_URL}/api/messages?session=${WAHA_SESSION_ID}&chatId=${encoded}&limit=10&downloadMedia=false`;
    res = await fetch(fallback, { headers });
  }
  if (!res.ok) {
    throw new Error(`WAHA message read failed with status ${res.status}.`);
  }
  const data = (await res.json()) as WahaMessage[];
  return Array.isArray(data) ? data : [];
}

export async function waitForOtp(opts: {
  phoneE164: string;
  match: RegExp;
  since: number;
  timeoutMs?: number;
  pollMs?: number;
}): Promise<string> {
  const chatId = chatIdFor(opts.phoneE164);
  const timeoutMs = opts.timeoutMs ?? 45_000;
  const pollMs = opts.pollMs ?? 2_000;
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    const messages = await fetchMessages(chatId);
    const candidates = messages
      .filter((m) => typeof m.body === "string")
      .filter((m) => (m.timestamp ?? 0) * 1000 >= opts.since - 1000)
      .sort((a, b) => (b.timestamp ?? 0) - (a.timestamp ?? 0));
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
