# 문제 영역

`PlaylistDetailModal.tsx`가 `usePlaylistDetail`(TanStack Query)로 상세 데이터를 조회하지만, 실제 렌더링의 소스는 별도 로컬 `useState`(`playlist`/`songs`)다. 쿼리는 최초 1회 "시딩"에만 쓰이고, 이후 4개의 mutation이 성공할 때마다 로컬 state·상세 쿼리 캐시·목록 쿼리 캐시 세 곳을 각각 손으로 동기화한다.

## 관찰한 증상

- 컴포넌트 안에 컴포넌트를 넣을 때 파라미터를 너무 많이 상속(prop으로 재전달)한다 — `Header`(12개 props), `SongList`(5개 props)에 로컬 state 파생값들을 그대로 흘려보낸다.
- 이 방식이 TanStack Query를 도입한 목적(쿼리 캐시를 렌더링의 단일 소스로 쓰기)과 맞지 않아 보인다 — `usePostDetail`(post 도메인)은 캐시를 직접 렌더링에 쓰는데, `usePlaylistDetail`은 로컬 state의 "초기값 공급원" 역할만 한다.

## 실제 사례 (`PlaylistDetailModal.tsx` 기준)

- L26-48: `usePlaylistDetail(playlistId)`로 조회한 `fetchedPlaylist`를 `hasSeededRef`로 최초 1회만 `playlist`/`songs` state에 복사한다. 코드 주석에 이미 "로컬 state(playlist/songs)가 여전히 렌더링의 소스"라고 명시돼 있다.
- L73-91(`changeOrderMutation`), L122-134(`addSongMutation`), L152-165(`renameMutation`), L194-203(`deleteMutation`) — 4개 mutation 전부 `onMutate`/`onSuccess`에서 ① 로컬 state(`setSongs`/`setPlaylist`) ② `playlistDetailQueryKey` 캐시(`queryClient.setQueryData`) ③ `bumpPlaylistRefresh()`(목록 캐시 invalidate)를 각각 손으로 3중 갱신한다.
- 4개 mutation의 낙관적 업데이트 정책이 서로 다르다 — `changeOrderMutation`만 `onMutate`에서 낙관적으로 반영하고, 나머지 3개(`renameMutation`/`addSongMutation`/`deleteMutation`)는 `onSuccess`에서만 반영한다(이전 사이클에서 "4개 모두 낙관적"이라 잘못 가정했다가 정정된 이력이 있음 — `docs/refactors/playlist-detail-caching/result.md`의 Decision Review 참고).

## 초기 가설

- 이미 `playlist-detail-caching` 사이클(#186~196)의 Remaining Debt에 이 문제가 명시적으로 예견돼 있었다 — 인용: "`PlaylistDetailModal`의 로컬 `songs`/`playlist` state는 여전히 렌더링의 소스이고, 쿼리 캐시는 '다른 소비처와의 공유'라는 부차적 역할만 한다 ... 지금 구조로도 Success Criteria(캐시 공유)는 충족되지만, 훗날 4개 액션을 더 다듬으려면 이 이중 구조가 유지보수 포인트가 될 수 있다." 당시엔 재현된 버그·사용자 불만이 없어 백로그 등록을 보류했다.
- `usePostDetail`처럼 쿼리 캐시를 렌더링의 직접 소스로 완전히 통합하면(로컬 `useState` 제거) 3중 동기화가 "캐시 1곳만 쓰기"로 줄어들 것 같다(가설 — PRD에서 실제로 그런지, `hasSeededRef`가 막고 있던 문제(다른 액션의 캐시 쓰기로 인한 재시딩 → 로컬 state 덮어쓰기 버그, #189에서 발견된 이력)가 캐시를 소스로 바꿔도 재발하지 않는지 확인 필요).

## 기대 효과

- 4개 mutation이 각각 손으로 하던 "로컬 + 캐시 2곳 쓰기"를 캐시 1곳만 쓰는 것으로 줄인다.
- 새 변경 액션을 추가하거나 기존 액션의 동기화 정책을 바꿀 때, 로컬 state와 캐시 사이의 불일치 가능성을 원천적으로 없앤다.

## 제약

- 4개 액션(제목수정/곡추가/순서변경/삭제)의 낙관적 업데이트 정책은 서로 다르다(순서변경만 낙관적) — 이 사이클에서 재현된 문제 없이 정책 자체를 통일하지 않는다.
- `requestChangeOrder`(순서변경·삭제)가 실패해도 롤백하지 않는 현재 동작(이전 사이클에서 사용자 확인된 기존 결정)을 유지한다.
- 삭제 성공 시 상세 캐시를 즉시 지우지 않는 현재 동작(구독 중인 컴포넌트의 재요청 레이스 방지, 이전 사이클에서 발견된 이슈)을 유지한다.
- 목록(`['playlists']`)-상세 즉시 동기화는 이번에도 범위 밖이다(이전 사이클의 Out of Scope 결정을 유지) — `bumpPlaylistRefresh()`(invalidateQueries) 방식 자체는 바꾸지 않는다.
- `playlist-detail-caching` 사이클이 만든 안전망(특성화/계약/통합 테스트, 착수 시점 기준 36 suites/202 tests에 포함)을 깨지 않는다.
