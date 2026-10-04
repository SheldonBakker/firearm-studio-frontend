import { Suspense, use, useEffect, useRef, useState } from "react";
import { useBlocker, useLocation, useNavigate } from "react-router";
import { toast } from "sonner";
import type { Route } from "./+types/product-new";
import { productsApi } from "~/lib/api/products/products";
import { mapProductError } from "~/lib/api/products/errors";
import {
  parseProductForm,
  type NormalizedProductForm,
  type ProductFormValues,
} from "~/lib/products/schema";
import { useSessionUser } from "~/context/auth-context";
import { can } from "~/lib/utils/rbac";
import { useConfirm } from "~/context/confirm-context";
import { PageWrap, BackLink } from "~/components/common/misc";
import { PageHeader } from "~/components/common/page-header";
import { Button } from "~/components/ui/button";
import { Icon } from "~/components/common/icon";
import { Skeleton } from "~/components/ui/skeleton";
import { ProductFormFields } from "~/components/products/product-form-fields";
import { ProductImageCard } from "~/components/products/product-image-card";
import type { CreateProductRequest } from "~/lib/api/products/types";

interface DuplicateState {
  name: string;
  description: string | null;
  category: string | null;
  price: number;
  costPrice: number | null;
  stockQuantity: number;
  isActive: boolean;
}

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

function blankFormValues(): ProductFormValues {
  return {
    name: "",
    sku: "",
    category: "",
    description: "",
    price: "",
    costPrice: "",
    stockQuantity: "0",
    isActive: true,
  };
}

function prefillFromDuplicate(state: DuplicateState): ProductFormValues {
  return {
    name: state.name,
    sku: "",
    category: state.category ?? "",
    description: state.description ?? "",
    price: String(state.price),
    costPrice: state.costPrice === null ? "" : String(state.costPrice),
    stockQuantity: String(state.stockQuantity),
    isActive: state.isActive,
  };
}

function buildCreateBody(n: NormalizedProductForm): CreateProductRequest {
  return {
    name: n.name,
    description: n.description,
    sku: n.sku,
    price: n.price,
    costPrice: n.costPrice,
    category: n.category,
    stockQuantity: n.stockQuantity,
    isActive: n.isActive,
  };
}

export function clientLoader() {
  return { categories: productsApi.categories() };
}

export default function ProductNew({ loaderData }: Route.ComponentProps) {
  const user = useSessionUser();
  const navigate = useNavigate();
  if (!can(user, "products:write")) {
    return (
      <PageWrap>
        <BackLink label="Back to products" onClick={() => navigate("/products")} />
        <div className="rounded-2xl border border-border bg-card px-4 py-12 text-center">
          <p className="text-sm font-semibold text-foreground">
            You do not have permission to add products.
          </p>
        </div>
      </PageWrap>
    );
  }
  return (
    <PageWrap>
      <BackLink label="Back to products" onClick={() => navigate("/products")} />
      <Suspense fallback={<Skeleton className="h-96 w-full rounded-2xl" />}>
        <ProductNewForm categoriesPromise={loaderData.categories} />
      </Suspense>
    </PageWrap>
  );
}

function ProductNewForm({
  categoriesPromise,
}: {
  categoriesPromise: Promise<string[]>;
}) {
  const categories = use(categoriesPromise);
  const navigate = useNavigate();
  const confirm = useConfirm();
  const location = useLocation();
  const prefill = location.state as DuplicateState | null;
  const baseline = useRef<ProductFormValues>(
    prefill ? prefillFromDuplicate(prefill) : blankFormValues(),
  );
  const [values, setValues] = useState<ProductFormValues>(baseline.current);
  const [errors, setErrors] = useState<
    Partial<Record<keyof ProductFormValues, string>>
  >({});
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const savedRef = useRef(false);

  useEffect(() => {
    if (!image) {
      setPreview(null);
      return;
    }
    const url = URL.createObjectURL(image);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [image]);

  const dirty =
    !savedRef.current &&
    !saving &&
    (JSON.stringify(values) !== JSON.stringify(baseline.current) ||
      image !== null);

  const blocker = useBlocker(
    (args) =>
      dirty && args.nextLocation.pathname !== args.currentLocation.pathname,
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
    setErrors({});
    setSaving(true);
    let created;
    try {
      created = await productsApi.create(buildCreateBody(parsed.data));
    } catch (err) {
      const outcome = mapProductError(err);
      if (outcome.kind === "sku-conflict") {
        setErrors({ sku: outcome.message });
      } else {
        toast.error(outcome.message);
      }
      setSaving(false);
      return;
    }
    if (image) {
      try {
        await productsApi.uploadImage(created.id, image);
      } catch (err) {
        savedRef.current = true;
        toast.error("Product created, but the image did not upload.");
        navigate(`/products/${created.id}`, {
          state: { imageError: mapProductError(err) },
        });
        return;
      }
    }
    savedRef.current = true;
    toast.success("Product created");
    navigate("/products");
  }

  return (
    <>
      <PageHeader
        title="New product"
        actions={
          <Button disabled={saving} onClick={onSave}>
            {saving ? "Saving..." : "Create product"}
          </Button>
        }
      />
      <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-6">
        <ProductFormFields
          values={values}
          errors={errors}
          disabled={false}
          categories={categories}
          onChange={onChange}
        />
        <div className="mt-6 lg:mt-0">
          <ProductImageCard
            imageUrl={null}
            pendingPreview={preview}
            disabled={false}
            busy={false}
            error={null}
            retryable={false}
            onSelectFile={setImage}
            onRemove={() => setImage(null)}
            onRetry={() => {}}
          />
        </div>
      </div>
    </>
  );
}
