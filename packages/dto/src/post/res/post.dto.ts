import { MusicResponseDto } from '../../music';
import { UserDto } from '../../user';

/** 반응 기록(게시글)에 연결된 플레이리스트 요약 */
export interface PostPlaylistDto {
  id: string;
  title: string;
  /** 커버 규칙으로 고른 이미지 0·1·4개(4개면 2×2로 표시) */
  coverImageUrls: string[];
  tracksCount: number;
}

export interface PostResponseDto {
  id: string;
  author: UserDto;
  playlist: PostPlaylistDto;
  /** 화면 호환용: 플레이리스트 커버의 첫 이미지 */
  coverImgUrl: string;
  /** 화면 호환용: 플레이리스트 곡 목록 */
  musics: MusicResponseDto[];
  /** 화면 호환용: 플레이리스트 소개 글 */
  content: string;
  likeCount: number;
  commentCount: number;
  createdAt: string;
  isEdited: boolean;
  isLiked: boolean;
}
