# Result — playlist-detail-orchestration

## 변경 요약

| 이슈 | 내용                                                                                                                                                                                                                                                                                                                                                                     |
| ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| #281 | `hooks/playlist/usePlaylistDetailModal.ts` 신설 — `PlaylistDetailModal.tsx`에 inline돼 있던 로컬 state 6개, mutation 4개, 파생 핸들러 전부, 조회 실패 toast `useEffect`를 이관. 반환 객체는 `titleEditing`/`selection`/`search`/`confirmDelete`로 관심사별 그룹핑(`usePostDetailModal`의 `editing`/`player` 선례 참고). 컴포넌트는 훅을 호출해 JSX만 조립(251줄 → 71줄). |
| #282 | dead code 없음 확인(lint/check-types 클린), `docs/component-hook-audit/index.html`에 이 사이클과 정확히 일치하는 finding은 없음을 확인(감사 당시엔 "훅 vs 컴포넌트 조직" 축이 아니라 "로컬 state vs 캐시" 축으로만 다뤄졌음 — 별도 갱신 불필요), 이 문서(`result.md`) 작성.                                                                                              |

## Before / After

| 항목                                                                      | Before(prd.md 기준선)             | After                                                                                                      |
| ------------------------------------------------------------------------- | --------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `PlaylistDetailModal.tsx` 줄 수                                           | 251줄                             | **71줄**(-180)                                                                                             |
| 신규 `usePlaylistDetailModal.ts`                                          | 없음                              | **280줄**(신규)                                                                                            |
| `PlaylistDetailModal.tsx` 안의 `useState`/`useMutation`                   | `useState` 6개, `useMutation` 4개 | **0개** — 전부 훅으로 이관, Success Criteria 그대로 충족                                                   |
| `Header`/`SongList`/`Toolbar`가 받는 prop                                 | 이름·타입·값 특정 세트            | **변경 없음** — 훅의 그룹 필드(`titleEditing.handleStartRename` 등)를 그대로 대입만 전환                   |
| `PlaylistDetailModal.test.tsx`                                            | 21개 테스트, 전부 통과            | **21개, 수정 없이 그대로 통과**(Success Criteria 그대로 충족)                                              |
| playlist 도메인 테스트(`pnpm exec jest --testPathPatterns="[Pp]laylist"`) | 5 suites / 39 tests               | **5 suites / 39 tests**(변경 없음, 회귀 없음)                                                              |
| `pnpm test`(web 전체)                                                     | 49 suites / 275 tests             | **49 suites / 275 tests**(변경 없음, 회귀 없음 — 신규 테스트를 추가하지 않기로 한 목표 인터뷰 결정과 일치) |
| `pnpm lint`/`check-types`/`build`                                         | 전부 통과                         | 전부 통과(회귀 없음)                                                                                       |
| 변경 파일(diff stat, main 대비, `apps/web`)                               | —                                 | 2개 파일, 306(+)/206(-)줄 — PRD가 예상한 "파일 2개" 범위 그대로                                            |

## 개발환경 실동작 확인

- `packages/dto`는 변경하지 않아 `pnpm dto` 재빌드는 필요 없었다(순수 `apps/web` 컴포넌트/훅 이동).
- `docker compose up -d`(mysql/neo4j/redis)로 실제 인프라를 띄우고 `pnpm dev`(api+web)를 백그라운드로 실행, 컴파일 에러/런타임 에러 없이 두 서버 모두 정상 기동을 dev 로그로 확인했다(`web:dev`가 `✓ Ready in 1614ms`, `api:dev`가 `Found 0 errors`, 이후 로그에 `error`가 의도된 `console.error`/`onError` 외에는 없음을 `grep`으로 확인).
- `POST /api/auth/login/tmp`로 시드 사용자(`user1Id`) JWT를 발급받아, 새 훅이 실제로 호출하는 엔드포인트를 직접 확인했다:
  - `GET /api/playlist` — 목록 정상 반환.
  - `GET /api/playlist/{seedPlaylistId}` — `usePlaylistDetail`이 구독하는 상세 조회, `musics` 배열 포함 정상 반환(테스트 mock 형태와 일치).
  - `PATCH /api/playlist/{id}` — `renameMutation.mutationFn`이 기대하는 요청/응답 계약(`{id, title}`만 반환)이 실제 서버 동작과 일치함을 확인. 제목을 바꿨다가 원래 값으로 되돌려 데이터 원상복구.
- `curl`로 `/archive`(플레이리스트 상세 모달이 열리는 진입점) 라우트가 200으로 응답함을 확인했다.
- **직접 확인하지 못한 부분**: 실제 브라우저에서 모달을 열어 제목 편집·곡 추가·순서 변경·삭제를 시각적으로 조작해보는 것은 이 샌드박스에 브라우저 자동화 도구가 없어 확인하지 못했다(이전 사이클들과 동일한 제약). 다만 이번 변경은 **순수 코드 이동**(동작 변경 없음)이라, 이 위험은 다른 사이클보다 낮다 — 핵심 위험(코드 이동 후 렌더링·mutation 로직이 동일하게 동작하는가)은 jsdom 기반 통합 테스트(`PlaylistDetailModal.test.tsx` 21개, 실제 React 렌더 트리와 TanStack Query 캐시를 동작시켜 DOM으로 검증)와 실제 API 계약 확인(`curl`)으로 커버했다. 사용자가 로컬에서 실제로 플레이리스트 상세를 열어 4개 액션을 한 번씩 조작해보면 좋다.
- 사용 후 `docker compose down`으로 인프라를 정리했다.

## Behavior Verification

prd.md의 Behavior Invariants를 모두 확인했다:

- ✅ 4개 액션(제목수정/곡추가/순서변경/삭제) 각각의 성공/실패/유효성검사 동작 — 기존 21개 테스트 전부 수정 없이 통과.
- ✅ 순서변경만 `onMutate`에서 낙관적으로 반영되는 비대칭 — 코드를 그대로 옮겼을 뿐 로직 변경 없음, 관련 테스트 무수정 통과.
- ✅ 실패 시 낙관적 반영값 롤백 없음 — 무수정 통과.
- ✅ 삭제 성공 시 상세 캐시 강제 정리 없음 — 무수정 통과(`getPlaylistDetail` 추가 호출 없음을 직접 검증하는 기존 테스트 포함).
- ✅ 연속 mutation 후 `getPlaylistDetail` 추가 호출 없음(재시딩 없음) — 무수정 통과.
- ✅ `Header`/`SongList`/`Toolbar`가 받는 prop 이름·타입·값 불변 — 구현 중 직접 대조 확인(위 Before/After 표).

ADR의 회귀 시나리오 6개도 전부 확인:

| 회귀 시나리오                                                 | 결과                                                              |
| ------------------------------------------------------------- | ----------------------------------------------------------------- |
| 최초 마운트 시 `getPlaylistDetail` 1회 호출 후 곡 목록 렌더링 | ✅ 무수정 통과                                                    |
| 4개 액션 각각의 성공/실패/유효성검사                          | ✅ 21개 전부 무수정 통과                                          |
| 4개 액션 성공 시 `playlistDetailQueryKey` 캐시 반영           | ✅ 무수정 통과                                                    |
| 연속 mutation 후 추가 `getPlaylistDetail` 호출 없음           | ✅ 무수정 통과                                                    |
| 모달↔추천 위젯 캐시 공유                                      | ✅ 무수정 통과(`PlaylistDetailCacheSharing.integration.test.tsx`) |
| `Header`/`SongList`/`Toolbar` prop 이름·타입·값 불변          | ✅ 코드 리뷰로 직접 대조 확인                                     |

## Decision Review

ADR에서 선택한 안 2(경계 재설계, 오케스트레이션 전체를 훅으로 추출)의 예상과 실제 비교:

- **예상**: 4개 mutation·6개 state·핸들러 모두 순수 로직이라 그대로 잘라 옮기면 된다 — 실제로 정확히 그랬다. `usePlaylistDetailModal.ts`는 컴포넌트에서 그대로 잘라낸 코드이고 새로 작성한 로직이 없다.
- **예상하지 못했던 점**: `react/jsx-handler-names` 린트 규칙이 `on*` prop에 연결되는 값이 멤버 표현식(`titleEditing.start` 같은)일 때 그 멤버 이름이 `handle`로 시작해야 한다고 요구한다는 것을 구현 중 처음 확인했다(이 저장소는 `checkLocalVariables: false`라 평범한 지역 변수 `startRename`처럼 전달할 땐 이 검사를 건너뛰지만, 그룹핑된 객체의 멤버로 전달하면 검사 대상이 된다). ADR이 제안한 그룹핑(`titleEditing: { start, change, commit, cancel }`)을 그대로 쓰면 lint가 8건 실패했다 — `handleStartRename`/`handleChangeTitle`/`handleCommitRename`/`handleCancelRename`/`handleRequestDelete`/`handleCancelDelete`/`handleConfirmDelete`/`handleQueryChange`로 필드명을 조정해 해결했다. 결과적으로 `CLAUDE.md`가 이미 명시한 "이벤트 핸들러는 예외 없이 `handleXxx` 접두사" 컨벤션과 오히려 더 잘 맞는 이름이 됐다 — 우회가 아니라 기존 컨벤션에 맞춘 정정이었다.
- **예상**: PRD Goal(조직 일관성 완전 달성)을 완전히 달성한다 — `PlaylistDetailModal.tsx`에 `useState`/`useMutation`이 더 이상 나타나지 않고, `usePostDetailModal`/`useContentWrite`와 동일한 형태(훅이 typed result 반환, 컴포넌트는 조립만)가 됐다.
- **체크포인트 2개로 줄인 판단**(이전 두 사이클 3개 대비): 목표 인터뷰에서 신규 안전망(renderHook 테스트)이 필요 없다고 이미 확정했기 때문에 가능했던 선택이었고, 실제로도 별도 안전망 구축 없이 기존 21개만으로 충분했다.

## Remaining Debt

- 백로그 `#275`(Header/SongList/Toolbar prop drilling → Context 전환)는 이번 사이클에서 의도적으로 범위 밖으로 뒀다. 이제 `usePlaylistDetailModal`의 반환값을 그대로 Context로 감싸면 되어(PRD가 예상한 기대 효과) 착수 비용이 낮아졌다.
- 4개 mutation의 낙관적 업데이트 정책 비대칭과 보일러플레이트 중복(백로그 `#218`)은 이전 사이클과 동일하게 유지(전제 변화 없음).

## Follow-ups

- `#275`는 이 사이클이 만든 `usePlaylistDetailModal`을 전제로 착수하는 것을 권장 — 훅의 반환값을 Context로 감싸는 작업이라 범위가 작아진다.
- `#218`(공용 mutation 팩토리)은 이번 ADR에서도 안 3을 기각하며 재확인됐다 — 저장소 전체(post 포함) mutation 보일러플레이트를 같이 보고 결정하는 게 맞다는 근거가 그대로 유효하다.
- 부모 이슈 #276은 이 2개 체크포인트로 완결됐으므로 종료한다.

---

**[GATE 3]** 위 Before/After, 개발환경 실동작 확인, Behavior Verification, 남은 부채를 확인해주시면 이 리팩터링 사이클을 종료하겠습니다.
