# Result — query-key-centralization

## 변경 요약

TanStack Query 쿼리키 12개를 소비 훅/컴포넌트 파일에서 분리해 `apps/web/src/query-keys/{domain}.ts` + `index.ts` 바럴로 옮겼다. 7개 체크포인트 이슈로 나눠 도메인 단위로 진행했다.

- **#209** — `query-keys/` 폴더 뼈대 신설, `AUTH_ME_QUERY_KEY`(auth), `userSearchQueryKey`(search) 이동. 소비처 각 1곳뿐이라 패턴 확립용으로 가장 작은 두 도메인부터 시작.
- **#210** — `feedQueryKey`(`components/feed/FeedView.tsx` → `query-keys/feed.ts`) 이동. 소비처 4곳(`FeedView.tsx`, `Header.tsx`, `PostHeader.tsx`, `useContentWrite.ts`) 갱신 — 훅이 컴포넌트를 역참조하던 사례 하나 해소.
- **#211** — `notiQueryKey`(`useNotifications.ts` → `query-keys/noti.ts`) 이동.
- **#212** — `playlistDetailQueryKey`, `PLAYLISTS_QUERY_KEY`를 `query-keys/playlist.ts`로 이동. 소비처 6곳 갱신.
- **#213** — `profileQueryKey`, `profileGridQueryKey`, `profilePostsFeedQueryKey`, `userListQueryKey`를 `query-keys/profile.ts`로 이동. 소비처 6곳 갱신 — `useContentWrite.ts`가 `ProfileView.tsx`(컴포넌트)를 역참조하던 두 번째 사례 해소.
- **#214** — `postDetailQueryKey`, `commentsQueryKey`를 `query-keys/post.ts`로 이동. 소비처가 가장 많음(8곳: `usePostDetailModal`, `usePostCacheSync`, `usePostLikeToggle`, `usePostReactions`, `ProfilePostsFeed`, `PostCard` 및 관련 테스트).
- **#215**(본 이슈) — Success Criteria 확인, `docs/tanstack-query/index.html`의 "Query Key 지도" 표·개념 카드·가이드 절 갱신, `result.md` 작성.

키 값(배열 리터럴)과 `staleTime`/`enabled`/`refetchInterval` 등 쿼리 옵션, 무효화 호출 시점은 전혀 바꾸지 않았다 — 정의 위치(import 경로)만 이동했다.

## Before / After

| 항목                              | Before(prd.md 기준선)                                                                      | After                                                                                               |
| --------------------------------- | ------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------- |
| 쿼리키 정의 위치                  | 10개 파일에 분산(훅 8곳, 컴포넌트 4곳)                                                     | `src/query-keys/{domain}.ts` 8개 파일 + `index.ts` 바럴로 통일                                      |
| 컴포넌트 파일이 export하는 쿼리키 | 4개(`feedQueryKey`, `profileGridQueryKey`, `profilePostsFeedQueryKey`, `userListQueryKey`) | 0개 — `grep -rn "^export const.*QueryKey\|^export const.*QUERY_KEY" apps/web/src/components`로 확인 |
| 훅→컴포넌트 역방향 의존           | 2건(`useContentWrite.ts` → `FeedView.tsx`, `ProfileView.tsx`)                              | 0건 — 두 곳 모두 `@/query-keys`에서 import                                                          |
| 소비처 import 경로 변경 파일 수   | -                                                                                          | 24개 파일(소비처) + 8개 신설 도메인 파일 + 1개 바럴                                                 |
| pnpm lint                         | 성공                                                                                       | 성공(변경 없음)                                                                                     |
| pnpm check-types                  | 성공                                                                                       | 성공(변경 없음)                                                                                     |
| pnpm test (api)                   | 8 suites / 37 tests 통과                                                                   | 8 suites / 37 tests 통과(api는 이번 사이클에서 미변경, 재확인만)                                    |
| pnpm test (web)                   | 40 suites / 225 tests 통과                                                                 | 40 suites / 225 tests 통과 — 테스트 코드 자체는 import 경로만 바뀌고 새 케이스 없음                 |
| pnpm build                        | 성공                                                                                       | 성공                                                                                                |
| git diff (6개 구현 커밋 합산)     | -                                                                                          | 50 files changed, 330 insertions(+), 57 deletions(-)                                                |

## 개발환경 실동작 확인

- `packages/dto`는 이번 사이클에서 변경하지 않았다(범위가 `apps/web` 프론트엔드 import 경로로 한정) — 재빌드 불필요.
- `docker compose up -d`(mysql/redis/neo4j)로 로컬 인프라를 띄운 뒤 `pnpm dev`(`turbo --filter=api --filter=web`)로 API(3002)와 웹(3000)을 함께 기동했다.
- API 로그에서 전 모듈이 정상 초기화되고(`Nest application successfully started`), Redis ping이 `PONG`으로 응답하는 것을 확인했다.
- 웹 dev 서버가 `Ready in 1772ms`로 컴파일 성공했고, 이번 사이클에서 쿼리키 소비처가 몰려 있던 세 라우트(`/`, `/archive`, `/profile`)에 `curl`로 요청해 모두 `200`을 받았다 — 각각 `feedQueryKey`(피드), `PLAYLISTS_QUERY_KEY`(플레이리스트 목록), `profileQueryKey`/`profileGridQueryKey`(프로필)를 구독하는 화면이다.
- dev 서버 로그를 컴파일 시작부터 세 요청 처리 시점까지 전부 확인했고, `Found 0 errors`(API 타입체크) 외에 컴파일·런타임 에러 로그는 없었다. 과거 배럴 import 정리 후 실제로 재현됐던 "module factory is not available" 류 에러도 발생하지 않았다.
- 로그인이 필요한 화면(게시글 상세 낙관적 갱신, 알림, 검색 무한스크롤, 플레이리스트 상세 편집)은 시드 계정 로그인·OAuth 콜백까지 필요해 이 환경(브라우저 없는 헤드리스 curl 확인)에서는 직접 조작하지 못했다 — 다만 이 부분은 40 suites/225 tests의 유닛/통합 테스트가 각 쿼리키의 `setQueryData`/`invalidateQueries`/낙관적 롤백 시나리오를 이미 커버하고 있고, 이번 변경은 그 로직을 전혀 건드리지 않고 import 경로만 바꿨다.

## Behavior Verification

- **Behavior Invariants(prd.md)**: "쿼리키 배열 값 불변" — `query-keys/*.ts`의 12개 정의를 원본과 diff 비교해 리터럴 값이 한 글자도 바뀌지 않았음을 확인. "staleTime/enabled/refetchInterval 등 쿼리 옵션 불변" — 이동 대상은 오직 `export const xxxQueryKey = ...` 정의 줄이었고, `useQuery`/`useInfiniteQuery`/`useMutation` 호출부의 옵션 객체는 손대지 않음(각 커밋 diff에서 옵션 라인 변경 없음으로 확인). "무효화 호출 시점/위치 불변" — `invalidateQueries`/`setQueryData`/`setQueriesData` 호출부는 import한 키 심볼을 그대로 재사용했을 뿐 호출 자체는 이동하지 않음.
- **회귀 시나리오(adr.md)**: 이 사이클은 순수 이동 리팩터링이라 새 characterization 테스트를 추가하지 않고 기존 40 suites/225 tests를 안전망으로 삼기로 했었다 — 6개 구현 커밋 각각에서 이 스위트가 매번 40/225 그대로 통과했고, 마지막 #215 검증에서도 동일했다.

## Decision Review

- ADR에서 안 2(자체 구현, 도메인 파일+바럴)를 선택하며 예상한 비용은 "도메인 파일 8개+바럴 1개, 소비처 24개 import 경로 수정"이었다. 실제로도 정확히 이 규모로 끝났고, 라이브러리 도입(안 3, `@lukemorales/query-key-factory`) 없이 기존 `constants/`·`hooks/` 도메인 폴더 컨벤션을 그대로 재사용해 새 패턴 학습 비용이 들지 않았다.
- 예상하지 못했던 것: 폴더명 `queryKeys`(camelCase)로 처음 만들었다가 `check-file/folder-naming-convention` ESLint 규칙(`.tsx` 예외가 없는 kebab-case 강제)에 걸려 `query-keys`로 정정한 일이 있었다 — 실제 프로덕션 코드를 쓰기 전 throwaway 파일로 미리 검증해 잡아냈고, 이미 만들어져 있던 GitHub 이슈 8개(#209~#216) 본문의 `queryKeys/` 오타도 `gh issue edit`으로 함께 정정했다. ADR 작성 시점에 저장소의 폴더명 컨벤션을 코드로 직접 검증하지 않고 넘어간 것이 원인이었다.

## Remaining Debt

- `docs/tanstack-query/index.html`의 "Query Key 지도" 표가 이번 사이클 이전부터 `['playlistDetail', playlistId]`(`playlist-detail-caching` #187~#196)와 `['profile', userId]`(`profile-info-caching` #198~#208) 두 캐시를 아예 누락하고 있었다 — 이번 사이클이 만든 문제는 아니지만, 표를 갱신하면서 발견해 표 아래 각주로 남겼다. 두 행을 정식으로 추가하는 것은 이번 사이클의 범위(소유 파일 경로 갱신) 밖이라 별도 문서 보완이 필요하다.
- `docs/refactors/query-key-centralization/brief-original.md`의 "초기 가설" 절에 `src/queryKeys.ts`(단일 파일안, 최종적으로 채택하지 않음)라는 표현이 남아 있다 — 실제 채택안(`query-keys/` 도메인 폴더)과 다른 하나의 예시로 언급된 문맥이라 오타가 아니라 의도적으로 남긴 역사적 기록이다.
- prd.md의 나머지 부채(`usePostReactionOverridesStore`, `useProfileStore` zustand 잔존, `ProfilePostsFeed` N+1)는 이번 사이클의 Out of Scope로 명시했던 항목이라 그대로 남아 있다.

## Follow-ups

- `docs/tanstack-query/index.html` "Query Key 지도" 표에 `['playlistDetail', playlistId]`, `['profile', userId]` 두 행을 추가하는 문서 보완(별도 작은 이슈로 등록 권장).
- `usePostReactionOverridesStore`(백로그 #185), `useProfileStore`(백로그 #178) — 이번 사이클과 무관하게 이미 등록된 별도 리팩터링 후보.
