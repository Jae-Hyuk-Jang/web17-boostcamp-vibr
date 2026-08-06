# PRD — playlist-detail-prop-drilling

## 문제 정의

`brief-original.md` 요약: `PlaylistDetailModal.tsx`(71줄, `playlist-detail-orchestration` #276/281~282 사이클 완료 후 기준)가 `usePlaylistDetailModal` 훅에서 받은 값을 `Header`(12개 prop)/`SongList`(5개 prop)/`Toolbar`(2개 prop)에 순수 통과만 시킨다. 이 문제는 `playlist-detail-state-consolidation` 사이클(#253) PRD 진단 중 확인됐고, 목표 인터뷰에서 의도적으로 별도 이슈(#275)로 남겨졌다. `#276`(오케스트레이션 훅 추출)이 먼저 끝나 이번 사이클의 전제(감쌀 훅이 이미 존재)가 충족된 상태다.

왜 지금 다뤄야 하는가: 이번 세션에서 이미 두 번(`PostCardDetailModal`→`PostDetailModalContext` #258, `ContentWriteModal`→`ContentWriteContext` #270) 검증된 Provider/ValueProvider/`useXContext` 패턴이 있고, `#276`이 만든 `usePlaylistDetailModal`을 그대로 감싸기만 하면 되는 조건이 갖춰졌다.

## 비판적 진단 (시니어 개발자 시각)

### 근거

- **Fact** — `Header.tsx` L6-19: `title`/`tracksCount`/`coverImgUrl`/`onPlayTotalSongs`/`isEditingTitle`/`draftTitle`/`isInvalidTitle`/`onStartRename`/`onChangeTitle`/`onCommitRename`/`onCancelRename`/`onDelete` 12개 prop을 받는다 — 저장소 전체에서 prop 수가 가장 많다(직전 사이클 산출물인 `usePlaylistDetailModal.ts`의 그룹 필드를 컴포넌트가 다시 낱개로 풀어 전달하는 지점).
- **Fact** — `SongList.tsx` L83-95: `songs`/`selectedSongIds`/`toggleSelectSong`/`moveSong`/`moveSongTo` 5개를 받는다. 내부 `SongItem`(L10-34)은 이미 `usePlayerStore`(재생)를 직접 구독한다 — leaf 직접구독 패턴이 이 파일 안에 이미 부분적으로 존재한다.
- **Fact** — `Toolbar.tsx`: `selectedSongIds`/`deleteSelectedSongs` 2개.
- **Fact** — `PlaylistDetailModal.tsx` L10-11,22-57: `usePlaylistDetailModal()` 훅에서 받은 `titleEditing`/`selection`/`search`/`confirmDelete` 그룹 객체를 JSX에서 다시 개별 필드로 풀어 `Header`/`SongList`/`Toolbar`의 개별 prop에 대입한다 — 훅이 만들어둔 그룹핑의 의미가 이 지점에서 다시 흩어진다.
- **Fact(대조군)** — `PostDetailModalContext.tsx`/`ContentWriteContext.tsx`는 동일한 3단 구조(`XxxValueProvider`(순수 주입, 단독 테스트용) → `XxxProvider`(훅 호출, 유일한 호출 지점) → `useXxxContext()`)를 갖는다. leaf 컴포넌트(`CoverImgUploader.tsx`/`MusicSearch.tsx`/`SelectedMusicList.tsx`)는 전부 zero-prop이고 각자 `useContentWriteContext()`를 직접 호출해 필요한 필드만 구조분해한다(Fact, grep으로 확인).
- **Fact** — `PlaylistDetailModal.test.tsx`(21개)는 전부 `render(<PlaylistDetailModal playlistId="pl-1" />)`를 통째로 렌더링해 DOM assertion으로 검증한다 — Context 도입 후에도 최상위 컴포넌트의 마운트 방식(`playlistId` prop)과 렌더링 결과가 같으면 수정 없이 통과할 가능성이 높다.
- **Fact** — `ModalContainer.tsx` L62: `<PlaylistDetailModal playlistId={modalProps.playlistId as string} />` — 다른 두 선례(`PostCardDetailModal`/`ContentWriteModal`)는 `ModalContainer`에서 zero-prop으로 마운트되고 `modalProps`를 Provider 내부에서 직접 읽는다. `PlaylistDetailModal`은 `playlistId`를 prop으로 받는 유일한 차이가 있다 — Context 도입 시 이 prop 전달 방식을 유지할지, 다른 두 선례처럼 Provider가 `modalProps`를 직접 읽게 바꿀지는 목표 인터뷰에서 결정 필요(Behavior 변화가 아니라 진입 방식 선택 문제).

### 증상 → 원인 체인

`Header`가 12개 prop을 받아 한눈에 시그니처를 파악하기 어렵다 → (왜?) `PlaylistDetailModal.tsx`가 훅의 그룹 객체를 다시 낱개로 풀어 전달한다 → (왜?) `usePlaylistDetailModal` 훅은 `playlist-detail-orchestration` 사이클에서 막 만들어졌고, 그 값을 하위 컴포넌트에 "어떻게 전달할지"(prop vs Context)는 그 사이클의 범위가 아니었다(구조 원인: 오케스트레이션 훅과 값 전달 방식은 서로 다른 축이고, 전자만 먼저 정리됨 — 이번 세션에서 네 번째로 확인되는 "나중에 정착된 패턴이 아직 소급되지 않음" 구조 원인).

### 아키텍처 관점

- 이 문제는 `PlaylistDetailModal`에 국한되지 않는 반복 패턴이다 — 이번 세션에서 같은 구조 원인이 네 번째로 관찰된다(`PostCardDetailModal`/`ContentWriteModal`의 Context 전환 vs `PlaylistDetailModal`, `PostMedia`의 leaf 직접구독 부재, `PlaylistDetailModal`의 훅 분리 부재였던 `#276`, 그리고 이번 prop drilling).
- 기존 컨벤션과 충돌하지 않는다 — Context 패턴 자체가 이미 이 저장소에 두 번 확립돼 있고, 새 패턴을 만드는 게 아니라 세 번째로 같은 패턴을 적용하는 것이다.
- "당시엔 맞았지만 전제가 깨진" 결정이 아니라, `#276`이 끝나야 성립하는 전제(오케스트레이션 훅의 존재)가 이제 막 충족된 경우다.

### 비판적 재검토 (사용자 문제 제기에 대한 반박 질문과 답)

- **이 증상이 정말 구조 문제인가, 아니면 prop 개수가 많다는 인상뿐인가?** `Header`의 12개 prop 중 실사용 없이 통과만 되는 것은 없다(전부 `Header` 내부에서 실제로 쓰임, PRD Fact) — "순수 통과 prop"은 `PlaylistDetailModal`이 `Header`에 전달하는 시점 얘기지 `Header` 자체의 문제가 아니다. 진짜 구조 문제는 "값의 소유자(훅)와 소비자(Header) 사이에 불필요한 중계자(PlaylistDetailModal의 JSX)가 끼어 있다"는 것이고, 이는 이미 이 저장소에서 두 번 "Context로 직접 연결"해 해소한 것과 동일한 클래스다.
- **지금 안 고치면 다음 몇 번의 변경에서 구체적으로 어떤 비용이 드는가(YAGNI)?** `usePlaylistDetailModal`에 필드를 추가/변경할 때마다 `PlaylistDetailModal.tsx`의 JSX 전달부와 `Header`/`SongList`/`Toolbar`의 Props 타입 양쪽을 동시에 고쳐야 한다. 세 컴포넌트 중 하나에만 새 필드가 필요해도 중간 경유지인 `PlaylistDetailModal.tsx`를 항상 거쳐야 한다.
- **더 급한 다른 문제를 가리는 건 아닌가?** 이 영역에 재현된 버그는 없다. 다만 방금 등록한 `#284`(`PlaylistPickerModal` 캐시 미동기화, 심각도 "심각")가 이 도메인에 더 급한 문제로 남아있다 — 이번 사이클은 그 이슈와 파일이 전혀 겹치지 않는 독립 작업이라 순서상 문제되지 않지만, `#284`가 다음 순번 후보로 우선한다는 점은 기록해둔다.
- **정직하게 말해, 이 변경이 실제로 무엇을 개선하는가?** `#276`과 마찬가지로 버그를 고치지 않고 새 테스트 커버리지를 추가하지도 않는다(기존 21개가 이미 렌더링 결과를 검증). 개선되는 것은 ① `Header`/`SongList`/`Toolbar`가 zero-prop이 되어 조직 일관성이 완성되는 것, ② 훅 필드 변경 시 중간 경유 없이 소비 컴포넌트만 고치면 되는 것 두 가지뿐이다.

## 목표와 범위

### Goal

`PlaylistDetailModalContext`(가칭)를 신설해 `usePlaylistDetailModal`의 반환값을 감싸고, `Header`/`SongList`/`Toolbar`가 `useXContext()`로 직접 구독하도록 바꿔 `PlaylistDetailModal.tsx`의 prop 전달 코드를 제거한다. `PostDetailModalContext`/`ContentWriteContext`와 동일한 3단 구조(`XxxValueProvider`/`XxxProvider`/`useXxxContext`)를 따른다.

### Success Criteria

- `Header`/`SongList`/`Toolbar`가 zero-prop 컴포넌트가 되고, 각자 새 Context 훅을 직접 호출해 필요한 필드를 구조분해한다.
- `PlaylistDetailModal.tsx`의 JSX에서 `Header`/`SongList`/`Toolbar`로의 prop 전달 코드가 사라진다.
- `PlaylistDetailModal.test.tsx`의 기존 21개 테스트가 회귀 없이 통과한다(수정이 필요하면 렌더링 결과 검증 방식은 유지하되 최소한으로).
- 4개 mutation의 동작(낙관적 정책 비대칭 등)은 전혀 바뀌지 않는다 — `#276`이 이미 훅으로 옮겨둔 로직을 그대로 감싸기만 한다.
- `lint`/`check-types`/`build`가 기존과 동일하게 통과한다.

### Out of Scope

- **`#284`(`PlaylistPickerModal` 캐시 미동기화)** — 파일이 전혀 겹치지 않는 독립 문제, 별도 사이클.
- **4개 mutation의 낙관적 업데이트 정책 통일** — 이전 사이클들에서 이미 검토·유지 결정(전제 변화 없음).
- **`usePlaylistDetailModal` 자체의 필드 재설계** — `#276`에서 이미 확정, 이번 사이클은 그 값을 "어떻게 전달하는가"만 다룬다.
- `SongList` 내부 `SongItem`의 `usePlayerStore` 직접 구독(기존 패턴) — 그대로 유지, 손대지 않음.
- `apps/api`, `packages/dto` 변경.

## Behavior Invariants

- 4개 액션(제목수정/곡추가/순서변경/삭제) 각각의 성공/실패/유효성검사 동작은 변경 없다.
- `Header`/`SongList`/`Toolbar`가 최종적으로 렌더링하는 DOM 결과는 Context 전환 전후 동일하다(prop이 아니라 Context에서 값을 읽을 뿐, 값 자체와 렌더링 결과는 같음).
- `SongList` 내부 `SongItem`의 `usePlayerStore` 직접 구독과 그로 인한 재생 동작은 변경 없다.
- 모달 진입 방식(`ModalContainer`가 `PLAYLIST_DETAIL` 타입일 때 이 컴포넌트를 렌더링하는 조건)은 변경 없다.

## 기준선 검증

| 명령             | 결과 | 실패 항목 | 비고                                |
| ---------------- | ---- | --------- | ----------------------------------- |
| pnpm lint        | 성공 | 없음      | turbo 4개 태스크 전부 성공          |
| pnpm check-types | 성공 | 없음      | turbo 3개 태스크 전부 성공          |
| pnpm test        | 성공 | 없음      | web 49 suites / 275 tests 전부 통과 |
| pnpm build       | 성공 | 없음      | web 프로덕션 빌드 성공              |

- playlist 도메인 테스트만 별도 실행(`pnpm exec jest --testPathPatterns="[Pp]laylist"`): **5 suites / 39 tests** 통과.
- 변경 영향 예상 파일: `PlaylistDetailModal.tsx`, `Header.tsx`, `SongList.tsx`, `Toolbar.tsx`, 신규 `PlaylistDetailModalContext.tsx` 1개 — 확정값 아님, ADR 단계에서 구체화.
- 번들 크기·빌드 시간 증분: 측정 불가 — 새 라이브러리 도입이 없고 순수 배선 변경이라 유의미한 증분이 예상되지 않지만, PRD 단계에서 별도 측정은 하지 않음.

## 목표 인터뷰 결과 (AskUserQuestion)

**Q. `PlaylistDetailModal`은 현재 `ModalContainer`에서 `playlistId`를 prop으로 받습니다. 다른 두 선례(`PostCardDetailModal`/`ContentWriteModal`)는 zero-prop으로 마운트되고 Provider가 `modalProps`를 직접 읽습니다. 이번에 맞출까요?**
A. `playlistId` prop 유지(추천). 이유: Context는 "훅 값을 하위에 어떻게 전달하는가"만 다루는 이번 사이클의 목표이고, "모달이 어떻게 마운트되는가"는 별개 축이다. `playlistId` prop을 `modalProps` 읽기로 바꾸면 `ModalContainer.tsx`와 `PlaylistDetailModal.test.tsx`의 마운트 방식까지 동시에 바뀌어야 해, "prop 전달 방식만 바꾼다"는 PRD Goal 범위를 벗어난다는 진단을 그대로 채택.

Behavior Invariants·Success Criteria 초안은 코드에서 그대로 도출했으며, 위 인터뷰 결과와 함께 그대로 확정한다.

---

**[GATE 1]** 위 진단·목표·범위·Behavior Invariants·기준선을 확인해주시면 다음 단계(ADR)로 넘어가겠습니다.
