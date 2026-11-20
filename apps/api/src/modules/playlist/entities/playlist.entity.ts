import {
  BeforeInsert,
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
import {
  PLAYLIST_DESCRIPTION_MAX_LENGTH,
  PLAYLIST_TITLE_MAX_LENGTH,
  PlaylistVisibility,
} from '@repo/dto/values';
import { User } from 'src/modules/user/entities/user.entity';
import { PlaylistMusic } from './playlist-music.entity';

import { v7 as uuidV7 } from 'uuid';

/** 플레이리스트. 곡 목록·제목·소개 글·커버·공개 상태의 원천 */
@Entity()
export class Playlist {
  @PrimaryColumn('char', { name: 'playlist_id', length: 36 })
  id: string;

  @BeforeInsert()
  setId() {
    this.id ??= uuidV7();
  }

  @ManyToOne(() => User, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'owner_id' })
  owner: User;

  @Column('varchar', { length: PLAYLIST_TITLE_MAX_LENGTH, nullable: false })
  title: string;

  /** 소개 글 */
  @Column('varchar', {
    length: PLAYLIST_DESCRIPTION_MAX_LENGTH,
    nullable: true,
  })
  description: string | null;

  /** 직접 올린 커버. 없으면 곡 커버로 커버 규칙을 적용한다 */
  @Column('varchar', { name: 'custom_cover_url', length: 2083, nullable: true })
  customCoverUrl: string | null;

  @Column('varchar', {
    length: 16,
    nullable: false,
    default: PlaylistVisibility.PRIVATE,
  })
  visibility: PlaylistVisibility;

  /** 처음 공개한 시각. 다시 공개해도 바뀌지 않는다("새로 올라온" 정렬 기준) */
  @Column('datetime', { name: 'published_at', precision: 6, nullable: true })
  publishedAt: Date | null;

  @OneToMany(() => PlaylistMusic, (pm) => pm.playlist)
  playlistMusics: PlaylistMusic[];

  @CreateDateColumn({
    name: 'created_at',
    type: 'datetime',
    precision: 6,
    default: () => 'CURRENT_TIMESTAMP(6)',
  })
  createdAt: Date;

  @UpdateDateColumn({
    name: 'updated_at',
    type: 'datetime',
    precision: 6,
    default: () => 'CURRENT_TIMESTAMP(6)',
    onUpdate: 'CURRENT_TIMESTAMP(6)',
  })
  updatedAt: Date;
}
