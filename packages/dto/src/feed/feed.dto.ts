import { MusicResponseDto } from '../music';
import { PostPlaylistDto } from '../post/res/post.dto';
import { UserDto } from '../user';
import { FeedShelfKey } from './feed-shelf-key.enum';

/** 선반 카드 하나: 공개된 플레이리스트 */
export interface FeedShelfItemDto {
  /** 상세를 열 때 쓰는 반응 기록 id(좋아요·댓글이 가리키는 키) */
  reactionId: string;
  playlist: PostPlaylistDto;
  owner: UserDto;
  /** 전체 재생용 곡 목록(플레이리스트 순서) */
  musics: MusicResponseDto[];
}

/** 선반 하나의 한 페이지 */
export interface FeedShelfPageDto {
  items: FeedShelfItemDto[];
  /** 이 선반을 이어서 불러올 커서. 없으면 마지막 페이지 */
  nextCursor?: string;
}

export interface FeedShelfDto extends FeedShelfPageDto {
  key: FeedShelfKey;
}

/** 홈 첫 화면. 보여 줄 순서대로, 비어 있는 선반은 빠진다 */
export interface FeedShelvesResponseDto {
  shelves: FeedShelfDto[];
}
