import { IsString, Length, Matches } from 'class-validator';
import { PLAYLIST_TITLE_MAX_LENGTH } from '../playlist.constants';

export class UpdateTitlePlaylitReqDto {
  @IsString()
  @Matches(/\S/, { message: '제목은 빈 문자열일 수 없습니다.' })
  @Length(1, PLAYLIST_TITLE_MAX_LENGTH)
  title: string;
}
