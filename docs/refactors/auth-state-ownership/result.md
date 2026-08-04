# Result — auth-state-ownership

## 변경 요약

`stores/useAuthStore.ts`(`useAuthMeQuery`의 파생 상태를 `AuthBootstrap`이 매 렌더 미러링하던 스토어)를 삭제하고, 16개 소비처가 이미 존재하던 `useAuthMe()`를 직접 구독하도록 전환했다. 2개 체크포인트 이슈로 진행했다.

- **#233** — `hooks/auth/client/index.ts` 바럴 신설. `ProfileView.tsx`, `useNotifications.ts`, `RightPanel.tsx`, `usePostDetailModal.ts`, `useContentWrite.ts`, `PrivacyConsentGate.tsx`, `MobileBottomNav.tsx`, `UserListModal.tsx`, `Sidebar.tsx`, `PostCard.tsx`, `QueueList.tsx`, `NowPlaying.tsx`, `MiniPlayerBar.tsx`, `SearchDrawerContent.tsx` 14개 파일 + **PRD/ADR 조사 시점에 누락됐던 `app/profile/page.tsx`**(1개, `pnpm check-types`가 잡아냄) = 총 15개 소비처를 `useAuthMe()`로 전환. `stores/useAuthStore.ts`, `hooks/auth/client/AuthBootstrap.tsx` 삭제, `app/layout.tsx`의 `<AuthBootstrap />` 마운트 제거. `AuthBootstrap.test.tsx`의 #139 계약 테스트를 `useAuthMe.test.ts`로 재작성했고, 기존 8개 테스트 파일의 `useAuthStore.setState(...)` 시딩을 `authMe` 쿼리 캐시 시딩(`test-utils/authMeTestUtils.ts`의 `seedAuthMe`)으로 갱신.
- **#234**(본 이슈) — `docs/tanstack-query/index.html`의 "zustand ↔ TanStack Query 경계 원칙" 표에서 `useAuthStore` 행 제거. 같은 표에 함께 stale해 있던 `usePostReactionOverridesStore`(PR #167에서 이미 삭제)·`useProfileStore`(#208에서 이미 삭제)·`useSpotifyPlayerStore`(query-client-policy 사이클 이후 PR #232에서 이미 삭제) 서술도 "완료"로 정정. `result.md` 작성.

로그인/로그아웃/401 세션 만료 흐름의 판정 조건과 시점, `authMe` 쿼리 옵션(`staleTime` 5분, `retry: false`)은 전혀 바꾸지 않았다 — 상태를 읽는 경로만 "쿼리 → 스토어 미러 → 소비처"에서 "쿼리 → 소비처 직접 구독"으로 한 단계 줄였다.

## Before / After

| 항목                                                   | Before(prd.md 기준선)                                                                                  | After                                                                                                                                     |
| ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `useAuthStore` 소비처                                  | 15개 파일(PRD 작성 시점 재확인 수치)                                                                   | 0개 — 스토어 자체가 삭제됨                                                                                                                |
| 실제 마이그레이션 대상 파일 수                         | -                                                                                                      | **16개**(PRD의 15개 + `app/profile/page.tsx` 1개, `pnpm check-types`가 잡아냄 — src/ 바깥 app/ 디렉터리는 초기 grep 범위에서 빠져 있었음) |
| 인증 상태 소유권                                       | `useAuthMeQuery`(쿼리) → `AuthBootstrap`(미러 작성) → `useAuthStore`(스토어) → 15개 소비처(구독) — 4단 | `useAuthMeQuery` → `useAuthMe()`(파생 훅) → 16개 소비처(직접 구독) — 2단                                                                  |
| `useAuthStore.getState()` 컴포넌트 밖 동기 접근        | 0곳(PRD에서 이미 확인)                                                                                 | 해당 없음(스토어 삭제)                                                                                                                    |
| #139 계약(여러 소비처가 `authMe` 네트워크 호출을 공유) | 테스트로 검증됨(`AuthBootstrap.test.tsx`)                                                              | 새 구조 기준으로 재작성해 동일하게 검증됨(`useAuthMe.test.ts`)                                                                            |
| pnpm lint                                              | 성공                                                                                                   | 성공(변경 없음)                                                                                                                           |
| pnpm check-types                                       | 성공                                                                                                   | 성공(변경 없음) — 단, 구현 중 `app/profile/page.tsx` 누락을 이 명령이 실제로 잡아냄                                                       |
| pnpm test (api)                                        | 8 suites / 37 tests                                                                                    | 8 suites / 37 tests(이번 사이클은 api 미변경)                                                                                             |
| pnpm test (web)                                        | 40 suites / 226 tests                                                                                  | 40 suites / 226 tests(테스트 개수 동일 — 8개 파일 내부 시딩 방식만 갱신, 신규 테스트 순증가는 파일명 변경 상쇄로 없음)                    |
| pnpm build                                             | 성공                                                                                                   | 성공                                                                                                                                      |
| git diff (구현+문서 2개 커밋 합산)                     | -                                                                                                      | 33 files changed, 220 insertions(+), 206 deletions(-)                                                                                     |

## 개발환경 실동작 확인

- `packages/dto`는 이번 사이클에서 변경하지 않았다 — 재빌드 불필요.
- `docker compose up -d`(mysql/redis/neo4j) + `pnpm dev`로 API(3002)·웹(3000)을 기동했다. API 로그에서 전 모듈 정상 초기화, Redis `PONG` 확인.
- `apps/api`의 개발용 `POST /api/auth/login/tmp` 라우트로 시드 사용자 JWT를 발급받아 `/user/me`가 정상 응답함을 확인했다.
- 이번 사이클에서 변경한 소비처가 몰린 프론트 라우트 5개(`/`, `/archive`, `/profile`, `/profile/[id]`, `/profile/[id]/posts` — 특히 `/profile`은 이번에 새로 발견해 마이그레이션한 `app/profile/page.tsx` 자체)를 `curl`로 요청해 전부 `200`을 확인했다. `pnpm dev` 로그에도 컴파일·런타임 에러가 없었다(`Found 0 errors`, webpack 컴파일 성공, "module factory is not available" 류 재현 없음).
- **직접 확인하지 못한 부분**: 이 환경에 브라우저 자동화 도구(playwright 등)가 없어, `useAuthMe()`가 실제 브라우저에서 로그인 상태 변화(로그인/로그아웃/401)에 맞춰 리렌더되는지는 `curl`/SSR 확인으로는 관찰할 수 없었다. 대신 (1) `useAuthMe.test.ts`의 #139 계약 테스트, (2) 8개 파일의 인증 상태별(로그인/비로그인/특정 userId) 렌더 결과를 검증하는 기존 characterization 테스트 40 suites/226 tests 전체 통과로 대체 커버했다 — 완전히 동등하진 않지만 가장 가까운 자동화된 대체 수단이다.

## Behavior Verification

- **Behavior Invariants(prd.md)**: 로그인/로그아웃/401 흐름의 판정 조건·시점은 코드 변경 없음(diff 확인) — `AuthLoginQueryHandler.tsx`, `hooks/auth/client/logout.ts`, `api/internal/client.ts`의 401 핸들러 모두 이번 사이클에서 손대지 않았다. `authMe` 쿼리 옵션(`staleTime`/`retry`)도 `useAuthMeQuery.ts`에서 주석만 갱신했을 뿐 값은 그대로다. 16개 소비처의 렌더 결과는 226개 테스트 통과로 확인.
- **회귀 시나리오(adr.md)**: "여러 소비처 동시 구독 시 네트워크 호출 1회 공유"는 재작성된 계약 테스트로 확인. "로그인 성공"/"로그아웃(리로드)"/"401 세션 만료"는 코드 diff상 관련 로직이 전혀 바뀌지 않아 구조적으로 안전하고, 개발환경 실동작에서 API 레벨까지는 확인했다(브라우저 리렌더 확인은 위 한계 참고).

## Decision Review

- ADR에서 안 1(기존 `useAuthMe()` 그대로 재사용)을 채택하며 예상한 비용은 "새 코드 0줄, 파일 15개 전환"이었다. 실제로는 `app/profile/page.tsx`가 초기 grep 범위(`apps/web/src`)에서 빠져 있어 16개가 됐다 — `pnpm check-types`가 놓치지 않고 잡아냈고, `src/` 바깥(`app/`)도 항상 같이 검색해야 한다는 교훈을 남겼다.
- 처음엔 사용자가 "필드별 selector 재설계"(안 2, 개별 훅 3개)를 선택해 ADR을 그 방향으로 작성했으나, 이후 "일단은 기존 코드를 정리하고 효율화가 목표"라는 이유로 안 1로 회귀했다 — 이 결정 번복 자체가 이번 사이클의 성격(순수 정리)을 다시 명확히 했다. adr.md에 두 결정 모두(선택 → 번복 → 최종 결정)를 근거와 함께 남겨뒀다.
- 예상하지 못했던 것: `docs/tanstack-query/index.html`의 zustand 경계 표가 `useAuthStore` 말고도 이미 삭제된 스토어 3개(`usePostReactionOverridesStore`/`useProfileStore`/`useSpotifyPlayerStore`)를 여전히 "존재하는 것처럼" 서술하고 있었다 — 이번 사이클에서 함께 정정했다. 백로그 #185도 같은 이유로 유령 이슈였음을 발견해 닫았다(#233 구현 전 단계에서).

## Remaining Debt

- `useAuthMe()`가 `{ userId, isAuthenticated, isLoading }` 객체를 통째로 반환해, 필드 하나만 쓰는 컴포넌트도 다른 필드가 바뀌면 이론상 리렌더된다 — ADR에서 검토했던 "필드별 개별 훅(TanStack tracked query 활용)" 설계는 이번 사이클 목적(인다이렉션 정리)과 맞지 않다고 재평가돼 보류됐다. 인증 상태가 세션당 1~2회만 바뀌는 값이라 실질 영향은 낮다고 판단하지만, 다시 필요해지면 adr.md의 안 2 설계를 그대로 재사용할 수 있다.
- 이 환경에 브라우저 자동화 도구가 없다는 한계는 `query-client-policy` 사이클에서도 동일하게 지적됐던 사항 — 반복되고 있다.

## Follow-ups

- (선택) `useAuthMe()` 필드별 selector 지원 — 실제 리렌더 문제가 관측되면 재검토(adr.md 안 2 참고).
- `query-client-policy`에서 남겨둔 `profilePostsFeedQueryKey`/`userSearchQueryKey`/`userListQueryKey`의 `staleTime` 60초 체감 지연 확인 요청은 여전히 별도로 남아있음(이번 사이클과 무관).
