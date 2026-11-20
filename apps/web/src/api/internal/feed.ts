import type { FeedShelfPageDto, FeedShelvesResponseDto } from '@repo/dto';
import type { FeedShelfKey } from '@repo/dto/values';
import { internalClient } from './client';

/** [GET] 홈 피드 선반 목록. 선반마다 첫 페이지와 다음 커서가 들어 있다 */
export const getFeedShelves = async () => {
  const { data } = await internalClient.get<FeedShelvesResponseDto>('/feed/shelves');
  return data;
};

/** [GET] 선반 하나를 커서 다음부터 이어서 조회. 커서가 없으면 첫 페이지 */
export const getFeedShelfPage = async (shelf: FeedShelfKey, cursor?: string) => {
  const { data } = await internalClient.get<FeedShelfPageDto>(`/feed/shelves/${shelf}`, { params: { cursor } });
  return data;
};
