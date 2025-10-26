import { Component, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';
import { logError } from '@/utils/logger';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: string | null;
  errorCount: number;
}

/**
 * ErrorBoundary component catches React render errors
 * and displays a fallback UI instead of crashing the entire app
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorCount: 0,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    // Log error with structured logger
    logError(error, 'ErrorBoundary', {
      componentStack: errorInfo?.componentStack,
    });

    this.setState({
      errorInfo: errorInfo?.componentStack || null,
    });
  }

  handleReset = () => {
    this.setState((prevState) => ({
      hasError: false,
      error: null,
      errorInfo: null,
      errorCount: prevState.errorCount + 1, // Force children remount
    }));
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default fallback UI
      return (
        <div 
          className="min-h-screen flex items-center justify-center bg-background p-4"
          data-testid="error-boundary"
        >
          <div className="max-w-md w-full bg-card border rounded-lg p-6 shadow-lg">
            <div className="flex items-start gap-4">
              <AlertCircle className="h-6 w-6 text-destructive flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h2 className="text-lg font-semibold mb-2">
                  Something went wrong
                </h2>
                <p className="text-sm text-muted-foreground mb-4">
                  We encountered an unexpected error. This has been logged and we'll look into it.
                </p>
                
                {import.meta.env.DEV && this.state.error && (
                  <details className="mb-4 text-xs">
                    <summary className="cursor-pointer text-muted-foreground hover:text-foreground mb-2">
                      Error details (dev mode only)
                    </summary>
                    <div className="bg-muted p-2 rounded overflow-auto max-h-40">
                      <code className="text-xs">
                        {this.state.error.toString()}
                      </code>
                    </div>
                  </details>
                )}

                <div className="flex gap-2">
                  <Button 
                    onClick={this.handleReset}
                    variant="outline"
                    size="sm"
                    data-testid="button-try-again"
                  >
                    Try Again
                  </Button>
                  <Button 
                    onClick={this.handleReload}
                    size="sm"
                    data-testid="button-reload"
                  >
                    Reload App
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // Key-based remounting: forces fresh component state after error recovery
    return <div key={this.state.errorCount}>{this.props.children}</div>;
  }
}
