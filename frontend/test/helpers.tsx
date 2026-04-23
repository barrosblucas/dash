import { vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render as rtlRender } from '@testing-library/react';
import type { ReactNode } from 'react';

export function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
}

export function renderWithQuery(ui: ReactNode, client = createTestQueryClient()) {
  return rtlRender(
    <QueryClientProvider client={client}>{ui}</QueryClientProvider>
  );
}
