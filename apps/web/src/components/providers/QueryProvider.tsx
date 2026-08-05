'use client';

import { MutationCache, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { toast } from 'react-toastify';

interface QueryProviderProps {
  children: React.ReactNode;
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 60 * 1000 },
  },
  mutationCache: new MutationCache({
    onError: (_error, _variables, _context, mutation) => {
      if (mutation.options.meta?.silent) return;
      toast.error('요청 처리에 실패했습니다.');
    },
  }),
});

export default function QueryProvider({ children }: QueryProviderProps) {
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
