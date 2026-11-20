import {
  PLAYLIST_COVER_MOSAIC_COUNT,
  PLAYLIST_TITLE_MAX_LENGTH,
} from '@repo/dto/values';

/**
 * 플레이리스트 커버로 보여 줄 이미지를 고른다(0·1·4개).
 * - 직접 올린 커버가 있으면 그 커버 하나
 * - 서로 다른 앨범 커버가 4개 이상이면 곡 순서대로 앞의 서로 다른 커버 4개(화면에서 2×2)
 * - 1~3개면 첫 곡 커버 하나(같은 그림 반복이나 빈 칸을 피하려는 것)
 * - 곡이 없으면 빈 배열(화면에서 기본 커버를 그림)
 */
export const toPlaylistCoverImageUrls = (
  customCoverUrl: string | null | undefined,
  albumCoverUrlsInTrackOrder: readonly (string | null | undefined)[],
): string[] => {
  if (customCoverUrl) return [customCoverUrl];

  const distinctCovers: string[] = [];
  for (const url of albumCoverUrlsInTrackOrder) {
    if (!url || distinctCovers.includes(url)) continue;
    distinctCovers.push(url);
    if (distinctCovers.length === PLAYLIST_COVER_MOSAIC_COUNT)
      return distinctCovers;
  }

  const [firstCover] = distinctCovers;
  return firstCover ? [firstCover] : [];
};

const TITLE_ELLIPSIS = '…';

/** 곡 목록으로 "첫 곡 제목 외 N곡" 형태의 기본 제목을 만든다(제목 최대 길이 안에서) */
export const toAutoPlaylistTitle = (musicTitles: readonly string[]): string => {
  const [firstTitle = '새 플레이리스트'] = musicTitles;
  const suffix =
    musicTitles.length > 1 ? ` 외 ${musicTitles.length - 1}곡` : '';

  if (firstTitle.length + suffix.length <= PLAYLIST_TITLE_MAX_LENGTH) {
    return `${firstTitle}${suffix}`;
  }
  const room =
    PLAYLIST_TITLE_MAX_LENGTH - suffix.length - TITLE_ELLIPSIS.length;
  return `${firstTitle.slice(0, room)}${TITLE_ELLIPSIS}${suffix}`;
};
