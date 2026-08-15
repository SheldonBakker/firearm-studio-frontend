export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public body?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export async function extractErrorMessage(res: Response): Promise<{
  message: string;
  body?: unknown;
}> {
  let body: unknown;
  let message = `${res.status} ${res.statusText}`;
  try {
    body = await res.json();
    if (body && typeof body === "object") {
      const m =
        (body as Record<string, unknown>).detail ??
        (body as Record<string, unknown>).message ??
        (body as Record<string, unknown>).title;
      if (typeof m === "string") message = m;
    }
  } catch {
  }
  return { message, body };
}
