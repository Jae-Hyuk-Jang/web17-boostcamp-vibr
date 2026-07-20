# Result — modal-shell-duplication

## 변경 요약

8개 모달 컴포넌트에 흩어져 있던 backdrop 렌더링·배경 클릭 판정(4가지 다른 방식)·z-index(6가지 값)·접근성 속성(`role`/`aria-modal`)을 공통 `ModalShell`(+ 보조 `ModalCloseButton`) 컴포넌트로 추출했다. 여섯 이슈로 나눠 진행했다.

1. **#65** — `ModalShell`/`ModalCloseButton` 신설 + 계약 테스트, 아직 어떤 모달도 쓰지 않는 안전한 상태로 병합. 초안은 `components/modals/ModalShell/`에 도메인 폴더 형태로 만들었으나, 사용자 리뷰로 "도메인 소속이 아니라 재사용 범위" 기준을 적용해 `LoadingSpinner`/`ConfirmOverlay`와 같은 층위인 `components/` 최상위 flat 파일로 옮김
2. **#66** — 8개 모달의 배경-클릭-닫기/버튼-닫기 동작을 특성화 테스트로 고정(프로덕션 코드 변경 없음)
3. **#67** — `onMouseDown`+타깃 체크 방식 모달(`LoginModal`, `PlaylistDetailModal`) 전환 — 테스트 무수정 통과
4. **#68** — 별도 overlay div 방식 모달(`UserListModal`, `PlaylistPickerModal`) 전환 — overlay div가 사라져 테스트 쿼리를 `role="dialog"`로 조정(별도 커밋)
5. **#69** — 배경 클릭 미지원 모달(`ContentWriteModal`, `PrivacyConsentModal`) 전환 — `closeOnBackdrop={false}`로 "안 닫힘"을 명시적 옵션으로 승격, 테스트 무수정 통과
6. **#70** — 특이 레이아웃 모달(`MobileNowPlaylistModal`, `PostCardDetailModal`) 검토 — **계획과 달리 두 모달 모두 issues.md의 탈출구를 실제로 사용**: `MobileNowPlaylistModal`은 변경 없음(부분 오버레이라 `ModalShell`의 `inset-0` 전제와 안 맞고, 애초에 고칠 결함도 없었음), `PostCardDetailModal`은 데스크탑 변형만 전환(모바일 바텀시트에 `ModalShell`을 적용하면 `role="dialog"`가 동시에 두 번 존재하게 됨)

## Before / After

| 항목                                     | Before(baseline.md)                                                                          | After                                                                                                                                                                                                                                         |
| ---------------------------------------- | -------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `components/modals/*/*.tsx` 관련 테스트  | 1개 파일(`PostCardDetailModal.test.tsx`, backdrop/닫기 미검증)                               | 13개 파일(`ModalShell`/`ModalCloseButton` 계약 테스트 2개 + 8개 모달 특성화 테스트)                                                                                                                                                           |
| `apps/web` 전체 Jest 테스트              | 27개(#59 종료 시점)                                                                          | 48개                                                                                                                                                                                                                                          |
| 8개 모달 프로덕션 코드 총 줄 수          | 1,591줄                                                                                      | 1,228줄(`ModalShell`+`ModalCloseButton` 52줄 신설 포함, 순감소 ~311줄)                                                                                                                                                                        |
| 배경-클릭-닫기 구현 방식                 | 4가지(별도 backdrop div+stopPropagation / 별도 overlay div / onMouseDown+타깃 체크 / 미구현) | 2가지 근본 패턴으로 수렴: `ModalShell`의 `onMouseDown`+타깃 체크(`closeOnBackdrop` 옵션으로 닫힘/안 닫힘 표현) 적용 모달 7개(`PostCardDetailModal`은 데스크탑만) + 기존 방식 유지 2개(`MobileNowPlaylistModal`, `PostCardDetailModal` 모바일) |
| z-index 값                               | 6가지(`z-40`, `z-50`×4, `z-60`×3, `z-[10001]`, `z-[10002]`)                                  | `ModalShell` 적용 7곳은 `MODAL_Z_INDEX` 상수(`z-[10001]`) 하나로 통일. `MobileNowPlaylistModal`(`z-40`/`z-50`)과 `PostCardDetailModal` 모바일(`z-[10001]`/`z-[10002]`)은 원래도 결함이 없어 유지                                              |
| `role="dialog"`/`aria-modal` 보유        | 8개 중 1개                                                                                   | `ModalShell` 적용 7곳(사실상 모달 7종) + 기존 유지                                                                                                                                                                                            |
| `pnpm lint`/`check-types`/`test`/`build` | 전부 PASS(baseline.md, 2026-07-20 실행)                                                      | 전부 PASS(2026-07-20 재실행)                                                                                                                                                                                                                  |

## Behavior Verification

- baseline.md의 Behavior Invariants 7개 중 이번 사이클이 직접 다룬 3, 4, 5번을 8개 모달 각각의 특성화 테스트(#66)로 고정하고, 전환 후(#67~#70) 코드 수정 없이(또는 명시적으로 기록한 mock/쿼리 조정만 거쳐) 동일하게 통과함을 확인했다.
  - **3번(배경 클릭 닫기 방식 차이 유지)**: 배경 클릭으로 닫히는 6개 모달과 안 닫히는 2개 모달(`ContentWriteModal`, `PrivacyConsentModal`)의 차이가 `closeOnBackdrop` prop 값(`true`/`false`)으로 정확히 재현됨을 #69에서 확인
  - **4번(닫기 버튼 클릭 시 전부 닫힘)**: 8개 모달 전체 테스트로 확인, 전환 전후 변화 없음
  - **5번(모달마다 다른 시각 스타일 유지)**: `ModalShell`은 backdrop/판정/z-index/접근성만 캡슐화하고 패널 스타일은 각 모달이 그대로 소유 — 전환 과정에서 패널 관련 className을 건드리지 않음(코드 리뷰로 확인)
- **z-index 개선(diagnosis.md의 Inference였던 결함 위험)**: 빌드된 CSS(`'.next/static/chunks/*.css'`)에서 `.z-\[10001\]{z-index:10001}`, `.z-\[10000\]{z-index:10000}`을 직접 확인해, `MODAL_Z_INDEX`가 `MobileBottomNav`보다 실제로 높은 값으로 컴파일됨을 정적으로 검증했다. **다만 실제 브라우저에서 모바일 뷰포트로 겹침이 개선됐는지 육안 확인은 이 환경(브라우저 자동화 도구 없음)에서 수행하지 못했다** — regression-plan.md에서 이미 "자동화 불가" 영역으로 명시해뒀던 부분이며, 사용자가 `pnpm dev`로 직접 확인하는 것을 권장한다(Remaining Debt 참고).
- 1, 2, 6, 7번(모달 단일 렌더링, ESC/뒤로가기 처리, 히스토리 추가, 무관 로직 불변)은 이번 사이클에서 코드를 건드리지 않은 `ModalContainer.tsx`/`useModalStore.ts` 영역이라 별도 검증 없이 그대로 유지됨을 코드 리뷰로 확인했다.

## Decision Review

- **선택한 안(plan.md 안 2 — `ModalShell` 컴포넌트)**: 예상대로 backdrop/판정/z-index/접근성을 한 곳에 응집시켰고, 7개 모달에서 인라인 배경 클릭 로직이 완전히 사라졌다.
- **실제로 드러난 비용**: 계획 단계(plan.md)에서 이미 "8개 모달의 패널 레이아웃이 제각각이라 wrapper 구조가 충돌할 수 있다"고 예상했던 위험이 #70에서 실제로 발생했다 — `MobileNowPlaylistModal`과 `PostCardDetailModal` 모바일 변형은 예상대로 `ModalShell`을 적용하지 못했다. 계획에서 위험을 미리 문서화해뒀기 때문에, 실제로 문제가 생겼을 때 "어떻게든 끼워맞출지" 고민하지 않고 이미 합의된 탈출구(부분 적용/보류)를 바로 쓸 수 있었다.
- **테스트 조정의 성격 차이**: #67(onMouseDown 방식)과 #69(배경 클릭 미지원)는 테스트를 한 줄도 안 건드리고 통과했지만, #68(overlay div 방식)과 #70(PostCardDetailModal)은 DOM 구조 자체가 바뀌어 쿼리 대상을 `role="dialog"`로 조정해야 했다. 두 경우 모두 "무수정 통과"라는 이슈 AC를 문자 그대로 만족하진 못했지만, 왜 그런지 각 PR에 명시적으로 기록해뒀다 — AC는 목표이지 절대 규칙이 아니라는 걸 이번에도 확인했다.
- **brief-fixed.md Success Criteria 2(z-index 결함 위험 해소) 관련 실제 결과**: `MobileNowPlaylistModal`은 애초에 이 결함 대상이 아니었다는 걸 구현 과정에서 재확인했다 — diagnosis.md 단계에서 "5개 모달"로 뭉뚱그렸던 대상이 실제로는 4개(`LoginModal`, `UserListModal`, `PlaylistPickerModal`, `PlaylistDetailModal`)뿐이었고, `MobileNowPlaylistModal`은 z-40이지만 애초에 `MobileBottomNav`와 겹치는 영역을 침범하지 않아 결함이 아니었다. 반대로 diagnosis.md/brief-fixed.md 어디에도 없던 `PostCardDetailModal` 데스크탑 변형의 `z-60`을 전환 과정에서 새로 발견해 함께 고쳤다.

## Remaining Debt

- **z-index 개선의 실제 브라우저 확인 미완료**: `MODAL_Z_INDEX`(`z-[10001]`)가 컴파일된 CSS 수치로는 `MobileBottomNav`(`z-[10000]`)보다 높음을 확인했지만, 실제 모바일 뷰포트에서 겹침이 시각적으로 개선됐는지는 이 환경에서 확인하지 못했다. `pnpm dev`로 `LoginModal` 등을 모바일 뷰포트에서 열어 육안 확인을 권장한다.
- **`MobileNowPlaylistModal`, `PostCardDetailModal` 모바일 변형은 `ModalShell` 미적용 상태로 남음**: 결함이 없어 지금 당장 문제는 아니지만, 나중에 `ModalShell`의 API가 확장되어(예: `children` 슬롯 대신 `layout` prop 등으로 부분 오버레이/바텀시트를 지원하게 되면) 재검토할 수 있다.
- **`LikedUsersOverlay`(`PostCardDetailModal` 내부 중첩 오버레이)**: brief-fixed.md에서 이미 범위 밖으로 명시했고, 이번에도 건드리지 않았다.
- diagnosis.md 후보 D(`layout/MobileBottomSheet.tsx`, `layout/MobileNotiOverlay.tsx` 등 `MODAL_TYPES` 밖의 유사 오버레이 패턴 통합)는 여전히 범위 밖 — brief-fixed.md의 결정이 이번 사이클 종료 시점에도 유효하다.

## Follow-ups

- 다음에 새 모달을 추가할 때는 `ModalShell`(전체 화면 중앙 정렬형) 또는 기존 패턴(부분 오버레이/바텀시트형)을 먼저 판단하고 시작하도록, `docs/conventions.md`나 컴포넌트 주석에 이 구분 기준을 남겨두는 것을 제안한다(별도 이슈로 등록할지는 사용자 판단에 맡김).
- z-index 육안 확인이 완료되면 이 result.md에 결과를 추가하거나 별도 코멘트로 남기는 것을 권장한다.

---

**[GATE 6]** 위 Before/After, Behavior Verification(특히 z-index 육안 확인 미완료 부분), 남은 부채를 확인해주시면 이 사이클(부모 이슈 #64)을 종료하겠습니다.
