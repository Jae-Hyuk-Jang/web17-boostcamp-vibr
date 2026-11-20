import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, FindOptionsWhere, Repository, LessThan } from 'typeorm';
import { PlaylistVisibility } from '@repo/dto/values';
import { Post } from './entities/post.entity';

@Injectable()
export class PostRepository {
  constructor(
    @InjectRepository(Post)
    private readonly repository: Repository<Post>,
  ) {}

  // 좋아요 수 증가
  async incrementLikeCount(
    postId: string,
    manager?: EntityManager,
  ): Promise<void> {
    const repo = manager ? manager.getRepository(Post) : this.repository;

    await repo.increment({ id: postId }, 'likeCount', 1);
  }

  // 좋아요 수 감소
  async decrementLikeCount(
    postId: string,
    manager?: EntityManager,
  ): Promise<void> {
    const repo = manager ? manager.getRepository(Post) : this.repository;

    await repo.decrement({ id: postId }, 'likeCount', 1);
  }
  // 게시글 존재 여부 확인
  async findPostById(
    postId: string,
    manager?: EntityManager,
  ): Promise<Post | null> {
    const repo = manager ? manager.getRepository(Post) : this.repository;
    return repo.findOne({ where: { id: postId } });
  }

  // 댓글 수 증가
  async incrementCommentCount(
    postId: string,
    manager?: EntityManager,
  ): Promise<void> {
    const repo = manager ? manager.getRepository(Post) : this.repository;
    await repo.increment({ id: postId }, 'commentCount', 1);
  }

  // 댓글 수 감소
  async decrementCommentCount(
    postId: string,
    manager?: EntityManager,
  ): Promise<void> {
    const repo = manager ? manager.getRepository(Post) : this.repository;
    await repo.decrement({ id: postId }, 'commentCount', 1);
  }

  /** 사용자의 공개 플레이리스트에 연결된 반응 기록(최신순). 커버 계산을 위해 곡까지 불러온다 */
  async getPublicPostsByUser(
    userId: string,
    take: number,
    cursorDate: Date | null,
  ): Promise<Post[]> {
    const whereOption: FindOptionsWhere<Post> = {
      author: { id: userId },
      playlist: { visibility: PlaylistVisibility.PUBLIC },
    };
    if (cursorDate) {
      whereOption.createdAt = LessThan(cursorDate);
    }

    return await this.repository.find({
      where: whereOption,
      relations: { playlist: { playlistMusics: { music: true } } },
      order: { createdAt: 'DESC' },
      take,
    });
  }
}
