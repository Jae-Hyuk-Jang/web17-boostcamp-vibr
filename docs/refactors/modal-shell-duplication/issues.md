# Issues — modal-shell-duplication (안 2: ModalShell 컴포넌트)

"이 이슈만 머지해도 기존 동작이 유지되고 저장소가 정상 상태인가"를 기준으로 7개로 나눴습니다. 이슈 3~6은 배경-클릭-닫기 구현 방식이 같은 모달끼리 묶어(한 이슈에서 한 종류의 변화만) 전환합니다.

---

## 이슈 1 — `ModalShell`/`ModalCloseButton` 컴포넌트 신설 + 계약 테스트

### 목적

공통 컴포넌트 뼈대를 마련한다. 아직 어떤 모달도 이 컴포넌트를 쓰지 않는 안전한 상태로 둔다.

### Scope

- `apps/web/src/constants/modal.ts` 신설 — `MODAL_Z_INDEX` 상수(`MobileBottomNav`의 `z-[10000]`보다 높은 값으로 결정)
- `apps/web/src/components/modals/ModalShell/ModalShell.tsx` 신설 — backdrop(`fixed inset-0`, `MODAL_Z_INDEX`, `role="dialog"`, `aria-modal="true"`)과 `closeOnBackdrop` 판정만 캡슐화한다. **내부 레이아웃(중앙 정렬 vs 바텀시트 등)은 강제하지 않고 `children`이 자유롭게 구성**하도록 설계한다 — `PostCardDetailModal`의 모바일 바텀시트, `MobileNowPlaylistModal`의 부분 오버레이처럼 "화면 전체를 덮는 중앙 정렬 모달"이 아닌 변형과 충돌하지 않기 위함(plan.md ADR의 "새로 생기는 위험" 대응)
- `apps/web/src/components/modals/ModalCloseButton/ModalCloseButton.tsx` 신설 — X 아이콘 + 원형 hover 버튼(선택적 소비, `ModalShell`이 강제하지 않음)
- `ModalShell.test.tsx`, `ModalCloseButton.test.tsx` — regression-plan.md의 계약 테스트 5개 시나리오
- `components/modals/index.ts` 배럴에 export 추가

### Out of Scope

- 8개 기존 모달 변경 없음(다음 이슈들에서 진행)

### Behavior Invariants

- 없음(신규 파일이라 기존 동작에 영향 없음)

### Acceptance Criteria

- [ ] Given `closeOnBackdrop=true`(기본값), When 배경을 클릭하면, Then `onClose`가 호출된다
- [ ] Given `closeOnBackdrop=false`, When 배경을 클릭하면, Then `onClose`가 호출되지 않는다
- [ ] Given 패널(children) 내부를 클릭하면, Then `onClose`가 호출되지 않는다(버블링으로 오작동 안 함)
- [ ] Given `ModalShell`을 렌더링하면, Then `role="dialog"`, `aria-modal="true"`가 존재한다
- [ ] Given `ModalShell`을 렌더링하면, Then z-index가 `MODAL_Z_INDEX` 상수값과 일치한다

### Verification

- [ ] `pnpm --filter web test -- ModalShell`, `pnpm --filter web test -- ModalCloseButton`, `lint`, `check-types`

### Rollback

- 신규 파일 삭제로 충분(아직 소비처 없음)

### Dependency

- 없음(첫 이슈)

---

## 이슈 2 — 8개 모달 배경-클릭-닫기 특성화 테스트 일괄 작성

### 목적

전환 전, 각 모달의 현재 배경-클릭-닫기/버튼-닫기 동작을 테스트로 고정한다.

### Scope

- regression-plan.md 표의 7개 모달(`PostCardDetailModal` 제외 — 데스크탑 쪽은 `PostCardDetailModal.test.tsx`가 이미 커버) 각각에 `.test.tsx` 신설
- `PostCardDetailModal`의 모바일 backdrop(현재 미검증)만 기존 테스트 파일에 시나리오 1개 추가

### Out of Scope

- 프로덕션 코드 변경 없음(테스트만 추가)

### Behavior Invariants

- baseline.md 3, 4번(배경 클릭 닫기 방식 차이, 닫기 버튼 동작)

### Acceptance Criteria

- [ ] Given `LoginModal`/`PlaylistDetailModal`/`UserListModal`/`PlaylistPickerModal`/`MobileNowPlaylistModal`, When 배경을 클릭하면, Then 모달이 닫힌다(각자의 현재 방식 그대로)
- [ ] Given `ContentWriteModal`/`PrivacyConsentModal`, When 배경을 클릭하면, Then 모달이 닫히지 않는다
- [ ] Given 위 7개 모달, When X 버튼을 클릭하면, Then 모달이 닫힌다
- [ ] Given `PostCardDetailModal`의 모바일(바텀시트) 뷰, When 배경을 클릭하면, Then 모달이 닫힌다

### Verification

- [ ] `pnpm --filter web test`, `lint`, `check-types`

### Rollback

- 테스트 파일만 추가되므로 해당 커밋 revert로 충분

### Dependency

- 이슈 1과 독립적으로 진행 가능(순서 무관, 병렬 가능)

---

## 이슈 3 — `onMouseDown`+타깃 체크 방식 모달 전환 (`LoginModal`, `PlaylistDetailModal`)

### 목적

가장 단순한 표준 중앙 정렬 레이아웃부터 `ModalShell`로 전환해 패턴을 검증한다.

### Scope

- `LoginModal.tsx`, `PlaylistDetailModal.tsx`가 `ModalShell`(`closeOnBackdrop=true`)로 배경 클릭 판정을 위임하도록 전환하고, 인라인 `onMouseDown` 로직을 제거한다
- 두 파일 모두 `role="dialog"`/`aria-modal`을 갖게 된다(이전에 없었음)

### Out of Scope

- 패널 내부 레이아웃(테두리, 그림자, 최대 너비 등) 변경 없음
- 닫기 버튼 마크업은 이번 이슈에서 `ModalCloseButton`으로 바꾸지 않아도 됨(선택 사항, 여유 있으면 함께 진행)

### Behavior Invariants

- baseline.md 3, 4, 5번

### Acceptance Criteria

- [ ] Given 이슈 2에서 작성한 `LoginModal.test.tsx`/`PlaylistDetailModal.test.tsx`를 그대로 실행하면, Then 코드 수정 없이(mock 대상 조정은 예외) 전부 통과한다
- [ ] Given 두 파일을 확인하면, Then 인라인 `onMouseDown` 배경 클릭 판정 로직이 더 이상 존재하지 않는다

### Verification

- [ ] `pnpm --filter web test -- LoginModal`, `pnpm --filter web test -- PlaylistDetailModal`, `lint`, `check-types`, `build`

### Rollback

- 두 파일만 이전 커밋으로 되돌리면 복구(`ModalShell`은 이슈 1로 이미 독립 검증된 상태라 영향 없음)

### Dependency

- 이슈 1, 2 선행

---

## 이슈 4 — 별도 overlay div 방식 모달 전환 (`UserListModal`, `PlaylistPickerModal`)

### 목적

`absolute inset-0` 별도 오버레이 div로 배경 클릭을 처리하던 방식을 `ModalShell`로 대체한다.

### Scope

- `UserListModal.tsx`, `PlaylistPickerModal.tsx`가 `ModalShell`(`closeOnBackdrop=true`)로 전환하고, 별도 overlay div를 제거한다

### Out of Scope

- 이슈 3과 동일

### Behavior Invariants

- baseline.md 3, 4, 5번

### Acceptance Criteria

- [ ] Given 이슈 2의 `UserListModal.test.tsx`/`PlaylistPickerModal.test.tsx`를 그대로 실행하면, Then 코드 수정 없이(mock 대상 조정은 예외) 전부 통과한다
- [ ] Given 두 파일을 확인하면, Then 별도 `absolute inset-0` overlay div가 더 이상 존재하지 않는다

### Verification

- [ ] `pnpm --filter web test -- UserListModal`, `pnpm --filter web test -- PlaylistPickerModal`, `lint`, `check-types`, `build`

### Rollback

- 두 파일만 이전 커밋으로 되돌리면 복구

### Dependency

- 이슈 1, 2 선행

---

## 이슈 5 — 배경 클릭 미지원 모달 전환 (`ContentWriteModal`, `PrivacyConsentModal`)

### 목적

`closeOnBackdrop=false`로 "배경 클릭해도 안 닫힘" 동작을 유지한 채 `ModalShell`로 전환한다 — 이 옵션이 실제로 다른 값으로 동작함을 확인하는 핵심 이슈다.

### Scope

- `ContentWriteModal.tsx`, `PrivacyConsentModal.tsx`가 `ModalShell`(`closeOnBackdrop=false`)로 전환한다

### Out of Scope

- 이슈 3과 동일

### Behavior Invariants

- baseline.md 3번(배경 클릭으로 안 닫히는 동작 유지가 이번 이슈의 핵심)

### Acceptance Criteria

- [ ] Given 이슈 2의 `ContentWriteModal.test.tsx`/`PrivacyConsentModal.test.tsx`를 그대로 실행하면, Then 코드 수정 없이(mock 대상 조정은 예외) 전부 통과한다 — 특히 "배경 클릭해도 안 닫힘" 시나리오
- [ ] Given 두 파일을 확인하면, Then `role="dialog"`/`aria-modal`을 갖는다(이전에 없었음)

### Verification

- [ ] `pnpm --filter web test -- ContentWriteModal`, `pnpm --filter web test -- PrivacyConsentModal`, `lint`, `check-types`, `build`

### Rollback

- 두 파일만 이전 커밋으로 되돌리면 복구

### Dependency

- 이슈 1, 2 선행

---

## 이슈 6 — 특이 레이아웃 모달 전환 (`MobileNowPlaylistModal`, `PostCardDetailModal`)

### 목적

"화면 전체를 덮는 중앙 정렬 모달"이 아닌 변형(부분 오버레이, 데스크탑/모바일 이원 레이아웃)에도 `ModalShell`이 강제 레이아웃 없이 적용되는지 확인한다 — 레이아웃 충돌 위험이 가장 큰 이슈라 마지막에 다룬다.

### Scope

- `MobileNowPlaylistModal.tsx` — 부분 오버레이(`inset-x-0 top-0 bottom-32`) 형태를 유지한 채 `ModalShell`의 backdrop-click 판정만 위임(또는 레이아웃이 맞지 않으면 이 모달은 `ModalShell` 적용 대상에서 제외하고 z-index 상수만 적용 — 구현 중 판단)
- `PostCardDetailModal.tsx` — 데스크탑 변형(이미 `role="dialog"` 보유)을 `ModalShell`로 전환. 모바일 바텀시트 변형은 레이아웃이 근본적으로 다르므로(`fixed inset-x-0 bottom-0 h-[90vh]`), `ModalShell`의 backdrop-click 판정만 재사용하고 시트 자체의 위치·애니메이션은 그대로 둔다

### Out of Scope

- `PostCardDetailModal`의 UX 로그·반응 상태·본문 수정·재생 트리거·스와이프·라우팅 전환 로직(#41 사이클에서 이미 정리됨) — 이번 이슈에서 건드리지 않는다

### Behavior Invariants

- baseline.md 3, 4, 5번 + `docs/refactors/post-detail-modal-responsibility/baseline.md`의 1~10번(특히 2번: 모바일 바텀시트/데스크탑 모달 레이아웃 분기 유지)

### Acceptance Criteria

- [ ] Given 이슈 2에서 보강한 `PostCardDetailModal.test.tsx`(모바일 backdrop 시나리오 포함)와 `MobileNowPlaylistModal.test.tsx`를 그대로 실행하면, Then 코드 수정 없이(mock 대상 조정은 예외) 전부 통과한다
- [ ] Given 두 파일을 확인하면, Then z-index가 `MODAL_Z_INDEX` 상수를 참조한다
- [ ] `ModalShell`이 이 두 모달의 레이아웃과 실제로 맞지 않는다고 판명되면, 이 이슈 안에서 `ModalShell`의 API를 조정(예: children 슬롯 방식 재검토)하거나, 그래도 안 맞으면 z-index만이라도 상수화하고 배경-클릭 판정 통합은 보류한 채 이 사실을 result.md에 기록한다(중단 조건 발생 시 plan.md 재검토 원칙)

### Verification

- [ ] `pnpm --filter web test -- MobileNowPlaylistModal`, `pnpm --filter web test -- PostCardDetailModal`, `lint`, `check-types`, `build`

### Rollback

- 두 파일만 이전 커밋으로 되돌리면 복구

### Dependency

- 이슈 1, 2 선행. 이슈 3~5의 전환 경험(레이아웃 충돌 여부)을 참고하는 것이 좋으므로 가능하면 마지막에 진행

---

## 이슈 7 — 결과 검증 및 `result.md`

### 목적

전체 기준선을 재확인하고 Before/After를 비교해 사이클을 공식 종료한다.

### Scope

- `pnpm lint`/`check-types`/`test`/`build` 전체 재실행 및 결과 기록
- **z-index 개선의 실제 효과를 `pnpm dev`로 모바일 뷰포트에서 육안 확인**(regression-plan.md에서 자동화 불가로 남긴 부분) — `LoginModal` 등 개선 대상 모달을 모바일 뷰포트에서 열어 `MobileBottomNav`에 가려지지 않는지 확인
- `docs/refactors/modal-shell-duplication/result.md` 작성(GATE 6)
- 남은 후보(diagnosis.md 후보 D: layout의 다른 오버레이 통합)를 백로그로 남길지 판단

### Verification

- [ ] `pnpm lint`, `pnpm check-types`, `pnpm test`, `pnpm build` 전부 통과
- [ ] baseline.md의 Behavior Invariants 7개 재확인
- [ ] 모바일 뷰포트 육안 확인 결과 기록

### Rollback

- 문서 변경뿐이므로 해당 없음

### Dependency

- 이슈 1~6 전부 완료 후
