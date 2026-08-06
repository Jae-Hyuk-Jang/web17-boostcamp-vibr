# Result — playlist-picker-cache-sync

## 변경 요약

| 이슈 | 내용                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| ---- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| #288 | `PlaylistPickerModal.test.tsx`에 저장/생성 성공·실패·`isSubmittable` 가드 테스트 7개 신규 추가(전용 테스트 0개→7개). 캐시가 갱신되지 않는 현재(버그) 동작도 명시적으로 특성화.                                                                                                                                                                                                                                                                            |
| #289 | `saveToPlaylist`를 `useMutation`으로 전환하고, `usePlaylistDetailModal.ts`의 `addSongMutation`과 동일한 패턴(`setQueryData(playlistDetailQueryKey)` + `invalidateQueries(PLAYLISTS_QUERY_KEY)`)으로 캐시를 갱신. CP1의 "캐시 미갱신" 테스트를 "갱신됨" contract test로 업데이트. **구현 중 발견**: `mutateAsync`는 호출 직후 동기적으로 `mutationFn`을 실행하지 않아, 진행 중 재클릭 무시를 검증하던 동기 assertion을 `waitFor`로 조정(동작 자체는 불변). |
| #290 | `docs/component-hook-audit/index.html`의 관련 finding(심각도 "심각")에 해소 표시 추가, 이 문서(`result.md`) 작성.                                                                                                                                                                                                                                                                                                                                         |

## Before / After

| 항목                                                            | Before(prd.md 기준선)    | After                                                                                             |
| --------------------------------------------------------------- | ------------------------ | ------------------------------------------------------------------------------------------------- |
| `saveToPlaylist` 캐시 갱신                                      | 없음(캐시 쓰기 코드 0건) | `playlistDetailQueryKey(playlistId)` 캐시에 `addedMusics` 반영 + `PLAYLISTS_QUERY_KEY` invalidate |
| `handleCreateAndSave`로 생성한 플레이리스트가 목록에 반영되는지 | 안 됨                    | `saveToPlaylist`의 invalidate로 저장 성공 후 자동 반영                                            |
| `PlaylistPickerModal.test.tsx` 저장/생성 경로 테스트            | 0개                      | **7개**(성공/실패/생성/가드) + **1개**(캐시 반영 contract test) = 8개 신규                        |
| `PlaylistPickerModal.test.tsx` 전체                             | 1 suite / 3 tests        | **1 suite / 10 tests**(+7)                                                                        |
| `pnpm test`(web 전체)                                           | 49 suites / 275 tests    | **49 suites / 282 tests**(+7, 회귀 없음)                                                          |
| `pnpm lint`/`check-types`/`build`                               | 전부 통과                | 전부 통과(회귀 없음)                                                                              |
| 변경 파일(diff stat, main 대비, `apps/web`)                     | —                        | 2개 파일, 139(+)/4(-)줄 — PRD가 예상한 "파일 1~2개" 범위 그대로                                   |

## 개발환경 실동작 확인

- `packages/dto`는 변경하지 않았다(순수 `apps/web` 컴포넌트 변경, DTO 계약은 이미 필요한 정보를 반환).
- `docker compose up -d`(mysql/neo4j/redis)로 실제 인프라를 띄우고 `pnpm dev`(api+web)를 백그라운드로 실행, 컴파일 에러/런타임 에러 없이 두 서버 모두 정상 기동을 dev 로그로 확인했다(`web:dev`가 `✓ Ready in 1571ms`, `api:dev`가 `Found 0 errors`).
- `POST /api/auth/login/tmp`로 시드 사용자(`user1Id`) JWT를 발급받아, `saveToPlaylist`가 실제로 호출하는 `POST /api/playlist/{id}/music` 엔드포인트를 시드 플레이리스트("두번째 플리", 착수 전 2곡)에 직접 호출했다:
  - 응답이 `{ addedMusics: [...] }` 형태로 정확히 반환됨을 확인 — 프론트엔드의 `res.addedMusics` 접근과 `setQueryData` 업데이터가 기대하는 계약과 실제 서버 응답이 일치함을 검증.
  - 호출 직후 `GET /api/playlist/{id}`로 상세를 재조회해 곡 수가 2→3으로 늘어난 것을 확인(서버 상태 자체는 정상 반영됨 — 프론트엔드 캐시 갱신 여부와는 별개로, 애초에 백엔드가 올바르게 저장하고 있었음을 재확인).
  - `GET /api/playlist`(목록)에서도 해당 플레이리스트의 `tracksCount`가 3으로 반영됨을 확인 — `PLAYLISTS_QUERY_KEY` invalidate 후 목록이 정확한 최신 값을 받게 된다는 것을 실제 API 레벨에서 재확인.
- `curl`로 홈(`/`)과 `/archive` 라우트가 200으로 응답함을 확인했다.
- **직접 확인하지 못한 부분**: 실제 브라우저에서 `PlaylistDetailModal`을 열어둔 채로 `PlaylistPickerModal`을 통해 같은 플레이리스트에 곡을 저장했을 때, 상세 모달 화면이 새로고침 없이 실시간으로 갱신되는지 시각적으로 확인하는 것은 이 샌드박스에 브라우저 자동화 도구가 없어 확인하지 못했다(이전 사이클들과 동일한 제약). 대신 이 변경의 핵심 위험(캐시 쓰기가 올바른 계약으로 이뤄지는가)은 jsdom 기반 통합 테스트(`PlaylistPickerModal.test.tsx`, 실제 TanStack Query 캐시를 동작시켜 `queryClient.getQueryData`로 직접 검증)와 실제 API 응답 계약 확인(`curl`)으로 커버했다. 사용자가 로컬에서 두 모달을 동시에 열어 실제로 확인해보면 좋다.
- 사용 후 `docker compose down`으로 인프라를 정리했다(시드 DB에는 테스트로 추가한 곡 1개가 남아있음 — dev 시드 데이터라 별도 정리는 하지 않음).

## Behavior Verification

prd.md의 Behavior Invariants를 모두 확인했다:

- ✅ `saveToPlaylist` 성공/실패 toast 문구 — 무수정 통과(`'이미 플레이리스트에 있는 곡이에요.'`/`'보관함에 저장했어요.'`/`'저장에 실패했습니다.'`).
- ✅ `handleCreateAndSave` 성공/실패 toast 문구와 `submitErrorMsg` — 무수정 통과.
- ✅ 저장 성공 시 `closeModal()` 호출 시점 — 무수정 통과.
- ✅ `isSubmittable` 가드 로직 — 무수정 통과(진행 중 재클릭 시 `addMusicsToPlaylist` 추가 호출 없음을 직접 검증).
- ✅ `musics`가 없으면 아무것도 하지 않는 동작 — 코드 무변경, 기존 로직 그대로.

ADR의 회귀 시나리오 6개도 전부 확인:

| 회귀 시나리오                                       | 결과                                                           |
| --------------------------------------------------- | -------------------------------------------------------------- |
| 저장 성공 시 toast·`closeModal` 호출                | ✅ Characterization(CP1)으로 고정, 무수정 통과                 |
| 저장 실패 시 에러 toast·`submitErrorMsg`, 모달 유지 | ✅ Characterization(CP1)으로 고정, 무수정 통과                 |
| 생성+저장 성공/실패                                 | ✅ Characterization(CP1)으로 고정, 무수정 통과                 |
| `isSubmittable`이 false면 재클릭 무시               | ✅ Characterization(CP1)으로 고정(waitFor로 타이밍 조정), 통과 |
| 저장 성공 시 `playlistDetailQueryKey` 캐시 반영     | ✅ Contract(CP2)로 신규 검증, 통과(착수 전엔 "안 됨"이었음)    |
| 저장 성공 시 `PLAYLISTS_QUERY_KEY` invalidate       | ✅ Contract(CP2)로 신규 검증, 통과(착수 전엔 "안 됨"이었음)    |

## Decision Review

ADR에서 선택한 안 2(경계 재설계, `PlaylistPickerModal.tsx` 안에 직접 캐시 쓰기 구현)의 예상과 실제 비교:

- **예상**: 이미 검증된 `addSongMutation` 패턴을 그대로 복제해 동작 보존 난이도가 낮다 — 실제로 캐시 쓰기 로직 자체(`setQueryData`/`invalidateQueries` 호출부)는 그대로 옮겨 적었을 뿐 새로 설계한 부분이 없었다.
- **예상하지 못했던 점**: `saveToPlaylist`를 `useMutation`으로 감싸면서, `mutateAsync` 호출이 `mutationFn`을 동기적으로 실행하지 않는다는 타이밍 차이를 CP2 구현 중 처음 확인했다 — "진행 중 재클릭이 무시된다"를 검증하던 CP1의 테스트가 두 번째 클릭 직후 동기 assertion으로 `addMusicsToPlaylist` 호출 횟수를 확인했는데, `useMutation` 도입 후 이 타이밍이 깨졌다. `playlist-detail-state-consolidation` 사이클에서 이미 한 번 겪은 것과 같은 클래스의 문제(`queryClient` 캐시 쓰기는 동기적이지만, `useMutation`을 통한 실행 자체의 개시 시점은 그렇지 않음)라 원인을 빠르게 특정해 `waitFor`로 조정했다 — 동작 자체(두 번째 클릭 무시)는 최종 호출 횟수가 1회로 유지되는 것으로 여전히 보장된다.
- **예상**: 안 1(목록만 invalidate)보다 근본적으로 해결하고, 안 3(공용 훅 추출)보다 안전하게 — 실제로 파일 1개(+테스트)만 바뀌었고 안정된 `usePlaylistDetailModal.ts`는 전혀 건드리지 않았다.
- **체크포인트 3개 판단**: 이 도메인에서 유일하게 안전망이 0개인 상태로 시작한 사이클이라, "버그를 먼저 특성화 → 고침 → 정리"라는 3단계가 실제로도 그대로 유효했다.

## Remaining Debt

- `PlaylistBriefItem`과의 마크업 중복(`#284` 부수 발견, 경미)은 캐시 정확성과 무관한 별개 축으로 이번 사이클에서 손대지 않았다.
- 백로그 `#218`(공용 mutation 팩토리)은 이번 ADR에서도 안 3(공용 mutation 훅 추출)을 기각하며 재확인됐다 — `addSongMutation`과 이번에 추가한 캐시 쓰기 로직이 사실상 동일한 코드를 두 곳에 갖게 됐다는 사실이, `#218`을 다룰 때 참고할 구체적 사례로 남는다.

## Follow-ups

- 부모 이슈 #284는 이 3개 체크포인트로 완결됐으므로 종료한다.
- `#218`(공용 mutation 팩토리 검토) 착수 시, 이번 사이클에서 중복된 "곡을 플레이리스트에 추가" 캐시 쓰기 로직(`usePlaylistDetailModal.ts`의 `addSongMutation` vs `PlaylistPickerModal.tsx`의 `saveMutation`)을 구체적 통합 대상 사례로 참고할 수 있다.
- `docs/component-hook-audit/index.html`(05 플레이리스트 도메인)의 "심각" 등급 finding은 이제 전부 해소됐다 — 남은 항목은 전부 "중간" 이하다.

---

**[GATE 3]** 위 Before/After, 개발환경 실동작 확인, Behavior Verification, 남은 부채를 확인해주시면 이 리팩터링 사이클을 종료하겠습니다.
