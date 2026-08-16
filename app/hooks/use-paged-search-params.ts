import { useSearchParams } from "react-router";

export function usePagedSearchParams() {
  const [searchParams, setSearchParams] = useSearchParams();

  const navigatePage = (newPage: number) => {
    const next = new URLSearchParams(searchParams);
    if (newPage <= 1) next.delete("page");
    else next.set("page", String(newPage));
    setSearchParams(next);
  };

  return { searchParams, setSearchParams, navigatePage };
}
