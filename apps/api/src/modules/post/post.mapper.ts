import type { PostResponseDto } from '@repo/dto';
import {
  toCoverImageUrlsOf,
  toOrderedMusicResponses,
} from '../playlist/playlist.mapper';
import { Post } from './entities/post.entity';

/** 공개 이후 소개 글·제목 등을 고쳤다고 볼 최소 시간 차이 */
const EDITED_THRESHOLD_MS = 1000;

/**
 * 반응 기록과 연결된 플레이리스트로 게시글 응답을 만든다.
 * 필요한 관계: author, playlist.playlistMusics.music
 * content·musics·coverImgUrl은 화면 호환용 필드로, 값은 플레이리스트에서 채운다.
 */
export const toPostResponseDto = (
  post: Post,
  isLiked: boolean,
): PostResponseDto => {
  const { playlist } = post;
  const musics = toOrderedMusicResponses(playlist);
  const coverImageUrls = toCoverImageUrlsOf(playlist, musics);

  return {
    id: post.id,
    author: {
      id: post.author.id,
      nickname: post.author.nickname,
      profileImgUrl: post.author.profileImgUrl,
    },
    playlist: {
      id: playlist.id,
      title: playlist.title,
      coverImageUrls,
      tracksCount: musics.length,
    },
    coverImgUrl: coverImageUrls[0] ?? '',
    musics,
    content: playlist.description ?? '',
    likeCount: post.likeCount,
    commentCount: post.commentCount,
    createdAt: post.createdAt.toISOString(),
    isEdited:
      playlist.updatedAt.getTime() - post.createdAt.getTime() >=
      EDITED_THRESHOLD_MS,
    isLiked,
  };
};
