# 문제 영역

`apps/web/src/components/modals/*`의 8개 모달 컴포넌트가 배경(backdrop) 오버레이, "배경 클릭 시 닫기" 동작, z-index, 닫기 버튼 마크업을 공통 컴포넌트 없이 각자 손으로 구현하고 있다.

## 관찰한 증상

- 새 모달을 추가하거나 기존 모달의 닫기 동작·접근성을 바꾸려면, 공통으로 참고할 곳이 없어 각 파일을 열어 그 파일만의 구현 방식을 파악한 뒤 고쳐야 한다.
- `components/modals/*/*.tsx` 8개 파일 전체.

## 실제 사례 (Fact — 코드로 직접 확인, 2026-07-20)

- **z-index가 파일마다 제각각**: `z-40`, `z-50`(4곳), `z-60`(3곳), `z-[10001]`, `z-[10002]`까지 6가지 값이 8개 모달에 흩어져 있다(`grep -rohE "z-\[?[0-9]+\]?" modals/*/*.tsx`). `PostCardDetailModal`이 유독 `z-[10001]`/`z-[10002]`처럼 튀는 값을 쓰는 것 자체가, 다른 `z-60` 모달과 겹쳤을 때 위로 띄우기 위한 개별 대응으로 보인다.
- **"배경 클릭 시 닫기" 구현이 4가지 다른 방식으로 존재**:
  1. `PostCardDetailModal` — 별도 backdrop `div`의 `onClick` + 패널 `div`의 `e.stopPropagation()`
  2. `UserListModal`, `PlaylistPickerModal` — 패널 뒤에 별도 `absolute inset-0` 오버레이 `div`를 두고 그 `div`에 `onClick`
  3. `LoginModal`, `PlaylistDetailModal` — 바깥 `div` 하나에 `onMouseDown` + `e.target === e.currentTarget` 체크
  4. `ContentWriteModal`, `PrivacyConsentModal` — 배경 클릭으로 닫히지 않음(X 버튼으로만 닫힘)
- **접근성 속성 편차**: `role="dialog"`/`aria-modal`이 8개 중 `PostCardDetailModal` 1곳에만 있다.
- **닫기 버튼 마크업 반복**: 7개 파일에서 `<button onClick={closeModal}><X className="w-5/6 h-5/6 ..." /></button>` 형태가 거의 동일하게 반복된다(hover 배경색, 아이콘 크기만 소폭 다름).

## 초기 가설 (Hypothesis — 미검증)

- 각 모달을 새로 만들 때 기존 모달 파일을 복사해서 시작했고, 그 과정에서 배경 클릭 닫기 방식이나 접근성 속성이 조금씩 누락되거나 다르게 재구현된 것으로 보인다.
- 공통 "Modal shell"(backdrop + 닫기 로직 + z-index 관리)이 없어서, 모달을 추가할 때마다 이 로직을 매번 새로 판단해야 하는 비용이 반복된다.

## 기대 효과

- 공통 Modal shell이 생기면 새 모달을 추가할 때 배경 클릭 닫기·접근성·z-index를 매번 재구현하지 않아도 된다.
- z-index를 한 곳에서 관리하면 "이 모달이 저 모달보다 위에 떠야 한다" 같은 요구가 생겼을 때 8개 파일을 뒤지지 않아도 된다.
- 배경 클릭 닫기 방식이 하나로 통일되면, 지금처럼 일부 모달만 배경 클릭으로 안 닫히는(의도인지 누락인지 불명확한) 상태가 명시적인 선택이 된다.

## 제약

- 8개 모달의 실제 시각 스타일(테두리 색, 그림자, 모서리 둥글기, 최대 너비 등)은 모달마다 의도적으로 다르므로, 공통화 대상은 backdrop/닫기 로직/접근성/z-index 스코프이지 전체 레이아웃·스타일은 아니다(과설계 방지).
- `layout/MobileBottomSheet.tsx`, `layout/MobileNotiOverlay.tsx`, `layout/Header.tsx`, `player/VolumeControl.tsx`, `post/partials/PostMedia.tsx`, `modals/MobileNowPlaylistModal/*`도 `backdrop-blur`를 쓰지만 "모달"이 아니라 바텀시트/드롭다운 등 다른 UI 패턴일 수 있다 — 이번 조사 스코프에 포함할지는 baseline 단계에서 먼저 판별한다.
- 배경 클릭 시 닫히지 않는 2곳(`ContentWriteModal`, `PrivacyConsentModal`)은 의도된 동작(실수로 내용을 날리지 않도록)일 가능성이 있다 — 공통화하면서 이 차이를 없애면 안 되고, 옵션으로 유지해야 한다.
