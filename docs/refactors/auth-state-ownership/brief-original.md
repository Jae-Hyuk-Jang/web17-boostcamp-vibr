# 문제 영역

## 관찰한 증상

- `stores/useAuthStore.ts`(`userId`/`isAuthenticated`/`isLoading`)가 100% `useAuthMeQuery`의 파생 상태다. `AuthBootstrap.tsx`가 `useAuthMe()` 결과를 `useEffect`로 매 렌더 스토어에 복사해 넣는 구조이고, 스토어 자체가 별도의 진실을 갖고 있지 않다.
- `useAuthStore.getState()`로 컴포넌트 밖(비-훅 컨텍스트)에서 동기 접근하는 소비처가 0개이다(전수 grep 확인) — 모든 소비처가 이미 리액티브 훅 형태로만 쓴다.
- 반면 `hooks/auth/client/logout.ts`와 `api/internal/client.ts`(401 핸들러)는 컴포넌트 밖에서 zustand의 동기 `getState()` API를 쓴다(예: `useSpotifyAuthStore.getState().clear()`).

## 실제 사례

- `userId` 소비처 26+개 파일, `isAuthenticated` 21+개, `isLoading` 23+개(전수 grep 기준) — 모두 이미 리액티브 구독 형태로 쓰고 있어, 이론상 `useAuthMeQuery()`를 직접 구독해도 TanStack Query의 캐싱/dedup 덕분에 동일하게 동작할 가능성이 높다.
- `components/providers/QueryProvider.tsx`의 `queryClient`가 모듈 내부 `const`로만 있고 export되지 않아, 훅 밖(`logout.ts`, `client.ts`)에서 캐시 조작이 불가능하다.

## 초기 가설

- 이 인다이렉션이 필요해서 남은 게 아니라, 초기에 zustand로 구현해둔 것을 나중에 TanStack Query로 교체하면서 다 지우지 못한 결과로 보임(가설, 검증 필요).

## 기대 효과

- 새 인증 관련 컴포넌트가 `useAuthMeQuery`/`useAuthMe`만 알면 되고, 별도의 미러 스토어 동기화 규칙을 이해할 필요가 없어짐.
- 로그아웃/401 흐름이 "여러 zustand 액션 호출"에서 "쿼리 캐시 초기화" 하나로 단순화될 가능성.

## 제약

- 마이그레이션 범위가 크다(26+/21+/23+ 파일) — 한 번에 다 바꿔야 하는지, 점진적 전환이 필요한지 PRD 단계에서 판단 필요.
- 로그인/로그아웃/401 동작 자체(사용자 체감 동작)는 절대 바뀌면 안 됨.
