# 문제 영역

피드/프로필/검색 등 여러 화면에서 쓰이는 무한 스크롤 상태 관리 훅이 중복 구현되어 있다.

## 관찰한 증상

- `hooks/useInfiniteScroll.ts`와 `hooks/useFeedInfiniteScroll.ts`가 items/posts, hasNext, cursor, isLoading, errorMsg, isInitialLoading, `initialLoadedRef`/`prevResetKeyRef` 가드, `reset`/`loadInitialData`/`loadMore`, `useInView` 배선을 사실상 동일하게 중복 구현하고 있다.
- `useInfiniteScroll`: `ProfilePostsFeed`, `ProfileView`, `useUserSearch`, `UserListModal` 4곳에서 사용.
- `useFeedInfiniteScroll`: `FeedView`(홈 피드) 1곳에서 사용.

## 실제 사례

- `server-state-caching` 사이클(#139) PRD 진단 중 발견. 당시 사이클 범위(플레이리스트/authMe/게시글상세 캐시)와 무관해 Out of Scope로 남겨두고 이슈 #149로 등록해뒀다.
- 조사 중 `useInfiniteScroll`에만 선언되고 어디서도 set되지 않는 죽은 상태(`initialError`)도 우연히 발견됨.

## 초기 가설

- 두 훅의 실제 차이는 세 가지뿐이라고 추정된다: ① 커서 타입 — `useInfiniteScroll`은 제네릭 `T[]` + 단일 `nextCursor`, `useFeedInfiniteScroll`은 `Post[]` 고정 + 다중 소스 커서(`{following, trending, recent}`) + postId 기반 `dedupePosts`, ② `useFeedInfiniteScroll`만 `initialData`(특정 글 공유 라우트용) 파라미터를 받음, ③ `useInfiniteScroll`에만 미사용 `initialError`가 존재.
- 이 차이가 제네릭 파라미터(커서 타입, dedupe 전략)로 흡수 가능한지, 아니면 다중 소스 커서 병합 로직의 복잡도 때문에 별도 훅을 유지할 근거가 있는지는 아직 검증되지 않은 가설이다.

## 기대 효과

- 무한 스크롤 상태 머신을 한 곳에서 수정하면 되어, 버그 수정이나 기능 추가 시 두 훅을 동시에 고칠 필요가 없어진다.
- 죽은 상태(`initialError`) 등 두 훅 사이 drift를 정리한다.

## 제약

- `useInfiniteScroll` 소비처 4곳 + `useFeedInfiniteScroll` 소비처 1곳의 기존 무한스크롤 동작(스크롤 트리거 시점, 로딩 상태 표시, 에러 처리, 커서 갱신)은 그대로 유지해야 한다.
- 근거가 부족하면(다중 소스 커서 병합 로직이 실제로 복잡해서 통합 비용이 이득보다 크면) 통합하지 않고 "의도적으로 유지" 결정도 유효한 결과다(이슈 #149 TODO에 이미 명시됨).
