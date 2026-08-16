export const PAGE_SIZE = 20;

export function parsePage(searchParams: URLSearchParams): number {
  const requested = Number(searchParams.get("page"));
  return Number.isInteger(requested) && requested > 0 ? requested : 1;
}
