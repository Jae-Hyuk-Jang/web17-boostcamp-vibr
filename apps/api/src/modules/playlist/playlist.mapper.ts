import type { MusicResponseDto, PostPlaylistDto } from '@repo/dto';
import { Playlist } from './entities/playlist.entity';
import { toPlaylistCoverImageUrls } from './playlist.rules';

/** 플레이리스트 곡을 곡 순서대로 응답 형태로 바꾼다(조인 결과의 순서에 기대지 않는다) */
export const toOrderedMusicResponses = (
  playlist: Playlist,
): MusicResponseDto[] =>
  [...(playlist.playlistMusics ?? [])]
    .sort((a, b) => a.orderIndex - b.orderIndex)
    .map(({ music }) => ({
      id: music.id,
      title: music.title,
      artistName: music.artistName,
      albumCoverUrl: music.albumCoverUrl,
      trackUri: music.trackUri,
      provider: music.provider,
      durationMs: music.durationMs,
    }));

/** 플레이리스트 커버 규칙을 적용한 이미지 목록(0·1·4개) */
export const toCoverImageUrlsOf = (
  playlist: Playlist,
  musicsInOrder: MusicResponseDto[],
): string[] =>
  toPlaylistCoverImageUrls(
    playlist.customCoverUrl,
    musicsInOrder.map((music) => music.albumCoverUrl),
  );

/** 카드·응답에 쓰는 플레이리스트 요약(제목, 커버, 곡 수) */
export const toPlaylistSummary = (
  playlist: Playlist,
  musicsInOrder: MusicResponseDto[],
): PostPlaylistDto => ({
  id: playlist.id,
  title: playlist.title,
  coverImageUrls: toCoverImageUrlsOf(playlist, musicsInOrder),
  tracksCount: musicsInOrder.length,
});
