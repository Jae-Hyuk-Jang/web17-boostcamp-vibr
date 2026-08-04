export const profileQueryKey = (userId: string) => ['profile', userId] as const;

export const profileGridQueryKey = (userId: string) => ['profileGrid', userId] as const;

export const profilePostsFeedQueryKey = (userId: string) => ['profilePostsFeed', userId] as const;

export const userListQueryKey = (profileUserId: string, title: string) => ['userList', profileUserId, title] as const;
