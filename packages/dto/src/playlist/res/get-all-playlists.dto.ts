import { PlaylistVisibility } from '../playlist-visibility.enum';

export interface PlaylistBriefResDto {
  id: string;
  title: string;
  tracksCount: number;
  /** @deprecated 화면 호환용. 새 코드는 coverImageUrls를 쓴다 */
  firstAlbumCoverUrl: string;
  /** 커버 규칙으로 고른 이미지 0·1·4개(4개면 2×2로 표시) */
  coverImageUrls: string[];
  visibility: PlaylistVisibility;
}

export class GetAllPlaylistsResDto {
  playlists: PlaylistBriefResDto[];
}
