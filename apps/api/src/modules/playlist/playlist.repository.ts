import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Playlist } from './entities/playlist.entity';
import { EntityManager, Repository } from 'typeorm';
import { PlaylistMusic } from './entities/playlist-music.entity';

@Injectable()
export class PlaylistRepository {
  constructor(
    @InjectRepository(Playlist)
    private readonly playlistRepo: Repository<Playlist>,

    @InjectRepository(PlaylistMusic)
    private readonly pmRepo: Repository<PlaylistMusic>,
  ) {}

  /** 내 플레이리스트 전체(생성 순). 커버 계산을 위해 곡까지 불러온다 */
  async getAllPlaylists(userId: string, manager?: EntityManager) {
    const repo = this.getPlaylistRepo(manager);

    return await repo.find({
      where: { owner: { id: userId } },
      relations: { playlistMusics: { music: true } },
      order: { id: 'ASC' },
    });
  }

  async getCountOfPlaylistOf(userId: string, manager?: EntityManager) {
    const repo = this.getPlaylistRepo(manager);

    return await repo.count({
      where: {
        owner: { id: userId },
      },
    });
  }

  async create(userId: string, title: string, manager?: EntityManager) {
    const repo = this.getPlaylistRepo(manager);

    const playlist = repo.create({
      owner: { id: userId },
      title,
    });

    return await repo.save(playlist);
  }

  async getPlaylistDetail(
    userId: string,
    playlistId: string,
    manager?: EntityManager,
  ): Promise<Playlist | null> {
    const repo = this.getPlaylistRepo(manager);

    return await repo
      .createQueryBuilder('p')
      .leftJoinAndSelect('p.playlistMusics', 'pm')
      .leftJoinAndSelect('pm.music', 'm')
      .where('p.playlist_id = :playlistId', { playlistId })
      .andWhere('p.owner_id = :userId', { userId })
      .orderBy('pm.order_index', 'ASC')
      .getOne();
  }

  async findById(userId: string, playlistId: string, manager?: EntityManager) {
    const repo = this.getPlaylistRepo(manager);

    return await repo.findOneBy({ id: playlistId, owner: { id: userId } });
  }

  async save(playlist: Playlist, manager?: EntityManager) {
    const repo = this.getPlaylistRepo(manager);

    return await repo.save(playlist);
  }

  async delete(userId: string, playlistId: string, manager?: EntityManager) {
    const repo = this.getPlaylistRepo(manager);

    const result = await repo.delete({ id: playlistId, owner: { id: userId } });

    return result.affected ? result.affected > 0 : false;
  }

  async countMusic(
    playlistId: string,
    manager?: EntityManager,
  ): Promise<number> {
    const repo = this.getPmRepo(manager);

    return await repo.count({
      where: {
        playlist: { id: playlistId },
      },
    });
  }

  async addMusics(
    playlistId: string,
    musicIds: string[],
    firstIndex: number,
    manager?: EntityManager,
  ) {
    const repo = this.getPmRepo(manager);

    const pms = repo.create(
      musicIds.map((mId, i) => ({
        playlist: { id: playlistId },
        music: { id: mId },
        orderIndex: i + firstIndex,
      })),
    );

    return await repo.save(pms);
  }

  async deleteAllMusics(playlistId: string, manager?: EntityManager) {
    const repo = this.getPmRepo(manager);
    return await repo.delete({ playlist: { id: playlistId } });
  }

  /**
   * NOTE:
   * - 보관함 플레이리스트에 중복 저장 방지를 위한 함수
   * - 보관함 한 번에 재생에서 오른쪽 패널(현재 재생목록) 에 중복으로 넘어가면 오류가 난다.
   */
  async getMusicIdsOfPlaylist(
    playlistId: string,
    manager?: EntityManager,
  ): Promise<string[]> {
    const repo = this.getPmRepo(manager);

    const rows = await repo
      .createQueryBuilder('pm')
      .select('pm.music_id', 'musicId')
      .where('pm.playlist_id = :playlistId', { playlistId })
      .getRawMany<{ musicId: string }>();

    return rows.map((r) => r.musicId);
  }

  private getPlaylistRepo(manager?: EntityManager) {
    return manager ? manager.getRepository(Playlist) : this.playlistRepo;
  }

  private getPmRepo(manager?: EntityManager) {
    return manager ? manager.getRepository(PlaylistMusic) : this.pmRepo;
  }
}
