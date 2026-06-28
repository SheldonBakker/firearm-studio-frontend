export function BrandMark({ size = 34 }: { size?: number }) {
  return (
    <img
      src="/icon-192.png"
      alt="Firearm Studio"
      width={size}
      height={size}
      style={{
        width: size,
        height: size,
        borderRadius: Math.round(size * 0.26),
        boxShadow: "0 4px 14px rgba(0,0,0,.35)",
        display: "block",
      }}
    />
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
        <div className="mt-0.75 font-mono text-[10.5px] font-semibold uppercase tracking-[0.12em] text-dim">
          Storage &amp; Compliance
        </div>
      </div>
    </div>
  );
}
