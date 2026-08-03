# PRD — feed-list-query-migration

## 문제 정의

`useFeedRefreshStore`(nonce 트리거, 4곳: `useContentWrite`, `Header`, `ProfileView`, `FeedView`)와 `usePostDeletionSignalStore`(`deletedPostId` 1필드, `refresh-trigger-stores` #153 산출물)가 아직 zustand 기반으로 남아있다. 근본 원인은 피드/프로필 목록(`FeedView`/`ProfileView`가 들고 있는 배열)이 `useInfiniteScroll`(#149에서 통합)의 로컬 컴포넌트 상태이지, 쿼리 캐시가 아니라는 것이다.

## 비판적 진단 (시니어 개발자 시각)

### 근거

- **Fact**: `useFeedRefreshStore`의 `nonce`를 실제로 소비(= `resetKey`로 사용)하는 곳은 `FeedView`(항상)와 `ProfileView`(`isMyProfile`일 때만) 2곳뿐이다. `bump()`를 호출하는 곳은 `useContentWrite.onSubmit`(글 작성 후)과 `Header.handleLogoClick`(홈에서 로고 클릭 시)이다.
- **Fact**: `usePostDeletionSignalStore`의 `deletedPostId`를 소비하는 곳은 `FeedView` 1곳뿐이다(`PostHeader`가 유일한 writer). `ProfileView`/`ProfilePostsFeed`는 이 신호를 구독하지 않는다 — 즉 **현재도 프로필 게시글 그리드에서는 삭제한 글이 화면에서 자동으로 사라지지 않는다**(기존 갭, 이번 사이클에서 새로 발견했지만 고칠 대상은 아님, Out of Scope로 명시).
- **Fact**: `useInfiniteScroll`(#149에서 통합된 단일 훅)을 실제로 쓰는 곳은 5곳이다 — `FeedView`(다중 소스 커서 `Cursor`), `ProfileView`(단일 문자열 커서), `ProfilePostsFeed`(단일 문자열 커서 + N+1 상세조회 + `postDetailQueryKey` 캐시 시딩), `useUserSearch`(단일 문자열 커서), `UserListModal`(단일 문자열 커서). 이 중 `useFeedRefreshStore`/`usePostDeletionSignalStore`와 관련 있는 곳은 **`FeedView`, `ProfileView` 2곳뿐**이다. `ProfilePostsFeed`/`useUserSearch`/`UserListModal`은 애초에 이 두 스토어를 쓰지 않는다.
- **Fact**: `FeedView`/`ProfileView`/`ProfilePostsFeed` 어디에도 전용 컴포넌트 테스트가 없다(`find . -iname "FeedView.test.*" ...` → 0건). `useInfiniteScroll.ts` 자체의 특성화 테스트(#149에서 추가, 5건)는 훅 레벨이라 이 3개 컴포넌트의 실제 배선(어떤 fetchFn을 넘기는지, `mergeItems`/`resetKey` 조합)까지는 검증하지 않는다.
- **Fact**: `@tanstack/react-query`는 v5.101.3이 이미 설치돼 있고, `useInfiniteQuery`의 `pageParam`은 스칼라뿐 아니라 객체도 지원한다(v5 공식 API) — 즉 `FeedView`의 다중 소스 커서(`Cursor: {following, trending, recent}`)를 `useInfiniteQuery`의 `pageParam` 타입으로 그대로 쓸 수 있다. brief-original.md에 적었던 "다중 소스 커서가 `useInfiniteQuery`와 근본적으로 안 맞을 수 있다"는 가설은 **기각**한다(API 문서·타입 확인으로 Fact 격상).
- **Fact**: `useInfiniteScroll`에는 `loadMore` 호출 시 인위적 300ms 지연(`await new Promise((resolve) => setTimeout(resolve, 300))`, "로딩 스피너 짧게 노출")이 있다. `useInfiniteQuery`에는 이런 지연이 내장되어 있지 않다 — 유지하려면 fetchFn 쪽에서 별도로 구현해야 한다.

### 증상 → 원인 체인

증상: `useFeedRefreshStore`/`usePostDeletionSignalStore`라는 리프레시 트리거 전용 zustand 스토어가 아직 남아있다.
→ (왜?) 직접 원인: `FeedView`/`ProfileView`의 목록이 쿼리 캐시가 아니라 `useInfiniteScroll`의 로컬 상태라서, "새 글 작성 후 재조회"나 "삭제 후 목록에서 제거"를 TanStack Query의 표준 API(`invalidateQueries`/`setQueriesData`)로 처리할 수 없다.
→ (왜?) 구조 원인: #149 사이클은 "무한 스크롤 상태 전이 로직 중복 제거"만 목표로 삼아 두 훅을 하나로 통합했을 뿐, 목록의 **데이터 소스 자체**(로컬 상태 vs 쿼리 캐시)는 건드리지 않았다. #153은 "게시글 1건의 값 동기화"만 캐시로 옮겼고 "목록 자체"는 범위 밖이었다.

### 아키텍처 관점

- **저장소 반복 패턴인가?**: 그렇다. `post-reaction-state`(#48, 스토어 최초 도입) → `server-state-caching`(#139~145, 상세 캐시 도입) → `feed-infinite-scroll-duplication`(#149, 상태 전이 로직 통합) → `refresh-trigger-stores`(#153, 값 동기화 캐시 이관) → 지금(#166, 목록 자체 캐시 이관)까지, "서버 상태를 어디까지 TanStack Query로 옮길 것인가"라는 같은 축의 결정이 다섯 번째로 이어지고 있다.
- **기존 컨벤션과 충돌하는가?**: 충돌 없음. 오히려 `CLAUDE.md`가 #153에서 갱신한 "값 동기화는 쿼리 캐시로" 원칙의 자연스러운 연장선이다.
- **전제가 깨졌나, 애초에 근거가 약했나?**: 전제가 깨졌다기보다는 **아직 다루지 않은 다음 단계**에 가깝다 — #149/#153 모두 "목록 자체 캐시화는 별도 사이클"이라고 문서에 명시적으로 남겨뒀다.

### 비판적 재검토 (사용자 문제 제기에 대한 반박 질문과 답)

- **이 증상이 정말 구조 문제인가, 우연한 버그인가?** 구조적 미완성에 가깝다 — 다만 **#153의 본문수정 이중쓰기처럼 실제로 관찰된 버그는 이번엔 없다.** `useFeedRefreshStore`/`usePostDeletionSignalStore`는 지금도 정상 동작한다(단, 프로필 그리드가 삭제 신호를 안 받는다는 기존 갭은 있음 — 이것도 버그라기보다는 애초에 그 화면에서 삭제 후 자동 갱신을 요구한 적이 없어 보이는 설계상 공백).
- **지금 안 고치면 다음 몇 번의 실제 변경에서 구체적으로 어떤 비용이 드는가(YAGNI)?** 두 스토어 모두 이미 아주 작다(`useFeedRefreshStore` 4곳/`usePostDeletionSignalStore` 1필드) — 다음에 반응 필드가 추가될 때 실수할 여지가 컸던 #153(4필드 스토어, 이중쓰기 실화)과 달리, 여기서는 "새 리스트 화면이 또 생기면 또 리프레시 스토어를 만들 수도 있다"는 **가능성**이 비용이지 아직 실현된 비용이 아니다.
- **더 급한 다른 문제를 가리는 건 아닌가?** 아니다. 다만 이번 사이클은 앞의 두 사이클(#149, #153)과 성격이 다르다는 점을 짚어야 한다 — **구체적 버그 수정이 아니라 아키텍처 일관성 개선**이고, 대상이 되는 `FeedView`/`ProfileView`는 이 앱에서 트래픽이 가장 많은 화면(홈 피드, 프로필)이며 **전용 테스트가 0건**이다. 리스크 대비 이득을 목표 인터뷰에서 사용자와 함께 재확인해야 한다.
- **(범위 재검토) 5개 소비처를 다 옮겨야 하는가?** 아니다 — 두 스토어를 실제로 쓰는 곳은 `FeedView`/`ProfileView` 2곳뿐이다. `ProfilePostsFeed`/`useUserSearch`/`UserListModal`은 이 사이클의 문제와 무관하다. 5곳을 다 옮기는 것은 이 이슈가 요구하는 범위를 넘어서는 과잉 작업이다.

## 목표와 범위

### Goal

`useInfiniteScroll`을 쓰는 5개 소비처(`FeedView`, `ProfileView`, `ProfilePostsFeed`, `useUserSearch`, `UserListModal`) 전체를 TanStack Query의 `useInfiniteQuery` 기반으로 전환하고, `useInfiniteScroll.ts`를 폐기한다. `useFeedRefreshStore`의 `bump()`는 `queryClient.invalidateQueries`로, `usePostDeletionSignalStore`의 삭제 신호는 `queryClient.setQueriesData` 기반 목록 캐시 갱신으로 대체해 두 스토어를 제거한다.

목표 인터뷰에서 "실제 문제(두 스토어)에 필요한 범위는 `FeedView`/`ProfileView` 2곳뿐"이라는 진단 결과를 제시했으나, 사용자가 **아키텍처 일관성**(모든 목록 화면이 같은 방식으로 서버 상태를 다루는 것)을 우선해 5곳 전체 전환을 선택했다 — 추천안(2곳 한정)보다 변경 범위·리스크가 커진다는 점을 인지한 선택이다.

### Success Criteria

- `useInfiniteScroll.ts`가 삭제되고, 5개 소비처 모두 `useInfiniteQuery`(또는 그 소비처에 맞는 TanStack Query 훅) 기반으로 동작한다.
- `useFeedRefreshStore.ts`가 제거되고, `useContentWrite`/`Header`의 트리거는 `queryClient.invalidateQueries`로 대체된다.
- `usePostDeletionSignalStore.ts`가 제거되고, 게시글 삭제는 `queryClient.setQueriesData`로 피드 목록 캐시에서 직접 항목을 제거한다(단, 프로필 그리드는 지금도 삭제 신호를 받지 않으므로 그 기존 동작 그대로 유지 — 새로 연결하지 않음).
- `FeedView`, `ProfileView`, `ProfilePostsFeed`, `useUserSearch`, `UserListModal` 각각에 대해 이번 사이클에서 새로 추가한 characterization/integration 테스트가 있다(현재 0건).
- 5개 소비처의 기존 UI 동작(무한스크롤 트리거 시점, 에러 표시, 다중 소스 커서 병합, 조건부 `resetKey` 등)이 전후 동일하다.

### Out of Scope

- 프로필 게시글 그리드(`ProfilePostsFeed`, `ProfileView`)가 게시글 삭제 신호를 받아 자동으로 목록을 갱신하도록 새로 연결하는 것 — 기존에도 없던 동작이라 이번에 추가하지 않는다(별도 버그/기능 이슈로 다룰 수 있음).
- `loadMore`의 인위적 300ms 지연을 없애거나 성능 튜닝하는 것 — 유지한다.
- API 응답 포맷(`FeedResponseDto`, `FindByUserDto`, `GetUserFollowDto`, `SearchUsersResDto` 등) 변경.
- UI 시각적 변경.
- `usePostCacheSync`/`postDetailQueryKey`(#153에서 도입한 게시글 1건 캐시)의 동작 변경 — 그대로 재사용한다.

### Behavior Invariants

- `FeedView`/`ProfileView`의 무한스크롤 트리거 시점(`rootMargin: '200px'`, `threshold: 0.8`)은 동일하게 유지된다.
- 로딩 중 재호출 방지(`hasNext`/`isLoading` 가드)는 유지된다.
- 에러 발생 시 `errorMsg` 표시는 유지된다.
- 글 작성/팔로우 후 피드가 실제로 재조회되는 동작은 유지된다.
- 게시글 삭제 시 피드에서 해당 게시글이 사라지는 동작은 유지된다(프로필 그리드는 현재도 안 사라짐 — 이 기존 갭은 그대로 유지).
- `FeedView`의 다중 소스 커서 병합과 `dedupePosts` 동작은 유지된다.
- `ProfileView`의 `isMyProfile`일 때만 `resetKey`를 쓰는 조건부 동작은 유지된다.
- `ProfilePostsFeed`의 postId별 `postDetailQueryKey` 캐시 시딩(N+1 상세조회 결과를 개별 캐시에 저장)은 유지된다.
- `useUserSearch`의 디바운스·최소 글자수·`resetKey`(검색어 변경 시 초기화) 동작은 유지된다.
- `UserListModal`의 팔로우/언팔로우 토글 시 로컬 목록 항목을 직접 갱신하는 동작(`setItems`)은 유지된다.

## 기준선 검증

| 명령                   | 결과    | 실패 항목 | 비고                                   |
| ---------------------- | ------- | --------- | -------------------------------------- |
| `pnpm lint`            | ✅ 성공 | 없음      | 4/4 태스크 성공(전부 캐시, FULL TURBO) |
| `pnpm check-types`     | ✅ 성공 | 없음      | 3/3 태스크 성공(전부 캐시, FULL TURBO) |
| `pnpm test` (apps/web) | ✅ 성공 | 없음      | 30 suites / 135 tests 모두 통과, 8.1s  |
| `pnpm build`           | ✅ 성공 | 없음      | 3/3 태스크 성공, 16개 라우트           |

측정 불가: `FeedView`/`ProfileView`/`ProfilePostsFeed` 전용 테스트 — 0건(안전망 공백, 목표 인터뷰에서 범위에 따라 Success Criteria에 반영).

---

**[GATE 1]** 위 진단·목표·범위(5개 소비처 전체, 사용자가 추천안보다 넓게 선택)·Behavior Invariants·기준선을 확인해주시면 다음 단계로 넘어가겠습니다.
