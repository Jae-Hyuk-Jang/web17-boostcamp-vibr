import { UserDto } from '../../user';

interface CommentItem {
  id: string;
  content: string;
  createdAt: string;
  author: UserDto;
}

export class GetCommentsResDto {
  comments: CommentItem[];
}
