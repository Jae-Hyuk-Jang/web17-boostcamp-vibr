# ADR — playlist-detail-prop-drilling

## 3안 비교

### 안 1 — 최소 개선안

Context를 도입하지 않고, `PlaylistDetailModal.tsx`가 훅의 그룹 객체(`titleEditing`/`selection`/`search`/`confirmDelete`)를 낱개로 풀지 않고 통째로 `Header`/`SongList`/`Toolbar`에 넘긴다(예: `<Header {...titleEditing} title={...} .../>` 또는 그룹 객체 자체를 단일 prop으로). prop *개수*는 줄지만 `PlaylistDetailModal.tsx`는 여전히 중간 경유지로 남는다.

### 안 2 — 경계 재설계안 — **선택**

`PostDetailModalContext`/`ContentWriteContext`와 동일한 3단 구조(`PlaylistDetailModalValueProvider`(순수 주입, 단독 테스트용) → `PlaylistDetailModalProvider`(훅 호출, 유일한 호출 지점) → `usePlaylistDetailModalContext()`)로 `PlaylistDetailModalContext`를 신설한다. `Header`/`SongList`/`Toolbar`가 zero-prop이 되어 각자 이 Context 훅을 직접 호출한다.

### 안 3 — 검증된 패턴 도입안(zustand 슬라이스)

React Context 대신 이 모달 전용 zustand 스토어를 새로 만들어 값을 공급한다.

## 비교표 (10개 고정 기준)

| #   | 기준                 | 안 1                                                                  | 안 2(선택)                                                                                                       | 안 3                                                                                                                              |
| --- | -------------------- | --------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| 1   | 근본 원인 해결력     | 낮음 — `PlaylistDetailModal.tsx`가 여전히 중간 경유지로 남음          | 높음 — 소유자(훅)와 소비자(leaf) 사이 중계자가 구조적으로 사라짐                                                 | 높음 — 안 2와 동일하게 중계자는 사라지지만 잘못된 도구 선택(아래 근거)                                                            |
| 2   | 동작 보존 난이도     | 낮음 — prop 값 자체는 그대로, 묶는 방식만 바뀜                        | 낮음 — 이미 이 저장소에서 2번 검증된 패턴을 3번째로 그대로 적용                                                  | 중간 — 새 스토어 초기화·구독 타이밍을 처음부터 검증해야 함                                                                        |
| 3   | 책임·의존성 변화     | 매우 작음                                                             | 작음 — 신규 Context 파일 1개, 새 외부 의존성 없음(React 내장 Context API)                                        | 큼 — 신규 zustand 스토어 1개, `CLAUDE.md`가 정의한 zustand 용도("전역 UI 상태")를 벗어나는 새 사용 사례 추가                      |
| 4   | 테스트 용이성        | 낮음 — 여전히 `PlaylistDetailModal`을 통째로 렌더링해야 검증 가능     | **높음** — `XxxValueProvider`로 `Header`/`SongList`/`Toolbar`를 각각 단독 렌더링·테스트 가능(선례와 동일)        | 중간 — 스토어를 `setState`로 세팅해 테스트 가능하지만, 모달마다 전용 스토어가 생기는 새 테스트 패턴이 필요                        |
| 5   | 변경 범위            | 작음 — `PlaylistDetailModal.tsx` 1개                                  | 작음 — `PlaylistDetailModal.tsx` + `Header`/`SongList`/`Toolbar` + 신규 Context 파일 1개                         | 중간 — 안 2와 동일 범위 + 신규 스토어 파일 및 관련 정리(모달 unmount 시 스토어 리셋 등 추가 고려사항)                             |
| 6   | 점진적 전환 가능성   | 쉬움                                                                  | 쉬움 — Context 신설과 3개 컴포넌트 전환을 한 커밋에서 원자적으로(각 컴포넌트가 서로 독립적이라 개별 커밋도 가능) | 보통 — 스토어 설계(초기값, 리셋 시점)를 먼저 확정해야 컴포넌트 전환이 가능                                                        |
| 7   | 롤백 가능성          | 쉬움                                                                  | 쉬움 — 파일 4~5개, `git revert`로 즉시 복귀                                                                      | 보통 — 스토어 도입 자체를 되돌리려면 전환된 컴포넌트도 함께 되돌려야 함                                                           |
| 8   | 성능·운영 영향       | 무해                                                                  | 무해 — Context 값이 바뀔 때 리렌더되는 범위는 기존 prop 기반과 동일(같은 부모 트리)                              | 무해하지만 전역 스토어에 모달 전용 상태가 하나 더 늘어나는 운영 부담                                                              |
| 9   | 기존 코드와의 일관성 | 낮음 — 이 저장소에 없던 "그룹 prop 통째 전달"이라는 새 절충 패턴 도입 | **매우 높음** — `PostDetailModalContext`/`ContentWriteContext`와 완전히 동일한 3단 구조, 3번째 동일 적용         | 중간 — zustand는 이미 있지만 "모달 트리 스코프 상태"로 쓴 전례가 없어 `usePlayerStore`/`useModalStore`와 성격이 다른 새 사용 패턴 |
| 10  | 유지 비용            | 중간 — 절충 패턴 자체가 다음에 또 손댈 이유가 됨                      | 낮음 — 선례가 이미 2번 검증돼 유지보수 방법이 알려져 있음                                                        | 낮음~중간 — 스토어 리셋·초기화 규칙을 잊으면 새로운 버그 클래스가 생길 수 있음                                                    |

## 라이브러리 도입 심사

해당 없음 — 새 라이브러리 도입이 아니다(안 2는 React 내장 Context API). 안 3(zustand 슬라이스)도 이미 도입된 zustand를 새 용도로 확장하는 것뿐이라 "도입 심사"보다는 비교표 기준 9(일관성)에서 다뤘다.

## 의사결정 인터뷰 로그

**Q. playlist-detail-prop-drilling ADR: Header/SongList/Toolbar prop drilling 정리, 3안 중 어느 안을 선택할까요?**
A. 안 2 — 경계 재설계안(추천). 이유: 이번 세션에서 이미 두 번 검증된 패턴을 세 번째로 그대로 적용 — 동작 보존 난이도가 가장 낮고 기존 코드 일관성이 매우 높다. 안 3(zustand 슬라이스)이 제시하는 이득(전역 스토어 재사용)은 이 상태가 애초에 모달 트리 스코프라는 성격과 맞지 않는다는 비교표 근거를 그대로 채택.

## 선택: 안 2

비교표 기준 1(근본 원인 해결력)·4(테스트 용이성)·9(기존 코드 일관성)에서 안 2가 안 1보다 뚜렷이 우세하고, 기준 3(책임 변화)·9(일관성)에서 안 3보다 우세하다. 안 3은 "React Context로 충분한 모달 트리 스코프 상태를 굳이 전역 스토어로 승격"하는 선택이라 `CLAUDE.md`가 정의한 zustand 용도(전역 UI 상태)와 어긋난다 — 안 2가 이미 2번 검증된 상태에서 새 패턴을 도입할 이유가 없다.

## ADR 본문

### Context

`PlaylistDetailModal.tsx`(71줄, `#276` 이후 기준)는 `usePlaylistDetailModal` 훅의 반환값을 JSX에서 `Header`(12개 prop)/`SongList`(5개)/`Toolbar`(2개)로 그대로 재전달한다. `PostDetailModalContext`/`ContentWriteContext`는 동일한 문제를 3단 Context 구조로 이미 두 번 해결했다(PRD Fact).

### Decision

`components/modals/PlaylistDetailModal/PlaylistDetailModalContext.tsx`를 신설한다:

- `PlaylistDetailModalContext = createContext<UsePlaylistDetailModalResult | null>(null)`
- `PlaylistDetailModalValueProvider({ value, children })` — 값을 직접 주입하는 순수 Provider(단독 테스트용, 선례와 동일)
- `PlaylistDetailModalProvider({ playlistId, children })` — `usePlaylistDetailModal(playlistId)`를 호출하는 유일한 지점. `playlist`가 아직 로딩 중이면(목표 인터뷰에서 `playlistId` prop 유지를 확정했으므로) 기존과 동일하게 `playlist && (...)` 가드를 Provider 레벨에서 유지한다.
- `usePlaylistDetailModalContext()` — `useContext` + null 체크.

`Header`/`SongList`/`Toolbar`를 zero-prop으로 바꾸고 각자 `usePlaylistDetailModalContext()`를 호출해 필요한 필드만 구조분해한다. `PlaylistDetailModal.tsx`는 `PlaylistDetailModalProvider`로 감싸고 `<Header />`/`<SongList />`/`<Toolbar />`를 인자 없이 호출하는 조립부만 남는다. `Toolbar`는 `selection.selectedIds.size > 0`일 때만 렌더링되는 조건은 유지하되, 그 조건 자체는 `PlaylistDetailModal.tsx`에 남기거나 `Toolbar` 내부로 옮길지는 구현 중 확정한다(둘 다 Behavior Invariant 위반 아님 — DOM 결과만 같으면 됨).

### Alternatives

안 1(그룹 prop 통째 전달)은 근본 원인(중계자 존재)을 해결하지 못해 기각. 안 3(zustand 슬라이스)은 모달 트리 스코프 상태를 전역 스토어로 승격하는 성격 불일치가 있어 기각 — `CLAUDE.md`가 이미 zustand를 "전역 UI 상태(재생/모달/알림 오버레이)"로 명시했고, 이 상태는 그 범주에 들지 않는다.

### Consequences

- `Header`/`SongList`/`Toolbar`가 zero-prop이 되어 시그니처가 단순해지고, `PlaylistDetailModal.tsx`가 순수 조립부만 남는다.
- 신규 파일 1개(`PlaylistDetailModalContext.tsx`)가 `PostDetailModalContext.tsx`/`ContentWriteContext.tsx`와 같은 폴더 관례(모달 폴더 최상위)로 추가된다.
- `Header`/`SongList`/`Toolbar`를 `PlaylistDetailModalValueProvider`로 감싸 단독 테스트할 수 있는 새 이음새가 생긴다(당장 이 사이클에서 새 단독 테스트를 추가하지는 않음, PRD Success Criteria가 기존 21개 유지만 요구).

### Migration

Context 신설과 3개 컴포넌트(`Header`/`SongList`/`Toolbar`) 전환은 서로 독립적이라 개별 커밋도 가능하지만, 전부 작아 한 이슈·한 커밋에서 원자적으로 처리한다(이전 두 사이클과 동일한 판단 — 인위적으로 쪼갤 근거가 약함).

### Rollback

`apps/api`/`packages/dto` 변경이 없다. 핵심 변경이 파일 4~5개에 집중되므로 `git revert`로 즉시 이전 상태로 복귀 가능하다.

## 회귀 안전망

우선순위: Characterization → Contract → State-transition → Integration → E2E. 기존 21개 통합 테스트가 렌더링 결과(DOM)를 검증하므로, prop→Context 전환이 값 자체를 바꾸지 않는 한 수정 없이 통과해야 한다.

1. **Characterization** — 신규 추가 없음. 기존 21개가 이미 4개 액션 전부의 성공/실패/유효성검사를 커버.
2. **Contract** — 신규 추가 없음.
3. **State-transition** — 신규 추가 없음.
4. **Integration** — 신규 추가 없음. `PlaylistDetailCacheSharing.integration.test.tsx`는 이번 변경과 무관.
5. **E2E** — Out of Scope(브라우저 자동화 도구 없음).

### 회귀 시나리오

| 시나리오                                                                               | 기존 결과                                          | 검증 수준                                                                                      | 실패 시 조치 |
| -------------------------------------------------------------------------------------- | -------------------------------------------------- | ---------------------------------------------------------------------------------------------- | ------------ |
| 최초 마운트 시 곡 목록·헤더 정상 렌더링                                                | prop 기반과 동일한 DOM                             | Characterization(기존)                                                                         | 구현 중단    |
| 4개 액션 각각의 성공/실패/유효성검사                                                   | 각 Behavior Invariant대로 동작                     | Characterization(기존)                                                                         | 구현 중단    |
| `Toolbar`가 선택된 곡이 있을 때만 노출                                                 | 조건부 렌더링 결과 동일                            | Characterization(기존)                                                                         | 구현 중단    |
| `SongItem`의 `usePlayerStore` 직접 구독(재생) 동작 불변                                | 기존 동작 그대로                                   | Characterization(기존)                                                                         | 구현 중단    |
| `Header`/`SongList`/`Toolbar`가 `usePlaylistDetailModalContext` 밖에서 렌더링되면 에러 | (신규) `useXxxContext must be used within...` 에러 | Contract(선례와 동일 패턴, 신규 추가 안 함 — 다른 두 Context도 이 계약을 별도 테스트하지 않음) | 설계 재검토  |

## 체크포인트 이슈 목록

각 이슈는 반나절 이내 크기. 이전 사이클과 동일하게 하나의 브랜치에서 순서대로 구현하고 PR 1개로 병합한다. Context 신설과 3개 컴포넌트 전환이 서로 얽혀 있지 않아 이전 두 사이클보다도 위험이 낮다.

1. **Context 신설 + Header/SongList/Toolbar zero-prop 전환** — `PlaylistDetailModalContext.tsx` 신설, `Header`/`SongList`/`Toolbar`를 zero-prop으로 전환, `PlaylistDetailModal.tsx`를 Provider로 감싸고 조립부만 남김. 기존 21개 테스트 회귀 없이 통과 확인. 이 사이클의 핵심 변경.
2. **정리 + 문서 갱신** — dead code(미사용 import 등) 확인, 이 사이클의 `result.md` 작성.

### 생성된 이슈

| 체크포인트                       | 이슈 |
| -------------------------------- | ---- |
| 1. Context 신설 + zero-prop 전환 | #285 |
| 2. 정리 + 문서 갱신              | #286 |

---

**[GATE 2]** 위 대안 선택, 인터뷰 로그, ADR 본문, 회귀 안전망, 이슈 분해를 확인해주시면 실제 GitHub 이슈를 생성하겠습니다.
