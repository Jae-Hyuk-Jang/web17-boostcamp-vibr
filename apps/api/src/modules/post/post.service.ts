import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import {
  MusicRequestDto,
  MusicProvider,
  PostResponseDto,
  FindByUserDto,
} from '@repo/dto';
import { PlaylistVisibility } from '@repo/dto/values';
import { PostRepository } from './post.repository';
import { Post } from './entities/post.entity';
import { MusicService } from '../music/music.service';
import { Like } from '../like/entities/like.entity';
import { Playlist } from '../playlist/entities/playlist.entity';
import { PlaylistMusic } from '../playlist/entities/playlist-music.entity';
import { toAutoPlaylistTitle } from '../playlist/playlist.rules';
import {
  toCoverImageUrlsOf,
  toOrderedMusicResponses,
} from '../playlist/playlist.mapper';
import { toPostResponseDto } from './post.mapper';

@Injectable()
export class PostService {
  constructor(
    @InjectDataSource()
    private readonly ds: DataSource,

    @InjectRepository(Post)
    private readonly postRepo: Repository<Post>,

    private readonly postRepository: PostRepository,

    @InjectRepository(Like)
    private readonly likeRepo: Repository<Like>,

    @InjectRepository(Playlist)
    private readonly playlistRepo: Repository<Playlist>,

    private readonly musicService: MusicService,
  ) {}

  /**
   * 기존 글쓰기(곡 목록·본문·커버 전송)를 "공개 플레이리스트 만들기"로 처리한다.
   * 플레이리스트를 만들어 곡과 소개 글·커버를 저장하고, 반응 기록을 연결한다.
   */
  async create(
    userId: string,
    musics: MusicRequestDto[],
    content?: string,
    customCoverUrl?: string,
  ): Promise<void> {
    if (musics.length === 0)
      throw new BadRequestException(
        '플레이리스트에는 최소 1곡의 음악이 있어야 합니다.',
      );

    musics.forEach((m) => (m.provider ??= MusicProvider.ITUNES));
    const musicIds = await Promise.all(
      musics.map(async (m) => {
        if (m.id) return m.id;
        const { id } = await this.musicService.addMusic(m);
        return id;
      }),
    );

    await this.ds.transaction(async (manager) => {
      const playlistRepo = manager.getRepository(Playlist);
      const playlist = await playlistRepo.save(
        playlistRepo.create({
          owner: { id: userId },
          title: toAutoPlaylistTitle(musics.map((m) => m.title)),
          description: content?.trim() ? content : null,
          customCoverUrl: customCoverUrl ?? null,
          visibility: PlaylistVisibility.PUBLIC,
          publishedAt: new Date(),
        }),
      );

      const playlistMusicRepo = manager.getRepository(PlaylistMusic);
      await playlistMusicRepo.save(
        musicIds.map((musicId, orderIndex) =>
          playlistMusicRepo.create({
            playlist: { id: playlist.id },
            music: { id: musicId },
            orderIndex,
          }),
        ),
      );

      const postRepo = manager.getRepository(Post);
      await postRepo.save(
        postRepo.create({
          author: { id: userId },
          playlist: { id: playlist.id },
          likeCount: 0,
          commentCount: 0,
        }),
      );
    });
  }

  /** 비공개 플레이리스트의 반응 기록은 소유자만 볼 수 있다 */
  async getPostDetail(
    postId: string,
    viewerId: string | null,
  ): Promise<PostResponseDto> {
    const post = await this.postRepo.findOne({
      where: { id: postId },
      relations: {
        author: true,
        playlist: { owner: true, playlistMusics: { music: true } },
      },
    });

    const isOwner = !!post && post.playlist.owner.id === viewerId;
    if (
      !post ||
      (post.playlist.visibility !== PlaylistVisibility.PUBLIC && !isOwner)
    ) {
      throw new NotFoundException('게시글을 찾을 수 없습니다.');
    }

    const isLiked = viewerId
      ? await this.likeRepo.exists({ where: { userId: viewerId, postId } })
      : false;

    return toPostResponseDto(post, isLiked);
  }

  /** 본문 수정은 연결된 플레이리스트의 소개 글을 고친다 */
  async update(
    requestUserId: string,
    postId: string,
    content: string,
  ): Promise<void> {
    const playlistId = await this.findOwnedPlaylistId(requestUserId, postId);
    if (!playlistId)
      throw new NotFoundException('수정하려는 게시글을 찾을 수 없습니다.');

    await this.playlistRepo.update(playlistId, { description: content });
  }

  /**
   * 기존 화면의 게시글 삭제는 플레이리스트를 비공개로 바꾸는 것으로 처리한다.
   * 플레이리스트와 좋아요·댓글은 남고, 다시 공개하면 돌아온다.
   */
  async delete(requestUserId: string, postId: string): Promise<void> {
    const playlistId = await this.findOwnedPlaylistId(requestUserId, postId);
    if (!playlistId)
      throw new NotFoundException('삭제하려는 게시글을 찾을 수 없습니다.');

    await this.playlistRepo.update(playlistId, {
      visibility: PlaylistVisibility.PRIVATE,
    });
  }

  private async findOwnedPlaylistId(
    userId: string,
    postId: string,
  ): Promise<string | null> {
    const post = await this.postRepo.findOne({
      where: { id: postId, author: { id: userId } },
      relations: { playlist: true },
    });
    return post?.playlist.id ?? null;
  }

  /** 사용자의 공개 플레이리스트(반응 기록) 목록 */
  async getByUserId(
    userId: string,
    limit: number,
    cursor?: string,
  ): Promise<FindByUserDto> {
    const { date: cursorDate } = this.decodeCursor(cursor);

    const posts = await this.postRepository.getPublicPostsByUser(
      userId,
      limit + 1,
      cursorDate,
    );

    const hasNext = posts.length > limit;
    const targetPosts = hasNext ? posts.slice(0, limit) : posts;

    let nextCursor: string | undefined = undefined;

    if (hasNext && targetPosts.length > 0) {
      const lastPost = targetPosts[targetPosts.length - 1]!;
      nextCursor = `${lastPost.createdAt.toISOString()}_${lastPost.id}`;
    }

    return {
      posts: targetPosts.map((post) => {
        const musics = toOrderedMusicResponses(post.playlist);
        return {
          postId: post.id,
          coverImgUrl: toCoverImageUrlsOf(post.playlist, musics)[0] ?? '',
          likeCount: post.likeCount,
          commentCount: post.commentCount,
          isMoreThanOneMusic: musics.length > 1,
        };
      }),
      hasNext,
      nextCursor,
    };
  }

  private decodeCursor(cursor?: string) {
    if (!cursor)
      return { date: null as Date | null, id: null as string | null };

    const separatorIndex = cursor.lastIndexOf('_');
    if (separatorIndex === -1) return { date: null, id: null };

    const dateString = cursor.substring(0, separatorIndex);
    const idString = cursor.substring(separatorIndex + 1);

    const ms = Date.parse(dateString);
    if (!Number.isFinite(ms)) return { date: null, id: null };

    return { date: new Date(ms), id: idString };
  }
}
