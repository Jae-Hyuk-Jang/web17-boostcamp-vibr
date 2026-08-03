# 문제 영역

피드/프로필 게시글 목록이 아직 TanStack Query 캐시가 아니라 커스텀 훅(`useInfiniteScroll`)의 로컬 컴포넌트 상태로 관리되고 있다.

## 관찰한 증상

- `useFeedRefreshStore`(4곳: `useContentWrite`, `Header`, `ProfileView`, `FeedView`)가 글 작성/팔로우/로고 클릭 후 목록을 통째로 재조회시키는 nonce 트리거로 남아있다 — `usePlaylistRefreshStore`와 같은 패턴인데 그것만 먼저(`server-state-caching` #139~145) 제거됐다.
- `usePostDeletionSignalStore`(`refresh-trigger-stores` #153 산출물, 1필드 `deletedPostId`)가 게시글 삭제를 `FeedView`에 알리는 이벤트성 신호로 남아있다.
- 두 문제 모두 근본 원인이 같다: `FeedView`/`ProfileView`가 들고 있는 `posts` 배열이 `useInfiniteScroll`(#149에서 통합)의 로컬 상태이지, 쿼리 캐시가 아니다. `postDetailQueryKey`는 게시글 "1건"만 캐시하고 "목록 자체"는 캐시 대상이 아니다.

## 실제 사례

- #149(feed-infinite-scroll-duplication) result.md에서 `useInfiniteQuery` 전환을 이미 Out of Scope로 명시하며 후속 과제로 남김.
- #153(refresh-trigger-stores) 사이클에서 좋아요/댓글수/본문 값 동기화는 `postDetailQueryKey` 캐시로 옮겼지만, `useFeedRefreshStore`/`usePostDeletionSignalStore`는 "목록 자체가 캐시가 아니라서" 대상에서 제외됨.
- #153 논의 중, 게시글 삭제를 캐시 기반으로 처리하려면 `queryClient.setQueriesData({ queryKey: [...] }, updater)`로 목록 캐시에서 직접 항목을 제거하는 방식이 가능하다는 게 확인됨 — 단, 이건 목록 자체가 쿼리 캐시일 때만 성립한다.

## 초기 가설

- 피드/프로필 목록 조회를 `useInfiniteQuery`로 전환하면, `useFeedRefreshStore`의 `bump()`는 `queryClient.invalidateQueries`로, `usePostDeletionSignalStore`의 삭제 신호는 `queryClient.setQueriesData`로 대체 가능할 것이라는 가설 — 아직 검증 안 됨.
- 다만 피드는 다중 소스 커서(`following`/`trending`/`recent`)를 쓰고 있어(#149에서 확인), `useInfiniteQuery`의 표준 단일 커서 모델과 어떻게 맞출지, 그리고 여러 목록 종류(홈 피드, 프로필 게시글, 유저 검색 등)에 걸쳐 삭제를 전파하려면 쿼리키 설계가 어떻게 되어야 하는지는 검증되지 않은 가설이다.

## 기대 효과

- 목록 재조회(`useFeedRefreshStore`)와 개별 항목 제거(`usePostDeletionSignalStore`)를 모두 표준 TanStack Query API(`invalidateQueries`/`setQueriesData`)로 통일하면, 리프레시 트리거 전용 zustand 스토어가 완전히 사라진다.
- 새 목록 화면이 추가될 때마다 전용 refresh 스토어를 새로 만들 필요가 없어진다(이슈 #7에서 최초 지적한 패턴).

## 제약

- `ProfileView`가 `nonce`를 `isMyProfile`일 때만 `resetKey`로 쓰는 등 소비처별 조건이 있어 단순 치환이 아닐 수 있다 — 그대로 유지해야 한다.
- 홈 피드(다중 소스 커서), 프로필 게시글, 유저 검색(`useUserSearch`), 팔로워/팔로잉 목록(`UserListModal`) 등 `useInfiniteScroll` 소비처 전체의 기존 동작(로딩/에러/스크롤 트리거)은 유지되어야 한다.
- 근거가 부족하거나(예: 다중 소스 커서 병합이 `useInfiniteQuery`와 근본적으로 안 맞음) 비용이 이득보다 크면 "지금은 전환하지 않는다"는 결론도 유효한 결과다.
