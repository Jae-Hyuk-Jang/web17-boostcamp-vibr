# Brief Fixed — modal-shell-duplication

## Goal

8개 모달 컴포넌트(`ContentWriteModal`, `LoginModal`, `MobileNowPlaylistModal`, `PlaylistDetailModal`, `PlaylistPickerModal`, `PostCardDetailModal`, `PrivacyConsentModal`, `UserListModal`)에 각자 흩어져 있는 backdrop 렌더링·배경 클릭 판정·z-index·접근성 속성을 **공통 Modal Shell(자체 구현)**로 추출해서, 새 모달을 추가하거나 이 로직을 바꿀 때 8개 파일을 각각 판단하지 않고 한 곳만 고치면 되게 한다.

## Success Criteria

1. **중복 제거(최우선)**: 8개 모달이 공통 Modal Shell을 통해 backdrop 렌더링·배경 클릭 판정·z-index·접근성 속성을 얻는다 — 이 4가지 로직이 각 모달 파일에 직접 구현되어 있지 않다.
2. **z-index 결함 위험 해소**: z-index가 상수(토큰) 하나로 관리되어, 현재 `MobileBottomNav`(`z-[10000]`)보다 낮은 값을 쓰는 5개 모달(`LoginModal`, `UserListModal`, `PlaylistPickerModal`, `PlaylistDetailModal`, `MobileNowPlaylistModal`)이 그 위로 올라온다 — diagnosis.md의 Inference(모바일에서 하단 네비게이션에 모달이 가려질 가능성)를 해소하고, 실제 개선 여부를 브라우저로 시각 확인한다.
3. 8개 모달 전부 `role="dialog"`, `aria-modal="true"`를 갖는다.
4. baseline.md의 Behavior Invariants가 전부 유지된다 — 특히 배경 클릭 시 닫히지 않는 2개 모달(`ContentWriteModal`, `PrivacyConsentModal`)의 차이는 Shell의 prop(`closeOnBackdrop` 등)으로 표현되어 유지된다.
5. 새 라이브러리 도입 없음 — 자체 구현으로 제한한다(사용자 확정).

## Behavior Invariants (baseline.md 재확인, 변경 없음)

`docs/refactors/modal-shell-duplication/baseline.md`의 7개 항목을 그대로 따른다. 특히:

- 배경 클릭 시 닫히는 6개 모달과 닫히지 않는 2개 모달의 현재 차이는 유지한다.
- ESC 키·브라우저 뒤로가기(popstate) 처리는 `ModalContainer`가 전역으로 담당하며 이번 사이클과 무관하다.
- 각 모달의 시각 스타일(테두리 색, 그림자, 모서리 둥글기, 최대 너비, 내부 레이아웃)은 모달마다 다르며 통일하지 않는다.
- `PostCardDetailModal`의 UX 로그·반응 상태·본문 수정·재생 트리거·스와이프·반응형 라우팅 전환 로직(#41 사이클에서 이미 다뤘거나 이번과 무관)은 건드리지 않는다.

## Out of Scope

- **`LikedUsersOverlay`**(`PostCardDetailModal` 내부에서 `useModalStore`를 거치지 않고 로컬 상태로 여는 중첩 오버레이) — `MODAL_TYPES` 기반 8개 모달과 메커니즘이 달라 이번 Shell의 소비자에 포함하지 않는다. 별도 후보로 다룰지는 다음 사이클에서 재평가한다.
- **후보 D(diagnosis.md)** — `layout/MobileBottomSheet.tsx`, `layout/MobileNotiOverlay.tsx` 등 `MODAL_TYPES` 밖의 유사 오버레이 패턴 통합. 이번 사이클 범위 밖.
- **8개 모달 각각의 시각 스타일 통일** — 대상이 아니다. 공통화 범위는 backdrop/닫기 판정/z-index/접근성으로 한정한다.
- **Radix UI Dialog 등 접근성 다이얼로그 프리미티브 라이브러리 도입** — 이번 사이클에서는 검토하지 않는다(자체 구현으로 확정).
- **데이터 마이그레이션/배포 호환성** — 클라이언트 전용 UI 로직이라 해당 없음.

## 용어 정의

- **Modal Shell**: backdrop(전체 화면 반투명 배경), 배경 클릭 시 닫기 판정, z-index, 접근성 속성(`role`, `aria-modal`)을 공통으로 제공하는 컴포넌트. 모달마다 다른 시각 스타일과 내부 콘텐츠는 Shell을 소비하는 각 모달이 그대로 책임진다.
- **closeOnBackdrop**: 배경(backdrop) 클릭 시 모달을 닫을지 여부를 결정하는 옵션. 현재 6개 모달은 `true`(닫힘), `ContentWriteModal`/`PrivacyConsentModal` 2개는 `false`(안 닫힘)에 해당하는 동작을 그대로 유지해야 한다.
