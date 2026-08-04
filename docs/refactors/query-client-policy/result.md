# Result — query-client-policy

## 변경 요약

`QueryProvider.tsx`의 `QueryClient`에 전역 `defaultOptions.queries.staleTime`(60초)과 `MutationCache` 전역 `onError`(공통 토스트)를 도입했다. 2개 체크포인트 이슈로 진행했다.

- **#221** — `QueryProvider.tsx`에 `defaultOptions`/`mutationCache` 추가. 기존에 로컬 `toast.error`를 호출하던 5곳(`PlaylistDetailModal.tsx`의 `changeOrderMutation`/`addSongMutation`/`renameMutation`/`deleteMutation`, `ProfileActionButton.tsx`의 `followMutation`)에서 중복 방지를 위해 해당 호출을 제거(같은 커밋에 원자적으로 묶어 배포 사이의 중복 토스트 창을 없앰). 테스트 인프라(`test-utils/QueryClientWrapper.tsx`의 `createTestQueryClient`)에도 동일한 `mutationCache`를 반영해 테스트가 실제 동작과 어긋나지 않게 했다. adr.md의 회귀 안전망 계획대로, 이전엔 실패해도 조용했던 3개 mutation(`updateProfileMutation`, `readNotiMutation`, `createCommentMutation`)이 전역 핸들러로 공통 토스트를 받는지 확인하는 Contract 테스트를 새로 추가했다(`ProfileInfo.test.tsx`에 신규 케이스 1개, `useNotifications.test.ts`/`usePostReactions.test.ts`에 기존 실패 테스트 보강).
- **#222**(본 이슈) — `docs/tanstack-query/index.html`에 "QueryClient 전역 정책" 섹션 신설, `staleTime` 개념 카드와 "새 서버 데이터를 추가할 때 따라야 할 패턴" 가이드를 새 기본값 기준으로 갱신, 각주에 QueryCache를 의도적으로 제외한 이유(기존 인라인 에러 UI·`/user/me` 401 인터셉터와의 중복 위험)를 남김. `result.md` 작성.

쿼리키 값, `invalidateQueries`/`setQueryData`/`setQueriesData` 호출 시점·대상, 낙관적 업데이트(`onMutate`)의 캐시 반영·롤백 로직은 전혀 바꾸지 않았다 — 실패를 "알리는" 책임만 개별 mutation에서 전역으로 옮겼다.

## Before / After

| 항목                                                      | Before(prd.md 기준선)                                 | After                                                                                              |
| --------------------------------------------------------- | ----------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| 실패해도 사용자 피드백이 없는 mutation                    | 9개 중 4개(`updateProfile`, noti×3, `createComment`)  | 0개 — 전역 `MutationCache.onError`가 9개 전체를 커버                                               |
| mutation 실패 메시지 중복 위험                            | 해당 없음(전역 핸들러 자체가 없었음)                  | 없음 — 로컬 toast 5곳 제거를 같은 커밋에 원자적으로 묶어 확인                                      |
| `staleTime` 전역 기본값                                   | 없음(라이브러리 기본값 0)                             | `defaultOptions.queries.staleTime = 60_000`(기존 3개 쿼리가 이미 선택했던 값과 동일)               |
| 기존 4개 쿼리의 개별 `staleTime`                          | PROFILE/PLAYLIST_DETAIL/POST_DETAIL=60초, AUTH_ME=5분 | 변경 없음(개별 옵션이 전역값보다 우선)                                                             |
| pnpm lint                                                 | 성공                                                  | 성공(변경 없음)                                                                                    |
| pnpm check-types                                          | 성공                                                  | 성공(변경 없음)                                                                                    |
| pnpm test (api)                                           | 8 suites / 37 tests                                   | 8 suites / 37 tests(이번 사이클은 api 미변경)                                                      |
| pnpm test (web)                                           | 40 suites / 225 tests                                 | 40 suites / **226 tests**(Contract 테스트 1건 신규 추가 + 기존 실패 테스트 3건에 토스트 검증 보강) |
| pnpm build                                                | 성공                                                  | 성공                                                                                               |
| git diff (3개 구현/테스트/문서 커밋 합산, `apps/web/src`) | -                                                     | 8 files changed, 57 insertions(+), 15 deletions(-)                                                 |

## 개발환경 실동작 확인

- `packages/dto`는 이번 사이클에서 변경하지 않았다 — 재빌드 불필요.
- `docker compose up -d`(mysql/redis/neo4j)로 로컬 인프라를 띄우고 `pnpm dev`로 API(3002)·웹(3000)을 함께 기동했다. API 로그에서 전 모듈이 정상 초기화되고(`Nest application successfully started`) Redis ping이 `PONG`으로 응답하는 것을 확인했다. (알고리즘 모듈의 Neo4j GDS 스케줄 잡이 `gds.graph.exists` 프로시저 미설치로 에러를 남기지만, 이건 로컬 Neo4j 이미지에 GDS 플러그인이 없어 생기는 이 저장소의 기존 이슈이고 `@nestjs/schedule` 크론으로 이번 변경과 무관하게 독립적으로 실행된다 — 이번 변경이 만든 에러가 아님을 확인.)
- `apps/api`의 개발용 `POST /api/auth/login/tmp` 라우트(`isProduction()`이 아닐 때만 열림)로 시드 사용자(`테스트 사용자 1`)의 실제 JWT를 발급받아, 헤드리스 `curl`로도 로그인된 사용자로서 API를 직접 호출할 수 있었다 — 이전 사이클(query-key-centralization)보다 한 단계 더 깊게 확인했다.
  - `/user/me`, `/playlist` 조회 성공, `PATCH /playlist/:id`(제목 변경)로 실제 rename mutation이 의존하는 API가 정상 동작함을 확인.
  - 존재하지 않는 `playlistId`로 같은 API를 호출해 `404`를 확인 — 프런트 mutation의 `onError` 경로가 실제로 타는 실패 케이스가 백엔드에서 재현 가능함을 검증.
  - 프런트 라우트 4개(`/`, `/archive`, `/profile/[id]`, `/profile/[id]/posts` — 모두 이번 사이클에서 건드린 mutation/쿼리를 쓰는 화면)를 `curl`로 요청해 전부 `200`, `pnpm dev` 로그에도 컴파일·런타임 에러가 없음을 확인(`web:dev` 로그에 compile/render 시간만 찍히고 에러 라인 없음).
- **직접 확인하지 못한 부분**: 이 환경에 브라우저 자동화 도구(playwright/puppeteer/chromium)가 설치돼 있지 않아, 순수 클라이언트 JS 동작인 다음 두 가지는 실제 브라우저 DOM/토스트 렌더링으로 확인하지 못했다.
  1. mutation 실패 시 토스트가 화면에 정확히 1번만 렌더링되는지(중복 없음) — `curl`은 클라이언트 캐시나 토스트 렌더링을 갖지 않아 관찰 불가능한 항목이다. 대신 **위에서 추가한 Contract 테스트**(jsdom 환경에서 실제 프로덕션과 동일한 `mutationCache` 설정으로 `toast.error`가 정확히 그 문구로 호출됐는지 검증)로 대체 커버했다 — 완전히 동등하진 않지만(실제 브라우저 렌더링을 거치지 않음) 가장 가까운 자동화된 대체 수단이다.
  2. `profilePostsFeedQueryKey`/`userSearchQueryKey`/`userListQueryKey`가 전역 `staleTime` 60초 적용 후 실제로 눈에 띄는 재요청 지연을 만드는지 — `staleTime`은 순수 클라이언트 캐시 개념이라 서버 응답(`curl`)만으로는 재현할 수 없는 항목이다. adr.md에서 이미 이 위험을 알고 롤백 레버(해당 쿼리키만 `staleTime: 0` override)를 마련해뒀다 — **사용자가 실제 브라우저로 게시글 작성 직후 60초 내 `/profile/[id]/posts`를 열어 새 글이 보이는지 한 번 확인해주시길 요청한다.** 문제가 있으면 `profilePostsFeedQueryKey`에만 `staleTime: 0`을 override하는 추가 커밋으로 해결 가능하고, 이번 사이클의 나머지 결정을 되돌릴 필요는 없다.

## Behavior Verification

- **Behavior Invariants(prd.md)**: 기존 4개 쿼리의 `staleTime` 값(코드 변경 없음, diff로 확인)·`refetchInterval` 쿼리(noti/comments, 파일 미변경)·모든 `invalidateQueries`/`setQueryData`/`setQueriesData` 호출부(diff상 토스트 라인만 제거되고 나머지 로직 라인은 그대로)·각 mutation의 `onMutate`/`onSuccess` 캐시 로직(그대로) 모두 유지됨을 diff와 226개 테스트 통과로 확인했다.
- **회귀 시나리오(adr.md)**: "mutation 성공"·"로컬 toast 없던 4곳 실패 시 공통 토스트"·"로컬 toast 있던 5곳 실패 시 중복 없이 1회"·"refetchInterval 쿼리 유지"는 테스트 스위트로 확인. "`/user/me` 401 시 토스트 중복 없음"은 QueryCache를 애초에 건드리지 않았으므로 구조적으로 안전(코드 검토로 확인, 401은 axios 인터셉터 단계에서 처리되고 QueryCache까지 도달하는 에러가 아님). "게시글 작성 직후 60초 내 재방문" 시나리오만 위 개발환경 실동작 확인의 한계로 사용자 확인이 필요하다.

## Decision Review

- ADR에서 안 1(MutationCache만 + staleTime 60초)을 선택하며 예상한 비용은 "파일 1개 + mutation 5곳(로컬 toast 제거)"였다. 실제로는 여기에 더해 adr.md 스스로 약속했던 Contract 테스트 3건(신규 1 + 보강 2)이 추가로 필요했다 — ADR의 "테스트 우선순위" 절에 이미 계획돼 있던 항목이라 범위 초과는 아니지만, Before/After의 diff 규모(8 files)가 채택 당시 예상(6 files)보다 조금 커졌다.
- 예상하지 못했던 것: `profilePostsFeedQueryKey`가 어디서도 무효화되지 않는다는 기존 공백을, 전역 `staleTime` 도입이 "항상 안 보이던 문제"에서 "가끔 보이는 문제"로 노출시킬 수 있다는 위험을 ADR 단계에서 미리 찾아냈다 — 이건 구현 중 발견이 아니라 조사 단계에서 코드 전수 확인(`grep`)으로 사전에 잡아낸 것이라, 실제 구현에서는 놀랄 일이 없었다. 다만 이 위험 자체는 브라우저 없이는 최종 확인이 안 돼 Remaining Debt로 남는다.
- 이 사이클에서 처음으로 로컬 API에 실제 JWT로 로그인해 `curl` 검증을 시도했다(`/api/auth/login/tmp` 개발용 라우트 활용) — query-key-centralization 사이클보다 한 단계 더 깊은 실동작 확인이 가능했다. 브라우저 자동화 도구 부재는 여전히 남은 한계.

## Remaining Debt

- `profilePostsFeedQueryKey`/`userSearchQueryKey`/`userListQueryKey`의 전역 `staleTime` 60초 적용 후 실제 체감 지연 여부 — 브라우저 실동작으로 아직 확인되지 않음(위 참고). 문제가 있으면 해당 쿼리키만 `staleTime: 0` override로 대응.
- `usePostLikeToggle.ts`(좋아요 토글, `useMutation` 아님)와 `useInlineEditField.ts` 기반 게시글 본문 수정은 이번 전역 `MutationCache` 핸들러의 적용 대상이 아니다 — 전자는 여전히 조용히 실패하고(prd.md Out of Scope에서 이미 명시), 후자는 자체 `toast.error`가 있어 시급하지 않다.
- 이 환경에 브라우저 자동화 도구(playwright 등)가 없다는 사실 자체 — 다음에 클라이언트 전용 캐시/렌더링 동작(staleTime, 토스트 중복 등)을 다루는 사이클에서 같은 한계가 반복될 것이다. `/run-skill-generator`로 이 저장소의 실행 스킬을 만들어두면 다음부터는 `docker compose`/`pnpm dev`/dev 로그인 라우트까지의 절차가 반복 조사 없이 재사용 가능하다.
- prd.md의 나머지 Out of Scope 항목(#218 낙관적 업데이트 롤백 방식 통합, #219 `useInfiniteQuery` 옵션 팩토리화)은 그대로 남아 있다.

## Follow-ups

- 사용자가 실제 브라우저로 "게시글 작성 → 60초 내 프로필 게시글 피드 재방문" 흐름을 한 번 확인(위 개발환경 실동작 확인의 한계 항목).
- 이 저장소에 웹 앱을 실제로 구동/조작하는 `run` 스킬이 없다는 게 이번 사이클에서 드러났다 — `/run-skill-generator` 실행을 권장(필수는 아님).
- #218(낙관적 업데이트 롤백 방식 통합), #219(`useInfiniteQuery` 페이지네이션 옵션 팩토리화) — 이번 사이클과 무관하게 이미 등록된 별도 백로그.
