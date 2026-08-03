'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { NotiResponseDto } from '@repo/dto';

import { fetchNotis, markNotiRead, markAllNotiRead, deleteAllNotis as deleteAllNotisApi } from '@/api';
import { useAuthStore } from '@/stores';

export const notiQueryKey = ['notifications'] as const;

const NOTI_POLLING_INTERVAL_MS = 5000;

type NotiFetchState = 'idle' | 'loading' | 'success' | 'error' | 'no-login';

type Result = {
  notis: NotiResponseDto[];
  unreadCount: number;
  status: NotiFetchState;
  errorMessage: string | null;
  readNoti: (notiId: string) => void;
  readAllNotis: () => void;
  deleteAllNotis: () => void;
};

export default function useNotifications(): Result {
  const queryClient = useQueryClient();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isLoading = useAuthStore((s) => s.isLoading);
  const isEnabled = isAuthenticated && !isLoading;

  const {
    data: notis = [],
    isLoading: isNotisLoading,
    isError,
    error,
  } = useQuery({
    queryKey: notiQueryKey,
    queryFn: async () => (await fetchNotis()) as NotiResponseDto[],
    enabled: isEnabled,
    refetchInterval: isEnabled ? NOTI_POLLING_INTERVAL_MS : false,
  });

  const status: NotiFetchState = !isEnabled ? 'no-login' : isNotisLoading ? 'loading' : isError ? 'error' : 'success';
  const errorMessage = isError ? ((error as Error)?.message ?? '알림을 불러오지 못했습니다.') : null;
  const unreadCount = notis.filter((n) => !n.isRead).length;

  const readNotiMutation = useMutation({
    mutationFn: (notiId: string) => markNotiRead(notiId),
    onMutate: async (notiId: string) => {
      await queryClient.cancelQueries({ queryKey: notiQueryKey });
      const previous = queryClient.getQueryData<NotiResponseDto[]>(notiQueryKey);
      queryClient.setQueryData<NotiResponseDto[]>(notiQueryKey, (old = []) => old.map((n) => (n.id === notiId ? { ...n, isRead: true } : n)));
      return { previous };
    },
    onError: (_err, _notiId, context) => {
      if (context?.previous) queryClient.setQueryData(notiQueryKey, context.previous);
    },
  });

  const readAllNotisMutation = useMutation({
    mutationFn: () => markAllNotiRead(),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: notiQueryKey });
      const previous = queryClient.getQueryData<NotiResponseDto[]>(notiQueryKey);
      queryClient.setQueryData<NotiResponseDto[]>(notiQueryKey, (old = []) => old.map((n) => (n.isRead ? n : { ...n, isRead: true })));
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(notiQueryKey, context.previous);
    },
  });

  const deleteAllNotisMutation = useMutation({
    mutationFn: () => deleteAllNotisApi(),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: notiQueryKey });
      const previous = queryClient.getQueryData<NotiResponseDto[]>(notiQueryKey);
      queryClient.setQueryData<NotiResponseDto[]>(notiQueryKey, []);
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(notiQueryKey, context.previous);
    },
  });

  return {
    notis,
    unreadCount,
    status,
    errorMessage,
    readNoti: (notiId: string) => {
      readNotiMutation.mutate(notiId);
    },
    readAllNotis: () => {
      if (notis.length === 0 || notis.every((n) => n.isRead)) return;
      readAllNotisMutation.mutate();
    },
    deleteAllNotis: () => {
      if (notis.length === 0) return;
      deleteAllNotisMutation.mutate();
    },
  };
}
