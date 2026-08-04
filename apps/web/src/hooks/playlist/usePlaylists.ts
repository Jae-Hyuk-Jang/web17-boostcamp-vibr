'use client';

import { useQuery } from '@tanstack/react-query';

import { getAllPlaylists } from '@/api/internal';
import { PLAYLISTS_QUERY_KEY } from '@/query-keys';

export const usePlaylists = (enabled: boolean = true) =>
  useQuery({
    queryKey: PLAYLISTS_QUERY_KEY,
    queryFn: getAllPlaylists,
    enabled,
  });
