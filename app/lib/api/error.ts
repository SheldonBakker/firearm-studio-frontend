export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public body?: unknown,
    public code?: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export async function extractErrorMessage(res: Response): Promise<{
  message: string;
  code?: string;
  body?: unknown;
}> {
  let body: unknown;
  let message = `${res.status} ${res.statusText}`;
  let code: string | undefined;
  try {
    body = await res.json();
    if (body && typeof body === "object") {
      const record = body as Record<string, unknown>;
      const m = record.detail ?? record.message ?? record.title;
      if (typeof m === "string") message = m;
      if (typeof record.code === "string") code = record.code;
    }
  } catch {
  }
  return { message, code, body };
}
