# 버튼 설계 분석 — `Button`이 왜 15%만 커버하는가

`shared-component-duplication` 사이클(#101~#108)에서 공용 `Button`(variant: primary/secondary/danger, size: sm/md/icon)을 만들었지만, 저장소 전체 58개 `<button>` 파일 중 9개(15%)만 전환됐다. 그 이유를 실제 코드를 다시 조사해 정리한다.

## 핵심 수치

- 아직 raw `<button>`이 남은 파일: **53개**(전환 후 기준)
- 그중 className이 있는 버튼 라인: **66개**
- **배경색도 테두리도 없는("bare") 버튼: 54개(66개 중 82%)**
- 배경 또는 테두리로 장식된 버튼(`Button`이 다룰 수 있는 후보군): **12개(18%)**

즉 `Button`이 다루는 "장식이 있는 버튼" 자체가 전체 버튼 population의 5분의 1도 안 된다. 나머지 82%는 애초에 `Button`의 설계 대상이 아니었다.

## 4가지 생김새(shape)

실제 코드에서 관찰되는 버튼은 색이 아니라 **생김새(shape) 기준으로 4가지 계열**로 나뉜다. `Button`은 이 중 2개만 지원한다.

| shape       | 특징                                                                        | `Button` 지원                       | 대표 예시(전환 전 기준)                                                                                                                                                                                                                                                                |
| ----------- | --------------------------------------------------------------------------- | ----------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **filled**  | 배경색 꽉 참, 보통 `text-white`                                             | ✅ (`variant="primary"`/`"danger"`) | `ContentWriteModal` 등록, `QueueList` archive/add, `NowPlayingMetaActions` save/post, `PlaylistPickerModal` 생성, `PlaylistDetailModal Header` 재생, `PostDetailCommentComposer` 전송, `NotiDrawerContent` 모두읽음, `ConfirmOverlay` 확인 — **8개 확인, 전부 이번 사이클에서 전환됨** |
| **outline** | 배경 없음(또는 `bg-white`), `border-2 border-primary`                       | ✅ (`variant="secondary"`)          | `MobileNowPlaylistModal` Clear, `PlaylistDetailModal Header` 이름변경/수정/삭제 아이콘 4개, `ConfirmOverlay` 취소, `GoogleLoginButton`/`TmpLoginButton`(단, `border`(1px)로 두께가 달라 완전히는 안 맞음) — **8개 확인, 6개 전환됨**                                                   |
| **ghost**   | 평소엔 배경·테두리 투명, `hover:border-*`/`hover:shadow-*`로만 드러남       | ❌                                  | `MiniPlayerBar`의 저장/추천 아이콘(`border-transparent hover:border-accent-cyan`/`hover:border-accent-pink`), `TrackItem`의 보관함/추천 아이콘(`border-gray-3 hover:bg-white hover:shadow`) — **최소 4개 확인, 0개 전환**                                                              |
| **bare**    | 배경·테두리 전혀 없음, `hover:text-*` 또는 `hover:bg-*`(원형 아이콘 배경)만 | ❌                                  | 체크박스, chevron 이동, 삭제 아이콘, 탭 전환, 텍스트 링크, 드롭다운 메뉴 항목 등 — **54개, 압도적 다수, 0개 전환**                                                                                                                                                                     |

## 색(color) 축도 따로 있다

shape와 별개로 색상도 다양하다. `Button`은 `primary`(네이비)와 `accent-pink`만 variant에 내장돼 있는데, 실제로는:

| 색 계열             | 사용처                                                                                                                                      | `Button` 대응                                                                                    |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| `primary`(네이비)   | 대부분의 filled/outline                                                                                                                     | `variant="primary"`/`"secondary"`로 커버                                                         |
| `accent-pink`       | 삭제/추천 등 강조 액션                                                                                                                      | `variant="danger"`로 커버                                                                        |
| `accent-cyan`       | `PwaInstallBanner` 설치 버튼, `MiniPlayerBar`/`QueueList` hover 그림자 색                                                                   | **variant 없음**                                                                                 |
| 브랜드 고유색       | `GoogleLoginButton`(흰 배경), `SpotifyLoginButton`(`#1ED760`)                                                                               | **의도적으로 앱 팔레트와 다름 — variant화하면 안 됨**                                            |
| raw Tailwind 팔레트 | `ErrorScreen`(`red-600`), `LoginRequestScreen`(`accent-yellow`), `ConfirmToast`(`gray-200`/`red-500`), `ProfileInfo`(`green-600`/`red-500`) | **variant 없음, `docs/design-system.md` §11이 이미 "raw 회색/색상 혼용"을 알려진 불일치로 지적** |
| 조건부 다중 스킴    | `PrivacyConsentForm` 제출 버튼(`isRequiredChecked`에 따라 색 전체가 바뀜, `disabled` 속성과 별개)                                           | **`Button`의 disabled 의사 클래스 모델과 안 맞음**                                               |

## 결론: 재사용성을 높이려면 무엇을 고쳐야 하는가

1. **shape와 color를 두 개의 독립된 prop 축으로 분리한다.** 지금처럼 `variant`가 색+모양을 한 번에 묶으면, 색이 하나 늘 때마다(`cyan` 등) variant 이름도 같이 늘어야 한다. `shape`(filled/outline/ghost/bare) × `color`(primary/pink/cyan)로 나누면 조합이 곱셈으로 늘어도 API는 안 늘어난다.
2. **`bare`와 `ghost` shape을 추가한다.** 이 둘을 더하면 전체 population의 82%+α를 커버권 안으로 들여올 수 있다. 특히 `bare`는 지금의 `filled`/`outline`보다 오히려 구현이 단순하다(`p-* rounded-full hover:bg-gray-4 hover:text-*` 수준).
3. **브랜드색/raw 팔레트/조건부 다중 스킴은 애초에 `Button`의 대상이 아니다.** 이 그룹을 억지로 편입시키려 하지 않는 게 맞다 — `docs/design-system.md` §11의 "raw 팔레트 혼용" 지적은 `Button`이 아니라 별도의 색상 토큰 정리 작업(#98과 유사한 성격)으로 다뤄야 한다.
4. **size는 추측이 아니라 실측값에서 뽑는다.** 이번에 실제로 관찰된 padding 조합은 `p-1`/`p-1.5`/`p-2`(아이콘), `px-3 py-1`/`px-3 py-1.5`(작은 텍스트+아이콘), `px-6 py-2.5`/`px-8 py-2.5`(큰 CTA) 정도로, 지금의 `sm`/`md`/`icon` 3종보다 더 세분화하거나 다른 값으로 조정할 여지가 있다.

## 이 분석의 한계

- "bare 54개"는 `grep`으로 배경/테두리 클래스 유무만 기계적으로 판별한 수치라, 그 안에서도 서로 다른 하위 패턴(체크박스 토글 vs 텍스트 링크 vs 원형 hover 배경)이 섞여 있다 — 전부 동일한 하나의 `bare` shape로 묶일 수 있는지는 별도 확인이 필요하다.
- `ghost` 4개, `outline` 8개, `filled` 8개는 이번 세션에서 실제로 파일을 읽으며 확인한 것들이라 개수가 정확하지만, 전수 조사는 아니다 — 저장소 전체에 더 있을 수 있다.
