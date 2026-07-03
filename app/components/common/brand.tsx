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
