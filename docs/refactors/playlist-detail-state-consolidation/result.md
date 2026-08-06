# Result — playlist-detail-state-consolidation

## 변경 요약

| 이슈 | 내용                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| ---- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| #271 | `PlaylistDetailModal.test.tsx`에 "연속된 mutation(제목 수정 → 순서 변경)이 누적 반영되고 `getPlaylistDetail`은 추가 호출되지 않는다" 계약 테스트 신규 추가. 구조 변경 없음, CP2 이전 코드 기준으로도 통과 확인.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| #272 | `PlaylistDetailModal.tsx`의 `playlist`/`songs` 로컬 `useState`, `hasSeededRef`, 시딩 `useEffect`를 제거하고 `usePlaylistDetail(playlistId).data`를 렌더링의 유일한 소스로 통합(`usePostDetail`과 동일 패턴). 4개 mutation은 이미 존재하던 `queryClient.setQueryData` 호출은 그대로 두고 로컬 `setSongs`/`setPlaylist` 호출만 제거. **구현 중 발견**: 곡 순서변경 낙관적 반영을 `fireEvent` 직후 동기 assertion으로 검증하던 특성화 테스트 1개가 깨짐 — 캐시 자체는 `onMutate`에서 동기적으로 갱신되지만(다른 테스트가 `queryClient.getQueryData`로 직접 확인, 통과 유지), `useQuery` 구독을 통한 컴포넌트 리렌더는 로컬 state만큼 완전히 동기적이지 않음. Behavior Invariant("API 응답 전에 즉시 반영")는 유지되므로 검증 방식만 `waitFor`로 조정. |
| #273 | dead code 없음 확인(lint/check-types 클린), `playlist-detail-caching/result.md`의 Remaining Debt 항목에 해소 표기, 이 문서(`result.md`) 작성.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |

## Before / After

| 항목                                                                    | Before(prd.md 기준선)                                                                                     | After                                                                                                                                           |
| ----------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| 렌더링 소스                                                             | 로컬 `useState`(`playlist`/`songs`), 쿼리는 `hasSeededRef`로 최초 1회만 시딩                              | `usePlaylistDetail(playlistId).data`가 유일한 소스 — 로컬 `useState`/`hasSeededRef`/시딩 `useEffect` 완전 제거                                  |
| 4개 mutation의 성공 콜백                                                | 로컬 setter(`setSongs`/`setPlaylist`) + `queryClient.setQueryData` 2곳에 쓰기(삭제만 원래 캐시 쓰기 없음) | `queryClient.setQueryData` 1곳만 쓰면 화면 자동 갱신 — 로컬 setter 호출 코드에서 완전히 사라짐                                                  |
| `PlaylistDetailModal.tsx` 줄 수                                         | 265줄                                                                                                     | **251줄**(-14)                                                                                                                                  |
| import                                                                  | `useEffect, useRef, useState` (react)                                                                     | `useEffect, useState`(`useRef` 제거 — 더 이상 필요한 곳 없음)                                                                                   |
| `PlaylistDetailModal.test.tsx`                                          | 20개 테스트, 전부 통과                                                                                    | **21개**(신규 계약 테스트 1개 추가), 전부 통과. 기존 20개 중 19개는 수정 없이 그대로 통과, 1개는 assertion을 `waitFor`로 조정(동작 자체는 불변) |
| playlist 도메인 테스트(`pnpm test -- --testPathPatterns="[Pp]laylist"`) | 5 suites / 38 tests                                                                                       | **5 suites / 39 tests**(+1)                                                                                                                     |
| `pnpm test`(web 전체)                                                   | 48 suites / 264 tests                                                                                     | **48 suites / 265 tests**(+1, 회귀 없음)                                                                                                        |
| `pnpm lint`/`check-types`/`build`                                       | 전부 통과                                                                                                 | 전부 통과(회귀 없음)                                                                                                                            |
| 변경 파일(diff stat, main 대비, `apps/web`)                             | —                                                                                                         | 2개 파일, 36(+)/21(-)줄(`PlaylistDetailModal.tsx`, `PlaylistDetailModal.test.tsx`) — 신규 파일 없음, PRD가 예상한 "파일 1~2개" 범위 그대로      |

## 개발환경 실동작 확인

- `packages/dto`는 변경하지 않아 `pnpm dto` 재빌드는 필요 없었다(순수 `apps/web` 컴포넌트 변경).
- `docker compose up -d`(mysql/neo4j/redis)로 실제 인프라를 띄우고 `pnpm dev`(api+web)를 백그라운드로 실행, 컴파일 에러/런타임 에러 없이 두 서버 모두 정상 기동을 dev 로그로 확인했다(`api:dev`가 라우트 전부 정상 매핑, `web:dev`가 `✓ Ready`).
- `POST /api/auth/login/tmp`로 시드 사용자(`user1Id`) JWT를 발급받아, `GET /api/playlist/{seedPlaylistId}`가 실제 DB의 4곡짜리 플레이리스트를 정상 반환함을 확인했다(모달이 렌더링에 쓰는 것과 동일한 응답 형태).
- `PlaylistDetailModal`의 제목 편집이 실제로 호출하는 `PATCH /api/playlist/{id}` 엔드포인트를 직접 호출해 실제 제목이 변경/조회/원복되는 것을 확인했다 — `renameMutation`의 `mutationFn`이 기대하는 요청/응답 계약과 실제 서버 동작이 일치함을 검증(응답이 `{id, title}`만 반환하고 `onSuccess`가 `_data`를 쓰지 않는 것도 코드와 일치).
- `curl`로 `/archive`(플레이리스트 상세 모달이 열리는 진입점) 라우트가 200으로 응답하고 dev 로그에 컴파일 에러가 없음을 확인했다.
- `GET /api/youtube-search`, `GET /api/playlist/...` 등 요청 처리 중 dev 서버 로그에 예외/에러 로그가 없음을 `grep`으로 확인했다(코드 안의 의도된 `console.error`/`toast.error` 외에는 없음).
- **직접 확인하지 못한 부분**: 실제 브라우저에서 모달을 열어 곡 순서를 드래그하거나 곡을 추가/삭제하는 조작을 시각적으로 확인하는 것은 이 샌드박스에 브라우저 자동화 도구가 없어 확인하지 못했다(이전 사이클들과 동일한 제약). 대신 이 변경의 핵심 위험(로컬 state 제거 후 렌더링이 올바르게 갱신되는가)은 jsdom 기반 통합 테스트(`PlaylistDetailModal.test.tsx` 21개, 실제 React 렌더 트리와 TanStack Query 캐시를 동작시켜 DOM으로 검증)와 실제 API 계약 확인(`curl`)으로 커버했다. 사용자가 로컬에서 실제로 플레이리스트 상세를 열어 제목 수정·곡 추가·순서 변경·삭제를 한 번씩 조작해봐 주면 좋다.

## Behavior Verification

prd.md의 Behavior Invariants를 모두 확인했다:

- ✅ 최초 마운트 시 `getPlaylistDetail` 1회 호출, 성공 시 렌더링/실패 시 toast — 기존 테스트 그대로 통과.
- ✅ 곡 순서 변경/삭제는 API 응답 전에 즉시 반영(낙관적), 실패해도 롤백 없음 — 기존 테스트 통과(1개는 `waitFor`로 검증 방식만 조정, 실패 시 롤백 없음을 검증하는 테스트는 무수정 통과).
- ✅ 곡 추가는 낙관적 업데이트 없이 성공 후에만 반영 — 무수정 통과.
- ✅ 제목 편집 유효성 검사(`MAX_PLAYLIST_TITLE_LENGTH`)·빈 문자열/미변경 조기 종료 — 무수정 통과.
- ✅ 삭제는 `ConfirmOverlay` 확인 후에만 실행, 성공 후에도 상세 캐시 강제 정리 없음 — 무수정 통과(`getPlaylistDetail` 추가 호출 없음을 직접 검증하는 기존 테스트 포함).
- ✅ 각 액션 실패 시 `toast.error`+`console.error` — 무수정 통과.
- ✅ `usePlaylistRecommendations.selectPlaylist`의 캐시 재사용/`MOCK_PLAYLIST_DETAILS` 폴백 — 이 사이클에서 해당 파일을 건드리지 않아 무변경, 관련 테스트 통과.
- ✅ 목록(`['playlists']`) 캐시 최종 일치 — `bumpPlaylistRefresh()` 호출부 무변경.
- ✅ 모달↔추천 위젯 캐시 공유(같은 `playlistId` 순차 조회 시 요청 1회) — `PlaylistDetailCacheSharing.integration.test.tsx` 무수정 통과.

ADR의 회귀 시나리오 5개도 전부 확인:

| 회귀 시나리오                                                         | 결과                                                                           |
| --------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| 최초 마운트 시 `getPlaylistDetail` 1회 호출 후 렌더링                 | ✅ 무수정 통과                                                                 |
| 4개 액션 각각의 성공/실패/유효성검사                                  | ✅ 19/20 무수정 통과, 1개 `waitFor`로 검증 방식 조정(동작 불변)                |
| 4개 액션 성공 시 `playlistDetailQueryKey` 캐시 반영                   | ✅ 무수정 통과                                                                 |
| 연속 mutation 후 추가 `getPlaylistDetail` 호출 없음(재시딩 루프 없음) | ✅ 신규 테스트(#271)로 직접 증명, 두 변경(제목+순서)이 누적 반영됨도 함께 확인 |
| 모달↔추천 위젯 캐시 공유                                              | ✅ 무수정 통과                                                                 |

## Decision Review

ADR에서 선택한 안 2(경계 재설계, 로컬 state 완전 제거)의 예상과 실제 비교:

- **예상**: "이미 있는 캐시 쓰기 코드를 그대로 두고 로컬 setter만 삭제하는" 변경이라 저위험이다 — 실제로 정확히 그랬다. `PlaylistDetailModal.tsx`의 diff는 삭제 위주(24줄 변경 중 대부분이 라인 삭제)였고, 새로 작성한 로직은 없었다.
- **예상하지 못했던 점**: `queryClient.setQueryData`로 갱신된 캐시가 컴포넌트에 반영되는 시점이 로컬 `useState`만큼 완전히 동기적이지 않다는 것을 구현 중에 처음 확인했다. ADR의 "동작 보존 난이도: 낮음" 평가는 코드 레벨(무엇을 쓰는가)에서는 정확했지만, 테스트 레벨(언제 반영되는가를 어떻게 assert하는가)의 미묘한 차이까지는 사전에 잡아내지 못했다 — `fireEvent` 직후 동기 assertion을 쓰던 특성화 테스트 1개가 이 차이를 드러냈다. 다행히 이 저장소의 기존 안전망(38개 테스트, 그중 하나가 `queryClient.getQueryData`로 캐시를 직접 검증)이 "캐시는 동기적으로 갱신되지만 리렌더는 아니다"라는 정확한 원인을 즉시 특정할 수 있게 해줬다 — 안전망이 두꺼웠기 때문에 이 발견이 막연한 실패가 아니라 정확한 진단으로 이어질 수 있었다.
- **예상**: 재시딩 버그 클래스가 "지킬 로컬 state가 없어져서" 구조적으로 성립 불가능해진다 — 신규 계약 테스트(#271, 제목 수정 → 순서 변경 연속 실행)로 직접 증명했고, 실제로 `getPlaylistDetail`은 최초 1회만 호출됐고 두 변경 모두 누적 반영됐다.
- **체크포인트를 3개로 줄인 판단**(이전 사이클 10개 대비): 실제로 CP2가 "한 파일 안에서 상호 의존적인 원자적 변경"이라는 예상이 맞았다 — 로컬 state 제거와 mutation 내 setter 제거를 분리해서 커밋할 수 없었고, 실제로도 한 커밋으로 처리했다. 체크포인트 수를 줄인 것이 검증 밀도를 낮추지는 않았다 — 기존 안전망이 이미 충분히 두꺼웠기 때문에 가능했던 선택이었다.

## Remaining Debt

- `Header.tsx`(12개 prop)/`SongList`(5개)/`Toolbar`(2개)의 prop drilling은 목표 인터뷰에서 의도적으로 이번 사이클 범위 밖으로 뒀다. 데이터 소유권(이번 사이클)과 데이터 전달 방식(Context 전환)은 다른 축이라 분리했다.
- `PlaylistDetailModal.tsx`의 로직이 여전히 컴포넌트 파일 안에 전부 inline돼 있다(post/content-write 도메인처럼 별도 훅 파일로 분리하지 않음) — 이 역시 목표 인터뷰에서 범위 밖으로 결정.
- 목록-상세 즉시 동기화, 4개 mutation의 낙관적 업데이트 비대칭 정책, 삭제 시 캐시 강제 정리는 이전 사이클 결정을 그대로 유지(전제 변화 없음).

## Follow-ups

- Header/SongList/Toolbar Context 전환과 `PlaylistDetailModal` 로직의 훅 파일 분리는 이번 조사에서 실재가 확인된 별도 후보다 — 재현된 버그·불만은 없고 순수 구조 개선이라, 필요해지면 별도 `/refactoring-planner` 사이클로 다룬다(새 이슈는 지금 만들지 않음 — 다음 착수 시 재검토).
- 백로그 #218("낙관적 업데이트 mutation 보일러플레이트 공통 훅화 검토")은 이번 ADR에서 안 3(공용 mutation 팩토리)을 기각하며 재확인됐다 — 이 도메인만이 아니라 저장소 전체(post 포함) mutation 보일러플레이트를 같이 보고 결정하는 게 맞다는 근거가 그대로 유효하다.
- 부모 이슈 #253은 이 3개 체크포인트로 완결됐으므로 종료한다.

---

**[GATE 3]** 위 Before/After, 개발환경 실동작 확인, Behavior Verification, 남은 부채를 확인해주시면 이 리팩터링 사이클을 종료하겠습니다.
