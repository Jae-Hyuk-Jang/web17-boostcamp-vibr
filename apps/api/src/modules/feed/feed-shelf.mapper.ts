import type { FeedShelfItemDto } from '@repo/dto';
import { Post } from '../post/entities/post.entity';
import {
  toOrderedMusicResponses,
  toPlaylistSummary,
} from '../playlist/playlist.mapper';

/**
 * 반응 기록과 연결된 공개 플레이리스트로 선반 카드를 만든다.
 * 필요한 관계: playlist.owner, playlist.playlistMusics.music
 */
export const toFeedShelfItemDto = (post: Post): FeedShelfItemDto => {
  const { playlist } = post;
  const musics = toOrderedMusicResponses(playlist);

  return {
    reactionId: post.id,
    playlist: toPlaylistSummary(playlist, musics),
    owner: {
      id: playlist.owner.id,
      nickname: playlist.owner.nickname,
      profileImgUrl: playlist.owner.profileImgUrl,
    },
    musics,
  };
};
