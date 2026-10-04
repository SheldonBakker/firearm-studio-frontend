import { useRef, useState } from "react";
import { Progress } from "~/components/ui/progress";
import { Button } from "~/components/ui/button";
import { Icon } from "~/components/common/icon";
import { SectionTitle } from "~/components/common/misc";
import { cn } from "~/lib/utils/cn";
import { IMAGE_ACCEPT, IMAGE_MAX_BYTES } from "~/lib/products/constants";

export interface ProductImageCardProps {
  imageUrl: string | null;
  pendingPreview: string | null;
  disabled: boolean;
  busy: boolean;
  error: string | null;
  retryable: boolean;
  onSelectFile: (file: File) => void;
  onRemove: () => void;
  onRetry: () => void;
  retryOpensPicker?: boolean;
}

function validate(file: File): string | null {
  if (!(IMAGE_ACCEPT as readonly string[]).includes(file.type)) {
    return "Choose a JPEG, PNG, or WEBP image.";
  }
  if (file.size > IMAGE_MAX_BYTES) {
    return "Image must be 5 MB or smaller.";
  }
  return null;
}

export function ProductImageCard(props: ProductImageCardProps) {
  const {
    imageUrl,
    pendingPreview,
    disabled,
    busy,
    error,
    retryable,
    onSelectFile,
    onRemove,
    onRetry,
    retryOpensPicker = false,
  } = props;
  const inputRef = useRef<HTMLInputElement>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const preview = pendingPreview ?? imageUrl;

  function handleFile(file: File | undefined) {
    if (!file) return;
    const message = validate(file);
    if (message) {
      setLocalError(message);
      return;
    }
    setLocalError(null);
    onSelectFile(file);
  }

  const shownError = localError ?? error;

  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <SectionTitle>Image</SectionTitle>
      {preview ? (
        <div className="overflow-hidden rounded-xl border border-border bg-secondary">
          <img src={preview} alt="Product" className="h-48 w-full object-cover" />
        </div>
      ) : (
        <button
          type="button"
          disabled={disabled}
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => {
            if (disabled) return;
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            if (disabled) return;
            e.preventDefault();
            setDragging(false);
            handleFile(e.dataTransfer.files[0]);
          }}
          className={cn(
            "flex h-48 w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed text-dim transition-colors",
            dragging ? "border-primary bg-secondary" : "border-border",
            disabled && "pointer-events-none opacity-50",
          )}
        >
          <Icon name="plus" size={22} />
          <span className="text-[12.5px]">Tap to choose an image</span>
          <span className="text-[11px]">JPEG, PNG, or WEBP up to 5 MB</span>
        </button>
      )}

      {busy && <Progress className="mt-3 animate-pulse" />}

      {shownError && (
        <div className="mt-3 flex items-center justify-between gap-2">
          <p className="text-[12px] font-medium text-destructive">{shownError}</p>
          {retryable && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                retryOpensPicker ? inputRef.current?.click() : onRetry()
              }
            >
              {retryOpensPicker ? "Choose the image again" : "Retry"}
            </Button>
          )}
        </div>
      )}

      {!disabled && (
        <div className="mt-3 flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={busy}
            onClick={() => inputRef.current?.click()}
          >
            {preview ? "Replace" : "Choose image"}
          </Button>
          {preview && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={busy}
              onClick={onRemove}
            >
              Remove
            </Button>
          )}
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => {
          handleFile(e.target.files?.[0]);
          e.target.value = "";
        }}
      />
    </div>
  );
}
