# 문제 영역

`PlaylistDetailModal.tsx`(251줄)는 4개 mutation과 관련 UI 상태·파생 핸들러 전부가 컴포넌트 함수 본문에 inline돼 있다. 같은 저장소의 다른 두 모달 도메인(post 상세, 게시글 작성)은 이 오케스트레이션 로직을 컴포넌트와 분리된 훅 파일(`use{Domain}.ts`)로 빼는데, playlist 도메인만 다른 조직 방식을 쓴다.

## 관찰한 증상

- `PlaylistDetailModal.tsx` 안에 있는 것: UI 로컬 state 6개(`selectedSongIds`/`isEditingTitle`/`draftTitle`/`isConfirmOpen`/`isInvalidTitle`/`musicQuery`), mutation 4개(`changeOrderMutation`/`addSongMutation`/`renameMutation`/`deleteMutation`), 파생 핸들러 다수(`onPlayTotalSongs`/`toggleSelectSong`/`requestChangeOrder`/`deleteSelectedSongs`/`moveSong`/`moveSongTo`/`handleAddSong`/`startRename`/`validateRename`/`commitRename`/`cancelRename`/`requestDeletePlaylist`), 유효성검사 `useEffect` 1개 — 전부 컴포넌트 함수 본문(L18-194)에 있다.
- 대조군 — `hooks/post/usePostDetailModal.ts`(222줄): 게시글 상세 모달의 동일한 성격의 오케스트레이션(데이터 조합, 플레이어 연동, 편집 모드, UX 로그)을 컴포넌트 밖 훅으로 완전히 분리했고, `PostCardDetailModal.tsx`는 이 훅을 부르고 `PostDetailModalContext`로 하위 컴포넌트에 값을 공급하는 12줄짜리 조립부만 남았다.
- 대조군 — `hooks/post/useContentWrite.ts`: 게시글 작성 모달도 동일 패턴(훅이 `UseContentWriteResult` 인터페이스로 값·핸들러를 반환, 컴포넌트는 그 훅을 부르고 렌더링만 담당).
- `playlist-detail-state-consolidation` 사이클(#253, PR #274)에서 렌더링 소스를 캐시로 통합하는 것까지는 끝냈지만(`usePlaylistDetail(playlistId).data`가 유일한 소스), 그 캐시를 다루는 로직(mutation 4개)은 여전히 컴포넌트 안에 남아있다 — 그 사이클의 목표 인터뷰에서 "데이터 소유권 통합"과 "조직 방식(훅 분리)"을 별개 축으로 보고 후자를 의도적으로 범위 밖으로 뺐다.

## 실제 사례 (`PlaylistDetailModal.tsx` 기준, 이번 세션 확인)

- L18-37: 6개 로컬 state 선언 + `usePlaylistDetail` 구독이 컴포넌트 최상단에 그대로 있다.
- L62-189: 4개 `useMutation` 정의가 전부 컴포넌트 본문에 inline — 각 mutation은 `queryClient.setQueryData`/`bumpPlaylistRefresh` 등 캐시 조작 로직을 직접 담고 있다.
- L204-234: `Header`/`Toolbar`/`SongList`에 로컬 state·핸들러를 prop으로 그대로 흘려보낸다(이건 #275가 다루는 축 — Context 전환) — 이 이슈는 그 값들이 애초에 어디서 계산되는지(컴포넌트 vs 훅)만 다룬다.

## 초기 가설

- `usePostDetailModal`/`useContentWrite`와 동일한 패턴(`usePlaylistDetailModal.ts` 같은 훅으로 상태·mutation·핸들러를 이관, 컴포넌트는 그 훅을 불러 렌더링만 담당)을 적용하면 조직 일관성이 생기고, 이후 #275(Context 전환)가 "이 훅의 반환값을 Context로 공급"하는 형태로 더 쉬워질 것이다(가설 — PRD에서 실제 의존 순서·리스크 확인 필요).
- `playlist-detail-state-consolidation`(직전 사이클)이 이미 렌더링 소스를 캐시로 통합해뒀기 때문에, 이번 훅 추출은 "무엇을 렌더링 소스로 쓰는가"를 바꾸는 게 아니라 "어디에 코드를 두는가"만 바꾸는 순수 조직 개편에 가깝다 — 동작 자체가 바뀔 이유가 없다(검증 필요).

## 기대 효과

- `PlaylistDetailModal.tsx`가 조립(컴포넌트 렌더링)에만 집중하게 되어, post/content-write 도메인과 조직 방식이 일치한다.
- mutation 로직이 훅으로 분리되면 컴포넌트 리렌더와 무관하게 단위 테스트하기 쉬워진다(현재는 `render()`를 통해서만 mutation을 검증 가능).
- #275(Header/SongList/Toolbar Context 전환) 착수 시 Provider가 이 훅의 반환값을 그대로 공급하면 되어 작업이 단순해진다.

## 제약

- 4개 액션(제목수정/곡추가/순서변경/삭제)의 낙관적 업데이트 정책 차이(순서변경만 낙관적)를 포함해, 관찰 가능한 동작은 전혀 바꾸지 않는다 — 순수 코드 이동.
- `playlist-detail-caching`/`playlist-detail-state-consolidation` 두 사이클이 이미 확정한 결정(낙관적 롤백 없음, 삭제 후 캐시 강제 정리 없음, 목록-상세 즉시 동기화 범위 밖)을 유지한다.
- #275(Context 전환)와 순서·범위를 조율해야 한다 — 이 이슈는 먼저 훅으로만 옮기고, Context 전환 여부는 다루지 않는다(선후 관계는 PRD에서 확정).
- 기존 `PlaylistDetailModal.test.tsx`(21개 테스트, `playlist-detail-state-consolidation` 사이클 기준)를 깨지 않는다.
