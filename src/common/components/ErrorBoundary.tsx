import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children?: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(_: Error): State {
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="size-full flex items-center justify-center bg-gray-900 text-white p-6 text-center">
            <div>
              <h2 className="text-2xl font-bold mb-4 text-red-500">
                Something went wrong.
              </h2>
              <p className="mb-4 text-gray-400">
                Please refresh the page to try again.
              </p>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-gray-800 rounded hover:bg-gray-700"
              >
                Reload
              </button>
            </div>
          </div>
        )
      );
    }

    return this.props.children;
  }
}
