# ADR — server-state-caching

## 3안 비교

### 안 1 — 최소 개선안 (패치 3건)

새 추상화를 만들지 않고 확인된 증상만 직접 고친다.

- `usePlaylistRecommendations`가 `usePlaylistRefreshStore`의 nonce를 구독하도록 한 줄 추가(다른 두 소비자와 동일한 패턴으로 맞춤).
- `usePostReactions`의 독립 `authMe()` 호출을 제거하고 `useAuthStore`(이미 `AuthBootstrap`이 채워둔 전역 상태)를 구독하도록 변경.
- 게시글상세는 손대지 않는다(패치로 해결할 지점이 마땅치 않음).

### 안 2 — 경계 재설계안 (자체 구현 공용 캐시 유틸)

`apps/web`에 사내 전용 최소 리소스 캐시 primitive를 새로 만든다. 예: `useServerResource<T>(key, fetcher)` — 키별로 in-flight 요청을 공유하고, `invalidate(key)`로 구독자에게 갱신을 알리는 얇은 계층(zustand 기반). 플레이리스트/authMe/게시글상세 3개 훅이 이 primitive로 전환한다.

### 안 3 — 검증된 도구 도입안 (TanStack Query, **채택**)

`@tanstack/react-query`를 도입한다. 3개 데이터 경로를 각각 `queryKey`로 캐싱하고, 변경 지점에서 `invalidateQueries`를 호출해 무효화를 라이브러리가 보장하게 한다.

## 비교표 (10개 고정 기준)

| #   | 기준                 | 안 1                                                           | 안 2                                                                   | 안 3                                                                                                                                                                                                                      |
| --- | -------------------- | -------------------------------------------------------------- | ---------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | 근본 원인 해결력     | 낮음 — 확인된 3곳만 패치, 같은 구조의 재발 방지 장치 없음      | 높음 — 공용 primitive가 무효화 전파를 구조적으로 보장                  | 매우 높음 — 위에 더해 dedup/staleTime/재시도까지 검증된 형태로 보장                                                                                                                                                       |
| 2   | 동작 보존 난이도     | 쉬움(각 패치 1줄 수준)                                         | 중간 — 직접 만든 캐시의 동시성(경쟁 조건) 버그 위험을 직접 검증해야 함 | 중간 — 마이그레이션 필요하나 라이브러리 자체 동작은 이미 검증됨                                                                                                                                                           |
| 3   | 책임·의존성 변화     | 매우 작음                                                      | 중간 — 신규 사내 추상화 계층 추가                                      | 중간~큼 — 전역 `QueryClientProvider` 추가, `usePlaylistRefreshStore` 대체                                                                                                                                                 |
| 4   | 테스트 용이성        | 낮음 — 각 훅을 여전히 개별적으로 테스트                        | 중간 — primitive는 독립 테스트 가능하나 커버리지를 직접 확보해야 함    | 높음 — `QueryClient` mocking, `renderHook`+`QueryClientProvider` 등 커뮤니티에 검증된 테스트 패턴 존재                                                                                                                    |
| 5   | 변경 범위            | 작음(3파일)                                                    | 중간(신규 유틸+3개 훅)                                                 | 중간(신규 의존성 1개+Provider+3개 훅)                                                                                                                                                                                     |
| 6   | 점진적 전환 가능성   | 쉬움(한 번에)                                                  | 가능(훅부터)                                                           | 매우 유연 — Provider 아래에서 훅 단위로 순차 전환 가능, 전환 안 한 훅은 그대로 유지                                                                                                                                       |
| 7   | 롤백 가능성          | 쉬움                                                           | 쉬움(신규 파일 삭제)                                                   | 쉬움 — 이번 범위(3훅)만 되돌리는 건 각 커밋 revert로 충분. Provider 자체 제거는 이후 다른 훅까지 전환됐다면 영향이 커지나, 이번 사이클 종료 시점엔 3훅만 의존하므로 안전                                                  |
| 8   | 성능·운영 영향       | 미미                                                           | 미미(직접 튜닝 필요)                                                   | 초기 번들 +gzip 10.4KB(최소 사용 기준, `useQuery`/`QueryClient`/`QueryClientProvider`만 사용). staleTime/dedup으로 런타임 중복 요청은 오히려 감소                                                                         |
| 9   | 기존 코드와의 일관성 | 매우 높음(기존 패턴 그대로 확장)                               | 중간(새 사내 컨벤션 신설, 다른 개발자가 또 새로 배워야 함)             | 낮음 — 이 저장소에 전례 없는 새 의존성. 다만 `CLAUDE.md`가 이미 "서버 상태와 UI 상태를 같은 종류로 취급하지 말라"고 명시하는데, Query 도입은 그 분리를 zustand 대신 전용 도구로 명확히 하는 방향이라 원칙과는 오히려 부합 |
| 10  | 유지 비용            | 낮음(당장은) — 다만 같은 패턴이 반복되면 패치 비용이 계속 누적 | 높음 — 캐시 로직, 동시성, 재시도 등을 팀이 직접 장기 유지보수          | 낮음 — 커뮤니티(4만+ stars, 활발한 릴리스)가 유지보수. 업그레이드 추적 비용만 발생                                                                                                                                        |

## 라이브러리 도입 심사

- **해결 책임-핵심 추상화 일치**: 진단된 구조 원인(키별 캐시+무효화 전파가 수동 계약)과 TanStack Query의 핵심 추상화(`queryKey` 기반 캐시+`invalidateQueries`)가 정확히 일치한다.
- **버전 호환성**: 최신 `@tanstack/react-query`는 v5.101.x(공식 npm, 확인 시점 기준 20시간 전 배포)이며, React 18+ 를 지원해 React 19.2와 호환된다. Next.js 16 App Router와도 서버 컴포넌트/스트리밍/`HydrationBoundary` 조합이 공식 문서에 정리돼 있다. 다만 이번 사이클은 SSR 하이드레이션 경계가 필요 없다(대상 3개 훅 모두 `'use client'` 컴포넌트 내부에서만 쓰임, `post/[id]/page.tsx`의 서버사이드 fetch는 Out of Scope).
- **SSR/RSC/브라우저 제약**: `app/layout.tsx`는 서버 컴포넌트다. 기존에도 `ToastProvider`(`'use client'`)가 동일하게 `{children}`을 감싸는 패턴을 쓰고 있어(`components/ui/ToastContainer.tsx`), `QueryProvider`도 같은 패턴으로 추가하면 기존 컨벤션과 충돌하지 않는다.
- **React Compiler(`babel-plugin-react-compiler`) 호환성**: 문서만으로는 명시적 사례가 확인되지 않아 불확실성이 남지만, TanStack Query는 `useSyncExternalStore` 기반 표준 훅 패턴을 쓰고 새로운 렌더링 규칙을 요구하지 않는다 — React Compiler와 충돌할 구조적 이유가 없다고 판단했다. 별도 폐기용 spike 대신, 아래 체크포인트 이슈 2(Provider만 추가)에서 즉시 `pnpm dev`로 실동작을 확인해 이 불확실성을 조기에 해소한다(문제가 있으면 이 시점에 최소 비용으로 롤백 가능).
- **최근 릴리스·유지보수 상태**: GitHub 4만+ stars, 활발한 릴리스 주기(최근 배포 20시간 전 확인). TanStack 팀이 지속 관리.
- **라이선스·보안**: MIT 라이선스. 알려진 이슈로 `@tanstack/react-query-next-experimental`(별도 experimental 패키지, 이번 사이클은 사용 안 함)의 XSS 권고(GHSA-997g-27x8-43rf, 2024-01, 5.18.0에서 수정)가 있으나 이번에 쓸 `@tanstack/react-query` 코어 패키지와는 무관하다. 2026-05-11 TanStack 산하 42개 패키지 공급망 침해 사고가 있었으나 영향 목록은 `@tanstack/react-router`/`start` 계열이고 `@tanstack/react-query`/`query-core`는 포함되지 않았다(GHSA-g7cv-rxg3-hmpx 확인). 다만 같은 조직 소속 패키지에서 공급망 사고 전례가 있다는 점은 설치 시 정확한 버전을 확인하고 lockfile을 커밋하는 기존 관행을 그대로 유지하는 근거로만 삼는다(추가 조치 불필요).
- **번들·런타임 비용**: 최소 사용(`useQuery`/`QueryClient`/`QueryClientProvider`/`useQueryClient`) 기준 gzip 약 10.4KB, 전체 API 기준 15.6KB — 사용자가 설정한 허용 한계(수십 KB 단위) 이내.
- **제거 비용**: `queryKey`+`queryFn` 기반 훅은 내부 구현이 캡슐화돼 있어, 각 훅의 반환 타입(`{data, isLoading, error}` 형태)을 유지하는 얇은 wrapper로 감싸면 추후 다른 도구로 교체 시 영향 범위를 훅 내부로 한정할 수 있다.
- **실제로 삭제되는 기존 코드**: `usePlaylistRefreshStore`(전체, nonce+bump), `usePlaylistRecommendations`/`ArchiveView`/`PlaylistPickerModal`의 개별 `useState`+`useEffect` 페칭 블록, `usePostReactions`의 독립 `authMe()` 호출 블록, `usePostDetail`의 `requestIdRef` 기반 취소 로직.

## 의사결정 인터뷰 로그

**Q. 안 2(자체 구현 공용 캐시 유틸)와 안 3(TanStack Query 도입) 중 어느 쪽을 선택할까요?**
A. 안 3 — TanStack Query 도입. 이유: 비교표 기준 1(근본 원인 해결력)·4(테스트 용이성)·10(유지 비용)에서 안 3이 명확히 우세하고, 안 2는 결국 이 기능들(dedup, 재시도, staleTime)을 직접 구현해야 해 동시성 버그를 팀이 직접 떠안게 된다는 점을 근거로 제시함. 번들(gzip ~10.4KB)이 사전에 설정한 한계(수십 KB) 이내이고 React 19/Next 16과 공식 호환됨을 확인한 뒤 결정.

**Q. TanStack Query로 해결되는 것은 "같은 postId를 상세모달과 피드가 중복 요청할 때 캐시를 공유"하는 것이지, `ProfilePostsFeed`가 N개의 서로 다른 postId를 각각 요청하는 N+1 자체(요청 개수)는 줄이지 못합니다(그건 목록 API가 상세를 함께 내려주도록 바꿀 때만 해결되는데, API 계약 변경이라 PRD Out of Scope입니다). 이 현실적인 범위로 Success Criteria를 조정해도 될까요?**
A. 예, 캐시 공유만으로 범위 조정. 이유: N+1 자체 감소는 API 변경이 필요해 이번 사이클(프론트엔드 전용) 범위와 맞지 않음. 캐시 공유만으로도 `ProfilePosts`/`NotiDrawerContent`/`PostCard`(편집) 등 postId만으로 모달을 여는 진입점 전체가 이득을 보므로 이번 사이클의 목표로 충분하다고 판단. API 변경이 가능해지는 시점에 별도 후속 이슈로 다룬다.

## 선택: 안 3

비교표 기준 1·4·10에서 가장 우세하고, 사용자가 인터뷰에서 명시적으로 이 근거들을 들어 안 3을 선택했다. 기준 9(기존 코드 일관성)의 약점(새 의존성)은 감수하되, `CLAUDE.md`의 "서버 상태와 UI 상태를 같은 종류로 취급하지 않는다"는 원칙과는 오히려 더 부합하는 방향으로 해석해 상쇄한다.

## ADR 본문

### Context

`apps/web`은 서버 상태 캐싱 라이브러리 없이 각 화면이 데이터를 개별 페칭하며, 플레이리스트 캐시 불일치가 실제로 재현됐다(`usePlaylistRecommendations`가 `usePlaylistRefreshStore` nonce를 구독하지 않음). 같은 구조적 위험이 authMe(중복 호출), 게시글상세(캐시 미공유)에도 존재한다. 이전 사이클(#125~131)이 근거 부족으로 도입을 보류하며 백로그(#124/#43)로 이관했던 결정을, 이번에 쌓인 반복 사례를 근거로 재검토한다.

**추가로 확인된 사실(구현 설계 중 발견, PRD 이후 보강)**:

- `useAuthMe`는 오직 `AuthBootstrap`에서만 호출된다. PRD에서 "3개 소스"로 표현했던 것 중 `useAuthStore`는 `useAuthMe`의 파생 상태를 담는 저장소일 뿐 별도 네트워크 호출을 만들지 않는다. 실제 독립 네트워크 호출 지점은 `AuthBootstrap`(앱 마운트 시 1회)과 `usePostReactions`(게시글 상세가 열릴 때마다) 2곳이다 — 다만 후자가 반복 호출되므로 세션 내 총 호출 횟수는 여전히 여러 번이라 통합 근거는 그대로 유효하다.
- `usePlaylistRefreshStore`의 실제 소비자는 `ArchiveView`, `ArchiveViewHeader`, `PlaylistDetailModal` 3곳이고 `PlaylistPickerModal`은 이 스토어를 아예 구독하지 않는다 — 다만 `PlaylistPickerModal`은 모달이라 열릴 때마다 새로 마운트되어 우연히 매번 최신 데이터를 받는다. 반대로 `usePlaylistRecommendations`는 상시 마운트된 화면 위젯이라 "마운트 시점 = 최신 데이터"라는 암묵적 전제가 깨지는 지점이었다 — 이것이 왜 하필 이 훅에서만 버그가 재현됐는지의 원인이다. `queryKey` 기반 캐시는 컴포넌트 마운트 여부와 무관하게 항상 최신 상태를 보장하므로 이 취약한 암묵적 전제 자체를 없앤다.
- `usePostDetail`은 이미 `passedPost`가 주어지면 fetch를 건너뛰는 자체 최적화가 있다(`FeedList`/`FeedView`만 `post`를 함께 넘김). 반면 `ProfilePosts.tsx`, `NotiDrawerContent.tsx`, `PostCard.tsx`(편집)는 `postId`만 넘겨 항상 재요청한다. `queryKey: ['postDetail', postId]` 기반 캐시는 이 4개 진입점 전부에서 동일 postId 재요청 시 캐시를 공유하게 만들어, 기존 `passedPost`의 임시방편적 prop-threading 최적화를 구조적으로 대체한다.

### Decision

1. `@tanstack/react-query`(v5, 확인 시점 5.101.x) 설치. `apps/web/src/components/providers/QueryProvider.tsx`(`'use client'`)를 `ToastProvider`와 동일한 패턴으로 신설하고 `app/layout.tsx`에서 `{children}`을 감싼다. 브라우저에서는 모듈 스코프 싱글턴 `QueryClient`를 사용한다(서버 컴포넌트에서 쓰지 않으므로 요청별 팩토리 불필요).
2. **플레이리스트**: `usePlaylists()` 공용 훅 신설(`queryKey: ['playlists']`, `queryFn: getAllPlaylists`). `usePlaylistRecommendations`/`ArchiveView`/`PlaylistPickerModal` 3곳이 이 훅으로 전환. 플레이리스트를 변경하는 지점(현재 `bumpPlaylistRefresh` 호출부: `ArchiveView`, `ArchiveViewHeader`, `PlaylistDetailModal`)은 `queryClient.invalidateQueries({ queryKey: ['playlists'] })` 호출로 교체. `usePlaylistRefreshStore` 삭제.
3. **authMe**: `useAuthMe`를 `useQuery({ queryKey: ['authMe'], queryFn: authMe })` 기반으로 재작성하되 반환 타입(`AuthMeState`)은 그대로 유지해 `AuthBootstrap`의 변경을 최소화한다. `usePostReactions`의 독립 `authMe()` 호출은 제거하고 같은 쿼리 캐시를 재사용(`useQuery(['authMe'], authMe, { enabled })`)하도록 전환 — `staleTime`을 짧게라도 두면 `AuthBootstrap`이 이미 채운 캐시를 히트해 중복 네트워크 호출이 사라진다.
4. **게시글상세**: `usePostDetail`을 `useQuery({ queryKey: ['postDetail', postId], queryFn: () => getPostDetail(postId) })` 기반으로 재작성하되, `passedPost`가 있으면 `initialData`로 시딩해 기존 skip-fetch 동작과 동등한 결과(첫 렌더부터 데이터 있음, 네트워크 호출 없음)를 유지한다. `ProfilePostsFeed`의 N+1 루프(`previews.map(p => getPostDetail(p.postId))`)도 각 아이템이 동일 `queryKey` 규칙을 쓰도록 전환해, 이후 같은 postId로 모달이 열릴 때 캐시가 공유되게 한다. **N+1 자체(서로 다른 postId N개 각각 요청)의 요청 개수는 줄이지 않는다** — 인터뷰에서 확정한 조정된 Success Criteria.

### Alternatives

- 안 1(최소 개선안): 확인된 3곳만 패치해 근본 원인(무효화 전파가 수동 계약)이 남아 재발 위험이 그대로다. 특히 authMe/게시글상세는 패치로 해결할 뚜렷한 지점이 없어 Success Criteria 3개 중 1개(플레이리스트)만 충족.
- 안 2(자체 구현): 새 의존성은 피하지만, dedup/재시도/staleTime 같은 캐시 기능을 직접 구현·검증·유지보수해야 해 장기 비용이 더 크다고 판단해 기각.

### Consequences

- 장점: 무효화 전파가 라이브러리에 의해 구조적으로 보장되어 `usePlaylistRecommendations` 같은 누락이 재발하기 어렵다. 서버 상태(Query)와 UI 상태(zustand)의 책임이 명확히 분리된다. 게시글상세의 여러 진입점이 `passedPost` prop-threading 없이도 캐시를 공유한다.
- 단점: 새 의존성이 하나 늘고, 팀(현재는 1인)이 TanStack Query의 캐시 무효화·staleTime 개념을 새로 익혀야 한다.
- 새 위험: `useQuery`의 `queryKey` 설계를 잘못하면(예: postId를 키에서 빠뜨림) 캐시가 서로 다른 게시글 데이터를 섞어 보여줄 수 있다 — 각 체크포인트 이슈에서 키 설계를 명시하고 테스트로 검증한다. React Compiler와의 상호작용은 이슈 2(Provider 도입)에서 조기 확인한다.

### Migration

1. 이슈 1 — 플레이리스트/authMe/게시글상세 대상 특성화·계약 테스트 추가(재현된 버그를 의도적으로 실패하는 회귀 테스트로 먼저 고정).
2. 이슈 2 — `QueryClientProvider` 도입(아직 어떤 훅도 전환 안 함, React Compiler 호환성 조기 확인).
3. 이슈 3 — 플레이리스트 3곳 전환 + `usePlaylistRefreshStore` 제거.
4. 이슈 4 — authMe 통합.
5. 이슈 5 — 게시글상세 통합(`passedPost` → `initialData` 대체).
6. 이슈 6 — 결과 검증 및 문서화.

### Rollback

각 이슈는 독립 커밋이다. 이슈 2(Provider만 추가)까지 진행한 뒤 React Compiler 호환성 문제나 예상 못한 회귀가 발견되면, 이슈 2만 revert하면 신규 의존성과 Provider가 통째로 제거되어 이전 상태로 완전히 복귀한다(이슈 3~5의 어떤 훅도 아직 연결되지 않았으므로 영향 없음). 이슈 3~5는 각각 대상 데이터 하나씩만 건드리므로, 특정 데이터에서 문제가 생기면 그 이슈만 revert하고 나머지는 유지할 수 있다(예: 게시글상세 전환에서 문제가 생겨도 플레이리스트/authMe 전환은 그대로 유지 가능).

## 회귀 안전망

### 테스트 우선순위

1. **Characterization/Contract** — 플레이리스트 3곳의 현재 fetch 동작, authMe 호출 횟수, 게시글상세 재요청 여부를 먼저 테스트로 고정한다. 단, 플레이리스트의 "무효화 미반영" 자체는 **의도적으로 실패하는 회귀 테스트**로 추가한다(현재 버그이므로 특성화가 아니라 목표 동작을 미리 코드화한 것 — 안 3 적용 후 통과로 뒤집힘).
2. **State-transition** — `useQuery`의 `isLoading → success/error` 전이, `invalidateQueries` 호출 후 관련 쿼리의 재조회 전이.
3. **Integration** — 세 데이터 경로 전환 후 관련 기존 컴포넌트 테스트(`ArchiveView`, `PlaylistPickerModal`, `PostCardDetailModal` 등) 전부 통과.
4. **E2E** — PRD에 명시하지 않음, Out of Scope.

### 회귀 시나리오

| 시나리오                                     | 기존 결과                                             | 검증 수준                            | 실패 시 조치 |
| -------------------------------------------- | ----------------------------------------------------- | ------------------------------------ | ------------ |
| 플레이리스트 변경 후 다른 화면 반영          | (버그) 반영 안 됨 → (목표) 자동 반영                  | Contract(의도적 선실패 후 후속 통과) | 구현 중단    |
| authMe 호출 횟수(게시글 상세 반복 진입)      | 진입마다 네트워크 호출                                | State-transition                     | 구현 중단    |
| 게시글상세 캐시 공유(같은 postId, 모달↔피드) | 독립 재요청 → 캐시 히트                               | Contract                             | 구현 중단    |
| authMe 401 응답                              | `internal/client.ts`의 좁은 범위 로그아웃+모달 재오픈 | Integration                          | 구현 중단    |
| `usePlaylistRecommendations` 외부 API 실패   | `MOCK_PLAYLIST_BRIEFS` 폴백                           | Integration                          | 구현 중단    |
| 네트워크 실패(공통)                          | 기존 에러 UI/문구                                     | Integration                          | 구현 중단    |

## 체크포인트 이슈 목록

### 이슈 1 — 플레이리스트/authMe/게시글상세 특성화·계약 테스트 추가

# 목적

리팩터링 대상 3개 데이터 경로의 현재 동작(버그 포함)을 테스트로 고정해 안전망을 확보한다.

## Scope

- `usePlaylistRecommendations`/`ArchiveView`/`PlaylistPickerModal` fetch 동작 테스트
- `usePostReactions`/`AuthBootstrap` authMe 호출 횟수 계약 테스트
- `usePostDetail`(`ProfilePosts`/`NotiDrawerContent`/`PostCard` 진입 경로) 재요청 여부 계약 테스트

## Out of Scope

- 구조 변경 없음(테스트만 추가)

## Behavior Invariants

- prd.md의 Behavior Invariants 전체

## Acceptance Criteria

- [ ] 플레이리스트 변경 후 `usePlaylistRecommendations` 캐시가 갱신되지 않는 현재 버그를 재현하는 테스트가 추가되고, 지금 시점에는 실패로 기록된다(의도된 상태)
- [ ] `AuthBootstrap` 마운트 + `usePostReactions` 활성화 시 `authMe` 네트워크 호출이 2회(독립) 발생함을 계약 테스트로 고정
- [ ] `ProfilePosts`/`NotiDrawerContent`/`PostCard`(편집)가 이미 다른 곳에서 페칭된 postId를 postId만으로 열 때 항상 재요청함을 계약 테스트로 고정

## Verification

- [ ] `pnpm test`, `pnpm lint`, `pnpm check-types`

## Rollback

- 테스트 추가만이므로 삭제만으로 되돌릴 수 있다.

## Dependency

- 없음(선행 이슈)

---

### 이슈 2 — `QueryClientProvider` 도입

# 목적

TanStack Query를 위한 최소 seam을 도입하고, React Compiler와의 상호작용을 조기에 실동작으로 확인한다.

## Scope

- `@tanstack/react-query` 설치
- `apps/web/src/components/providers/QueryProvider.tsx` 신설(`ToastProvider`와 동일 패턴)
- `app/layout.tsx`에서 `{children}`을 `QueryProvider`로 감싸기

## Out of Scope

- 어떤 훅도 아직 `useQuery`로 전환하지 않음

## Behavior Invariants

- 기존 모든 화면의 동작이 변경 없이 유지된다(Provider 추가만이므로)

## Acceptance Criteria

- [ ] `pnpm dev`로 앱을 기동해 기존 화면 전체가 컴파일·런타임 에러 없이 정상 동작함을 확인
- [ ] React Compiler 관련 경고/에러가 콘솔·빌드 로그에 없음을 확인

## Verification

- [ ] `pnpm dev`(직접 조작 확인), `pnpm lint`, `pnpm check-types`, `pnpm build`

## Rollback

- 신규 파일 삭제 + `layout.tsx`의 wrap 한 줄만 되돌리면 완전히 이전 상태로 복귀.

## Dependency

- 선행: 이슈 1

---

### 이슈 3 — 플레이리스트 3곳을 `useQuery`로 전환 + `usePlaylistRefreshStore` 제거

# 목적

재현된 버그(무효화 미반영)를 구조적으로 해결하고, 무효화가 컴포넌트 마운트 시점에 우연히 의존하지 않게 한다.

## Scope

- `usePlaylists()` 공용 훅 신설(`queryKey: ['playlists']`)
- `usePlaylistRecommendations`/`ArchiveView`/`PlaylistPickerModal`이 이 훅으로 전환
- `bumpPlaylistRefresh` 호출부(`ArchiveView`, `ArchiveViewHeader`, `PlaylistDetailModal`)를 `queryClient.invalidateQueries({queryKey:['playlists']})`로 교체
- `usePlaylistRefreshStore` 삭제

## Out of Scope

- authMe, 게시글상세 전환은 다음 이슈

## Behavior Invariants

- `usePlaylistRecommendations`의 외부 API 실패 시 `MOCK_PLAYLIST_BRIEFS` 폴백 동작 유지
- 기존 로딩/에러 UI 표시 유지

## Acceptance Criteria

- [ ] 이슈 1에서 추가한 "재현된 버그" 테스트가 통과로 전환됨
- [ ] 세 화면 모두 기존 테스트 통과
- [ ] `pnpm dev`로 플레이리스트 생성/수정 후 세 화면 모두 자동 반영되는지 직접 확인

## Verification

- [ ] `pnpm test`, `pnpm lint`, `pnpm check-types`, `pnpm build`

## Rollback

- 이 이슈만 revert하면 이슈 2 시점(Provider만 존재, 훅은 미전환)으로 복귀.

## Dependency

- 선행: 이슈 2

---

### 이슈 4 — authMe를 `useQuery`로 통합

# 목적

`AuthBootstrap`과 `usePostReactions`가 같은 캐시를 공유해, 게시글 상세를 열 때마다 발생하던 중복 `authMe` 네트워크 호출을 없앤다.

## Scope

- `useAuthMe`를 `useQuery({queryKey:['authMe'], queryFn: authMe})` 기반으로 재작성(반환 타입 `AuthMeState` 유지)
- `usePostReactions`의 독립 `authMe()` 호출 제거, 같은 쿼리 캐시 재사용으로 전환

## Out of Scope

- `useAuthStore`의 구조 자체는 변경하지 않음(`AuthBootstrap`이 여전히 채움)

## Behavior Invariants

- `internal/client.ts`의 401 좁은 범위 처리(로그아웃+로그인모달 재오픈)는 변경 없음

## Acceptance Criteria

- [ ] 이슈 1의 계약 테스트(authMe 호출 횟수)가 통과로 전환됨
- [ ] `pnpm dev`로 로그인 상태에서 게시글 상세를 여러 번 열어도 `authMe` 네트워크 요청이 추가로 발생하지 않음을 확인(devtools Network 탭)

## Verification

- [ ] `pnpm test`, `pnpm lint`, `pnpm check-types`

## Rollback

- 이 이슈만 revert하면 authMe가 다시 두 곳에서 독립 호출되는 이전 상태로 복귀(플레이리스트 전환은 영향 없음).

## Dependency

- 선행: 이슈 2 (이슈 3과 독립적으로 진행 가능)

---

### 이슈 5 — 게시글상세를 `useQuery`로 통합

# 목적

`passedPost` prop-threading에 의존하던 기존 skip-fetch 최적화를, postId 기반 쿼리 캐시로 대체해 `ProfilePosts`/`NotiDrawerContent`/`PostCard`(편집) 등 모든 진입점에서 동일 postId 캐시를 공유하게 한다.

## Scope

- `usePostDetail`을 `useQuery({queryKey:['postDetail', postId], queryFn: () => getPostDetail(postId)})` 기반으로 재작성, `passedPost` 있으면 `initialData`로 시딩
- `ProfilePostsFeed`의 N+1 루프도 동일 `queryKey` 규칙을 쓰도록 전환(요청 개수 자체는 유지, 범위 확정됨)

## Out of Scope

- N+1(서로 다른 postId N개 각각 요청) 자체의 요청 개수 감소 — API 변경 필요, 후속 이슈

## Behavior Invariants

- prd.md의 Behavior Invariants 전체(특히 편집/좋아요 등 상세모달 동작)

## Acceptance Criteria

- [ ] `passedPost`가 있을 때 첫 렌더부터 데이터가 즉시 표시되고 네트워크 호출이 없는 기존 동작 유지
- [ ] 이슈 1의 계약 테스트 중 "이미 캐시된 postId" 케이스가 통과로 전환됨
- [ ] `pnpm dev`로 프로필 피드에서 게시글을 연 뒤 같은 게시글을 알림/편집 등 다른 경로로 다시 열 때 중복 네트워크 호출이 없는지 확인

## Verification

- [ ] `pnpm test`, `pnpm lint`, `pnpm check-types`, `pnpm build`

## Rollback

- 이 이슈만 revert하면 게시글상세가 기존 `passedPost`/`requestIdRef` 방식으로 복귀(플레이리스트/authMe 전환은 영향 없음).

## Dependency

- 선행: 이슈 2 (이슈 3·4와 독립적으로 진행 가능)

---

### 이슈 6 — 결과 검증 및 문서화

# 목적

전후 비교와 개발환경 실동작 확인을 기록하고 사이클을 종료한다.

## Scope

- `docs/refactors/server-state-caching/result.md` 작성
- N+1 감소(API 변경 필요), 알림/댓글 폴링 및 낙관적갱신+롤백 통합(Out of Scope로 미룬 항목) 후속 이슈 등록

## Out of Scope

- 새로운 코드 변경 없음(문서만)

## Behavior Invariants

- 해당 없음

## Acceptance Criteria

- [ ] Before/After, 개발환경 실동작 확인, Behavior Verification, Decision Review, Remaining Debt 기록
- [ ] 후속 이슈(N+1 API 변경, 폴링/낙관적갱신 통합) 등록

## Verification

- [ ] `pnpm lint`/`check-types`/`test`/`build` 최종 재확인

## Rollback

- 문서만 변경되므로 해당 없음

## Dependency

- 선행: 이슈 3, 4, 5 전부

---

**[GATE 2]** 위 대안 비교, 인터뷰 로그, ADR, 회귀 안전망, 이슈 분해를 확인해주시면 이슈를 생성하고 구현으로 넘어가겠습니다.
