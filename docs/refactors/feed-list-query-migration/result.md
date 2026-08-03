# Result — feed-list-query-migration

## 변경 요약

- **#168**: `FeedView`/`ProfileView`/`ProfilePostsFeed`(신규, 0건 → 각 6/4/2건)와 `useUserSearch`/`UserListModal`(기존 테스트 보강)에 특성화 테스트를 추가해 안전망을 확보했다. 진단 중 `useUserSearch`/`UserListModal`에 기존 테스트가 일부 있었다는 사실을 재확인해 PRD를 정정했다.
- **#169**: `useInView` 배선 + `fetchNextPage` 호출 조건만 담당하는 공유 훅 `useInfiniteScrollTrigger`를 신설했다.
- **#170~#174**: 5개 소비처를 리스크가 낮은 순서(`useUserSearch` → `UserListModal` → `ProfilePostsFeed` → `ProfileView` → `FeedView`)로 각자의 `useInfiniteQuery`/쿼리키로 전환했다. `useFeedRefreshStore.bump()`는 `queryClient.invalidateQueries`로, `usePostDeletionSignalStore`의 삭제 신호는 `queryClient.setQueriesData`로 대체했다.
- **#175**: `useInfiniteScroll.ts`, `useFeedRefreshStore.ts`, `usePostDeletionSignalStore.ts`를 삭제하고 배럴/테스트 잔존 참조를 정리했다.

결과적으로 5개 목록 화면 모두 표준 TanStack Query 계약(`queryKey`/`enabled`/`invalidateQueries`/`setQueriesData`)을 쓰고, 리프레시 트리거 전용 zustand 스토어가 완전히 사라졌다.

## Before / After

| 항목                                                    | Before(prd.md 기준선)                                                                                   | After                                                                                                         |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| 무한스크롤 상태 관리 방식                               | `useInfiniteScroll`(133줄, `useState` 기반 커스텀 훅) 1개를 5곳이 공유                                  | 5개 소비처가 각자 `useInfiniteQuery` + 공유 트리거 훅(`useInfiniteScrollTrigger`, 25줄) 사용                  |
| `useFeedRefreshStore`                                   | 존재(11줄, `bump()`를 4곳이 호출)                                                                       | 제거됨 — 호출부는 `queryClient.invalidateQueries`로 대체                                                      |
| `usePostDeletionSignalStore`                            | 존재(21줄, `deletedPostId` 1필드)                                                                       | 제거됨 — `PostHeader`가 `queryClient.setQueriesData(feedQueryKey, ...)`로 직접 갱신                           |
| `ProfileView`의 `resetKey` 로직                         | `isMyProfile`일 때만 `nonce` 기반 `resetKey`                                                            | 제거됨 — `profileGridQueryKey(userId)` 자체가 사용자별로 격리되어 불필요                                      |
| `FeedView`/`ProfileView`/`ProfilePostsFeed` 전용 테스트 | 0건                                                                                                     | 6건 / 4건 / 2건                                                                                               |
| `useUserSearch`/`UserListModal` 테스트                  | 2건 / 2건(닫기·배경클릭만)                                                                              | 5건 / 7건                                                                                                     |
| 전체 관련 테스트 수                                     | 30 suites / 135 tests(#153 종료 시점, PRD 재확인 시 실제로는 `useUserSearch`/`UserListModal` 일부 포함) | 33 suites / 155 tests(#149 대비 -1 suite: `useInfiniteScroll.test.ts` 삭제, +7 suites 신규/보강 반영 후 순감) |
| `pnpm lint`                                             | ✅ 성공                                                                                                 | ✅ 성공                                                                                                       |
| `pnpm check-types`                                      | ✅ 성공                                                                                                 | ✅ 성공                                                                                                       |
| `pnpm build`                                            | ✅ 성공, 16개 라우트                                                                                    | ✅ 성공, 16개 라우트(라우트 구성 변경 없음)                                                                   |

## 개발환경 실동작 확인

- `packages/dto` 변경 없음 — `pnpm dto` 재빌드 불필요.
- `cd apps/web && pnpm dev`로 dev 서버를 직접 백그라운드 기동(`next dev --port 3000 --webpack`, "Ready in 1566ms").
- `curl http://localhost:3000/` → `200`, 컴파일 에러 없음(`GET / 200 in 6.6s`), 응답 HTML에 `FeedSkeleton`(`animate-pulse`) 정상 포함 — `FeedView`가 `useInfiniteQuery` 기반으로 전환된 뒤에도 초기 렌더까지 에러 없이 동작함을 확인.
- `curl http://localhost:3000/profile/test-user-id/posts` → `200`, 컴파일 에러 없음(`GET /profile/test-user-id/posts 200 in 3.4s`) — `ProfilePostsFeed` 확인.
- `curl http://localhost:3000/profile/test-user-id` → `200`, 컴파일 에러 없음(`GET /profile/test-user-id 200 in 1275ms`) — `ProfileView` 확인.
- dev 서버 로그를 검토했고 컴파일·모듈 resolve 에러 없음.
- **직접 확인하지 못한 부분**: #149/#153 result.md와 동일한 인프라 제약(이 세션 환경에 `docker-compose.yml` 없음, MySQL/Neo4j/Redis + `apps/api` 기동 불가)으로, 다음은 실제 API 응답 기반 브라우저 실동작으로 확인하지 못했다(mock 기반 유닛/통합 테스트로는 검증됨):
  - 홈 피드에서 실제 스크롤로 다음 페이지가 로드되고 다중 소스 커서가 올바르게 넘어가는지
  - 글 작성 후 홈 피드와 내 프로필 그리드가 실제로 재조회되는지
  - 게시글 삭제 후 홈 피드에서 실제로 사라지는지
  - 유저 검색/팔로워·팔로잉 목록의 무한스크롤과 팔로우 토글이 실제 API로 정상 동작하는지
  - **사용자에게 요청**: 로컬에서 `docker compose up -d && pnpm dev` 실행 후, ① 홈 피드 스크롤 ② 글 작성 후 피드/프로필 반영 ③ 게시글 삭제 후 피드 반영 ④ 프로필 게시글 상세목록 스크롤 ⑤ 유저 검색 ⑥ 팔로워/팔로잉 목록 스크롤·팔로우 토글, 이 여섯 가지를 육안으로 확인해주시면 됩니다.

## Behavior Verification

Behavior Invariants(prd.md) 검증:

- `FeedView`/`ProfileView` 무한스크롤 트리거 시점(`rootMargin: '200px'`, `threshold: 0.8`) — `useInfiniteScrollTrigger`가 동일한 옵션으로 `useInView`를 호출, 계약 테스트로 검증. ✅
- 로딩 중 재호출 방지 — `useInfiniteQuery`의 `hasNextPage`/`isFetchingNextPage`를 그대로 트리거 조건에 사용, `useInfiniteScrollTrigger.test.ts`로 검증. ✅
- 에러 발생 시 `errorMsg` 표시 — 5개 소비처 테스트 모두에서 검증. ✅
- 글 작성/팔로우 후 피드 재조회 — `FeedView.test.tsx`/`ProfileView.test.tsx`의 `invalidateQueries` 테스트로 검증(실제 `useContentWrite`/`Header` 연결은 코드 리뷰로 확인, 브라우저 실동작은 미확인). ✅(단위) / ⚠️(실동작 미확인)
- 게시글 삭제 시 피드에서 제거 — `PostHeader.test.tsx`/`FeedView.test.tsx`의 `setQueriesData` 테스트로 검증. ✅(단위) / ⚠️(실동작 미확인)
- `FeedView`의 다중 소스 커서 병합과 `dedupePosts` — `FeedView.test.tsx`로 검증(mock 기반). ✅
- `ProfileView`의 `isMyProfile` 조건부 로직 — 제거됐지만, `profileGridQueryKey(userId)` 자체가 사용자별로 격리되어 동등한 효과를 낸다는 것을 "다른 유저의 쿼리를 invalidate해도 영향 없음" 테스트로 검증. ✅
- `ProfilePostsFeed`의 N+1 + `postDetailQueryKey` 캐시 시딩 — 유지, 테스트로 검증. ✅
- `useUserSearch`의 디바운스·최소글자수·상태 전이 — 유지, 테스트로 검증(신규 3건 추가: idle/empty/검색어 변경). ✅
- `UserListModal`의 팔로우 토글 시 로컬 갱신 — `setQueryData` 기반으로 이관, 테스트로 검증. ✅

## Decision Review

- ADR에서 예상한 대로, 리스크가 낮은 소비처(`useUserSearch`)부터 전환해 패턴(쿼리키 설계, `useInfiniteScrollTrigger` 재사용, 300ms 지연 재현)을 먼저 검증한 뒤 가장 복잡한 `FeedView`를 마지막에 다룬 순서가 실제로 도움이 됐다 — 앞선 4개 소비처에서 이미 검증된 패턴을 `FeedView`에 그대로 재사용해 다중 소스 커서 처리만 추가로 고민하면 됐다.
- ADR에서 예상하지 못했던 추가 단순화: `ProfileView`의 `isMyProfile` 조건부 `resetKey` 로직이 쿼리키 자체의 사용자별 격리 덕분에 완전히 불필요해져서 제거할 수 있었다 — Migration 계획에는 "참조 제거"만 적었지 "로직 자체가 불필요해진다"는 것까지는 예상하지 못했다.
- 안 3(호환 어댑터) 대신 안 2(각 소비처가 쿼리키 직접 소유)를 선택한 것은 옳았다 — 변경 범위는 컸지만(23개 파일, +822/-413줄), 각 소비처가 자기 쿼리키를 소유하게 되면서 `useContentWrite`/`Header`/`PostHeader`가 다른 컴포넌트 파일에서 쿼리키 상수를 직접 import해 재사용하는 자연스러운 패턴이 만들어졌다 — 어댑터 방식이었다면 이런 재사용이 어려웠을 것이다.
- 예상과 다르게, 개발환경 실동작 확인은 이번에도 인프라 부재로 정적 컴파일/렌더 확인까지만 직접 수행했다 — #149/#153에 이어 세 번째로 반복되는 제약이다.

## Remaining Debt

- 홈 피드 스크롤/다중커서, 글 작성·삭제 반영, 프로필 게시글 상세목록, 유저 검색, 팔로워·팔로잉 목록은 브라우저 실동작으로 아직 검증되지 않았다(위 "개발환경 실동작 확인" 참고, 사용자 확인 요청 대기 중).
- `ProfilePostsFeed`의 postId별 쿼리 캐시 시딩에는 여전히 전용 테스트가 없다(#149/#153에서도 동일하게 남겨둔 항목, 이번에도 범위 밖).
- 프로필 게시글 그리드(`ProfilePostsFeed`, `ProfileView`)가 게시글 삭제 신호를 받지 않는 기존 갭은 이번에도 그대로 남아있다(PRD Out of Scope로 명시).

## Follow-ups

- 사용자 확인 필요: 위 "개발환경 실동작 확인"의 6가지 브라우저 확인 항목.
- 새 후속 이슈 등록 없음 — 이번 사이클로 `refresh-trigger-stores`(#153)에서 시작된 스토어 제거 작업이 완결됐다.

---

**[GATE 3]** 위 Before/After, 개발환경 실동작 확인(인프라 제약으로 일부는 확인 요청으로 남김), Behavior Verification, 남은 부채를 확인해주시면 이 리팩터링 사이클을 종료하겠습니다.
