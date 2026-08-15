# Frontend auth-contract update - design spec

Date: 2026-08-16
Repo (frontend): `/Users/sheldonbakker/Documents/firearm-studio-frontend`
Contract source of truth (backend): `/Users/sheldonbakker/Documents/firearm-studio-backend`

This spec updates the frontend to consume the backend's new WhatsApp-OTP / two-factor / phone-management auth contract. The design is approved; this document makes it implementable without further design decisions. Every field name, route, status code, and error code below was read from the backend source, not from a summary.

Stack facts confirmed in the frontend: React 19, React Router v8 (config-based routes in `app/routes.ts`, flat files under `app/routes/`), TypeScript strict, Vite on Cloudflare Workers, Tailwind v4, shadcn/ui, Zod v4, plain React state for forms, React Context for auth (no TanStack Query), Sonner for toasts. No test infrastructure exists yet.

The API emits **camelCase** JSON (ASP.NET Core default; no `JsonSerializerOptions` override exists). All routes are versioned under `/api/v1`. The frontend already sends the shared key as header `X-Api-Key` (from `VITE_API_KEY`) and the base URL from `VITE_API_BASE_URL`.

---

## 1. Contract reference (verified against backend)

Error bodies are RFC7807 `ProblemDetails`. `ErrorOrExtensions.ToActionResult` sets `problem.Extensions["code"] = error.Code`, which System.Text.Json flattens to a **top-level** JSON property named `code`. So every error body looks like:

```json
{ "detail": "Human readable message.", "status": 400, "code": "Auth.PreAuthInvalid" }
```

Status mapping (from `ErrorOrExtensions.StatusCode`): custom type `UpstreamFailure` -> **502**, custom type `Throttled` -> **429**, then `Validation`->400, `Unauthorized`->401, `Forbidden`->403, `NotFound`->404, `Conflict`->409, `Failure`->500.

### 1.1 POST `/api/v1/auth/login`  (anonymous)
Request: `{ "email": string, "password": string }`
Success: **200**. Body is **one of two shapes** (both returned with 200 `Ok(...)`):
- Tokens: `{ "accessToken": string, "refreshToken": string, "accessExpiresAt": string(ISO-8601) }`
- Challenge: `{ "requiresTwoFactor": true, "preAuthToken": string }`
Errors: `Auth.InvalidCredentials` (401), `Auth.LockedOut` (403), `Auth.EmailNotConfirmed` (403), `Auth.ChallengeUnavailable` (429, when the 2FA code could not be issued due to throttling), plus validation 400 for empty email/password.

### 1.2 POST `/api/v1/auth/login/verify`  (anonymous)
Request: `{ "preAuthToken": string, "code": string(6 digits) }`
Success: **200**, body = tokens shape (`accessToken`, `refreshToken`, `accessExpiresAt`).
Errors: `Auth.PreAuthInvalid` (401), `Auth.CodeExpired` (400), `Auth.CodeAttemptsExceeded` (400), `Auth.CodeInvalid` (400), plus validation 400 (`preAuthToken` empty, `code` not 6 digits).

### 1.3 POST `/api/v1/auth/two-factor/enable`  (**Authorize** - bearer required)
Request: no body.
Success: **204** No Content.
Errors: 401 if unauthenticated.

### 1.4 POST `/api/v1/auth/two-factor/disable`  (**Authorize** - bearer required)
Request: `{ "password": string }`
Success: **204** No Content.
Errors: `Auth.LockedOut` (403), `Auth.InvalidCredentials` (401), plus validation 400 (empty password).

### 1.5 POST `/api/v1/users/me/phone`  (**Authorize** - bearer required)
Request: `{ "phoneNumber": string(E.164) }`
Success: **202** Accepted, body `{ "message": string }`.
Errors: `Auth.ChallengeUnavailable` (429, throttled), `Auth.PhoneChannelUnavailable` (**502**, WhatsApp send failed), `Auth.InvalidCredentials` (401, only if the account has no email on file), plus validation 400 (E.164 regex).

### 1.6 POST `/api/v1/users/me/phone/verify`  (**Authorize** - bearer required)
Request: `{ "code": string(6 digits) }`
Success: **204** No Content.
Errors: `Auth.CodeExpired` / `Auth.CodeAttemptsExceeded` / `Auth.CodeInvalid` (400), `Auth.NoPendingPhoneChange` (400), plus validation 400 (code not 6 digits).

### 1.7 POST `/api/v1/auth/register`  (anonymous) - phone added
Request: `{ "email": string, "password": string, "phoneNumber"?: string(E.164) | null }`
Success: **202** Accepted, body `{ "message": string }`.
Errors: `Auth.RegistrationFailed` (400), plus validation 400 (email, password min length 12, and E.164 when `phoneNumber` is non-empty).

### 1.8 POST `/api/v1/auth/accept-invite`  (anonymous) - phone added
Request: `{ "email": string, "code": string(6 digits), "password": string, "phoneNumber"?: string(E.164) | null }`
Success: **200**, body = tokens shape.
Errors: `Auth.CodeInvalid` / `Auth.CodeExpired` / `Auth.CodeAttemptsExceeded` (400), `Auth.PasswordRejected` (400), plus validation 400.

### 1.9 POST `/api/v1/users/invite`  (**Authorize**, Admin role) - phone added
Request: `{ "email": string, "fullName"?: string | null, "role": AppRole, "phoneNumber"?: string(E.164) | null }`
Success: **201** Created, body = `AppUserResponse` (now includes `phoneNumber`).
Errors: validation 400 (email, role in enum, E.164 when non-empty).

### 1.10 POST `/api/v1/auth/resend-code`  (anonymous) - now restricted
Request: `{ "email": string, "purpose": string }`
Success: **202** Accepted, body `{ "message": string }`.
Behaviour change: purposes `TwoFactor` and `PhoneChange` are now **rejected** with `Auth.PurposeNotResendable` (400). Also `Auth.UnknownPurpose` (400) for unparseable purpose. The frontend must keep sending only `EmailConfirmation` / `PasswordReset` / `Invite`.

### 1.11 GET `/api/v1/me`  (**Authorize**) - EXTENDED
Body: `{ "id": string(guid), "email": string | null, "roles": string[] | null, "twoFactorEnabled": boolean, "phoneNumber": string | null, "phoneNumberConfirmed": boolean, "pendingPhoneNumber": string | null }`.
The four new fields (`twoFactorEnabled`, `phoneNumber`, `phoneNumberConfirmed`, `pendingPhoneNumber`) are appended after the existing members; `id`, `email`, and `roles` are unchanged in name, order, and value. JSON stays camelCase. These fields authoritatively drive the Settings Security panel (section 7): current 2FA state, the confirmed/unconfirmed phone, and any interrupted phone change to resume.

### 1.12 `AppUserResponse` (returned by `/api/v1/users` list and `/api/v1/users/invite`)
Now: `{ "id", "email", "fullName", "role", "isActive", "isLinked", "phoneNumber": string | null }`.

### 1.13 Phone format the backend accepts
Backend `PhoneNumberFormat.E164Pattern`:
```
^\+[1-9]\d{7,14}\z
```
Meaning: literal `+`, first digit `1-9`, then 7 to 14 more digits (total 8-15 digits) - any international E.164 number. The frontend now sends genuine international E.164, validated per-country with `libphonenumber-js` (section 8). Every value it emits is a valid, formatted E.164 number for the selected country, which is always within this backend pattern. See section 8 for the app-wide international phone input and Risk R2 for the dependency trade-off.

---

## 2. Prerequisites (blocking e2e)

Two backend migrations are **generated but UNAPPLIED**:
- `src/FirearmStudio.Infrastructure/Identity/Migrations/20260815161910_AddWhatsAppOtpAndPhoneChange.cs` (Identity/auth DB: pending-phone-change, WhatsApp OTP purposes).
- `src/FirearmStudio.Infrastructure/Migrations/20260815161921_AddAppUserPhoneNumber.cs` (app DB: `AppUser.PhoneNumber`).

Until the user applies both against the target database and restarts the API, the new endpoints will fail at runtime (missing columns). **Playwright e2e cannot pass before this step.** The user owns applying migrations (manual apply-then-restart against self-hosted Postgres). Unit-free frontend work (sections 3-8) can proceed and be typechecked without the migrations; only the e2e suite (section 9) is gated.

---

## 3. API layer

### 3.1 New shared types
Add to `app/lib/api/auth.ts` (next to `AuthTokens`):

```ts
export interface TwoFactorChallenge {
  requiresTwoFactor: true;
  preAuthToken: string;
}

export type LoginResult =
  | { kind: "tokens"; tokens: AuthTokens }
  | { kind: "challenge"; preAuthToken: string };
```

Discriminator helper (module-private in `auth.ts`):

```ts
function isTwoFactorChallenge(body: unknown): body is TwoFactorChallenge {
  return (
    typeof body === "object" &&
    body !== null &&
    (body as Record<string, unknown>).requiresTwoFactor === true &&
    typeof (body as Record<string, unknown>).preAuthToken === "string"
  );
}
```

Rationale for discriminating on `requiresTwoFactor`: the backend returns the challenge via `Ok(outcome.Challenge)` where `Challenge` is `TwoFactorChallengeResponse(RequiresTwoFactor: true, PreAuthToken: ...)`. Both branches are HTTP 200, so the body shape is the only signal. `requiresTwoFactor` is present and `true` only on the challenge; the tokens shape has no such field.

### 3.2 `authApi` changes (anonymous calls) in `app/lib/api/auth.ts`
`login` and `loginVerify` are anonymous and must use the existing module-private `authRequest` (which sends `X-Api-Key` but no bearer). `login` must **not** persist tokens on a challenge; it persists only when tokens are returned. `loginVerify` persists tokens on success.

Replace the current `login` with, and add `loginVerify`:

```ts
login: async (email: string, password: string): Promise<LoginResult> => {
  const body = await authRequest<AuthTokens | TwoFactorChallenge>(
    "/api/v1/auth/login",
    { email, password },
  );
  if (isTwoFactorChallenge(body)) {
    return { kind: "challenge", preAuthToken: body.preAuthToken };
  }
  storeTokens(body);
  return { kind: "tokens", tokens: body };
},

loginVerify: async (preAuthToken: string, code: string): Promise<AuthTokens> => {
  const tokens = await authRequest<AuthTokens>("/api/v1/auth/login/verify", {
    preAuthToken,
    code,
  });
  storeTokens(tokens);
  return tokens;
},
```

Add optional phone to `register` and `acceptInvite` (send `phoneNumber` only when non-empty; omit or send `null` otherwise - backend treats null/empty identically):

```ts
register: (email: string, password: string, phoneNumber?: string | null) =>
  authRequest<void>("/api/v1/auth/register", {
    email,
    password,
    phoneNumber: phoneNumber ? phoneNumber : null,
  }),

acceptInvite: async (
  email: string,
  code: string,
  password: string,
  phoneNumber?: string | null,
) => {
  const tokens = await authRequest<AuthTokens>("/api/v1/auth/accept-invite", {
    email,
    code,
    password,
    phoneNumber: phoneNumber ? phoneNumber : null,
  });
  storeTokens(tokens);
  return tokens;
},
```

Leave `resendCode`'s purpose union unchanged (`"EmailConfirmation" | "PasswordReset" | "Invite"`). Do not add `TwoFactor` or `PhoneChange`.

### 3.3 Authenticated calls (two-factor + phone) in `app/lib/api/me/me.ts`
`enable/disable two-factor` and `me/phone` + `me/phone/verify` are all `[Authorize]` and must use the authenticated `request` wrapper from `app/lib/api/http.ts` (bearer + 401 refresh-and-retry). They must **not** use `authApi`'s `authRequest`, which sends no bearer.

Placement decision: put all four in `meApi` in `app/lib/api/me/me.ts`, not in `authApi` and not in `usersApi`.
- Rationale 1 (import cycle): `http.ts` imports from `auth.ts`. If `auth.ts` imported `request` from `http.ts`, that is a cycle. `me.ts` already imports `request` from `../http` with no cycle.
- Rationale 2 (domain): these are self-service actions on the current authenticated user (the URL is `/users/me/...`). `usersApi` is strictly admin management of *other* users (list/invite/role/deactivate). `meApi` already models "the current user" (`meApi.me()`).

Extend `meApi`:

```ts
export const meApi = {
  me: () => request<CurrentUserResponse>("/api/v1/me"),
  adminCheck: () => request<AdminCheckResponse>("/api/v1/me/admin-check"),

  enableTwoFactor: () =>
    request<void>("/api/v1/auth/two-factor/enable", { method: "POST" }),

  disableTwoFactor: (password: string) =>
    request<void>("/api/v1/auth/two-factor/disable", {
      method: "POST",
      body: { password },
    }),

  updatePhone: (phoneNumber: string) =>
    request<void>("/api/v1/users/me/phone", {
      method: "POST",
      body: { phoneNumber },
    }),

  verifyPhone: (code: string) =>
    request<void>("/api/v1/users/me/phone/verify", {
      method: "POST",
      body: { code },
    }),
};
```

Note: `enableTwoFactor`/`disableTwoFactor` live in `meApi` even though their URL is under `/auth`, because they are authenticated current-user actions. This is documented here so the placement is not re-litigated.

### 3.4 User response type in `app/lib/api/users/types.ts`
Add `phoneNumber` to both request and response:

```ts
export interface InviteUserRequest {
  email?: string | null;
  fullName?: string | null;
  role?: AppRole | null;
  phoneNumber?: string | null;
}

export interface UserResponse {
  id: string;
  email: string;
  fullName: string | null;
  role: AppRole | string;
  isActive: boolean;
  isLinked: boolean;
  phoneNumber: string | null;
  [k: string]: unknown;
}
```

`usersApi.invite` already forwards a typed `InviteUserRequest` body, so no change to `users.ts` beyond types.

### 3.5 Current-user response type in `app/lib/api/me/types.ts`
`GET /api/v1/me` now returns four extra fields. Update `CurrentUserResponse`:

```ts
export interface CurrentUserResponse {
  id: string;
  email: string | null;
  roles: string[] | null;
  twoFactorEnabled: boolean;
  phoneNumber: string | null;
  phoneNumberConfirmed: boolean;
  pendingPhoneNumber: string | null;
}
```

`AdminCheckResponse` is unchanged. The session store (`session-store.ts`) uses only `id`, `email`, and `roles` from `meApi.me()`, so the added fields do not affect it; the Settings loader (section 7) reads the new fields.

---

## 4. Error handling

### 4.1 `ApiError` gains a `code` field - `app/lib/api/error.ts`
```ts
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
```

`extractErrorMessage` must also surface the top-level `code`:

```ts
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
```

The empty `catch` is intentional (matching the existing file): a non-JSON error body leaves the status-line message in place. Update the two throw sites that build `ApiError` from `extractErrorMessage` to pass `code`:
- `app/lib/api/http.ts` in `request` and `requestBlob`: `throw new ApiError(res.status, message, body, code);` (destructure `code` from `extractErrorMessage`).
- `app/lib/api/auth.ts` in `authRequest`: `throw new ApiError(res.status, message, errBody, code);`.

The manual `new ApiError(401, "Unauthorized")` in `http.ts` stays as-is (no code).

### 4.2 Error-code to copy mapping - new file `app/lib/api/auth-errors.ts`
Status-based checks take priority over code-based, then code map, then the backend `detail` (already in `err.message`) as the final fallback.

```ts
import { ApiError } from "./error";

const CODE_COPY: Record<string, string> = {
  "Auth.InvalidCredentials": "Email address or password is incorrect.",
  "Auth.EmailNotConfirmed":
    "Confirm your email address first. Request a new code if yours has expired.",
  "Auth.LockedOut":
    "This account is temporarily locked after too many failed attempts. Try again later.",
  "Auth.RegistrationFailed":
    "We couldn't create that account. Check your details and try again.",
  "Auth.CodeInvalid": "That code isn't valid. Check it and try again.",
  "Auth.CodeExpired": "That code has expired. Request a new one.",
  "Auth.CodeAttemptsExceeded":
    "Too many incorrect attempts. Request a new code.",
  "Auth.RefreshInvalid": "Your session has expired. Sign in again.",
  "Auth.PasswordRejected":
    "That password was rejected. Choose a stronger one and try again.",
  "Auth.UnknownPurpose": "We couldn't process that request. Try again.",
  "Auth.PurposeNotResendable":
    "This code can't be resent. Start over to get a new one.",
  "Auth.ChallengeUnavailable":
    "Too many codes requested recently. Try again shortly.",
  "Auth.PreAuthInvalid":
    "Your sign-in attempt has expired. Enter your email and password again.",
  "Auth.TwoFactorNotEnabled":
    "Two-factor authentication isn't enabled on this account.",
  "Auth.PhoneMissing": "There's no phone change in progress.",
  "Auth.NoPendingPhoneChange":
    "There's no pending phone change to confirm. Start again.",
  "Auth.PhoneChannelUnavailable":
    "We couldn't send a code to that number right now. Try again shortly.",
};

export function messageForApiError(err: unknown): string {
  if (!(err instanceof ApiError)) {
    return err instanceof Error
      ? err.message
      : "Something went wrong. Try again.";
  }
  if (err.status === 429) {
    return "Too many codes requested recently. Try again shortly.";
  }
  if (err.status === 502) {
    return "We couldn't send a code to that number right now. Please try again.";
  }
  if (err.code && CODE_COPY[err.code]) {
    return CODE_COPY[err.code];
  }
  return err.message;
}
```

The final `return err.message` is the fallback: it carries the backend `detail` for any unmapped code, or the status-line string when the body was not JSON.

### 4.3 Wire the mapping into the auth context
In `app/context/auth-context.tsx`, replace the local `messageFor` with `messageForApiError` from `~/lib/api/auth-errors` (delete the old `messageFor` and its `ApiError` import if now unused; keep the import if still referenced elsewhere). All existing `catch (err) { return { error: messageFor(err) }; }` sites become `messageForApiError(err)`.

429 and 502 are handled by status before the code map, so a throttled resend and a WhatsApp-unreachable phone change surface distinct copy from a generic failure, per the design.

---

## 5. Pre-auth token is never persisted (hard constraint)

The `preAuthToken` returned by `/auth/login` MUST live only in React `useState` inside the login route component (section 6). It must never be written to:
- `localStorage` (including the `fs-auth` session key or any new key),
- the session store (`app/lib/auth/session-store.ts`),
- cookies,
- `sessionStorage`.

`authApi.login` returns the token as a plain value and stores nothing on the challenge branch. The auth context passes it through to the route as a return value; it does not stash it in the store. A full page refresh during the challenge intentionally loses the token and drops the user back to the credentials step - this is the correct, specified behaviour, not a bug. Implementers must not "fix" it by persisting the token.

---

## 6. Two-step login

### 6.1 `VerifyCodeForm` opt-out prop - `app/components/common/verify-code-form.tsx`
Add a boolean prop `allowResend`, default `true`, and make `onResend` optional. Because the backend rejects resending a `TwoFactor` code (`Auth.PurposeNotResendable`), the 2FA step renders the form with `allowResend={false}` and no `onResend`.

Props become:

```ts
interface VerifyCodeFormProps {
  email: string;
  submitLabel?: string;
  onSubmit: (code: string) => Promise<{ error: string | null }>;
  onResend?: () => Promise<{ error: string | null }>;
  allowResend?: boolean;
  children?: React.ReactNode;
}
```

Behaviour:
- Destructure with `allowResend = true`.
- The cooldown `useEffect` timer must run only when resend is active. Gate it: `if (!allowResend || !onResend) return;` at the top of the effect (before the `cooldown <= 0` check), so no timer is scheduled when resend is disabled.
- The resend `<button>` renders only when `allowResend && onResend` is truthy. When hidden, the copy line "We sent a six-digit code to ..." stays.
- `resend()` is unchanged but only reachable when the button renders; it may safely assume `onResend` is defined at that point (guard with `if (!onResend) return;`).

No existing caller passes `allowResend`, and all three existing callers (`signup.tsx`, `reset-password.tsx`, `accept-invite.tsx`) pass `onResend`. With the default `true` and `onResend` provided, their behaviour is byte-for-byte unchanged. Confirmed callers: only those three plus the login route added below.

### 6.2 Auth-context additions - `app/context/auth-context.tsx`
Change `signIn`'s return type to carry the challenge, and add `verifyLoginCode`:

```ts
signIn: (
  email: string,
  password: string,
) => Promise<{ error: string | null; preAuthToken: string | null }>;
verifyLoginCode: (
  preAuthToken: string,
  code: string,
) => Promise<{ error: string | null }>;
```

Implementations:

```ts
const signIn = useCallback(async (email: string, password: string) => {
  try {
    const result = await authApi.login(email, password);
    if (result.kind === "challenge") {
      return { error: null, preAuthToken: result.preAuthToken };
    }
    await adoptSession();
    return { error: null, preAuthToken: null };
  } catch (err) {
    return { error: messageForApiError(err), preAuthToken: null };
  }
}, []);

const verifyLoginCode = useCallback(
  async (preAuthToken: string, code: string) => {
    try {
      await authApi.loginVerify(preAuthToken, code);
      await adoptSession();
      return { error: null };
    } catch (err) {
      return { error: messageForApiError(err) };
    }
  },
  [],
);
```

Add both to the `AuthContextValue` interface, the `useMemo` value object, and its dependency array (`verifyLoginCode` in deps; `signIn` is already listed).

`signUp` gains an optional phone parameter that it forwards:

```ts
signUp: (
  email: string,
  password: string,
  phoneNumber?: string | null,
) => Promise<Result>;
```
```ts
const signUp = useCallback(
  async (email: string, password: string, phoneNumber?: string | null) => {
    try {
      await authApi.register(email, password, phoneNumber);
      return { error: null };
    } catch (err) {
      return { error: messageForApiError(err) };
    }
  },
  [],
);
```

`acceptInvite` gains an optional phone parameter forwarded to `authApi.acceptInvite` (same pattern; add `phoneNumber?: string | null` as the 4th arg).

### 6.3 Login route rewrite - `app/routes/login.tsx`
The route becomes a two-step flow driven by a single piece of local state, `preAuthToken: string | null`. Add `import { VerifyCodeForm } from "~/components/common/verify-code-form";`.

State to add alongside existing `email`, `password`, etc.:

```ts
const [preAuthToken, setPreAuthToken] = useState<string | null>(null);
const { signIn, verifyLoginCode } = useAuth();
```

Credentials `onSubmit` (existing handler) changes its tail: after successful validation and `signIn`:

```ts
const { error, preAuthToken: challenge } = await signIn(
  result.data.email,
  result.data.password,
);
if (error) {
  setError(error);
  setLoading(false);
  return;
}
if (challenge) {
  setPreAuthToken(challenge);
  setLoading(false);
  return;
}
navigate(next ? decodeURIComponent(next) : "/dashboard", { replace: true });
```

Render: when `preAuthToken` is non-null, render the challenge step **instead of** the credentials form, inside the same `AuthShell` (title "Enter your code", subtitle "Two-factor authentication is on for this account"):

```tsx
<VerifyCodeForm
  email={email}
  submitLabel="Verify and sign in"
  allowResend={false}
  onSubmit={async (code) => {
    const { error } = await verifyLoginCode(preAuthToken!, code);
    if (!error) {
      navigate(next ? decodeURIComponent(next) : "/dashboard", {
        replace: true,
      });
    }
    return { error };
  }}
/>
```

Below the form, render a "Start over" text button (same visual style as the resend button it replaces - `type="button"`, `text-[13px] font-medium text-primary hover:underline`) that resets the challenge:

```tsx
<button
  type="button"
  onClick={() => {
    setPreAuthToken(null);
    setPassword("");
    setError(null);
  }}
  className="mt-3 text-[13px] font-medium text-primary hover:underline"
>
  Start over
</button>
```

"Start over" is the only recovery affordance in the 2FA step; there is deliberately no resend, because the backend rejects it. Clearing `password` on start-over means the user re-enters credentials, which re-issues a fresh code.

Accessibility for the challenge step: `VerifyCodeForm` already labels its input, wires `aria-invalid`/`aria-describedby`, and uses `autoComplete="one-time-code"` + `inputMode="numeric"`. The "Start over" control is a real `<button>`, focusable and Enter/Space-activatable. Ensure the challenge heading is reachable and the input receives focus on step change (add `autoFocus` to the reused input is out of scope; instead, since the form remounts, rely on default tab order - the code input is first).

---

## 7. Settings - Security section

Add a Security panel to `app/routes/settings.tsx`, rendered in the right-hand column beneath the existing "Your account" card, as another `rounded-2xl border border-border bg-card p-6` block. Extract it into a component `SecurityPanel` in the same file (matching the file's existing `CompanyPanel`/`SagePanel` pattern) to keep the route component lean.

### 7.1 Data source - read real state from `/me`
`GET /api/v1/me` now returns `twoFactorEnabled`, `phoneNumber`, `phoneNumberConfirmed`, and `pendingPhoneNumber` (sections 1.11, 3.5). The Security panel is driven by these authoritative values, not by optimistic guesses.

Load them via the settings `clientLoader`. The loader currently returns `{ company, sage }`; add the current user:

```ts
export async function clientLoader({ request }: Route.ClientLoaderArgs) {
  const user = await requireAuth(request);
  if (!canSeeNav(user, "settings")) throw redirect("/dashboard");
  return {
    company: companyApi.get().catch(() => null),
    sage: sageApi.connection().catch(() => null),
    me: meApi.me().catch(() => null),
  };
}
```

Add `import { meApi } from "~/lib/api/me/me";`. Render the panel inside a `Resolve` on `loaderData.me` (matching the existing `Resolve` pattern used for company/sage), with a `KeyValueSkeleton`-style fallback while it loads and a graceful "Couldn't load your security settings." message when `me` is `null`. After any successful enable/disable/phone action, call `useRevalidator().revalidate()` (the pattern already used by `CompanyPanel`/`SagePanel`) so the panel re-reads `/me`. Do not hold a parallel optimistic copy of these values in component state; the revalidated loader data is the single source of truth.

### 7.2 Two-factor toggle UX
Driven by `me.twoFactorEnabled`.
- One clear action per state. Use the existing `Button` component (there is no `Switch` in `app/components/ui`; do not add one - use a labelled button to match the codebase, avoiding a new dependency/component).
- When `twoFactorEnabled` is `false`: show helper copy "Two-factor authentication adds a WhatsApp code to each sign-in." and an "Enable" button. Enable is single click -> `meApi.enableTwoFactor()` -> on success `toast.success("Two-factor authentication enabled.")` then `revalidate()`. On error, `toast.error(messageForApiError(err))`.
- When `twoFactorEnabled` is `true`: show an enabled `Badge` (`variant="secondary"`, "On") and a "Turn off" button that opens a password confirmation dialog (the backend requires the account password). Reuse the existing `FormDialog` (`~/components/modals/form-dialog`) with a single required `password` field (`type: "password"`), `confirmTitle` "Turn off two-factor authentication?", submit label "Turn off". `onSubmit` calls `meApi.disableTwoFactor(values.password)`; on success `toast.success("Two-factor authentication disabled.")` then `revalidate()`. Errors surface via `messageForApiError` (see Risk R6 on `FormDialog` error copy).
- Loading: disable the active button and show a spinner/label while the request is in flight (match `login.tsx` pattern with `Loader2Icon`).

### 7.3 Phone management UX
Driven by `me.phoneNumber`, `me.phoneNumberConfirmed`, and `me.pendingPhoneNumber`. Three entry states:

1. **Confirmed number** (`phoneNumber` set and `phoneNumberConfirmed === true`): show the number with a confirmed `Badge` (`variant="secondary"`, "Confirmed") and a "Change number" button.
2. **Interrupted change** (`pendingPhoneNumber` is non-null): a phone change was started but not verified. Surface it explicitly - show `pendingPhoneNumber` with an "Awaiting confirmation" `Badge` (`variant="destructive"` or a warning tone) and copy "You started changing your number to {pendingPhoneNumber} but haven't confirmed it yet." Offer **two** actions: "Enter code" (jump straight to the verify step for the pending number - do NOT silently re-issue), and "Use a different number" (return to number entry). This resumes the flow the `pendingPhoneNumber` field exists to support.
3. **No number / unconfirmed and no pending** (`phoneNumber` null, or set with `phoneNumberConfirmed === false` and no pending change): show an "Add a phone number" button with helper copy "Add a WhatsApp number to receive verification codes." If `phoneNumber` is set but unconfirmed, show it with an "Unconfirmed" badge alongside the add/verify affordance.

Editing/verifying flow (opened from any of the above):
- **Step A - number entry:** use the new `PhoneInput` (`~/components/common/phone-input`, section 8.1) validated with `optionalPhoneSchema` (section 8.2). Parse the field with the schema to get the E.164 value, then call `meApi.updatePhone(value)`. On success (`202`), `toast.success("We sent a code to that number.")` and advance to Step B for that number. On `502`, `messageForApiError` yields "We couldn't send a code to that number right now. Please try again." On `429`, the throttle copy. Numbers invalid for the selected country are rejected client-side by the schema before any call, with a message that names the country.
- **Step B - code verify:** reuse `VerifyCodeForm` with `allowResend={false}` (resend of a `PhoneChange` code is rejected by the backend - `Auth.PurposeNotResendable`). Provide a "Use a different number" button that returns to Step A (which re-issues a fresh code on resubmit). `onSubmit` calls `meApi.verifyPhone(code)`. On success (`204`), `toast.success("Phone number confirmed.")`, close the editor, then `revalidate()` so the panel re-reads the now-confirmed number from `/me`. For the "Enter code" action from the interrupted-change state, open Step B directly against `pendingPhoneNumber` without calling `updatePhone` first.
- Note: `VerifyCodeForm`'s static intro line references "your email"; for phone verification that copy is slightly off. Do not modify the shared component's copy (out of scope, affects other callers). Render a short clarifying line via its `children` slot: "Enter the code we sent to {the number being verified}." (children render between the code input and submit button - acceptable), or wrap `VerifyCodeForm` and place the clarifier above it. Implementer picks one; neither changes the shared component.

Phone-change is WhatsApp-only, so a `502` must read as "we could not send a code to that number right now", handled by section 4.2's status-502 branch.

### 7.4 Responsive + a11y for the Security panel
- 360px: the panel is full width (single column; the settings grid already collapses to `grid-cols-1` below `lg`). Buttons go full width or wrap; the phone number + badge stack vertically (`flex flex-col gap-2` under `sm`).
- 768px: still single column within the right rail on tablet until `lg`; panel content in a comfortable single column.
- 1280px: panel sits in the right rail (`lg:grid-cols-[1.6fr_1fr]` already defined on the settings grid).
- Keyboard: all actions are real `<button>`s / `FormDialog` (which traps focus via the shadcn `Sheet`). The password dialog is reachable and dismissible with Escape.
- Screen reader: give the panel a heading via the existing `SectionTitle` ("Security"). The confirmed/unconfirmed phone status uses a `Badge` plus visible text (not colour alone). Loading buttons set `disabled` and swap label text so state is announced.
- Empty/loading/error: idle "Add a phone number" is the empty state; in-flight requests disable the relevant button with a "Saving..."/"Sending..." label; errors surface as Sonner toasts and, for the number field, inline field error text.

---

## 8. International phone input (app-wide)

Scope note: this is an **app-wide** change, not auth-only. The user wants a country picker (emoji flag + dial code) on every phone field: select a country, its dial code is prefixed, the user types only the national digits (their example: pick South Africa -> `+27` shown -> type `681501196`). The interaction already exists, hardcoded to one country, in `SouthAfricanPhoneInput`, which renders a 🇿🇦 emoji and `+27` in a muted left panel, takes national digits, and emits E.164 via `onValueChange`. **The job is to make that fixed country selectable, not to invent a new input model.** Same prop shape, so call sites change only their import and element name.

Approved decisions (do not revisit): `libphonenumber-js` for metadata/validation/formatting (new dependency, approved); emoji flags derived from the ISO-3166 code (no icon-set dependency); default selected country `ZA`.

New dependency + primitives to add:
- `libphonenumber-js` (runtime dependency).
- shadcn `popover` and `command` (generated into `app/components/ui/`) for the country picker - see 8.1 for why these over `SearchSelectField`. `command` pulls in `cmdk`; `popover` uses the already-present `radix-ui`.

### 8.1 New component `app/components/common/phone-input.tsx` (renames + generalises `SouthAfricanPhoneInput`)
Create `PhoneInput` with the **same public prop shape** as `SouthAfricanPhoneInput` so migration is mechanical:

```ts
import type { CountryCode } from "libphonenumber-js";

type PhoneInputProps = Omit<
  React.ComponentProps<"input">,
  "inputMode" | "onChange" | "type" | "value"
> & {
  value: string;
  onValueChange: (value: string) => void;
  defaultCountry?: CountryCode;
};
```

`value` is E.164 (or `""`); `onValueChange` emits E.164 (or `""`). `defaultCountry` defaults to `"ZA"`.

Behaviour:
- **Left panel becomes a country trigger** (a `<button type="button">`) showing the emoji flag and `+<dialCode>` for the selected country, styled like the current muted `+27` panel. Clicking it opens the country picker (8.1.1).
- **Text input** still takes national digits only (`type="tel"`, `inputMode="tel"`), positioned to the right of the trigger exactly as today.
- **Selected country derivation:** local state `country: CountryCode`, seeded from `value`. Compute the seed with `parsePhoneNumber(value)?.country ?? defaultCountry` (guard with a safe parse - use `libphonenumber-js`'s throwing `parsePhoneNumber` inside a try, or the non-throwing parse). A `useEffect` re-syncs `country` when an externally supplied `value` parses to a different country, so opening an existing record shows the right flag. When `value` is empty the last user-picked country persists (local state is not reset to default on empty input).
- **National digits shown** are derived from `value` for the current country. When `value` is a parseable number use `parsePhoneNumber(value)?.nationalNumber`; otherwise (a partial number being typed) fall back to the raw digits with the selected country's calling code stripped, so the national field never shows the country code: `const cc = getCountryCallingCode(country); const digits = value.replace(/\D/g, ""); return digits.startsWith(cc) ? digits.slice(cc.length) : digits;`.
- **Emitting E.164:** on digit change, compose `nextValue = toE164(country, digits)`; on country change, recompose with the existing digits and re-emit. Helper:

```ts
import { parsePhoneNumber, getCountryCallingCode } from "libphonenumber-js";

function toE164(country: CountryCode, nationalDigits: string): string {
  if (!nationalDigits) return "";
  try {
    const parsed = parsePhoneNumber(nationalDigits, country);
    if (parsed) return parsed.number;
  } catch {
  }
  return `+${getCountryCallingCode(country)}${nationalDigits}`;
}
```

The `catch` is intentionally empty: an incomplete number that `parsePhoneNumber` cannot parse still emits a best-effort `+<dialCode><digits>` so the controlled value stays live while typing; final validity is enforced by the schema (8.2) on submit.

- **Country list data** comes from a small helper `app/lib/utils/countries.ts`:

```ts
import { getCountries, getCountryCallingCode } from "libphonenumber-js";
import type { CountryCode } from "libphonenumber-js";

export interface CountryOption {
  code: CountryCode;
  name: string;
  callingCode: string;
  flag: string;
}

const regionNames = new Intl.DisplayNames(["en"], { type: "region" });

export function flagEmoji(code: string): string {
  return code
    .toUpperCase()
    .replace(/./g, (c) => String.fromCodePoint(127397 + c.charCodeAt(0)));
}

export const COUNTRY_OPTIONS: CountryOption[] = getCountries()
  .map((code) => ({
    code,
    name: regionNames.of(code) ?? code,
    callingCode: getCountryCallingCode(code),
    flag: flagEmoji(code),
  }))
  .sort((a, b) => a.name.localeCompare(b.name));
```

`Intl.DisplayNames` is available in the browser and the Workers runtime; the `?? code` fallback covers any code it cannot name.

#### 8.1.1 Country-picker approach - decision: shadcn `Popover` + `Command`
Chosen: a compact country-trigger button in the phone input's left panel that opens a `Popover` containing a `Command` searchable list (`CommandInput` + `CommandList` + `CommandItem`), each item rendering `flag  name  +callingCode`, filtered by name/dial-code/ISO code, keyboard-navigable, selecting sets `country` and closes the popover.

Why not reuse the existing `SearchSelectField` (evaluated first, per the mandate): it cannot be adapted without distortion. It is a **full-width combobox that IS the field** - it renders its own `<Input type="search">` as the primary interactive element, with an absolutely-positioned results `<div>` under it. The country picker needs the opposite shape: a small button (flag + dial code) inside the phone input's left panel that launches an overlay, with the national-digits `<input>` remaining the field. Concretely: (1) `SearchSelectField` has no button-trigger/overlay model; (2) its results are gated on `query.trim().length >= minChars` and a non-empty `debouncedQuery` (`localMatches` returns `[]` for an empty query), so it cannot show the full country list on open, which a country picker must; (3) embedding it would put two text inputs (country search + national digits) in one field competing for focus; (4) it carries remote-search/debounce machinery irrelevant to a static ~250-item list. These are structural, not cosmetic, so `Popover` + `Command` (explicitly pre-authorised as the fallback) is the correct call. `Command` adds `cmdk`; note that in the dependency list.

- **Delete** `app/components/common/south-african-phone-input.tsx` after migrating call sites (8.4).

### 8.2 Rewrite `app/lib/utils/phone.ts` around `libphonenumber-js`
Replace the hand-written SA tables/`getNationalNumber` with `libphonenumber-js`. Delete the SA-only exports (`optionalSouthAfricanPhoneSchema`, `requiredSouthAfricanPhoneSchema`, `getSouthAfricanPhoneError`, `getSouthAfricanNationalDigits`) and the `LANDLINE_AREA_CODES` / `MOBILE_PREFIX` constants. New exports:

```ts
import { z } from "zod";
import { isValidPhoneNumber, parsePhoneNumber } from "libphonenumber-js";

function e164Error(value: string): string {
  try {
    const country = parsePhoneNumber(value)?.country;
    if (country) return `Enter a valid phone number for ${country}.`;
  } catch {
  }
  return "Enter a valid phone number, including the country code.";
}

function normalizeE164(value: string): string {
  try {
    const parsed = parsePhoneNumber(value);
    if (parsed) return parsed.number;
  } catch {
  }
  return value;
}

export const optionalPhoneSchema = z
  .string()
  .trim()
  .superRefine((value, ctx) => {
    if (!value) return;
    if (!isValidPhoneNumber(value)) {
      ctx.addIssue({ code: "custom", message: e164Error(value) });
    }
  })
  .transform((value) => (value ? normalizeE164(value) : ""));

export const requiredPhoneSchema = z
  .string()
  .trim()
  .superRefine((value, ctx) => {
    if (!value) {
      ctx.addIssue({ code: "custom", message: "Phone number is required." });
      return;
    }
    if (!isValidPhoneNumber(value)) {
      ctx.addIssue({ code: "custom", message: e164Error(value) });
    }
  })
  .transform((value) => normalizeE164(value));

export function getPhoneError(value: string): string | null {
  if (!value) return null;
  return isValidPhoneNumber(value) ? null : e164Error(value);
}
```

Notes: the schemas receive the E.164 string the `PhoneInput` emits, so `isValidPhoneNumber(value)` needs no country argument. `optionalPhoneSchema` yields `""` for empty (callers convert `""` to `null`/omit before sending). Per-country validation is retained via `libphonenumber-js` metadata - it is not weakened relative to the old SA table; it is generalised. The `catch` blocks are intentionally empty (best-effort parse of a not-yet-valid string). `getPhoneError` is the component-facing check when a form validates outside Zod.

### 8.3 `FormDialog` wiring
In `app/components/modals/form-dialog.tsx`:
- Update the imports at `:14,25-26`: replace `SouthAfricanPhoneInput` with `PhoneInput` from `~/components/common/phone-input`, and replace `requiredSouthAfricanPhoneSchema` / `optionalSouthAfricanPhoneSchema` with `requiredPhoneSchema` / `optionalPhoneSchema` from `~/lib/utils/phone`.
- `schemaForField()` at `:278-286`: the `type === "tel"` branch now returns `field.required ? requiredPhoneSchema : optionalPhoneSchema`.
- The render block at `:449-473`: render `<PhoneInput value=... onValueChange=... />` in place of `<SouthAfricanPhoneInput .../>` (identical props).

Because every existing `type: "tel"` field flows through this one path, all of them become international with **no per-form change**. Forms covered by this single edit: **add customer** (`customers.tsx:216-219`), **edit customer** (`customer-detail.tsx:267-271`), **company settings phone** (`settings.tsx:343-348`), and the new **invite** dialog phone field (8.4). Confirmed: these forms carry the phone via `FormDialog` `type: "tel"` and need no individual edits.

### 8.4 Call sites to migrate
Direct component/schema users (outside `FormDialog`) - change import + element name (props are identical) and swap schema names:
- `app/routes/onboarding.tsx` (`:16` import, `:22-23` schema imports, `:93` schema use, `:175,180` render): company setup, optional phone. Import `PhoneInput`; use `optionalPhoneSchema`.
- `app/routes/public-calendar.tsx` (`:19` import, `:59` schema use) + `app/components/public-booking/details-step.tsx` (`:3` import, `:53` render): public booking, **required** phone. Import `PhoneInput`; use `requiredPhoneSchema`.

New auth fields from this spec:
- `app/routes/signup.tsx`: optional phone field below password using `PhoneInput` (`~/components/common/phone-input`), label "Phone number (optional)". Add `phone` state, controlled via `value={phone}` / `onValueChange={setPhone}`. In the existing Zod `.object({...}).safeParse`, add `phone: optionalPhoneSchema`. Pass parsed value to `signUp(email, password, phone || null)`. Field error mirrors the email/password pattern (`fieldErrors.phone`, `aria-invalid` on the trigger+input group, `aria-describedby="signup-phone-error"`).
- `app/routes/accept-invite.tsx`: optional `PhoneInput` inside the `VerifyCodeForm` children block (below Confirm password); `phone` state; include `phone: optionalPhoneSchema` in the `validate()` schema; pass to `acceptInvite(email, code, password, phone || null)`.
- `app/routes/team.tsx` invite `FormDialog`: add a field `{ name: "phoneNumber", label: "Phone number (optional)", type: "tel", full: true }`. No `form-dialog.tsx` change beyond 8.3; the `type: "tel"` path now runs `optionalPhoneSchema` and renders `PhoneInput`. In `onSubmit`, forward `phoneNumber: v.phoneNumber || null` (already normalised to E.164 by the schema transform).
- Settings phone panel (§7.3): `PhoneInput` + `optionalPhoneSchema`.

### 8.5 Display formatting (approved)
Raw `+27681501196` reads poorly and gets worse for international numbers. Add a helper `formatPhoneForDisplay(value: string, viewerCountry?: CountryCode): string` in `app/lib/utils/phone.ts`:

```ts
import { parsePhoneNumber } from "libphonenumber-js";

export function formatPhoneForDisplay(
  value: string | null | undefined,
  viewerCountry?: CountryCode,
): string {
  if (!value) return "—";
  try {
    const parsed = parsePhoneNumber(value);
    if (!parsed) return value;
    return viewerCountry && parsed.country === viewerCountry
      ? parsed.formatNational()
      : parsed.formatInternational();
  } catch {
    return value;
  }
}
```

Applied at the 10 display sites (all currently raw `{phone ?? "—"}`): `customers.tsx:96`, `customer-detail.tsx:245`, `invoice-detail.tsx:244`, `licence-detail.tsx:148`, `settings.tsx:287`, `review-step.tsx:114`, `topbar.tsx:545`, `booking-form-dialog.tsx:49`, `firearms.tsx:268`, and the display text (not the `href`) at `company-header.tsx:36-41`. **Exception:** `company-header.tsx`'s `tel:` link `href` must keep raw E.164 (that is what dialers expect); only its visible label may be formatted.

### 8.6 Responsive + a11y for the phone fields
- 360/768/1280: `PhoneInput` is full width in all forms (auth forms are single-column `flex flex-col gap-4`; dialog fields use `full: true`). It is a full-width flex row: country-trigger button + fluid national-digits input, mirroring today's layout.
- Country picker: the `Popover` content must be width-constrained and internally scrollable (`Command`/`CommandList` scrolls) so a ~250-item list never overflows the viewport at 360px. On small screens ensure the popover is not wider than the trigger's container.
- Keyboard/SR: the country trigger is a real `<button>` with an accessible name (e.g. `aria-label={`Country: ${name} +${callingCode}`}`); the picker is `Command` (combobox/listbox semantics, arrow-key navigation, type-to-filter, Escape to close). The national-digits field is a native `type="tel"` `inputMode="tel"` input with a visible `<Label htmlFor>`; set `aria-invalid` and `aria-describedby` -> error `<p>` id on it. The flag emoji is decorative; the trigger's `aria-label` and the item text carry meaning. Error text is real text, not colour-only.
- Loading/error: submit buttons already reflect loading; a number invalid for the selected country shows the inline field error before any network call.

---

## 9. Playwright e2e (new setup)

No test infra exists. Add Playwright as the e2e runner. Keep e2e out of the app TypeScript build.

### 9.1 Files and config
- `package.json`: add devDependency `@playwright/test` (current stable) and scripts:
  ```json
  "test:e2e": "playwright test",
  "test:e2e:ui": "playwright test --ui"
  ```
- `playwright.config.ts` (repo root): `testDir: "./e2e"`, `use.baseURL` from `process.env.E2E_BASE_URL`, `timeout` generous (e.g. 60_000) to allow WhatsApp OTP polling, `retries: process.env.CI ? 1 : 0`, single chromium project. Do **not** hardcode any host, key, or session id - read every external value from `process.env`.
- `e2e/tsconfig.json`: extends the root tsconfig compiler options but sets `types: ["@playwright/test", "node"]`; this directory is its own TS island.
- `tsconfig.json` (app): add `"e2e"` to `exclude` so the app `tsc` does not typecheck Playwright specs (the app tsconfig currently `include`s `**/*`).
- `.env.example`: append the e2e variables (names only, placeholder values), documented below. Never commit real values (`.env*` is already gitignored except `.env.example`).

### 9.2 Required env vars (no secrets in any spec'd file)
```
E2E_BASE_URL=            # frontend under test, e.g. http://localhost:5173
E2E_TEST_EMAIL=          # a real account the API knows
E2E_TEST_PASSWORD=       # its password
E2E_TEST_PHONE_E164=     # WhatsApp number under test control, e.g. +27821234567
WAHA_BASE_URL=           # WAHA HTTP API base, e.g. https://waha.example.com
WAHA_SESSION_ID=         # WAHA session id used by the backend sender
WAHA_API_KEY=            # WAHA X-API-Key
```
The 2FA login spec requires that `E2E_TEST_EMAIL` already has two-factor enabled and `E2E_TEST_PHONE_E164` set as its confirmed number (the 2FA code is sent to the account's phone). The phone-verify spec adds/changes the phone to `E2E_TEST_PHONE_E164`. Both read the code from the WAHA chat to that number.

### 9.3 OTP fixture - `e2e/fixtures/waha.ts`
A helper that polls the WAHA HTTP API for the most recent message in the chat with the test number and extracts the 6-digit code. WAHA's send route (from `WahaWhatsAppSender`) is `POST {WAHA_BASE_URL}/api/sessions/{session}/messages/send-text` with header `X-API-Key`. The messages are addressed to `chatId = phoneE164.replace(/^\+/, "") + "@c.us"` (mirrors `WahaWhatsAppSender.ToChatId`).

Contract for the fixture:
```ts
export function chatIdFor(phoneE164: string): string;

export async function waitForOtp(opts: {
  phoneE164: string;
  match: RegExp;
  since: number;
  timeoutMs?: number;
  pollMs?: number;
}): Promise<string>;
```

Field meanings:
- `chatIdFor` maps `"+27821234567"` to `"27821234567@c.us"` (mirrors `WahaWhatsAppSender.ToChatId`).
- `match` is the regex whose first capture group is the 6-digit code, e.g. `/login code is (\d{6})/` or `/phone verification code is (\d{6})/`.
- `since` is `Date.now()` captured before triggering the send, so older messages are ignored.
- `timeoutMs` defaults to `45_000`; `pollMs` defaults to `2_000`.
- `waitForOtp` resolves the captured 6-digit group and rejects on timeout.

Implementation notes for the fixture (so the implementer makes no API-shape guesses):
- Read messages with `GET {WAHA_BASE_URL}/api/sessions/{WAHA_SESSION_ID}/chats/{chatId}/messages?limit=10&downloadMedia=false`, header `X-API-Key: {WAHA_API_KEY}`, `Accept: application/json`. If the deployment returns 404 for that route, fall back to `GET {WAHA_BASE_URL}/api/messages?session={WAHA_SESSION_ID}&chatId={chatId}&limit=10&downloadMedia=false`. Document both in a code-adjacent note (prose, not inline comments).
- Each message object carries the text under a `body` field and a timestamp under `timestamp` (seconds) - normalise to ms and compare against `since`.
- Filter to messages newer than `since`, test `opts.match` against `body`, take the newest match, return capture group 1.
- Poll every `pollMs` until `timeoutMs`; reject with a clear error naming the chatId (never the API key or session id) on timeout.
- The message templates to match (from `WahaWhatsAppSender.BuildMessage`): TwoFactor -> `Your Firearm Studio login code is {code}. ...`; PhoneChange -> `Your Firearm Studio phone verification code is {code}. ...`. Use `/login code is (\d{6})/` and `/phone verification code is (\d{6})/` respectively to disambiguate concurrent flows.

### 9.4 Specs
- `e2e/login-2fa.spec.ts`: navigate to `/login`, fill `E2E_TEST_EMAIL` / `E2E_TEST_PASSWORD`, submit. Assert the challenge step appears (heading "Enter your code") and that **no resend control is present** (`await expect(page.getByText(/resend/i)).toHaveCount(0)`) while a "Start over" button is present. Capture `since = Date.now()` before submit; `waitForOtp` with the login-code regex on `E2E_TEST_PHONE_E164`; enter the code; assert redirect to `/dashboard`.
- `e2e/phone-verify.spec.ts`: sign in (an account without 2FA, or complete 2FA first), go to `/settings`, open phone add/change, enter `E2E_TEST_PHONE_E164`, submit; `waitForOtp` with the phone-verification regex; enter code; assert the confirmed state (number shown with "Confirmed" badge and a success toast).
- `e2e/phone-rejection.spec.ts`: on `/signup` (client-only), with the default country (ZA) selected, type national digits that are invalid for that country and submit; assert the inline error contains "valid phone number" and that **no** POST to `/api/v1/auth/register` was issued (intercept via `page.route` and assert not called, or assert the URL did not change and the error is visible). No WAHA needed. Use digits `libphonenumber-js` rejects for ZA - e.g. `12345` (too short for a ZA number) - not a well-formed ZA mobile like `681501196`, which is valid and would be normalised to `+27681501196`. The point of the test is that a number invalid for the selected country is rejected client-side before any network call.

---

## 10. Risks and open items

- **R1 (RESOLVED): `/api/v1/me` now exposes phone/2FA state.** `CurrentUserResponse` gains `twoFactorEnabled`, `phoneNumber`, `phoneNumberConfirmed`, and `pendingPhoneNumber` (backend change in flight; sections 1.11, 3.5). The Settings Security panel reads these authoritatively via the loader and revalidates after each action (section 7). The earlier optimistic-local-state workaround is removed. The only residual dependency is that the frontend `CurrentUserResponse` type and the backend DTO stay in sync on field names/casing (camelCase); verify once the backend change lands.
- **R2 (accepted trade-off): new dependency replaces the hand-written SA tables.** Phone input goes international app-wide (`PhoneInput` + `libphonenumber-js`), replacing `SouthAfricanPhoneInput` and the hand-written SA prefix/area-code tables in `phone.ts`. Trade-off accepted by the user: (a) a new runtime dependency `libphonenumber-js` (plus `cmdk` via shadcn `command` for the picker); (b) the bespoke SA validation table is deleted in favour of `libphonenumber-js`'s maintained metadata. Per-country validation is **retained, not lost** - it now covers every country instead of just SA, and SA numbers are still validated correctly. Default country stays ZA (SA-focused app; international is an addition, not a repositioning). Bundle-size note: `libphonenumber-js` ships a full-metadata build; if bundle size becomes a concern, switch to its `min`/`mobile` metadata subset - out of scope here.
- **R3 (e2e gated on migrations):** the two unapplied migrations (section 2) must be applied and the API restarted before any e2e can pass; the `.env` target already points at production per project memory, so the user must run their throwaway-container / apply-then-restart procedure deliberately.
- **R4 (WAHA read-route variance):** WAHA's message-read route differs across engine/versions. The fixture specifies a primary route and a documented fallback (section 9.3); if the target deployment uses a third shape, the fixture's `waitForOtp` read call is the single place to adjust.
- **R5 (429/502 copy vs field errors):** throttle (429) and WhatsApp-unreachable (502) are surfaced as toasts in Settings and as top-level form errors in login; ensure they are not swallowed by field-level validation. The status checks precede the code map in `messageForApiError`, so they win.
- **R6 (`FormDialog` error copy):** confirm `form-dialog.tsx`'s submit-catch path renders `ApiError.message`; if it renders the raw thrown error, route the disable-2FA and phone calls through `messageForApiError` (e.g. catch, rethrow `new Error(friendly)`) so users see mapped copy, not raw `detail`.
- **R7 (RESOLVED): display formatting approved.** §8.5's `formatPhoneForDisplay` and its 10 display-site edits are approved and scheduled as task 9. The `tel:` href in `company-header.tsx` stays raw E.164; only its visible label is formatted.
- **R8 (country names + Workers SSR):** `COUNTRY_OPTIONS` uses `Intl.DisplayNames`. It is available in the browser and the Cloudflare Workers runtime, with a `?? code` fallback; if a rendering path lacks it, the picker degrades to ISO codes rather than breaking. Verify once integrated.

---

## 11. Acceptance criteria (checkable)

API layer:
- [ ] `authApi.login` returns `LoginResult` and persists tokens only on `{ kind: "tokens" }`; on challenge it persists nothing.
- [ ] `authApi.loginVerify(preAuthToken, code)` exists, hits `POST /api/v1/auth/login/verify`, persists tokens on success.
- [ ] `meApi.enableTwoFactor()`, `meApi.disableTwoFactor(password)`, `meApi.updatePhone(phoneNumber)`, `meApi.verifyPhone(code)` exist and use the authenticated `request` wrapper (bearer attached).
- [ ] `authApi.register` and `authApi.acceptInvite` accept an optional phone and send `phoneNumber` (null when empty); `InviteUserRequest` and `UserResponse` include `phoneNumber`.
- [ ] `CurrentUserResponse` (`app/lib/api/me/types.ts`) includes `twoFactorEnabled`, `phoneNumber`, `phoneNumberConfirmed`, `pendingPhoneNumber`.
- [ ] No frontend code sends `resend-code` with purpose `TwoFactor` or `PhoneChange`.

Errors:
- [ ] `ApiError` has a `code` field populated from the error body's top-level `code`.
- [ ] `messageForApiError` returns distinct copy for HTTP 429 and 502, maps all codes listed in section 4.2 (including `PreAuthInvalid`, `TwoFactorNotEnabled`, `PhoneMissing`, `NoPendingPhoneChange`, `PurposeNotResendable`, `ChallengeUnavailable`, `PhoneChannelUnavailable`), and falls back to the backend `detail` for unmapped codes.

Pre-auth token:
- [ ] Grepping the repo shows `preAuthToken` written only to React state in `login.tsx`; it is absent from `localStorage`/`sessionStorage`/cookies/session-store.
- [ ] A page refresh during the 2FA challenge returns the user to the credentials step.

Login:
- [ ] Entering credentials for a 2FA account shows a code step with no resend control and a working "Start over".
- [ ] `VerifyCodeForm` accepts `allowResend` (default true) and optional `onResend`; with `allowResend={false}` no timer runs and no resend button renders.
- [ ] The three existing `VerifyCodeForm` callers are behaviourally unchanged.

Settings:
- [ ] The settings loader fetches `meApi.me()`; the Security panel reads `twoFactorEnabled`, `phoneNumber`, `phoneNumberConfirmed`, `pendingPhoneNumber` and revalidates after each action (no parallel optimistic copy).
- [ ] The two-factor toggle reflects `twoFactorEnabled`; enable is one click, disable opens a password dialog; both refetch `/me` on success.
- [ ] The phone panel shows `phoneNumber` with a Confirmed/Unconfirmed badge driven by `phoneNumberConfirmed`; when `pendingPhoneNumber` is non-null it surfaces the interrupted change and offers "Enter code" (resume) plus "Use a different number".
- [ ] A 502 on phone change shows "we could not send a code to that number right now" copy, not a generic error.
- [ ] Panel renders correctly at 360px, 768px, 1280px; all actions keyboard-reachable; status conveyed by text+badge, not colour alone.

Phone input + validation (international, app-wide):
- [ ] `PhoneInput` (`app/components/common/phone-input.tsx`) exists with the same prop shape as the old `SouthAfricanPhoneInput` (`value` E.164, `onValueChange` E.164, optional `defaultCountry`), a country-picker trigger (flag + dial code), default country ZA, and derives the selected country from an existing E.164 `value`.
- [ ] The country picker is a `Popover` + `Command` searchable list (not `SearchSelectField`); shadcn `popover` and `command` are added.
- [ ] `app/lib/utils/phone.ts` is rewritten on `libphonenumber-js`, exporting `optionalPhoneSchema` / `requiredPhoneSchema` (both transform to E.164) and `getPhoneError`; the SA-only exports and hand-written tables are deleted.
- [ ] `SouthAfricanPhoneInput` is deleted and every call site (FormDialog, onboarding, public-calendar/details-step, signup, accept-invite, invite, Settings) imports `PhoneInput` and the new schemas; no call site still references the SA exports.
- [ ] A number invalid for the selected country (e.g. `12345` for ZA) is rejected client-side with a country-naming message on signup, accept-invite, invite, public booking, and Settings; a valid number is normalised to E.164 before sending.
- [ ] `FormDialog`'s `type: "tel"` path routes to the new schemas and renders `PhoneInput`; add-customer, edit-customer, company-settings, and invite dialogs work internationally with no per-form change.
- [ ] `libphonenumber-js` is added to `package.json` dependencies.

Display formatting:
- [ ] `formatPhoneForDisplay` exists in `phone.ts` and is applied at the 10 display sites; `company-header.tsx`'s `tel:` href stays raw E.164 while its visible label is formatted.

E2e:
- [ ] `playwright.config.ts`, `e2e/tsconfig.json`, and the WAHA fixture exist; app `tsc` excludes `e2e`.
- [ ] No host, API key, or session id is hardcoded in any e2e file; all come from env vars documented in `.env.example`.
- [ ] Specs exist for: 2FA login end-to-end, phone add-and-verify end-to-end, and phone-format rejection (invalid/non-SA number rejected client-side).

---

## 12. Suggested implementation subtasks (with dependencies)

1. **API types + error `code`** - `error.ts`, `http.ts`, `auth.ts` (types only), `users/types.ts`, `me/types.ts` (`CurrentUserResponse` +4 fields), `auth-errors.ts`. No deps. (Foundational.)
2. **Auth API methods** - `login`/`loginVerify` union + phone on `register`/`acceptInvite` in `auth.ts`; `meApi` 2FA + phone methods in `me/me.ts`. Depends on 1.
3. **Auth context** - `signIn` return shape, `verifyLoginCode`, phone params on `signUp`/`acceptInvite`, swap to `messageForApiError`. Depends on 2.
4. **`VerifyCodeForm` opt-out prop** - `verify-code-form.tsx`. No deps (independent of 1-3); can run in parallel.
5. **Login two-step route** - `login.tsx`. Depends on 3 and 4.
6. **International phone input (app-wide)** - add `libphonenumber-js` + shadcn `popover`/`command`; create `app/components/common/phone-input.tsx` and `app/lib/utils/countries.ts`; rewrite `app/lib/utils/phone.ts` (new schemas, delete SA exports); update `FormDialog` wiring (`:14,25-26,278-286,449-473`); migrate the non-auth call sites (`onboarding.tsx`, `public-calendar.tsx`, `details-step.tsx`); delete `south-african-phone-input.tsx`. Independent of the auth chain (1-5); can run in parallel. This is the prerequisite for all phone fields.
7. **Auth phone fields** - `signup.tsx`, `accept-invite.tsx`, `team.tsx` invite dialog, using `PhoneInput` + `optionalPhoneSchema`. Depends on 3 (context phone params) and 6 (component + schemas).
8. **Settings Security panel** - `settings.tsx` loader + `SecurityPanel` reading `/me` and revalidating, with `PhoneInput` + `optionalPhoneSchema` for the phone sub-flow. Depends on 1 (me type), 2 (meApi methods), 4 (`allowResend`), and 6 (phone input). Reads Risk R6 re: `FormDialog` error copy.
9. **Display formatting** - `formatPhoneForDisplay` in `phone.ts` + 10 display sites; `company-header.tsx` `tel:` href stays raw, its visible label formatted. Depends on 6.
10. **Playwright scaffolding** - config, `e2e/tsconfig.json`, app tsconfig exclude, `.env.example`, `package.json` scripts, WAHA fixture. No code deps; can start any time. Running the specs green depends on 5, 7, 8 **and** the migrations being applied (Prerequisites).
11. **E2e specs** - the three spec files. Depends on 10 and the features they exercise (5, 7, 8).

Parallelizable early: {1, 4, 6, 10-scaffold}. Critical path: 1 -> 2 -> 3 -> 5; task 7 after 3 and 6; task 8 after 1/2/4/6.
