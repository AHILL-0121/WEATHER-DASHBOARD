// @vitest-environment jsdom
import { afterEach, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import ErrorBoundary from './ErrorBoundary';

afterEach(cleanup);

function Broken() {
  throw new Error('boom');
}

it('renders the fallback instead of crashing the page', () => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
  render(
    <>
      <ErrorBoundary name="Map" fallback={<p>Map unavailable</p>}>
        <Broken />
      </ErrorBoundary>
      <p>Rest of the page</p>
    </>,
  );

  expect(screen.getByText('Map unavailable')).toBeInTheDocument();
  expect(screen.getByText('Rest of the page')).toBeInTheDocument();
});

it('renders children when nothing throws', () => {
  render(
    <ErrorBoundary fallback={<p>fallback</p>}>
      <p>All good</p>
    </ErrorBoundary>,
  );
  expect(screen.getByText('All good')).toBeInTheDocument();
});
