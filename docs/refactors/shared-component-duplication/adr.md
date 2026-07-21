# ADR — shared-component-duplication

## 3안 비교

PRD 목표 인터뷰에서 새 라이브러리 도입을 불허(자체 구현만)로 확정했으므로, 워크플로우의 "③ 검증된 도구 도입안"은 "`ModalCloseButton`을 얼마나 흡수할 것인가"를 축으로 하는 자체 구현 대안으로 대체한다.

### 안 1 — 최소 개선안: `Button` 신설, 전환은 점진적/자발적

`Button` 컴포넌트만 신설하고 `ui/` 폴더 이동은 하되, 기존 58개 파일의 전환은 강제하지 않고 새 코드에서부터 자발적으로 채택되게 둔다. `ModalCloseButton` 등 기존 특화 컴포넌트는 손대지 않는다.

### 안 2 — 경계 재설계안: `Button` 신설 + `ui/` 이동 + 도메인별 점진적 전환 (권장)

`Button`을 신설하고 `apps/web/src/components/ui/`로 12개 기존 컴포넌트와 함께 배치한다(배럴 없이 개별 경로 import). 58개 `<button>` 파일을 도메인별로 묶어 순차 전환한다. `ModalCloseButton`은 건드리지 않고 별개로 유지한다(`ui/`로 이동만).

### 안 3 — 자체 구현 대안: 안 2 + `ModalCloseButton`을 `Button` icon variant로 완전 흡수

안 2와 동일하되, `ModalCloseButton`을 삭제하고 7곳을 `<Button variant="secondary" size="icon">`으로 재전환한다.

---

## 비교표 (10개 고정 기준)

| #   | 기준                 | 안 1(최소 개선)                                                       | 안 2(도메인별 점진 전환, 권장)                                                             | 안 3(ModalCloseButton 흡수)                                                                     |
| --- | -------------------- | --------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------- |
| 1   | 근본 원인 해결력     | 낮음 — 전환이 강제되지 않아 10가지+ className 변형이 그대로 남을 위험 | 높음 — 58개 파일을 실제로 전환                                                             | 높음(안 2와 동일) + 아이콘 버튼까지 통일                                                        |
| 2   | 동작 보존 난이도     | 쉬움 — 거의 아무것도 안 바꿈                                          | 중간 — 파일마다 className을 Button prop으로 옮기는 기계적 작업, 다만 58곳이라 총량이 큼    | 중간~어려움 — 안 2 작업 + 이미 검증된 `ModalCloseButton` 7곳을 다시 건드림                      |
| 3   | 책임·의존성 변화     | 거의 없음                                                             | `Button`이 스타일 조합 로직을 소유, 각 소비처는 variant/size만 선택                        | 안 2와 동일 + `ModalCloseButton`의 "닫기 버튼 특화" 책임이 사라짐                               |
| 4   | 테스트 용이성        | 낮음 — 전환 안 된 곳은 여전히 개별 검증 필요                          | 높음 — `Button` 계약 테스트 하나로 스타일 조합 검증, 각 소비처는 기존 테스트로 동작만 확인 | 높음(안 2와 동일)                                                                               |
| 5   | 변경 범위            | 작음(신규 파일 1~2개)                                                 | 큼(58개 파일 + 신규 컴포넌트 + 12개 이동)                                                  | 큼 + `ModalCloseButton` 7곳 추가 재작업                                                         |
| 6   | 점진적 전환 가능성   | 매우 좋음(강제 없음)                                                  | 좋음 — 도메인별로 나눠 순차 진행 가능                                                      | 좋음(안 2와 동일)                                                                               |
| 7   | 롤백 가능성          | 매우 쉬움                                                             | 쉬움 — 도메인별/파일별 커밋                                                                | 쉬움하지만 `ModalCloseButton` 재전환분은 직전 사이클 결과물을 되돌리는 추가 판단이 필요         |
| 8   | 성능·운영 영향       | 없음                                                                  | 없음                                                                                       | 없음                                                                                            |
| 9   | 기존 코드와의 일관성 | 낮음 — 전환이 강제 안 되어 지금의 불일치가 무기한 유지될 수 있음      | 높음                                                                                       | 높음(안 2와 동일)                                                                               |
| 10  | 유지 비용            | 높음 — 다음에도 같은 문제가 반복될 위험                               | 낮음                                                                                       | 낮음 + `ModalCloseButton` 유지 비용 자체는 사라지지만, 이미 끝난 작업을 다시 만진 매몰비용 발생 |

## 라이브러리 도입 심사

해당 없음 — 3안 모두 자체 구현이며, PRD 목표 인터뷰에서 이미 라이브러리 도입을 불허하기로 확정했다.

## 의사결정 인터뷰 로그

**Q. 새 Button과 이미 있는 ModalCloseButton(7곳에 적용된 아이콘 전용 버튼)의 관계를 어떻게 할까요?**

A. 별개로 유지, 통합 안 함. 이유: `ModalCloseButton`은 바로 지난 사이클(#87~#92)에서 7곳에 이미 안전하게 전환해놓은 것이다. 이것을 `Button`으로 다시 전환하면 검증된 작업을 재작업하는 비용만 생기고, 이번 PRD의 Success Criteria(58개 `<button>` 파일 전환률)에도 필수가 아니다.

_(참고: 라이브러리 도입 여부·시각적 통일 강제 여부·`ui/` 배럴 여부는 PRD 단계 목표 인터뷰에서 이미 결정됐다 — ADR 단계에서 다시 묻지 않았다.)_

## 선택: 안 2 (`Button` 신설 + `ui/` 이동 + 도메인별 점진적 전환)

기준 1·9·10(근본 원인 해결력·기존 코드와의 일관성·유지 비용)에서 안 1이 크게 불리하다 — 강제 없는 전환은 PRD가 진단한 문제(10가지+ className 변형)를 그대로 남긴다. 안 3은 안 2 대비 기준 2·5·7에서 불리하다 — 이미 검증된 `ModalCloseButton` 전환을 다시 건드리는 추가 위험·비용이 이번 사이클의 목표(버튼 스타일 반복 해소)에 필수가 아니다. 안 2가 근본 원인 해결력과 위험 관리를 모두 만족한다.

## ADR 본문

### Context

58개 파일이 버튼을 각자 인라인 className으로 구현하며 최소 10가지 이상의 Primary 계열 변형이 존재한다(`docs/design-system.md` §8이 이미 지적한 기술부채). 동시에 `components/` 최상위에 도메인 없는 공용 컴포넌트 12개가 loose 파일로 흩어져 있고, 이 둘의 소비 파일이 71% 겹친다(`modal-composition-structure` PRD/ADR에서 `ui/` 폴더 신설을 기각했던 이유인 "파급 범위"가 이번엔 Button 작업과 자연스럽게 겹친다).

### Decision

`apps/web/src/components/ui/Button.tsx`를 신설한다. props는 `variant`(`primary`/`secondary`/`danger`) · `size`(`sm`/`md`/`icon`) · `className`(전달 시 병합, 강제 아님) · 표준 `<button>` HTML 속성(`onClick`, `disabled`, `type`, `aria-*` 등). 내부적으로 variant/size별 기본 className을 일반 객체 매핑(`{ primary: '...', secondary: '...', danger: '...' }[variant]`)으로 정의하고 `className` prop과 병합한다 — `class-variance-authority` 등 라이브러리는 쓰지 않는다.

기존 loose 공용 컴포넌트 12개(`ModalShell`, `ModalCloseButton`, `ModalPanel`, `LoadingSpinner`, `ConfirmOverlay`, `ErrorScreen`, `TickerText`, `LoginRequestScreen`, `PwaInstallBanner`, `PwaRegister`, `ToastContainer`, `ConfirmToast`)와 신규 `Button`을 전부 `apps/web/src/components/ui/`로 옮긴다. **`ui/index.ts` 배럴은 만들지 않는다** — 모든 소비처는 `@/components/ui/Button`처럼 개별 경로로 import한다.

58개 `<button>` 파일은 도메인별로 묶어 순차 전환한다: `modals`(22개, 2개 배치로 분할) → `player`(6개) → `post`/`profile`/`search`(12개) → `layout`/`sidebar`/`noti`/`archive`/`playlist`/기타 loose(16개, `ui/`로 이동한 컴포넌트 자체 내부 버튼 포함).

`ModalCloseButton`은 `Button`과 통합하지 않고 별개로 유지한다(이동만 진행).

### Alternatives

- **안 1(최소 개선)**: 기각. 전환이 강제되지 않아 PRD가 진단한 근본 원인(10가지+ 변형)이 해소되지 않고, Success Criteria(전환률)를 충족하지 못한다.
- **안 3(ModalCloseButton 흡수)**: 기각하되 완전히 버리지 않는다. 나중에 `Button`의 icon variant가 충분히 안정화되면, 별도 사이클에서 `ModalCloseButton`을 그 위에 재구현하는 것을 재검토할 수 있다 — 지금은 이미 검증된 작업을 재작업할 근거가 부족하다.

### Consequences

- **장점**: 새 버튼을 만들 때 `variant`/`size`만 고르면 되고, `ui/` 폴더로 "공용 UI가 어디 있는지"가 명확해진다. 12개 컴포넌트 + `Button`을 한 곳에서 찾을 수 있다.
- **단점**: `Button`이 `className` passthrough를 허용하므로(PRD 결정), 전환 후에도 시각적 변형(10가지+)이 prop 형태로 이름만 바뀐 채 남을 수 있다 — 진짜 시각적 통일은 이번 사이클의 목표가 아니다(Out of Scope, Remaining Debt로 명시적으로 남김).
- **새로 생기는 위험**: 58개 파일 전환은 총량이 커서, 도메인별 배치 중 일부가 예상보다 커지면(특히 `modals` 22개) 이슈를 더 잘게 쪼개야 할 수 있다 — 이슈 분해 단계에서 유연하게 대응한다(직전 사이클의 "위험도 낮은 것부터" 원칙과 동일).

### Migration

1. `apps/web/src/components/ui/Button.tsx` 신설 + 계약 테스트. 아직 어떤 파일도 쓰지 않는 안전한 상태로 병합.
2. `apps/web/src/components/ui/` 폴더로 기존 12개 컴포넌트 이동, 참조하는 31개 파일의 import 경로 갱신(순수 이동, 동작 변경 없음).
3. `modals` 도메인 22개 파일을 2개 배치로 나눠 `Button` 전환.
4. `player` 도메인 6개 파일 전환.
5. `post`/`profile`/`search` 도메인 12개 파일 전환.
6. `layout`/`sidebar`/`noti`/`archive`/`playlist`/기타(`ui/`로 이동한 컴포넌트 자체 내부 버튼 포함) 16개 파일 전환.
7. 최종 검증 + `result.md`.

### Rollback

`Button`은 신규 파일이라 아직 아무도 쓰지 않는 단계(Migration 1)에서는 파일 삭제만으로 충분하다. `ui/` 폴더 이동(Migration 2)은 기계적 경로 변경이라 파일 단위로 되돌리기 쉽다. 도메인별 전환(Migration 3~6)은 도메인/파일 단위 커밋으로 나눠, 특정 파일에서 시각적 회귀가 발견되면 그 커밋만 되돌리고 나머지는 유지한다.

## 회귀 안전망

### 테스트 우선순위

- **Characterization**: `ui/`로 이동하는 12개 컴포넌트 중 기존 테스트가 있는 것(`ModalShell`, `ModalCloseButton`, `ModalPanel`)은 경로만 갱신해 그대로 재사용한다. 나머지 9개는 이번 사이클에서 새로 테스트를 추가하지 않는다(순수 이동이라 동작 변경이 없고, 각 소비처의 기존 테스트가 이미 통합적으로 커버한다).
- **Contract**: 신규 `Button`에 계약 테스트를 추가한다(variant/size별 className 존재 확인, onClick/disabled 등 표준 속성 전달 확인).
- **State-transition / Integration / E2E**: 이번 범위에서는 상태 전이나 여러 모듈이 합쳐지는 흐름을 바꾸지 않으므로 신규 추가 없음.

### 회귀 시나리오

| 시나리오                               | 기존 결과                          | 검증 수준                                                                     | 실패 시 조치                                |
| -------------------------------------- | ---------------------------------- | ----------------------------------------------------------------------------- | ------------------------------------------- |
| 버튼 클릭(각 파일의 기존 핸들러)       | 기존과 동일한 동작 호출            | 각 파일의 기존 특성화/단위 테스트(무수정)                                     | 구현 중단                                   |
| disabled 상태가 있던 버튼              | disabled 시 클릭 무시              | 기존 테스트                                                                   | 구현 중단                                   |
| `ui/` 이동 컴포넌트(모달 열림/닫힘 등) | 기존과 동일                        | `ModalShell`/`ModalCloseButton`/`ModalPanel` 테스트(경로만 갱신, 무수정 통과) | 구현 중단                                   |
| 버튼 시각적 모습                       | 전환 전후 동일(className으로 보존) | 코드 리뷰 + `pnpm dev` 육안 확인(#27 Playwright 스모크 테스트 활용 가능)      | 시각적 차이 발견 시 해당 파일 커밋만 되돌림 |

## 체크포인트 이슈 목록

### 이슈 1 — `Button` 컴포넌트 신설 + 계약 테스트

**목적**: variant/size 조합으로 버튼 스타일을 표준화할 안전한 기반을 만든다(아직 아무 파일도 쓰지 않는 상태).

**Scope**: `apps/web/src/components/ui/Button.tsx`(신설) + `Button.test.tsx`(신설).

**Out of Scope**: 기존 파일을 이 컴포넌트로 전환하는 작업(이슈 3~6에서 진행).

**Acceptance Criteria**:

- [ ] `variant`(primary/secondary/danger) × `size`(sm/md/icon) 조합별로 올바른 기본 className이 적용된다.
- [ ] 전달받은 `className`이 기본 클래스와 병합된다.
- [ ] `onClick`/`disabled`/`type`/`aria-*` 등 표준 `<button>` 속성이 그대로 전달된다.

**Verification**: `pnpm test -- Button`, `pnpm lint`, `pnpm check-types`.

**Rollback**: 파일 삭제.

**Dependency**: 없음(독립). 이슈 3~6의 선행 조건.

---

### 이슈 2 — `apps/web/src/components/ui/` 폴더 신설 + 기존 12개 컴포넌트 이동

**목적**: 도메인 없는 공용 컴포넌트를 한 곳에 모은다.

**Scope**: `ModalShell`, `ModalCloseButton`, `ModalPanel`, `LoadingSpinner`, `ConfirmOverlay`, `ErrorScreen`, `TickerText`, `LoginRequestScreen`, `PwaInstallBanner`, `PwaRegister`, `ToastContainer`, `ConfirmToast`를 `apps/web/src/components/ui/`로 이동. 참조하는 31개 파일의 import 경로 갱신.

**Out of Scope**: `ui/index.ts` 배럴 생성(만들지 않기로 확정). 컴포넌트 내부 로직 변경.

**Behavior Invariants**: 12개 컴포넌트의 기존 동작은 전부 유지된다(순수 파일 이동).

**Acceptance Criteria**:

- [ ] 12개 컴포넌트가 `components/ui/` 아래로 이동한다.
- [ ] 31개 소비 파일의 import 경로가 `@/components/ui/{Component}`로 갱신된다.
- [ ] 기존 `ModalShell`/`ModalCloseButton`/`ModalPanel` 테스트가 경로만 갱신되어 무수정 통과한다.
- [ ] `madge --circular` 재검증 시 새 순환 참조가 생기지 않는다(배럴이 없으므로 자기참조 위험 자체가 구조적으로 낮음).

**Verification**: `pnpm test`, `pnpm lint`, `pnpm check-types`, `pnpm build`, `npx madge --circular`.

**Rollback**: 파일 이동을 되돌리는 단일 커밋 revert.

**Dependency**: 없음(독립). 이슈 3~6은 이 이슈 완료 후 새 경로를 기준으로 진행.

---

### 이슈 3 — `modals` 도메인 버튼을 `Button`으로 전환 (1/2)

**목적**: 가장 파일 수가 많은 도메인부터 절반을 전환한다.

**Scope**: `modals` 도메인 22개 파일 중 절반(구체적 파일 목록은 구현 착수 시 실제 버튼 종류·위험도로 확정 — 폼 제출류 모달을 먼저, 목록/재생류 모달을 이슈 4로).

**Out of Scope**: 버튼의 시각적 모습을 실제로 통일하는 것(className으로 기존 모습 보존).

**Acceptance Criteria**:

- [ ] 각 파일의 기존 버튼이 `Button` 컴포넌트 호출로 대체된다.
- [ ] 전환 전후 시각적 모습이 동일하다(className prop으로 보존).
- [ ] 해당 파일들의 기존 테스트가 무수정 통과한다.

**Verification**: 전환 대상 파일의 기존 테스트, `pnpm lint`, `pnpm check-types`.

**Rollback**: 파일별 개별 커밋.

**Dependency**: 이슈 1(Button 신설), 이슈 2(ui/ 이동) 완료 후.

---

### 이슈 4 — `modals` 도메인 버튼을 `Button`으로 전환 (2/2)

**목적**: `modals` 도메인 나머지 절반을 전환한다.

**Scope/AC/Verification/Rollback**: 이슈 3과 동일한 기준, 대상 파일만 나머지 절반.

**Dependency**: 이슈 1, 2. 이슈 3과는 독립적으로 병행 가능.

---

### 이슈 5 — `player`/`post`/`profile`/`search` 도메인 버튼을 `Button`으로 전환

**목적**: 재생/게시글/검색 관련 도메인 18개 파일(`player` 6 + `post`/`profile`/`search` 12)을 전환한다.

**Scope/AC/Verification/Rollback**: 이슈 3과 동일한 기준.

**Dependency**: 이슈 1, 2. 이슈 3·4와 독립적으로 병행 가능.

---

### 이슈 6 — `layout`/`sidebar`/`noti`/`archive`/`playlist`/기타 도메인 버튼을 `Button`으로 전환

**목적**: 나머지 16개 파일(이동한 `ui/` 컴포넌트 자체 내부 버튼 포함, 예: `ConfirmOverlay`의 확인/취소 버튼)을 전환한다.

**Scope/AC/Verification/Rollback**: 이슈 3과 동일한 기준.

**Dependency**: 이슈 1, 2. 다른 전환 이슈와 독립적으로 병행 가능.

---

### 이슈 7 — 최종 검증과 result.md

**목적**: 전체 전환 결과를 확인하고 사이클을 종료한다.

**Scope**: `docs/refactors/shared-component-duplication/result.md` 작성. 코드 변경 없음(검증만).

**Acceptance Criteria**:

- [ ] 58개 파일 중 실제 전환된 비율 집계.
- [ ] `ui/` 이동 대상 12개 컴포넌트가 새 경로에서 정상 동작.
- [ ] 기존 테스트 전부 통과.
- [ ] `pnpm dev`(또는 `run`/Playwright)로 개발 환경에서 실제 버튼 렌더링 확인.

**Verification**: `pnpm lint`/`check-types`/`test`/`build` 전부 + 개발환경 실동작 확인.

**Dependency**: 이슈 1~6 전부 완료 후.

---

**[GATE 2]** 위 3안 비교, 의사결정 인터뷰 로그, Decision, 회귀 안전망, 7개 체크포인트 이슈를 확인해주시면 GitHub 이슈를 생성하고 구현으로 넘어가겠습니다.
