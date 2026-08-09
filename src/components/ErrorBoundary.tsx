import { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: string | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error: error.message };
  }

  componentDidCatch(error: Error) {
    console.error('ErrorBoundary caught error:', error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-ink-950 text-cream-100 flex items-center justify-center p-4">
          <div className="max-w-md text-center">
            <h1 className="text-3xl font-serif text-gold-500 mb-4">Something went wrong</h1>
            <p className="text-cream-200 mb-4">{this.state.error || 'An error occurred'}</p>
            <p className="text-cream-300 text-sm">Please try refreshing the page.</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-6 px-6 py-2 bg-gold-500 text-ink-950 hover:bg-gold-400 transition-colors"
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
