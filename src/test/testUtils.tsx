import type { ReactElement } from 'react';
import { render, type RenderOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

/**
 * Create a fresh QueryClient for each test to avoid cache pollution
 */
export function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });
}

/**
 * Custom render function that includes QueryClientProvider
 */
export function renderWithQueryClient(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) {
  const queryClient = createTestQueryClient();

  return render(ui, {
    wrapper: ({ children }) => (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    ),
    ...options,
  });
}

// Re-export everything from @testing-library/react
export * from '@testing-library/react';
export { renderWithQueryClient as render };
