# Result — playlist-detail-caching

## 변경 요약

| 이슈 | 내용                                                                                                                                                                                                                                                                  |
| ---- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| #187 | `PlaylistDetailModal`의 4개 변경 액션(제목수정/곡추가/순서변경/삭제)과 `usePlaylistRecommendations.selectPlaylist`(기존 테스트 0건)의 현재 동작을 characterization/contract 테스트로 고정. 착수 전 1개뿐이던 테스트가 이 이슈에서 15개로 늘어남.                      |
| #188 | `playlistDetailQueryKey(playlistId)` + `usePlaylistDetail`(`useQuery`, `staleTime: 60_000`) 공용 훅 신설. `usePostDetail`의 `POST_DETAIL_STALE_TIME_MS`와 동일 근거로 같은 값 채택.                                                                                   |
| #189 | `PlaylistDetailModal`의 읽기 경로(`initialFetchPlaylist`)를 `usePlaylistDetail`로 교체. **구현 중 발견**: 최초 시딩 `useEffect`가 다른 액션의 캐시 쓰기로 재실행되며 로컬 `songs`를 덮어쓰는 버그를 미리 발견해, 최초 1회만 시딩하도록 가드 추가.                     |
| #190 | `commitRename`을 `useMutation`으로 전환. **ADR 정정**: 당초 "4개 액션 모두 `onMutate` 낙관적 쓰기"로 계획했으나, 실제로는 `await` 성공 이후에만 반영하는 비낙관적 액션임을 재확인해 `onSuccess`에서만 캐시를 쓰도록 현재 동작을 보존.                                 |
| #191 | `moveSong`/`moveSongTo`/`deleteSelectedSongs`가 공유하는 `requestChangeOrder`를 `useMutation`으로 전환. 이 경로만 실제로 낙관적이라 `onMutate`에서 로컬+캐시를 함께 즉시 반영. 롤백 정책은 "실패해도 롤백 없음"(현재 동작)을 그대로 유지.                             |
| #192 | `handleAddSong`을 `useMutation`으로 전환. 기존 제약(곡 id 필요로 낙관적 업데이트 없음)을 그대로 유지.                                                                                                                                                                 |
| #193 | 삭제를 `useMutation`으로 전환. **구현 중 발견**: 성공 시 `removeQueries`로 상세 캐시를 즉시 지우려 했으나, 아직 마운트된 자신의 `usePlaylistDetail` 구독이 `closeModal` 반영 전에 삭제된 `playlistId`를 즉시 재요청하는 레이스를 발견해 캐시 정리는 하지 않기로 변경. |
| #194 | `usePlaylistRecommendations.selectPlaylist`를 `queryClient.ensureQueryData`로 전환해 `PlaylistDetailModal`과 같은 캐시를 재사용. mock 폴백 동작은 그대로 유지.                                                                                                        |
| #195 | Success Criteria("같은 playlistId를 두 진입점에서 순차적으로 열면 두 번째는 네트워크 요청 생략")를 두 컴포넌트를 같은 `QueryClient` 아래 순차 마운트해 직접 검증하는 통합 테스트 2개(양방향) 추가. dead code 없음을 확인.                                             |
| #196 | 이 문서 작성 + `docs/tanstack-query/index.html` Remaining Debt 표 갱신 + 이슈 #186 클로즈.                                                                                                                                                                            |

## Before / After

| 항목                                               | Before(prd.md 기준선)                                                                                                      | After                                                                                                                                                                                              |
| -------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 캐시 공유                                          | `PlaylistDetailModal`/`usePlaylistRecommendations`가 각자 `getPlaylistDetail`을 독립 호출, 같은 `playlistId`도 매번 재요청 | `playlistDetailQueryKey(playlistId)` 공유 캐시(`staleTime: 60초`) — 같은 `playlistId`를 두 진입점에서 순서 무관하게 열어도 **두 번째부터는 네트워크 요청 0회**(실제 브라우저 네트워크 로그로 확인) |
| 4개 변경 액션의 구현 방식                          | 로컬 `useState` 직접 갱신(`setSongs`/`setPlaylist`) + 목록 캐시만 `invalidateQueries`                                      | `useMutation`으로 표준화(`onMutate`/`onSuccess`/`onError`), 상세 캐시도 함께 갱신 — `usePostReactions`(cycle3)와 동일 패턴                                                                         |
| 목록-상세 정합성                                   | 최종 일치(제목 변경 시 로컬은 즉시, 목록은 재조회 시점에)                                                                  | 동일 — 즉시 동기화는 이번 사이클 목표가 아니었음(PRD 결정), 변경 없음                                                                                                                              |
| 낙관적 업데이트 범위                               | (진단되지 않음 — "4개 모두 낙관적"으로 잘못 가정한 채 ADR 작성)                                                            | `requestChangeOrder`(순서변경·삭제)만 실제로 낙관적임을 재확인, 나머지 3개(제목수정/곡추가/삭제)는 성공 후에만 반영하는 현재 동작을 그대로 보존                                                    |
| `usePlaylistRecommendations.selectPlaylist` 테스트 | 0건                                                                                                                        | 7건(특성화 4 + 캐시 공유 계약 2 + 통합 2 — 아래 test count에 포함)                                                                                                                                 |
| `pnpm test`(web)                                   | 34 suites / 171 tests                                                                                                      | **36 suites / 202 tests**(+2 suites, +31 tests — 신규 계약/특성화/통합 테스트)                                                                                                                     |
| `pnpm lint`/`check-types`/`build`                  | 전부 통과                                                                                                                  | 전부 통과(회귀 없음)                                                                                                                                                                               |
| 변경 파일(diff stat, main 대비)                    | —                                                                                                                          | 11개 파일, 1022(+)/96(-)줄. 신규 파일 3개(`usePlaylistDetail.ts`, `usePlaylistDetail.test.ts`, `PlaylistDetailCacheSharing.integration.test.tsx`)                                                  |

## 개발환경 실동작 확인

`packages/dto`는 변경하지 않아 `pnpm dto` 재빌드는 필요 없었다. `docker compose up -d`(mysql/neo4j/redis) + `pnpm dev`(api/web)로 실제 백엔드·DB를 띄우고, 시드 유저(`user1Id`)의 JWT를 `JWT_SECRET`으로 직접 서명해 `sessionStorage.appJwt`에 주입하는 방식으로 로그인 세션을 만든 뒤(OAuth 플로우 자체는 이번 변경과 무관해 우회), Playwright로 실제 브라우저를 띄워 검증했다.

- **`/archive`에서 실제 플레이리스트("첫번째 플리") 상세 모달을 열고**:
  - 제목을 "플레이리스트 캐싱 검증"으로 실제로 변경 — `PATCH /api/playlist/:id` 호출 후 화면에 즉시 반영됨을 확인.
  - 두 번째 곡의 순서를 위로 이동 — 낙관적으로 즉시 순서가 바뀐 뒤 `PUT /api/playlist/:id/music` 호출을 확인, 최종 순서("후라이의 꿈"이 맨 앞)가 실제 서버 응답과 일치.
  - 콘솔 에러 0건.
- **Success Criteria를 실제 네트워크 트래픽으로 직접 검증**: 모달을 닫고, 사이드바 "추천"(글쓰기) 버튼으로 `ContentWriteModal`을 연 뒤 음악 검색창을 포커스해 추천 드롭다운을 열고, 방금 상세를 열었던 **같은 플레이리스트**("플레이리스트 캐싱 검증")를 선택했다. 이때 캡처한 네트워크 요청 로그(`GET /api/playlist/{id}` 필터링):
  - 모달을 열 때 1회만 발생.
  - 위젯에서 같은 플레이리스트를 선택한 뒤에도 **추가 요청 0건**(`NEW requests caused by widget select: []`).
  - 선택된 플레이리스트의 4곡(재정렬된 순서 포함)이 게시글 작성 폼에 정확히 반영됨을 스크린샷으로 확인.
- **확인하지 못한 부분**: 곡 추가(`handleAddSong`)와 삭제 확인 오버레이는 실제 브라우저에서 재현하지 않고 단위/특성화 테스트(#187, #192, #193)로만 검증했다 — Playwright 세션에서 `MusicPickerSearch`의 실제 서드파티 검색 API(iTunes/YouTube) 호출까지 재현하는 것은 이번 GATE 3 범위를 벗어난다고 판단해 생략했다.

## Behavior Verification

prd.md의 Behavior Invariants 전부를 확인했다:

- ✅ 곡 순서 변경(`moveSong`/`moveSongTo`/`deleteSelectedSongs`)의 낙관적 로컬 반영 — #191 특성화 테스트 + 실제 브라우저 확인.
- ✅ 곡 추가(`handleAddSong`)는 여전히 낙관적 업데이트 없음 — #192 특성화 테스트("낙관적 업데이트 없이 API 성공 응답을 받은 뒤에만 목록에 반영된다").
- ✅ 제목 인라인 편집 유효성 검사(`MAX_PLAYLIST_TITLE_LENGTH`) — #187/#190 특성화 테스트 + 실제 브라우저 확인.
- ✅ 삭제 확인 오버레이 흐름 — #187/#193 특성화 테스트(취소 시 미실행, 확인 시 실행).
- ✅ 각 액션 실패 시 `toast.error`+`console.error` — 4개 액션 모두 실패 케이스 테스트로 커버.
- ✅ `usePlaylistRecommendations.selectPlaylist`의 `MOCK_PLAYLIST_DETAILS` 폴백 — #187 신규 테스트로 커버(기존엔 테스트 자체가 없었음).
- ✅ 목록(`['playlists']`) 캐시의 최종 일치 — 각 액션의 `bumpPlaylistRefresh()` 호출은 손대지 않고 그대로 유지.

## Decision Review

adr.md에서 선택한 안 3(`useMutation` 완전 전환)의 예상과 실제 비교:

- **사용자가 안 2(AI 추천)를 넘어 안 3을 선택한 이유**("재작업 방지", "cycle3 패턴 일관성")는 실제로 유효했다 — 4개 액션이 이제 `usePostReactions`의 `createCommentMutation`과 동일한 `useMutation` 형태라, 다음에 낙관적 갱신 정책을 바꾸거나 롤백을 추가해야 할 때 이 파일만 보면 되는 일관된 진입점이 생겼다.
- **예상하지 못했던 점 1(가장 중요)**: ADR은 "4개 액션 모두 낙관적 업데이트"라고 잘못 가정한 채 작성됐다 — 실제로는 `commitRename`/`handleAddSong`/삭제 3개가 `await` 성공 후에만 상태를 바꾸는 비낙관적 액션이었다. 이 오류는 #190 착수 직전 코드를 다시 읽다가 발견했고, 사용자에게 "현재 동작대로 진행"할지 확인받은 뒤 ADR/이슈 본문에 정정 코멘트를 남겼다. 안전망(#187)이 먼저 갖춰져 있었기 때문에, 이 정정이 실제 동작 변경 없이 계획만 바로잡는 선에서 끝날 수 있었다.
- **예상하지 못했던 점 2**: #193에서 계획했던 `removeQueries`(삭제 성공 시 상세 캐시 정리)가 실제로는 위험한 설계였다 — 삭제를 실행한 컴포넌트 자신이 그 캐시를 구독 중인 상태에서 캐시를 지우면, `closeModal()`이 실제로 컴포넌트를 unmount시키기 전에 관측자가 즉시 재요청해 방금 삭제한 리소스를 다시 조회하는 레이스가 있었다. 코드를 작성하며 TanStack Query의 관측자-캐시 상호작용을 다시 짚어보다가 발견해, 실제 구현 전에 계획을 수정했다(캐시 정리를 하지 않고 `staleTime` 경과에 맡김).
- **예상**: 비교표 기준 2(동작 보존 난이도)에서 안 3이 안 2보다 위험하다고 판단해 체크포인트를 10개로 세분화했다 → 실제로 이 세분화 덕분에, 위 두 정정 모두 다음 이슈로 전파되기 전에 해당 이슈 안에서 발견·수정됐다. 만약 4개 액션을 한 이슈로 묶었다면 이 두 문제를 뒤섞인 채로 디버깅해야 했을 가능성이 높다.
- **staleTime 60초(POST_DETAIL_STALE_TIME_MS와 동일) 결정**은 실제 브라우저 검증에서 정확히 의도대로 작동했다 — 모달→위젯 순차 조회에서 추가 요청 0건을 네트워크 레벨로 직접 확인.

## Remaining Debt

- 목록(`['playlists']`)-상세 즉시 동기화는 이번에도 다루지 않았다(PRD Out of Scope) — 제목을 변경하면 상세와 캐시는 즉시 반영되지만, 목록 화면(`ArchiveView`)은 `invalidateQueries` 재조회 시점에 반영된다. 사용자 불만이나 재현된 버그가 없어 우선순위가 낮다고 판단해 별도 백로그로 등록하지 않는다.
- `PlaylistDetailModal`의 로컬 `songs`/`playlist` state는 여전히 렌더링의 소스이고, 쿼리 캐시는 "다른 소비처와의 공유"라는 부차적 역할만 한다 — `usePostDetail`처럼 쿼리 데이터를 렌더링의 직접 소스로 완전히 통합하는 것은 이번 사이클 범위를 넘어서는 더 큰 리팩터링이라 다루지 않았다. 지금 구조로도 Success Criteria(캐시 공유)는 충족되지만, 훗날 4개 액션을 더 다듬으려면 이 이중 구조(로컬 state + 캐시)가 유지보수 포인트가 될 수 있다.
- `requestChangeOrder`(순서변경·삭제)는 여전히 실패해도 롤백하지 않는다(현재 동작 보존, 사용자 확인). UX 개선이 필요하면 별도 이슈로 검토.

## Follow-ups

- 별도 백로그 등록 없음 — 위 Remaining Debt 항목들은 재현된 버그나 사용자 불만 없이 이론적 개선 여지에 그쳐, `docs/tanstack-query/index.html`의 Remaining Debt 표에 커서만 남기고 새 이슈는 만들지 않는다.
- `docs/tanstack-query/index.html`의 "플레이리스트 상세(selectPlaylist)" 행(`백로그 #186`)을 완료 표시로 갱신.

---

**[GATE 3]** 위 Before/After, 개발환경 실동작 확인(실제 브라우저 네트워크 로그로 Success Criteria 직접 검증), Behavior Verification, 남은 부채를 확인해주시면 이 리팩터링 사이클을 종료하겠습니다.
