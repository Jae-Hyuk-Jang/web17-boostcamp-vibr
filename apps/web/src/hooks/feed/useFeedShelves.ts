'use client';

import { useQuery } from '@tanstack/react-query';
import { getFeedShelves } from '@/api';
import { feedShelvesQueryKey } from '@/query-keys';

/** 홈 선반 목록. 선반 순서와 대상은 서버가 정한 그대로 쓴다 */
export const useFeedShelves = () => useQuery({ queryKey: feedShelvesQueryKey, queryFn: getFeedShelves });
