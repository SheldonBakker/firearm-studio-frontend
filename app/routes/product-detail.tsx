import { useCallback, useEffect, useRef, useState } from "react";
import { useBlocker, useLocation, useNavigate } from "react-router";
import { toast } from "sonner";
import type { Route } from "./+types/product-detail";
import { productsApi } from "~/lib/api/products/products";
import {
  mapProductError,
  type ProductErrorOutcome,
} from "~/lib/api/products/errors";
import {
  buildProductPatch,
  parseProductForm,
  type ProductFormValues,
} from "~/lib/products/schema";
import { useSessionUser } from "~/context/auth-context";
import { can } from "~/lib/utils/rbac";
import { useConfirm } from "~/context/confirm-context";
import { fmtDate } from "~/lib/utils/format";
import { useVisibilityRefetch } from "~/hooks/use-visibility-refetch";
import { PageWrap, BackLink } from "~/components/common/misc";
import { PageHeader } from "~/components/common/page-header";
import { Resolve, DetailSkeleton } from "~/components/common/skeletons";
import { StatusBadge } from "~/components/common/status-badge";
import { Button } from "~/components/ui/button";
import { Icon } from "~/components/common/icon";
import { ProductFormFields } from "~/components/products/product-form-fields";
import { ProductImageCard } from "~/components/products/product-image-card";
import type { ProductResponse } from "~/lib/api/products/types";

const FIELD_IDS: Record<keyof ProductFormValues, string> = {
  name: "product-name",
  sku: "product-sku",
  category: "product-category",
  description: "product-description",
  price: "product-price",
  costPrice: "product-cost",
  stockQuantity: "product-stock",
  isActive: "product-active",
};

function focusFirstError(errors: Partial<Record<keyof ProductFormValues, string>>) {
  for (const key of Object.keys(FIELD_IDS) as (keyof ProductFormValues)[]) {
    if (errors[key]) {
      document.getElementById(FIELD_IDS[key])?.focus();
      return;
    }
  }
}

function toFormValues(p: ProductResponse): ProductFormValues {
  return {
    name: p.name,
    sku: p.sku ?? "",
    category: p.category ?? "",
    description: p.description ?? "",
    price: String(p.price),
    costPrice: p.costPrice === null ? "" : String(p.costPrice),
    stockQuantity: String(p.stockQuantity),
    isActive: p.isActive,
  };
}

export function clientLoader({ params }: Route.ClientLoaderArgs) {
  return {
    data: productsApi.get(params.id).catch((err: unknown) => {
      const outcome = mapProductError(err);
      if (outcome.kind === "not-found") return null;
      throw err;
    }),
    categories: productsApi.categories(),
  };
}

export default function ProductDetail({ loaderData }: Route.ComponentProps) {
  const navigate = useNavigate();
  return (
    <PageWrap>
      <BackLink label="Back to products" onClick={() => navigate("/products")} />
      <Resolve resolve={loaderData.data} fallback={<DetailSkeleton />}>
        {(product) =>
          product ? (
            <ProductEditView
              product={product}
              categoriesPromise={loaderData.categories}
            />
          ) : (
            <MissingProduct />
          )
        }
      </Resolve>
    </PageWrap>
  );
}

function MissingProduct() {
  const navigate = useNavigate();
  useEffect(() => {
    toast.error("This product no longer exists.");
    navigate("/products", { replace: true });
  }, [navigate]);
  return null;
}

function ProductEditView({
  product,
  categoriesPromise,
}: {
  product: ProductResponse;
  categoriesPromise: Promise<string[]>;
}) {
  const navigate = useNavigate();
  const confirm = useConfirm();
  const user = useSessionUser();
  const location = useLocation();
  const canWrite = can(user, "products:write");
  const initialImageError = (location.state as { imageError?: ProductErrorOutcome } | null)
    ?.imageError;

  const [categories, setCategories] = useState<string[]>([]);
  useEffect(() => {
    let active = true;
    categoriesPromise.then((list) => {
      if (active) setCategories(list);
    });
    return () => {
      active = false;
    };
  }, [categoriesPromise]);

  const [original, setOriginal] = useState<ProductResponse>(product);
  const [values, setValues] = useState<ProductFormValues>(toFormValues(product));
  const [errors, setErrors] = useState<
    Partial<Record<keyof ProductFormValues, string>>
  >({});
  const [saving, setSaving] = useState(false);
  const savedRef = useRef(false);

  const [imageUrl, setImageUrl] = useState<string | null>(product.imageUrl);
  const [preview, setPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [imageError, setImageError] = useState<string | null>(
    initialImageError?.message ?? null,
  );
  const [retryable, setRetryable] = useState<boolean>(
    initialImageError?.kind === "image" ? initialImageError.retryable : false,
  );
  const lastFile = useRef<File | null>(null);
  const previewRef = useRef<string | null>(null);
  previewRef.current = preview;
  const busyRef = useRef(false);
  busyRef.current = busy;

  function clearPreview() {
    if (previewRef.current) URL.revokeObjectURL(previewRef.current);
    previewRef.current = null;
    setPreview(null);
  }

  useEffect(() => {
    return () => {
      if (previewRef.current) URL.revokeObjectURL(previewRef.current);
    };
  }, []);

  const dirty =
    canWrite &&
    !saving &&
    JSON.stringify(values) !== JSON.stringify(toFormValues(original));
  const dirtyRef = useRef(dirty);
  dirtyRef.current = dirty;

  const refreshImageUrl = useCallback(async () => {
    try {
      const fresh = await productsApi.get(product.id);
      setImageUrl(fresh.imageUrl);
    } catch {
      return;
    }
  }, [product.id]);
  useVisibilityRefetch(50 * 60 * 1000, () => {
    if (!busyRef.current) void refreshImageUrl();
  });

  const blocker = useBlocker(
    (args) =>
      dirtyRef.current &&
      !savedRef.current &&
      args.nextLocation.pathname !== args.currentLocation.pathname,
  );

  useEffect(() => {
    if (blocker.state !== "blocked") return;
    let active = true;
    (async () => {
      const ok = await confirm({
        title: "Discard changes?",
        description: "You have unsaved changes.",
        confirmLabel: "Discard",
        cancelLabel: "Keep editing",
        destructive: true,
      });
      if (!active) return;
      if (ok) blocker.proceed();
      else blocker.reset();
    })();
    return () => {
      active = false;
    };
  }, [blocker, confirm]);

  function onChange<K extends keyof ProductFormValues>(
    name: K,
    value: ProductFormValues[K],
  ) {
    setValues((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => {
      if (!prev[name]) return prev;
      const next = { ...prev };
      delete next[name];
      return next;
    });
  }

  async function onSave() {
    const parsed = parseProductForm(values);
    if (!parsed.ok) {
      setErrors(parsed.fieldErrors);
      focusFirstError(parsed.fieldErrors);
      return;
    }
    const patch = buildProductPatch(original, parsed.data);
    if (Object.keys(patch).length === 0) {
      toast("No changes to save");
      return;
    }
    setErrors({});
    setSaving(true);
    try {
      const updated = await productsApi.update(original.id, patch);
      setOriginal(updated);
      setValues(toFormValues(updated));
      toast.success("Product updated");
    } catch (err) {
      const outcome = mapProductError(err);
      if (outcome.kind === "sku-conflict") {
        setErrors({ sku: outcome.message });
      } else if (outcome.kind === "not-found") {
        toast.error(outcome.message);
        savedRef.current = true;
        navigate("/products");
      } else {
        toast.error(outcome.message);
      }
    } finally {
      setSaving(false);
    }
  }

  async function uploadFile(file: File) {
    lastFile.current = file;
    clearPreview();
    const url = URL.createObjectURL(file);
    previewRef.current = url;
    setPreview(url);
    setBusy(true);
    setImageError(null);
    try {
      const updated = await productsApi.uploadImage(original.id, file);
      setImageUrl(updated.imageUrl);
      clearPreview();
      toast.success("Image updated");
    } catch (err) {
      clearPreview();
      const outcome = mapProductError(err);
      setImageError(outcome.message);
      setRetryable(outcome.kind === "image" ? outcome.retryable : false);
      toast.error(outcome.message);
    } finally {
      setBusy(false);
    }
  }

  async function onRemoveImage() {
    const ok = await confirm({
      title: "Remove image",
      description: "Remove this product image?",
      confirmLabel: "Remove",
      destructive: true,
    });
    if (!ok) return;
    setBusy(true);
    setImageError(null);
    try {
      await productsApi.removeImage(original.id);
      setImageUrl(null);
      clearPreview();
      toast.success("Image removed");
    } catch (err) {
      const outcome = mapProductError(err);
      if (outcome.kind === "not-found") {
        setImageUrl(null);
        clearPreview();
        toast.success("Image removed");
      } else {
        toast.error(outcome.message);
      }
    } finally {
      setBusy(false);
    }
  }

  async function onDelete() {
    const ok = await confirm({
      title: "Delete product",
      description: `Delete "${original.name}"? This cannot be undone.`,
      confirmLabel: "Delete",
      destructive: true,
    });
    if (!ok) return;
    try {
      await productsApi.remove(original.id);
      savedRef.current = true;
      toast.success("Product deleted");
      navigate("/products");
    } catch (err) {
      toast.error(mapProductError(err).message);
    }
  }

  return (
    <>
      <PageHeader
        title={original.name}
        subtitle={
          <span className="flex items-center gap-2">
            <StatusBadge status={original.isActive ? "Active" : "Inactive"} />
            <span>·</span>
            <span>Added {fmtDate(original.createdAt)}</span>
          </span>
        }
        actions={
          canWrite && (
            <>
              <Button variant="destructive" onClick={onDelete}>
                <Icon name="alert" size={15} />
                Delete
              </Button>
              <Button disabled={saving} onClick={onSave}>
                {saving ? "Saving..." : "Save changes"}
              </Button>
            </>
          )
        }
      />
      <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-6">
        <ProductFormFields
          values={values}
          errors={errors}
          disabled={!canWrite}
          categories={categories}
          onChange={onChange}
        />
        <div className="mt-6 lg:mt-0">
          <ProductImageCard
            imageUrl={imageUrl}
            pendingPreview={preview}
            disabled={!canWrite}
            busy={busy}
            error={imageError}
            retryable={retryable}
            onSelectFile={uploadFile}
            onRemove={onRemoveImage}
            onRetry={() => {
              if (lastFile.current) uploadFile(lastFile.current);
            }}
          />
        </div>
      </div>
    </>
  );
}
