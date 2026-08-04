import type { QueryClient } from '@tanstack/react-query';
import type { UserDto } from '@repo/dto';

import { AUTH_ME_QUERY_KEY } from '@/query-keys';

/**
 * useAuthMe()가 읽는 authMe 쿼리 캐시를 직접 시딩한다 — 삭제된 useAuthStore.setState(...)를 대체.
 * isAuthenticated:false는 캐시에 null을 심어 "조회 완료, 비로그인"을 표현한다(isPending:false, data:null).
 * 로딩 중 상태를 재현하려면 이 함수를 호출하지 않는다(기본값이 pending).
 */
export const seedAuthMe = (queryClient: QueryClient, params: { userId: string | null; isAuthenticated: boolean }) => {
  const data: Pick<UserDto, 'id' | 'nickname' | 'profileImgUrl'> | null =
    params.isAuthenticated && params.userId ? { id: params.userId, nickname: 'me', profileImgUrl: null } : null;
  queryClient.setQueryData(AUTH_ME_QUERY_KEY, data);
};
