import { useState } from "react";
import { Icon } from "~/components/common/icon";

export function Thumbnail({
  src,
  alt,
  size = 40,
}: {
  src: string | null;
  alt: string;
  size?: number;
}) {
  const [errored, setErrored] = useState(false);
  const showImage = src !== null && !errored;
  return (
    <div
      className="flex shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-secondary text-dim"
      style={{ width: size, height: size }}
    >
      {showImage ? (
        <img
          src={src}
          alt={alt}
          width={size}
          height={size}
          className="h-full w-full object-cover"
          onError={() => setErrored(true)}
        />
      ) : (
        <span aria-hidden="true">
          <Icon name="package" size={Math.round(size * 0.5)} />
        </span>
      )}
    </div>
  );
}
