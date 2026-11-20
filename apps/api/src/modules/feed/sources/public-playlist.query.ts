import { PlaylistVisibility } from '@repo/dto/values';
import { SelectQueryBuilder } from 'typeorm';
import { Post } from 'src/modules/post/entities/post.entity';

/**
 * 피드에 나올 수 있는 반응 기록만 남기고, 응답에 필요한 플레이리스트와 곡을 함께 불러온다.
 * 공개 조건을 조인 조건에 넣어 두어, 이후에 where를 덮어써도 비공개가 섞이지 않는다.
 */
export const joinPublicPlaylistWithMusics = (
  query: SelectQueryBuilder<Post>,
): SelectQueryBuilder<Post> =>
  query
    .innerJoinAndSelect(
      'post.playlist',
      'playlist',
      'playlist.visibility = :publicVisibility',
      { publicVisibility: PlaylistVisibility.PUBLIC },
    )
    .leftJoinAndSelect('playlist.playlistMusics', 'playlistMusic')
    .leftJoinAndSelect('playlistMusic.music', 'music');
