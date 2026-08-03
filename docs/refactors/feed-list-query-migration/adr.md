# ADR — feed-list-query-migration

## 3안 비교

### 안 1 — 최소 개선안

`useInfiniteScroll`과 두 스토어(`useFeedRefreshStore`, `usePostDeletionSignalStore`)를 그대로 두고, 5개 소비처(`FeedView`, `ProfileView`, `ProfilePostsFeed`, `useUserSearch`, `UserListModal`)에 characterization 테스트만 추가한다. GATE 1에서 사용자가 "지금 진행한다"를 선택했으므로 이 안은 기각 전제로 비교표에만 포함한다.

### 안 2 — 경계 재설계안 (소비처가 queryKey 직접 소유)

5개 소비처가 각자 `useInfiniteQuery`를 직접 호출하고, 각자의 쿼리키(`['feed']`, `['profileGrid', userId]` 등)를 소유한다. 반복되는 스크롤 트리거 배선(`useInView` → `fetchNextPage` 호출)만 작은 공유 훅(`useInfiniteScrollTrigger`, 가칭)으로 추출한다. `resetKey`라는 개념 자체를 없애고, "다시 불러와야 하는 조건"을 쿼리키의 일부로 만들거나(`useUserSearch`의 `trimmedQuery`) `invalidateQueries` 호출로 대체한다(`ProfileView`/`FeedView`의 글 작성 후 재조회).

### 안 3 — 검증된 도구 도입안 (호환 어댑터)

`useInfiniteScroll`과 동일한 시그니처(제네릭 `T`/`TCursor`, `fetchFn`, `resetKey`, `mergeItems`, `initialItems`)를 유지하는 어댑터 훅(`useInfiniteScrollQuery`, 가칭)을 만들어 내부 구현만 `useState` 기반에서 `useInfiniteQuery` 기반으로 교체한다. 5개 소비처의 호출부는 거의 그대로 둔다. `resetKey`는 어댑터 내부에서 쿼리키에 반영한다.

## 비교표 (10개 고정 기준)

| #   | 기준                 | 안 1                    | 안 2                                                             | 안 3                                                                                               |
| --- | -------------------- | ----------------------- | ---------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| 1   | 근본 원인 해결력     | 낮음 — 스토어 그대로    | 높음 — 각 소비처가 진짜 쿼리키를 소유                            | 중간 — 스토어는 제거되지만 `resetKey`라는 "가짜 쿼리키" 패턴이 어댑터 안에 남음                    |
| 2   | 동작 보존 난이도     | 매우 쉬움               | 중간 — 5곳 호출부 재작성                                         | 쉬움 — 호출부 거의 그대로, 어댑터 내부만 교체                                                      |
| 3   | 책임·의존성 변화     | 없음                    | 중간 — 각 컴포넌트가 쿼리키 설계 책임을 가짐                     | 작음 — 어댑터가 계속 책임을 캡슐화                                                                 |
| 4   | 테스트 용이성        | 낮음                    | 높음 — `queryKey`/`enabled`는 TanStack 표준 계약이라 검증이 쉬움 | 중간 — 소비처별 동작이 여전히 어댑터를 통해 간접적으로만 검증됨                                    |
| 5   | 변경 범위            | 최소                    | 큼 — 5곳 호출부 전부 재작성 + 공유 트리거 훅                     | 중간 — 어댑터 1개 + 소비처는 소폭 조정                                                             |
| 6   | 점진적 전환 가능성   | 해당 없음               | 가능 — 소비처별로 순차 전환                                      | 가능 — 시그니처가 호환돼 더 쉬움                                                                   |
| 7   | 롤백 가능성          | 쉬움                    | 쉬움 — 소비처별 커밋 단위                                        | 쉬움                                                                                               |
| 8   | 성능·운영 영향       | 없음                    | 미미                                                             | 미미                                                                                               |
| 9   | 기존 코드와의 일관성 | 높음                    | 중간 — 전면 재작성이라 당장은 낯설 수 있음                       | 높음 — 기존 시그니처 유지                                                                          |
| 10  | 유지 비용            | 나쁨 — 스토어 계속 유지 | 좋음 — 장기적으로 가장 idiomatic한 TanStack 사용                 | 중간 — "전환한 것처럼 보이지만 `resetKey` 패턴이 남아 나중에 또 정리해야 할 기술부채로 이전될 위험 |

## 라이브러리 도입 심사

해당 없음 — 이미 도입된 `@tanstack/react-query`(v5.101.3)의 `useInfiniteQuery`를 확장 사용한다. v5는 `pageParam`으로 객체(예: `FeedView`의 다중 소스 `Cursor`)를 지원해 문서·타입으로 호환성을 확인했다(PRD 참고). 새 패키지 도입 없음.

## 의사결정 인터뷰 로그

(PRD 1-3 단계에서 이미 결정된 항목은 참조만 한다: 진행 여부, 범위 5곳 전체, 품질 속성=테스트 용이성, Behavior Invariants.)

**Q. 5개 소비처를 `useInfiniteQuery`로 전환하는 방식을 두 가지로 좁힌다 — 각 소비처가 직접 `queryKey`/`useInfiniteQuery`를 소유하게 할지(호출부 재작성 필요), 아니면 기존 `useInfiniteScroll`과 같은 시그니처(`resetKey` 포함)를 유지하는 호환 어댑터 훅을 만들지.**
A. 각 소비처가 `queryKey`를 직접 소유(추천). 이유: `resetKey`는 TanStack Query 관점에서 사실 안티패턴이고(진짜 역할은 `queryKey` 자체가 해야 함), 호출부 재작성 부담은 커지지만 사용자가 이미 선택한 "아키텍처 일관성" 목표와 "테스트 용이성" 우선순위에 더 부합하며, `queryKey`/`enabled`는 TanStack 표준 계약이라 검증하기 쉽다.

## 선택: 안 2

안 2가 근본 원인(스토어 의존, `resetKey`라는 임시 신호)을 완전히 해결하고, 사용자가 우선한 품질 속성(테스트 용이성)과 목표(아키텍처 일관성)에 가장 부합한다. 안 1은 진행하지 않기로 이미 결정됐고(GATE 1), 안 3은 겉보기엔 전환됐지만 `resetKey` 패턴이 어댑터 안에 남아 "진짜 전환은 아직 안 끝난" 상태가 될 위험이 있어 기각한다.

## ADR 본문

### Context

`useFeedRefreshStore`/`usePostDeletionSignalStore`가 남아있는 근본 원인은 피드/프로필 목록이 `useInfiniteScroll`의 로컬 상태이지 쿼리 캐시가 아니라는 것이다(PRD 참고). 5개 소비처가 이 훅을 쓰고 있고, 이 중 `FeedView`/`ProfileView` 2곳만 두 스토어와 직접 관련 있지만, 사용자가 아키텍처 일관성을 위해 5곳 전체 전환을 선택했다(GATE 1).

### Decision

5개 소비처를 각자의 `useInfiniteQuery`로 전환한다:

- **공유 트리거 훅**: `useInfiniteScrollTrigger({ hasNextPage, isFetchingNextPage, fetchNextPage })` — `useInView`(`threshold: 0.8`, `rootMargin: '200px'`) 배선과 "화면에 보이고 다음 페이지가 있고 로딩 중이 아니면 `fetchNextPage()` 호출"만 담당한다. 데이터 셰이프·쿼리키에는 관여하지 않는다.
- **쿼리키 설계**(소비처별로 독립, 데이터 셰이프를 공유하지 않음 — 동작 보존 우선):
  - `FeedView`: `feedQueryKey = ['feed'] as const`
  - `ProfileView`: `profileGridQueryKey(userId) = ['profileGrid', userId] as const`
  - `ProfilePostsFeed`: `profilePostsFeedQueryKey(userId) = ['profilePostsFeed', userId] as const`(기존 N+1 상세조회 + `postDetailQueryKey` 캐시 시딩은 `queryFn` 내부에서 그대로 유지)
  - `useUserSearch`: `userSearchQueryKey(trimmedQuery) = ['userSearch', trimmedQuery] as const`(쿼리 자체가 검색어별로 다른 쿼리가 되므로 `resetKey`가 필요 없어짐 — `enabled: isFetchable`로만 게이팅)
  - `UserListModal`: `userListQueryKey(profileUserId, title) = ['userList', profileUserId, title] as const`(`title`이 이미 "팔로워 목록"/"팔로잉 목록"으로 호출부마다 달라 팔로워/팔로잉 목록을 구분하는 discriminator로 재사용 가능 — 새 prop 불필요)
- **`useFeedRefreshStore` 대체**: `useContentWrite.onSubmit` 성공 시 `queryClient.invalidateQueries({ queryKey: feedQueryKey })` + (자기 프로필 게시글도 갱신되도록) `queryClient.invalidateQueries({ queryKey: profileGridQueryKey(myUserId) })`. `Header.handleLogoClick`(홈에서 로고 클릭)도 `invalidateQueries({ queryKey: feedQueryKey })`로 대체. `useFeedRefreshStore.ts` 삭제.
- **`usePostDeletionSignalStore` 대체**: `PostHeader`의 삭제 성공 콜백에서 `queryClient.setQueriesData({ queryKey: feedQueryKey }, (old) => old ? { ...old, pages: old.pages.map((p) => ({ ...p, posts: p.posts.filter((post) => post.id !== deletedPostId) })) } : old)`로 피드 캐시에서 직접 항목을 제거한다. 프로필 그리드는 PRD Out of Scope대로 연결하지 않는다(기존에도 삭제 신호를 받지 않았음). `usePostDeletionSignalStore.ts` 삭제.
- **300ms 인위적 지연**(Behavior Invariant는 아니지만 기존 UX): 각 소비처의 `queryFn`에서 `pageParam`이 초기값이 아닐 때만(= `loadMore` 상황) 300ms 지연을 넣어 기존 "로딩 스피너 짧게 노출" 느낌을 유지한다.
- `useInfiniteScroll.ts`는 5곳 전환이 끝난 뒤 삭제한다.

### Alternatives

- 안 1(최소 개선안) 기각: GATE 1에서 이미 "진행한다"로 결정됨.
- 안 3(호환 어댑터) 기각: `resetKey` 안티패턴을 어댑터 내부로 옮길 뿐 실제로 없애지 못하고, 사용자가 우선한 목표(아키텍처 일관성)에 덜 부합한다(의사결정 인터뷰 로그 참고).

### Consequences

**장점**: 5개 목록 화면이 모두 표준 TanStack Query 계약(`queryKey`/`enabled`/`invalidateQueries`)을 쓰게 되어, 다음에 새 목록 화면이 추가될 때 참고할 일관된 패턴이 생긴다. `useFeedRefreshStore`/`usePostDeletionSignalStore`가 완전히 사라진다.

**단점/새 위험**: 변경 범위가 이전 두 사이클(#149, #153)보다 훨씬 크다 — 5개 소비처 전부의 호출부를 다시 쓰고, `FeedView`/`ProfileView`는 전용 테스트가 0건인 채로 구조가 바뀐다. `PRD`에서 이미 짚었듯 트래픽이 가장 많은 화면이라 회귀 시 영향이 크다 — 그래서 이번 사이클은 특성화 테스트를 가장 먼저(이슈 1) 두고, 위험이 낮은 소비처(`useUserSearch`)부터 전환해 패턴을 검증한 뒤 `FeedView`(가장 복잡, 다중 커서 + 두 스토어 제거)를 마지막에 다룬다.

### Migration

1. 5개 소비처 특성화 테스트 추가(현재 0건).
2. `useInfiniteScrollTrigger` 공유 훅 도입 + 계약 테스트(아직 아무도 안 씀).
3. `useUserSearch` 전환(가장 단순 — 단일 소스 커서, 디바운스만 신경 쓰면 됨).
4. `UserListModal` 전환.
5. `ProfilePostsFeed` 전환(N+1 캐시 시딩 유지).
6. `ProfileView` 전환(자기 프로필 케이스의 `useFeedRefreshStore` 참조를 `invalidateQueries`로 교체).
7. `FeedView` 전환(다중 소스 커서) + `useContentWrite`/`Header`의 `useFeedRefreshStore` 호출을 `invalidateQueries`로 교체 + `usePostDeletionSignalStore`를 `setQueriesData` 기반으로 교체.
8. `useInfiniteScroll.ts`, `useFeedRefreshStore.ts`, `usePostDeletionSignalStore.ts` 삭제 + 배럴/문서 정리.
9. `result.md` 작성 + 개발환경 실동작 확인.

각 단계 사이(3~7번)에는 아직 전환 안 된 소비처가 `useInfiniteScroll`을 계속 쓰고, 전환된 소비처만 `useInfiniteQuery`를 쓰는 병존 상태가 유지된다 — 이 상태로 커밋이 머지되어도 저장소는 정상이다.

### Rollback

각 체크포인트 이슈는 별도 커밋/PR 단위다. 특정 소비처 전환 후 문제가 생기면 그 커밋만 되돌리고 해당 소비처는 `useInfiniteScroll`로 임시 복원한다. 8번(공용 훅/스토어 삭제)은 5곳 전환이 모두 실동작까지 확인된 뒤에만 진행해 되돌릴 필요가 없도록 한다.

## 회귀 안전망

### 테스트 우선순위

1. **Characterization** — `FeedView`/`ProfileView`/`ProfilePostsFeed`/`useUserSearch`/`UserListModal`(현재 0건, `useUserSearch`만 훅 레벨 간접 커버리지 있음): 초기 로드, 무한스크롤 트리거, 에러 표시, 각 소비처 고유 동작(다중 커서 dedupe, N+1 캐시 시딩, 디바운스, 팔로우 토글 로컬 갱신).
2. **Contract** — `useInfiniteScrollTrigger`: `inView`+`hasNextPage`+`!isFetchingNextPage`일 때만 `fetchNextPage` 호출.
3. **State-transition** — 각 소비처의 `invalidateQueries`/`setQueriesData` 호출 후 캐시 상태 전이(재조회, 항목 제거).
4. **Integration** — 글 작성 → 피드/프로필 재조회, 게시글 삭제 → 피드에서 제거.
5. **E2E**: 상시 스위트에는 추가하지 않음(#100 참고). GATE 3의 개발환경 실동작 확인에서 직접 검증.

### 회귀 시나리오

| 시나리오                               | 기존 결과                                         | 검증 수준        | 실패 시 조치 |
| -------------------------------------- | ------------------------------------------------- | ---------------- | ------------ |
| 각 소비처 초기 로드                    | 정상 데이터 표시                                  | Characterization | 구현 중단    |
| 무한스크롤 트리거                      | 다음 페이지 로드, 중복 호출 없음                  | Contract         | 구현 중단    |
| 추가 로드 실패                         | 에러 메시지 표시                                  | Characterization | 구현 중단    |
| `FeedView` 다중 소스 커서 페이지네이션 | dedupePosts로 중복 없음                           | Characterization | 구현 중단    |
| `useUserSearch` 검색어 변경            | 새 검색어로 초기화되어 재조회                     | State-transition | 구현 중단    |
| `ProfilePostsFeed` N+1 상세조회        | postId별 `postDetailQueryKey` 캐시 시딩 유지      | Characterization | 구현 중단    |
| `UserListModal` 팔로우 토글            | 로컬 목록 항목 즉시 갱신                          | Characterization | 구현 중단    |
| 글 작성 후 피드/내 프로필 재조회       | 새 글이 목록에 반영됨                             | Integration      | 구현 중단    |
| 게시글 삭제 후 피드 반영               | 피드에서 해당 게시글 제거(프로필 그리드는 그대로) | Integration      | 구현 중단    |

## 체크포인트 이슈 목록

### 이슈 1 — 5개 목록 소비처 특성화 테스트 추가

**AC**:

- `FeedView`, `ProfileView`, `ProfilePostsFeed`, `useUserSearch`, `UserListModal` 각각에 초기 로드/무한스크롤 트리거/에러 표시/소비처 고유 동작(다중커서 dedupe, N+1 캐시시딩, 디바운스, 팔로우 토글) 테스트를 추가한다.
- 구조 변경 없음, 기존 `pnpm test` 통과 유지.

**의존성**: 없음.

### 이슈 2 — useInfiniteScrollTrigger 공유 훅 도입

**AC**:

- `useInfiniteScrollTrigger({ hasNextPage, isFetchingNextPage, fetchNextPage })` 신규 훅 추가.
- 계약 테스트: `inView`+`hasNextPage`+`!isFetchingNextPage`일 때만 `fetchNextPage` 호출, 그 외 조건에서는 호출 안 함.
- 아직 아무 소비처도 쓰지 않음(저장소 동작 변화 없음).

**의존성**: 없음.

### 이슈 3 — useUserSearch를 useInfiniteQuery로 전환

**AC**:

- `userSearchQueryKey(trimmedQuery)` 도입, `resetKey` 제거.
- `useInfiniteScrollTrigger` 사용.
- 이슈 1의 `useUserSearch` 테스트 통과, 디바운스/최소글자수/상태(`idle`/`loading`/`error`/`empty`/`success`) 동작 동일.

**의존성**: 이슈 1, 이슈 2.

### 이슈 4 — UserListModal을 useInfiniteQuery로 전환

**AC**:

- `userListQueryKey(profileUserId, title)` 도입.
- 팔로우/언팔로우 토글 시 로컬 목록 항목 갱신 동작 유지(쿼리 캐시 갱신 방식으로 이관).
- 이슈 1의 `UserListModal` 테스트 통과.

**의존성**: 이슈 1, 이슈 2.

### 이슈 5 — ProfilePostsFeed를 useInfiniteQuery로 전환

**AC**:

- `profilePostsFeedQueryKey(userId)` 도입.
- N+1 상세조회 + `postDetailQueryKey` 캐시 시딩 로직은 `queryFn` 내부로 그대로 이관.
- 이슈 1의 `ProfilePostsFeed` 테스트 통과.

**의존성**: 이슈 1, 이슈 2.

### 이슈 6 — ProfileView를 useInfiniteQuery로 전환

**AC**:

- `profileGridQueryKey(userId)` 도입.
- `isMyProfile`일 때 `useFeedRefreshStore` 참조를 제거하고, 글 작성 성공 시 `invalidateQueries({queryKey: profileGridQueryKey(myUserId)})`가 호출되도록 `useContentWrite` 쪽 준비(단, `useFeedRefreshStore.ts` 자체 삭제는 이슈 7에서 `FeedView`까지 끝난 뒤).
- 이슈 1의 `ProfileView` 테스트 통과.

**의존성**: 이슈 1, 이슈 2.

### 이슈 7 — FeedView를 useInfiniteQuery로 전환 + 두 스토어 참조 제거

**AC**:

- `feedQueryKey` 도입, 다중 소스 커서 페이지네이션 + `dedupePosts` 유지.
- `useContentWrite.onSubmit`/`Header.handleLogoClick`의 `useFeedRefreshStore` 호출을 `invalidateQueries(feedQueryKey)` (+ 이슈 6에서 준비한 프로필 갱신)로 교체.
- `PostHeader`의 삭제 성공 콜백을 `usePostDeletionSignalStore` 대신 `setQueriesData(feedQueryKey, ...)` 기반으로 교체.
- 이슈 1의 `FeedView` 테스트 통과, 글 작성/삭제 통합 시나리오 통과.

**의존성**: 이슈 3, 4, 5, 6(모든 다른 소비처 전환이 먼저 끝나 패턴이 검증된 뒤 가장 복잡한 것을 마지막에 처리).

### 이슈 8 — useInfiniteScroll/useFeedRefreshStore/usePostDeletionSignalStore 제거

**AC**:

- `useInfiniteScroll.ts`, `useFeedRefreshStore.ts`, `usePostDeletionSignalStore.ts` 삭제.
- `hooks/index.ts`, `stores/index.ts` 배럴에서 관련 export 제거.
- grep으로 잔존 참조(테스트 mock, 문서 등) 확인.
- `pnpm lint`/`pnpm check-types`/`pnpm test`/`pnpm build` 통과.

**의존성**: 이슈 7.

### 이슈 9 — 결과 검증 및 문서화(`result.md`, GATE 3)

**AC**:

- Before/After(소비처별 코드 구조, 스토어 제거, 테스트 수)를 prd.md 기준선과 비교.
- 개발환경에서 5개 소비처 화면(홈 피드, 프로필 그리드, 프로필 게시글 상세목록, 유저 검색, 팔로워/팔로잉 목록)을 직접 조작해 확인.
- 글 작성 → 피드/프로필 반영, 게시글 삭제 → 피드 반영을 직접 확인.
- `CLAUDE.md`/`docs/conventions.md`의 관련 문구 갱신 여부 판단.
- Remaining Debt/Follow-ups 기록.

**의존성**: 이슈 8.

---

**[GATE 2]** 위 대안 비교, 의사결정 인터뷰 로그, ADR, 회귀 안전망, 체크포인트 이슈 목록을 확인해주시면 이슈를 생성하고 구현으로 넘어가겠습니다.
