# ADR — playlist-detail-caching

## 3안 비교

### 안 1 — 최소 개선안

TanStack Query 캐시 대신 모듈 레벨 `Map<playlistId, GetPlaylistDetailResDto>` 캐시를 자체 구현해 `PlaylistDetailModal`/`usePlaylistRecommendations.selectPlaylist`가 공유하게 한다. 변경 액션 성공 시 이 Map을 손으로 무효화한다.

### 안 2 — 경계 재설계안

`playlistDetailQueryKey(playlistId)` + `usePlaylistDetail` 공용 훅(`useQuery`)을 신설해 두 소비처가 캐시를 공유하게 한다. 4개 변경 액션(제목수정/곡추가/순서변경/삭제)은 기존과 같은 `try/await/toast` 구조를 유지하되, 성공 후 로컬 `setSongs`/`setPlaylist` 자리를 `queryClient.setQueryData(playlistDetailQueryKey(id), updater)` 직접 패치로 교체한다(`usePostDetail.updatePostContent`와 동일 패턴).

### 안 3 — 완전 이관안(useMutation 전환) — **선택**

안 2와 같이 `usePlaylistDetail`(`useQuery`)을 신설하되, 4개 변경 액션을 각각 `useMutation`(`onMutate`로 낙관적 캐시 쓰기, `onSuccess`로 서버 응답 반영, `onError`로 롤백)으로 재작성한다. `usePostReactions.ts`의 `createCommentMutation`(cycle3, #184)과 동일한 패턴.

## 비교표 (10개 고정 기준)

| #   | 기준                 | 안 1                                                                          | 안 2                                                                                             | 안 3(선택)                                                                                                                                            |
| --- | -------------------- | ----------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | 근본 원인 해결력     | 중간 — dedup은 되나 무효화 규칙을 다시 손수 구현(이번에 고치려는 문제를 반복) | 높음 — 캐시 계층이 실제로 생기고 두 소비처가 공유                                                | 높음 — 안 2와 동일(캐시 공유가 핵심), 추가로 낙관적 롤백까지 구조화                                                                                   |
| 2   | 동작 보존 난이도     | 낮음 — 기존 로직 거의 그대로                                                  | 중간 — 낙관적 로컬 갱신을 `setQueryData`로 옮기지만 로직 자체(선반영 후 요청)는 그대로 재현 가능 | 높음 — 4개 액션 각각 `onMutate`/`onError` 롤백을 새로 설계해야 하고, `handleAddSong`(낙관적 없음)과 나머지(낙관적 있음)의 비대칭을 정확히 재현해야 함 |
| 3   | 책임·의존성 변화     | 매우 작음                                                                     | 중간 — 신규 훅 1개, 기존 훅 2개 수정                                                             | 큼 — 신규 훅 1개 + 4개 mutation 훅/핸들러 재작성                                                                                                      |
| 4   | 테스트 용이성        | 낮음 — 자체 캐시라 `createTestQueryClient` 인프라 재사용 불가                 | 높음 — 기존 테스트 인프라 재사용                                                                 | 높음(장기) — `useMutation` 생명주기별 테스트가 표준화되지만 전환 자체의 테스트 부담이 큼                                                              |
| 5   | 변경 범위            | 작음                                                                          | 중간(PRD 승인 범위인 2개 파일 + 신규 훅)                                                         | 큼 — 같은 파일 범위 안이지만 각 액션의 내부 구현을 전부 재작성                                                                                        |
| 6   | 점진적 전환 가능성   | 쉬움                                                                          | 가능 — 훅 도입 후 소비처 하나씩 전환                                                             | 가능하지만 액션 4개를 각각 별도 체크포인트로 쪼개야 안전                                                                                              |
| 7   | 롤백 가능성          | 쉬움                                                                          | 쉬움 — 훅 삭제 후 기존 fetch로 복귀                                                              | 중간 — 액션별 커밋이 분리되어 있으면 쉬움, 한 번에 묶으면 어려움                                                                                      |
| 8   | 성능·운영 영향       | 무해                                                                          | 긍정적(중복 요청 감소)                                                                           | 긍정적(중복 요청 감소) — 안 2와 동일                                                                                                                  |
| 9   | 기존 코드와의 일관성 | 낮음 — 저장소 전체가 TanStack Query로 통일된 맥락에서 이 경로만 자체 캐시     | 높음 — `usePostDetail` 패턴과 동일                                                               | 매우 높음 — `usePostReactions`(cycle3)의 `useMutation` 패턴과 완전히 동일                                                                             |
| 10  | 유지 비용            | 중간~높음 — 자체 무효화 로직을 계속 유지해야 함                               | 낮음                                                                                             | 낮음(장기) — 단, 초기 구현·검증 비용이 높음                                                                                                           |

## 라이브러리 도입 심사

해당 없음 — 새 라이브러리 도입이 아니다. TanStack Query는 `server-state-caching`(#148)에서 이미 도입·검증됐다(`docs/refactors/server-state-caching/adr.md` 참고). 이번 사이클은 기존 의존성 범위 내에서 `useQuery`/`useMutation`을 플레이리스트 상세 경로에 적용하는 것뿐이다.

## 의사결정 인터뷰 로그

**Q. 3안 중 어느 안을 선택할까요? (상세 캐시 도입 + 변경액션 4개를 어떻게 전환할지)**
A. 안 3 — 완전 이관안(useMutation 전환). 이유: "여기서 안 하면 나중에 또 손대야 한다", "cycle3 패턴과의 일관성이 더 중요하다."

_(AI는 안 2를 추천했다 — PRD의 Goal이 "캐시 공유만"으로 범위를 좁혔고, `PlaylistDetailModal.test.tsx`의 안전망이 배경 클릭 특성화 테스트 1개뿐이라 4개 액션의 동작 보존 난이도가 큰 안 3은 위험 대비 이득이 크지 않다는 근거였다. 사용자는 이 위험을 인지한 상태에서, cycle3와의 장기 일관성 및 재작업 방지를 근거로 안 3을 확정했다. 이 결정에 따라 아래 회귀 안전망과 체크포인트 이슈를 안 2 대비 더 세분화해 위험을 낮췄다 — 특히 안전망 확보를 반드시 구조 변경보다 먼저 완료하고, 4개 액션의 `useMutation` 전환을 각각 별도 이슈로 쪼갰다.)_

**Q. playlistDetail 캐시의 staleTime을 얼마로 둘까요? (Success Criteria의 "두 번째 진입점은 네트워크 요청 생략" 검증을 좌우하는 값)**
A. 60초 — `POST_DETAIL_STALE_TIME_MS`와 동일(추천). 이유: 세션 중 잦은 재편집 대상이 아니라는 근거가 게시글 상세와 동일하게 적용되고, 같은 기준을 쓰는 것이 일관성 측면에서 자연스러움.

## 선택: 안 3

비교표 기준 9(기존 코드 일관성)에서 안 3이 압도적으로 우세하고(cycle3 `usePostReactions` 패턴과 완전 동일), 사용자가 인터뷰에서 "나중에 또 손대야 한다"는 재작업 비용과 패턴 일관성을 명시적 근거로 들어 안 3을 선택했다. 기준 2(동작 보존 난이도)·3(책임 변화)·5(변경 범위)의 약점(안 2 대비 위험·비용이 큼)은 감수하되, 아래 회귀 안전망을 안 2 대비 강화하고 체크포인트 이슈를 액션 단위로 세분화해 상쇄한다.

## ADR 본문

### Context

`server-state-caching`(#148)에서 플레이리스트 목록은 `useQuery`로 캐시화됐지만 상세(`getPlaylistDetail`)는 두 소비처(`PlaylistDetailModal`, `usePlaylistRecommendations.selectPlaylist`)가 독립적으로 페칭한다. `PlaylistDetailModal`은 상세 조회 외에 4개의 자체 변경 액션(제목수정/곡추가/순서변경/삭제)을 가지며, 이 액션들은 현재 로컬 `useState` + 목록 캐시 `invalidateQueries` 조합으로 동작한다. 안전망은 배경 클릭 특성화 테스트 1개뿐이다.

### Decision

`playlistDetailQueryKey(playlistId)` 기반 `usePlaylistDetail` 공용 훅(`useQuery`, `staleTime: 60_000`)을 신설해 두 소비처가 캐시를 공유하도록 전환한다. `PlaylistDetailModal`의 4개 변경 액션은 각각 `useMutation`으로 재작성하되, 캐시 쓰기 시점은 **현재 동작을 그대로 보존**한다(#189 구현 중 정정 — 아래 참고).

> **정정(#190 착수 전 발견)**: 당초 "4개 액션 모두 `onMutate` 낙관적 쓰기"로 적었으나, 실제 코드를 다시 확인한 결과 낙관적으로 동작하는 것은 `requestChangeOrder`(순서변경/곡삭제) 경로뿐이었다(Fact, `moveSong`/`moveSongTo`/`deleteSelectedSongs`는 `await` 전에 `setSongs` 호출). `commitRename`/`handleAddSong`/삭제는 `await` **성공 이후에만** 로컬 state를 바꾼다 — 낙관적 업데이트가 아니다. 사용자에게 확인 결과 "현재 동작대로 진행"하기로 확정했다. 따라서:
>
> - `requestChangeOrder` 경로(이슈 5/#191): `onMutate`에서 낙관적 캐시 쓰기, `onError`에서 롤백 정책 적용(기존 동작 유지 — 롤백 없음, 이슈 5에서 재확인).
> - `commitRename`(이슈 4/#190), `handleAddSong`(이슈 6/#192), 삭제(이슈 7/#193): `onSuccess`에서만 캐시 쓰기(현재와 동일한 타이밍) — `onMutate` 낙관적 쓰기와 `onError` 롤백은 추가하지 않는다.

`usePlaylistRecommendations.selectPlaylist`는 `queryClient.ensureQueryData({queryKey: playlistDetailQueryKey(id), queryFn, staleTime: 60_000})`로 같은 캐시를 재사용하는 imperative 함수로 유지한다(컴포넌트 마운트에 종속되지 않는 사용자 액션이므로 `useQuery`로 바꾸지 않는다). 목록(`['playlists']`) 캐시는 지금처럼 각 mutation 성공 후 `invalidateQueries`로 최종 일치만 보장한다(PRD 결정 유지).

### Alternatives

안 1(자체 Map 캐시)은 저장소 전체가 이미 TanStack Query로 통일된 맥락에서 이 경로만 별도 캐시 구현을 추가해 기준 9·10에서 뚜렷이 열세라 기각. 안 2(경계 재설계, `setQueryData` 직접 패치)는 안 3보다 안전하지만, 사용자가 인터뷰에서 명시한 장기 일관성·재작업 방지 근거를 받아들여 기각(안 2는 "다음에 또 손대야 하는" 상태를 그대로 남긴다).

### Consequences

- 두 소비처가 캐시를 공유해 중복 요청이 사라지고, 4개 변경 액션의 낙관적 갱신/롤백 로직이 `usePostReactions`와 동일한 형태로 표준화된다.
- 대신 `PlaylistDetailModal`의 구현 복잡도가 일시적으로 늘어난다(4개 `useMutation` 훅 + `onMutate`/`onError` 롤백 로직). 안전망이 얇았던 만큼, 아래 체크포인트에서 특성화 테스트를 구조 변경보다 먼저 확보하는 순서를 강제한다.
- `usePlaylistRecommendations`의 로딩/에러 UX(mock 폴백)는 캐시 계층 도입과 무관하게 그대로 유지된다(PRD Out of Scope).

### Migration

아래 체크포인트 이슈 순서대로 진행한다. 각 이슈는 머지 후에도 저장소가 정상 상태를 유지한다.

### Rollback

`apps/api`/`packages/dto` 변경이 없고 DB/스키마 마이그레이션도 없으므로, 각 체크포인트 이슈는 해당 커밋만 `git revert`하면 이전 동작으로 즉시 복귀 가능하다. 4개 액션의 `useMutation` 전환을 액션별로 분리해뒀기 때문에, 특정 액션에서만 문제가 생기면 그 액션의 이슈만 되돌리고 나머지는 유지할 수 있다.

## 회귀 안전망

우선순위: Characterization → Contract → State-transition → Integration → E2E.

1. **Characterization** (최우선, 구조 변경 전에 반드시 먼저 추가)
   - `PlaylistDetailModal`: 초기 로드 성공/실패(toast), `moveSong`(up/down) 낙관적 반영 + API 호출 인자, `moveSongTo` 드래그 재정렬, `deleteSelectedSongs` 낙관적 제거, `handleAddSong`(낙관적 없음) 성공/실패, `commitRename` 유효성 검사(길이 제한/빈 문자열/미변경 시 조기 반환) + 성공/실패, 삭제 확인 오버레이(취소 시 미실행/확인 시 실행) + 실패 toast.
   - `usePlaylistRecommendations.selectPlaylist`: 현재 **테스트가 전혀 없음**(기존 테스트는 `getAllPlaylists` 경로만 커버) — 성공/실패(mock 폴백)/`selectedPlaylistId` 로딩 표시 전이를 새로 추가해야 한다.
2. **Contract**
   - `playlistDetailQueryKey(id)` 캐시 재사용: staleTime(60초) 내 같은 `playlistId`를 두 진입점에서 열면 `getPlaylistDetail`이 1회만 호출된다(Success Criteria).
   - 각 `useMutation`의 `onError` 시 캐시가 mutation 이전 값으로 정확히 롤백된다.
3. **State-transition**
   - `useQuery`의 `pending → success/error` 전이.
   - 각 `useMutation`의 `idle → pending → success/error` 전이와, `onMutate` 낙관적 쓰기 → `onError` 롤백 전이.
4. **Integration**
   - `PlaylistDetailModal`과 `usePlaylistRecommendations`(`MusicSearch` 경유)를 같은 `QueryClient` 아래 동시 마운트해 캐시 공유를 검증.
5. **E2E** — Out of Scope(기존 사이클과 동일하게 미다룸).

### 회귀 시나리오

| 시나리오                                                          | 기존 결과                                                                 | 검증 수준                                                | 실패 시 조치                            |
| ----------------------------------------------------------------- | ------------------------------------------------------------------------- | -------------------------------------------------------- | --------------------------------------- |
| `PlaylistDetailModal` 최초 마운트 시 `getPlaylistDetail` 1회 호출 | 성공 시 `playlist`/`songs` 채움, 실패 시 toast                            | Characterization                                         | 구현 중단                               |
| 곡 순서 변경(`moveSong`) 시 즉시 로컬 반영 후 API 호출            | 실패 시 toast, 로컬 상태는 낙관적으로 이미 바뀐 상태 유지(현재 롤백 없음) | Characterization → Contract(onError 롤백 도입 여부 확정) | 구현 중단, 롤백 동작 추가 여부 재검토   |
| 제목 편집 유효성 검사(21자 이상 등)                               | 저장 버튼/커밋 차단                                                       | Characterization                                         | 구현 중단                               |
| 삭제 확인 오버레이 취소                                           | 삭제 미실행                                                               | Characterization                                         | 구현 중단                               |
| `selectPlaylist` 실패 시 `MOCK_PLAYLIST_DETAILS` 폴백             | 폴백 데이터 반환 + `detailErrorMessage` 설정                              | Characterization(신규)                                   | 구현 중단                               |
| 같은 `playlistId`를 모달→위젯 순서로 순차 조회                    | (신규 계약) 두 번째는 `getPlaylistDetail` 미호출                          | Contract                                                 | Success Criteria 미달성으로 이슈 재작업 |

> 주의: 현재 `moveSong`/`deleteSelectedSongs`의 낙관적 로컬 갱신은 API 실패 시에도 **롤백하지 않는다**(코드 상 확인된 Fact). 안 3(`useMutation`)으로 전환하며 `onError` 롤백을 추가하면 이는 동작 변경이다 — Behavior Invariant를 "실패해도 롤백 없음(현재 동작)"으로 유지할지, 이번 기회에 "실패 시 롤백"으로 개선할지는 이슈 5(아래)에서 별도로 확정하고 `result.md`에 명시한다.
>
> **정정(#193 구현 중 발견)**: 삭제 성공 시 `queryClient.removeQueries({queryKey: playlistDetailQueryKey(playlistId)})`로 상세 캐시를 즉시 지우려 했으나, `PlaylistDetailModal` 자신이 아직 `usePlaylistDetail`을 구독 중인 상태(모달이 실제로 unmount되는 것은 `closeModal()` 이후 부모의 다음 렌더에서다)라 `removeQueries`가 그 구독을 즉시 재요청으로 이어지게 만드는 레이스가 발견됐다 — 방금 삭제한 `playlistId`를 다시 조회해 "불러오지 못했습니다" 에러가 잠깐 노출될 수 있다. 캐시 정리는 하지 않고 `staleTime` 경과에 맡기기로 했다(이슈 7 TODO에서 "캐시 정리" 항목 제외).

## 체크포인트 이슈 목록

각 이슈는 반나절~하루 크기, 한 이슈에서 한 종류의 변화만 다룬다.

1. **안전망 확보** — `PlaylistDetailModal` 4개 액션 + `usePlaylistRecommendations.selectPlaylist`의 characterization/계약 테스트 추가. 구조 변경 없음.
2. **`usePlaylistDetail` 훅 신설** — `playlistDetailQueryKey(playlistId)` + `useQuery`(`staleTime: 60_000`) 공용 훅 추가 및 단위 테스트. 아직 어떤 소비처도 전환하지 않음.
3. **`PlaylistDetailModal` 읽기 경로 전환** — 초기 로드(`initialFetchPlaylist`)를 `usePlaylistDetail`로 교체, 로컬 `playlist`/`songs` useState 제거. 4개 변경 액션은 아직 기존 방식(로컬 반영 + 목록 invalidate) 유지.
4. **`commitRename`을 `useMutation`으로 전환** — `onMutate` 낙관적 캐시 쓰기, `onError` 롤백(위 주의사항에서 확정한 정책 적용).
5. **`requestChangeOrder`(순서변경/곡삭제 공용 경로)를 `useMutation`으로 전환** — `moveSong`/`moveSongTo`/`deleteSelectedSongs`가 공유하는 경로.
6. **`handleAddSong`을 `useMutation`으로 전환** — 낙관적 갱신 없음(기존 제약 유지), 성공 시 캐시에 곡 추가 반영.
7. **삭제(`deletePlaylist`)를 `useMutation`으로 전환** — 확인 오버레이 흐름은 그대로, 성공 시 모달 닫힘 유지.
8. **`usePlaylistRecommendations.selectPlaylist` 캐시 재사용 전환** — `queryClient.ensureQueryData`로 `playlistDetailQueryKey` 재사용, mock 폴백 동작 유지.
9. **Success Criteria 계약 테스트 + dead code 제거** — 모달→위젯 순차 조회 시 네트워크 요청 생략 검증, 레거시 로컬 state/미사용 코드 완전 제거 확인.
10. **문서 갱신** — `docs/tanstack-query/index.html` Remaining Debt 표에서 이슈 #186 항목 갱신, `docs/refactors/playlist-detail-caching/result.md` 작성.

### 생성된 이슈

| 체크포인트                                       | 이슈 |
| ------------------------------------------------ | ---- |
| 1. 안전망 확보                                   | #187 |
| 2. `usePlaylistDetail` 훅 신설                   | #188 |
| 3. `PlaylistDetailModal` 읽기 경로 전환          | #189 |
| 4. `commitRename` → `useMutation`                | #190 |
| 5. `requestChangeOrder` → `useMutation`          | #191 |
| 6. `handleAddSong` → `useMutation`               | #192 |
| 7. 삭제 → `useMutation`                          | #193 |
| 8. `usePlaylistRecommendations` 캐시 재사용 전환 | #194 |
| 9. 계약 테스트 + dead code 제거                  | #195 |
| 10. 문서 갱신                                    | #196 |

프로젝트 보드 등록은 `gh` 버전이 2.4.0(2.20 미만, `gh project` 서브커맨드 미지원)이라 자동화하지 못했습니다 — 필요하면 수동으로 등록해주세요.

---

**[GATE 2]** 위 대안 선택, 인터뷰 로그, ADR 본문, 회귀 안전망, 이슈 분해를 확인해주시면 실제 GitHub 이슈를 생성하겠습니다.
