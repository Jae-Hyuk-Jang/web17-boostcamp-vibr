# 문제 영역

`PlaylistDetailModal.tsx`(현재 71줄, `playlist-detail-orchestration` #276/281~282 사이클 완료 후 기준)이 `usePlaylistDetailModal` 훅에서 받은 값을 `Header`(12개 prop)/`SongList`(5개 prop)/`Toolbar`(2개 prop)에 그대로 재전달한다. 세 컴포넌트 모두 이 값들을 자기 스스로 계산하지 않고 순수 통과만 받는다.

## 관찰한 증상

- `Header.tsx`는 `title`/`tracksCount`/`coverImgUrl`/`onPlayTotalSongs`/`isEditingTitle`/`draftTitle`/`isInvalidTitle`/`onStartRename`/`onChangeTitle`/`onCommitRename`/`onCancelRename`/`onDelete` 12개 prop을 받는다 — 이번 조사 기준 저장소 전체에서 prop 수가 가장 많은 컴포넌트다.
- `SongList.tsx`는 `songs`/`selectedSongIds`/`toggleSelectSong`/`moveSong`/`moveSongTo` 5개를 받는다.
- `Toolbar.tsx`는 `selectedSongIds`/`deleteSelectedSongs` 2개를 받는다.
- 세 컴포넌트 모두 `PlaylistDetailModal.tsx`가 `usePlaylistDetailModal()` 훅에서 받은 값을 그대로 다시 전달하는 형태다(`playlist-detail-orchestration` 사이클 이후: `titleEditing`/`selection`/`search`/`confirmDelete` 그룹 객체를 개별 필드로 풀어서 전달).

## 실제 사례 (`PlaylistDetailModal.tsx`/`components/*.tsx` 기준)

- `PlaylistDetailModal.tsx`의 `<Header ... />` JSX가 `titleEditing.isEditing`/`titleEditing.draftTitle`/`titleEditing.isInvalid`/`titleEditing.handleStartRename` 등 그룹 객체의 필드 8개를 낱개로 풀어 `Header`의 개별 prop에 대입한다 — 그룹으로 모아둔 의미가 이 지점에서 다시 흩어진다.
- `SongList.tsx` 내부의 `SongItem`은 이미 `usePlayerStore`(재생)를 직접 구독한다 — leaf가 스토어를 직접 구독하는 패턴이 이 도메인에 이미 일부 적용돼 있다(선례).
- 이번 세션에서 이미 두 번(`PostCardDetailModal` → `PostDetailModalContext` #258, `ContentWriteModal` → `ContentWriteContext` #270) 검증한 패턴 — Provider가 훅 반환값을 감싸고, 하위 컴포넌트가 `useXContext()`로 직접 구독하는 3단 구조 — 을 그대로 적용할 수 있는 후보다. 두 선례 모두 오케스트레이션 훅(`usePostDetailModal`/`useContentWrite`)이 먼저 있고 그 위에 Context를 얹는 순서였는데, `usePlaylistDetailModal`이 `playlist-detail-orchestration` 사이클에서 이미 만들어졌으므로 이번 사이클은 그 훅을 그대로 감싸기만 하면 된다.

## 초기 가설

- `PlaylistDetailModalContext`(가칭)를 신설해 `usePlaylistDetailModal`의 반환값을 감싸고, `Header`/`SongList`/`Toolbar`가 `useXContext()`로 직접 구독하도록 바꾸면 `PlaylistDetailModal.tsx`의 JSX에서 prop 전달이 대부분 사라질 것이다(가설 — PRD에서 `SongList`의 `songs`/`selectedSongIds`처럼 파생 렌더링에 실제로 쓰이는 값까지 zero-prop으로 바꾸는 게 적절한지, 아니면 리스트 순회처럼 prop으로 남기는 게 더 자연스러운 경우가 있는지 확인 필요).
- `playlist-detail-orchestration`이 먼저 끝나 있어(이 저장소에서 실제로 완료됨) 이 사이클은 "새 훅 설계"가 아니라 "이미 있는 훅을 Context로 감싸는 것"만 하면 된다 — 선행 사이클의 result.md가 예상한 대로.

## 기대 효과

- `Header`/`SongList`/`Toolbar`가 zero-prop 또는 최소 prop 컴포넌트가 되어, 이 도메인의 조직 방식이 post/content-write 도메인의 Context 패턴과 일치한다.
- `PlaylistDetailModal.tsx`의 JSX가 현재보다 더 간결해진다(현재도 71줄로 짧지만, prop 전달 코드가 여전히 JSX의 상당 부분을 차지한다).

## 제약

- `PlaylistDetailModal.test.tsx`(21개, 컴포넌트 통째 렌더링 기반)를 깨지 않는다.
- 4개 mutation의 동작(낙관적 정책 비대칭, 롤백 없음 등)은 `playlist-detail-orchestration`에서 이미 훅으로 옮겨졌고 이번 사이클에서 다시 손대지 않는다 — 이번은 순수하게 "그 훅의 값을 어떻게 하위 컴포넌트에 전달하는가"만 다룬다.
- `SongList` 내부 `SongItem`이 이미 `usePlayerStore`를 직접 구독하는 기존 패턴은 그대로 유지한다.
