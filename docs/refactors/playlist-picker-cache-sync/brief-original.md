# 문제 영역

`PlaylistPickerModal.tsx`가 `addMusicsToPlaylist`/`createNewPlaylist`(74행, 105행)를 `useMutation` 없이 직접 호출한다. 파일 전체에 `setQueryData`/`invalidateQueries` 호출이 0건이라, 성공해도 플레이리스트 목록·상세 캐시가 조용히 stale해진다.

## 관찰한 증상

- 곡을 플레이리스트에 저장(`saveToPlaylist`)해도 `queryClient`를 아예 쓰지 않는다 — 성공 toast만 뜨고 캐시는 그대로 남는다.
- 이미 `PlaylistDetailModal`이 열려 있는 상태에서 같은 플레이리스트에 곡을 추가하면(피커를 통해), 상세 모달의 `playlistDetailQueryKey` 캐시는 갱신되지 않아 화면에 새 곡이 보이지 않는다.
- `usePlaylists`(`PLAYLISTS_QUERY_KEY`, TanStack Query)가 보여주는 목록의 `tracksCount`도 저장 후 즉시 갱신되지 않는다.

## 실제 사례 (`PlaylistPickerModal.tsx` 기준)

- L68-80(`saveToPlaylist`): `addMusicsToPlaylist(playlistId, req)` 호출 후 성공 toast(`handleSaveResultToast`)와 `closeModal()`만 실행 — 캐시 쓰기 코드가 전혀 없다.
- L98-113(`handleCreateAndSave`): `createNewPlaylist()`로 새 플레이리스트를 만든 뒤 `saveToPlaylist(created.id)`를 호출하지만, 새로 만든 플레이리스트가 `PLAYLISTS_QUERY_KEY` 목록 캐시에 전혀 반영되지 않는다.
- 대조군 — `hooks/playlist/usePlaylistDetailModal.ts`의 `addSongMutation`은 동일한 "곡을 플레이리스트에 추가" 작업에 대해 `queryClient.setQueryData(playlistDetailQueryKey(...))` + `bumpPlaylistRefresh()`(= `invalidateQueries({ queryKey: PLAYLISTS_QUERY_KEY })`)를 둘 다 수행한다 — 같은 종류의 서버 변경인데 두 진입점(상세 모달 vs 피커 모달)의 캐시 처리 방식이 완전히 다르다.
- `PlaylistPickerModal.test.tsx`(74줄, 3개 테스트)는 배경 클릭/닫기, `usePlaylists` 구독 계약만 다루고 `saveToPlaylist`/`handleCreateAndSave`의 성공/실패 경로나 캐시 반영은 전혀 테스트하지 않는다 — 안전망 공백.

## 초기 가설

- `saveToPlaylist`/`handleCreateAndSave`를 `useMutation`으로 전환하고, `usePlaylistDetailModal.ts`의 `addSongMutation`과 동일한 캐시 쓰기 패턴(`setQueryData(playlistDetailQueryKey)` + `invalidateQueries(PLAYLISTS_QUERY_KEY)`)을 적용하면 두 진입점의 캐시 동작이 일관되게 맞춰질 것이다(가설 — PRD에서 `PlaylistPickerModal`이 실제로 `playlistDetailQueryKey`를 갱신해야 하는지, 아니면 `PLAYLISTS_QUERY_KEY`만으로 충분한지 확인 필요 — 피커 모달 자체는 상세 캐시를 직접 렌더링하지 않기 때문).

## 기대 효과

- 곡을 저장한 직후 이미 열려 있는 `PlaylistDetailModal`/플레이리스트 목록 화면이 최신 상태를 반영한다.
- "서버 변경 후 관련 캐시를 갱신한다"는 규칙이 이 도메인의 모든 mutation 경로(`PlaylistDetailModal`/`PlaylistPickerModal`)에 일관되게 적용된다.

## 제약

- `saveToPlaylist`/`handleCreateAndSave`의 사용자 체감 동작(성공/실패 toast 문구, 로딩 상태 표시, `isSubmittable` 가드)은 바꾸지 않는다.
- `usePlaylists`가 이미 TanStack Query 기반이므로, 새 라이브러리 도입은 필요 없다 — 기존 `useMutation`/`queryClient` 패턴을 그대로 쓴다.
- `PlaylistBriefItem`과의 마크업 중복(경미 finding, `#284` 부수 발견)은 이번 사이클에서 다룰지 별도로 결정한다.
