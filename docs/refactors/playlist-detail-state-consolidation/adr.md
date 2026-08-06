# ADR — playlist-detail-state-consolidation

## 3안 비교

### 안 1 — 최소 개선안

구조(로컬 state가 렌더링 소스)는 그대로 두고, 4개 mutation이 반복하는 "로컬 state 쓰기 + 캐시 쓰기 + 목록 invalidate" 3중 패턴을 `applyPlaylistUpdate(updater)` 같은 공용 헬퍼로 묶어 중복만 줄인다.

### 안 2 — 경계 재설계안 — **선택**

`playlist`/`songs` 로컬 `useState`와 `hasSeededRef`를 완전히 제거하고, `usePlaylistDetail(playlistId).data`를 렌더링의 직접 소스로 쓴다(`const { data: playlist } = usePlaylistDetail(playlistId); const songs = playlist?.musics ?? [];`). 4개 mutation은 **이미 존재하는** `queryClient.setQueryData(playlistDetailQueryKey(...))` 호출을 그대로 두고, 함께 있던 로컬 `setSongs`/`setPlaylist` 호출만 제거한다. `usePostDetail.ts`와 완전히 동일한 형태.

### 안 3 — 검증된 패턴 도입안(공용 mutation 팩토리)

안 2와 동일하게 캐시를 단일 소스로 만들되, 추가로 4개 mutation의 거의 동일한 `onError: (e) => { console.error(e); }` + 실패 `toast.error('요청 처리에 실패했습니다.')` 보일러플레이트까지 `usePlaylistDetailMutation(updater)` 같은 공용 팩토리로 통합한다(백로그 #218 "낙관적 업데이트 mutation 보일러플레이트 공통 훅화 검토"와 겹치는 영역).

## 비교표 (10개 고정 기준)

| #   | 기준                 | 안 1                                                     | 안 2(선택)                                                                                                                                                                                                    | 안 3                                                                                                                                                    |
| --- | -------------------- | -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | 근본 원인 해결력     | 낮음 — 이중 소스 구조 자체는 그대로 남음                 | 높음 — 이중 소스가 구조적으로 사라짐(지킬 대상이 하나뿐이라 재시딩 버그 클래스 자체가 성립 불가)                                                                                                              | 높음 — 안 2와 동일 + 보일러플레이트 중복도 해소                                                                                                         |
| 2   | 동작 보존 난이도     | 낮음 — 기존 로직 거의 그대로                             | **낮음** — 4개 mutation의 캐시 쓰기 코드는 이미 정확히 존재함(Fact, 아래 Context 참고). 로컬 setter 호출만 삭제                                                                                               | 중간 — 4개 mutation을 전부 새 팩토리 인터페이스로 재작성해야 해서, 기존 write-timing 비대칭(순서변경만 onMutate)을 팩토리 파라미터로 정확히 재현해야 함 |
| 3   | 책임·의존성 변화     | 매우 작음 — 헬퍼 함수 1개 추가                           | 작음 — `useState`/`useEffect` 3개 제거, 새 의존성 없음                                                                                                                                                        | 큼 — 신규 팩토리 파일 1개 + 4곳 모두 그 팩토리로 재작성                                                                                                 |
| 4   | 테스트 용이성        | 낮음 — 이중 소스 관련 위험은 테스트로 못 줄임            | **매우 높음** — 기존 `PlaylistDetailModal.test.tsx` 20개는 전부 DOM/캐시 assertion 기반이라 구현 세부(로컬 state 존재 여부)에 의존하지 않음, 수정 없이 그대로 통과 가능                                       | 중간 — 팩토리 자체의 단위 테스트가 새로 필요                                                                                                            |
| 5   | 변경 범위            | 작음                                                     | 작음 — `PlaylistDetailModal.tsx` 1개 파일                                                                                                                                                                     | 중간~큼 — 신규 팩토리 파일 + `PlaylistDetailModal.tsx` 4곳 전부                                                                                         |
| 6   | 점진적 전환 가능성   | 쉬움                                                     | 낮음 — 같은 파일 안에서 `useState` 제거와 4개 setter 제거가 상호 의존적이라 한 커밋에서 같이 처리해야 컴파일이 유지됨(아래 Migration 참고)                                                                    | 어려움 — 팩토리가 4개 요구사항을 동시에 만족해야 해서 한 번에 설계해야 함                                                                               |
| 7   | 롤백 가능성          | 쉬움                                                     | 쉬움 — 파일 1개, 커밋 1~2개 단위로 `git revert`                                                                                                                                                               | 중간 — 팩토리 도입과 4곳 교체가 얽히면 부분 롤백이 어려움                                                                                               |
| 8   | 성능·운영 영향       | 무해                                                     | 긍정적 — 리렌더 경로가 `data` 하나로 단순화. 부수 효과: 60초 staleTime 경과 후 background refetch가 발생하면 화면이 최신 서버 상태를 반영(현재는 최초 시딩 이후 이 컴포넌트의 mutation 외 갱신은 영구 무시됨) | 안 2와 동일 + 팩토리 초기 실행 비용 미미                                                                                                                |
| 9   | 기존 코드와의 일관성 | 낮음 — 이중 소스 패턴이 남아 `usePostDetail`과 계속 다름 | **매우 높음** — `usePostDetail.ts`와 완전히 동일한 형태(로컬 state 없이 `data` 직접 사용)                                                                                                                     | 중간 — `usePostDetail`에는 없는 "공용 mutation 팩토리"라는, 이 저장소에 아직 없는 새 패턴을 도입                                                        |
| 10  | 유지 비용            | 중간 — 중복은 줄어도 이중 소스 유지비용은 그대로         | 낮음 — 캐시 1곳만 쓰면 됨                                                                                                                                                                                     | 낮음(장기), 초기 설계·검증 비용 높음                                                                                                                    |

## 라이브러리 도입 심사

해당 없음 — 새 라이브러리 도입이 아니다. TanStack Query는 `server-state-caching`(#148)에서 이미 도입·검증됐고, `usePlaylistDetail`(#188)도 이미 구현돼 있다. 이번 사이클은 기존 훅을 렌더링에 더 직접적으로 연결하는 것뿐이다.

## 의사결정 인터뷰 로그

**Q. 3안 중 어느 안을 선택할까요?**
A. 안 2 — 경계 재설계안(추천). 이유: GATE 1에서 결정한 우선순위(일관성/근본 해결)를 가장 직접적으로 달성하고, `usePostDetail`과 동일한 형태가 된다. 안 3(공용 mutation 팩토리)이 제시하는 추가 이득(보일러플레이트 통합)은 이 PRD가 스코프하지 않은 백로그 #218의 영역이라, 지금 같이 하면 변경 범위와 회귀 위험만 커진다는 비교표 근거를 그대로 채택.

## 선택: 안 2

비교표 기준 1(근본 원인 해결력)·4(테스트 용이성)·9(기존 코드 일관성)에서 안 2가 안 1보다 뚜렷이 우세하고, 기준 2(동작 보존 난이도)·3(책임 변화)·5(변경 범위)·6(점진적 전환)·7(롤백 가능성) 전부에서 안 3보다 낮은 위험을 가진다. 특히 기준 2는 착수 전 예상과 달리 "새로 작성"이 아니라 "이미 있는 코드의 절반을 삭제"에 가깝다는 사실이 확인되면서(아래 Context 참고) 안 2의 위험이 애초 예상보다 낮아졌다 — 이 발견이 안 3(더 큰 범위로 문제를 한 번에 해결)을 굳이 선택할 유인을 약화시켰다.

## ADR 본문

### Context

`PlaylistDetailModal.tsx`는 `usePlaylistDetail`(TanStack Query)로 상세를 조회하지만, 렌더링 소스는 별도 로컬 `useState`(`playlist`/`songs`)다. 쿼리 결과는 `hasSeededRef` 가드로 최초 1회만 로컬 state에 복사되며, 이 가드는 이전 사이클(#189)에서 "로컬 state를 캐시로부터 매번 재파생시키려다 실제로 겪은 재시딩 버그"를 막기 위해 추가됐다(Fact, `playlist-detail-caching/result.md`).

4개 mutation(`changeOrderMutation`/`addSongMutation`/`renameMutation`/`deleteMutation`)을 다시 확인한 결과, **캐시 쓰기 코드는 이미 정확하게 구현돼 있다**:

- `changeOrderMutation.onMutate`: `setSongs(nextSongs)` + `queryClient.setQueryData(playlistDetailQueryKey(id), (prev) => prev ? {...prev, musics: nextSongs} : prev)` — 둘 다 존재.
- `addSongMutation.onSuccess`: `setSongs((prev) => [...prev, ...addedMusics])` + 동일한 형태의 `setQueryData` — 둘 다 존재.
- `renameMutation.onSuccess`: `setPlaylist((prev) => ...)` + 동일한 형태의 `setQueryData` — 둘 다 존재.
- `deleteMutation.onSuccess`: 로컬 setter도, 캐시 쓰기도 원래 없다(캐시는 `staleTime` 경과에 맡기는 의도적 결정, #193). 이번 변경과 무관.

즉 로컬 `useState`를 제거해도 **새로 작성해야 할 캐시 쓰기 로직이 없다** — 이미 나란히 존재하는 두 쓰기 중 로컬 쪽만 삭제하면 된다.

### Decision

`playlist`/`songs` `useState`와 `hasSeededRef` + 시딩 `useEffect`를 제거한다. `usePlaylistDetail(playlistId)`의 `data`를 `playlist`로, `playlist?.musics ?? []`를 `songs`로 파생해 렌더링에 직접 쓴다. 4개 mutation은 기존 `queryClient.setQueryData` 호출을 그대로 두고 로컬 `setSongs`/`setPlaylist` 호출만 제거한다. 낙관적 업데이트 비대칭(순서변경만 `onMutate`), 실패 시 롤백 없음, 삭제 후 캐시 미정리 등 기존 Behavior Invariant는 전부 그대로 보존한다(PRD Out of Scope).

### Alternatives

안 1(헬퍼 함수로 중복만 제거)은 PRD가 GATE 1에서 확정한 목표("일관성/근본 해결")를 달성하지 못해 기각. 안 3(공용 mutation 팩토리 동시 도입)은 이 PRD가 스코프하지 않은 백로그 #218 영역까지 건드려 변경 범위·회귀 위험이 불필요하게 커져 기각 — `usePlaylistDetailMutation` 같은 팩토리가 필요한지는 #218에서 이 도메인 것만이 아니라 저장소 전체(post/playlist 등) mutation 보일러플레이트를 같이 보고 결정하는 게 맞다(Follow-ups에 기록).

### Consequences

- `PlaylistDetailModal.tsx`의 상태 소스가 하나로 줄어 재시딩 버그 클래스가 구조적으로 재발 불가능해진다.
- 부수 효과(관찰 가능한 차이, Behavior Invariant 위반 아님): `staleTime`(60초) 경과 후 background refetch가 발생하면 화면이 최신 서버 상태를 반영하게 된다 — 기존엔 최초 시딩 이후 이 컴포넌트의 mutation 외 갱신은 영구 무시됐다. 사용자에게 나쁠 게 없는 방향의 차이라 별도 이슈로 다루지 않되, result.md에 명시적으로 기록한다.
- 대신 `data`가 `undefined`인 구간(최초 로딩)의 조건부 렌더링(`data && (...)`)이 기존 `playlist && (...)`와 동일하게 동작하는지 구현 중 직접 확인이 필요하다.

### Migration

단일 파일(`PlaylistDetailModal.tsx`) 안에서 읽기 경로 전환과 로컬 setter 제거가 상호 의존적이라(로컬 `useState`를 지우면 그걸 참조하는 4개 setter 호출이 즉시 컴파일 에러가 됨) 두 변경을 한 이슈·한 커밋에서 함께 처리한다 — 이전 사이클처럼 "읽기 경로만 먼저, mutation은 나중에" 식으로 쪼갤 수 없다(이전 사이클은 `useState`가 끝까지 남아있어 점진적 전환이 가능했지만, 이번엔 그 `useState` 자체가 제거 대상이라 다르다). 아래 체크포인트 이슈 목록 참고.

### Rollback

`apps/api`/`packages/dto` 변경이 없고 DB 마이그레이션도 없다. 핵심 변경이 파일 1개(`PlaylistDetailModal.tsx`)의 커밋 1~2개에 집중되므로 `git revert`로 즉시 이전 상태(로컬 state 기반)로 복귀 가능하다.

## 회귀 안전망

우선순위: Characterization → Contract → State-transition → Integration → E2E. 이전 사이클(#187)이 이미 만들어둔 안전망(20개 characterization/contract 테스트, `PlaylistDetailModal.test.tsx`)을 그대로 물려받는다 — 전부 DOM(`screen.findByText`/`getAllByRole` 등)과 `queryClient.getQueryData` assertion 기반이라 구현 세부(로컬 state 유무)에 의존하지 않으므로, 안 2 구현 후에도 **수정 없이 그대로 통과할 것으로 예상**(구현 중 실제로 확인).

1. **Characterization** — 신규 추가 없음(기존 20개가 이미 4개 액션 전부의 성공/실패/유효성검사/낙관적 반영을 커버).
2. **Contract(신규 1개)** — "연속된 mutation(예: 제목 수정 → 순서 변경) 이후에도 `getPlaylistDetail`이 추가로 호출되지 않는다"를 직접 검증 — 재시딩/재요청 루프가 없음을 이번 변경이 목표로 하는 바 그대로 증명하는 테스트.
3. **State-transition** — 기존 `usePlaylistDetail.test.ts`의 `pending → success/error` 전이 테스트로 이미 커버, 변경 없음.
4. **Integration** — 기존 `PlaylistDetailCacheSharing.integration.test.tsx`(모달↔추천 위젯 캐시 공유)로 이미 커버, 변경 없음.
5. **E2E** — Out of Scope(기존 사이클과 동일).

### 회귀 시나리오

| 시나리오                                                              | 기존 결과                                            | 검증 수준              | 실패 시 조치                                              |
| --------------------------------------------------------------------- | ---------------------------------------------------- | ---------------------- | --------------------------------------------------------- |
| 최초 마운트 시 `getPlaylistDetail` 1회 호출 후 곡 목록 렌더링         | 성공 시 렌더링, 실패 시 toast                        | Characterization(기존) | 구현 중단                                                 |
| 4개 액션(제목수정/곡추가/순서변경/삭제) 각각의 성공/실패/유효성검사   | 각 Behavior Invariant대로 동작                       | Characterization(기존) | 구현 중단                                                 |
| 4개 액션 성공 시 `playlistDetailQueryKey` 캐시 반영                   | 캐시에 반영됨(이미 존재하는 assertion)               | Contract(기존)         | 구현 중단                                                 |
| 연속 mutation 후 추가 `getPlaylistDetail` 호출 없음(재시딩 루프 없음) | (신규) 로컬 state 자체가 없으니 재시딩할 대상도 없음 | Contract(신규)         | 설계 재검토 — 재시딩 문제가 재현되면 안 2 폐기하고 재검토 |
| 모달↔추천 위젯 캐시 공유(같은 playlistId 순차 조회 시 요청 1회)       | 두 번째부터 네트워크 요청 생략                       | Integration(기존)      | 구현 중단                                                 |

## 체크포인트 이슈 목록

이전 사이클(10개)보다 적은 이유: 핵심 변경이 단일 파일 안에서 상호 의존적인 원자적 변경이라(위 Migration 참고), 여러 소비처를 하나씩 옮기는 이전 사이클과 달리 인위적으로 잘게 쪼갤 근거가 없다. 각 이슈는 반나절 이내 크기.

1. **회귀 안전망 보강** — "연속 mutation 후 추가 네트워크 요청 없음" 계약 테스트 추가. 구조 변경 없음, 먼저 머지해도 안전.
2. **로컬 state 제거 + 읽기/쓰기 경로 통합** — `playlist`/`songs` useState, `hasSeededRef`, 시딩 `useEffect` 제거. `usePlaylistDetail().data` 기반 파생값 사용. 4개 mutation에서 로컬 setter 호출 제거(캐시 쓰기는 유지). 이 사이클의 핵심 변경.
3. **정리 + 문서 갱신** — dead code(미사용 import 등) 확인, `playlist-detail-caching/result.md` Remaining Debt 항목 갱신, 이 사이클의 `result.md` 작성.

### 생성된 이슈

| 체크포인트                     | 이슈 |
| ------------------------------ | ---- |
| 1. 회귀 안전망 보강            | #271 |
| 2. 로컬 state 제거 + 경로 통합 | #272 |
| 3. 정리 + 문서 갱신            | #273 |

프로젝트 보드 등록은 `gh` 버전이 2.4.0(2.20 미만, `gh project` 서브커맨드 미지원)이라 자동화하지 못했습니다 — 필요하면 수동으로 등록해주세요.

---

**[GATE 2]** 위 대안 선택, 인터뷰 로그, ADR 본문, 회귀 안전망, 이슈 분해를 확인해주시면 실제 GitHub 이슈를 생성하겠습니다.
