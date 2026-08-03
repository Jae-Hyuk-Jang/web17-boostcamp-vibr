# 문제 영역

`usePlaylistRefreshStore`는 server-state-caching 사이클(#139~145)에서 TanStack Query `useQuery`/`invalidateQueries`로 대체되어 제거됐다. 같은 "리프레시 트리거 전용 zustand 스토어" 계열인 `useFeedRefreshStore`와 `usePostReactionOverridesStore`는 그 사이클 범위 밖이라 그대로 남아있다(#153으로 등록).

## 관찰한 증상

- `useFeedRefreshStore`(4곳: `useContentWrite`, `Header`, `ProfileView`, `FeedView`)는 순수 nonce 증가형 트리거 — 글 작성/팔로우 후 `bump()` → 구독 측 `nonce`가 바뀌면 재조회.
- `usePostReactionOverridesStore`(11곳: `usePostReactions`, `usePostLikeToggle`, `usePostDetailModal`, `PostCard`, `PostHeader`, `FeedView` 등)는 단순 트리거가 아니라 좋아요/댓글수/본문/삭제 상태의 실제 값을 피드 카드와 상세모달이라는 서로 다른 데이터 소스 사이에 실시간 동기화하는 오버라이드 레이어.

## 실제 사례

- #149(useInfiniteScroll/useFeedInfiniteScroll 중복 통합) 사이클에서 확인한 바로, 피드 목록 조회는 여전히 `useFeedInfiniteScroll`(현재는 통합된 `useInfiniteScroll`) 기반 커스텀 훅으로 이뤄지고 TanStack Query 캐시를 쓰지 않는다. 반면 `usePostDetail`(#144)은 이미 postId별 쿼리 캐시(`postDetailQueryKey(postId)`)를 쓴다 — 같은 게시글 데이터가 피드 목록 경로와 상세 경로에서 서로 다른 상태 관리 방식으로 존재한다.
- `ProfilePostsFeed.tsx`는 이미 `queryClient.setQueryData(postDetailQueryKey(p.postId), detail)`로 피드 진입 시 상세 쿼리 캐시를 시딩하는 패턴을 쓰고 있다 — 피드 전체를 쿼리 캐시 기반으로 바꿀 때 참고할 수 있는 선례.

## 초기 가설

- `useFeedRefreshStore`는 `usePlaylistRefreshStore`와 동일한 패턴이라 같은 방식(쿼리 무효화)으로 대체 가능할 것으로 추정하지만, 피드 목록 자체가 아직 `useInfiniteQuery`가 아닌 커스텀 훅 기반이라 스토어만 단독으로 제거할 수 없고 피드 목록 조회 자체를 쿼리 캐시 기반으로 옮기는 선행 작업이 필요할 것이라는 가설.
- `usePostReactionOverridesStore`는 피드 카드/상세모달 사이 값 동기화 역할까지 겸하고 있어, 완전히 대체하려면 피드 목록 항목을 postId별 쿼리 캐시 엔트리로 시딩하는 구조 변경과 좋아요 optimistic update/rollback(`usePostLikeToggle`) 로직의 재검증이 함께 필요할 것이라는 가설 — 검증되지 않았다.

## 기대 효과

- 리프레시 트리거 전용 스토어(`useFeedRefreshStore`)를 걷어내면 "뮤테이션 후 트리거 호출을 빠뜨려 stale UI가 되는" 부류의 버그 가능성이 줄어든다.
- 피드 카드와 상세모달이 같은 쿼리 캐시를 공유하게 되면 `usePostReactionOverridesStore`처럼 값 자체를 수동으로 동기화하는 오버라이드 레이어가 줄어들 가능성이 있다.

## 제약

- 기존 정책: 관련 화면(피드/헤더/프로필/게시글 작성/좋아요/댓글/삭제)의 사용자에게 보이는 동작(낙관적 업데이트, 롤백, 실시간 반영 시점)은 유지되어야 한다.
- 범위와 비용을 진단해본 뒤, 이득 대비 비용이 크다고 판단되면 "지금은 전환하지 않는다"는 결론도 유효한 결과다(이슈 #153에 이미 이 가능성이 명시돼 있음).
