# 문제 영역

`apps/web`에서 같은 서버 데이터를 여러 화면이 각자 독립적으로 페칭·캐싱하면서, 한쪽에서 데이터가 바뀌어도 다른 쪽 화면에 반영되지 않는 캐시 불일치가 발생한다.

## 관찰한 증상

- 플레이리스트를 변경(추가/수정/곡 추가 등)해도 다른 화면에 뜬 플레이리스트 관련 화면이 그 변경을 즉시 반영하지 않는 경우가 있다. 실제로 겪은 문제다.
- 같은 서버 데이터(플레이리스트 목록, 로그인 사용자 정보, 게시글 상세)를 여러 훅/컴포넌트가 각자 `useState`+`useEffect`로 독립 페칭하고 있어, 한쪽의 갱신이 다른 쪽 캐시에 전달되는 경로가 훅마다 다르게(또는 아예 없이) 구현돼 있다.

## 실제 사례

- `getAllPlaylists`를 세 곳이 각각 독립적으로 페칭한다: `apps/web/src/hooks/playlist/usePlaylistRecommendations.ts:56`, `apps/web/src/components/archive/ArchiveView.tsx:19`, `apps/web/src/components/modals/PlaylistPickerModal/PlaylistPickerModal.tsx:79`.
  - 이 중 `usePlaylistRecommendations`만 `usePlaylistRefreshStore`의 nonce를 구독하지 않는다. `ArchiveView`/`PlaylistDetailModal`에서 플레이리스트를 변경해 `bumpPlaylistRefresh`를 호출해도 `usePlaylistRecommendations`가 들고 있는 캐시는 갱신되지 않는다 — 사용자가 실제로 재현한 버그다.
- `authMe()`가 `apps/web/src/hooks/auth/client/useAuthMe.ts:24`, `apps/web/src/hooks/post/usePostReactions.ts:159`, `AuthBootstrap.tsx`(전역 `useAuthStore` 채움) 세 군데에서 서로 다른 시점에 독립 호출된다.
- `getPostDetail`이 상세 모달(`usePostDetail.ts:71`)과 프로필 피드(`ProfilePostsFeed.tsx:41`, 목록 개수만큼 반복 호출하는 N+1 패턴)에서 각각 별도 캐시로 존재한다.
- "여러 컴포넌트 간 서버 상태 동기화"만을 목적으로 만들어진 zustand 스토어가 이미 4개 있다: `usePostReactionOverridesStore`(좋아요/댓글수/본문/삭제 오버라이드), `useFeedRefreshStore`, `usePlaylistRefreshStore`(둘 다 nonce bump로 무효화 트리거), `useNotiStore`(알림 목록을 서버 상태로 보관).
- 폴링과 낙관적 갱신+롤백도 훅마다 개별 재구현돼 있다: 알림 폴링(`useNotiPolling.ts:20`, 5초 setInterval), 댓글 폴링(`usePostReactions.ts:218-264`, 가시성 인식 백오프), 좋아요 낙관적 갱신+롤백(`usePostLikeToggle.ts:57-71`), 댓글 낙관적 추가+롤백(`usePostReactions.ts:279-307`), 알림 읽음/삭제 낙관적 갱신+롤백(`useNotiStore.ts:49-97`).

## 초기 가설

- (가설) 같은 서버 데이터를 캐시하는 경로가 훅마다 따로 있고, 무효화 전파(`bump*RefreshStore` 구독 여부)가 훅 작성자의 기억에 의존하기 때문에 `usePlaylistRecommendations` 같은 누락이 생긴 것으로 보인다.
- (가설) 이런 수동 동기화 인스턴스가 12개 이상의 훅에 걸쳐 반복되고 있어, 앞으로 비슷한 무효화 누락이 다른 훅에서도 재발할 위험이 구조적으로 존재한다.
- (가설, 미검증) 서버 상태 캐싱 라이브러리(TanStack Query 등)를 도입하면 이 무효화 전파를 라이브러리가 대신 보장해줄 수 있다 — 다만 이번 사이클에서 실제로 그 도구가 적합한지, 아니면 더 가벼운 자체 구현(공용 캐시 무효화 규칙 등)으로 해결 가능한지는 PRD 단계에서 비판적으로 재검토하기로 했다. 도구 도입 여부를 미리 목표로 고정하지 않는다.

## 기대 효과

- 플레이리스트/게시글/인증 정보 같은 공유 서버 데이터를 변경했을 때, 그 데이터를 구독하는 모든 화면이 훅 작성자가 무효화 로직을 직접 챙기지 않아도 일관되게 갱신된다.
- 캐시 무효화·재시도·낙관적 롤백 규칙이 훅마다 재구현되는 대신 한 군데서 검증 가능해져, 이번처럼 특정 훅만 무효화 구독을 빠뜨리는 종류의 버그 재발 위험이 줄어든다.

## 제약

- 이번 사이클은 `apps/web`(프론트엔드) 범위로 한정한다. `apps/api`, `packages/dto`의 계약은 바꾸지 않는다.
- 기존 각 화면의 사용자 동작(좋아요 토글, 댓글 작성/폴링, 플레이리스트 추가/수정, 알림 읽음/삭제 등)의 눈에 보이는 결과는 유지되어야 한다.
- TanStack Query 같은 새 라이브러리 도입 여부는 이 브리프 시점에 확정하지 않는다 — PRD 단계에서 실제 문제와 대안을 비교한 뒤 결정한다.
