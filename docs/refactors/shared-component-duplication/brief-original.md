# 문제 영역

`apps/web/src/components/` 전반의 공용 버튼 스타일 반복과, 최상위에 흩어진 loose 공용 컴포넌트의 배치.

## 관찰한 증상

- 공유 `Button` 컴포넌트가 존재하지 않아(`packages/ui`는 빈 파일, `apps/web`에도 범용 버튼 없음) 각 파일이 Primary/Secondary/Danger 세 가지 className 조합을 인라인으로 반복한다.
- `apps/web/src/components/` 최상위에 도메인 없는 공용 컴포넌트(`ModalShell`, `ModalCloseButton`, `ModalPanel`, `LoadingSpinner`, `ConfirmOverlay`, `ErrorScreen`, `TickerText`, `LoginRequestScreen`, `PwaInstallBanner`, `PwaRegister`, `ToastContainer`, `ConfirmToast`)가 도메인 폴더(`layout`, `player`, `sidebar` 등)와 구분 없이 loose 파일로 뒤섞여 있다.

## 실제 사례

- `docs/design-system.md` §8이 이미 "같은 버튼 스타일이 파일마다 반복되는 것 자체가 기술부채"라고 명시하고 있다.
- `modal-composition-structure` 사이클(#87~#92)에서 모달의 액션 버튼(등록/저장/취소/선택 등)도 같은 반복 패턴을 다시 확인했지만, 그 사이클은 닫기 버튼·패널 컨테이너로 범위를 좁혀 Button 신설은 Out of Scope로 뒀다.
- 같은 ADR(`docs/refactors/modal-composition-structure/adr.md`)에서 `components/ui/` 폴더 신설(안 3)도 검토했지만, 모달 8개짜리 사이클에 붙이기엔 파급 범위(loose 공용 컴포넌트를 참조하는 31개+ 파일의 import 경로 변경)가 너무 커서 기각했다.

## 초기 가설

- (가설) Button 도입은 이미 전 도메인(피드/프로필/플레이어 등)에 걸쳐 광범위한 소비처 전환이 필요한 작업이라, 그 김에 loose 공용 컴포넌트를 `ui/` 폴더로 정리하는 것도 같은 파급 범위 안에서 함께 처리할 수 있을 것이다 — 검증 전 가설이며, 실제로 두 작업을 묶는 게 이득인지는 진단에서 확인해야 한다.

## 기대 효과

- 새 버튼을 만들 때마다 className 조합을 새로 판단하지 않고 공용 `Button`을 재사용할 수 있게 된다.
- 공용 UI 컴포넌트가 어디 있는지(도메인 폴더 vs `ui/`) 판단 기준이 명확해진다.

## 제약

- (목표 인터뷰에서 확인 예정)
