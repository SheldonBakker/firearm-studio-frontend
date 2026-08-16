import type {
  PublicBookingOptionsResponse,
  PublicInvoiceBankingResponse,
  PublicPackageResponse,
  PublicRangeResponse,
} from "~/lib/api/public/types";
import { fmtDate } from "~/lib/utils/format";
import { todayInSast } from "~/lib/utils/sast";

export const hhmm = (t: string) => t.slice(0, 5);

export type SlotRef = { startTime: string; endTime: string };

export type Step = 1 | 2 | 3 | 4;

export type CartItem = {
  key: string;
  rangeId: string;
  packageId: string;
  shooterCount: number;
  date: string;
  slot: SlotRef;
};

export type Draft = {
  rangeId: string;
  packageId: string;
  shooterCount: number;
  year: number;
  month: number;
  selectedDate: string | null;
  slot: SlotRef | null;
};

export type CartState = {
  step: Step;
  items: CartItem[];
  draft: Draft;
  fullName: string;
  email: string;
  phone: string;
};

export type CartAction =
  | { type: "SET_RANGE"; rangeId: string }
  | { type: "SET_PACKAGE"; packageId: string; maxShooters: number }
  | { type: "SET_SHOOTERS"; value: number }
  | { type: "SET_MONTH"; year: number; month: number }
  | { type: "SET_DATE"; date: string | null }
  | { type: "SET_SLOT"; slot: SlotRef | null }
  | { type: "ADD_ITEM"; key: string }
  | { type: "REMOVE_ITEM"; key: string }
  | { type: "SET_CONTACT"; field: "fullName" | "email" | "phone"; value: string }
  | { type: "GOTO"; step: Step }
  | { type: "NEXT" }
  | { type: "BACK" }
  | { type: "RESET"; state: CartState }
  | { type: "HYDRATE"; state: CartState };

export type ConfirmationState = {
  count: number;
  refs: string[];
  invoiceNumber: string | null;
  total: number;
  depositAmount: number | null;
  depositDueAt: string | null;
  email: string;
  banking: PublicInvoiceBankingResponse | null;
} | null;

function clampShooters(n: number, max: number): number {
  const cap = Math.max(1, max);
  if (!Number.isFinite(n)) return 1;
  return Math.min(Math.max(1, Math.round(n)), cap);
}

export function cartReducer(state: CartState, action: CartAction): CartState {
  const { draft } = state;
  switch (action.type) {
    case "SET_RANGE":
      return {
        ...state,
        draft: { ...draft, rangeId: action.rangeId, selectedDate: null, slot: null },
      };
    case "SET_PACKAGE":
      return {
        ...state,
        draft: {
          ...draft,
          packageId: action.packageId,
          shooterCount: clampShooters(draft.shooterCount, action.maxShooters),
          selectedDate: null,
          slot: null,
        },
      };
    case "SET_SHOOTERS":
      return { ...state, draft: { ...draft, shooterCount: action.value } };
    case "SET_MONTH":
      return {
        ...state,
        draft: {
          ...draft,
          year: action.year,
          month: action.month,
          selectedDate: null,
          slot: null,
        },
      };
    case "SET_DATE":
      return { ...state, draft: { ...draft, selectedDate: action.date, slot: null } };
    case "SET_SLOT":
      return { ...state, draft: { ...draft, slot: action.slot } };
    case "ADD_ITEM": {
      if (!draft.selectedDate || !draft.slot) return state;
      const item: CartItem = {
        key: action.key,
        rangeId: draft.rangeId,
        packageId: draft.packageId,
        shooterCount: draft.shooterCount,
        date: draft.selectedDate,
        slot: draft.slot,
      };
      const dup = state.items.some(
        (i) =>
          i.rangeId === item.rangeId &&
          i.date === item.date &&
          i.slot.startTime === item.slot.startTime,
      );
      if (dup) return state;
      return {
        ...state,
        items: [...state.items, item],
        draft: { ...draft, slot: null },
      };
    }
    case "REMOVE_ITEM":
      return { ...state, items: state.items.filter((i) => i.key !== action.key) };
    case "SET_CONTACT":
      return { ...state, [action.field]: action.value };
    case "GOTO":
      return { ...state, step: action.step };
    case "NEXT":
      return { ...state, step: Math.min(4, state.step + 1) as Step };
    case "BACK":
      return { ...state, step: Math.max(1, state.step - 1) as Step };
    case "RESET":
    case "HYDRATE":
      return action.state;
    default:
      return state;
  }
}

export function makeInitialCart(
  options: PublicBookingOptionsResponse,
): CartState {
  const ranges = options.ranges ?? [];
  const packages = options.packages ?? [];
  const today = todayInSast();
  return {
    step: 1,
    items: [],
    draft: {
      rangeId: ranges[0]?.id ?? "",
      packageId: packages[0]?.id ?? "",
      shooterCount: 1,
      year: Number(today.slice(0, 4)),
      month: Number(today.slice(5, 7)),
      selectedDate: null,
      slot: null,
    },
    fullName: "",
    email: "",
    phone: "",
  };
}

export function newKey(): string {
  try {
    if (typeof crypto !== "undefined" && crypto.randomUUID) {
      return crypto.randomUUID();
    }
  } catch {}
  return `k-${Date.now()}-${Math.round(Math.random() * 1e9)}`;
}

const cartKey = (companyId: string) => `fs:booking-cart:${companyId}`;

function isSlotRef(v: unknown): v is SlotRef {
  return (
    !!v &&
    typeof (v as SlotRef).startTime === "string" &&
    typeof (v as SlotRef).endTime === "string"
  );
}

export function readCart(
  companyId: string,
  options: PublicBookingOptionsResponse,
): CartState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(cartKey(companyId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<CartState>;
    const base = makeInitialCart(options);
    const ranges = options.ranges ?? [];
    const packages = options.packages ?? [];
    const todayKey = todayInSast();

    const pd = (parsed.draft ?? {}) as Partial<Draft>;
    const dRangeId = ranges.some((r) => r.id === pd.rangeId)
      ? (pd.rangeId as string)
      : base.draft.rangeId;
    const dPackageId = packages.some((p) => p.id === pd.packageId)
      ? (pd.packageId as string)
      : base.draft.packageId;
    const dMax = packages.find((p) => p.id === dPackageId)?.maxShooters ?? 1;
    const dYear = Number.isInteger(pd.year)
      ? (pd.year as number)
      : base.draft.year;
    const dMonth =
      Number.isInteger(pd.month) &&
      (pd.month as number) >= 1 &&
      (pd.month as number) <= 12
        ? (pd.month as number)
        : base.draft.month;
    let dDate = typeof pd.selectedDate === "string" ? pd.selectedDate : null;
    if (dDate && dDate < todayKey) dDate = null;
    let dSlot = isSlotRef(pd.slot) ? pd.slot : null;
    if (!dDate) dSlot = null;

    const items: CartItem[] = Array.isArray(parsed.items)
      ? (parsed.items as Partial<CartItem>[])
          .filter(
            (i) =>
              i &&
              ranges.some((r) => r.id === i.rangeId) &&
              packages.some((p) => p.id === i.packageId) &&
              typeof i.date === "string" &&
              i.date >= todayKey &&
              isSlotRef(i.slot),
          )
          .map((i) => ({
            key: typeof i.key === "string" ? i.key : newKey(),
            rangeId: i.rangeId as string,
            packageId: i.packageId as string,
            shooterCount: clampShooters(
              Number(i.shooterCount),
              packages.find((p) => p.id === i.packageId)?.maxShooters ?? 1,
            ),
            date: i.date as string,
            slot: i.slot as SlotRef,
          }))
      : [];

    return {
      step: 1,
      items,
      draft: {
        rangeId: dRangeId,
        packageId: dPackageId,
        shooterCount: clampShooters(Number(pd.shooterCount), dMax),
        year: dYear,
        month: dMonth,
        selectedDate: dDate,
        slot: dSlot,
      },
      fullName: typeof parsed.fullName === "string" ? parsed.fullName : "",
      email: typeof parsed.email === "string" ? parsed.email : "",
      phone: typeof parsed.phone === "string" ? parsed.phone : "",
    };
  } catch {
    return null;
  }
}

export function writeCart(companyId: string, state: CartState) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(cartKey(companyId), JSON.stringify(state));
  } catch {}
}

export function clearCart(companyId: string) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(cartKey(companyId));
  } catch {}
}

export function clearAllCarts() {
  if (typeof window === "undefined") return;
  try {
    const keys: string[] = [];
    for (let i = 0; i < window.localStorage.length; i++) {
      const k = window.localStorage.key(i);
      if (k?.startsWith("fs:booking-cart:")) keys.push(k);
    }
    keys.forEach((k) => window.localStorage.removeItem(k));
  } catch {}
}

export type ItemView = {
  rangeName: string;
  pkgName: string;
  price: number;
  dateLabel: string;
  timeLabel: string;
  shooterCount: number;
};

export function itemView(
  item: CartItem,
  ranges: PublicRangeResponse[],
  packages: PublicPackageResponse[],
): ItemView {
  const range = ranges.find((r) => r.id === item.rangeId);
  const pkg = packages.find((p) => p.id === item.packageId);
  return {
    rangeName: range?.name ?? "Range",
    pkgName: pkg?.name ?? "Package",
    price: pkg?.price ?? 0,
    dateLabel: fmtDate(item.date),
    timeLabel: `${hhmm(item.slot.startTime)} – ${hhmm(item.slot.endTime)}`,
    shooterCount: item.shooterCount,
  };
}

export function cartTotal(
  items: CartItem[],
  packages: PublicPackageResponse[],
): number {
  return items.reduce(
    (sum, i) => sum + (packages.find((p) => p.id === i.packageId)?.price ?? 0),
    0,
  );
}
