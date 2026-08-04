import { internalClient } from './client';
import type { GetUserDto as Profile, SearchUsersResDto, UpdateProfileDto } from '@repo/dto';

/** [GET] 사용자 프로필 정보 요청 */
export const getUser = async (userId: string): Promise<Profile> => {
  const { data } = await internalClient.get<Profile>(`/user/${userId}`);
  return data;
};

/** [GET] 사용자 검색 (cursor 기반) */
export const searchUsers = async (q: string, cursor?: string, limit?: number): Promise<SearchUsersResDto> => {
  const { data } = await internalClient.get<SearchUsersResDto>('/user/search', {
    params: { q: q.trim(), cursor, limit },
  });
  return data;
};

/** [PATCH] 프로필 수정 — 서버는 갱신된 Profile 전체가 아니라 { success: true }만 반환한다(apps/api UserService.updateUser 확인). */
export const updateProfile = async (profile: UpdateProfileDto): Promise<{ success: true }> => {
  const { data } = await internalClient.patch<{ success: true }>('/user', profile);
  return data;
};
