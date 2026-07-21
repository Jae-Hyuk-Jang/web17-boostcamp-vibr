# Result — search-widget-duplication

## 변경 요약

| 이슈 | 내용                                                                                                                                                                            |
| ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| #111 | `MusicSearch`(`ContentWriteModal`)/`SearchDropdown`(`PlaylistDetailModal`)의 착수 전 동작을 특성화 테스트로 고정                                                                |
| #112 | `components/search/picker/MusicPickerSearch.tsx` 신규 작성(입력창+탭+상태분기+결과렌더링, 아직 미연결) + 계약/상태전이 테스트                                                   |
| #113 | `PlaylistDetailModal`을 `MusicPickerSearch`로 전환, `components/modals/PlaylistDetailModal/components/search/`(`SearchDropdown`/`SearchInput`/`MusicSearchResults`) 폴더째 삭제 |
| #114 | `ContentWriteModal/partials/MusicSearch.tsx`를 얇은 wrapper로 축소(바깥 클릭 감지·`isSearchOpen`·플레이리스트 추천 섹션은 유지), `MusicPickerSearch`에 `showInput` prop 추가    |
| #115 | `components/search/index.ts` 자기참조 순환참조 3건 제거, 분석 문서(`search.md`, 이 문서) 갱신                                                                                   |

## Before / After

| 항목                                                                               | Before(prd.md 기준선)                                               | After                                                                                                                                                                         |
| ---------------------------------------------------------------------------------- | ------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 검색 위젯 관련 코드(`MusicSearch.tsx` + `PlaylistDetailModal/components/search/*`) | 228줄 + 142줄 = 370줄, 독립 구현 2벌                                | `MusicSearch.tsx` 133줄 + `MusicPickerSearch.tsx`(공용) 147줄 + `PlaylistDetailModal.tsx` 내 사용부 7줄 ≈ 287줄, 독립 구현 0벌(공용 위젯 1개를 두 곳이 소비)                  |
| `components/search/index.ts` 자기참조 순환참조(madge)                              | 3건(`MusicSearchResults`/`SearchDrawerContent`/`UserSearchResults`) | **0건** — 저장소 전체 순환참조는 3건(모두 `post`/`player`, 검색과 무관, backlog #96 범위)만 남음                                                                              |
| 검색 위젯 characterization/contract test                                           | **0건**                                                             | 10건(`MusicSearch.test.tsx` 4개, `MusicPickerSearch.test.tsx` 6개) — `SearchDropdown.test.tsx`는 파일 삭제와 함께 제거되고 그 계약은 `MusicPickerSearch.test.tsx`가 대신 검증 |
| `pnpm lint`                                                                        | 통과(cache hit)                                                     | 통과                                                                                                                                                                          |
| `pnpm check-types`                                                                 | 통과(cache hit)                                                     | 통과                                                                                                                                                                          |
| `pnpm test`                                                                        | web 15 suites/58 tests, api 8 suites/37 tests                       | web **17 suites/67 tests**, api 8 suites/37 tests(불변)                                                                                                                       |
| `pnpm build`                                                                       | 통과(cache hit)                                                     | 통과                                                                                                                                                                          |

## 개발환경 실동작 확인

- `packages/dto`는 변경하지 않아 `pnpm dto` 재빌드는 필요 없었다.
- `pnpm dev`로 `apps/web`만 기동(`apps/api`/MySQL/Neo4j/Redis 미기동, 이 저장소에서 기존에도 통용되던 제약)한 뒤 Playwright(`chromium`)로 직접 조작해 확인했다:
  - 홈페이지(`/`) 200 응답, 콘솔에는 `apps/api` 미기동으로 인한 예상된 500 2건(`ECONNREFUSED`)만 존재하고 그 외 JS 런타임 에러(`pageerror`)나 모듈 로드 실패는 없음 — `ContentWriteModal`/`PlaylistDetailModal`이 `app/layout.tsx`의 `ModalContainer`에 즉시 로드되므로(지연 로딩 아님), 이 확인만으로도 `MusicSearch`/`MusicPickerSearch`가 정상적으로 번들에 포함·평가됨을 검증한다.
  - **nav 검색 드로어(`SearchDrawerContent`) 직접 조작**: 사이드바 "검색" 클릭 → 드로어 열림 → "love" 입력 → 실제 iTunes 검색 결과가 정상 렌더링됨을 스크린샷으로 확인(음원/사용자/유튜브 탭, 결과 리스트, 앨범 커버, 재생/보관함/글쓰기 아이콘 전부 정상). `components/search/index.ts` 순환참조 제거(#115) 이후에도 `SearchDrawerContent`가 문제없이 동작함을 실제로 확인했다.
- **직접 확인하지 못한 부분**: `ContentWriteModal`의 `MusicSearch`(글쓰기 모달 내 검색)와 `PlaylistDetailModal`의 검색(둘 다 로그인 및 실제 플레이리스트 데이터 필요)은 이 샌드박스에 `apps/api`/인증이 없어 실제로 열어서 클릭까지 확인하지 못했다. 이 두 흐름은 `playwright.config.ts` 자체의 주석("백엔드 의존 흐름은 이슈 #27 범위 밖")에도 이미 명시된 기존 제약이다. 대신 다음으로 커버했다:
  - `MusicSearch.test.tsx`/`MusicPickerSearch.test.tsx`가 두 위젯의 결과 클릭 콜백 계약(`onAddMusic`이 원본 `Music`을 그대로 받음, `PlaylistDetailModal`에서는 `{ ...music, id: undefined }`로 변환)을 실제로 실행해 검증.
  - `pnpm build`가 두 모달을 포함해 정적 페이지 생성까지 정상 완료.
  - 사용자가 백엔드 기동 후 글쓰기 모달/플레이리스트 상세 모달에서 곡 검색을 한 번 더 눈으로 확인하는 것을 권장한다.

## Behavior Verification

prd.md의 Behavior Invariants:

- ✅ `SearchDropdown`(전환 후에는 `PlaylistDetailModal`의 `onSelect` 콜백)이 결과 클릭 시 `{ ...song, id: undefined }`로 변환해 전달 — `PlaylistDetailModal.tsx`의 `onSelect={(music) => handleAddSong({ ...music, id: undefined })}`로 유지, `MusicSearch`는 `onAddMusic`에 원본 그대로 전달 — `MusicPickerSearch.test.tsx`의 계약 테스트로 검증.
- ✅ 두 위젯 모두 'user' 검색 탭 미노출 — `MusicPickerSearch`는 애초에 `ContentSearchMode`(`Exclude<SearchMode, 'user'>`) 타입으로 tab 목록을 만들어 구조적으로 'user' 탭이 존재할 수 없음. `MusicSearch.test.tsx`/`MusicPickerSearch.test.tsx` 양쪽에서 재확인.
- ✅ `useItunesSearch`/`useYoutubeSearch` 디바운스·최소 길이·결과 제한 기본값 — 두 훅을 그대로 재사용(수정 없음)했으므로 불변.
- ✅ `MusicSearch` 고유 동작(바깥 클릭 시 닫힘, 빈 쿼리일 때 플레이리스트 추천 섹션) — `containerRef`+`useEffect` 아웃사이드클릭 로직과 `renderPlaylistSection`을 그대로 유지, `ContentWriteModal.test.tsx`/`MusicSearch.test.tsx` 통과로 재확인.

adr.md의 회귀 시나리오 표 6개 중 5개는 위 테스트로 커버됐고, "최소 글자 수 미만 입력" 시나리오는 `getHintMessage` 유틸을 두 위젯 통합 지점에서 그대로 재사용해 힌트 문구 로직 자체를 하나로 합쳤다(별도 회귀 테스트는 추가하지 않음 — 유닛 레벨로는 `getHintMessage` 자체가 순수 함수라 기존에 이미 검증된 로직).

## Decision Review

adr.md에서 선택한 안 2(단일 공용 위젯)의 예상과 실제 비교:

- **예상**: 콜백 계약 차이(`id: undefined`)는 위젯이 `Music`을 그대로 넘기고 소비처가 변환하면 자연스럽게 해결된다 → **실제로 그대로 들어맞았다.** `PlaylistDetailModal.tsx`에서 `onSelect` 콜백 한 줄로 처리됨.
- **예상하지 못했던 점**: ADR 작성 시점에는 "위젯이 입력창까지 포함해서 흡수한다"고만 정했는데, 구현 과정에서 `MusicSearch`(글쓰기 모달)는 자기만의 입력창(포커스 시 열림, 다른 아이콘/패딩)을 유지해야 한다는 게 드러나 `showInput` prop을 추가했다. 이는 ADR의 "Migration" 절이 이미 "탭+결과 렌더링 부분만 교체한다"고 명시했던 것과 일치하는 방향이라, 새로 ADR을 다시 열 정도의 이탈은 아니라고 판단해 구현 중 조정으로 처리했다.
- **예상하지 못했던 점 2**: 통합 결과 시각적으로 완전히 동일하지는 않다 — `MusicSearch`의 원래 결과 아이템은 "검색 결과" 섹션 헤더(`MusicIcon` + 라벨)와 40px 앨범 커버를 썼지만, `MusicPickerSearch`는 섹션 헤더 없이 32px 커버로 통일했다. 이는 Behavior Invariant(기능적 계약)에는 포함되지 않았던 시각적 디테일이라 범위 위반은 아니지만, 픽셀 단위로 완전히 동일하진 않다는 점을 투명하게 남긴다.

## Remaining Debt

- `SearchDrawerContent`(nav 드로어)는 여전히 독립 구현이다 — `TrackItem`(행동형: 재생/보관함/글쓰기)과 `MusicPickerSearch`의 결과 아이템(선택형)이 목적이 달라 이번 사이클에서 통합하지 않기로 확정했다(prd.md Out of Scope). 세 번째 "선택형" 소비처가 또 생기면 이번 결정을 재검토할 만하다.
- 오버레이 열림 상태(`useModalStore` vs `Sidebar`/`MobileBottomNav` 로컬 state) 3갈래 분산은 그대로 남아있다 — 별도 검토 후보(prd.md Out of Scope).
- `MusicSearch`와 `MusicPickerSearch` 통합 후 결과 아이템의 시각적 디테일(섹션 헤더, 썸네일 크기)이 달라졌다 — 필요하면 후속으로 미세 조정 가능.
- `ContentWriteModal`/`PlaylistDetailModal`의 실제 검색 흐름은 백엔드 없이 대화형으로 눈으로 확인하지 못했다 — 사용자가 로컬에서 `apps/api` 기동 후 한 번 확인 권장.

## Follow-ups

- 별도 이슈로 다루지 않은 채 남겨둔 백로그: #96(저장소 전역 순환참조 — `post`/`player` 2건), #97(conventions.md 배럴 규칙 갱신), #98(하드 섀도 색상 통일), #100(Playwright CI 통합).
- `buttons.md`에서 제안한 `Button` shape/color 축 분리는 이 사이클과 무관하게 별도 결정 대기 중.

---

**[GATE 3]** 위 Before/After, 개발환경 실동작 확인, Behavior Verification, 남은 부채를 확인해주시면 이 리팩터링 사이클을 종료하겠습니다.
