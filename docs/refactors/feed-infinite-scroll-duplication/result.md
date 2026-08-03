# Result — feed-infinite-scroll-duplication

## 변경 요약

- **#154**: `useInfiniteScroll`/`useFeedInfiniteScroll`(리팩터 전)과 `useUserSearch`의 characterization 테스트를 추가해 안전망을 확보했다.
- **#155**: `useInfiniteScroll<T, TCursor>`를 제네릭 커서 + `mergeItems`/`initialItems` 옵션으로 확장하고, 죽은 상태 `initialError`를 제거했다. `useUserSearch`의 상태 계산을 `errorMsg`/`items.length` 기반으로 정정해, 검색 초기 로드 실패 시 실제로 `status: 'error'`가 되도록 고쳤다(기존 4개 소비처는 코드 변경 없이 그대로 동작).
- **#156**: `FeedView`를 확장된 `useInfiniteScroll`로 전환했다. `fetchFn` 어댑터(`posts`→`items`), `mergeItems`(기존 `dedupePosts` 주입), `initialItems`(`initialPost` 매핑)로 데이터 셰이프 정책을 옵션으로 흡수했다.
- **#157**: `useFeedInfiniteScroll.ts`와 그 테스트, `hooks/index.ts` 배럴 export를 제거했다.

결과적으로 무한 스크롤 상태 전이 로직(로딩/에러/재시도/스크롤 트리거/`reset`)은 `useInfiniteScroll.ts` 한 파일에만 존재하고, 5개 소비처(`ProfilePostsFeed`, `ProfileView`, `useUserSearch`, `UserListModal`, `FeedView`) 모두 이 훅 하나를 직접 호출한다.

## Before / After

| 항목                              | Before(prd.md 기준선)                                                         | After                                                                                                                                                                  |
| --------------------------------- | ----------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 무한스크롤 상태 전이 로직 파일 수 | 2개(`useInfiniteScroll.ts` 122줄, `useFeedInfiniteScroll.ts` 124줄, 합 246줄) | 1개(`useInfiniteScroll.ts` 133줄)                                                                                                                                      |
| 무한스크롤 훅 테스트              | 0건                                                                           | 12건(`useInfiniteScroll.test.ts` 5건 + `useFeedInfiniteScroll.test.ts` 5건, 4단계에서 통합 훅 검증을 마친 뒤 제거 — 최종적으로는 `useInfiniteScroll.test.ts` 5건 유지) |
| `useUserSearch` 테스트            | 0건                                                                           | 2건(초기 로드 실패 시 에러 상태 확인, 검색 성공 케이스)                                                                                                                |
| `initialError` 죽은 상태          | 존재(`useInfiniteScroll`에서 항상 `null`)                                     | 제거됨                                                                                                                                                                 |
| 검색 초기 로드 실패 시 UI         | (버그) `status`가 `'error'`로 전이하지 않아 에러 UI 미노출                    | `status: 'error'`로 정상 전이, `SearchDrawerContent`/`MusicPickerSearch`에 에러 메시지 노출                                                                            |
| `pnpm lint`                       | ✅ 성공                                                                       | ✅ 성공(신규/변경 파일 포함)                                                                                                                                           |
| `pnpm check-types`                | ✅ 성공                                                                       | ✅ 성공                                                                                                                                                                |
| `pnpm test` (apps/web)            | 25 suites / 116 tests                                                         | 27 suites / 123 tests (모두 통과, +2 suites / +7 tests — 특성화 테스트 5건 추가 후 구 훅 테스트 5건 제거, `useInfiniteScroll` 확장 검증 포함)                          |
| `pnpm build`                      | ✅ 성공, 16개 라우트                                                          | ✅ 성공, 16개 라우트(라우트 구성 변경 없음)                                                                                                                            |

## 개발환경 실동작 확인

- `packages/dto` 변경 없음 — `pnpm dto` 재빌드 불필요.
- 이 저장소에는 `run` 스킬이 없어 `cd apps/web && pnpm dev`로 dev 서버를 직접 백그라운드 기동했다(`next dev --port 3000 --webpack`, "Ready in 2.4s").
- `curl http://localhost:3000/` → `200`, 컴파일 에러 없음(`GET / 200 in 10.9s`), 응답 HTML에 `FeedSkeleton`(`animate-pulse`)이 정상 포함됨 — `FeedView`가 확장된 `useInfiniteScroll`을 통해 초기 렌더(동기 상태)까지는 에러 없이 동작함을 확인.
- `curl http://localhost:3000/profile/test-user-id/posts` → `200`, 컴파일 에러 없음(`GET /profile/test-user-id/posts 200 in 3.5s`) — `ProfilePostsFeed`가 새 훅 시그니처로도 정상 컴파일·렌더됨을 확인.
- dev 서버 로그 전체를 검토했고, 컴파일 에러·모듈 resolve 에러(과거 PR #84류) 없음.
- **직접 확인하지 못한 부분**: 이 세션 환경에는 저장소 루트에 `docker-compose.yml`이 없고(`docker compose`/`docker-compose` CLI도 이 WSL 환경에서 실행 불가) MySQL/Neo4j/Redis + `apps/api`를 기동할 수 없었다. 그 결과 다음은 브라우저 실동작(실제 API 응답 기반)으로 확인하지 못했다:
  - 실제 스크롤 트리거 시 `loadMore`가 진짜 API 응답으로 페이지를 이어붙이는 것(테스트에서는 mock으로 검증됨)
  - `FeedView`의 다중 소스 커서 페이지네이션과 `dedupePosts` 동작(테스트에서는 mock으로 검증됨)
  - 검색창에서 실제로 네트워크 에러를 유발해 에러 UI(`SearchDrawerContent`/`MusicPickerSearch`)가 노출되는 것을 시각적으로 확인
  - **사용자에게 요청**: 로컬에서 `docker compose up -d && pnpm dev` 실행 후, ① 홈 피드 스크롤로 다음 페이지 로드 ② 프로필 게시글 탭 스크롤 ③ 유저 검색 후 네트워크를 잠시 끊어 에러 메시지가 뜨는지 ④ 게시글 공유 라우트(`/post/[id]`) 진입 시 해당 글이 피드 맨 앞에 보이는지, 이 네 가지만 육안으로 확인해주시면 됩니다.

## Behavior Verification

Behavior Invariants(prd.md) 검증:

- 무한스크롤 트리거 시점(`rootMargin: '200px'`, `threshold: 0.8`) — 코드상 `useInView` 옵션 값 변경 없음(직접 확인). ✅
- `loadMore` 재호출 방지(`hasNext`/`isLoading` 가드) — 로직 변경 없음, `useInfiniteScroll.test.ts` "hasNext가 false면 isInView가 true여도 추가 로드를 하지 않는다"로 검증. ✅
- 에러 발생 시 `errorMsg` 표시 및 재시도 — `useInfiniteScroll.test.ts` "추가 로드 실패 시 errorMsg가 설정되고, 다음 트리거에서 재시도한다"로 검증. ✅
- `resetKey` 변경 시 전체 초기화 후 재조회 — `useInfiniteScroll.test.ts`/(구)`useFeedInfiniteScroll.test.ts` 양쪽에서 검증됨(후자는 통합 전 특성화, #157에서 제거). ✅
- `ProfilePostsFeed`의 postId별 쿼리 캐시 시딩 — 코드 변경 없음(훅 시그니처 변경과 무관한 소비처 레벨 로직). ✅ (코드 리뷰로 확인, 별도 테스트는 기존에도 없었음 — 안전망 공백은 이번 사이클 범위 밖)
- `FeedView`의 `initialData` 시딩 — `mergeItems`/`initialItems` 매핑으로 이관, (구)`useFeedInfiniteScroll.test.ts`의 "initialData가 있으면..." 테스트로 통합 전 검증됨. `FeedView` 자체의 통합 후 재검증은 개발환경 실동작 확인 요청 목록에 포함. ⚠️(dev 서버 정적 확인만, 브라우저 실동작 미확인)

adr.md 회귀 시나리오 검증:

| 시나리오                                   | 검증 결과                                                                       |
| ------------------------------------------ | ------------------------------------------------------------------------------- |
| 정상 페이지네이션                          | ✅ `useInfiniteScroll.test.ts`(mock)                                            |
| `loadMore` 진행 중 재트리거                | ✅ `useInfiniteScroll.test.ts`(mock)                                            |
| 추가 로드 실패                             | ✅ `useInfiniteScroll.test.ts`(mock)                                            |
| `resetKey` 변경                            | ✅ `useInfiniteScroll.test.ts`(mock)                                            |
| `FeedView` 다중 소스 커서 페이지네이션     | ⚠️ (구)`useFeedInfiniteScroll.test.ts`로 통합 전 검증, 실제 API 미확인          |
| `FeedView` `initialData` 시딩              | ⚠️ (구)`useFeedInfiniteScroll.test.ts`로 통합 전 검증, 실제 API 미확인          |
| `ProfilePostsFeed` postId별 쿼리 캐시 시딩 | ✅ 코드 변경 없음(리뷰로 확인)                                                  |
| 검색 초기 로드 실패                        | ✅ `useUserSearch.test.ts`("검색 초기 로드가 실패하면 status가 'error'가 된다") |

## Decision Review

- ADR에서 예상한 대로, 안 2(단일 제네릭 훅)는 4개 기존 소비처를 코드 변경 없이 통과시켰다(옵션 기본값이 기존 동작과 동일) — 계약 유지 예상이 실제로 맞았다.
- `FeedView` 전환은 예상대로 어댑터(3줄) + `mergeItems`/`initialItems` 옵션 전달만으로 끝났다 — ADR Migration에서 예상한 "작은 매핑 코드"보다 더 작았다(별도 파일 분리 없이 인라인 어댑터로 충분).
- 의도된 동작 변경(검색 에러 UI 노출)은 계획대로 반영됐고, 부작용(예: loadMore 실패가 잘못 전체 에러로 뒤집히는 회귀)은 `items.length === 0` 조건으로 방지했다 — 이는 PRD/ADR 작성 시점에는 명시적으로 설계하지 않았고 구현 중 발견한 세부 사항이다(errorMsg가 초기 로드/loadMore 실패에 공유된다는 사실을 재확인하고 나서 조건을 추가함).
- 예상과 다르게, 개발환경 실동작 확인은 인프라(docker compose) 부재로 절반만(정적 컴파일/렌더 확인) 수행했다 — ADR/PRD 작성 시점에는 이 제약을 예견하지 못했다.

## Remaining Debt

- `FeedView`의 실제 API 기반 다중 커서 페이지네이션·`dedupePosts`·`initialData` 시딩 동작은 브라우저 실동작으로 아직 검증되지 않았다(위 "개발환경 실동작 확인" 참고, 사용자 확인 요청 대기 중).
- `ProfilePostsFeed`의 postId별 쿼리 캐시 시딩에는 여전히 전용 테스트가 없다(이번 사이클 범위 밖, 기존에도 없었음).
- `useInfiniteQuery`(TanStack Query) 전환은 PRD/ADR에서 의도적으로 Out of Scope로 남겼다 — #153(`useFeedRefreshStore`/`usePostReactionOverridesStore` 통합 검토)과 함께 재검토 대상.

## Follow-ups

- 후속 이슈 신규 등록 없음 — 남은 항목은 기존 #153에 이미 포함된 방향과 일치한다(피드가 쿼리 캐시 기반으로 전환되는 시점에 함께 재검토).
- 사용자 확인 필요: 위 "개발환경 실동작 확인"의 4가지 브라우저 확인 항목.

---

**[GATE 3]** 위 Before/After, 개발환경 실동작 확인(인프라 제약으로 일부는 확인 요청으로 남김), Behavior Verification, 남은 부채를 확인해주시면 이 리팩터링 사이클을 종료하겠습니다.
