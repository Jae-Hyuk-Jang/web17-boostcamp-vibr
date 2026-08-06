# ADR — playlist-picker-cache-sync

## 3안 비교

### 안 1 — 최소 개선안

`saveToPlaylist` 성공 후 `PLAYLISTS_QUERY_KEY`만 `invalidateQueries`한다. `playlistDetailQueryKey`는 건드리지 않는다.

### 안 2 — 경계 재설계안 — **선택**

`saveToPlaylist`를 `useMutation`으로 감싸고, `usePlaylistDetailModal.ts`의 `addSongMutation`과 동일한 캐시 쓰기(`queryClient.setQueryData(playlistDetailQueryKey(playlistId), ...)` + `invalidateQueries({ queryKey: PLAYLISTS_QUERY_KEY })`)를 `PlaylistPickerModal.tsx` 안에 직접 구현한다. 두 파일에 유사한 캐시 쓰기 코드가 각각 존재하게 된다(코드 중복 감수).

### 안 3 — 검증된 패턴 도입안(공용 mutation 훅 추출)

`addSongMutation`의 캐시 쓰기 로직을 `hooks/playlist/useAddMusicsToPlaylistMutation.ts`(가칭) 공용 훅으로 분리해 `usePlaylistDetailModal.ts`와 `PlaylistPickerModal.tsx` 둘 다 재사용한다.

## 비교표 (10개 고정 기준)

| #   | 기준                 | 안 1                                                              | 안 2(선택)                                                                                          | 안 3                                                                                                                             |
| --- | -------------------- | ----------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| 1   | 근본 원인 해결력     | 낮음 — 이미 열린 상세 모달의 stale 문제는 그대로 남음             | 높음 — 목록·상세 캐시 둘 다 정확해짐, PRD Success Criteria 전부 충족                                | 높음 — 안 2와 동일 + 코드 중복까지 해소                                                                                          |
| 2   | 동작 보존 난이도     | 낮음 — 변경이 매우 작음                                           | 낮음 — 이미 검증된 `addSongMutation` 패턴을 그대로 복제                                             | 중간 — `usePlaylistDetailModal.ts`(21개+ 테스트가 붙은 안정된 파일)도 함께 리팩터링해야 해서 그 파일의 기존 동작까지 보존해야 함 |
| 3   | 책임·의존성 변화     | 매우 작음                                                         | 작음 — `PlaylistPickerModal.tsx` 1개 파일에 국한                                                    | 큼 — 신규 훅 파일 1개 + 기존 `usePlaylistDetailModal.ts` 수정                                                                    |
| 4   | 테스트 용이성        | 낮음 — 부분 해결이라 "목록은 되는데 상세는 안 됨"을 테스트해야 함 | 높음 — `PlaylistPickerModal.test.tsx`에 신규 테스트만 추가하면 됨                                   | 중간 — 공용 훅 자체 테스트는 쉽지만, 기존 `usePlaylistDetailModal.test.ts`(간접) 회귀 확인까지 필요                              |
| 5   | 변경 범위            | 작음 — 1개 파일                                                   | 작음 — 1~2개 파일(`PlaylistPickerModal.tsx` + 테스트)                                               | 중간~큼 — 3개 이상 파일(신규 훅 + 기존 훅 수정 + 피커 모달 + 관련 테스트 전부)                                                   |
| 6   | 점진적 전환 가능성   | 쉬움                                                              | 쉬움 — 캐시 갱신 로직이 새로 추가되는 것뿐, 기존 코드 건드릴 일 없음                                | 어려움 — 기존 훅 리팩터링과 신규 기능 도입이 한 사이클에 얽힘                                                                    |
| 7   | 롤백 가능성          | 쉬움                                                              | 쉬움 — 파일 1~2개, `git revert`로 즉시 복귀                                                         | 중간 — 두 소비처가 동시에 바뀌어 부분 롤백이 어려움                                                                              |
| 8   | 성능·운영 영향       | 무해                                                              | 무해                                                                                                | 무해                                                                                                                             |
| 9   | 기존 코드와의 일관성 | 낮음 — 부분 해결이라 `addSongMutation`과 여전히 다르게 동작       | 높음 — `addSongMutation`과 동일한 캐시 쓰기 패턴을 그대로 따름(코드는 두 곳에 있지만 "정책"은 동일) | 매우 높음 — 코드까지 단일 소스가 됨. 다만 `#218`(공용 mutation 팩토리)이 이미 두 번(다른 사유로) 기각된 이력과 겹치는 영역       |
| 10  | 유지 비용            | 낮지만 문제가 부분만 해결된 채로 유지비용이 이어짐                | 중간 — 유사 로직이 두 곳에 있어 향후 정책이 바뀌면 두 곳을 함께 고쳐야 함                           | 낮음(장기) — 다만 초기 도입 비용과 기존 안정 파일 리팩터링 위험이 이 사이클(버그 수정)의 목적과 안 맞음                          |

## 라이브러리 도입 심사

해당 없음 — 새 라이브러리 도입이 아니다(`useMutation`은 이미 도입됨).

## 의사결정 인터뷰 로그

**Q. playlist-picker-cache-sync ADR: `saveToPlaylist` 캐시 동기화, 3안 중 어느 안을 선택할까요?**
A. 안 2 — 경계 재설계안(추천). 이유: 변경 범위가 파일 1개로 좋다 — 이미 안정적이고 21개+ 테스트가 붙은 `usePlaylistDetailModal.ts`를 건드리지 않아, "심각" 버그 수정이라는 이번 사이클의 좋은 범위와 일치한다.

## 선택: 안 2

비교표 기준 1(근본 원인 해결력)·4(테스트 용이성)·9(일관성)에서 안 2가 안 1보다 뚜렷이 우세하고, 기준 2(동작 보존 난이도)·3(책임 변화)·6(점진적 전환)·7(롤백)에서 안 3보다 낮은 위험을 가진다. 안 3이 제시하는 코드 중복 제거는 실질적 이득이지만, 그 이득을 얻으려면 이미 안정된 `usePlaylistDetailModal.ts`를 이번 버그 수정 사이클에서 함께 리팩터링해야 해 범위와 위험이 불필요하게 커진다 — `#218`(공용 mutation 팩토리 검토)이 이미 두 번 같은 이유로 기각된 영역이기도 하다.

## ADR 본문

### Context

`PlaylistPickerModal.tsx`의 `saveToPlaylist`는 `addMusicsToPlaylist`를 직접 호출하고 캐시를 전혀 갱신하지 않는다. `usePlaylistDetailModal.ts`의 `addSongMutation`은 동일한 서버 동작에 대해 `setQueryData(playlistDetailQueryKey)` + `invalidateQueries(PLAYLISTS_QUERY_KEY)`를 이미 올바르게 수행한다(PRD Fact).

### Decision

`PlaylistPickerModal.tsx`에서:

- `saveToPlaylist`를 `useMutation`으로 전환한다. `mutationFn`은 `(playlistId: string) => addMusicsToPlaylist(playlistId, req)` 형태(단, `req`는 호출 시점의 `musics`에서 파생되므로 `mutate` 인자 설계는 구현 중 확정).
- `onSuccess`에서 `queryClient.setQueryData(playlistDetailQueryKey(playlistId), (prev) => prev ? { ...prev, musics: [...prev.musics, ...addedMusics] } : prev)`를 호출한다(`addSongMutation`과 동일 패턴).
- `onSuccess`에서 `queryClient.invalidateQueries({ queryKey: PLAYLISTS_QUERY_KEY })`를 호출한다(`handleCreateAndSave`가 새로 만든 플레이리스트도 이 invalidate로 목록에 반영됨 — 별도의 "생성" 캐시 쓰기는 필요 없음, 생성 자체는 목록에 아직 없다가 저장까지 성공한 뒤에야 노출되는 게 자연스러움).
- 기존 `handleSaveResultToast`/`setSubmitErrorMsg`/`closeModal()` 호출 시점과 로직은 그대로 유지한다 — `useMutation`으로의 전환은 mutation 실행부만 바꾸고 그 앞뒤의 오케스트레이션(`handleSelect`/`handleCreateAndSave`)은 최대한 그대로 둔다.

### Alternatives

안 1(목록만 invalidate)은 이미 열린 상세 모달의 stale 문제를 해결하지 못해 PRD Success Criteria를 절반만 달성, 기각. 안 3(공용 mutation 훅 추출)은 이미 안정된 `usePlaylistDetailModal.ts`를 이번 버그 수정 사이클에 함께 끌어들여 범위·위험이 불필요하게 커져 기각 — `#218`의 영역이라 별도로 검토하는 게 맞다(Follow-ups에 기록).

### Consequences

- `PlaylistPickerModal.tsx`가 `usePlaylistDetailModal.ts`의 `addSongMutation`과 유사한 캐시 쓰기 코드를 갖게 된다(의도적 중복, 비교표 기준 10 참고).
- 곡 저장/플레이리스트 생성 후 이미 열려 있는 다른 화면(상세 모달, 목록)이 최신 상태를 반영하게 된다 — 사용자에게 나쁠 게 없는 방향의 동작 변화(PRD Success Criteria가 목표한 바 그대로).
- `saveToPlaylist`가 `useMutation`이 되면서 로딩 상태(`submittingPlaylistId`/`isCreating`)와 mutation의 `isPending` 상태가 이론상 중복될 수 있으나, 기존 로컬 state 기반 로딩 표시는 Behavior Invariant로 그대로 유지하기로 확정했으므로 mutation의 내장 로딩 상태는 사용하지 않는다(기존 UI 로직 변경 최소화).

### Migration

`saveToPlaylist`의 mutation 전환과 캐시 쓰기 추가는 한 파일 안에서 상호 의존적이라(마이그레이션 순서를 쪼갤 이유가 약함) 한 커밋에서 처리한다. 다만 착수 전 현재(버그) 동작을 먼저 characterization test로 고정해두는 것이 안전하다 — 이 저장소의 `player-subscription-boundary` 사이클(#251)이 쓴 것과 동일한 전략("리팩터링 착수 전 현재 버그 동작을 특성화 테스트로 고정 → 이후 체크포인트에서 그 기대값을 새 기대값으로 갱신").

### Rollback

`apps/api`/`packages/dto` 변경이 없다. 핵심 변경이 파일 1~2개(`PlaylistPickerModal.tsx`, 테스트)에 집중되므로 `git revert`로 즉시 이전 상태로 복귀 가능하다.

## 회귀 안전망

우선순위: Characterization → Contract → State-transition → Integration → E2E. 착수 전 이 컴포넌트의 저장/생성 경로 전용 테스트가 0개이므로(PRD Fact) 이번 사이클의 안전망은 대부분 신규다.

1. **Characterization(신규, CP1)** — 현재(버그) 동작을 고정: 저장 성공 시 toast(`'보관함에 저장했어요.'`/`'이미 플레이리스트에 있는 곡이에요.'`)와 `closeModal` 호출, 저장 실패 시 에러 toast·`submitErrorMsg`, 생성+저장 성공/실패, `isSubmittable` 가드(진행 중 재클릭 방지). **그리고 이 시점엔 캐시가 갱신되지 않는다는 것도 명시적으로 특성화**(버그 상태를 문서화).
2. **Contract(신규, CP2에서 CP1의 캐시 미갱신 기대값을 갱신)** — 저장 성공 시 `playlistDetailQueryKey(playlistId)` 캐시에 `addedMusics`가 반영됨, `PLAYLISTS_QUERY_KEY`가 invalidate됨(재조회 트리거)을 직접 검증.
3. **State-transition** — 신규 추가 없음. `usePlaylists.test`류가 있다면 무관.
4. **Integration** — 신규 추가 없음. `PlaylistDetailCacheSharing.integration.test.tsx`는 이 컴포넌트를 다루지 않아 무관.
5. **E2E** — Out of Scope(브라우저 자동화 도구 없음).

### 회귀 시나리오

| 시나리오                                                 | 기존 결과                                            | 검증 수준                   | 실패 시 조치 |
| -------------------------------------------------------- | ---------------------------------------------------- | --------------------------- | ------------ |
| 저장 성공 시 toast·`closeModal` 호출                     | 기존 동작 그대로                                     | Characterization(신규, CP1) | 구현 중단    |
| 저장 실패 시 에러 toast·`submitErrorMsg` 설정, 모달 유지 | 기존 동작 그대로                                     | Characterization(신규, CP1) | 구현 중단    |
| 생성+저장 성공/실패                                      | 기존 동작 그대로                                     | Characterization(신규, CP1) | 구현 중단    |
| `isSubmittable`이 false면 재클릭 무시                    | 기존 동작 그대로                                     | Characterization(신규, CP1) | 구현 중단    |
| 저장 성공 시 `playlistDetailQueryKey` 캐시에 곡 반영     | (버그 수정 후) 반영됨 — CP1엔 "반영 안 됨"으로 고정  | Contract(신규, CP2)         | 설계 재검토  |
| 저장 성공 시 `PLAYLISTS_QUERY_KEY` invalidate            | (버그 수정 후) invalidate됨 — CP1엔 "안 됨"으로 고정 | Contract(신규, CP2)         | 설계 재검토  |

## 체크포인트 이슈 목록

각 이슈는 반나절 이내 크기. 이전 사이클들과 동일하게 하나의 브랜치에서 순서대로 구현하고 PR 1개로 병합한다. 안전망이 0개인 상태에서 시작하는 첫 사이클이라, 버그 동작을 먼저 특성화한 뒤 고치는 3단계로 구성한다.

1. **저장/생성 경로 특성화(현재 버그 동작 고정)** — `PlaylistPickerModal.test.tsx`에 저장/생성 성공·실패·`isSubmittable` 가드 테스트 추가, 캐시가 갱신되지 않는 현재 동작도 명시적으로 특성화. 구조 변경 없음, 먼저 머지해도 안전.
2. **`saveToPlaylist` 캐시 동기화** — `useMutation` 전환 + `setQueryData(playlistDetailQueryKey)` + `invalidateQueries(PLAYLISTS_QUERY_KEY)` 구현. CP1의 "캐시 미갱신" 기대값을 "갱신됨"으로 업데이트. 이 사이클의 핵심 변경.
3. **정리 + 문서 갱신** — `docs/component-hook-audit/index.html`의 관련 finding(심각도 "심각")에 해소 표시, 이 사이클의 `result.md` 작성.

### 생성된 이슈

| 체크포인트                    | 이슈 |
| ----------------------------- | ---- |
| 1. 저장/생성 경로 특성화      | #288 |
| 2. saveToPlaylist 캐시 동기화 | #289 |
| 3. 정리 + 문서 갱신           | #290 |

---

**[GATE 2]** 위 대안 선택, 인터뷰 로그, ADR 본문, 회귀 안전망, 이슈 분해를 확인해주시면 실제 GitHub 이슈를 생성하겠습니다.
