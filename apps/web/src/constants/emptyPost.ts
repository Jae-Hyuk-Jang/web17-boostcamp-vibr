import type { PostResponseDto } from '@repo/dto';

export const EMPTY_POST: PostResponseDto = {
  id: 'empty',
  author: { id: '', nickname: '', profileImgUrl: '' },
  playlist: { id: 'playlist-test', title: '테스트 플레이리스트', coverImageUrls: [], tracksCount: 0 },
  coverImgUrl: '',
  content: '',
  likeCount: 0,
  commentCount: 0,
  createdAt: new Date(0).toISOString(),
  musics: [],
  isLiked: false,
  isEdited: false,
};
