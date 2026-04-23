import { vi } from 'vitest';

export function createMockRouter(overrides: Partial<ReturnType<typeof import('next/navigation').useRouter>> = {}) {
  return {
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    prefetch: vi.fn(),
    ...overrides,
  };
}

export function createMockSearchParams(init: Record<string, string> = {}) {
  return {
    get: (key: string) => init[key] ?? null,
    has: (key: string) => key in init,
    getAll: () => Object.values(init),
    forEach: (cb: (value: string, key: string) => void) => Object.entries(init).forEach(([k, v]) => cb(v, k)),
    entries: () => Object.entries(init)[Symbol.iterator](),
    keys: () => Object.keys(init)[Symbol.iterator](),
    values: () => Object.values(init)[Symbol.iterator](),
    toString: () => new URLSearchParams(init).toString(),
    [Symbol.iterator]: () => Object.entries(init)[Symbol.iterator](),
  } as unknown as ReturnType<typeof import('next/navigation').useSearchParams>;
}
