'use client';

import { useQuery } from '@tanstack/react-query';

import { getAllPlaylists } from '@/api/internal';

export const PLAYLISTS_QUERY_KEY = ['playlists'] as const;

export const usePlaylists = (enabled: boolean = true) =>
  useQuery({
    queryKey: PLAYLISTS_QUERY_KEY,
    queryFn: getAllPlaylists,
    enabled,
  });
