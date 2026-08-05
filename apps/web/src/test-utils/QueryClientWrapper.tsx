import type { ReactNode } from 'react';
import { MutationCache, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { toast } from 'react-toastify';

export const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: Infinity },
    },
    mutationCache: new MutationCache({
      onError: (_error, _variables, _context, mutation) => {
        if (mutation.options.meta?.silent) return;
        toast.error('요청 처리에 실패했습니다.');
      },
    }),
  });

export const createQueryClientWrapper = (queryClient: QueryClient = createTestQueryClient()) => {
  function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  }
  return Wrapper;
};
