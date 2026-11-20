import { PLAYLIST_TITLE_MAX_LENGTH } from '@repo/dto/values';
import {
  toAutoPlaylistTitle,
  toPlaylistCoverImageUrls,
} from './playlist.rules';

describe('toPlaylistCoverImageUrls', () => {
  it('곡이 없으면 빈 배열', () => {
    expect(toPlaylistCoverImageUrls(null, [])).toEqual([]);
  });

  it('직접 올린 커버가 있으면 곡 커버와 상관없이 그 커버 하나', () => {
    expect(toPlaylistCoverImageUrls('custom', ['a', 'b', 'c', 'd'])).toEqual([
      'custom',
    ]);
  });

  it('곡이 하나면 그 곡 커버 하나', () => {
    expect(toPlaylistCoverImageUrls(null, ['a'])).toEqual(['a']);
  });

  it('같은 앨범 곡만 여러 개면 커버 하나', () => {
    expect(toPlaylistCoverImageUrls(null, ['a', 'a', 'a', 'a'])).toEqual(['a']);
  });

  it('서로 다른 커버가 3개면 첫 곡 커버 하나', () => {
    expect(toPlaylistCoverImageUrls(null, ['a', 'b', 'c'])).toEqual(['a']);
  });

  it('서로 다른 커버가 4개 이상이면 곡 순서대로 앞의 서로 다른 커버 4개', () => {
    expect(
      toPlaylistCoverImageUrls(null, ['a', 'a', 'b', 'c', 'b', 'd', 'e']),
    ).toEqual(['a', 'b', 'c', 'd']);
  });

  it('빈 커버 URL은 건너뛴다', () => {
    expect(toPlaylistCoverImageUrls(null, ['', null, 'a'])).toEqual(['a']);
  });
});

describe('toAutoPlaylistTitle', () => {
  it('곡이 하나면 그 곡 제목', () => {
    expect(toAutoPlaylistTitle(['Hype Boy'])).toBe('Hype Boy');
  });

  it('여러 곡이면 "첫 곡 제목 외 N곡"', () => {
    expect(toAutoPlaylistTitle(['Hype Boy', 'Ditto', 'OMG'])).toBe(
      'Hype Boy 외 2곡',
    );
  });

  it('최대 길이를 넘으면 첫 곡 제목을 줄이고 "외 N곡"은 남긴다', () => {
    const title = toAutoPlaylistTitle(['가'.repeat(80), 'b']);
    expect(title.length).toBe(PLAYLIST_TITLE_MAX_LENGTH);
    expect(title.endsWith('… 외 1곡')).toBe(true);
  });
});
