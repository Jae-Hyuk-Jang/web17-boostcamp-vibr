# PRD — shared-component-duplication

## 문제 정의

`apps/web/src/components/` 전반에서 공유 `Button` 컴포넌트가 없어 버튼 스타일이 파일마다 인라인으로 반복되고(`docs/design-system.md` §8에 이미 기술부채로 명시됨), 도메인 없는 공용 컴포넌트 12개(`ModalShell`, `ModalCloseButton`, `ModalPanel`, `LoadingSpinner`, `ConfirmOverlay`, `ErrorScreen`, `TickerText`, `LoginRequestScreen`, `PwaInstallBanner`, `PwaRegister`, `ToastContainer`, `ConfirmToast`)가 `components/` 최상위에 loose 파일로 흩어져 있다(이슈 #99, `modal-composition-structure` ADR에서 안 3으로 검토했으나 파급이 너무 커서 기각).

## 비판적 진단 (시니어 개발자 시각)

### 근거

**Fact**

- `docs/design-system.md` §8이 예로 든 정확한 버튼 레시피(`enabled:hover:shadow-[2px_2px_0px_0px_#00ebc7]` + `disabled:opacity-50 disabled:cursor-not-allowed` 조합)를 그대로 따르는 파일은 저장소 전체에서 `player/QueueList.tsx` **1곳뿐**이다.
- `bg-primary text-white`(Primary 계열)를 쓰는 버튼만 추려도 서로 다른 className 조합이 **최소 10가지** 발견됐다 — radius(`rounded-lg`/`rounded-full`/`rounded-xl`), hover 동작(`hover:bg-secondary`/`hover:bg-accent-pink`/`hover:scale-105`/`hover:border-black`)이 전부 제각각이다.
- 저장소 전체에서 `<button>` 태그를 포함한 파일은 **58개**(테스트 제외).
- `ui/` 이동 대상 12개 컴포넌트의 실제 소비 파일은 정확히 **31개**(`grep`으로 직접 확인, PR #84/ADR의 추정치와 일치).
- 두 작업의 파일 교집합: `ui/` 소비 31개 파일 중 **22개(71%)**가 `<button>` 태그도 포함한다.
- `packages/ui/src/index.tsx`는 빈 파일이고, `@repo/ui`를 import하는 곳은 저장소 전체에 **0곳**이다. 이 모노레포엔 프론트엔드 앱이 `apps/web` 하나뿐이다.
- 직전 두 사이클(`ModalContainer`, `ContentWriteModal`)에서 "도메인 배럴이 자기 자신을 재import"하는 동일 패턴으로 순환 참조가 두 번 발생했다(PR #84, #94). `modals/index.ts`(도메인 최상위 배럴)의 실사용처는 0곳이었다.
- 기준선 검증(`pnpm lint`/`check-types`/`test`/`build`) 전부 PASS.

**Inference**

- 버튼 className 변형이 10가지 이상 존재하는 근본 원인은 "같은 의도(Primary 액션)를 표현할 표준 수단이 없어, 매번 radius/hover/padding을 새로 판단해야 했기 때문"으로 보인다.
- `ui/` 폴더 이동과 Button 도입을 같은 사이클에서 다루면, 71% 겹치는 31개 파일을 두 번 건드리지 않아도 된다.

**Hypothesis**

- (검증 안 됨) Button을 도입하면 새 버튼 작성 속도가 빨라질 것이다 — 이번 사이클의 Success Criteria로 간접 검증한다(전환률·테스트 통과 여부).

### 증상 → 원인 체인

```
증상: 새 버튼을 만들 때마다 radius/hover/padding 조합을 새로 판단해야 하고,
      그 결과 Primary 계열만 봐도 10가지 이상의 className 변형이 쌓였다.
  ↓ 왜?
직접 원인: 공유 Button 컴포넌트가 없어 각 파일이 Tailwind 클래스를 매번
           인라인으로 새로 조합한다.
  ↓ 왜?
구조 원인: design-system.md §8이 "레시피"를 문서로만 제시했을 뿐, 실행 가능한
           컴포넌트로 만들어 강제하는 장치가 없었다.
```

### 아키텍처 관점

- 이 문제는 모달에 국한되지 않는다 — 피드/프로필/플레이어 등 전 도메인에 걸쳐 반복된다(58개 파일).
- `packages/ui`는 "다른 앱과 공유"라는 원래 목적에 맞는 소비처가 하나도 없다 — 지금 이 패키지에 Button을 두는 것은 실제 필요가 아니라 관성적 배치가 된다.
- `ui/` 폴더에 배럴을 만드는 것은 `docs/conventions.md` §3.1(도메인 폴더는 배럴 필수)과 형식상 일치하지만, 이 저장소의 실제 확립된 패턴(PR #84 이후 개별 경로 import, 두 번의 자기참조 순환 참조 전례)과는 충돌한다.

### 비판적 재검토 (사용자 문제 제기에 대한 반박과 답)

- **정말 구조 문제인가, 우연인가?** → 구조 문제다. 10가지 이상의 className 변형이 여러 도메인에 걸쳐 반복되는 패턴으로 확인됐다(Fact).
- **Button 도입과 ui/ 폴더 이동을 정말 같이 해야 하는가, 아니면 별개로 나눠야 하는가?** → 데이터로 확인한 결과(71% 파일 겹침) 같은 사이클에서 다루는 게 효율적이다. 다만 "같은 사이클"이 "같은 이슈"를 의미하진 않는다 — 이슈 분해(ADR 단계)에서 폴더 이동과 Button 전환은 성격이 다른 변화라 별도 이슈로 나눈다.
- **ui/ 폴더에 배럴을 만드는 게 관례상 맞지 않나(conventions.md §3.1)?** → 문서상으로는 맞지만, 실제 이 저장소는 이미 두 번 같은 클래스의 버그를 겪었다. 사용자와 확인한 결과 배럴 없이 개별 경로 import로 결정했다(아래 목표 인터뷰 참고) — 이 결정 자체가 conventions.md §3.1이 실제와 얼마나 어긋나 있는지 보여주는 추가 증거이며, #97(conventions.md 갱신)의 근거로 남긴다.

## 목표와 범위

### Goal

- 새 버튼(CTA든 아이콘이든)을 만들 때, className 조합을 새로 판단하지 않고 `Button` 컴포넌트의 `variant`/`size` prop만 고르면 되게 한다.
- 도메인 없는 공용 컴포넌트 12개(+ 신규 `Button`)를 `apps/web/src/components/ui/`로 모아, "공용 UI가 어디 있는지" 판단 기준을 명확히 한다.

### Success Criteria

- 저장소 전체 58개 `<button>` 포함 파일 중 `Button`으로 전환된 비율(전환률)을 기록한다.
- `ui/` 이동 대상 12개 컴포넌트가 새 경로(`components/ui/*`)에서 기존과 동일한 소비처 수(31개 파일)를 유지하며 정상 동작한다.
- 기존 특성화/단위 테스트 전부 통과(가능한 한 무수정).
- `pnpm lint`/`check-types`/`test`/`build` 전부 PASS.

### Out of Scope

- **버튼의 실제 시각적 통일**: `Button`은 구조(마크업/prop 인터페이스)만 공유하고, 각 소비처가 `className`으로 기존 시각적 차이(색상 세부/hover 등)를 계속 오버라이드할 수 있게 한다(목표 인터뷰에서 확정, 추천안인 "variant당 고정 스타일 강제"는 채택하지 않음). 따라서 지금 확인한 10가지+ className 변형이 이번 사이클만으로 완전히 하나로 수렴하지는 않는다 — 이 잔여 격차는 Result의 Remaining Debt로 남긴다.
- **`ui/` 폴더에 배럴(`index.ts`) 신설**: 만들지 않는다. 모든 소비처는 개별 경로(`@/components/ui/Button` 등)로 import한다.
- **`packages/ui`로의 이동**: 하지 않는다. 12개 컴포넌트 + `Button` 전부 `apps/web/src/components/ui/`에 둔다(다른 프론트엔드 앱이 없어 실제 재사용 필요가 없음).
- **`ModalCloseButton`과 새 `Button`의 통합 여부**: 이번 PRD에서 결론내지 않고 ADR 3안 비교에서 다룬다.
- **저장소 전역 순환 참조 12건(#96), `docs/conventions.md` §3.1 재정의(#97)**: 별도 이슈로 유지.
- ~~새 라이브러리 도입(`class-variance-authority` 등): 불허, 자체 구현만 사용.~~ **[개정, 이슈 #104 착수 중]** `Button` 구현 중 className 병합이 속성별로 예측 불가능하게 충돌한다는 것을 컴파일된 CSS로 직접 확인했다(`adr.md`의 "구현 중 발견한 문제와 결정 변경" 참고). `tailwind-merge`(단일 목적 클래스 병합 유틸리티)에 한해 도입을 허용하도록 변경한다. `class-variance-authority` 등 variant 정의 라이브러리는 여전히 불허.
- 데이터 마이그레이션/배포 호환성 대응: 해당 없음(순수 프론트엔드 리팩터링).

## Behavior Invariants

- 각 버튼의 기존 `onClick`/폼 제출 등 클릭 핸들러 동작은 그대로 유지된다.
- 기존에 `disabled` 상태 처리가 있던 버튼은 동일하게 유지된다.
- 기존 접근성 속성(`aria-label`, `title` 등)은 유지된다.
- **버튼의 시각적 모습(색상/크기/hover 등)은 전환 전후 동일하게 유지된다** — 이번 사이클은 구조 공유이지 리디자인이 아니다(Out of Scope 참고).
- `ui/`로 이동하는 12개 컴포넌트의 기존 동작(모달 열림/닫힘, 로딩 스피너, 확인 오버레이 등)은 전부 유지된다.
- 기존 8개 모달 특성화 테스트, `ModalShell`/`ModalCloseButton`/`ModalPanel` 계약 테스트는 무수정 통과가 원칙이다.

## 기준선 검증

| 명령               | 결과 | 비고                             |
| ------------------ | ---- | -------------------------------- |
| `pnpm lint`        | PASS | 캐시 히트                        |
| `pnpm check-types` | PASS | 6.9s                             |
| `pnpm test`        | PASS | 캐시 히트 — api 37/37, web 51/51 |
| `pnpm build`       | PASS | 캐시 히트                        |

추가 지표:

- `<button>` 태그를 포함한 파일: 58개(테스트 제외).
- `bg-primary text-white` 계열 className 변형: 최소 10가지.
- `ui/` 이동 대상 12개 컴포넌트의 실제 소비 파일: 31개.
- 두 작업의 파일 교집합: 22개(71%).
- `packages/ui` 실사용처: 0곳.

---

**[GATE 1]** 위 진단, 목표·범위, Behavior Invariants, 기준선을 확인해주시면 ADR 단계(3안 비교 + 의사결정 인터뷰 로그)로 넘어가겠습니다.
