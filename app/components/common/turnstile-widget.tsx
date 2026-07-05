import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";

const TURNSTILE_SITEKEY = import.meta.env.VITE_TURNSTILE_SITEKEY as
  string | undefined;
const SCRIPT_SRC =
  "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

declare global {
  interface Window {
    turnstile?: {
      render: (el: HTMLElement, opts: Record<string, unknown>) => string;
      reset: (id?: string) => void;
      remove: (id?: string) => void;
      getResponse: (id?: string) => string | undefined;
    };
  }
}

export type TurnstileStatus = "loading" | "ready" | "unavailable";
export interface TurnstileHandle {
  reset: () => void;
}

export const TurnstileWidget = forwardRef<
  TurnstileHandle,
  {
    onVerify: (token: string) => void;
    onExpire?: () => void;
    onStatusChange?: (status: TurnstileStatus) => void;
    action?: string;
    className?: string;
  }
>(function TurnstileWidget(
  { onVerify, onExpire, onStatusChange, action = "public-booking", className },
  ref,
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);

  useImperativeHandle(ref, () => ({
    reset: () => {
      if (window.turnstile && widgetIdRef.current) {
        window.turnstile.reset(widgetIdRef.current);
      }
    },
  }));

  useEffect(() => {
    if (!TURNSTILE_SITEKEY) {
      onStatusChange?.("unavailable");
      return;
    }

    function renderWidget() {
      if (!window.turnstile || !containerRef.current || widgetIdRef.current) {
        return;
      }
      widgetIdRef.current = window.turnstile.render(containerRef.current, {
        sitekey: TURNSTILE_SITEKEY,
        action,
        theme: "dark",
        callback: (token: string) => onVerify(token),
        "expired-callback": () => onExpire?.(),
        "error-callback": () => onExpire?.(),
      });
      onStatusChange?.("ready");
    }

    let script: HTMLScriptElement | null = null;
    if (window.turnstile) {
      renderWidget();
    } else {
      script = document.querySelector<HTMLScriptElement>(
        `script[src="${SCRIPT_SRC}"]`,
      );
      if (!script) {
        script = document.createElement("script");
        script.src = SCRIPT_SRC;
        script.async = true;
        script.defer = true;
        document.head.appendChild(script);
      }
      script.addEventListener("load", renderWidget);
      script.addEventListener("error", () => onStatusChange?.("unavailable"));
    }

    return () => {
      if (script) script.removeEventListener("load", renderWidget);
      if (window.turnstile && widgetIdRef.current) {
        window.turnstile.remove(widgetIdRef.current);
        widgetIdRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <div ref={containerRef} className={className} />;
});
