import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  /** Used in the console message */
  name?: string;
  fallback?: ReactNode;
  children: ReactNode;
}

// Keeps one broken section (an animated scene, the map) from blanking the
// whole page. Renders `fallback` instead and logs the error.
export default class ErrorBoundary extends Component<Props, { hasError: boolean }> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(`${this.props.name ?? 'Section'} crashed:`, error, info.componentStack);
  }

  render() {
    return this.state.hasError ? (this.props.fallback ?? null) : this.props.children;
  }
}
