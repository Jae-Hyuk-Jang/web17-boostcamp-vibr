# 문제 영역

`apps/web/src/components/modals/` 아래 8개 모달 컴포넌트의 구조·관계와, `apps/web/src/components/` 전반의 배럴 export(`index.ts`) 구조.

## 관찰한 증상

- 모달이 8개 존재하는데, 각각의 구조와 서로의 관계(공통점/차이점)가 명확히 파악되어 있지 않다.
- 공통으로 추출 가능한 컴포넌트가 더 있어 보이지만 확인된 적이 없다.
- 각 도메인 폴더의 배럴(`index.ts`), 특히 `modals/index.ts`와 최상위 `components/index.ts`가 실제로 유효한 구조인지, 이로 인한 순환 참조 문제가 있는지 확인되지 않았다.

## 실제 사례

- 직전 리팩터링 사이클(`modal-shell-duplication`, 이슈 #64)에서 8개 모달의 backdrop 렌더링·배경 클릭 판정·z-index·접근성 속성 중복을 `ModalShell`/`ModalCloseButton`으로 추출했다(`docs/refactors/modal-shell-duplication/result.md`). 다만 이 사이클은 backdrop/닫기 판정에 집중했고, 그 외 공통 추출 가능한 부분이나 배럴 구조 자체는 다루지 않았다.
- 최근 dev 런타임 에러 수정(PR #84)에서 전역 배럴(`src/components/index.ts`) 대신 개별 경로로 import하도록 31개 파일을 정리했다 — "모달 하나를 열 때도 player/feed/profile 등 앱 전체 컴포넌트가 하나의 모듈 그래프로 묶여 hmr 추적이 깨지는" 문제와 "ModalContainer의 자기참조 배럴 import(순환 참조)"가 원인으로 지목됐다. 이 변경이 임시방편인지, 배럴 구조 자체를 다시 설계해야 하는지는 이번에 확인되지 않았다.

## 초기 가설

- (가설) 8개 모달 사이에 `ModalShell` 외에도 공통 추출 가능한 부분(예: 패널 헤더/타이틀 영역, 닫기 버튼 배치, 스크롤 영역, 폼 vs 조회 전용 모달의 레이아웃 패턴)이 더 있을 수 있다.
- (가설) `apps/web/src/components/index.ts` 같은 광범위한 배럴이 실제 소비 패턴과 맞지 않아, 순환 참조나 불필요한 모듈 결합을 유발할 수 있다. PR #84에서 이미 한 번 순환 참조 사례(ModalContainer 자기참조)가 확인된 바 있다.
- (가설) `apps/web/src/components/`에 공통 UI 조각을 모을 `ui/` 폴더를 신설하면 도움이 될 수 있다 — 다만 이는 해결책 후보일 뿐, 진단 전에 결론으로 고정하지 않는다.

## 기대 효과

- 새 모달을 추가하거나 기존 모달을 수정할 때 무엇이 공통이고 무엇이 모달별 고유 로직인지 명확해진다.
- 배럴 export 구조가 순환 참조 위험 없이 안전하게 유지되고, 배럴을 어떤 기준으로 두고 어떤 기준으로 개별 경로 import를 쓸지 일관된 판단 기준이 생긴다.

## 제약

- (인터뷰에서 확인 예정)
