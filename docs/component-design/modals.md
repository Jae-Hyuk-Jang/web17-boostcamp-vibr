# 모달 8개 설계 분석

`apps/web/src/components/modals/`, `ModalContainer.tsx`(`app/layout.tsx`에 상시 마운트)가 `useModalStore`의 `modalType`에 따라 8개 모달 중 하나를 렌더링한다. 전부 `ModalShell`(백드롭·배경 클릭 판정·`role="dialog"`·z-index 캡슐화, `modal-shell-duplication` 사이클 산출물) 위에서 동작하지만 그 이후는 모달마다 다르다.

## 한눈에 보기

| 모달                            | 트리거(`MODAL_TYPES`)            | 줄 수 | `ModalShell`  | `ModalPanel`  | 닫기 버튼          | `closeOnBackdrop`        | 최대 크기                               |
| ------------------------------- | -------------------------------- | ----- | ------------- | ------------- | ------------------ | ------------------------ | --------------------------------------- |
| `ContentWriteModal`             | `WRITE`                          | 108   | ✅            | ✅            | `ModalCloseButton` | `false`                  | `max-w-2xl` `max-h-[90vh]`              |
| `LoginModal`                    | `LOGIN`                          | 45    | ✅            | ✅            | `ModalCloseButton` | `true`(기본)             | `max-w-md`                              |
| `MobileNowPlaylistModal`        | `MOBILE_QUEUE`                   | 139   | ❌(자체 구현) | ❌(자체 구현) | `ModalCloseButton` | 항상 닫힘(자체 backdrop) | `max-h-[55vh]`, 바텀시트                |
| `PlaylistDetailModal`           | `PLAYLIST_DETAIL`                | 214   | ✅            | ✅            | **없음**           | `true`(기본)             | `max-w-lg` `max-h-[85vh]`               |
| `PlaylistPickerModal`           | `PLAYLIST_PICKER`                | 240   | ✅            | ✅            | `ModalCloseButton` | `true`(기본)             | `max-w-md` `max-h-[70vh]`               |
| `PostCardDetailModal`(데스크탑) | `POST_DETAIL`                    | 329   | ✅            | ❌(자체 구현) | **없음**           | `true`(기본)             | `max-w-5xl` `max-h-[85vh]`              |
| `PostCardDetailModal`(모바일)   | `POST_DETAIL`                    | 329   | ❌(자체 구현) | ❌(자체 구현) | `ModalCloseButton` | 항상 닫힘(자체 backdrop) | `h-[90vh]`, 바텀시트                    |
| `PrivacyConsentModal`           | `PRIVACY_CONCENT`                | 33    | ✅            | ✅            | `ModalCloseButton` | `false`                  | `max-w-lg`                              |
| `UserListModal`                 | `FOLLOWER_USER`/`FOLLOWING_USER` | 133   | ✅            | ✅            | `ModalCloseButton` | `true`(기본)             | `max-w-sm md:max-w-md` `h-[50vh]`(고정) |

(`PostCardDetailModal`은 반응형 분기로 데스크탑/모바일 마크업을 한 컴포넌트 안에서 동시에 렌더링하고 `lg:hidden`/`hidden lg:flex`로 전환하므로 표에 두 행으로 나눠 기록했다.)

## 관찰

### 1. 닫기 버튼이 없는 모달이 2곳 있다

`PlaylistDetailModal`과 `PostCardDetailModal` 데스크탑 변형은 X 닫기 버튼이 없고 배경 클릭(또는 ESC/뒤로가기, `ModalContainer`의 전역 로직)으로만 닫힌다. 나머지 6곳(+`PostCardDetailModal` 모바일)은 전부 닫기 버튼이 있다. 이게 의도된 디자인인지, 두 곳만 빠뜨린 것인지는 이 문서만으로는 판단할 수 없다 — 실제 사용자 흐름을 아는 사람의 확인이 필요하다.

### 2. `ModalShell`/`ModalPanel`을 둘 다 안 쓰는 모달이 2곳(사실상 3변형)

`MobileNowPlaylistModal`과 `PostCardDetailModal`의 모바일 변형은 바텀시트라 `ModalShell`(중앙 정렬 백드롭 전제)과 `ModalPanel`(중앙 정렬 패널 전제)의 설계 전제와 안 맞아 처음부터 제외됐다(`modal-shell-duplication`/`modal-composition-structure` 사이클에서 각각 확인). 두 바텀시트는 서로 비슷한 구조(`fixed inset-x-0 bottom-*`, `rounded-t-2xl`, `animate-slide-up`)를 각자 손으로 구현하고 있어 — **바텀시트 전용 공용 컴포넌트(가칭 `BottomSheetPanel`)가 아직 추출되지 않은 상태**다.

### 3. 하드 섀도 색상이 3가지로 갈라져 있다

`ModalPanel`을 쓰는 6곳 중 그림자를 지정한 4곳이 `shadow-[8px_8px_0px_0px_var(--color-primary)]`(3곳: `ContentWriteModal`/`LoginModal`/`PrivacyConsentModal`)와 `shadow-[8px_8px_0px_0px_#00214D]`(1곳: `PlaylistDetailModal`, `var(--color-primary)`와 같은 값을 hex로 하드코딩)로 나뉜다. `PlaylistPickerModal`/`UserListModal`은 그림자 자체가 없다. `PostCardDetailModal` 데스크탑은 `shadow-2xl`(순정 Tailwind, 하드 섀도 아님)을 쓴다 — 이미 백로그 이슈 #98(하드 섀도 색상 통일)로 등록돼 있다.

### 4. 테스트는 8곳 전부 있다

`modal-shell-duplication` 사이클에서 만든 특성화 테스트가 8개 모달 전부에 존재한다(무한 리스트 스크롤 등 일부 상세 로직은 커버 범위 밖일 수 있음). 이 영역은 안전망 공백이 아니다.

## 하위 컴포넌트 규모

| 모달                                                                                    | 하위 컴포넌트 폴더                                                                                        | 비고                                                                                                                                                                                                                                                                      |
| --------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ContentWriteModal`                                                                     | `partials/`(4개: `CoverImgUploader`, `MusicSearch`, `PlaylistSectionInner`, `SelectedMusicList`)          | 이미지 업로드+음악 검색+텍스트 작성 폼                                                                                                                                                                                                                                    |
| `LoginModal`                                                                            | `loginButtons/`(3개: Google/Spotify/Tmp)                                                                  | OAuth 버튼마다 브랜드 색상을 직접 하드코딩(`buttons.md` 참고)                                                                                                                                                                                                             |
| `PlaylistDetailModal`                                                                   | `components/`(4개) + `components/search/`(3개)                                                            | 곡 목록·검색·헤더가 전부 분리된 가장 큰 모달군                                                                                                                                                                                                                            |
| `PostCardDetailModal`                                                                   | `partials/`(4개: `LikedUsersOverlay`, `PostDetailActions`, `PostDetailBody`, `PostDetailCommentComposer`) | `LikedUsersOverlay`는 모달 안에 중첩된 별도 오버레이 — 지난 두 리팩터링 사이클(`modal-shell-duplication`, `modal-composition-structure`) 모두 "8개 최상위 모달" 기준으로 진단해서 이 중첩 오버레이를 놓쳤다가 `shared-component-duplication` 사이클(#105)에서 뒤늦게 발견 |
| `MobileNowPlaylistModal`, `PlaylistPickerModal`, `PrivacyConsentModal`, `UserListModal` | 하위 컴포넌트 없음(단일 파일) 또는 최소                                                                   | `PrivacyConsentModal`은 `AgreeItem`/`PrivacyConsentForm` 2개                                                                                                                                                                                                              |

**시사점**: `PostCardDetailModal`의 사례처럼, "최상위 모달 8개" 단위로만 진단하면 그 안에 중첩된 오버레이(`LikedUsersOverlay` 같은)를 구조적으로 놓치기 쉽다. 다음에 모달 관련 리팩터링을 할 때는 `MODAL_TYPES`에 등록된 것뿐 아니라 모달 내부에서 `fixed inset-0` 패턴으로 렌더링되는 중첩 오버레이까지 검색 범위에 포함해야 한다.
