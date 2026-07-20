# Baseline — modal-shell-duplication

## 범위 (이번 사이클에서 실제로 읽은 대상)

- `apps/web/src/components/modals/{ContentWriteModal,LoginModal,MobileNowPlaylistModal,PlaylistDetailModal,PlaylistPickerModal,PostCardDetailModal,PrivacyConsentModal,UserListModal}/*.tsx` — 8개 모달 컴포넌트
- `apps/web/src/components/modals/ModalContainer.tsx`, `apps/web/src/stores/useModalStore.ts` — 모달 마운트/디스패치 메커니즘(참고용으로 확인, 이번 사이클에서 직접 변경하지는 않음)
- `apps/web/src/components/modals/PostCardDetailModal/partials/LikedUsersOverlay.tsx` — `PostCardDetailModal` 안에서 `useModalStore`를 거치지 않고 자체적으로 여는 중첩 오버레이(참고용)

## 관찰한 구조 (Fact)

- `ModalContainer.tsx`는 `useModalStore`의 `modalType`을 보고 8개 모달 중 하나만 조건부 렌더링한다 — **동시에 두 개의 `MODAL_TYPES` 모달이 함께 열리는 경우는 없다.** 단, `PostCardDetailModal`이 자체 로컬 상태(`isLikedUsersOpen`)로 여는 `LikedUsersOverlay`는 이 메커니즘 밖에 있어, "모달 위에 오버레이가 하나 더 뜨는" 유일한 실제 중첩 사례다.
- `ModalContainer.tsx`가 ESC 키와 브라우저 뒤로가기(`popstate`)로 모달을 닫는 로직을 전역에서 이미 처리한다 — 개별 모달 컴포넌트는 이 두 경로를 각자 구현하지 않는다.
- brief-original.md에 기록한 4가지 배경-클릭-닫기 구현 방식, 6가지 z-index 값, 접근성 속성 편차, 닫기 버튼 마크업 반복은 이번 조사에서 직접 코드로 확인한 Fact다(해당 문서 "실제 사례" 참고, 여기서 반복하지 않음).
- z-index 값은 모달들끼리만 비교할 대상이 아니다 — `Sidebar.tsx`가 `z-30`/`z-40`, 레이아웃 어딘가(모바일 드로어류)가 `z-[10000]`을 이미 쓰고 있다. `PostCardDetailModal`의 `z-[10001]`/`z-[10002]`는 다른 모달과의 충돌이 아니라 이 `z-[10000]` 레이아웃 요소를 넘어서기 위한 개별 대응일 가능성이 있다(Inference — Stage 1에서 근거 등급을 다시 매긴다).

## 기존 안전망 공백 (Fact)

- `find components/modals -iname "*.test.*"` 결과, 8개 모달 중 테스트가 있는 것은 `PostCardDetailModal.test.tsx`(#56, UX 로그 관찰용으로 작성된 것이라 backdrop/닫기 동작을 직접 검증하지는 않음) 하나뿐이다. 나머지 7개 모달의 배경 클릭 닫기, 닫기 버튼, 접근성 동작에 대한 테스트는 0개다.
- `components/modals/` 폴더 전체의 git 이력(`git log --oneline -- components/modals/`) 5건 중 3건은 프로젝트 초기 lint 정리 커밋이고, 나머지 2건은 이번 세션의 `PostCardDetailModal` UX 로그 작업(#56, #58)이다 — **이 폴더를 겨냥한 기능적 변경 이력은 사실상 없다.** "자주 바뀌는 곳"이라는 근거는 이번 사이클에서도 성립하지 않으며, 문제는 변경 빈도가 아니라 8개 파일에 흩어진 중복·불일치다.

## 기준선 검증 결과 (2026-07-20, 실제 저장소에서 실행)

| 명령               | 결과                                                  |
| ------------------ | ----------------------------------------------------- |
| `pnpm lint`        | **PASS** — 4/4 태스크 성공                            |
| `pnpm check-types` | **PASS** — 3/3 태스크 성공                            |
| `pnpm test`        | **PASS** — `api` 37개, `web` 27개(#59 종료 시점 기준) |
| `pnpm build`       | **PASS**                                              |

기존에 실패하던 항목은 없다.

## 측정 지표

- `components/modals/*/*.tsx` 관련 테스트: 1개 파일(`PostCardDetailModal.test.tsx`, 배경/닫기 동작은 다루지 않음) — 나머지 7개 모달은 0개
- 8개 모달 파일 길이: 28~329줄(가장 짧은 `PrivacyConsentModal.tsx` 28줄, 가장 긴 `PostCardDetailModal.tsx` 329줄) — 전체 합 1,591줄
- 배경-클릭-닫기 구현 방식: 4가지(별도 backdrop div+stopPropagation / 별도 absolute overlay div / onMouseDown+target 체크 / 미구현)
- z-index 값: 6가지(`z-40`, `z-50`×4, `z-60`×3, `z-[10001]`, `z-[10002]`)
- `role="dialog"`/`aria-modal` 보유: 8개 중 1개
- 변경 이력: 이 폴더를 겨냥한 기능적 변경 커밋 0건(위 "기존 안전망 공백" 참고)

## Behavior Invariants

1. `ModalContainer`는 `modalType`에 따라 동시에 하나의 `MODAL_TYPES` 모달만 렌더링한다. `PostCardDetailModal`이 여는 `LikedUsersOverlay`는 이 규칙과 무관하게 그대로 동작한다.
2. ESC 키, 브라우저 뒤로가기(popstate) 시 열린 모달이 닫히는 동작은 `ModalContainer`가 전역으로 처리하며, 이번 사이클에서 변경하지 않는다.
3. 배경 클릭 시 닫히는 6개 모달(`PostCardDetailModal`, `UserListModal`, `PlaylistPickerModal`, `LoginModal`, `PlaylistDetailModal`, `MobileNowPlaylistModal`)과 닫히지 않는 2개 모달(`ContentWriteModal`, `PrivacyConsentModal`)의 현재 차이는 유지한다 — 후자는 의도된 "실수로 내용을 날리지 않게" 동작일 가능성이 있다(brief-original.md 제약).
4. 8개 모달 모두 닫기 버튼(X) 클릭 시 닫힌다.
5. 각 모달의 시각 스타일(테두리 색, 그림자, 모서리 둥글기, 최대 너비, 내부 레이아웃)은 모달마다 다르며, 이번 리팩터링으로 통일하지 않는다.
6. 모달이 열릴 때(`ModalContainer`의 `useEffect`) 브라우저 히스토리에 항목이 추가되는 동작은 변경하지 않는다.
7. `PostCardDetailModal`의 UX 로그(#56~#59에서 이미 정리됨), 반응 상태, 본문 수정 등 이번 사이클과 무관한 로직은 건드리지 않는다.

## 다음 결정 필요 사항 (GATE 0 승인 후)

- 단계 1(비판적 구조 진단, `diagnosis.md`)로 진행하며, 아래를 좁힙니다.
  - z-index 불일치가 실제로 관찰 가능한 문제(겹침 버그)인지, 아니면 서로 다른 레이아웃 요소를 피하기 위한 개별 대응이 우연히 값만 다른 것인지(Fact/Inference 등급 확정)
  - 공통화 범위: backdrop+닫기 로직만 뽑을지, 닫기 버튼 마크업까지 포함할지, `MobileNowPlaylistModal`처럼 절반만 모달 패턴을 따르는 것도 포함할지
  - `layout/MobileBottomSheet.tsx`, `layout/MobileNotiOverlay.tsx` 등 `MODAL_TYPES` 밖에 있는 유사 오버레이 패턴을 이번 사이클에 포함할지, 별도 후보로 미룰지

---

**[GATE 0]** 위 범위, Behavior Invariants, 기존 실패(없음)를 확인해주세요. 확인되면 단계 1(비판적 구조 진단)로 진행하겠습니다.
