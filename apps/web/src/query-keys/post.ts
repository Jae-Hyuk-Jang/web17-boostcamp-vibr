export const postDetailQueryKey = (postId: string) => ['postDetail', postId] as const;

export const commentsQueryKey = (postId: string) => ['comments', postId] as const;
