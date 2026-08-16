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
    if (err.code === "Auth.ChallengeUnavailable") {
      return CODE_COPY[err.code];
    }
    return "Too many requests. Wait a moment and try again.";
  }
  if (err.status === 502) {
    return "We couldn't send a code to that number right now. Please try again.";
  }
  if (err.code && CODE_COPY[err.code]) {
    return CODE_COPY[err.code];
  }
  return err.message;
}
