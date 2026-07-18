import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, ILike, FindOptionsWhere } from 'typeorm';
import { User } from './entities/user.entity';
import { Follow } from '../follow/entities/follow.entity';
import { AuthProvider } from '../auth/types';

export interface UserWithFollowInfoRow {
  id: string;
  nickname: string;
  profileImgUrl: string | null;
  bio: string | null;
  followerCount: string;
  followingCount: string;
  isFollowing: string | null;
}

@Injectable()
export class UserRepository {
  constructor(
    @InjectRepository(User)
    private readonly repository: Repository<User>,
  ) {}

  async findByProvider(
    provider: AuthProvider,
    providerUserId: string,
  ): Promise<User | null> {
    return this.repository.findOne({
      where: {
        provider,
        providerUserId,
      },
    });
  }

  async findUserById(userId: string): Promise<User | null> {
    return this.repository.findOneBy({ id: userId });
  }

  async createUser(data: Partial<User>): Promise<User> {
    const user = this.repository.create(data);
    return this.repository.save(user);
  }

  async updateUser(user: User, data: Partial<User>): Promise<User> {
    const mergedUser = this.repository.merge(user, data);
    return this.repository.save(mergedUser);
  }

  createQueryBuilder(alias: string) {
    return this.repository.createQueryBuilder(alias);
  }

  /**
   * 유저 프로필 + 팔로워/팔로잉 수 + (currentUserId가 팔로우 중인지) 를 단일 쿼리로 조회.
   * currentUserId가 없으면(비로그인) isFollowing 서브쿼리는 항상 0건 매칭됨.
   */
  async findWithFollowInfo(
    targetUserId: string,
    currentUserId?: string,
  ): Promise<UserWithFollowInfoRow | undefined> {
    return this.repository
      .createQueryBuilder('u')
      .select('u.id', 'id')
      .addSelect('u.nickname', 'nickname')
      .addSelect('u.profileImgUrl', 'profileImgUrl')
      .addSelect('u.bio', 'bio')
      .addSelect(
        (sq) =>
          sq
            .select('COUNT(*)')
            .from(Follow, 'f')
            .where('f.followedUserId = u.id'),
        'followerCount',
      )
      .addSelect(
        (sq) =>
          sq
            .select('COUNT(*)')
            .from(Follow, 'f')
            .where('f.followingUserId = u.id'),
        'followingCount',
      )
      .addSelect(
        (sq) =>
          sq
            .select('COUNT(*)')
            .from(Follow, 'f')
            .where(
              'f.followingUserId = :currentUserId AND f.followedUserId = u.id',
            ),
        'isFollowing',
      )
      .where('u.id = :targetUserId')
      .setParameters({ targetUserId, currentUserId: currentUserId ?? null })
      .getRawOne();
  }

  async searchByNickname(
    keyword: string,
    take: number,
    cursorId?: string,
  ): Promise<User[]> {
    const whereOption: FindOptionsWhere<User> = {
      nickname: ILike(`${keyword}%`),
    };

    if (cursorId) {
      whereOption.id = LessThan(cursorId);
    }

    return this.repository.find({
      where: whereOption,
      select: {
        id: true,
        nickname: true,
        profileImgUrl: true,
      },
      order: {
        id: 'DESC',
      },
      take,
    });
  }
}
