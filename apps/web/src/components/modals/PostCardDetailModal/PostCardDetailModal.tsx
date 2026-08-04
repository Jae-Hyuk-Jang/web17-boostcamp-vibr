'use client';

import { PostCardDetailModalMobileSheet, PostCardDetailModalDesktopShell, LikedUsersOverlay } from './partials';
import { PostDetailModalProvider } from './PostDetailModalContext';

export const PostCardDetailModal = () => (
  <PostDetailModalProvider>
    <PostCardDetailModalMobileSheet />
    <PostCardDetailModalDesktopShell />
    <LikedUsersOverlay />
  </PostDetailModalProvider>
);
