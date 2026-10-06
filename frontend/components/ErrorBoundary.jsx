import { Component } from 'react';

// Keeps one broken section (an animated scene, the map) from blanking the
// whole page. Renders `fallback` instead and logs the error.
export default class ErrorBoundary extends Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error(`${this.props.name ?? 'Section'} crashed:`, error, info?.componentStack);
  }

  render() {
    return this.state.hasError ? (this.props.fallback ?? null) : this.props.children;
  }
}
