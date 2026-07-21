---
name: test-scenarios
description: Turns a single feature-planner GitHub issue into a locked-down function/component signature plus a normal/boundary/exception test scenario list, fully cross-checked against the issue's Acceptance Criteria — the last step before TDD implementation starts (no test code, no implementation code is written). Invoke only via the explicit /test-scenarios <issue-number> slash command. Requires the target issue to carry a "📄 관련 기획 문서: docs/features/{name}/prd.md" marker in its body (feature-planner adds this automatically); issues from refactoring-planner or issues without the marker are out of scope.
---

# Test Scenarios

feature-planner가 만든 GitHub 이슈 하나를 "시그니처 확정 → 테스트 시나리오 도출"까지 처리하는 스킬입니다. 근거 문서는 `docs/features/feature-planning-workflow.md`의 "단계 4"이며, 이 스킬은 그 내용을 실행 가능한 절차로 옮긴 것입니다.

```
issues.md + GitHub Issues (feature-planner 단계 3 산출물)
    ↓ 단계 4 — 시그니처 확정 + 테스트 시나리오 도출
issue-{N}.md (시그니처 + AC별 시나리오)
    ↓ (별도 워크플로우) TDD 구현
```

AC(Acceptance Criteria)는 "무엇이 되어야 하는가"만 말하고 "어떤 함수를, 어떤 타입으로" 만들지는 정하지 않습니다. 시그니처를 먼저 고정해야 TDD의 Red 단계에서 무엇에 대해 테스트를 쓸지가 명확해지므로, 구현 코드를 쓰기 직전에 이 스킬이 끼어듭니다. **이 스킬은 시그니처와 시나리오만 만들고, 테스트 코드나 구현 코드는 절대 작성하지 않습니다** — 그건 이후 TDD 사이클의 몫입니다.

## 사용법

```
/test-scenarios <issue-number>
```

인자는 GitHub 이슈 번호 하나뿐입니다. feature 이름(`docs/features/{name}/`)은 스킬이 이슈 본문에서 자동으로 알아냅니다.

## 시작하기 전에

이 스킬은 **feature-planner가 만든 이슈 전용**입니다. `refactoring-planner`가 만든 이슈(`docs/refactors/{name}/`)나 그 외 임의의 이슈는 범위 밖입니다 — 다루는 대상이 다르기 때문입니다: refactoring-planner 이슈는 이미 `adr.md`로 동작 보존 계획과 회귀 안전망을 갖고 있지만, feature-planner 이슈는 이제 막 "무엇을 만들지"만 정해진 상태라 시그니처가 비어 있습니다.

1. `gh issue view <issue-number> --json title,body,labels`로 이슈를 읽으세요.
2. 본문에서 `📄 관련 기획 문서: docs/features/{name}/prd.md` 마커를 찾아 `{name}`을 추출하세요.
   - **마커가 없거나 정규식으로 `{name}`을 뽑을 수 없으면, 추측하지 말고 멈추세요.** 어느 feature 소속인지 이슈 번호만으로 기계적으로 알 방법이 없는 상태이므로, 사용자에게 feature 이름을 직접 물어보세요(예: "이 이슈가 어느 `docs/features/{name}/`에 속하나요?"). 잘못 추측하면 엉뚱한 PRD를 근거로 시그니처를 만들게 됩니다.
   - 마커에서 `{name}`을 확인했다면 `docs/features/{name}/prd.md`가 실제로 존재하는지 확인하세요. 없으면 멈추고 알리세요 — 마커는 있지만 문서가 아직 없다면(예: 수동으로 이슈를 만든 경우) PRD 없이 시그니처를 지어내는 것보다 사용자에게 알리는 편이 안전합니다.

## 실행 순서

### 1. 시그니처 확정

이슈 본문 + `docs/features/{name}/prd.md` + 코드베이스를 함께 읽고 시그니처를 확정하세요.

- 함수 시그니처(이름, 파라미터 타입, 반환 타입)
- 에러 케이스(어떤 상황에서 무엇을 던지는지)
- 컴포넌트 Props 타입 정의(해당하는 경우)
- **구현 코드는 절대 작성하지 않습니다** — 시그니처/타입 선언까지만입니다.

**반드시 이 저장소의 실제 기존 패턴을 따르세요.** 일반적인 REST 클라이언트나 Context API 같은 범용 예시를 임의로 가정하지 말고, 저장소 루트 `CLAUDE.md`(특히 "프론트엔드 구현 패턴", "컨벤션" 섹션)와 같은 도메인의 기존 코드를 실제로 읽고 그대로 따르세요. 이 저장소에서 특히 자주 맞닥뜨릴 패턴:

- **API 함수** (`apps/web/src/api/internal/{domain}.ts`): `internalClient`를 감싼 함수. 이름은 `get/create/update/delete/add/remove` + 도메인 명사(`getFeedPosts`, `createPost` 등). 요청/응답 타입은 항상 `@repo/dto`에서 import — 새 타입이 필요하면 `apps/web`이나 `apps/api`에 중복 정의하지 말고 `packages/dto`에 추가해야 한다고 명시하세요.
- **상태 동기화**: 여러 컴포넌트가 공유해야 하는 전역 UI/인증 상태나 서버 데이터 오버라이드라면 `apps/web/src/stores/use{Domain}Store.ts` Zustand 스토어(State/Actions 인터페이스 분리 후 교집합 타입, `persist`/`devtools` 미들웨어 미사용) 패턴을 검토하세요. 폼 입력 같은 컴포넌트 로컬 상태까지 스토어로 끌어올리지 마세요.
- **데이터 페칭 훅**: 로딩/에러 상태 관리나 여러 컴포넌트 재사용이 필요하면 `apps/web/src/hooks/{domain}/use{Domain}{Action}.ts` 커스텀 훅으로 감쌀지 검토하세요(강제 규칙은 아님 — 단순 액션 호출은 컴포넌트가 `api/internal` 함수를 직접 부르는 경우도 많습니다).
- **컴포넌트 Props**: 최상위 export 컴포넌트는 `interface {ComponentName}Props`, 내부 보조 컴포넌트는 `type Props = {...}` 경향(강제는 아님 — 같은 폴더의 기존 코드를 우선하세요).
- **`apps/api`를 다루는 이슈**라면 `*.controller.ts → *.service.ts → *.repository.ts → entities/*.entity.ts` 구조를 따르고, DTO는 `packages/dto`에서만 정의하세요.

시그니처를 다 정했으면 왜 그 타입/구조를 골랐는지(어떤 기존 파일의 어떤 패턴을 따랐는지) 한두 문장으로 근거를 남기세요 — 나중에 검토할 때 "왜 이렇게 정했는지" 다시 코드를 뒤지지 않아도 되게 하기 위함입니다.

```
[GATE] 사용자가 시그니처를 검토/승인할 때까지 대기
```

### 2. 시그니처 기록

승인된 시그니처를 `docs/features/{name}/issue-{N}.md` 상단에 기록하세요. 파일이 없으면 새로 만드세요.

### 3. 테스트 시나리오 도출

승인된 시그니처를 기준으로 시나리오를 뽑으세요.

- 정상/경계/예외 세 갈래로 분류
- 형식: `[정상/경계/예외] 함수명 — should [기대동작] when [조건]`
- **테스트 코드는 작성하지 않습니다** — 시나리오 문장까지만입니다.

### 4. 시나리오 기록

도출된 시나리오를 `docs/features/{name}/issue-{N}.md` 하단에 추가하세요.

### 5. AC ↔ 시나리오 대조

`gh issue view <issue-number>`로 Acceptance Criteria 목록을 다시 읽고, 각 AC 항목이 시나리오로 최소 1개 이상 커버되는지 확인하세요.

- 커버되지 않은 AC가 있으면 그 자리에서 시나리오를 보강하세요. 이걸 건너뛰면 나중에 시나리오 기반 테스트를 전부 통과했는데도 AC 하나가 조용히 빠지는 사고가 납니다.
- AC ↔ 시나리오 매핑 표를 `issue-{N}.md`에 남기세요(AC 항목별로 어떤 시나리오가 커버하는지 한눈에 보이게).

### 6. 최종 승인

시나리오와 AC 커버리지 표를 사용자에게 보여주고 검토/승인을 받으세요.

```
[GATE] 승인 전까지 다음 단계(TDD 구현)로 진행하지 마세요
```

## issue-{N}.md 형식

```markdown
# Issue #{N} — {이슈 제목}

## 시그니처

(함수/컴포넌트별로 이름, 파라미터, 반환 타입, 에러 케이스, Props 타입 — 선택한 근거 한두 문장 포함)

## 테스트 시나리오

- [정상] {함수명} — should {기대동작} when {조건}
- [경계] {함수명} — should {기대동작} when {조건}
- [예외] {함수명} — should {기대동작} when {조건}

## AC ↔ 시나리오 커버리지

| AC                 | 커버하는 시나리오      |
| ------------------ | ---------------------- |
| Given ... Then ... | [정상] ..., [예외] ... |
```

## 다른 스킬과의 관계

- **feature-planner**의 단계 3(이슈 분해) 바로 다음, TDD 구현 이전 단계입니다. feature-planner가 만든 이슈가 아니면 대상이 아닙니다.
- **refactoring-planner**의 이슈는 대상이 아닙니다 — 그쪽은 `adr.md`로 이미 동작 보존 계획과 회귀 시나리오를 갖고 있어서, 이 스킬이 처리하려는 "새 기능의 시그니처가 아직 없는" 문제 자체가 없습니다.
- 근거 문서(`docs/features/feature-planning-workflow.md`)는 feature-planner와 공유합니다 — 이 스킬만의 별도 workflow 문서를 만들지 않은 이유는, 이 단계가 feature 기획 파이프라인의 자연스러운 연장선(단계 4)이기 때문입니다. 별도 슬래시 커맨드로 분리한 이유는 실행 시점이 다르기 때문입니다(단계 1~3은 기획 시점에 몰아서, 단계 4는 이슈를 실제로 구현하려는 시점에 이슈 단위로).
