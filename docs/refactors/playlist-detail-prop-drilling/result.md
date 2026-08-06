# Result — playlist-detail-prop-drilling

## 변경 요약

| 이슈 | 내용                                                                                                                                                                                                                                                                                                                                                                                    |
| ---- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| #285 | `PlaylistDetailModalContext.tsx` 신설 — `PostDetailModalContext`/`ContentWriteContext`와 동일한 3단 구조(`PlaylistDetailModalValueProvider`/`PlaylistDetailModalProvider`/`usePlaylistDetailModalContext`). `Header`(12개→0개)/`SongList`(5개→0개)/`Toolbar`(2개→0개)를 zero-prop으로 전환. `PlaylistDetailModal.tsx`를 Provider로 감싸고 `PlaylistDetailModalPanel`(조립 전용)만 남김. |
| #286 | dead code 없음 확인(lint/check-types 클린), 이 문서(`result.md`) 작성.                                                                                                                                                                                                                                                                                                                  |

## Before / After

| 항목                                                                      | Before(prd.md 기준선)                                  | After                                                                              |
| ------------------------------------------------------------------------- | ------------------------------------------------------ | ---------------------------------------------------------------------------------- |
| `Header` prop 수                                                          | 12개(저장소 최다)                                      | **0개**                                                                            |
| `SongList` prop 수                                                        | 5개                                                    | **0개**                                                                            |
| `Toolbar` prop 수                                                         | 2개                                                    | **0개**                                                                            |
| `PlaylistDetailModal.tsx`의 `Header`/`SongList`/`Toolbar` prop 전달 코드  | JSX에서 훅 그룹 값을 낱개로 풀어 12+5+2=19개 prop 전달 | **없음** — `<Header />`/`<SongList />`/`{... && <Toolbar />}`만 남음               |
| 신규 `PlaylistDetailModalContext.tsx`                                     | 없음                                                   | **40줄**(신규, `PostDetailModalContext.tsx`/`ContentWriteContext.tsx`와 동일 구조) |
| `PlaylistDetailModal.test.tsx`                                            | 21개 테스트, 전부 통과                                 | **21개, 수정 없이 그대로 통과**(Success Criteria 그대로 충족)                      |
| playlist 도메인 테스트(`pnpm exec jest --testPathPatterns="[Pp]laylist"`) | 5 suites / 39 tests                                    | **5 suites / 39 tests**(변경 없음, 회귀 없음)                                      |
| `pnpm test`(web 전체)                                                     | 49 suites / 275 tests                                  | **49 suites / 275 tests**(변경 없음, 회귀 없음)                                    |
| `pnpm lint`/`check-types`/`build`                                         | 전부 통과                                              | 전부 통과(회귀 없음)                                                               |
| 변경 파일(diff stat, main 대비, `apps/web`)                               | —                                                      | 5개 파일, 111(+)/101(-)줄 — PRD가 예상한 "파일 4~5개" 범위 그대로                  |

## 개발환경 실동작 확인

- `packages/dto`는 변경하지 않아 `pnpm dto` 재빌드는 필요 없었다(순수 `apps/web` 컴포넌트/Context 변경).
- `docker compose up -d`(mysql/neo4j/redis)로 실제 인프라를 띄우고 `pnpm dev`(api+web)를 백그라운드로 실행, 컴파일 에러/런타임 에러 없이 두 서버 모두 정상 기동을 dev 로그로 확인했다(`web:dev`가 `✓ Ready in 1437ms`, `api:dev`가 `Found 0 errors`, 이후 로그에 의도된 `console.error`/`onError` 외 `error`가 없음을 `grep`으로 확인).
- 이번 사이클은 API 계약을 전혀 바꾸지 않는 순수 프론트엔드 배선 변경(prop → Context)이라, 가장 중요한 실동작 확인은 "배럴 import 정리 후 발생했던 module factory 에러"(스킬이 언급한 PR #84 사례) 같은 웹팩/모듈 해석 에러가 재현되지 않는가였다 — dev 서버가 컴파일 에러 없이 기동했고, 시드 사용자 JWT로 `GET /api/playlist/{seedPlaylistId}`를 호출해 `usePlaylistDetailModal`이 구독하는 데이터가 정상 반환됨을 확인했다(4곡 포함).
- `curl`로 `/archive`(플레이리스트 상세 모달이 열리는 진입점) 라우트가 200으로 응답함을 확인했다.
- **직접 확인하지 못한 부분**: 실제 브라우저에서 모달을 열어 `Header`/`SongList`/`Toolbar`가 시각적으로 올바르게 렌더링되는지 확인하는 것은 이 샌드박스에 브라우저 자동화 도구가 없어 확인하지 못했다(이전 사이클들과 동일한 제약). 다만 이번 변경은 값의 전달 경로만 바꾸는 순수 배선 변경(값 자체·계산 로직 무변경)이라 위험이 낮고, 핵심 위험(Context 전환 후에도 동일한 DOM이 렌더링되는가)은 jsdom 기반 통합 테스트(`PlaylistDetailModal.test.tsx` 21개, 수정 없이 통과)로 커버했다. 사용자가 로컬에서 실제로 플레이리스트 상세를 열어 4개 액션을 한 번씩 조작해보면 좋다.
- 사용 후 `docker compose down`으로 인프라를 정리했다.

## Behavior Verification

prd.md의 Behavior Invariants를 모두 확인했다:

- ✅ 4개 액션(제목수정/곡추가/순서변경/삭제) 각각의 성공/실패/유효성검사 동작 — 기존 21개 테스트 전부 수정 없이 통과.
- ✅ `Header`/`SongList`/`Toolbar`의 렌더링 결과가 Context 전환 전후 동일 — 값 자체와 계산 로직을 바꾸지 않았고(순수 배선 변경), 21개 테스트의 DOM assertion이 그대로 통과.
- ✅ `SongList` 내부 `SongItem`의 `usePlayerStore` 직접 구독과 재생 동작 — 무변경(해당 코드 자체를 손대지 않음).
- ✅ 모달 진입 방식(`ModalContainer`가 `playlistId` prop으로 마운트) — 목표 인터뷰에서 확정한 대로 유지, `ModalContainer.tsx` 무변경.

ADR의 회귀 시나리오 5개도 전부 확인:

| 회귀 시나리오                                                  | 결과                                                                                                                                                                         |
| -------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 최초 마운트 시 곡 목록·헤더 정상 렌더링                        | ✅ 무수정 통과                                                                                                                                                               |
| 4개 액션 각각의 성공/실패/유효성검사                           | ✅ 21개 전부 무수정 통과                                                                                                                                                     |
| `Toolbar`가 선택된 곡이 있을 때만 노출                         | ✅ 무수정 통과                                                                                                                                                               |
| `SongItem`의 `usePlayerStore` 직접 구독 동작 불변              | ✅ 무수정 통과                                                                                                                                                               |
| `Header`/`SongList`/`Toolbar`가 Context 밖에서 렌더링되면 에러 | ✅ `usePlaylistDetailModalContext must be used within...` 에러 발생(선례와 동일 계약, `PlaylistDetailModalProvider`가 유일한 마운트 경로라 실제 앱 코드에서는 발생하지 않음) |

## Decision Review

ADR에서 선택한 안 2(경계 재설계, Context 3단 구조)의 예상과 실제 비교:

- **예상**: 이미 2번 검증된 패턴을 3번째로 그대로 적용해 동작 보존 난이도가 가장 낮다 — 실제로 정확히 그랬다. `Header`/`SongList`/`Toolbar`는 값을 prop 대신 Context에서 읽는 것 외엔 JSX 본문을 거의 그대로 유지했다.
- **예상하지 못했던 점**: `#281`(오케스트레이션 훅 추출)에서 이미 겪었던 `react/jsx-handler-names` 문제가 이번에도 `Toolbar`에서 재발했다 — `onClick={selection.deleteSelected}`처럼 멤버 표현식을 `on*` prop에 직접 연결하면 lint가 실패한다. `#281`에서는 훅의 반환 필드명 자체를 `handle*`로 바꿔 해결했지만, 이번엔 `selection.deleteSelected`라는 필드명을 굳이 바꾸지 않고 `const { selectedIds, deleteSelected } = selection`으로 분해 할당해 지역 식별자로 만드는 방식으로 해결했다 — 두 사이클에서 같은 lint 제약을 서로 다른 방식(필드명 변경 vs 지역 변수 분해)으로 우회한 셈이라, 앞으로 이 패턴(그룹 객체의 메서드를 JSX의 `on*` prop에 바로 연결)을 쓸 때는 처음부터 필드명을 `handle*`로 짓거나 분해 할당하는 관례를 정하면 좋겠다(별도 컨벤션 문서화는 이번 사이클 범위 밖).
- **예상**: PRD Goal(zero-prop 전환)을 완전히 달성한다 — `Header`/`SongList`/`Toolbar` 전부 prop 0개가 됐고, `PostDetailModalContext`/`ContentWriteContext`와 완전히 동일한 3단 구조가 됐다.
- **체크포인트 2개로 줄인 판단**: ADR 예상대로 Context 신설과 3개 컴포넌트 전환이 서로 독립적이면서도 각각 작아, 별도 안전망 구축 없이 기존 21개만으로 충분했다.

## Remaining Debt

- `#284`(`PlaylistPickerModal` 캐시 미동기화, 심각)는 이번 사이클과 파일이 겹치지 않는 독립 문제로 그대로 남아있다.
- 4개 mutation의 낙관적 업데이트 정책 비대칭과 보일러플레이트 중복(백로그 `#218`)은 이전 사이클들과 동일하게 유지(전제 변화 없음).

## Follow-ups

- `playlist-detail-caching`(#186) → `playlist-detail-state-consolidation`(#253) → `playlist-detail-orchestration`(#276) → `playlist-detail-prop-drilling`(#275)로 이어진 4번의 사이클로 `PlaylistDetailModal` 도메인의 구조적 부채가 대부분 해소됐다. 다음 순번 후보는 `#284`(`PlaylistPickerModal` 캐시 미동기화, 심각도가 가장 높음)를 권장한다.
- `react/jsx-handler-names`와 그룹 객체 필드 네이밍이 부딪히는 패턴(이번과 `#281` 양쪽에서 확인)은 세 번째로 나오면 `docs/conventions.md`에 짧게 문서화할 가치가 있다 — 지금은 반복 횟수가 2번이라 아직 이르다고 판단, 새 이슈는 만들지 않음.

---

**[GATE 3]** 위 Before/After, 개발환경 실동작 확인, Behavior Verification, 남은 부채를 확인해주시면 이 리팩터링 사이클을 종료하겠습니다.
