# 문제 영역

`apps/web`에서 플레이리스트 **목록**(`['playlists']`)은 `usePlaylists()`로 TanStack Query 캐시를 공유하지만, 플레이리스트 **상세**(`getPlaylistDetail`)는 `server-state-caching`(#148) ADR에서 명시적으로 Out of Scope로 남아 여전히 `useState`+`useEffect`/직접 `await` 패턴으로 각자 독립 페칭한다.

## 관찰한 증상

- 같은 `playlistId`의 상세를 두 진입점(모달, 추천 드롭다운)에서 열어도 캐시가 공유되지 않아 각자 별도로 네트워크 요청을 보낸다.
- `PlaylistDetailModal`은 상세를 불러온 뒤 로컬 `useState`(`playlist`, `songs`)로 들고 있다가, 각 변경 액션(제목 수정/곡 추가/순서 변경/삭제) 성공 시 그 로컬 state를 손으로 갱신하면서 동시에 `bumpPlaylistRefresh()`(`queryClient.invalidateQueries({ queryKey: PLAYLISTS_QUERY_KEY })`)로 목록 캐시만 별도로 무효화한다 — 상세 자체는 쿼리 캐시에 없다.

## 실제 사례

- `apps/web/src/components/modals/PlaylistDetailModal/PlaylistDetailModal.tsx:37` — `initialFetchPlaylist`가 `getPlaylistDetail(playlistId)`를 직접 호출해 `useState`(`playlist`, `songs`)에 저장.
- 같은 파일의 `requestChangeOrder`(69행), `handleAddSong`(112행), `commitRename`(143행), 삭제 confirm 콜백(216행) 네 곳 모두 변경 성공 후 `bumpPlaylistRefresh()`를 호출해 **목록** 캐시(`PLAYLISTS_QUERY_KEY`)만 무효화하고, 상세 데이터는 각 핸들러가 로컬 `setSongs`/`setPlaylist`로 수동 반영한다.
- `apps/web/src/hooks/playlist/usePlaylistRecommendations.ts:63` — `selectPlaylist`가 별도로 `getPlaylistDetail(playlistId)`를 호출해 자체 상태(`selectedPlaylistId`, `detailErrorMessage`)로 관리한다. `PlaylistDetailModal`이 같은 플레이리스트를 이미 열어놨어도 이 훅은 그 사실을 모른 채 새로 요청한다.
- 두 소비처 모두 각자 로딩/에러 처리를 따로 구현하고 있다(`PlaylistDetailModal`은 toast, `usePlaylistRecommendations`는 mock 데이터 폴백 + `detailErrorMessage`).

## 초기 가설

- (가설) `postDetailQueryKey(postId)`가 해결한 것과 같은 클래스의 문제 — "같은 리소스의 상세를 여러 진입점이 각자 캐싱"하는 패턴이 플레이리스트 상세에도 그대로 반복되고 있는 것으로 보인다.
- (가설, 미검증) `['playlistDetail', playlistId]`류 쿼리키를 도입하면 두 소비처가 캐시를 공유할 수 있지만, `PlaylistDetailModal`이 갖고 있는 4개 변경 액션(제목수정/곡추가/순서변경/삭제)의 무효화 설계(`invalidateQueries` vs `setQueryData`)와, 그 결과가 목록(`['playlists']`) 캐시와 정합성을 유지하는지는 PRD 단계에서 검증이 필요하다.

## 기대 효과

- 같은 `playlistId`를 여러 진입점에서 열어도 하나의 캐시를 공유해, 한쪽에서의 변경(제목/곡 구성)이 다른 진입점에도 자동 반영된다.
- 로딩/에러 처리, 무효화 규칙이 두 훅에 따로 구현되는 대신 한 곳(쿼리 훅)으로 모여 유지보수 지점이 줄어든다.

## 제약

- 이번 사이클은 `apps/web`(프론트엔드) 범위로 한정한다. `apps/api`, `packages/dto`의 계약은 바꾸지 않는다.
- `PlaylistDetailModal`의 기존 사용자 동작(낙관적 순서 변경, 제목 인라인 편집, 삭제 확인 등)의 눈에 보이는 결과는 유지되어야 한다.
- 이미 완료된 `usePlaylists`/`usePostDetail` 패턴과의 일관성을 우선 고려하되, 새 라이브러리 도입은 필요 없음(TanStack Query는 이미 도입돼 있다) — 검토 범위는 쿼리키 설계와 소비처 전환.
