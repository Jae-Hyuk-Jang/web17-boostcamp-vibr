import { User } from 'src/modules/user/entities/user.entity';
import { Like } from 'src/modules/like/entities/like.entity';
import { Playlist } from 'src/modules/playlist/entities/playlist.entity';

import {
  BeforeInsert,
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';

import { v7 as uuidV7 } from 'uuid';

/**
 * 플레이리스트의 반응 기록(사용자에게는 보이지 않음).
 * 좋아요·댓글·알림·인기 점수가 이 ID를 가리킨다. 곡 목록·소개 글·커버는 플레이리스트에 있다.
 */
@Entity()
export class Post {
  @PrimaryColumn('char', { name: 'post_id', length: 36 })
  id: string;

  @BeforeInsert()
  setId() {
    this.id ??= uuidV7();
  }

  @ManyToOne(() => User, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'author_id' })
  author: User;

  /** 연결된 플레이리스트(1:1). 플레이리스트를 지우면 반응 기록과 좋아요·댓글도 함께 지워진다 */
  @OneToOne(() => Playlist, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'playlist_id' })
  playlist: Playlist;

  @OneToMany(() => Like, (like) => like.post)
  likes: Like[];

  @Column('int', { name: 'like_count', nullable: false })
  likeCount: number;

  @Column('int', { name: 'comment_count', nullable: false })
  commentCount: number;

  // 생성: INSERT 시각만
  @CreateDateColumn({
    name: 'created_at',
    type: 'datetime',
    precision: 6,
    default: () => 'CURRENT_TIMESTAMP(6)',
  })
  createdAt: Date;

  // 수정: UPDATE마다 자동 갱신 필요 (ON UPDATE)
  @UpdateDateColumn({
    name: 'updated_at',
    type: 'datetime',
    precision: 6,
    default: () => 'CURRENT_TIMESTAMP(6)',
    onUpdate: 'CURRENT_TIMESTAMP(6)',
  })
  updatedAt: Date;

  // 삭제(soft delete): 기본값 두지 말 것 (NULL이어야 정상)
  @DeleteDateColumn({
    name: 'deleted_at',
    type: 'datetime',
    precision: 6,
    nullable: true,
  })
  deletedAt: Date | null;
}
