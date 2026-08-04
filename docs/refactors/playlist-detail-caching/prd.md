# PRD — playlist-detail-caching

## 문제 정의

`server-state-caching`(#148)에서 플레이리스트 **목록**(`usePlaylists()`, `['playlists']`)은 캐시를 공유하게 됐지만, **상세**(`getPlaylistDetail`)는 ADR에서 명시적으로 다루지 않은 채 두 소비처(`PlaylistDetailModal`, `usePlaylistRecommendations.selectPlaylist`)가 각자 독립적으로 페칭·보관한다. 이 상태가 `docs/tanstack-query/index.html` 작성 중 Remaining Debt로 재확인됐고, 이슈 #186으로 등록됐다.

같은 급의 문제(상세 데이터가 여러 진입점에서 캐시 미공유)를 게시글 상세(`postDetailQueryKey`)에서 이미 한 번 해결한 전례가 있어, 이번 사이클은 그 패턴을 플레이리스트 상세에도 적용할 수 있는지 검증한다.

## 비판적 진단 (시니어 개발자 시각)

### 근거

- **Fact** — `getPlaylistDetail`을 호출하는 지점은 정확히 2곳이다: `apps/web/src/components/modals/PlaylistDetailModal/PlaylistDetailModal.tsx:37`(`initialFetchPlaylist`)와 `apps/web/src/hooks/playlist/usePlaylistRecommendations.ts:63`(`selectPlaylist`). 둘 다 쿼리 캐시 없이 `useState`/지역 변수로 결과를 보관한다.
- **Fact** — `PlaylistDetailModal`의 변경 액션 4곳(`requestChangeOrder:69`, `handleAddSong:112`, `commitRename:143`, 삭제 confirm 콜백:216) 모두 성공 후 `bumpPlaylistRefresh()`(`queryClient.invalidateQueries({queryKey: PLAYLISTS_QUERY_KEY})`)를 호출해 **목록** 캐시만 무효화하고, 상세 자체는 각 핸들러가 로컬 `setSongs`/`setPlaylist` 호출로 손으로 반영한다.
- **Fact** — `usePlaylistRecommendations`는 `MusicSearch.tsx`(ContentWriteModal 하위, 곡 검색 시 플레이리스트에서 곡을 골라오는 화면)에서만 소비되며, `selectPlaylist`는 순수 조회용이다 — 이 훅 경로에는 플레이리스트를 변경하는 액션이 없다.
- **Fact** — 목록 아이템(`PlaylistBriefResDto`: `id`/`title`/`tracksCount`/`firstAlbumCoverUrl`)과 상세(`GetPlaylistDetailResDto`: `id`/`title`/`musics`)는 겹치는 필드(`id`, `title`)와 겹치지 않는 필드(목록만의 `tracksCount`/`firstAlbumCoverUrl`, 상세만의 `musics`)가 섞여 있다 — 같은 `playlistId`라도 두 캐시를 하나로 합칠 수는 없고, 별도 캐시 + 정합성 규칙이 필요하다.
- **Fact** — `PlaylistDetailModal.test.tsx`, `usePlaylistRecommendations.test.ts`에 이미 `createQueryClientWrapper`/`createTestQueryClient` 테스트 유틸이 쓰이고 있다 — `usePlaylists` 전환 때 만든 테스트 인프라를 그대로 재사용할 수 있다(Fact, `server-state-caching` 사이클의 잔존 자산).
- **Fact** — 기준선 시점(`pnpm test`) 기준 `PlaylistDetailModal.test.tsx`는 배경 클릭 닫힘 특성화 테스트 1개뿐이고, 4개 변경 액션(제목수정/곡추가/순서변경/삭제) 자체에 대한 characterization test는 없다 — 이번 전환의 안전망이 얇다.
- **Inference** — `usePlaylistRecommendations`의 `selectedPlaylistId`(로딩 표시용)·`detailErrorMessage`(mock 폴백 메시지)와 `PlaylistDetailModal`의 toast 기반 에러 처리는 같은 종류의 요청(상세 조회)에 대해 서로 다른 로딩/에러 UX 계약을 갖고 있다 — 캐시를 공유해도 이 UX 계약 차이 자체는 자동으로 사라지지 않는다(별도 결정 필요).
- **Inference** — 목록-상세 정합성은 오늘도 "즉시 동기화"가 아니라 "목록 무효화 → 재조회로 최종 일치"다(`commitRename`이 로컬 `playlist.title`은 즉시 바꾸고, 목록은 `invalidateQueries`로 별도 재조회). 즉 정합성 수준 자체는 지금도 최종 일치이며, 이번 리팩터링이 그 수준을 낮추는 것은 아니다.

### 증상 → 원인 체인

같은 `playlistId`를 모달(`PlaylistDetailModal`)과 곡 검색 위젯(`usePlaylistRecommendations`)에서 순차적으로 열면 캐시가 공유되지 않아 매번 새로 네트워크 요청한다 → (왜?) 두 소비처가 `getPlaylistDetail`을 직접 호출하고 결과를 지역 `useState`로만 보관한다 → (왜?) `server-state-caching`(#148) 사이클이 캐시화 대상을 "목록(`usePlaylists`)"으로만 확정하고 상세는 범위에 넣지 않았다(구조 원인: 상세 조회 경로에 공유 캐시 계층이 아직 없음).

### 아키텍처 관점

- 이 문제는 이 모듈에 국한되지 않는다 — `postDetailQueryKey(postId)`가 게시글 상세에서 이미 겪고 해결한 것과 같은 클래스("리소스 상세를 여러 진입점이 각자 캐싱")다. 다만 게시글 상세와 달리 플레이리스트 상세는 **자체 변경 액션 4개**를 갖고 있어 단순 조회 캐시화보다 범위가 넓다.
- 기존 컨벤션(`CLAUDE.md`의 "서버 상태와 UI 상태를 같은 종류로 취급하지 않는다")과 충돌하지 않는다 — 오히려 이 원칙을 상세 조회 경로에도 마저 적용하는 방향이다.
- 이전 ADR(`server-state-caching`)과 충돌하지 않는다 — 그 ADR은 상세를 Out of Scope로 "미룬" 것이지, "하지 않기로" 결정한 적은 없다(같은 문서에 "authMe, 게시글상세 전환은 다음 이슈"라는 식으로 순차 확장을 전제).
- "당시엔 맞았지만 전제가 깨진" 결정이라기보다, 애초에 사이클 크기를 통제하기 위해 의도적으로 좁혀둔 범위다 — 이번 사이클은 그 다음 조각을 다루는 것이다.

### 비판적 재검토 (사용자 문제 제기에 대한 반박 질문과 답)

- **이 증상이 정말 구조 문제인가, 아니면 우연한 버그인가?** 구조 문제다. `usePlaylistRecommendations`가 `usePlaylistRefreshStore` nonce 구독을 빠뜨렸던 #139/#148의 재현 버그와 동일한 클래스(수동 동기화 계약을 어딘가에서 빠뜨리는 패턴)가, 이번엔 "상세 캐시 자체가 아예 없다"는 형태로 나타난다. 다만 목록 사례(#139)와 달리 이번엔 **아직 실사용자가 재현·보고한 버그가 아니다** — 캐시 미공유가 실제로 눈에 보이는 문제(오래된 상세가 보임 등)를 일으켰다는 관찰 사례는 이번 조사에서 없었다. 이 점은 솔직히 밝혀둔다.
- **지금 안 고치면 다음 몇 번의 변경에서 구체적으로 어떤 비용이 드는가?** `PlaylistDetailModal`에 변경 액션이 추가될 때마다(예: 곡 검색 위젯에서도 플레이리스트를 바로 수정하게 확장) 캐시 계층이 없으므로 각 액션이 로컬 state와 목록 invalidate를 손으로 재구현해야 한다 — 이미 4곳이 거의 동일한 `try/toast.error/console.error` 패턴을 반복 중이다(변경 빈도 근거: 이 모달은 `server-state-caching`, `feed-list-query-migration` 두 사이클 모두에서 참조된 활성 영역).
- **더 급한 다른 문제를 가리는 건 아닌가?** 이번 조사에서 발견한 더 급한 문제는 없다. 다만 `PlaylistDetailModal`의 characterization test 공백(배경 클릭 1개뿐)이 이번 전환의 실질적 리스크이므로, 회귀 안전망 확보가 이번 사이클의 선행 작업이 되어야 한다(ADR 단계에서 다룬다).

## 목표와 범위

### Goal

`PlaylistDetailModal`과 `usePlaylistRecommendations.selectPlaylist`가 같은 `playlistId`에 대해 하나의 쿼리 캐시(`['playlistDetail', playlistId]`류)를 공유하도록 전환한다.

### Success Criteria

- 같은 `playlistId`를 두 진입점에서 순차적으로(캐시 staleTime 내에) 열면, 두 번째 진입점은 네트워크 요청을 생략하고 캐시를 재사용한다 — 이를 검증하는 계약 테스트를 추가한다.
- `PlaylistDetailModal`의 4개 변경 액션(제목수정/곡추가/순서변경/삭제) 이후에도 목록(`['playlists']`) 캐시와의 정합성은 **최종 일치** 수준(현재와 동일 — 다음 무효화/재조회 시점에 반영)을 유지한다. 즉시 동기 패치는 이번 사이클의 목표가 아니다.
- 기존 Behavior Invariants가 모두 통과하고, `lint`/`check-types`/`test`/`build`가 기존과 동일하게 통과한다.

### Out of Scope

- `usePlaylistRecommendations`/`PlaylistDetailModal`의 로딩/에러 UX(toast vs mock-fallback) 통합.
- 목록-상세 즉시 동기화(`setQueryData`로 목록 캐시를 직접 패치하는 설계) — 최종 일치로 충분하다고 판단.
- `ArchiveView`/`ArchiveViewHeader`의 `bumpPlaylistRefresh` 호출부 등 목록 무효화 패턴 자체의 재검토 — `PlaylistDetailModal`, `usePlaylistRecommendations`, 신규 쿼리 훅으로 변경 범위를 한정한다.
- `PlaylistPickerModal`(상세를 쓰지 않고 목록만 사용) — 이번 범위와 무관.
- `apps/api`, `packages/dto` 변경.

## Behavior Invariants

- 곡 순서 변경(`moveSong`/`moveSongTo`/`deleteSelectedSongs`)의 낙관적 로컬 반영(요청 전 즉시 UI 갱신)은 유지된다.
- 곡 추가(`handleAddSong`)는 현재도 낙관적 업데이트가 없다(주석: "song id가 필요해서 안 됨") — 이 제약은 유지된다.
- 제목 인라인 편집의 유효성 검사(`MAX_PLAYLIST_TITLE_LENGTH`, 빈 문자열/미변경 시 조기 반환)는 유지된다.
- 삭제는 `ConfirmOverlay` 확인 후에만 실행되는 흐름을 유지한다.
- 각 액션 실패 시 `toast.error` 메시지와 `console.error` 로깅은 유지된다.
- `usePlaylistRecommendations.selectPlaylist`가 실패 시 `MOCK_PLAYLIST_DETAILS` 폴백으로 대체하는 동작은 유지된다.
- 성공 시 목록(`['playlists']`) 캐시가 최종적으로 갱신되는 것은 유지되지만, 그 시점이 상세 변경과 동기일 필요는 없다(Success Criteria 참고).

## 목표 인터뷰 결과 (AskUserQuestion)

**Q. 이번 리팩터링의 핵심 목표 범위는 무엇인가요? (캐시 공유만 vs 로딩/에러 UX까지 통합)**
A. 캐시 공유만(추천). 이유: 두 소비처의 UX 요구사항(모달의 toast vs 위젯의 mock-fallback)이 실제로 달라, 억지로 통일하면 각자의 맥락에 안 맞는 절충안이 나올 위험이 있다는 진단 근거를 그대로 채택.

**Q. 목록(`['playlists']`) 캐시와 상세 캐시 간 정합성을 얼마나 보장해야 하나요? (제목 변경 시 목록에 반영되는 시점 기준)**
A. 최종 일치(추천). 이유: 현재도 이 수준이고, 이로 인한 사용자 불만·버그 재현 사례가 없어 더 엄격한 기준을 요구할 근거(Fact)가 없다는 진단을 그대로 채택.

**Q. 이번 사이클에서 손댈 수 있는 파일 범위는 어디까지인가요?**
A. `PlaylistDetailModal` + `usePlaylistRecommendations`만(추천). 이유: 목록 무효화 호출부(`ArchiveView`/`ArchiveViewHeader`)는 #148에서 이미 정리된 안정적 패턴이라 다시 손댈 이유가 없고, 범위를 넓히면 회귀 위험만 늘어난다는 진단을 그대로 채택.

**Q. 성공 판단 기준에 "같은 playlistId를 두 진입점에서 순차적으로 열면 두 번째는 네트워크 요청을 생략한다"를 계약 테스트로 명시할까요?**
A. 포함(추천). 이유: 이 리팩터링이 실제로 해결하려는 문제(중복 요청/캐시 미공유)를 직접 검증하는 유일한 방법이라는 진단을 그대로 채택.

## 기준선 검증

| 명령             | 결과 | 실패 항목 | 비고                                                       |
| ---------------- | ---- | --------- | ---------------------------------------------------------- |
| pnpm lint        | 성공 | 없음      | web lint 실행(cache miss), 나머지 패키지 cache hit         |
| pnpm check-types | 성공 | 없음      | web check-types 실행(cache miss), dto/ui cache hit         |
| pnpm test        | 성공 | 없음      | api 2 suites, web 34 suites/171 tests 모두 통과(cache hit) |
| pnpm build       | 성공 | 없음      | web 프로덕션 빌드 성공(FULL TURBO, 전 패키지 cache hit)    |

- 플레이리스트 관련 테스트만 별도 실행(`pnpm test -- playlist`): 3 suites, 7 tests 통과 — `PlaylistDetailModal.test.tsx`(1), `usePlaylistRecommendations.test.ts`(3), `PlaylistPickerModal.test.tsx`(3).
- 변경 영향 예상 파일: `PlaylistDetailModal.tsx`, `usePlaylistRecommendations.ts`, 신규 쿼리 훅 파일 1개, 관련 테스트 2~3개 — 측정 불가(실제 구현 전이라 확정값 아님, ADR 단계 이슈 분해에서 구체화).
- 번들 크기·빌드 시간 증분: 측정 불가 — 새 라이브러리 도입이 없어(TanStack Query는 이미 의존성에 포함) 유의미한 증분이 예상되지 않지만, 이번 PRD 단계에서 별도 측정은 하지 않음.

---

**[GATE 1]** 위 진단·목표·범위·Behavior Invariants·기준선을 확인해주시면 다음 단계(ADR)로 넘어가겠습니다.
