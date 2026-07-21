# `components/ui/` 설계 분석

`shared-component-duplication` 사이클(#101~#108)에서 `components/` 최상위에 흩어져 있던 12개 loose 컴포넌트를 `components/ui/`로 모으고, 신규 `Button`을 더했다. 배럴(`index.ts`)은 없다 — PR #84/#94에서 두 번 겪은 자기참조 순환 참조 전례 때문에 전부 개별 경로(`@/components/ui/{Component}`)로 import한다.

## 한눈에 보기

| 컴포넌트             | 줄 수 | 실사용처                            | 역할                                                                                                                      |
| -------------------- | ----- | ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `LoadingSpinner`     | 7     | **13곳**                            | 로딩 스피너, `hStyle` prop으로 높이만 조절                                                                                |
| `ModalCloseButton`   | 25    | **8곳**                             | 모달 X 닫기 버튼(아이콘 전용), `className`/`iconClassName`으로 시각 커스터마이즈                                          |
| `Button`             | 35    | **9곳**                             | variant(primary/secondary/danger) × size(sm/md/icon) CTA 버튼, `tailwind-merge`로 className 오버라이드(`buttons.md` 참고) |
| `TickerText`         | 161   | **9곳**                             | 긴 텍스트 자동 스크롤(마퀴) 표시                                                                                          |
| `ModalShell`         | 29    | **7곳**                             | 모달 백드롭/배경 클릭 판정/`role="dialog"` 캡슐화                                                                         |
| `ModalPanel`         | 11    | **6곳**                             | 모달 패널 공통 뼈대(`bg-white border-2 rounded-3xl overflow-hidden flex flex-col`)                                        |
| `ConfirmOverlay`     | 64    | **3곳**                             | 삭제 등 확인/취소 다이얼로그(포털 렌더링)                                                                                 |
| `ErrorScreen`        | 28    | 1곳(`sidebar/Drawer.tsx`)           | 에러 상태 + 재시도 버튼                                                                                                   |
| `LoginRequestScreen` | 24    | 1곳(`app/profile/page.tsx`)         | 비로그인 사용자에게 로그인 유도                                                                                           |
| `PwaInstallBanner`   | 124   | 1곳(`app/layout.tsx`)               | PWA 설치 배너                                                                                                             |
| `PwaRegister`        | 28    | 1곳(`app/layout.tsx`)               | 서비스 워커 등록(프로덕션 전용)                                                                                           |
| `ToastContainer`     | 17    | 1곳(`app/layout.tsx`)               | `react-toastify` Provider 래퍼                                                                                            |
| `ConfirmToast`       | 30    | 1곳(`post/partials/PostHeader.tsx`) | 토스트 형태의 확인 다이얼로그                                                                                             |

## 관찰

### 1. "소비처 1곳"인 컴포넌트가 6개(전체의 절반)

`ErrorScreen`, `LoginRequestScreen`, `PwaInstallBanner`, `PwaRegister`, `ToastContainer`, `ConfirmToast`는 전부 실사용처가 정확히 1곳이다. 이 중 `PwaInstallBanner`/`PwaRegister`/`ToastContainer`는 `app/layout.tsx`에서만 쓰이는 **앱 전역 싱글턴**이라 애초에 "여러 곳에서 재사용"이라는 공용 컴포넌트의 전제가 없다 — `components/ui/`보다는 `app/layout.tsx` 옆(예: `components/layout/` 또는 별도 `providers/` 폴더)이 실제 역할에 더 맞을 수 있다. `ErrorScreen`/`LoginRequestScreen`/`ConfirmToast`는 여러 도메인에서 잠재적으로 재사용될 수 있는 성격이라 지금 위치가 자연스럽다.

### 2. `ConfirmOverlay`와 `ConfirmToast`가 같은 문제를 다르게 푼다

둘 다 "확인/취소를 묻는" 컴포넌트지만 `ConfirmOverlay`는 모달형 포털, `ConfirmToast`는 `react-toastify` 토스트형이다. 색상도 다르다 — `ConfirmOverlay`의 확인 버튼은 `bg-accent-pink`(이번 사이클에서 `Button` `danger` variant로 전환), `ConfirmToast`는 `bg-red-500`(raw 색상이라 전환 안 함, `buttons.md` 참고). 두 컴포넌트를 하나로 합칠지, 왜 두 가지 패턴이 다 필요한지는 확인이 필요하다(호출부에 따라 모달 UX가 안 맞는 곳에 토스트를 쓰는 것일 수 있음 — 이 문서에서는 판단하지 않는다).

### 3. `Button`/`ModalCloseButton`/`ModalPanel`/`ModalShell` 4개가 사실상 "모달 인프라" 그룹

이 4개는 전부 모달 관련 소비처가 대부분이라(`Button`의 9곳 중 6곳이 모달), `components/ui/` 안에서도 암묵적으로 "모달용"과 "범용"이 섞여 있다. 지금은 파일 이름 규칙(`Modal` 접두사)으로만 구분되고 있다.

## 재사용 규모 분포

```
13곳 ██████████████████████████████████████████████████████████████ LoadingSpinner
 9곳 █████████████████████████████████████████████ TickerText, Button
 8곳 ██████████████████████████████████████████ ModalCloseButton
 7곳 ███████████████████████████████████████ ModalShell
 6곳 ██████████████████████████████████ ModalPanel
 3곳 █████████████████ ConfirmOverlay
 1곳 ██████ (×6개: ErrorScreen/LoginRequestScreen/PwaInstallBanner/PwaRegister/ToastContainer/ConfirmToast)
```

절반(6/13)이 소비처 1곳이라는 건 "공용 컴포넌트 폴더"라는 이름에 비해 실제 재사용 밀도가 낮다는 뜻이다. `README.md`가 제안한 대로, 이 6개 중 앱 전역 싱글턴 3개(`PwaInstallBanner`/`PwaRegister`/`ToastContainer`)는 재배치를 검토할 만하다.
