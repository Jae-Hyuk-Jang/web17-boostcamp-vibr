# 검색(search) 설계 분석 — 왜 3번 다시 구현됐는가

> **후속 조치 완료**: 이 문서에서 지적한 `MusicSearch`↔`SearchDropdown` 중복과 `components/search/index.ts` 순환참조는 `search-widget-duplication` 리팩터링 사이클(#110~#115)에서 해소했다. 아래 1~2절은 착수 전 상태를 기록한 것이고, 결과는 `docs/refactors/search-widget-duplication/result.md`를 참고한다. `SearchDrawerContent`(nav 드로어) 재구성과 오버레이 열림 상태(zustand `useModalStore`/로컬 state) 통합은 해당 사이클에서 의도적으로 범위 밖으로 남겼다(3절 참고).

`components/search/` 폴더가 있어서 "검색은 이미 공용화돼 있다"고 오해하기 쉽지만, 실제로는 폴더 안 컴포넌트 대부분이 `SearchDrawerContent` 하나만을 위한 내부 분해다. 진짜 문제는 그 폴더 밖, 즉 모달 안에서 검색 UI가 손으로 다시 짜인 데 있다.

## 1. `components/search/`의 실제 소비 구조

| 컴포넌트                                                                                                | 실제 소비처                                                                                 |
| ------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| `SearchInput`, `MusicSearchResults`, `TrackItem`, `UserItem`, `UserSearchResults`, `SearchStateMessage` | **`SearchDrawerContent.tsx` 1곳뿐**                                                         |
| `SearchDrawerContent`(최상위)                                                                           | `Sidebar.tsx`(데스크탑 드로어), `MobileBottomNav.tsx`(모바일 바텀시트) — 여기만 진짜 재사용 |

`shared-ui.md`에서 확인한 "소비처 1곳짜리 컴포넌트가 공용 폴더에 섞여 있다"는 패턴과 동일하다. `components/search/`는 공용 라이브러리가 아니라 `SearchDrawerContent`의 private partials이고, 폴더 이름 때문에 다른 개발자가 "여기 가져다 쓰면 되겠다"고 오해하기 쉬운 구조다.

## 2. 검색창+탭+결과 로직이 3곳에서 독립적으로 재구현됨

| 위치                                                       | 트리거                    | 상태 관리                                   | 검색 훅                                              | UI 구현                                                              |
| ---------------------------------------------------------- | ------------------------- | ------------------------------------------- | ---------------------------------------------------- | -------------------------------------------------------------------- |
| `SearchDrawerContent`                                      | Sidebar / MobileBottomNav | `useSearchDrawer` 훅(music/user/video 통합) | `useItunesSearch`/`useYoutubeSearch`/`useUserSearch` | `SearchInput`+탭+`MusicSearchResults`/`UserSearchResults`            |
| `ContentWriteModal/partials/MusicSearch.tsx`               | 글쓰기 모달               | 컴포넌트 로컬 `useState`                    | `useItunesSearch`/`useYoutubeSearch` 직접 호출       | 입력 마크업·탭·결과 리스트 전부 자체 재구현 + 플레이리스트 추천 섹션 |
| `PlaylistDetailModal/components/search/SearchDropdown.tsx` | 플레이리스트 상세 모달    | 컴포넌트 로컬 `useState`                    | `useItunesSearch`/`useYoutubeSearch` 직접 호출       | 입력 마크업·탭·결과 리스트 전부 자체 재구현(3번째 버전)              |

세 곳이 실제로 공유하는 건 두 가지뿐이다.

- `SEARCH_TAB_ENTRIES` 상수 — `SearchDrawerContent.tsx`(컴포넌트 파일) 안에 정의돼 있어, 모달 쪽 컴포넌트가 컴포넌트 파일에서 상수만 import해오는 형태(레이어 경계가 흐릿함).
- `useItunesSearch`/`useYoutubeSearch` 훅 — 이 부분은 잘 재사용되고 있다.

반면 **입력창 마크업, 탭 버튼 JSX, 로딩/에러/빈 결과 메시지 분기, 결과 아이템 렌더링**은 세 곳 모두 따로 작성됐다. 공용으로 이미 존재하는 `TrackItem`조차 `MusicSearch.tsx`/`SearchDropdown.tsx`에서는 쓰이지 않고 각자 인라인 `<button>` 블록을 새로 만들었다.

## 3. Zustand 관점 — 검색어는 정상, "열림 상태"가 3갈래로 분산됨

- `query`/`mode` 같은 검색 입력값을 컴포넌트 로컬 `useState`로 두는 것 자체는 `CLAUDE.md`의 Zustand 정책(폼 입력값은 로컬 상태)에 맞다 — 여기는 문제가 아니다.
- 문제는 "검색이 열려 있는가"라는, 8개 모달과 개념적으로 동일한 종류의 상태가 **관리 방식이 통일돼 있지 않다**는 점이다.

| 오버레이                                            | 열림 상태 관리                                                          |
| --------------------------------------------------- | ----------------------------------------------------------------------- |
| 8개 모달(WRITE/LOGIN/POST_DETAIL 등, `MODAL_TYPES`) | `useModalStore`(zustand, 전역)                                          |
| 데스크탑 검색 드로어                                | `Sidebar.tsx`의 로컬 `activeDrawer` state                               |
| 모바일 검색 바텀시트                                | `MobileBottomNav.tsx`의 로컬 `isSearchOpen` state(데스크탑과 별개 구현) |

검색은 `MODAL_TYPES`에 등록돼 있지 않고, `Sidebar`/`MobileBottomNav`가 각자 만든 독립 토글로 열린다. 검색을 여는 표준 창구가 하나로 잡혀 있지 않다 보니, `ContentWriteModal`이나 `PlaylistDetailModal` 안에서 검색이 필요할 때 기존 검색 드로어를 재사용할 방법이 없어 매번 새로 구현된 것으로 보인다 — 재사용을 안 한 게 아니라, 재사용할 정박지 자체가 없었다.

## 결론

버튼 중복이 "스타일 반복"이었다면, 검색 중복은 "도메인 기능 하나가 아키텍처적으로 한 번도 통합된 적 없음"에 가까웠다. `search-widget-duplication` 사이클에서 실제로 내린 결정:

1. **열림 상태는 손대지 않았다** — `MusicSearch`/`SearchDropdown`의 열림 상태는 모달 내부 인라인 드롭다운이라 `useModalStore`가 다루는 화면 중앙 오버레이와 계층이 다르다고 판단했다(PRD 목표 인터뷰 Q2).
2. **입력+탭+상태메시지+결과리스트는 `components/search/picker/MusicPickerSearch.tsx`로 통합했다.** `MusicSearch`/`SearchDropdown`이 이를 소비하도록 전환했고, `PlaylistDetailModal/components/search/`(구 `SearchDropdown` 계열)는 폴더째 삭제됐다.
3. `components/search/index.ts`의 자기참조 순환참조 3건(`MusicSearchResults`/`SearchDrawerContent`/`UserSearchResults`)도 개별 경로 import로 바꿔 함께 제거했다.

상세 진행 기록은 `docs/refactors/search-widget-duplication/{prd,adr,result}.md`를 참고한다.
