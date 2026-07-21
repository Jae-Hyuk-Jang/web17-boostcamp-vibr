# ADR — search-widget-duplication

## 3안 비교

### 안 1 — 최소 개선안 (leaf 조각만 공유)

입력창/탭 버튼/상태 메시지 같은 작은 조각만 공용 컴포넌트로 뽑고, `MusicSearch.tsx`/`SearchDropdown.tsx` 두 파일은 그대로 남겨 각자 조각을 조합한다.

### 안 2 — 경계 재설계안 (단일 공용 위젯, 채택)

`MusicSearch.tsx`(228줄)와 `SearchDropdown.tsx`+`SearchInput.tsx`+`MusicSearchResults.tsx`(142줄)가 각자 구현하던 "입력창 → 탭 전환 → 상태 분기 → 결과 리스트" 전체를 `components/search/picker/MusicPickerSearch.tsx` 하나로 통합한다. 두 소비처의 차이는 컴포넌트 밖(콜백 계약, 바깥 클릭 처리, 빈 쿼리일 때의 부가 콘텐츠)에서 흡수한다.

### 안 3 — 자체 구현안 (headless 훅으로 로직만 공유)

디바운스·탭 전환·검색 상태 관리를 `useMusicPickerSearch` 훅 하나로 묶고, UI 마크업은 두 파일이 계속 각자 유지한다.

## 비교표 (10개 고정 기준)

| #   | 기준                 | 안 1                                          | 안 2                                                                                                     | 안 3                                                              |
| --- | -------------------- | --------------------------------------------- | -------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| 1   | 근본 원인 해결력     | 낮음 — 조합 로직이 여전히 두 곳에 남음        | 높음 — UI 전체가 한 곳에만 존재                                                                          | 중간 — UI 중복(원래 불만의 핵심)은 그대로 남음                    |
| 2   | 동작 보존 난이도     | 쉬움 — 변경 범위가 작아 리스크 낮음           | 중간 — 콜백 계약 통합 시 주의 필요, characterization test로 커버 가능                                    | 어려움 — 훅과 UI 경계를 새로 그어야 해서 두 갈래 동기화 비용 발생 |
| 3   | 책임·의존성 변화     | 최소                                          | 명확 — 위젯 책임이 "검색해서 선택하게 하기" 하나로 정리됨                                                | 애매 — 훅/UI 책임 분리 효과가 크지 않음                           |
| 4   | 테스트 용이성        | 보통                                          | 높음 — 위젯 하나만 집중 테스트하면 됨                                                                    | 낮음 — UI는 여전히 두 곳에서 각자 테스트해야 함                   |
| 5   | 변경 범위            | 작음(2파일 내부)                              | 중간(신규 컴포넌트 + 소비처 2곳 전환)                                                                    | 중간~큼(신규 훅 + 기존 UI 2벌 유지)                               |
| 6   | 점진적 전환 가능성   | 매우 쉬움                                     | 가능 — 소비처를 하나씩 전환 가능                                                                         | 가능하나 얻는 이득이 적음                                         |
| 7   | 롤백 가능성          | 쉬움                                          | 쉬움 — git revert로 소비처별 되돌리기 가능                                                               | 쉬움                                                              |
| 8   | 성능·운영 영향       | 미미                                          | 미미 — 클라이언트 조립 방식 차이일 뿐, 네트워크 호출 동일                                                | 미미                                                              |
| 9   | 기존 코드와의 일관성 | 낮음 — leaf 공유만으로는 패턴이 뚜렷하지 않음 | 높음 — `ModalPanel`/`Button`에서 채택한 "공용 프레젠테이션 컴포넌트 + props로 variance 흡수" 패턴과 일치 | 낮음 — headless hook은 이 저장소에 없던 새로운 스타일             |
| 10  | 유지 비용            | 중간(조합 로직 2곳)                           | 낮음(단일 지점)                                                                                          | 중간(훅 1개 + UI 2벌)                                             |

## 라이브러리 도입 심사

해당 없음 — PRD 목표 인터뷰 Q4에서 "새 라이브러리 도입 없이 진행"으로 이미 확정됨(도입안 자체가 없음).

## 의사결정 인터뷰 로그

**Q. MusicSearch↔SearchDropdown 통합 방법으로 3안을 비교했습니다 — 안 1(leaf 조각만 공유, 두 파일 유지), 안 2(단일 공용 위젯으로 완전 통합, 차이는 props/콜백으로 흡수), 안 3(UI는 각자 유지하고 로직만 공용 훅으로 묶음). 어느 안을 선택할까요?**
A. 안 2 — 단일 공용 위젯. 이유: 근본 원인 해결력이 가장 높음(입력창·탭·상태분기·결과렌더링이 한 곳에만 존재하게 됨). 콜백 계약 차이(`id: undefined` 변환)는 위젯이 `Music` 객체를 그대로 `onSelect`로 넘기고, `PlaylistDetailModal` 쪽 소비 콜백이 자기 책임으로 변환하면 되므로 이미 자연스러운 해결책이 있음. 변경 범위 불이익도 소비처가 2곳뿐이라 크지 않음. `ModalPanel`/`Button`에서 이미 채택한 패턴과도 일관됨.

## 선택: 안 2

비교표 기준 1(근본 원인 해결력)·4(테스트 용이성)·9(일관성)에서 안 2가 명확히 앞서고, 기준 2(동작 보존 난이도)의 불리함은 characterization test를 먼저 추가하는 순서로 상쇄 가능하다. 안 1은 근본 원인을 절반만 해결하고, 안 3은 이번 문제(UI 중복)를 직접 해결하지 못해 채택하지 않는다.

## ADR 본문

### Context

`MusicSearch.tsx`(`ContentWriteModal`)와 `SearchDropdown.tsx`(`PlaylistDetailModal`)는 같은 상수(`SEARCH_TAB_ENTRIES`)와 같은 훅(`useItunesSearch`/`useYoutubeSearch`)을 쓰면서도 입력창·탭·상태분기·결과렌더링 UI를 각자 독립적으로 구현했다. `components/search/index.ts`는 자기참조 순환참조 3건을 만들고 있고, 검색 위젯 관련 characterization test는 0건이다.

### Decision

`components/search/picker/MusicPickerSearch.tsx`를 새로 만들어 두 위젯의 공통 부분(입력창, 탭 전환, 로딩/에러/빈결과 상태 메시지, 결과 리스트)을 흡수한다.

**Props 계약**:

```ts
interface MusicPickerSearchProps {
  query: string;
  onQueryChange: (next: string) => void;
  onSelect: (music: Music) => void;
  placeholder?: string;
  minQueryLength?: number;
  className?: string;
}
```

- 위젯은 `query`가 비어 있으면 아무것도 렌더링하지 않는다(현재 `SearchDropdown`의 방식을 기본으로 채택).
- 위젯은 `mode`(music/video) 상태와 `useItunesSearch`/`useYoutubeSearch` 호출을 내부에 캡슐화한다. `user` 탭은 만들지 않는다(Behavior Invariant).
- 결과 클릭 시 `onSelect(music)`을 그대로 호출한다 — `id: undefined` 변환 같은 소비처별 계약 차이는 위젯이 알지 못하고, 각 소비처의 `onSelect` 콜백에서 처리한다.
- 위젯은 "열려 있는가"를 스스로 판단하지 않는다 — 바깥 클릭 감지, 포커스 시 열림, 빈 쿼리일 때 부가 콘텐츠(플레이리스트 추천 섹션) 같은 컨테이너 책임은 소비처가 위젯을 감싸는 wrapper에서 그대로 유지한다(PRD Out of Scope: 오버레이 열림 상태 통합 안 함, 이 결정과 일치).

**소비처별 변경**:

- `PlaylistDetailModal/components/search/`(`SearchDropdown.tsx`, `SearchInput.tsx`, `MusicSearchResults.tsx`)는 `MusicPickerSearch` 하나로 대체되고 폴더째 삭제된다. 기존 바깥 테두리(`border-b-2 border-primary bg-accent/10 p-4`) 컨테이너와 `onSelect={(music) => handleAddSong({ ...music, id: undefined })}` 변환은 호출부에 남는다.
- `ContentWriteModal/partials/MusicSearch.tsx`는 얇은 wrapper로 축소된다 — 바깥 클릭 감지(`containerRef`+`useEffect`), `isSearchOpen` 제어, 빈 쿼리일 때 플레이리스트 추천 섹션(`renderPlaylistSection`) 렌더링은 그대로 남기고, 탭+결과 렌더링 부분만 `MusicPickerSearch`로 교체한다.
- `components/search/index.ts`의 자기참조 순환참조는 `SearchDrawerContent.tsx`의 `from './index'` import를 개별 경로(`./SearchInput`, `./SearchStateMessage` 등)로 바꿔 제거한다. 이 변경은 `MusicPickerSearch` 도입과 독립적으로도 가능하지만, 같은 폴더를 정리하는 김에 같은 사이클에서 처리한다.

### Alternatives

- 안 1(leaf 조각만 공유): 근본 원인(조합 로직 중복)을 절반만 해결해 기각.
- 안 3(headless 훅): 로직 공유는 이미 `useItunesSearch`/`useYoutubeSearch`로 상당 부분 달성돼 있어 한계 효용이 낮고, 원래 문제 제기(UI 중복)를 직접 해결하지 못해 기각.

### Consequences

- 장점: 검색 UI 관련 코드가 약 1,169줄 중 `MusicSearch`(228줄)+`PlaylistDetailModal/components/search/`(142줄)=370줄이 `MusicPickerSearch` 1개 파일로 압축된다. 검색 동작(디바운스 시간, 최소 글자 수 등)을 바꿀 때 한 곳만 손대면 된다.
- 단점: `MusicPickerSearch`가 두 소비처의 요구를 모두 만족해야 하므로, 세 번째 소비처가 생겼을 때 요구사항이 또 다르면 props가 늘어날 위험이 있다(안 2 자체의 구조적 한계 — 발생 시 다시 ADR로 판단).
- 새 위험: 콜백 계약(위젯은 항상 `Music` 그대로 넘긴다는 규칙)을 소비처가 어기면(예: 위젯 안에서 변환 로직을 넣고 싶어지면) 위젯이 다시 특정 소비처에 종속될 수 있다 — 구현 중 이런 유혹이 생기면 중단하고 재검토한다.

### Migration

1. 특성화 테스트로 기존 동작을 고정한다(구조 변경 없음).
2. `MusicPickerSearch`를 새로 작성하고 계약/상태전이 테스트를 추가한다(아직 어떤 소비처도 연결하지 않음).
3. `PlaylistDetailModal`을 전환하고 기존 `SearchDropdown` 계열 파일을 삭제한다.
4. `ContentWriteModal/partials/MusicSearch.tsx`를 축소 전환한다.
5. `components/search/index.ts` 순환참조를 제거하고 문서를 갱신한다.

각 단계 사이에 `pnpm test`/`pnpm lint`가 통과하는 상태를 유지한다 — 중간에 멈춰도 저장소는 정상 상태다.

### Rollback

각 체크포인트 이슈는 독립 커밋이라 `git revert`로 개별 되돌리기가 가능하다. 3단계(`PlaylistDetailModal` 전환)에서 문제가 발견되면 4단계를 시작하지 않고 3단계만 되돌리면 `ContentWriteModal`은 영향받지 않는다(두 소비처가 서로 독립적으로 전환되므로).

## 회귀 안전망

### 테스트 우선순위

1. **Characterization** — 리팩터링 착수 "전" 상태의 `MusicSearch.tsx`/`SearchDropdown.tsx`에 대해, 탭 전환에 user 탭이 없음/디바운스 후 결과 렌더링/결과 클릭 시 콜백 인자(특히 `id: undefined` 차이) 를 고정하는 테스트를 추가한다.
2. **Contract** — 새 `MusicPickerSearch`가 `query`가 비면 아무것도 렌더링하지 않는지, `onSelect`에 `Music` 객체를 그대로(변환 없이) 넘기는지 검증한다.
3. **State-transition** — `mode`(music↔video) 전환, `idle → loading → success/empty/error` 상태 전이를 검증한다.
4. **Integration** — `ContentWriteModal.test.tsx`/`PlaylistDetailModal.test.tsx`는 계속 `MusicPickerSearch`를 mock 처리해도 무방하다(이미 확립된 관례). 대신 `MusicSearch.tsx`(wrapper)에 대해 바깥 클릭 시 닫힘/빈 쿼리일 때 추천 섹션 노출을 다루는 통합 테스트를 별도로 추가한다.
5. **E2E** — 검색 흐름의 Playwright E2E 추가는 PRD Out of Scope. Follow-up으로 남긴다.

### 회귀 시나리오

| 시나리오                | 기존 결과                                                                                                                  | 검증 수준        | 실패 시 조치 |
| ----------------------- | -------------------------------------------------------------------------------------------------------------------------- | ---------------- | ------------ |
| 정상 검색 후 결과 클릭  | `MusicSearch`: `onAddMusic(music)`을 원본 그대로 호출 / `SearchDropdown`: `handleAddSong({ ...song, id: undefined })` 호출 | Contract         | 구현 중단    |
| user 탭 선택 시도       | 탭 자체가 렌더링되지 않아 선택 불가                                                                                        | Characterization | 구현 중단    |
| 최소 글자 수 미만 입력  | 힌트 메시지 노출(문구는 두 소비처가 다를 수 있음 — 통합 시 문구 유지 여부 확인 필요)                                       | State-transition | 설계 재검토  |
| 검색 API 에러           | `errorMessage ?? '검색 중 오류가 발생했습니다.'` 노출                                                                      | 단위             | 구현 중단    |
| 빈 쿼리 상태            | `MusicSearch`: 플레이리스트 추천 섹션 노출 / `SearchDropdown`: 드롭다운 자체가 안 보임                                     | Integration      | 구현 중단    |
| `MusicSearch` 바깥 클릭 | 드롭다운 자동 닫힘(`isSearchOpen=false`)                                                                                   | Integration      | 구현 중단    |

## 체크포인트 이슈 목록

### 이슈 1 — `MusicSearch`/`SearchDropdown` 특성화 테스트 추가

# 목적

리팩터링 착수 전 현재 동작을 테스트로 고정해, 이후 단계에서 동작이 바뀌는지 즉시 알 수 있게 한다.

## Scope

- `ContentWriteModal/partials/MusicSearch.test.tsx`(신규), `PlaylistDetailModal/components/search/SearchDropdown.test.tsx`(신규)

## Out of Scope

- 구조 변경 없음

## Behavior Invariants

- prd.md의 Behavior Invariants 전체

## Acceptance Criteria

- [ ] Given 검색어 입력, When 결과가 오면, Then `MusicSearch`는 `onAddMusic(music)`을 원본 그대로 호출한다.
- [ ] Given 검색어 입력, When 결과가 오면, Then `SearchDropdown`은 `handleAddSong({ ...song, id: undefined })`을 호출한다.
- [ ] Given 검색어 입력, When 결과 탭을 확인하면, Then user 탭은 존재하지 않는다.

## Verification

- [ ] `pnpm test -- MusicSearch SearchDropdown`

## Rollback

- 테스트 파일만 추가되므로 삭제만으로 되돌릴 수 있다.

## Dependency

- 없음(선행 이슈)

---

### 이슈 2 — `MusicPickerSearch` 신규 작성

# 목적

두 소비처가 공유할 검색 위젯을 아직 어떤 기존 코드도 건드리지 않은 채 독립적으로 만들어, 이후 전환 단계의 위험을 분리한다.

## Scope

- `components/search/picker/MusicPickerSearch.tsx`(신규), `components/search/picker/MusicPickerSearch.test.tsx`(신규)

## Out of Scope

- 기존 `MusicSearch.tsx`/`SearchDropdown.tsx` 수정 없음(아직 연결하지 않음)

## Behavior Invariants

- `query`가 비어 있으면 아무것도 렌더링하지 않는다.
- `onSelect`에 `Music` 객체를 변환 없이 그대로 전달한다.
- user 탭을 렌더링하지 않는다.

## Acceptance Criteria

- [ ] Given 빈 `query`, When 렌더링하면, Then 아무 것도 표시되지 않는다.
- [ ] Given `mode` 전환, When music↔video를 누르면, Then 해당 훅의 결과만 노출된다.
- [ ] Given 결과 클릭, When `onSelect` 호출되면, Then 인자가 원본 `Music` 객체와 동일하다(변환 없음).

## Verification

- [ ] `pnpm test -- MusicPickerSearch`
- [ ] `pnpm lint`, `pnpm check-types`

## Rollback

- 신규 파일만 추가되므로 삭제만으로 되돌릴 수 있다.

## Dependency

- 선행: 이슈 1

---

### 이슈 3 — `PlaylistDetailModal`을 `MusicPickerSearch`로 전환

# 목적

가장 단순한 소비처(SearchDropdown, 바깥 클릭·추천 섹션 없음)부터 전환해 통합 위험을 검증한다.

## Scope

- `PlaylistDetailModal`의 검색 진입점을 `MusicPickerSearch` 소비로 교체
- `components/modals/PlaylistDetailModal/components/search/`(`SearchDropdown.tsx`, `SearchInput.tsx`, `MusicSearchResults.tsx`, `index.ts`) 삭제

## Out of Scope

- `ContentWriteModal` 수정 없음

## Behavior Invariants

- `handleAddSong({ ...music, id: undefined })` 변환은 호출부(`PlaylistDetailModal`)에 유지된다.
- 기존 테두리/배경 스타일(`border-b-2 border-primary bg-accent/10 p-4`)은 wrapper에 유지된다.

## Acceptance Criteria

- [ ] Given 곡 검색 후 클릭, When 플레이리스트에 추가되면, Then 새 `id`로 추가된다(기존과 동일).
- [ ] `PlaylistDetailModal.test.tsx`가 기존과 동일하게 통과한다(현재처럼 `MusicPickerSearch` mock 유지 가능).

## Verification

- [ ] `pnpm test -- PlaylistDetailModal`
- [ ] `pnpm dev`로 플레이리스트 상세 모달을 열어 곡 검색·추가 직접 확인

## Rollback

- 이 커밋만 revert하면 `SearchDropdown` 계열 파일이 복구된다(4단계를 시작하지 않았다면 `ContentWriteModal`은 영향 없음).

## Dependency

- 선행: 이슈 2

---

### 이슈 4 — `ContentWriteModal/partials/MusicSearch.tsx` 축소 전환

# 목적

바깥 클릭 감지·추천 섹션이라는 고유 로직을 유지한 채, 탭+결과 렌더링만 공용 위젯으로 교체한다.

## Scope

- `ContentWriteModal/partials/MusicSearch.tsx` 내부를 `MusicPickerSearch` 소비로 축소

## Out of Scope

- `isSearchOpen`/바깥 클릭 감지 로직, 플레이리스트 추천 섹션(`renderPlaylistSection`) 자체는 그대로 유지

## Behavior Invariants

- 바깥 클릭 시 자동으로 닫힌다.
- 빈 쿼리일 때 플레이리스트 추천 섹션이 노출된다.
- `onAddMusic(music)`은 원본 `Music` 객체를 그대로 받는다.

## Acceptance Criteria

- [ ] Given 드롭다운이 열린 상태, When 바깥을 클릭하면, Then 닫힌다.
- [ ] Given 빈 쿼리, When 포커스하면, Then 플레이리스트 추천 섹션이 보인다.
- [ ] `ContentWriteModal.test.tsx`가 기존과 동일하게 통과한다.

## Verification

- [ ] `pnpm test -- ContentWriteModal`
- [ ] `pnpm dev`로 글쓰기 모달을 열어 곡 검색·추천 섹션·바깥 클릭 닫힘 직접 확인

## Rollback

- 이 커밋만 revert.

## Dependency

- 선행: 이슈 2 (이슈 3과는 독립적으로 되돌릴 수 있음)

---

### 이슈 5 — `components/search/index.ts` 순환참조 제거 + 문서 갱신

# 목적

`SearchDrawerContent.tsx`의 자기참조 배럴 import를 제거해 madge 순환참조 3건을 없애고, 분석 문서를 실제 코드 상태로 갱신한다.

## Scope

- `components/search/SearchDrawerContent.tsx`의 `from './index'`를 개별 경로 import로 변경
- `docs/component-design/search.md`, `docs/refactors/search-widget-duplication/result.md` 작성

## Out of Scope

- `components/search/index.ts` 배럴 자체의 삭제 여부(backlog #97 범위, 이번엔 유지)

## Behavior Invariants

- `SearchDrawerContent`의 렌더링 결과는 변경되지 않는다(import 경로만 변경).

## Acceptance Criteria

- [ ] `npx madge --circular --extensions ts,tsx src`에 `components/search` 관련 항목이 0건.
- [ ] `pnpm test`, `pnpm lint`, `pnpm check-types`, `pnpm build` 전부 통과.

## Verification

- [ ] 위 madge 명령 + 전체 baseline 명령

## Rollback

- import 경로 변경만 되돌리면 된다.

## Dependency

- 선행: 이슈 3, 이슈 4 (모든 소비처 전환 이후 마무리 단계로 진행)

---

**[GATE 2]** 위 대안 비교, 인터뷰 로그, ADR, 회귀 안전망, 이슈 분해를 확인해주시면 이슈를 생성하고 구현으로 넘어가겠습니다.
