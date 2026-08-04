# PRD — auth-state-ownership

## 문제 정의

`stores/useAuthStore.ts`(`userId`/`isAuthenticated`/`isLoading`)는 `useAuthMeQuery`(TanStack Query)의 파생 상태를 `AuthBootstrap.tsx`가 `useEffect`로 매 렌더 복사해 넣는 미러 스토어다 — 스토어 자체는 별도의 진실을 갖지 않는다. `query-client-policy`(#220~#222) 사이클 이후 zustand 스토어 전수 재조사에서 발견됐고, 같은 조사에서 이미 죽어있던 `useSpotifyPlayerStore`와 `useAuthStore.clearAuth`는 PR #232로 먼저 제거했다. 이 PRD는 그 조사에서 "더 큰 결정이 필요하다"고 남겨뒀던 `useAuthStore` 자체의 제거를 다룬다(백로그 #231).

## 비판적 진단 (시니어 개발자 시각)

### 근거

- **[Fact]** `hooks/auth/client/AuthBootstrap.tsx`가 `useAuthMe()`(`useAuthMeQuery`를 감싼 파생 훅)의 결과를 `useEffect`로 `useAuthStore.setAuth`/`setLoading`에 그대로 복사한다. 스토어가 쿼리와 별개로 갖는 상태는 없다.
- **[Fact]** `useAuthStore.getState()`로 컴포넌트 밖(비-훅 컨텍스트)에서 동기 접근하는 소비처는 전체 코드베이스에서 0곳이다(전수 grep). 모든 소비처가 `useAuthStore((s) => s.X)` 리액티브 훅 형태로만 쓴다 — zustand를 쓰는 이유(컴포넌트 밖 동기 접근) 자체가 이 스토어에는 적용되지 않는다.
- **[Fact, PRD 작성 중 재확인·수정]** 이슈 #231 본문에 적었던 "userId 26+/isAuthenticated 21+/isLoading 23+ 파일"은 필드 **이름**을 전체 코드베이스에서 텍스트로 검색한 결과였다(다른 도메인의 동명 prop/변수까지 섞임). `useAuthStore(` 호출부만 정확히 센 실제 소비처는 **15개 파일**이다: `ProfileView.tsx`, `useNotifications.ts`, `RightPanel.tsx`, `usePostDetailModal.ts`, `AuthBootstrap.tsx`(작성자), `useContentWrite.ts`, `PrivacyConsentGate.tsx`, `MobileBottomNav.tsx`, `UserListModal.tsx`, `Sidebar.tsx`, `PostCard.tsx`, `QueueList.tsx`, `NowPlaying.tsx`, `MiniPlayerBar.tsx`, `SearchDrawerContent.tsx`. 이슈 등록 시점의 손쉬운 grep이 실제보다 마이그레이션 범위를 훨씬 크게 보이게 만들었다 — 다시 세지 않았다면 필요 이상으로 큰 사이클로 계획할 뻔했다.
- **[Fact]** 15곳 전부 `userId`/`isAuthenticated`/`isLoading` 중 하나 이상을 단순 selector로 읽기만 한다(파생 로직 없음). `useAuthMe()`가 이미 정확히 이 세 값(`{ userId, isAuthenticated, isLoading }`)을 반환하는 훅으로 존재한다 — 새로 만들 게 없고 그대로 1:1 치환 가능하다.
- **[Fact]** 로그인(`AuthLoginQueryHandler.tsx`)과 로그아웃(`hooks/auth/client/logout.ts`) 모두 상태 전이의 마지막 단계가 `window.location.assign('/')`(전체 페이지 리로드)다 — 로그인 쪽 주석에 "hash 재처리/상태 꼬임 방지를 위해 리로드로 인증 상태를 재평가"라고 명시돼 있다. 즉 이 저장소는 인증 상태 전이를 SPA 네비게이션이 아니라 **항상 리로드로 처리**하도록 이미 설계돼 있다 — `QueryClient` 캐시를 포함한 JS 힙 전체가 리로드로 초기화되므로, 로그아웃 시 쿼리 캐시를 수동으로 지우는 코드가 필요 없다.
- **[Fact]** `api/internal/client.ts`의 401(세션 만료) 핸들러는 리로드 없이 인앱에서 처리되는 유일한 경로다. 하지만 이 핸들러가 가로채는 요청은 `authMe`(`/user/me`) 자체이므로, 그 요청이 401로 실패하는 순간 `useAuthMeQuery`의 `isError`가 곧바로 `true`가 된다 — 지금도 `AuthBootstrap`이 이 `isError`를 그대로 미러링해 `isAuthenticated: false`를 반영하는 구조다. 스토어를 없애고 소비처가 `useAuthMeQuery`(`useAuthMe`)를 직접 구독해도 **같은 매커니즘으로 자동 반영된다** — 별도의 `queryClient.removeQueries` 같은 캐시 무효화 코드를 새로 추가할 필요가 없다(이슈 #231 본문에 "queryClient를 export해야 한다"고 적어뒀던 건 재조사 결과 근거가 약한 추정이었다 — 수정).
- **[Fact]** `hooks/auth/client/`에는 barrel(`index.ts`)이 없다 — `AuthBootstrap`/`useAuthMe` 등이 전부 파일 경로로 직접 import된다. CLAUDE.md의 배럴 컨벤션과 어긋나 있었다(이번 사이클과 별개로 존재하던 기존 상태).

### 증상 → 원인 체인

**증상**: 인증 상태를 읽는 컴포넌트가 "이 값은 `useAuthMeQuery`가 원본이고 `useAuthStore`는 거울이다"라는 사실을 몰라도 되긴 하지만, 대신 "왜 두 계층이 있는지"를 아무도 설명할 수 없는 상태로 15곳에 퍼져 있다.
→ (왜?) `query-key-centralization`/`query-client-policy` 이전, TanStack Query 도입 초기 사이클(`server-state-caching` #148 등)에서 서버 상태를 스토어로 옮기는 작업이 점진적으로 진행되면서 인증 쪽은 "쿼리로 옮기되 기존 zustand 소비처와의 호환을 위해 미러를 유지"하는 중간 단계에서 멈춘 것으로 보인다(Inference — 관련 사이클 문서에 인증 상태를 최종적으로 어떻게 할지에 대한 명시적 결정이 없음).
→ **구조 원인**: "쿼리 → 스토어 미러"라는 중간 단계가 마이그레이션 완료 표시 없이 최종 상태처럼 굳어졌다.

### 아키텍처 관점

- 이 패턴(쿼리를 스토어로 미러링)은 인증에만 있다 — 다른 도메인(`useProfile`, `usePlaylistDetail` 등)은 전부 `useQuery`를 직접 구독하는 표준 패턴을 쓴다. 즉 인증 상태 관리가 저장소의 나머지 부분과 다른 예외적인 경로를 타고 있다.
- `CLAUDE.md`의 zustand 사용 원칙("전역 UI 상태/인증 상태/이벤트성 신호에만 사용")은 `useAuthStore`를 "인증 상태"로 분류해 정당화하지만, 실제로는 "인증 상태의 파생 캐시"이지 "전역 UI 상태" 자체가 아니다 — 원칙의 문구를 근거로 삼기엔 이 스토어의 실제 역할과 안 맞는다.
- "당시엔 맞았지만 전제가 깨진" 결정이라기보다, 마이그레이션이 끝까지 완료되지 않고 멈춘 경우에 가깝다.

### 비판적 재검토 (사용자 문제 제기에 대한 반박 질문과 답)

- **이 증상이 정말 구조 문제인가, 우연인가?** — 15곳 전부가 예외 없이 단순 selector라는 점, 그리고 `useAuthMe()`가 이미 정확히 같은 반환 타입으로 존재한다는 점에서 "옮기다 만 것"이라는 해석에 더 힘이 실린다(Inference). 우연한 버그가 아니라 마이그레이션 완료 여부를 아무도 확인하지 않은 프로세스 공백이다.
- **지금 안 고치면 다음 몇 번의 변경에서 무슨 비용이 드는가?** — 새 인증 관련 화면을 추가할 때마다 "스토어를 쓸지 쿼리를 직접 쓸지" 판단해야 하고, 둘 다 정답처럼 보여서 계속 새 소비처가 스토어 쪽에 쌓일 수 있다(이미 15곳). `AuthBootstrap`이라는 매 렌더 `useEffect` 동기화 계층이 있다는 것 자체가 "쿼리 결과와 스토어 값이 한 틱 어긋날 수 있는" 잠재적 레이스의 여지를 만든다(Hypothesis — 실제 버그가 보고된 적은 없음, 구조적 위험만 있음).
- **더 급한 다른 문제를 가리는 건 아닌가?** — 재조사로 마이그레이션 범위가 예상(26+/21+/23+)보다 훨씬 작다는 게(15개) 확인됐고, 로그인/로그아웃이 이미 리로드 기반이라 캐시 무효화 설계도 새로 필요 없다는 게 확인됐다 — 즉 이번 사이클은 원래 우려했던 것보다 훨씬 작고 리스크가 낮다. 더 급한 일을 가릴 만큼 큰 사이클이 아니라고 판단한다.

## 목표와 범위

### Goal

`useAuthStore`를 삭제하고 15개 소비처가 `useAuthMe()`를 직접 구독하도록 전환해, "쿼리가 원본이고 스토어가 거울"이라는 불필요한 인다이렉션과 `AuthBootstrap`의 매 렌더 동기화 `useEffect`를 없앤다.

### Success Criteria

- `stores/useAuthStore.ts`, `hooks/auth/client/AuthBootstrap.tsx`(및 `app/layout.tsx`의 마운트)가 삭제된다.
- 기존 15개 소비처 전부가 `useAuthMe()`(barrel: `hooks/auth/client/index.ts` 신설)로 전환되고, 각 컴포넌트가 읽던 필드(`userId`/`isAuthenticated`/`isLoading`)와 그 의미는 바뀌지 않는다.
- 로그인/로그아웃/401 세션 만료 흐름의 사용자 체감 동작(리다이렉트, 모달, 리로드 시점)이 전혀 바뀌지 않는다.
- `pnpm lint`/`check-types`/`test`/`build`가 베이스라인과 동일하게 통과한다.
- `pnpm dev` 실동작으로 로그인 상태/비로그인 상태 양쪽에서 기존 소비처 15곳 중 대표 화면(사이드바, 하단 네비, NowPlaying)이 정상 렌더됨을 확인한다.

### Out of Scope

- `useSpotifyAuthStore`(및 미완성으로 보이는 Spotify 직접 API 연동 전체)를 어떻게 할지 — 별도 조사·결정 필요, 이번 사이클과 무관.
- `AuthLoginQueryHandler.tsx`/`SpotifyTokenFromHash.tsx`의 구조 변경 — 둘 다 `useModalStore`/`useSpotifyAuthStore`만 쓰고 `useAuthStore`와 무관해 그대로 둔다.
- `hooks/auth/server/*`(OAuth PKCE 서버 사이드 헬퍼) — 클라이언트 상태 관리와 무관.
- 인증 상태의 캐싱 정책(`AUTH_ME_STALE_TIME_MS` 등) 자체를 바꾸는 것 — `query-client-policy`(#220~#222)에서 이미 결정된 값을 그대로 둔다.

## Behavior Invariants

- 로그인 성공 시 리다이렉트/리로드 시점과 이후 화면 전환은 바뀌지 않는다.
- 로그아웃 시 `sessionStorage` 토큰 제거 → 각 스토어 정리 → `window.location.assign('/')` 순서와 시점은 바뀌지 않는다(단, `useAuthStore` 관련 정리 코드는 애초에 없었으므로 이 흐름 자체에 변경 없음).
- `/user/me` 401 시 로그인 모달이 뜨는 동작과 그 판정 조건(`isAuthMeRequest`, `authSig` 비교, `isHandling401` 가드)은 바뀌지 않는다.
- `AUTH_ME_STALE_TIME_MS`(5분), `useAuthMeQuery`의 `retry: false` 등 쿼리 옵션은 바뀌지 않는다.
- 15개 소비처 각각이 렌더링하는 화면 결과(로그인/비로그인/로딩 상태별 UI)는 필드 값이 동일한 한 바뀌지 않는다.

## 기준선 검증

| 명령               | 결과 | 실패 항목 | 비고                      |
| ------------------ | ---- | --------- | ------------------------- |
| `pnpm lint`        | 성공 | 없음      | 4개 패키지 전부 통과      |
| `pnpm check-types` | 성공 | 없음      | 3개 패키지 전부 통과      |
| `pnpm test` (api)  | 성공 | 없음      | 8 suites / 37 tests       |
| `pnpm test` (web)  | 성공 | 없음      | 40 suites / 226 tests     |
| `pnpm build`       | 성공 | 없음      | web 14개 라우트 정상 생성 |

측정 가능 지표: 변경 영향 파일은 소비처 15곳 + `AuthBootstrap.tsx`/`useAuthStore.ts` 삭제 + `app/layout.tsx` 마운트 제거 + 신규 barrel(`hooks/auth/client/index.ts`) 1개 = 약 18개 파일로 예상. `AuthBootstrap.test.tsx`도 함께 삭제 또는 갱신 필요.

### 목표 인터뷰에서 확정된 결정

- **마이그레이션 범위**: "한 번에 전체 전환" vs "2단계로 분할" 중 사용자가 **"한 번에 전체 전환"**을 선택했다(추천안과 일치). 근거: 재조사로 확인된 15개 소비처가 전부 동일한 단순 selector 패턴이라 중간 상태(스토어+쿼리 공존)를 만들 실익이 없다.
- **훅 이름**: "`useAuthMe` 그대로 유지" vs "`useAuth`로 승격" 중 사용자가 **"`useAuthMe` 그대로 유지"**를 선택했다(추천안과 일치). 근거: 이미 쓰이는 이름이라 불필요한 rename 범위를 늘리지 않는다.

---

**[GATE 1]** 위 진단·목표·범위·Behavior Invariants·기준선을 확인해주시면 다음 단계로 넘어가겠습니다.
