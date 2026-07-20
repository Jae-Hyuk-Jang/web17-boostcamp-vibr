# Regression Plan — modal-shell-duplication

`ModalShell`은 아직 존재하지 않는 신규 컴포넌트이므로, 그 자체는 **계약 테스트**(의도한 동작을 명세하는 테스트)로 시작한다. 반면 8개 기존 모달은 이미 서로 다른 방식으로 동작하고 있고 그중 7개는 테스트가 0개(baseline.md)이므로, 전환 전에 **각 모달의 현재 배경-클릭-닫기/버튼-닫기 동작을 먼저 특성화**한다.

## ModalShell(신규) — 계약 테스트 대상

| 시나리오                                      | 기대 동작                                 | 이유                                                                                                       |
| --------------------------------------------- | ----------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `closeOnBackdrop=true`(기본값)일 때 배경 클릭 | `onClose` 호출됨                          | 6개 모달의 기존 동작(닫힘)을 이 옵션으로 표현하기 때문                                                     |
| `closeOnBackdrop=false`일 때 배경 클릭        | `onClose` 미호출                          | `ContentWriteModal`/`PrivacyConsentModal`의 기존 동작(안 닫힘) 보존                                        |
| 패널(children) 내부 클릭                      | `onClose` 미호출(버블링으로 오작동 안 함) | UserListModal/PlaylistPickerModal이 기존에 별도 overlay div로 이 문제를 피해온 방식을 하나의 구현으로 대체 |
| 렌더링 결과                                   | `role="dialog"`, `aria-modal="true"` 존재 | brief-fixed.md Success Criteria 3                                                                          |
| z-index                                       | `MODAL_Z_INDEX` 상수값 적용됨             | diagnosis.md의 결함 위험(모바일 하단 네비게이션에 가려짐) 해소 대상                                        |

## 기존 8개 모달 — 전환 전 특성화 대상

| 모달                     | 현재 배경 클릭 구현 방식                                                                      | 특성화해야 할 것                                                                                                                                                                     | 기존 안전망 |
| ------------------------ | --------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------- |
| `PostCardDetailModal`    | 데스크탑: 별도 backdrop div(onClick)+패널 stopPropagation. 모바일: 별도 backdrop div(onClick) | 데스크탑 쪽은 `PostCardDetailModal.test.tsx`가 이미 `getByRole('dialog')` 클릭으로 검증하고 있음(#56) — **추가 작성 불필요**. 모바일 backdrop은 미검증 상태로 남아 있어 필요 시 보강 | 있음(부분)  |
| `LoginModal`             | 단일 div `onMouseDown` + `e.target === e.currentTarget`                                       | 배경 클릭 시 닫힘, X 버튼 클릭 시 닫힘                                                                                                                                               | 없음        |
| `PlaylistDetailModal`    | 단일 div `onMouseDown` + `e.target === e.currentTarget`                                       | 배경 클릭 시 닫힘                                                                                                                                                                    | 없음        |
| `UserListModal`          | 별도 `absolute inset-0` overlay div(onClick)                                                  | 배경 클릭 시 닫힘, X 버튼 클릭 시 닫힘                                                                                                                                               | 없음        |
| `PlaylistPickerModal`    | 별도 `absolute inset-0` overlay div(onClick)                                                  | 배경 클릭 시 닫힘, X 버튼 클릭 시 닫힘                                                                                                                                               | 없음        |
| `MobileNowPlaylistModal` | 단일 div `onClick`                                                                            | 배경 클릭 시 닫힘                                                                                                                                                                    | 없음        |
| `ContentWriteModal`      | 없음(배경 클릭으로 안 닫힘)                                                                   | 배경 클릭해도 **안 닫힘**을 유지 확인(현재 동작 보존이 핵심)                                                                                                                         | 없음        |
| `PrivacyConsentModal`    | 없음(배경 클릭으로 안 닫힘)                                                                   | 배경 클릭해도 **안 닫힘**을 유지 확인                                                                                                                                                | 없음        |

## 테스트 접근

- `PostCardDetailModal.test.tsx`(#56)에서 이미 검증된 패턴을 그대로 따른다: 실제 zustand 스토어(`useModalStore` 등) 사용 + 네트워크를 부르는 훅/자식 컴포넌트만 mock.
- 각 모달마다 최소 특성화 테스트 파일을 새로 만든다(`{ModalName}.test.tsx`) — 이번 사이클의 핵심 관찰 지점은 "배경 클릭 후 `closeModal`(또는 해당 모달의 닫기 콜백)이 호출되는지 여부"이므로, `useModalStore`의 `closeModal`을 스파이하거나 실제 스토어 상태 변화(`isOpen`)를 확인하는 두 방법 중 각 모달의 기존 구조에 맞는 쪽을 고른다.
- `ModalShell` 자체는 아직 소비자가 없는 상태로 먼저 만들고 계약 테스트를 통과시킨 뒤, 모달을 하나씩 전환하면서 그 모달의 특성화 테스트가 **코드 수정 없이(mock 대상 조정은 예외)** 계속 통과하는지 확인한다 — #58에서 썼던 패턴과 동일하다.

## Seam

이번 대상은 전부 동기적인 클릭/이벤트 핸들러라 `Date.now`/`setInterval` 같은 외부효과가 없다 — 별도 seam이 필요 없다.

## z-index 개선의 검증 한계

diagnosis.md에서 Inference로 남긴 "모바일에서 하단 네비게이션에 모달이 가려질 가능성"은 jsdom 기반 RTL 테스트로는 검증할 수 없다(실제 페인트/스태킹 순서는 브라우저 렌더링 문제). 자동화 테스트는 "z-index 값이 상수와 일치하는지"까지만 확인하고, 실제 겹침 개선 여부는 이슈 구현 완료 후 `pnpm dev`로 모바일 뷰포트에서 육안 확인한다(regression-plan 대상 밖, result.md에 기록).

## 산출물

- 이슈 분해(Stage 5)에서: (1) `ModalShell`/`ModalCloseButton` 신설 + 계약 테스트, (2) 모달별 특성화 테스트 + 전환(가능하면 레이아웃 충돌 위험이 낮은 모달부터), (3) 결과 검증으로 나눈다.

---

**[GATE 4]** 위 계약 테스트 대상과 8개 모달의 특성화 계획을 확인해주세요. 확인되면 단계 5(이슈 분해)로 넘어가겠습니다.
