# 문제 영역

`apps/web`에서 TanStack Query의 쿼리키 팩토리 함수가 한 곳에 모여있지 않고, 각 쿼리를 처음 도입한 훅/컴포넌트 파일에 개별적으로 정의돼 있다. 여러 사이클(`server-state-caching`, `feed-list-query-migration`, `server-polling-optimistic-update`, `playlist-detail-caching`, `profile-info-caching`)을 거치며 쿼리키가 하나씩 늘어났는데, 어디에 정의할지에 대한 명시적 규칙 없이 "이 쿼리를 처음 쓴 곳"에 그때그때 추가돼 왔다.

## 관찰한 증상

- 쿼리키 팩토리 12개가 서로 다른 10개 파일에 흩어져 있다.
- 그중 일부는 **컴포넌트 파일**에 정의돼 있고(`feedQueryKey`, `profileGridQueryKey`, `userListQueryKey`), 다른 도메인의 **훅**이 그 컴포넌트 파일을 직접 import한다 — 훅이 컴포넌트에 의존하는 역방향 의존성이 실제로 존재한다.

## 실제 사례

- `apps/web/src/hooks/post/useContentWrite.ts`(훅)가 `apps/web/src/components/feed/FeedView.tsx`(컴포넌트)에서 `feedQueryKey`를, `apps/web/src/components/profile/ProfileView.tsx`(컴포넌트)에서 `profileGridQueryKey`를 각각 import한다 — 같은 파일에서 두 번 훅→컴포넌트 역방향 의존이 발생.
- `apps/web/src/components/layout/Header.tsx`, `apps/web/src/components/post/partials/PostHeader.tsx`도 `feedQueryKey`를 쓰기 위해 `components/feed/FeedView.tsx`를 import한다.
- 현재 쿼리키 12개와 정의 위치:
  - 훅 파일: `playlistDetailQueryKey`(`hooks/playlist/usePlaylistDetail.ts`), `PLAYLISTS_QUERY_KEY`(`hooks/playlist/usePlaylists.ts`), `profileQueryKey`(`hooks/profile/useProfile.ts`), `AUTH_ME_QUERY_KEY`(`hooks/auth/client/useAuthMeQuery.ts`), `postDetailQueryKey`(`hooks/post/usePostDetail.ts`), `commentsQueryKey`(`hooks/post/usePostReactions.ts`), `userSearchQueryKey`(`hooks/search/useUserSearch.ts`), `notiQueryKey`(`hooks/noti/useNotifications.ts`)
  - 컴포넌트 파일: `feedQueryKey`(`components/feed/FeedView.tsx`), `profileGridQueryKey`(`components/profile/ProfileView.tsx`), `profilePostsFeedQueryKey`(`components/profile/ProfilePostsFeed.tsx`), `userListQueryKey`(`components/modals/UserListModal/UserListModal.tsx`)

## 초기 가설

- (가설) 쿼리키를 한 곳(예: `src/queryKeys.ts` 또는 도메인별 `query-keys/` 폴더)에 모으면, 이 역방향 의존 문제가 구조적으로 사라지고 앞으로 새 쿼리키를 추가할 때 "어디에 둘지" 고민할 필요가 없어질 것으로 보인다.
- (가설, 미검증) 모든 쿼리키를 하나의 파일로 모으는 것과, 도메인별로만 분리하는 것 사이의 비교는 아직 하지 않았다 — PRD 단계에서 비판적으로 검토가 필요하다.

## 기대 효과

- 훅이 컴포넌트를 import하는 역방향 의존이 사라진다.
- 새 쿼리를 추가할 때 쿼리키를 어디에 정의할지에 대한 일관된 규칙이 생긴다.
- 관련된 쿼리키들을 한눈에 볼 수 있어, 무효화 시 어떤 키들을 함께 고려해야 하는지 파악하기 쉬워진다.

## 제약

- 이번 사이클은 `apps/web`(프론트엔드) 범위로 한정한다. `apps/api`, `packages/dto`의 계약은 바꾸지 않는다.
- 기존 사용자 동작(각 화면의 조회/갱신 결과)의 눈에 보이는 결과는 유지되어야 한다.
- 쿼리키의 실제 값(배열 내용)은 바꾸지 않는다 — 정의 위치만 옮긴다. 값이 바뀌면 캐시 무효화 시점이 달라질 수 있어 별도 검증이 필요해지므로 이번 범위에서 제외한다.
