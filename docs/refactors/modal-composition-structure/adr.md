# ADR — modal-composition-structure

## 3안 비교

PRD 인터뷰에서 새 라이브러리 도입을 불허(자체 구현만)로 확정했으므로, 워크플로우의 "③ 검증된 도구 도입안"은 "폴더 구조까지 재편하는 자체 구현 대안"으로 대체한다. 세 안 모두 자체 구현이며, 차이는 "어디까지 추출하고 어디에 둘 것인가"다.

### 안 1 — 최소 개선안: `ModalCloseButton` 전환만

이미 존재하지만 안 쓰이는 `ModalCloseButton`을 7개 닫기 버튼(`ContentWriteModal`, `LoginModal`, `UserListModal`, `PlaylistPickerModal`, `PrivacyConsentModal`, `MobileNowPlaylistModal`, `PostCardDetailModal` 모바일)에 전환한다. 패널 컨테이너 마크업은 각 파일에 인라인으로 그대로 둔다. `ContentWriteModal`의 순환 참조만 개별 경로 import로 고친다.

### 안 2 — 경계 재설계안: `ModalPanel` 신설 + `ModalCloseButton` 전환 (권장)

안 1에 더해 패널 컨테이너 공통 부분(`bg-white border-2 border-primary rounded-3xl overflow-hidden flex flex-col`)을 새 `ModalPanel` 컴포넌트로 추출한다. `ModalShell`이 그랬듯 크기(`max-w-*`/`max-h-*`)·그림자·애니메이션처럼 모달마다 다른 부분은 `className`으로 그대로 넘겨 각 모달이 소유하게 한다. 신규 컴포넌트는 지금의 `ModalShell`/`ModalCloseButton`과 같은 계층(`components/` 최상위 loose 파일)에 둔다.

### 안 3 — 구조 재편성안: 안 2 + `components/ui/` 폴더 신설

안 2와 동일하게 추출하되, `ModalShell`/`ModalCloseButton`/`LoadingSpinner`/`ConfirmOverlay`/`ErrorScreen`/`TickerText`/`LoginRequestScreen` 등 기존 loose 공용 컴포넌트까지 전부 `components/ui/`로 이동하고 `ui/index.ts` 배럴로 재편한다.

---

## 비교표 (10개 고정 기준)

| #   | 기준                 | 안 1(ModalCloseButton만)                                                     | 안 2(ModalPanel 신설, 권장)                                                                           | 안 3(ui/ 폴더까지)                                                                                                                  |
| --- | -------------------- | ---------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| 1   | 근본 원인 해결력     | 낮음~중간 — 닫기 버튼 중복은 없어지지만 패널 컨테이너 중복(7곳)은 그대로     | 높음 — 닫기 버튼 + 패널 스타일 모두 추출                                                              | 높음 — 안 2와 동일 + 폴더 구조까지 정리                                                                                             |
| 2   | 동작 보존 난이도     | 쉬움 — prop만 교체, DOM 구조 거의 안 바뀜                                    | 중간 — 8개 파일의 최상위 패널 div를 감싸는 형태로 재작성(직전 ModalShell 전환과 동일 패턴, 선례 있음) | 어려움 — 안 2 작업 + 기존 loose 파일 참조 31개+ 파일의 import 경로 전부 변경                                                        |
| 3   | 책임·의존성 변화     | 거의 없음                                                                    | ModalPanel이 컨테이너 뼈대 소유, 각 모달은 내부 콘텐츠만 소유                                         | 안 2와 동일 + "공용 UI 폴더"라는 새 경계 개념 도입                                                                                  |
| 4   | 테스트 용이성        | 낮음 — 패널은 여전히 각자 스타일이라 이득 없음                               | 높음 — ModalPanel 계약 테스트 하나로 스타일 검증 가능                                                 | 높음(안 2와 동일), 다만 이동 자체에 대한 회귀 테스트가 추가로 필요                                                                  |
| 5   | 변경 범위            | 작음(7개 파일의 닫기 버튼 부분만)                                            | 중간(8개 파일 일부 + 신규 컴포넌트 2개)                                                               | 큼(안 2 + loose 파일 이동 + 31개+ 파일 import 경로)                                                                                 |
| 6   | 점진적 전환 가능성   | 좋음                                                                         | 좋음 — 모달 하나씩 전환 가능(직전 사이클 선례)                                                        | 나쁨 — 폴더 이동은 한 번에 끝내지 않으면 신/구 경로가 혼재해 더 헷갈림                                                              |
| 7   | 롤백 가능성          | 쉬움                                                                         | 쉬움 — 파일 단위 커밋                                                                                 | 어려움 — 광범위 import 경로 변경을 부분 롤백하기 번거로움                                                                           |
| 8   | 성능·운영 영향       | 없음                                                                         | 없음                                                                                                  | 없음                                                                                                                                |
| 9   | 기존 코드와의 일관성 | 높음 — 지금 관습 그대로                                                      | 높음 — `ModalShell`/`ModalCloseButton`과 동일 계층 유지                                               | 낮음 — 지금 없는 새 폴더 관습을 도입, `conventions.md`도 갱신해야 함(PRD가 Out of Scope로 뺀 "배럴/폴더 구조 재정의"와 사실상 겹침) |
| 10  | 유지 비용            | 중간~높음 — 패널 스타일은 여전히 8곳에서 손대야 해 다음에 또 드리프트될 위험 | 낮음 — 패턴 확립되면 재사용 쉬움                                                                      | 낮음(장기) / 초기 도입 비용 큼                                                                                                      |

## 라이브러리 도입 심사

해당 없음 — 3안 모두 자체 구현이며, PRD 목표 인터뷰(Q4)에서 이미 라이브러리 도입을 불허하기로 확정했다(근거: `ModalShell`이 이미 자체 구현으로 7곳에 적용돼 있어 새 라이브러리를 들이면 두 패턴이 공존하게 됨).

## 의사결정 인터뷰 로그

**Q. 3안을 비교해보면, 안 2(공용 `ModalPanel`/`ModalCloseButton`을 지금의 `components/` 최상위 loose 파일 관습으로 추가)와 안 3(같은 추출을 하면서 `components/ui/` 폴더를 신설해 기존 loose 파일까지 다 이동)의 차이가 핵심입니다. `ui/` 폴더를 이번에 도입할까요?**

A. 안 2 — 지금은 도입 안 함. 이유: 새 `ModalPanel`/`ModalCloseButton`은 기존 `ModalShell`과 같은 계층에 두고, `ui/` 폴더 도입은 PRD에서 Out of Scope로 명시한 "저장소 전역 배럴/폴더 구조 재정의"와 사실상 같은 작업이라(`ModalShell`/`LoadingSpinner`/`ConfirmOverlay` 등을 참조하는 31개+ 파일의 import 경로가 다 바뀌어야 함) 이번 사이클을 "모달 8개"로 좁힌 결정과 충돌한다.

_(참고: 라이브러리 도입 여부는 PRD 단계 목표 인터뷰 Q4에서 이미 결정됐다 — "불허, 자체 구현으로"; ADR 단계에서 다시 묻지 않았다.)_

## 선택: 안 2 (`ModalPanel` 신설 + `ModalCloseButton` 전환)

기준 9(기존 코드와의 일관성)에서 안 3이 크게 불리하고, 기준 2·5·6·7(동작 보존 난이도·변경 범위·점진적 전환·롤백 가능성)에서도 안 3은 이번 사이클 범위(모달 8개)를 벗어난 파급을 만든다. 안 1은 기준 1(근본 원인 해결력)에서 패널 컨테이너 중복을 남겨 Success Criteria("패널 컨테이너 공통 스타일이 신설 컴포넌트로 추출")를 충족하지 못한다. 안 2가 근본 원인 해결력과 기존 코드 일관성을 모두 만족한다.

## ADR 본문

### Context

8개 모달 중 7곳이 닫기 X 버튼을 손으로 구현하며 4가지 변형으로 드리프트됐고, 이미 만든 `ModalCloseButton`은 실사용처가 0곳이다. 7/8 모달의 패널 컨테이너(`bg-white rounded-3xl border-2 border-primary overflow-hidden`)가 거의 동일하게 반복된다. `ContentWriteModal`은 자기 배럴(`./index`)을 다시 import해 순환 참조를 만든다(madge 확인, PR #84가 고친 `ModalContainer` 자기참조와 동일 클래스).

### Decision

`apps/web/src/components/ModalPanel.tsx`를 신설해 패널 컨테이너의 공통 부분(`bg-white border-2 border-primary rounded-3xl overflow-hidden flex flex-col`)을 캡슐화한다. 크기(`max-w-*`/`max-h-*`/`h-*`)·그림자·애니메이션처럼 모달마다 다른 부분은 `ModalShell`과 동일하게 `className` prop으로 그대로 넘긴다. 기존 `ModalCloseButton`을 7개 닫기 버튼에 전환한다(각 모달의 시각적 차이는 `className`/`iconClassName` prop으로 보존, 강제 통일하지 않음). `ContentWriteModal.tsx`의 `from './index'` import를 `./partials/CoverImgUploader` 등 개별 경로로 바꿔 순환 참조를 제거한다. 두 컴포넌트는 `ModalShell`/`ModalCloseButton`과 같은 계층(`components/` 최상위)에 둔다.

**전환 대상에서 명시적으로 제외**: `PostCardDetailModal` 데스크탑 패널(`rounded-2xl`/`shadow-2xl`/`max-w-5xl`)은 `design-system.md` §8 레시피 자체가 다른 의도된 예외로 판단해 `ModalPanel` 전환 후보에서 제외한다(직전 `modal-shell-duplication` 사이클이 `MobileNowPlaylistModal`/`PostCardDetailModal` 모바일을 `ModalShell` 적용에서 제외한 것과 같은 논리). `PlaylistDetailModal`과 `PostCardDetailModal` 데스크탑에는 닫기 버튼을 새로 추가하지 않는다 — 이는 구조 개선이 아니라 동작 추가이므로 Behavior Invariants·Out of Scope와 충돌한다.

### Alternatives

- **안 1(ModalCloseButton만)**: 기각. Success Criteria의 "패널 컨테이너 공통 스타일 추출"을 충족하지 못한다.
- **안 3(ui/ 폴더)**: 기각하되 완전히 버리지 않는다. 장기적으로는 `components/` 최상위 loose 파일들을 `ui/`로 정리하는 게 합리적일 수 있으나, PRD가 이번 사이클 범위를 "모달 8개"로 좁힌 결정과 정면으로 충돌하는 파급(31개+ 파일)을 만들어 이번엔 채택하지 않는다.

### Consequences

- **장점**: 닫기 버튼 마크업 4가지 변형이 1개 컴포넌트 호출로 수렴하고, 패널 컨테이너 반복도 사라진다. `ContentWriteModal`의 순환 참조가 제거돼 madge 검증 대상이 13건 → 12건이 된다.
- **단점**: `ModalPanel`이라는 새 추상화가 하나 더 생긴다 — `ModalShell`과 이름이 비슷해 혼동 여지가 있으므로 두 컴포넌트의 역할 차이(백드롭/판정 vs 패널 뼈대)를 컴포넌트 상단 주석 한 줄로 명시한다.
- **새로 생기는 위험**: `ModalCloseButton`을 만들어놓고도 안 썼던 전례가 있으므로, 이번에도 "컴포넌트만 만들고 전환은 안 함"으로 끝날 위험이 있다 — 이슈 분해에서 "신설"과 "전환"을 반드시 같은 사이클의 순차 이슈로 묶는다(아래 체크포인트 이슈 목록 참고).

### Migration

1. `ContentWriteModal.tsx`의 `from './index'` import를 개별 경로로 변경 (독립 작업, 다른 단계와 무관하게 먼저 처리 가능).
2. `apps/web/src/components/ModalPanel.tsx` 신설 + 계약 테스트. 아직 어떤 모달도 쓰지 않는 안전한 상태로 병합.
3. 7개 닫기 버튼을 `ModalCloseButton`으로 전환(`ContentWriteModal`, `LoginModal`, `UserListModal`, `PlaylistPickerModal`, `PrivacyConsentModal`, `MobileNowPlaylistModal`, `PostCardDetailModal` 모바일).
4. 6개 모달의 패널 컨테이너를 `ModalPanel`로 전환(`ContentWriteModal`, `LoginModal`, `PlaylistDetailModal`, `PlaylistPickerModal`, `UserListModal`, `PrivacyConsentModal`). `PostCardDetailModal` 데스크탑은 제외(위 Decision 참고).
5. 전환 완료 후 madge 재검증(모달 도메인 순환 참조 0건 확인) + 8개 모달 특성화 테스트 전부 재실행.

### Rollback

`ModalPanel`은 신규 파일이라 아직 아무도 쓰지 않는 단계(Migration 2)에서는 파일 삭제만으로 충분하다. 닫기 버튼/패널 전환(Migration 3~4)은 모달 파일 단위 커밋으로 나눠, 특정 모달에서 문제가 생기면 그 모달의 전환 커밋만 되돌리고 나머지는 유지할 수 있다. `ContentWriteModal` 순환 참조 수정(Migration 1)은 import 경로만 바꾸는 변경이라 되돌리기 쉽다.

## 회귀 안전망

### 테스트 우선순위

- **Characterization**: 8개 모달의 기존 특성화 테스트(48개, 직전 사이클 산출물)를 그대로 재사용한다 — 이번 변경은 마크업만 바꾸고 동작은 안 바꾸므로 새 특성화 테스트가 필요 없다.
- **Contract**: `ModalPanel`에 대한 신규 계약 테스트(children 렌더링, className 전달 여부)를 추가한다. `ModalCloseButton`은 이미 계약 테스트(`ModalCloseButton.test.tsx`)가 있으므로 재사용한다.
- **State-transition / Integration / E2E**: 이번 범위에서는 상태 전이나 여러 모듈이 합쳐지는 흐름을 바꾸지 않으므로 신규 추가 없음 — 기존 특성화 테스트가 이미 이 수준까지 커버한다.

### 회귀 시나리오

| 시나리오                                                                      | 기존 결과                                | 검증 수준         | 실패 시 조치                                                   |
| ----------------------------------------------------------------------------- | ---------------------------------------- | ----------------- | -------------------------------------------------------------- |
| 닫기 버튼 클릭                                                                | `onClose` 호출, 모달 닫힘                | 특성화(기존 유지) | 구현 중단                                                      |
| 배경 클릭(`closeOnBackdrop=true`, 6곳)                                        | 닫힘                                     | 특성화(기존 유지) | 구현 중단                                                      |
| 배경 클릭(`closeOnBackdrop=false`, `ContentWriteModal`/`PrivacyConsentModal`) | 안 닫힘                                  | 특성화(기존 유지) | 구현 중단                                                      |
| `PlaylistDetailModal`/`PostCardDetailModal` 데스크탑(닫기 버튼 없음)          | 배경 클릭으로만 닫힘, 새 버튼 추가 안 됨 | 코드 리뷰         | 동작 변경이므로 별도 feature 이슈로 분리, 이번 이슈에서 되돌림 |
| `ContentWriteModal` 순환 참조                                                 | `madge --circular` 결과 0건              | 계약(정적 도구)   | 구현 중단, import 경로 재검토                                  |

## 체크포인트 이슈 목록

### 이슈 1 — `ContentWriteModal` 자기참조 순환 참조 제거

**목적**: PR #84에서 고친 `ModalContainer` 자기참조와 동일 클래스의 버그(dev 모드 HMR 장애 위험)를 제거한다.

**Scope**: `apps/web/src/components/modals/ContentWriteModal/ContentWriteModal.tsx`의 import 문 1줄.

**Out of Scope**: 저장소의 다른 12개 순환 참조.

**Behavior Invariants**: `ContentWriteModal`의 기존 동작(제출/이미지 업로드/음악 검색) 전부 유지.

**Acceptance Criteria**:

- [ ] Given `ContentWriteModal.tsx`, When `madge --circular src`를 실행, Then `modals/ContentWriteModal/index.ts` 관련 순환 참조가 결과에 없다.
- [ ] Given 기존 `ContentWriteModal.test.tsx`, When 무수정으로 실행, Then 전부 통과한다.

**Verification**: `npx madge --circular --extensions ts,tsx --ts-config tsconfig.json src`, `pnpm test -- ContentWriteModal`, `pnpm lint`, `pnpm check-types`.

**Rollback**: import 문 1줄 되돌리기.

**Dependency**: 없음(독립).

---

### 이슈 2 — `ModalPanel` 컴포넌트 신설

**목적**: 7/8 모달에서 반복되는 패널 컨테이너 공통 마크업을 캡슐화할 안전한 기반을 만든다(아직 아무 모달도 쓰지 않는 상태).

**Scope**: `apps/web/src/components/ModalPanel.tsx`(신설) + `ModalPanel.test.tsx`(신설).

**Out of Scope**: 기존 모달을 이 컴포넌트로 전환하는 작업(이슈 4에서 진행).

**Behavior Invariants**: 없음(신규 미사용 컴포넌트).

**Acceptance Criteria**:

- [ ] `ModalPanel`이 `children`을 렌더링하고 `className`을 병합한다.
- [ ] 기본 클래스(`bg-white border-2 border-primary rounded-3xl overflow-hidden flex flex-col`)가 항상 포함된다.

**Verification**: `pnpm test -- ModalPanel`, `pnpm lint`, `pnpm check-types`.

**Rollback**: 파일 삭제.

**Dependency**: 없음(독립). 이슈 4의 선행 조건.

---

### 이슈 3 — 7개 닫기 버튼을 `ModalCloseButton`으로 전환

**목적**: 이미 만들어져 있지만 안 쓰이는 `ModalCloseButton`을 실제로 소비하게 해, 4가지 닫기 버튼 변형을 1개 컴포넌트 호출로 수렴시킨다.

**Scope**: `ContentWriteModal.tsx`, `LoginModal.tsx`, `UserListModal.tsx`, `PlaylistPickerModal.tsx`, `PrivacyConsentModal.tsx`, `MobileNowPlaylistModal.tsx`, `PostCardDetailModal.tsx`(모바일 바텀시트의 X 버튼만)의 닫기 버튼 JSX.

**Out of Scope**: 각 모달의 시각적 차이(아이콘 크기·hover 색상)를 강제로 통일하는 것 — `className`/`iconClassName` prop으로 기존 모습을 그대로 보존한다. `PlaylistDetailModal`/`PostCardDetailModal` 데스크탑에 새 닫기 버튼을 추가하는 것.

**Behavior Invariants**: 7곳 각각의 `onClick`(→ `closeModal`/`handleClose`) 동작과 기존 시각적 모습(아이콘 크기·hover 스타일)은 그대로 유지된다.

**Acceptance Criteria**:

- [ ] Given 각 모달이 열린 상태, When 닫기 버튼을 클릭, Then 기존과 동일하게 모달이 닫힌다(기존 특성화 테스트로 검증).
- [ ] Given 각 모달의 닫기 버튼, When 렌더링, Then 기존과 동일한 아이콘 크기/hover 스타일이 시각적으로 유지된다(className/iconClassName 전달 확인).
- [ ] 새 구조의 책임과 의존 방향이 adr.md의 결정과 일치한다.

**Verification**: `pnpm test -- ContentWriteModal LoginModal UserListModal PlaylistPickerModal PrivacyConsentModal MobileNowPlaylistModal PostCardDetailModal`, `pnpm lint`, `pnpm check-types`.

**Rollback**: 모달별 개별 커밋이므로 문제가 생긴 모달의 커밋만 되돌린다.

**Dependency**: 없음(이슈 2와 독립적으로 병행 가능).

---

### 이슈 4 — 6개 모달의 패널 컨테이너를 `ModalPanel`로 전환

**목적**: 패널 컨테이너 공통 마크업 반복을 제거한다.

**Scope**: `ContentWriteModal.tsx`, `LoginModal.tsx`, `PlaylistDetailModal.tsx`, `PlaylistPickerModal.tsx`, `UserListModal.tsx`, `PrivacyConsentModal.tsx`의 최상위 패널 `div`.

**Out of Scope**: `PostCardDetailModal` 데스크탑 패널(디자인 레시피 자체가 다른 의도된 예외).

**Behavior Invariants**: 각 모달의 크기(`max-w-*`/`max-h-*`)·그림자·애니메이션은 `className`으로 그대로 보존된다.

**Acceptance Criteria**:

- [ ] Given 각 모달, When 렌더링, Then 기존과 동일한 시각적 크기/그림자/애니메이션이 유지된다.
- [ ] Given 기존 특성화 테스트, When 무수정 또는 최소 쿼리 조정으로 실행, Then 전부 통과한다(쿼리 조정이 필요하면 왜 그런지 커밋 메시지에 기록).
- [ ] 새 구조의 책임과 의존 방향이 adr.md의 결정과 일치한다.

**Verification**: `pnpm test -- ContentWriteModal LoginModal PlaylistDetailModal PlaylistPickerModal UserListModal PrivacyConsentModal`, `pnpm lint`, `pnpm check-types`, `pnpm build`.

**Rollback**: 모달별 개별 커밋이므로 문제가 생긴 모달의 커밋만 되돌린다.

**Dependency**: 이슈 2(`ModalPanel` 신설) 완료 후 진행.

---

### 이슈 5 — 최종 검증과 result.md

**목적**: 전체 전환 결과를 확인하고 사이클을 종료한다.

**Scope**: `docs/refactors/modal-composition-structure/result.md` 작성. 코드 변경 없음(검증만).

**Out of Scope**: 새 구조/코드 변경.

**Behavior Invariants**: prd.md의 Behavior Invariants 전체.

**Acceptance Criteria**:

- [ ] `madge --circular` 재실행 결과 모달 도메인 순환 참조 0건.
- [ ] `ModalCloseButton`/`ModalPanel` 실사용처가 계획한 수만큼 증가했는지 확인.
- [ ] 8개 모달 특성화 테스트 전부 통과.
- [ ] `pnpm dto`(해당 없음, DTO 변경 없음)/`pnpm dev`로 개발 환경에서 실제 동작 확인.

**Verification**: `pnpm lint`/`check-types`/`test`/`build` 전부 + `pnpm dev` 실동작 확인.

**Rollback**: 해당 없음(검증 단계).

**Dependency**: 이슈 1~4 전부 완료 후.

---

**[GATE 2]** 위 3안 비교, 의사결정 인터뷰 로그, Decision, 회귀 안전망, 5개 체크포인트 이슈를 확인해주시면 GitHub 이슈를 생성하고 구현으로 넘어가겠습니다.
