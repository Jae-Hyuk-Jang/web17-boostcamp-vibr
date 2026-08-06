# ADR — playlist-detail-orchestration

## 3안 비교

### 안 1 — 최소 개선안

4개 `useMutation`만 별도 훅으로 뽑고, UI 로컬 state 6개와 파생 핸들러는 `PlaylistDetailModal.tsx`에 그대로 둔다.

### 안 2 — 경계 재설계안 — **선택**

로컬 state 6개, mutation 4개, 파생 핸들러 전부(그리고 조회 실패 시 toast를 띄우는 `useEffect`까지)를 `hooks/playlist/usePlaylistDetailModal.ts` 하나로 통합 추출한다. `usePostDetailModal.ts`/`useContentWrite.ts`와 동일한 형태 — 훅이 typed result 객체를 반환하고, 컴포넌트는 그 훅을 불러 JSX를 조립하는 역할만 한다.

### 안 3 — 검증된 패턴 도입안(공용 mutation 팩토리 동시 도입)

안 2와 동일하게 전체를 추출하되, 4개 mutation의 거의 동일한 `onError: (e) => console.error(e)` + 캐시 갱신(`queryClient.setQueryData` + `bumpPlaylistRefresh`) 보일러플레이트를 백로그 `#218`("낙관적 업데이트 mutation 보일러플레이트 공통 훅화 검토")이 제안한 공용 팩토리(`usePlaylistDetailMutation(updater)` 형태)로 통합한다.

## 비교표 (10개 고정 기준)

| #   | 기준                 | 안 1                                                                                     | 안 2(선택)                                                                                                                                                                                        | 안 3                                                                                                                                       |
| --- | -------------------- | ---------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | 근본 원인 해결력     | 낮음 — state 6개가 컴포넌트에 남아 "오케스트레이션이 컴포넌트에 섞임" 문제가 절반만 해소 | 높음 — 오케스트레이션 전체가 컴포넌트 밖으로 나가 post/content-write와 동일 구조가 됨                                                                                                             | 높음 — 안 2와 동일 + 보일러플레이트 중복도 해소                                                                                            |
| 2   | 동작 보존 난이도     | 낮음 — mutation만 옮기면 되어 상대적으로 단순                                            | 낮음 — 4개 mutation·6개 state·핸들러 모두 순수 로직(JSX 의존 없음)이라 그대로 잘라 옮기면 됨(PRD Fact)                                                                                            | 중간 — 4개 mutation을 전부 새 팩토리 인터페이스로 재작성해야 해서, 기존 비대칭(순서변경만 onMutate)을 팩토리 파라미터로 정확히 재현해야 함 |
| 3   | 책임·의존성 변화     | 작음 — 신규 훅 파일 1개(mutation 전용)                                                   | 작음 — 신규 훅 파일 1개, 새 외부 의존성 없음                                                                                                                                                      | 큼 — 신규 팩토리 파일 1개 + 신규 훅 파일 1개, 팩토리에 4곳 모두 의존                                                                       |
| 4   | 테스트 용이성        | 낮음 — state가 컴포넌트에 남아 여전히 컴포넌트 렌더링을 거쳐야 검증 가능                 | **높음** — 기존 21개 통합 테스트가 전부 DOM/캐시 assertion 기반이라 구현 세부(어디에 코드가 있는지)에 의존하지 않음, 수정 없이 통과 가능(PRD 목표 인터뷰에서 신규 훅 단위 테스트는 불필요로 확정) | 중간 — 팩토리 자체의 단위 테스트가 새로 필요할 가능성                                                                                      |
| 5   | 변경 범위            | 작음 — 파일 2개(컴포넌트 + 신규 mutation 훅)                                             | 작음 — 파일 2개(컴포넌트 + 신규 훅)                                                                                                                                                               | 중간~큼 — 파일 3개(컴포넌트 + 신규 훅 + 신규 팩토리)                                                                                       |
| 6   | 점진적 전환 가능성   | 쉬움 — mutation만 먼저 옮기고 나머지는 나중에 가능                                       | 낮음 — 같은 컴포넌트 안에서 여러 state·핸들러가 서로 참조해 한 커밋에서 같이 옮겨야 컴파일이 유지됨(아래 Migration 참고)                                                                          | 어려움 — 팩토리가 4개 요구사항(비대칭 낙관적 정책 포함)을 동시에 만족해야 해서 한 번에 설계해야 함                                         |
| 7   | 롤백 가능성          | 쉬움                                                                                     | 쉬움 — 파일 2개, 커밋 1~2개 단위로 `git revert`                                                                                                                                                   | 중간 — 팩토리 도입과 4곳 교체가 얽히면 부분 롤백이 어려움                                                                                  |
| 8   | 성능·운영 영향       | 무해                                                                                     | 무해 — 코드 위치만 이동, 렌더 트리·리렌더 조건 변화 없음                                                                                                                                          | 무해 — 안 2와 동일                                                                                                                         |
| 9   | 기존 코드와의 일관성 | 낮음 — 여전히 "일부는 훅, 일부는 컴포넌트"라는 절충 상태로 남음                          | **매우 높음** — `usePostDetailModal`/`useContentWrite`와 완전히 동일한 조직 형태(하나의 훅이 오케스트레이션 전체를 가짐)                                                                          | 중간 — `usePostDetailModal`에는 없는 "공용 mutation 팩토리"라는, 이 저장소에 아직 없는 새 패턴을 도입                                      |
| 10  | 유지 비용            | 중간 — 절충 상태 자체가 다음에 또 손댈 이유가 됨                                         | 낮음 — 오케스트레이션이 한 곳(훅)에 모임                                                                                                                                                          | 낮음(장기, #218이 저장소 전체에 적용되면) / 초기 설계·검증 비용 높음                                                                       |

## 라이브러리 도입 심사

해당 없음 — 새 라이브러리 도입이 아니다. `useMutation`/`useQuery`는 이미 이 컴포넌트가 쓰고 있고, 이번 변경은 기존 코드를 다른 파일로 옮기는 것뿐이다.

## 의사결정 인터뷰 로그

**Q. playlist-detail-orchestration ADR: `PlaylistDetailModal` 오케스트레이션 훅 추출, 3안 중 어느 안을 선택할까요?**
A. 안 2 — 경계 재설계안(추천). 이유: PRD Goal(post/content-write와 동일한 조직 일관성)을 완전히 달성하고, 기존 21개 통합 테스트가 그대로 통과할 가능성이 가장 높다. 안 3(공용 mutation 팩토리)이 제시하는 추가 이득(보일러플레이트 통합)은 백로그 `#218`의 영역이라 지금 같이 하면 변경 범위와 회귀 위험만 커진다는 비교표 근거를 그대로 채택.

## 선택: 안 2

비교표 기준 1(근본 원인 해결력)·9(기존 코드 일관성)에서 안 2가 안 1보다 뚜렷이 우세하고, 기준 2(동작 보존 난이도)·3(책임 변화)·5(변경 범위)·6(점진적 전환)·7(롤백 가능성) 전부에서 안 3보다 낮은 위험을 가진다. `playlist-detail-state-consolidation` 사이클의 ADR에서도 동일한 논리로 "공용 mutation 팩토리 동시 도입"을 기각하고 `#218`로 미뤘던 선례를 그대로 따른다 — `#218`이 필요한지는 이 도메인만이 아니라 저장소 전체(post 포함) mutation 보일러플레이트를 같이 보고 결정하는 게 맞다.

## ADR 본문

### Context

`PlaylistDetailModal.tsx`(251줄)는 로컬 state 6개, `useMutation` 4개, 파생 핸들러 12개, 조회 실패 시 toast를 띄우는 `useEffect` 1개가 컴포넌트 함수 본문에 전부 있다. `usePostDetailModal.ts`/`useContentWrite.ts`는 동일한 성격의 오케스트레이션을 컴포넌트 밖 훅으로 분리해 `UseXxxResult` 타입의 객체를 반환하고, 소비 컴포넌트는 그 훅을 불러 JSX만 조립한다. `PlaylistDetailModal`만 이 조직 방식에서 벗어나 있다(PRD Fact).

### Decision

`hooks/playlist/usePlaylistDetailModal.ts`를 신설해 다음을 전부 이관한다: `usePlaylistDetail` 구독과 조회 실패 toast `useEffect`, 로컬 state 6개, mutation 4개, 파생 핸들러 전부(`onPlayTotalSongs`/`toggleSelectSong`/`requestChangeOrder`/`deleteSelectedSongs`/`moveSong`/`moveSongTo`/`handleAddSong`/`startRename`/`validateRename`/`commitRename`/`cancelRename`/`requestDeletePlaylist`), `useModalStore`의 `closeModal`(`deleteMutation.onSuccess`가 필요), `usePlayerStore`의 `addToQueue`/`selectMusic`(`onPlayTotalSongs`가 필요).

반환 객체는 `useContentWrite`처럼 평평하게 두지 않고, `usePostDetailModal`의 `editing`/`player` 그룹핑 선례를 따라 관심사별로 묶는다 — 예: `playlist`/`songs`(데이터), `titleEditing: { isEditing, draftTitle, isInvalid, start, change, commit, cancel }`, `selection: { selectedIds, toggle, deleteSelected }`, `search: { query, setQuery, handleAddSong }`, `confirmDelete: { isOpen, request, cancel, confirm }`, `onPlayTotalSongs`, `closeModal`. 정확한 필드 이름·그룹 경계는 구현 중 `Header`/`SongList`/`Toolbar`가 실제로 받는 prop 이름에 맞춰 확정한다(Success Criteria: 그 prop들의 이름·타입·값 자체는 바뀌지 않음).

`PlaylistDetailModal.tsx`는 이 훅을 호출하고, 반환값을 그대로 `Header`/`SongList`/`Toolbar`/`MusicPickerSearch`/`ConfirmOverlay`에 나눠 전달하는 조립부만 남는다.

### Alternatives

안 1(mutation만 분리)은 PRD Goal(조직 일관성 완전 달성)을 절반만 달성해 기각. 안 3(공용 mutation 팩토리 동시 도입)은 `#218`의 영역까지 건드려 변경 범위·회귀 위험이 불필요하게 커져 기각 — `playlist-detail-state-consolidation` ADR에서 이미 같은 이유로 한 번 기각된 선택지다.

### Consequences

- `PlaylistDetailModal.tsx`가 조립에만 집중하게 되어 post/content-write 도메인과 조직 방식이 일치한다.
- 신규 훅(`usePlaylistDetailModal.ts`)이 `usePlaylistDetail.ts`/`usePlaylistRecommendations.ts`와 같은 폴더(`hooks/playlist/`)에 놓여, 향후 이 도메인에서 훅을 찾을 때 예측 가능한 위치가 하나 더 생긴다.
- 백로그 `#275`(Header/SongList/Toolbar Context 전환) 착수 시, 이 훅의 반환값을 그대로 Context로 감싸면 되어 작업이 단순해진다(PRD가 명시한 기대 효과).
- 부수 효과 없음 — 순수 코드 이동이라 관찰 가능한 동작 변화가 전혀 없어야 한다(다른 사이클들과 달리 이번엔 "의도된 관찰 가능한 차이"가 없다).

### Migration

`PlaylistDetailModal.tsx` 안에서 여러 state·핸들러가 서로 참조한다(예: `deleteSelectedSongs`가 `selectedSongIds`와 `requestChangeOrder`를 모두 씀) — 훅으로 부분만 옮기면 컴포넌트와 훅 사이에서 값을 다시 주고받아야 해 오히려 복잡해진다. 하나의 이슈·하나의 커밋에서 전체를 원자적으로 옮긴다(이전 사이클의 CP2와 동일한 성격 — "읽기 경로만 먼저, 나머지는 나중에" 식으로 쪼갤 근거가 없음).

### Rollback

`apps/api`/`packages/dto` 변경이 없고 DB 마이그레이션도 없다. 핵심 변경이 파일 2개(신규 `usePlaylistDetailModal.ts`, `PlaylistDetailModal.tsx`)에 집중되므로 `git revert`로 즉시 이전 상태로 복귀 가능하다.

## 회귀 안전망

우선순위: Characterization → Contract → State-transition → Integration → E2E. 목표 인터뷰에서 신규 훅 단위 테스트는 추가하지 않기로 확정했으므로, 기존 안전망을 그대로 물려받는 것이 이번 사이클의 핵심 전략이다.

1. **Characterization** — 신규 추가 없음. `PlaylistDetailModal.test.tsx`의 기존 21개(4개 액션의 성공/실패/유효성검사, 캐시 반영, 연속 mutation 후 재요청 없음 등)가 이미 전부 커버한다.
2. **Contract** — 신규 추가 없음. 기존 21개 중 다수가 `queryClient.getQueryData`로 캐시를 직접 검증하는 계약 테스트다.
3. **State-transition** — 신규 추가 없음. `usePlaylistDetail.test.ts`(조회 훅 자체의 pending→success/error 전이)는 이번 변경과 무관, 그대로 유지.
4. **Integration** — 신규 추가 없음. `PlaylistDetailCacheSharing.integration.test.tsx`(모달↔추천 위젯 캐시 공유)는 무관, 그대로 유지.
5. **E2E** — Out of Scope(기존 사이클과 동일, 브라우저 자동화 도구 없음).

### 회귀 시나리오

| 시나리오                                                            | 기존 결과                                    | 검증 수준                    | 실패 시 조치 |
| ------------------------------------------------------------------- | -------------------------------------------- | ---------------------------- | ------------ |
| 최초 마운트 시 `getPlaylistDetail` 1회 호출 후 곡 목록 렌더링       | 성공 시 렌더링, 실패 시 toast                | Characterization(기존)       | 구현 중단    |
| 4개 액션(제목수정/곡추가/순서변경/삭제) 각각의 성공/실패/유효성검사 | 각 Behavior Invariant대로 동작               | Characterization(기존)       | 구현 중단    |
| 4개 액션 성공 시 `playlistDetailQueryKey` 캐시 반영                 | 캐시에 반영됨                                | Contract(기존)               | 구현 중단    |
| 연속 mutation 후 추가 `getPlaylistDetail` 호출 없음                 | 로컬 state를 캐시에서 재시딩하는 경로가 없음 | Contract(기존)               | 구현 중단    |
| 모달↔추천 위젯 캐시 공유                                            | 두 번째부터 네트워크 요청 생략               | Integration(기존)            | 구현 중단    |
| `Header`/`SongList`/`Toolbar`가 받는 prop 이름·타입·값 불변         | 코드 이동 전후 동일                          | 코드 리뷰(구현 중 직접 확인) | 구현 중단    |

## 체크포인트 이슈 목록

각 이슈는 반나절 이내 크기. 이전 사이클과 동일하게 하나의 브랜치에서 순서대로 구현하고 PR 1개로 병합한다. 신규 안전망 구축이 필요 없는(기존 21개로 충분하다고 이미 확정) 첫 사이클이라, 이전 두 사이클(3개)보다 적은 2개로 충분하다.

1. **훅 추출 + 컴포넌트 조립화** — `hooks/playlist/usePlaylistDetailModal.ts` 신설, `PlaylistDetailModal.tsx`의 state 6개·mutation 4개·핸들러 전부·조회 실패 toast `useEffect`를 이관. 컴포넌트는 훅을 호출해 JSX만 조립. 기존 21개 테스트 회귀 없이 통과 확인. 이 사이클의 핵심 변경(원자적, Migration 참고).
2. **정리 + 문서 갱신** — dead code(미사용 import 등) 확인, `docs/component-hook-audit/index.html`에 관련 finding이 있다면 해소 표시, 이 사이클의 `result.md` 작성.

### 생성된 이슈

| 체크포인트                    | 이슈 |
| ----------------------------- | ---- |
| 1. 훅 추출 + 컴포넌트 조립화  | #281 |
| 2. Dead code 정리 + 문서 갱신 | #282 |

---

**[GATE 2]** 위 대안 선택, 인터뷰 로그, ADR 본문, 회귀 안전망, 이슈 분해를 확인해주시면 실제 GitHub 이슈를 생성하겠습니다.
