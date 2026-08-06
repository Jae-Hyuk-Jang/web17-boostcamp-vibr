# PRD — playlist-detail-state-consolidation

## 문제 정의

`playlist-detail-caching`(#186~196) 사이클에서 `PlaylistDetailModal`과 `usePlaylistRecommendations.selectPlaylist`가 `playlistDetailQueryKey(playlistId)` 쿼리 캐시를 공유하게 됐지만, 그 사이클은 의도적으로 "캐시 공유"까지만 다루고 "캐시를 렌더링의 소스로 완전히 통합"하는 것은 범위 밖으로 남겼다(`playlist-detail-caching/result.md`의 Remaining Debt에 명시). 그 결과 `PlaylistDetailModal.tsx`는 `usePlaylistDetail`(TanStack Query)로 상세를 조회하면서도 실제 렌더링은 별도 로컬 `useState`(`playlist`/`songs`)를 소스로 쓰고, 쿼리는 최초 1회 시딩(`hasSeededRef`)에만 관여한다. 4개 변경 액션(제목수정/곡추가/순서변경/삭제)은 성공할 때마다 로컬 state·상세 캐시·목록 캐시 세 곳을 각각 손으로 동기화한다.

이번 사이클은 그 "다음 조각"을 다룬다 — 사용자가 "컴포넌트 안에 컴포넌트를 넣을 때 파라미터를 너무 많이 상속한다", "이 방식이 zustand/TanStack Query를 도입한 목적과 맞지 않아 보인다"고 데이터 정합성/설계 관점에서 명시적으로 재검토를 요청해(이슈 #253) 백로그로 승격됐다.

## 비판적 진단 (시니어 개발자 시각)

### 근거

- **Fact** — `PlaylistDetailModal.tsx:29-48`: `usePlaylistDetail(playlistId)`로 조회한 `fetchedPlaylist`를 `hasSeededRef`로 **최초 1회만** `playlist`/`songs` state에 복사한다. 코드 주석에 "로컬 state(playlist/songs)가 여전히 렌더링의 소스"라고 명시돼 있다.
- **Fact** — `PlaylistDetailModal.tsx`의 4개 mutation(`changeOrderMutation:73-91`, `addSongMutation:122-134`, `renameMutation:152-165`, `deleteMutation:194-203`) 중 3개(`addSongMutation`/`renameMutation`, 그리고 삭제는 캐시 쓰기 없음)가 성공 시 로컬 state와 `playlistDetailQueryKey` 캐시 양쪽에 쓰고, 전부 `bumpPlaylistRefresh()`(목록 캐시 invalidate)도 호출한다 — 반복되는 3중(또는 2중) 쓰기 패턴이다.
- **Fact(핵심)** — `hasSeededRef` 가드는 우연히 붙은 게 아니다. `playlist-detail-caching/result.md` #189 항목: "구현 중 발견: 최초 시딩 useEffect가 다른 액션의 캐시 쓰기로 재실행되며 로컬 songs를 덮어쓰는 버그를 미리 발견해, 최초 1회만 시딩하도록 가드 추가." — 즉 "로컬 state를 캐시에서 매번 재파생시키기"는 **이전에 이미 시도했다가 실제 버그를 낸 지점**이다. 이번 사이클이 "로컬 state 완전 제거 + 캐시를 직접 소스로"로 가는 것은 방향은 다르지만(재파생이 아니라 아예 로컬 state 자체가 없어짐), `hasSeededRef`가 지키던 그 정확한 실패 모드(캐시 갱신 시점과 로컬 반영 시점의 어긋남)를 다시 만들지 않는지는 구현 중 별도로 확인해야 한다.
- **Fact** — 같은 문제를 이미 풀어본 비교 대상이 저장소 안에 있다: `usePostDetail.ts`(post 도메인)는 로컬 `useState` 없이 `useQuery`의 `data`를 그대로 렌더링에 쓴다. 콘텐츠 수정도 `useMutation`이 아니라, 성공 후 `queryClient.setQueryData`만 호출하는 평범한 함수(`updatePostContent`, `usePostDetailModal.ts:137`에서 호출)다 — "모든 변경을 useMutation으로 감싸야 한다"는 게 이 저장소의 유일한 패턴은 아니라는 근거이기도 하다.
- **Fact** — `Header.tsx`는 12개 prop을 받는다(`title`/`tracksCount`/`coverImgUrl`/`onPlayTotalSongs`/`isEditingTitle`/`draftTitle`/`isInvalidTitle`/`onStartRename`/`onChangeTitle`/`onCommitRename`/`onCancelRename`/`onDelete`) — 이번 조사에서 확인한 저장소 전체 prop 수 최다 컴포넌트다. `SongList`는 5개, `Toolbar`는 2개.
- **Fact** — 안전망은 이전 사이클 착수 시점(배경 클릭 특성화 테스트 1개)과 지금이 다르다. 현재 `PlaylistDetailModal.test.tsx`는 20개 테스트로 4개 액션 전부(성공/실패/유효성검사/낙관적 반영/캐시 반영)를 커버하고, `usePlaylistDetail.test.ts`/`usePlaylistRecommendations.test.ts`/`PlaylistDetailCacheSharing.integration.test.tsx`를 더해 playlist 도메인 전체 5 suites/38 tests가 통과한다(기준선 검증 결과, 아래 표).
- **Fact** — `playlistDetailQueryKey` 캐시에 쓰는 지점은 `PlaylistDetailModal.tsx` 하나뿐이다(grep 확인, `usePlaylistRecommendations.selectPlaylist`는 `ensureQueryData`로 읽기만 한다) — 동시에 여러 컴포넌트가 같은 캐시에 쓰기 경합을 일으키는 시나리오는 없다.
- **Inference** — `playlist`/`songs`를 제외한 나머지 로컬 state(`selectedSongIds`/`isEditingTitle`/`draftTitle`/`isConfirmOpen`/`isInvalidTitle`/`musicQuery`)는 서버 데이터가 아니라 순수 UI/상호작용 상태라, 이번 "데이터 소유권 통합"과 무관하게 `useState`로 남아야 한다(CLAUDE.md의 zustand/로컬 state 경계 원칙과도 일치). 이 사이클이 손댈 대상은 정확히 `playlist`/`songs` 두 개뿐이다.
- **Inference** — CLAUDE.md에 이미(이번 P0 작업으로) "PlaylistDetailModal.tsx처럼 쿼리 캐시와 로컬 useState가 렌더링의 이중 소스로 공존하는 곳도 있습니다 ... 신규 코드에서 이 이중 구조를 따라 하지 말고, 가능하면 쿼리 캐시를 렌더링의 단일 소스로 쓰세요(usePostDetail이 그 예시)"라고 적혀 있다 — 이번 사이클은 그 문장이 가리키는 대상 자체를 고치는 것이라, 코드와 문서 사이의 괴리를 실제로 없앤다.

### 증상 → 원인 체인

4개 변경 액션이 각각 로컬 state·상세 캐시·목록 캐시 최대 3곳을 손으로 동기화한다 → (왜?) `usePlaylistDetail`의 쿼리 결과가 렌더링에 직접 쓰이지 않고 로컬 state를 "시딩"하는 데만 쓰인다 → (왜?) 이전 사이클(`playlist-detail-caching`)이 "캐시 공유"까지만 범위를 잡고 "로컬 state 제거"는 다음 조각으로 명시적으로 미뤘다(구조 원인: 의도적으로 좁힌 범위가 아직 이어지지 않은 상태).

### 아키텍처 관점

- 이 문제는 `PlaylistDetailModal`에 국한되지 않는 클래스다 — post 도메인은 `usePostDetail`로 이미 "캐시가 곧 렌더링 소스"를 달성했고, playlist 도메인만 "로컬 state가 렌더링 소스, 캐시는 공유 매개체"라는 다른 답을 갖고 있다. 같은 저장소 안에 같은 문제의 두 가지 답이 공존하는 상태다.
- 기존 컨벤션과 충돌하지 않는다 — 오히려 CLAUDE.md가 이번에 명문화한 방향(쿼리 캐시를 렌더링의 단일 소스로)을 그대로 따르는 변경이다.
- 이전 ADR(`playlist-detail-caching`)과도 충돌하지 않는다 — 그 ADR의 Remaining Debt가 "지금 구조로도 Success Criteria(캐시 공유)는 충족되지만, 훗날 4개 액션을 더 다듬으려면 이 이중 구조가 유지보수 포인트가 될 수 있다"고 정확히 이 사이클을 예견해뒀다.
- "당시엔 맞았지만 전제가 깨진" 결정이 아니라, 사이클 크기를 통제하려고 의도적으로 좁혀둔 범위의 다음 조각이다(이전 사이클과 동일한 성격).

### 비판적 재검토 (사용자 문제 제기에 대한 반박 질문과 답)

- **이 증상이 정말 구조 문제인가, 아니면 우연한 버그인가?** 구조 문제다. 다만 솔직히 밝히면 — 오늘 기준으로 이 이중 소스가 실제로 화면에 보이는 불일치(오래된 값이 잠깐 보이는 등)를 일으켰다는 재현 사례는 없다. 4개 mutation이 로컬+캐시를 같은 콜백 안에서 함께 쓰기 때문에 오늘까지는 두 값이 어긋난 적이 없다. 이 리팩터링의 가치는 "지금 눈에 보이는 버그를 고친다"가 아니라 "구조적으로 어긋날 수 없게 만든다"는 예방적 가치다 — 이전 사이클의 정직한 톤을 그대로 유지한다.
- **지금 안 고치면 다음 몇 번의 변경에서 구체적으로 어떤 비용이 드는가?** 새 변경 액션이 추가될 때마다(예: 곡 즐겨찾기, 협업 편집 등) 3중 쓰기 패턴을 또 반복해야 한다. 이미 4곳이 거의 동일한 `try/onSuccess/toast.error/console.error` + "로컬도 쓰고 캐시도 쓰고" 구조를 복붙해왔다(코드 확인). 근본 원인(이중 소스)을 두고 새 액션을 추가하면 실수로 한쪽만 쓰는 버그가 날 잠재 위험이 커진다.
- **더 급한 다른 문제를 가리는 건 아닌가?** 이번 조사에서 이 모달 안에 더 급한 문제는 발견하지 못했다. 저장소 전체로 보면 `app-shell`(#259)이나 `feed/search`(#260) 도메인이 영향 범위가 더 넓어 레버리지가 크지만, 이 셋 중 무엇을 먼저 할지는 이미 사용자가 결정했다(#253부터 진행) — 이 PRD는 그 선택 자체를 재논쟁하지 않는다.

## 목표와 범위

### Goal

`PlaylistDetailModal.tsx`가 로컬 `useState`(`playlist`/`songs`) 없이 `usePlaylistDetail(playlistId).data`를 렌더링의 유일한 소스로 쓰도록 전환한다 — `usePostDetail` 패턴과 동일한 형태로 통일한다.

### Success Criteria

- `PlaylistDetailModal.tsx`에서 `playlist`/`songs` 로컬 `useState`와 `hasSeededRef`가 사라지고, `usePlaylistDetail(playlistId).data`가 렌더링의 유일한 소스가 된다.
- 4개 mutation 각각의 성공(및 낙관적 반영이 있는 경우 `onMutate`) 콜백이 `queryClient.setQueryData(playlistDetailQueryKey(...))` 캐시 1곳만 쓰면 화면이 자동으로 갱신된다 — 로컬 `setSongs`/`setPlaylist` 별도 호출이 코드에서 완전히 사라진다.
- 기존 Behavior Invariants(아래)를 모두 만족하고, 기존 playlist 도메인 테스트(5 suites/38 tests — 구현 세부에 따라 리라이트되더라도 "무엇을 검증하는지"는 동일하게 유지)가 모두 통과한다.
- `lint`/`check-types`/`build`가 기존과 동일하게 통과한다.

### Out of Scope

- **Header/SongList/Toolbar의 prop drilling(Context 전환)** — 목표 인터뷰에서 사용자가 명시적으로 이번 사이클 범위 밖으로 결정. Header의 12-prop 문제는 실재하지만 "데이터가 어디 있는가"(이번 범위)와 "데이터가 어떻게 전달되는가"(별도 축)는 다른 문제로, 별도 이슈 후보로 Follow-ups에 남긴다.
- **PlaylistDetailModal.tsx 로직의 별도 훅 파일 분리**(`usePlaylistDetailActions` 등, post/content-write 도메인과의 조직 일관성) — 위와 같은 이유로 범위 밖. Follow-ups에 남긴다.
- **목록(`['playlists']`)-상세 즉시 동기화** — `playlist-detail-caching` 사이클에서 이미 결정한 Out of Scope를 유지한다. 전제 변화(재현된 버그·불만) 없어 재논쟁하지 않는다. `bumpPlaylistRefresh()`(invalidateQueries) 방식 자체는 바꾸지 않는다.
- **4개 mutation의 낙관적 업데이트 비대칭 정책**(순서변경만 `onMutate` 낙관적, 나머지는 `onSuccess`) — 그대로 유지. 이번 사이클은 "데이터가 어디 있는가"만 다루고 "언제 반영되는가" 정책은 바꾸지 않는다.
- **삭제 성공 시 상세 캐시 강제 정리** — 여전히 하지 않는다(재요청 레이스 방지, `playlist-detail-caching` #193에서 확정).
- `usePlaylistRecommendations`의 로딩/에러 UX(mock 폴백) 통합.
- `apps/api`, `packages/dto` 변경 — 이번 사이클은 순수 `apps/web` 프론트엔드 변경이다.

## Behavior Invariants

- 최초 마운트 시 `getPlaylistDetail`(`usePlaylistDetail` 경유) 1회 호출, 성공 시 곡 목록 렌더링, 실패 시 `toast.error('플레이리스트 정보를 불러오지 못했습니다.')` 후 아무것도 렌더링하지 않는다.
- 곡 순서 변경(`moveSong`/`moveSongTo`)과 곡 삭제(`deleteSelectedSongs`, 내부적으로 `requestChangeOrder` 공유)는 API 응답 전에 즉시 반영된다(낙관적) — 실패해도 롤백하지 않는다(현재 동작 유지).
- 곡 추가(`handleAddSong`)는 낙관적 업데이트 없이, API 성공 응답 이후에만 반영된다.
- 제목 편집: `MAX_PLAYLIST_TITLE_LENGTH` 초과 시 저장 차단(에러 문구 표시), 빈 문자열/미변경 시 조기 종료, 성공 후에만 반영(낙관적 아님).
- 삭제는 `ConfirmOverlay` 확인 후에만 실행되고, 성공 시 모달이 닫힌다. 성공 후에도 상세 캐시를 강제로 지우지 않는다(재요청 레이스 방지).
- 각 액션(제목수정/곡추가/순서변경/삭제) 실패 시 `toast.error('요청 처리에 실패했습니다.')` 표시와 `console.error` 로깅이 유지된다.
- `usePlaylistRecommendations.selectPlaylist`가 이 캐시(`playlistDetailQueryKey`)를 `ensureQueryData`로 재사용하는 동작, 실패 시 `MOCK_PLAYLIST_DETAILS` 폴백은 그대로 유지된다.
- 목록(`['playlists']`) 캐시는 각 mutation 성공 후 `invalidateQueries`로 최종 일치만 보장한다(즉시 동기화 아님) — 유지.
- 같은 `playlistId`를 `PlaylistDetailModal`과 `usePlaylistRecommendations`가 순차 조회할 때 캐시를 공유해 중복 네트워크 요청이 없는 동작(`playlist-detail-caching` Success Criteria)은 계속 유지된다.

## 목표 인터뷰 결과 (AskUserQuestion)

**Q. Header(12개 prop)/SongList/Toolbar의 prop drilling과 PlaylistDetailModal.tsx의 파일 조직(로직이 컴포넌트 안에 전부 inline vs 별도 훅 파일 분리) 문제도 이번 사이클에 포함할까요?**
A. 데이터 소유권 통합만(추천). 이유: 이 지점은 이전 사이클(#189)에서 이미 한 번 재시딩 버그가 났던 곳이다. 같은 사이클에서 컴포넌트 경계까지 같이 바꾸면, 문제가 생겼을 때 원인이 "소스 통합" 때문인지 "Context 전환" 때문인지 구분하기 어려워져 회귀 위험이 늘어난다는 진단을 그대로 채택. Header/SongList/Toolbar Context 전환과 훅 파일 분리는 Out of Scope로 남기고 Follow-ups 후보로 기록한다.

**Q. 이번 데이터 소유권 통합에서 가장 중요하게 볼 기준은 무엇인가요?**
A. 일관성/근본 해결(추천). 이유: `usePostDetail`과 완전히 동일한 패턴으로 통일해, 재시딩 버그가 구조적으로 다시 발생할 수 없게 만드는 방향을 채택. 이 결정이 ADR 3안 비교에서 "안 2(경계 재설계)"류의 완전 통합 쪽에 무게를 싣는 근거로 쓰인다.

**Q. 위 Behavior Invariants와 Success Criteria 초안을 코드·기존 테스트(38개)에서 그대로 도출했습니다. 이대로 확정해도 될까요?**
A. 제시된 대로 확정(추천).

## 기준선 검증

| 명령             | 결과 | 실패 항목 | 비고                                                                    |
| ---------------- | ---- | --------- | ----------------------------------------------------------------------- |
| pnpm lint        | 성공 | 없음      | turbo 6개 패키지(dto/ui/api/web 등), web만 cache miss, 나머지 cache hit |
| pnpm check-types | 성공 | 없음      | web check-types 실행(cache miss), dto/ui cache hit                      |
| pnpm test        | 성공 | 없음      | web 48 suites/264 tests, api 8 suites/37 tests 모두 통과                |
| pnpm build       | 성공 | 없음      | web 프로덕션 빌드 성공(Turbopack, 12개 라우트 정상 생성)                |

- playlist 도메인만 별도 실행(`pnpm test -- --testPathPatterns="[Pp]laylist"`, apps/web): **5 suites / 38 tests** 통과 — `PlaylistDetailModal.test.tsx`(20), `PlaylistPickerModal.test.tsx`, `usePlaylistDetail.test.ts`, `usePlaylistRecommendations.test.ts`, `PlaylistDetailCacheSharing.integration.test.tsx`.
- `playlistDetailQueryKey` 캐시에 쓰는(`setQueryData`) 지점은 `PlaylistDetailModal.tsx` 3곳(`changeOrderMutation`/`addSongMutation`/`renameMutation`)뿐이다(grep 확인, delete는 캐시 쓰기 없음).
- 변경 영향 예상 파일: `PlaylistDetailModal.tsx`(핵심), 관련 테스트 1~2개 — `usePlaylistDetail.ts`/`usePlaylistRecommendations.ts`/`query-keys/playlist.ts`는 이미 완성된 인프라라 수정 불필요할 가능성이 높음(ADR 단계에서 확정).
- 번들 크기·빌드 시간 증분: 측정 불가 — 새 라이브러리 도입이 없고(TanStack Query는 이미 의존성 포함) 변경 범위가 파일 1~2개 수준이라 유의미한 증분이 예상되지 않지만, PRD 단계에서 별도 측정은 하지 않음.

---

**[GATE 1]** 위 진단·목표·범위·Behavior Invariants·기준선을 확인해주시면 다음 단계(ADR)로 넘어가겠습니다.
