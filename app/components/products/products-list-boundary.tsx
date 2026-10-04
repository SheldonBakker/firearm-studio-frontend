import { Component, type ReactNode } from "react";
import { ApiError } from "~/lib/api/http";
import { Button } from "~/components/ui/button";
import { Icon } from "~/components/common/icon";

export class ProductsListBoundary extends Component<
  { resetKey: unknown; onRetry: () => void; children: ReactNode },
  { error: unknown }
> {
  state: { error: unknown } = { error: null };

  static getDerivedStateFromError(error: unknown) {
    return { error };
  }

  componentDidUpdate(prev: { resetKey: unknown }) {
    if (prev.resetKey !== this.props.resetKey && this.state.error !== null) {
      this.setState({ error: null });
    }
  }

  render() {
    if (this.state.error !== null) {
      const message =
        this.state.error instanceof ApiError
          ? this.state.error.message
          : "An unexpected error occurred.";
      return (
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-border bg-card px-4 py-16 text-center">
          <span style={{ color: "var(--status-red)" }}>
            <Icon name="alert" size={22} />
          </span>
          <div className="text-sm font-semibold text-foreground">
            Could not load products
          </div>
          <div className="max-w-md text-xs text-muted-foreground">{message}</div>
          <Button
            variant="outline"
            onClick={this.props.onRetry}
            className="mt-1"
          >
            <Icon name="back" size={15} />
            Retry
          </Button>
        </div>
      );
    }
    return this.props.children;
  }
}
