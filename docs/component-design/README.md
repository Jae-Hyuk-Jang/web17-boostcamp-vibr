# 컴포넌트 설계 분석 (2026-07-21)

`apps/web/src/components/`의 현재 구조를 실제 코드 기준으로 조사해 기록한다. `shared-component-duplication` 리팩터링 사이클(#101~#108, `Button` 컴포넌트 도입)이 끝난 뒤 "재사용성이 기대보다 낮다"는 문제 제기가 있었고, 그 원인을 데이터로 짚기 위해 만들었다 — 감상이 아니라 실제 파일을 grep/read해서 나온 수치와 근거만 담는다.

## 문서 구성

| 문서                             | 내용                                                                                                                                                                                                                                               |
| -------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [`modals.md`](./modals.md)       | 8개 모달의 구조·크기·닫기 방식·하위 컴포넌트를 표로 정리                                                                                                                                                                                           |
| [`shared-ui.md`](./shared-ui.md) | `components/ui/`의 13개 공용 컴포넌트(12개 이동 + `Button`)의 역할·소비처 수                                                                                                                                                                       |
| [`buttons.md`](./buttons.md)     | 저장소 전체 버튼을 생김새(shape)·색(color) 기준으로 분류하고, `Button`이 왜 15%만 커버하는지 근거 제시                                                                                                                                             |
| [`search.md`](./search.md)       | 검색 UI가 3곳(nav 드로어/글쓰기 모달/플레이리스트 상세 모달)에서 독립 재구현된 실태와, 오버레이 열림 상태가 zustand `useModalStore`/로컬 state로 분산된 원인 — `MusicSearch`↔`SearchDropdown` 통합은 완료됨(`search-widget-duplication` #110~#115) |

## 핵심 요약

- 모달은 전부 `ModalShell`(백드롭/닫기 판정) 위에서 동작하지만, **패널 크기·그림자·닫기 버튼 유무는 모달마다 제각각**이다 — `PlaylistDetailModal`과 `PostCardDetailModal` 데스크탑 변형은 아예 닫기 버튼이 없다(배경 클릭에만 의존).
- `components/ui/`의 12개 기존 컴포넌트는 소비처가 1~13곳으로 편차가 크다. 소비처 1곳뿐인 컴포넌트(`ErrorScreen`, `LoginRequestScreen`, `PwaInstallBanner`, `PwaRegister`, `ToastContainer`, `ConfirmToast`)는 "공용"이라기보다 앱 전역에 1번만 쓰이는 싱글턴 컴포넌트에 가깝다.
- 저장소 전체 버튼 중 **82%(66곳 중 54곳)가 배경도 테두리도 없는 "bare" 버튼**이다. `Button`은 filled/outline 두 shape만 지원해서, 구조적으로 이 82%를 커버할 수 없다 — `buttons.md`에 상세 근거가 있다.
- 검색은 nav 드로어(`SearchDrawerContent`)·글쓰기 모달(`MusicSearch`)·플레이리스트 상세 모달(`SearchDropdown`) 3곳에서 입력창·탭·결과 렌더링이 각각 독립 구현돼 있고, 오버레이 "열림 상태" 자체도 `useModalStore`(zustand)·`Sidebar` 로컬 state·`MobileBottomNav` 로컬 state로 3갈래로 나뉘어 있다 — `search.md`에 상세 근거가 있다.

## 이 분석을 실제로 쓰려면

1. `Button`의 재사용성을 높이려면 `buttons.md`의 shape/color 축 분리 제안부터 검토한다.
2. 모달 구조를 더 통일하려면 `modals.md`의 "닫기 버튼 없음" 2곳(`PlaylistDetailModal`, `PostCardDetailModal` 데스크탑)이 의도된 것인지 재검토가 필요하다.
3. `shared-ui.md`의 소비처 1곳짜리 컴포넌트들은 "공용 컴포넌트"라는 이름이 맞는지, 그냥 해당 도메인 폴더로 되돌리는 게 나을지도 검토 대상이다.
4. ~~검색 중복을 해소하려면...~~ `search-widget-duplication`(#110~#115)에서 완료됨 — `MusicPickerSearch` 공용 위젯 도입, `components/search` 순환참조 제거. 오버레이 열림 상태 통일은 의도적으로 범위 밖(`search.md` 3절 참고).

이 문서 자체는 분석 기록이며, 여기서 결정된 건 없다 — 실제 변경은 별도로 `/refactoring-planner` 사이클이나 사용자 승인을 거쳐 진행한다.
