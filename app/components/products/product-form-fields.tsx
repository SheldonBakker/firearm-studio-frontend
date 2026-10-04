import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Switch } from "~/components/ui/switch";
import { SectionTitle } from "~/components/common/misc";
import { fmtMoney } from "~/lib/utils/format";
import { fmtMarginPercent, marginAmount } from "~/lib/products/margin";
import { CategoryInput } from "./category-input";
import type { ProductFormValues } from "~/lib/products/schema";

type FieldKey = keyof ProductFormValues;

export interface ProductFormFieldsProps {
  values: ProductFormValues;
  errors: Partial<Record<FieldKey, string>>;
  disabled: boolean;
  categories: string[];
  onChange: <K extends FieldKey>(name: K, value: ProductFormValues[K]) => void;
}

function parseMoney(value: string): number | null {
  const trimmed = value.trim();
  if (!/^\d+(\.\d{1,2})?$/.test(trimmed)) return null;
  return Number(trimmed);
}

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} className="text-[12px] font-medium text-destructive">
      {message}
    </p>
  );
}

export function ProductFormFields(props: ProductFormFieldsProps) {
  const { values, errors, disabled, categories, onChange } = props;
  const priceNum = parseMoney(values.price);
  const costNum = parseMoney(values.costPrice);
  let marginLine = "Add a cost price to see margin";
  if (priceNum !== null && priceNum > 0 && costNum !== null) {
    marginLine = `${fmtMoney(marginAmount(priceNum, costNum))} margin at ${fmtMarginPercent(priceNum, costNum)}`;
  }
  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-2xl border border-border bg-card p-6">
        <SectionTitle>Details</SectionTitle>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="product-name">
              Name<span className="text-destructive"> *</span>
            </Label>
            <Input
              id="product-name"
              value={values.name}
              disabled={disabled}
              aria-invalid={Boolean(errors.name)}
              aria-describedby={errors.name ? "product-name-error" : undefined}
              onChange={(e) => onChange("name", e.target.value)}
            />
            <FieldError id="product-name-error" message={errors.name} />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="product-sku">SKU</Label>
            <Input
              id="product-sku"
              className="font-mono"
              value={values.sku}
              disabled={disabled}
              aria-invalid={Boolean(errors.sku)}
              aria-describedby={errors.sku ? "product-sku-error" : undefined}
              onChange={(e) => onChange("sku", e.target.value)}
            />
            <FieldError id="product-sku-error" message={errors.sku} />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="product-category">Category</Label>
            <CategoryInput
              id="product-category"
              value={values.category}
              options={categories}
              disabled={disabled}
              onChange={(value) => onChange("category", value)}
            />
            <FieldError id="product-category-error" message={errors.category} />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="product-description">Description</Label>
            <textarea
              id="product-description"
              rows={4}
              value={values.description}
              disabled={disabled}
              aria-invalid={Boolean(errors.description)}
              aria-describedby={
                errors.description ? "product-description-error" : undefined
              }
              onChange={(e) => onChange("description", e.target.value)}
              className="rounded-md border border-input bg-transparent px-3 py-2 text-sm outline-none focus-visible:border-ring disabled:opacity-50"
            />
            <FieldError
              id="product-description-error"
              message={errors.description}
            />
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-6">
        <SectionTitle>Pricing and stock</SectionTitle>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="product-price">
              Price<span className="text-destructive"> *</span>
            </Label>
            <Input
              id="product-price"
              type="number"
              step="0.01"
              inputMode="decimal"
              value={values.price}
              disabled={disabled}
              aria-invalid={Boolean(errors.price)}
              aria-describedby={errors.price ? "product-price-error" : undefined}
              onChange={(e) => onChange("price", e.target.value)}
            />
            <FieldError id="product-price-error" message={errors.price} />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="product-cost">Cost price</Label>
            <Input
              id="product-cost"
              type="number"
              step="0.01"
              inputMode="decimal"
              value={values.costPrice}
              disabled={disabled}
              aria-invalid={Boolean(errors.costPrice)}
              aria-describedby={errors.costPrice ? "product-cost-error" : undefined}
              onChange={(e) => onChange("costPrice", e.target.value)}
            />
            <FieldError id="product-cost-error" message={errors.costPrice} />
          </div>
          <div className="sm:col-span-2">
            <p className="text-[12.5px] text-muted-foreground">{marginLine}</p>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="product-stock">
              Stock quantity<span className="text-destructive"> *</span>
            </Label>
            <Input
              id="product-stock"
              type="number"
              step="1"
              inputMode="numeric"
              value={values.stockQuantity}
              disabled={disabled}
              aria-invalid={Boolean(errors.stockQuantity)}
              aria-describedby={
                errors.stockQuantity ? "product-stock-error" : undefined
              }
              onChange={(e) => onChange("stockQuantity", e.target.value)}
            />
            <FieldError id="product-stock-error" message={errors.stockQuantity} />
          </div>
          <div className="flex items-center gap-3 pt-7">
            <Switch
              id="product-active"
              checked={values.isActive}
              disabled={disabled}
              onCheckedChange={(next) => onChange("isActive", next)}
            />
            <Label htmlFor="product-active">Active</Label>
          </div>
        </div>
      </div>
    </div>
  );
}
