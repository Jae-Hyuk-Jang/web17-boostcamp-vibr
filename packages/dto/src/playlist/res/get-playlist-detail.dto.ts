import { MusicResponseDto } from '../../music';

import { PlaylistVisibility } from '../playlist-visibility.enum';

export class GetPlaylistDetailResDto {
  id: string;
  title: string;
  /** 소개 글 */
  description: string | null;
  /** 커버 규칙으로 고른 이미지 0·1·4개(4개면 2×2로 표시) */
  coverImageUrls: string[];
  visibility: PlaylistVisibility;
  musics: MusicResponseDto[];
}
