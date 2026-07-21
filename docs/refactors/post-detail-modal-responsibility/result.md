# Result — post-detail-modal-responsibility

## 변경 요약

`PostCardDetailModal.tsx`(396줄)에 인라인으로 흩어져 있던 UX 로그 수집 로직(체류 시간, 재생한 곡 수, 곡별 재생 시간, `emitOnce` 중복 전송 방지 가드 — ref 5개, effect 2개, callback 2개, 약 105줄)을 전담 훅 `usePostDetailUxLog`로 추출했다. 세 이슈로 나눠 진행했다.

1. **#56** — 이관 전, 기존 인라인 코드 기준으로 `PostCardDetailModal.test.tsx`(7개 시나리오)를 먼저 작성해 회귀 안전망 확보
2. **#57** — `usePostDetailUxLog.ts` 신설 + 훅 단독 유닛 테스트(6개 시나리오), 아직 어떤 컴포넌트도 쓰지 않는 안전한 상태로 병합
3. **#58** — `PostCardDetailModal.tsx`가 훅을 쓰도록 전환, 인라인 UX 로그 코드 제거

## Before / After

| 항목                                           | Before                                                     | After                                                                                              |
| ---------------------------------------------- | ---------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| `PostCardDetailModal.tsx` 관련 테스트          | 0개                                                        | 7개(`PostCardDetailModal.test.tsx`, 코드 변경 없이 mock 대상만 조정된 채 그대로 통과)              |
| `usePostDetailUxLog` 단독 테스트               | 해당 없음(훅 자체가 없었음)                                | 6개(`renderHook` 기반, `emitOnce` 가드/재생 시간 누적/`postId` 전환 시 초기화 등)                  |
| `PostCardDetailModal.tsx` 파일 길이            | 396줄                                                      | 329줄(UX 로그 인라인 블록 제거)                                                                    |
| UX 로그 로직 소유자                            | `PostCardDetailModal` 컴포넌트 본문(재사용/독립 검증 불가) | `usePostDetailUxLog` 훅(다른 화면에서도 재사용 가능한 형태로 응집)                                 |
| `apps/web` 전체 Jest 테스트                    | 21개(#48 종료 시점 기준)                                   | 27개                                                                                               |
| `pnpm lint` / `check-types` / `test` / `build` | 전부 PASS(baseline.md, 2026-07-20 실행)                    | 전부 PASS(2026-07-20 실행, 신규 훅에 `'use client'` 누락으로 build 1회 실패 → 즉시 수정 후 재확인) |

## Behavior Verification

baseline.md의 Behavior Invariants 10개 중 이번 사이클이 직접 다룬 4·5번, 그리고 회귀 위험이 있던 나머지 항목을 테스트로 확인했다.

- **4번(재생 시간 누적, dwell/재생곡수/곡별재생시간을 정확히 한 번만 전송)**: `PostCardDetailModal.test.tsx` 3개 시나리오(닫기 버튼, unmount, 닫기+unmount 동시)로 리팩터링 전/후 동일하게 통과 확인. `usePostDetailUxLog.test.ts`에서도 훅 단독으로 `emitOnce` 가드를 별도 검증.
- **5번(비로그인 미전송)**: 컴포넌트·훅 테스트 양쪽에서 확인.
- **1~3, 6~10번**: 이번 사이클에서 코드를 건드리지 않은 영역(모달 열림/닫힘, 반응형 라우팅, 본문 수정, 좋아요한 사용자 목록, 스와이프)이며, #58 전환 후에도 `PostCardDetailModal.test.tsx`가 렌더링 실패 없이 그대로 통과해 간접적으로 깨지지 않았음을 확인했다. 별도 특성화 테스트는 이번 사이클 범위 밖(Out of Scope, brief-fixed.md)이라 작성하지 않았다.

## Decision Review

- **선택한 안(plan.md 안 2 — 전담 훅 추출)**: 예상대로 `useSwipeToDismiss`와 동일한 패턴을 따라갈 수 있었고, 회귀 없이 마무리됐다. `PostCardDetailModal.tsx`가 396→329줄로 줄었지만, 이는 목표가 아니라 결과였다(brief-fixed.md Success Criteria 3).
- **실제로 드러난 비용**: `usePostLikeToggle.ts`(post-reaction-state 사이클)와 달리 이번 신규 훅 파일에 `'use client'` 지시어를 처음에 빠뜨려 `pnpm build`에서만 잡히는 SSR 경계 오류가 발생했다(lint/check-types/test는 잡지 못함) — 사소하지만 "새 훅 파일을 추가할 때는 build까지 반드시 돌려야 한다"는 점을 다시 확인시켜준 비용.
- **brief-fixed.md Success Criteria 2(시간 소스 주입 seam) 관련 결정 변경**: plan.md(Stage 3, GATE 3)에서는 "옵션으로 시간 소스를 주입받을 수 있게 한다(최소 seam)"고 적었지만, 이후 regression-plan.md(Stage 4, GATE 4)에서 "지금 필요성이 확인되지 않는다(YAGNI)"는 이유로 별도 시간 주입 파라미터를 추가하지 않기로 재결정했고, 실제로도 실제 타이머로 충분히 테스트할 수 있었다(`post-reaction-state`에서 실시간 타이머를 쓴 전례를 그대로 따름). 이 문서(result.md)에서 이 변경을 명시적으로 기록해 plan.md와의 불일치가 "실수로 빠뜨린 것"이 아니라 "다음 단계에서 근거를 갖고 재검토한 것"임을 남긴다.

## Remaining Debt

- diagnosis.md의 후보 B(반응형 라우팅 전환 훅 추출)·C(본문 수정 로직 훅 추출)는 Stage 1(GATE 1)에서 YAGNI 기준으로 이미 보류됐다 — 두 로직 모두 이미 충분히 짧고 응집돼 있어, 지금 추출해도 이득이 근거 강도 대비 작다고 판단했다. 이번 사이클 종료 시점에도 이 판단은 유효하다(코드 변경 없음).
- 후보 E(컨테이너/표현 전면 분리)는 애초에 범위 밖으로 명시됐다(brief-fixed.md Out of Scope) — `PostCardDetailModal.tsx`는 여전히 모달 상태·반응 상태·본문수정·라우팅전환·좋아요유저목록·재생트리거·스와이프 7가지 책임을 갖고 있다(UX 로그를 뺀 나머지). 다음에 이 컴포넌트를 다시 다룰 일이 생기면(예: 실제 변경 압력이 발생하면) diagnosis.md를 다시 실행해 후보 B/C/E를 재평가할 것을 권장한다.

> **후속 갱신(2026-07-21)**: 위에서 예고한 "다시 다룰 시점"이 `post-detail-modal-responsibility-decomposition` 사이클(#125~#131)로 실현됐다. 후보 B(라우팅 전환)·C(본문 편집 로직, `PlaylistDetailModal`과의 구조 중복이 새 근거로 확인되며 재평가)·E(전면 분리)를 전부 처리해 `PostCardDetailModal.tsx`가 329→69줄로 줄었다. 상세는 `docs/refactors/post-detail-modal-responsibility-decomposition/result.md` 참고.

## Follow-ups

- 이번 사이클에서 새로 발견한 문제는 없다(#39류의 버그, #43/#53/#54/#55류의 아키텍처 논의와 달리, 이번 대상은 계획대로 좁게 마무리됨).
- 다음 리팩터링 대상 후보가 필요해지면, diagnosis.md의 후보 B/C/E 또는 `apps/web` 전체에서 아직 테스트가 없는 다른 컨테이너 컴포넌트를 baseline.md 방식으로 다시 스캔하는 것을 제안한다.

---

**[GATE 6]** 위 Before/After, Behavior Verification, 남은 부채(후보 B/C/E 보류 유지)를 확인해주시면 이 사이클(부모 이슈 #41)을 종료하겠습니다.
