# 문제 영역

검색(search) UI와 오버레이 열림 상태 관리

## 관찰한 증상

- 검색창+탭 전환+상태 메시지(로딩/에러/빈 결과)+결과 리스트 렌더링 로직이 파일마다 다시 작성돼 있다.
- 새 화면에서 검색이 필요할 때 기존 검색 UI를 가져다 쓰지 못하고 매번 새로 구현하는 것으로 보인다.

## 실제 사례

- `apps/web/src/components/search/SearchDrawerContent.tsx`(nav 검색 드로어), `apps/web/src/components/modals/ContentWriteModal/partials/MusicSearch.tsx`(글쓰기 모달), `apps/web/src/components/modals/PlaylistDetailModal/components/search/SearchDropdown.tsx`(플레이리스트 상세 모달) — 3곳 모두 입력창 마크업, 탭 버튼 JSX, 로딩/에러/빈 결과 메시지 분기, 결과 아이템 렌더링을 독립적으로 구현.
- 공용으로 이미 존재하는 `components/search/TrackItem.tsx`조차 `MusicSearch.tsx`/`SearchDropdown.tsx`에서는 쓰이지 않고 각자 인라인 `<button>` 블록으로 재구현됨.
- `components/search/` 폴더의 `SearchInput`/`MusicSearchResults`/`TrackItem`/`UserItem`/`UserSearchResults`/`SearchStateMessage`는 실제로는 `SearchDrawerContent.tsx` 1곳에서만 쓰여, "공용 폴더"라는 이름과 실제 소비 구조가 불일치.
- 검색 오버레이의 "열림/닫힘" 상태 관리 방식이 3갈래로 나뉨: 8개 모달(`MODAL_TYPES`)은 `useModalStore`(zustand) 사용, 데스크탑 검색 드로어는 `Sidebar.tsx`의 로컬 `activeDrawer` state, 모바일 검색 바텀시트는 `MobileBottomNav.tsx`의 별도 로컬 `isSearchOpen` state. 검색은 `MODAL_TYPES`에 아예 등록돼 있지 않음.
- 세 검색 구현이 공유하는 것은 `SEARCH_TAB_ENTRIES` 상수(컴포넌트 파일인 `SearchDrawerContent.tsx` 안에 정의돼 있어 참조 경로가 부자연스러움)와 `useItunesSearch`/`useYoutubeSearch` 훅뿐이다.

상세 근거는 `docs/component-design/search.md` 참고.

## 초기 가설

- (가설) 검색을 여는 "표준 창구"가 없어서(=`MODAL_TYPES`에 미등록, 오버레이 상태가 표준화되지 않아서) 새 화면에서 검색이 필요할 때마다 재사용 대신 재구현을 선택한 것으로 보인다. 아직 검증되지 않은 인과관계다.
- (가설) `components/search/`가 실제로는 `SearchDrawerContent` 전용 내부 분해인데 폴더명 때문에 "이미 공용화된 검색 컴포넌트"로 오해되어, 정작 새로 검색 UI가 필요한 곳(모달)에서는 재사용을 시도조차 안 했을 수 있다.

## 기대 효과

- 검색 UI(입력+탭+상태+결과)를 한 곳에서 관리하면, 다음에 검색이 필요한 화면을 추가할 때 재구현 없이 기존 컴포넌트를 조합만 하면 된다.
- 오버레이 열림 상태 관리 방식이 통일되면, 검색을 여는 새로운 진입점(예: 다른 모달 내부)을 추가하는 비용이 줄어든다.

## 제약

- 3개 검색 표면(nav 드로어/글쓰기 모달/플레이리스트 상세 모달)은 실제로 검색 대상(음악+영상+사용자 vs 음악+영상만)과 부가 기능(플레이리스트 추천 섹션 등)이 다르다 — 무조건 완전히 동일한 컴포넌트로 강제 통일하지 않는다.
- 기존 8개 모달의 `useModalStore` 계약과 검색 드로어의 데스크탑/모바일 UX 차이(드로어 vs 바텀시트)는 유지한다.
