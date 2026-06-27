/** Firearm Studio shield logo mark + wordmark. */
export function BrandMark({ size = 34 }: { size?: number }) {
  return (
    <div
      className="flex items-center justify-center rounded-[9px]"
      style={{
        width: size,
        height: size,
        background: "linear-gradient(135deg,#E8973C,#C9742A)",
        boxShadow: "0 4px 14px rgba(232,151,60,.3)",
      }}
    >
      <svg
        width={size * 0.56}
        height={size * 0.56}
        viewBox="0 0 24 24"
        fill="none"
      >
        <path
          d="M12 2l8 4v5c0 4.7-3.3 8-8 9.5C7.3 19 4 15.7 4 11V6l8-4z"
          stroke="#1a1206"
          strokeWidth={1.8}
          strokeLinejoin="round"
        />
        <path
          d="M9 11.5l2 2 4-4.5"
          stroke="#1a1206"
          strokeWidth={1.8}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

export function BrandLockup() {
  return (
    <div className="flex items-center gap-2.5">
      <BrandMark />
      <div>
        <div className="text-[15px] font-bold leading-none tracking-tight text-foreground">
          Firearm Studio
        </div>
        <div className="mt-[3px] font-mono text-[10.5px] font-semibold uppercase tracking-[0.12em] text-dim">
          Storage &amp; Compliance
        </div>
      </div>
    </div>
  );
}
