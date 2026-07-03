import { Component, type ReactNode } from "react";
import { ErrorState } from "./misc";
import { ApiError } from "~/lib/api/http";

export class InlineErrorBoundary extends Component<
  { children: ReactNode },
  { error: unknown }
> {
  state: { error: unknown } = { error: null };

  static getDerivedStateFromError(error: unknown) {
    return { error };
  }

  render() {
    const { error } = this.state;
    if (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : "An unexpected error occurred.";
      return (
        <ErrorState
          message={message}
          onBack={() => window.history.back()}
        />
      );
    }
    return this.props.children;
  }
}
