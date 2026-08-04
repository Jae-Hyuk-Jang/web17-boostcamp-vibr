# 문제 영역

`docs/architecture/index.html`의 상태 관리 관련 다이어그램이 실제 코드와 어긋나 있다.

## 관찰한 증상

- `docs/architecture/index.html`이 이미 삭제된 zustand 스토어 5개(`useAuthStore`, `useNotiStore`, `usePostReactionOverridesStore`, `useProfileStore`, `useFeedRefreshStore`)를 여전히 현재 상태인 것처럼 그리고 있다.
- 영향받는 다이어그램: "상태 흐름도 — 인증 세션 (useAuthStore + internalClient)"(196-209행), "zustand 스토어 사용 현황"(229-323행, `subgraph st["stores"]`에 8개 노드 중 5개가 죽음 + fan-in 엣지 약 25줄), "usePostReactionOverridesStore 상세 흐름"(326-371행, 삭제된 스토어 전용 섹션).
- 실제로 현재 존재하는 스토어는 `apps/web/src/stores/`의 `useModalStore`, `useNotiOverlayStore`, `usePlayerStore` 3개뿐(`ls` 확인, CLAUDE.md의 "player, modal, notiOverlay" 설명과 일치).

## 실제 사례

- `useAuthStore`는 auth-state-ownership 사이클(#232~#236, PR #235)에서 삭제되고 `useAuthMe()`(TanStack Query) 구독으로 대체됨.
- `useNotiStore`는 #184에서 TanStack Query 폴링으로 전환.
- `usePostReactionOverridesStore`는 #167 이후 사이클에서 캐시(`postDetailQueryKey`) 기반으로 완전 대체.
- `useProfileStore`는 #208에서 TanStack Query 캐시 공유로 전환.
- `useFeedRefreshStore`는 #177에서 `useInfiniteQuery` 전환과 함께 제거.
- spotify-integration 사이클(#237~#241, 이슈 #242)에서 같은 파일의 Spotify 관련 서술만 먼저 정리했고, 그 작업 중 이 5개 스토어의 staleness를 별도로 발견해 이슈 #245로 분리함.

## 초기 가설

- (가설) 이 문서는 각 스토어를 삭제한 리팩터링 사이클이 "문서 갱신" 체크포인트를 포함했음에도 불구하고, `docs/architecture/index.html`처럼 해당 사이클 범위 밖의 문서까지는 갱신 대상에 포함하지 않아 여러 사이클에 걸쳐 누적된 것으로 보인다.
- (가설) 인증 세션 다이어그램은 단순 노드 삭제로 고칠 수 없고, `setAuth`/`clearAuth` 액션 기반 상태 전이 자체가 TanStack Query 기반 흐름(로딩/에러/데이터)으로 바뀌었으므로 다이어그램을 다시 그려야 한다.

## 기대 효과

- 신규 참여자나 다음 리팩터링 사이클이 이 문서를 신뢰하고 "현재 상태" 참고 자료로 쓸 수 있게 된다.
- 죽은 스토어를 실수로 다시 참조하거나, 이미 대체된 패턴(zustand 오버라이드)을 새 코드에서 반복하는 것을 막는다.

## 제약

- 과거 사이클을 설명하는 서술(예: "당시엔 이런 이유로 이 스토어를 도입했다")은 과거형으로 보존하고, "현재 상태"를 나타내는 다이어그램/표만 갱신한다.
- 문서 전용 변경이므로 애플리케이션 코드(스토어, 컴포넌트) 자체는 건드리지 않는다.
