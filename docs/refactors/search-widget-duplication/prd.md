# PRD — search-widget-duplication

## 문제 정의

`brief-original.md` 요약: `docs/component-design/search.md` 분석에서 확인된 문제로, 음악 검색 UI(입력창+탭+상태분기+결과 렌더링)가 `SearchDrawerContent`(nav 드로어), `MusicSearch`(글쓰기 모달), `SearchDropdown`(플레이리스트 상세 모달) 3곳에 독립적으로 존재하고, 오버레이 열림 상태 관리 방식도 `useModalStore`(zustand)/`Sidebar` 로컬 state/`MobileBottomNav` 로컬 state로 3갈래로 나뉘어 있다.

왜 지금 다뤄야 하는가: `shared-component-duplication` 사이클(#101~#108, `Button` 도입) 이후 "재사용성이 기대보다 낮다"는 문제 제기가 있었고, 그 원인을 더 넓게 조사하는 과정에서 검색 영역에 실제 코드 중복(공유 상수·훅은 있는데 UI만 안 공유)과 `components/search/index.ts`의 순환참조(madge로 확인된 Fact)가 함께 발견됐다.

## 비판적 진단 (시니어 개발자 시각)

### 근거

- **Fact** — `components/search/index.ts`는 madge 기준 3건의 자기참조 순환참조를 발생시킨다: `index.ts > MusicSearchResults.tsx`, `index.ts > SearchDrawerContent.tsx`, `index.ts > UserSearchResults.tsx`. 이는 PR #84(`ContentWriteModal`)에서 겪은 것과 동일한 패턴이며 backlog #96(저장소 전역 순환참조)에 포함되는 사례다.
- **Fact** — `components/search/`의 6개 컴포넌트 중 `SearchInput`/`MusicSearchResults`/`TrackItem`/`UserItem`/`UserSearchResults`/`SearchStateMessage` 5개는 `SearchDrawerContent.tsx` 1곳에서만 소비된다(grep 확인). 배럴(`index.ts`)을 외부에서 `@/components/search`로 import하는 곳은 저장소 전체에 0곳이다.
- **Fact** — `conventions.md` 30번째 줄은 `search`를 "배럴로 재export하고 배럴을 통해 import"하는 도메인 폴더로 명시하지만, 실제로는 배럴이 내부 자기참조만 만들고 외부 소비처는 없다 — 문서와 실제 코드가 불일치.
- **Fact** — `MusicSearch.tsx`(228줄, `ContentWriteModal/partials/`)와 `SearchDropdown.tsx`+`SearchInput.tsx`+`MusicSearchResults.tsx`(142줄, `PlaylistDetailModal/components/search/`)는 입력창 마크업, 탭 버튼 JSX, 로딩/에러/빈 결과 메시지 분기, 결과 아이템 렌더링을 각각 독립적으로 작성했다. 두 파일이 실제로 공유하는 건 `SEARCH_TAB_ENTRIES` 상수(`SearchDrawerContent.tsx`에서 import)와 `useItunesSearch`/`useYoutubeSearch` 훅뿐이다.
- **Fact** — `TrackItem.tsx`(nav 드로어의 음악 결과 아이템)는 클릭 시 재생(`addMusicToPlayer`), 보관함 추가(`addMusicToArchive`), 추천 글 작성(`openWriteModalWithMusic`) 3가지 행동을 제공하고 `useModalStore`를 직접 다룬다. 반면 `MusicSearch`/`SearchDropdown`의 결과 아이템은 클릭 시 `onAddMusic`/`handleAddSong` 콜백 하나만 호출한다 — 목적 자체가 다르다.
- **Fact** — `SearchDropdown`은 결과 클릭 시 `{ ...song, id: undefined }`로 변환해 전달하지만, `MusicSearch`는 `Music` 객체를 그대로 전달한다. 두 위젯의 콜백 계약(contract) 형태가 이미 다르다.
- **Fact** — 기존 테스트(`ContentWriteModal.test.tsx`, `PlaylistDetailModal.test.tsx`)는 `MusicSearch`/`SearchDropdown`을 통째로 `jest.mock`으로 대체한다 — 두 위젯의 실제 동작(입력/탭 전환/디바운스/에러 상태/결과 클릭)에 대한 테스트는 저장소 전체에 0건이다.
- **Fact** — 오버레이 열림 상태 관리는 3갈래다: 8개 모달(`MODAL_TYPES`)은 `useModalStore`(zustand, 전역), 데스크탑 검색 드로어는 `Sidebar.tsx`의 로컬 `activeDrawer` state, 모바일 검색 바텀시트는 `MobileBottomNav.tsx`의 별도 로컬 `isSearchOpen` state. 검색은 `MODAL_TYPES`에 등록돼 있지 않다.
- **Inference** — `MusicSearch`/`SearchDropdown`은 이미 열려 있는 모달 내부에 렌더링되는 인라인 드롭다운이라, `useModalStore`가 다루는 "화면 중앙 오버레이를 여닫는" 개념과는 계층이 다르다. 이 지역적 상태를 억지로 전역화하면 모달 내부 상태를 외부에 노출하는 역설계가 될 수 있다.
- **Fact** — baseline 검증(`pnpm lint`/`check-types`/`test`/`build`) 전부 통과, cache hit(아래 기준선 검증 표 참고).

### 증상 → 원인 체인

증상: 글쓰기 모달과 플레이리스트 상세 모달의 곡 검색 UI가 코드로도, 미세한 스타일(패딩·placeholder·hint 문구)로도 서로 다르다.
→ (왜?) 각 모달이 검색 UI를 처음부터 새로 작성했다.
→ (왜?) 재사용 가능한 "선택형(목록에 추가하기 위한) 음악 검색 위젯"이 컴포넌트로 존재하지 않았다. 기존 `components/search/`는 있었지만, 그 안의 `TrackItem`은 목적이 다른(행동형: 재생/보관함/글쓰기) 컴포넌트라 그대로 가져다 쓸 수 없었다.
→ 구조 원인: 검색이라는 도메인 기능이 "행동형(browse & act)"과 "선택형(pick to add)"이라는 서로 다른 상호작용 패턴 두 가지를 갖고 있는데, 이 구분이 폴더 구조나 컴포넌트 이름 어디에도 명시되지 않아 매번 처음부터 다시 판단하고 새로 구현했다.

### 아키텍처 관점

- **국지적인가 반복 패턴인가**: `components/search/index.ts`의 자기참조 순환참조는 새로운 문제가 아니라, 이미 backlog #96(저장소 전역 순환참조)으로 파악된 패턴이 search 도메인에도 나타난 것이다.
- **기존 컨벤션과 충돌하는가**: `conventions.md`의 "배럴을 통해 import" 규칙이 search 도메인에서는 실질적으로 지켜지지 않고 있다(배럴 외부 소비처 0). 문서와 코드 중 어느 쪽이 맞는지는 backlog #97(conventions.md 배럴 문서 갱신)의 범위이므로 이번 사이클에서는 다루지 않되, 새로 만드는 컴포넌트는 배럴을 통하지 않는 개별 경로 import 관례(`modal-composition-structure`/`shared-component-duplication` 사이클에서 이미 채택)를 따른다.
- **전제가 깨진 결정인가**: `components/search/`를 처음 만들 때는 "여러 곳에서 쓰일 공용 검색 컴포넌트"를 의도했을 가능성이 있다(Hypothesis, 검증 불가 — git 히스토리가 2026-07-08 단일 initial commit으로 스쿼시돼 있어 원래 의도를 추적할 수 없음). 결과적으로는 `SearchDrawerContent` 하나의 내부 분해로 굳어졌다 — 의도와 결과가 어긋난 케이스로 보인다.

### 비판적 재검토 (사용자 문제 제기에 대한 반박 질문과 답)

- **이 증상이 정말 구조 문제인가, 우연인가?** 구조 문제에 가깝다. `MusicSearch`와 `SearchDropdown`이 같은 상수·같은 훅을 쓰면서도 UI를 통째로 다시 짠 것은 재사용 지점이 없어서 벌어진 반복이지, 우연한 버그가 아니다.
- **안 고치면 다음 몇 번의 변경에서 무슨 비용이 드는가?** 새로운 "곡 선택 검색" 화면이 하나 더 생기면(예: 협업 플레이리스트 편집, 재생 큐에 곡 추가) 3번째가 아니라 4번째 독립 구현이 생길 가능성이 높다. 지금 상태에서 디바운스 시간이나 최소 글자 수 같은 검색 동작을 하나 바꾸려 해도 최소 2곳을 동시에 손대야 한다.
- **더 급한 다른 문제를 가리는 건 아닌가?** 아니다. 오히려 이 중복은 Button 때보다 근거가 더 명확하다(공유 상수·훅은 있는데 UI만 안 공유) — 계속 미루면 같은 실수가 반복될 위험이 크다.
- **(자체 재검토) "검색은 3곳에서 중복됐다"는 최초 프레이밍이 정확한가?** 아니다. 더 정밀히 보면 `SearchDrawerContent`(행동형, 3탭, 결과=재생/보관함/글쓰기)와 `MusicSearch`/`SearchDropdown`(선택형, 2탭, 결과=목록에 추가)은 상호작용 목적 자체가 다르다. 진짜 1:1 중복은 `MusicSearch`↔`SearchDropdown`이고, `SearchDrawerContent`는 이번 사이클 대상에서 제외한다(아래 목표 인터뷰에서 사용자가 확정).

### 후보 우선순위

후보가 사실상 하나(검색 위젯 중복)이므로 별도 우선순위 표는 생략한다. 다만 그 안에서 통합 범위(①`MusicSearch`↔`SearchDropdown`만 vs ②`SearchDrawerContent`까지 leaf 조각 포함)는 아래 목표 인터뷰로 결정했다.

## 목표와 범위

### 목표 인터뷰 로그

**Q1. 검색 재구현 문제를 다시 뜯어보니 실제로는 두 그룹으로 나뉩니다 — ① `MusicSearch`↔`SearchDropdown`: 둘 다 "검색해서 목록에 추가"가 목적으로 완전히 같은 상호작용, ② `SearchDrawerContent`: "검색해서 재생/보관함추가/글쓰기"가 목적인 행동형 위젯으로 목적 자체가 다릅니다. 이번 사이클 통합 대상을 어디까지로 볼까요?**
A. **①만 통합** — `MusicSearch`와 `SearchDropdown`은 같은 상수·같은 훅을 쓰면서 UI만 중복돼 있어 통합 근거가 명확하다. `SearchDrawerContent`는 목적이 달라 억지로 묶으면 조건 분기만 늘어나는 억지 통합이 될 위험이 있다는 이유로 선택.

**Q2. `MusicSearch`/`SearchDropdown`의 "검색창이 열려있는가"는 지역적 `useState`이고, `useModalStore`(zustand)가 다루는 8개 모달의 열림 개념과는 계층이 다를 수 있습니다. 이 열림 상태 관리 방식도 이번에 같이 정리할까요?**
A. **손대지 않음** — 모달 내부에 뜨는 인라인 드롭다운과 화면 중앙 오버레이는 계층이 다르며, 억지로 전역 스토어로 옮기면 모달 내부 상태를 외부에 노출하는 역설계가 된다는 이유로 선택. UI 컴포넌트 재사용만으로도 원래 문제(코드 중복)는 해결된다.

**Q3. 새로 뽑을 공용 검색 위젯(또는 조각)은 어디에 둘까요?**
A. **`components/search/` 안에서 정리** — 지금 문제(순환참조·소비처 오해)가 이미 이 폴더 안에서 발생했으니 원인과 같은 위치에서 정리하는 게 적절하다는 이유로 선택. `SearchDrawerContent` 전용 조각과 새 선택형 위젯 조각을 하위 폴더 등으로 명확히 구분해 배치한다(구체적 파일 배치는 ADR에서 결정).

**Q4. 새 라이브러리 도입을 이번 사이클에서 허용할까요?**
A. **도입 없이 진행** — UI 조립 방식의 중복이지 데이터 페칭·상태관리 라이브러리 부재로 생긴 문제가 아니므로 도입 근거가 없다는 이유로 선택. (Button 사이클처럼 구현 중 예상 못 한 문제가 나오면 재논의 가능하도록 열어둠.)

**Q5(확정 질문). 아래 Behavior Invariants / Success Criteria / Out of Scope로 확정할까요?**
A. **이대로 확정** — 코드로 직접 검증한 사실 기반으로 도출된 내용이라 추가 조정 없이 승인.

### Goal

`MusicSearch`(`ContentWriteModal`)와 `SearchDropdown`(`PlaylistDetailModal`)의 입력창·탭·상태분기·결과 렌더링 중복을 `components/search/` 안의 공용 컴포넌트(또는 조각)로 통합하고, `components/search/index.ts`의 순환참조를 제거한다.

### Success Criteria

- `MusicSearch.tsx`/`SearchDropdown.tsx`의 입력창·탭·상태분기·결과렌더링 중복 코드가 공용 컴포넌트로 대체된다.
- `components/search/index.ts`의 자기참조 순환참조 3건이 madge 기준으로 사라진다.
- 현재 0건인 두 위젯의 characterization test가 최소 1세트 추가된다.

### Out of Scope

- `SearchDrawerContent`(nav 드로어) 리팩터링 — 목적이 다른 행동형 위젯이라 이번 범위에서 제외.
- 오버레이 열림 상태(zustand `useModalStore` vs `Sidebar`/`MobileBottomNav` 로컬 state) 통합 — 계층이 다른 상태로 판단, 별도 검토 후보로 남김.
- 새 라이브러리 도입.
- `conventions.md`의 배럴 규칙 갱신(backlog #97 범위).

### Behavior Invariants

- `SearchDropdown`은 결과 클릭 시 `{ ...song, id: undefined }`로 변환해 전달한다(플레이리스트에는 항상 새 id로 추가). `MusicSearch`는 `Music` 객체를 그대로 `onAddMusic`에 전달한다. 이 계약 차이는 통합 후에도 유지되어야 한다.
- 두 위젯 모두 'user' 검색 탭은 렌더링하지 않는다(`SEARCH_TAB_ENTRIES` 중 `mode === 'user'` 스킵).
- 디바운스 시간·최소 검색어 길이·결과 개수 제한 등 `useItunesSearch`·`useYoutubeSearch`의 기존 기본값은 유지된다.
- `MusicSearch` 고유 동작: 바깥 클릭 시 자동으로 닫힌다. 빈 쿼리일 때는 검색 결과 대신 플레이리스트 추천 섹션이 노출된다.

## 기준선 검증

| 명령               | 결과 | 실패 항목 | 비고                                                          |
| ------------------ | ---- | --------- | ------------------------------------------------------------- |
| `pnpm lint`        | 통과 | 없음      | 4/4 태스크, 전부 cache hit                                    |
| `pnpm check-types` | 통과 | 없음      | 3/3 태스크(ui/dto/web), 전부 cache hit                        |
| `pnpm test`        | 통과 | 없음      | web 15 suites/58 tests, api 8 suites/37 tests, 전부 cache hit |
| `pnpm build`       | 통과 | 없음      | 3/3 태스크, 전부 cache hit                                    |

측정 지표:

- 검색 위젯 관련 파일 총 줄 수(현재): `components/search/*` 349줄 + `MusicSearch.tsx` 228줄 + `PlaylistDetailModal/components/search/*` 142줄 + `hooks/search/*` 359줄 = 약 1,169줄.
- 검색 위젯 관련 characterization test: **0건**(안전망 공백, ADR에서 반드시 채워야 함).
- `components/search/index.ts` 자기참조 순환참조: **3건**(madge 확인).

---

**[GATE 1]** 위 진단·목표·범위·Behavior Invariants·기준선을 확인해주시면 ADR 단계로 넘어가겠습니다.
