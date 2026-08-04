# 문제 영역

## 관찰한 증상

- `components/providers/QueryProvider.tsx`의 `new QueryClient()`가 인자 없이 생성됨 — 전역 `defaultOptions` 없음.
- `staleTime`을 명시하지 않은 쿼리(`commentsQueryKey`, `feedQueryKey`, `PLAYLISTS_QUERY_KEY`, `useInfiniteQuery` 5곳 전부)가 라이브러리 기본값(`staleTime: 0`, `retry: 3`)을 암묵적으로 사용.
- `QueryCache`/`MutationCache` 레벨의 전역 에러 핸들러가 없어 에러 처리가 훅/컴포넌트마다 제각각(toast/console.error/무시 혼재).

## 실제 사례

- `followMutation`(`ProfileActionButton.tsx`)의 `onError`는 `toast.error(...)` 호출.
- `changeOrderMutation`/`addSongMutation`/`renameMutation`/`deleteMutation`(`PlaylistDetailModal.tsx`)의 `onError`는 `console.error`만 하고 사용자에게 보이는 피드백이 없음(코드 확인, 실제 화면 동작은 PRD 단계에서 재확인 필요).
- 명시적으로 `staleTime`을 설정한 4개 쿼리(`PROFILE`/`PLAYLIST_DETAIL`/`POST_DETAIL`=60초, `AUTH_ME`=5분)는 각 훅 파일에 개별 상수로 흩어져 있음.

## 초기 가설

- 각 훅이 도입 시점마다 독립적으로 `staleTime`/에러 처리를 정하다 보니 전역 정책 없이 파편화됐다 (가설, 검증 필요).
- `QueryProvider.tsx`가 최초 도입(server-state-caching #148 계열) 이후 defaultOptions를 추가할 필요를 못 느꼈을 가능성 (가설).

## 기대 효과

- 전역 기본값(`staleTime`/`retry`/`gcTime`)을 한 곳에서 정의하면 새 쿼리를 추가할 때 `staleTime` 설정을 깜빡하는 실수를 줄일 수 있음.
- 전역 에러 핸들러가 있으면 새 mutation/query에서 에러 처리를 빠뜨려도 최소한의 사용자 피드백이 보장됨.

## 제약

- 기존에 명시적으로 `staleTime`을 설정한 4개 쿼리의 동작은 유지되어야 함 (TanStack Query는 개별 옵션이 `defaultOptions`보다 우선하므로 구조적으로는 안전하나 PRD 단계에서 재확인).
- noti의 `refetchInterval`, 각 mutation의 `onMutate`/`onSuccess` 낙관적 업데이트 로직 자체는 이번 사이클 범위 밖(별도 이슈 #218).
