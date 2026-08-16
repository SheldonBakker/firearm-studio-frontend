import { Button } from "~/components/ui/button";

interface PageInfo {
  pageNumber: number;
  pageSize: number;
  totalCount: number;
}

interface PaginationProps {
  page: PageInfo;
  onPage: (newPage: number) => void;
  separator?: string;
}

export function Pagination({ page, onPage, separator = "–" }: PaginationProps) {
  if (page.totalCount <= page.pageSize) return null;
  return (
    <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
      <span className="text-[12.5px] text-muted-foreground">
        Showing{" "}
        {(page.pageNumber - 1) * page.pageSize + 1}
        {separator}
        {Math.min(page.pageNumber * page.pageSize, page.totalCount)}{" "}
        of {page.totalCount}
      </span>
      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          disabled={page.pageNumber <= 1}
          onClick={() => onPage(page.pageNumber - 1)}
        >
          Previous
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={page.pageNumber * page.pageSize >= page.totalCount}
          onClick={() => onPage(page.pageNumber + 1)}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
