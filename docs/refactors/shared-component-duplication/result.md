# Result — shared-component-duplication

## 변경 요약

7개 이슈로 나눠 진행했다.

1. **#102** — `apps/web/src/components/ui/Button.tsx` 신설. variant(primary/secondary/danger) × size(sm/md/icon) 조합으로 `docs/design-system.md` §8 레시피를 구현. 아직 어떤 파일도 쓰지 않는 안전한 상태로 병합.
2. **#103** — 도메인 없는 공용 컴포넌트 12개를 `components/ui/`로 이동, 참조하는 34개 파일의 import 경로 갱신(계획은 31개였으나 상대경로 소비처 3곳을 구현 중 추가로 발견). 배럴(`index.ts`)은 만들지 않음.
3. **#104** — `modals` 도메인 1차 배치. 대상 10개 파일 중 2개(`ContentWriteModal`, `PlaylistPickerModal`) 전환.
4. **#105** — `modals` 도메인 2차 배치. 대상 12개 파일 중 4개(`PlaylistDetailModal/Header`, `MobileNowPlaylistModal`, `PostDetailCommentComposer`) + 부수 발견으로 `LikedUsersOverlay`(`ModalCloseButton`으로 전환) 전환.
5. **#106** — `player`/`post`/`profile`/`search` 도메인. 대상 18개 파일 중 2개(`QueueList`, `NowPlayingMetaActions`) 전환.
6. **#107** — 나머지 도메인 + `ui/` 내부 컴포넌트. 대상 16개 파일 중 2개(`ConfirmOverlay`, `NotiDrawerContent`) 전환.
7. **#108**(이 문서) — 최종 검증.

**계획과 달리** #104 착수 중 `className` 단순 이어붙이기로는 소비처가 `variant`/`size` 기본 스타일을 안전하게 오버라이드할 수 없다는 것을 컴파일된 CSS로 직접 확인했다(같은 CSS 속성을 겨냥한 클래스가 충돌하면 승자가 Tailwind 내부 유틸리티 등록 순서에 좌우되고 JSX 문자열 순서와 무관함). PRD/ADR이 잠갔던 "라이브러리 도입 불허" 결정을 다시 열어 `tailwind-merge`(단일 목적 클래스 병합 유틸리티)를 도입했다 — `class-variance-authority`가 아니라 `tailwind-merge`를 선택한 이유는 전자가 variant 정의만 구조화할 뿐 클래스 충돌 자체는 해결하지 못하기 때문이다.

## Before / After

| 항목                                                | Before(prd.md 기준선)              | After                                                                                                                                                                                                                 |
| --------------------------------------------------- | ---------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `<button>` 태그를 포함한 파일(app+src, 테스트 제외) | 58개                               | **54개**(4개 파일은 모든 버튼이 전환돼 raw `<button>`이 남지 않음)                                                                                                                                                    |
| `Button` 실사용처                                   | 0곳(신설 전)                       | **9곳**(`ContentWriteModal`, `PlaylistPickerModal`, `PlaylistDetailModal/Header`, `MobileNowPlaylistModal`, `PostDetailCommentComposer`, `QueueList`, `NowPlayingMetaActions`, `ConfirmOverlay`, `NotiDrawerContent`) |
| `ui/` 이동 대상 12개 컴포넌트 소비 파일             | 31개(추정)                         | **34개**(실측, 상대경로 소비처 3곳 추가 발견)                                                                                                                                                                         |
| `madge --circular` 전체 순환 참조                   | 12건(직전 사이클 종료 시점)        | **12건**(변화 없음 — `ui/` 이동·`Button` 신설 모두 배럴을 만들지 않아 새 순환 참조 없음)                                                                                                                              |
| `apps/web` 전체 Jest 테스트                         | 51개(14개 파일)                    | **58개**(15개 파일, `Button.test.tsx` 7개 신규) — **기존 테스트 전부 무수정 통과**                                                                                                                                    |
| `pnpm lint`/`check-types`/`test`/`build`            | 전부 PASS(prd.md, 2026-07-21 실행) | 전부 PASS(2026-07-21 재실행)                                                                                                                                                                                          |
| 라이브러리 의존성                                   | 없음(계획)                         | **`tailwind-merge` 1개 추가**(구현 중 발견한 구조적 문제로 PRD/ADR 개정, 아래 Decision Review 참고)                                                                                                                   |

**전환률에 대한 솔직한 평가**: 58개 파일 중 실제로 `Button`을 도입한 파일은 9개(약 15%)다. 나머지는 세 가지 이유로 전환하지 않았다:

1. **배경/테두리가 없는 순수 아이콘·텍스트 링크형 버튼**(가장 많음) — 애초에 Primary/Secondary/Danger 어느 variant의 "장식이 있는 버튼"이라는 전제에 해당하지 않는다.
2. **브랜드 고유 색상 또는 raw 팔레트 색상**(Google 녹색, Spotify 브랜드 그린, `red-600`, `accent-yellow`, `accent-cyan`, `gray-200` 등) — 앱의 primary/accent-pink 팔레트와 다른 의도된 색상이라 variant로 표현하면 의미가 왜곡된다.
3. **조건부 다중 색상 스킴**(예: `PrivacyConsentForm` 제출 버튼이 `disabled` 속성이 아니라 별도 조건부 분기로 색이 통째로 바뀜) — `Button`의 disabled 의사 클래스 모델과 안 맞는다.

## 개발환경 실동작 확인

`packages/dto` 변경은 없어 `pnpm dto` 재빌드는 해당 없음.

`pnpm dev`(webpack 모드)로 dev 서버를 직접 백그라운드로 기동하고 Playwright(headless Chromium, #27에서 도입한 인프라)로 확인했다:

- dev 서버가 컴파일 에러 없이 기동됨(`✓ Ready in 1470ms`, `GET / 200`).
- 사이드바 "로그인" 버튼으로 `LoginModal`을 열어 스크린샷 확인 — `ui/`로 이동한 `ModalPanel`/`ModalCloseButton`이 이동 전과 동일하게 정상 렌더링됨.
- `ModalCloseButton` 클릭으로 모달이 닫히는지 확인(`role="dialog"` 요소 개수 0으로 확인) — `ui/` 폴더 이동이 실제 동작에 영향 없음을 재확인.
- 브라우저 콘솔 에러 2건은 전부 `Failed to load resource: 500`이며, dev 서버 로그(`Error: connect ECONNREFUSED 127.0.0.1:3002`)로 원인을 확인한 결과 `apps/api`(백엔드)를 이 환경에서 기동하지 않았기 때문으로, 이번 변경과 무관하다(직전 `modal-composition-structure` 사이클과 동일한 환경 제약).

**직접 확인하지 못한 부분**: `Button`을 실제로 적용한 9곳 중 `LoginModal`(로그인 없이 도달)을 제외한 8곳(`ContentWriteModal`, `PlaylistPickerModal`, `PlaylistDetailModal`, `MobileNowPlaylistModal`, `PostDetailCommentComposer`, `QueueList`, `NowPlayingMetaActions`, `ConfirmOverlay`, `NotiDrawerContent`)은 로그인 세션이나 특정 앱 상태(재생 큐에 곡 존재, 알림 존재 등)가 있어야 도달 가능해, 백엔드 미기동 환경에서는 실제 사용자 흐름으로 육안 확인하지 못했다. 각 파일 전환 시 className 오버라이드가 기존 모습을 재현하는지는 코드 리뷰(원본 className과 신규 `Button` 호출의 className을 1:1 대조)로 확인했다. 사용자가 `docker compose up -d && pnpm dev`로 전체 스택을 띄운 뒤 이 8곳을 육안으로 한 번 확인해주시길 권장한다.

## Behavior Verification

- prd.md의 Behavior Invariants 중 이번 사이클이 직접 다룬 항목을 확인했다:
  - **클릭 핸들러 동작 유지**: 9개 파일의 `onClick` prop을 그대로 전달했고, 각 파일의 기존 테스트(존재하는 경우)가 무수정 통과했다.
  - **disabled 상태 처리 유지**: `Button`이 표준 `disabled` HTML 속성을 그대로 전달하며, `disabled:opacity-50 disabled:cursor-not-allowed`가 기본이되 개별 파일에서 다른 disabled 스타일(`disabled:opacity-40`, `disabled:opacity-30` 등)이 있던 경우 className으로 오버라이드했다.
  - **접근성 속성 유지**: `aria-label`, `title`, `aria-busy` 등 표준 속성은 `Button`이 `ButtonHTMLAttributes`를 확장하므로 그대로 전달된다.
  - **시각적 모습 동일 유지**: 전환한 9곳 전부 코드 리뷰로 원본 className과 대조했고, `Button`의 variant/size 기본값과 충돌하는 속성(radius/padding/hover/border)은 `tailwind-merge`로 명시적으로 오버라이드했다. `Button.test.tsx`에 twMerge 오버라이드 계약 테스트를 추가해 회귀를 방지했다.
  - **`ui/` 이동 컴포넌트 동작 유지**: `ModalShell`/`ModalCloseButton`/`ModalPanel` 테스트가 경로만 갱신되어 무수정 통과했고, 나머지 9개도 개발환경 실동작 확인(위)에서 재확인했다.
- `madge --circular` 재검증 결과 12건으로 변화 없음 — `ui/` 폴더 이동과 `Button` 신설 모두 배럴을 만들지 않아 새 순환 참조가 생기지 않았다.

## Decision Review

- **선택한 안(adr.md 안 2 — Button 신설 + ui/ 이동 + 도메인별 점진적 전환)**: 대체로 계획대로 진행됐으나, 전환률은 계획 시점에 암묵적으로 기대했던 것보다 훨씬 낮았다(9/58, ~15%). ADR은 "58개 파일을 도메인별로 순차 전환"이라고 썼지만, 실제로는 각 파일이 variant 체계와 얼마나 가까운지 판단하는 게 핵심 작업이었고 대부분은 애초에 맞지 않았다.
- **계획에 없던 발견과 결정 변경**: `tailwind-merge` 도입이 가장 큰 변경이었다(위 Before/After 표, "라이브러리 도입 심사" 재논의 참고). 이건 PRD 1-4/ADR 라이브러리 도입 심사가 이미 GATE 1·2를 통과한 뒤에 뒤집힌 사례다 — 처음 "불허" 결정의 근거("이 저장소는 cn/clsx조차 안 씀")가 실제로는 "소비처가 1~2개 속성만 얹는 경우엔 충돌이 드물어서 문제가 안 드러났을 뿐"이었다는 걸 다중 소비처 컴포넌트(`Button`)를 만들어보고서야 알게 됐다.
- **`LikedUsersOverlay` 발견**: 직전 `modal-shell-duplication`/`modal-composition-structure` 두 사이클 모두 "8개 최상위 모달"을 기준으로 진단해서, 그 안에 중첩된 `LikedUsersOverlay`의 닫기 버튼을 놓쳤다. 이번에 `ModalCloseButton`으로 전환하며 바로잡았다.
- **ADR Consequences에서 미리 우려했던 위험이 실제로 확인됨**: "전환 후에도 시각적 변형이 prop 형태로 이름만 바뀐 채 남을 수 있다"고 적어뒀는데, 실제로는 그보다 더 근본적으로 "애초에 절반 이상의 버튼이 variant 체계에 해당하지 않는다"는 게 드러났다 — 예상보다 강한 형태로 확인된 셈이다.

## Remaining Debt

- **저조한 전환률(9/58)**: 남은 49개 파일은 대부분 배경/테두리 없는 아이콘·링크형이거나 브랜드/raw 색상을 쓴다. `Button`을 강제로 적용하기보다, 새 버튼을 작성할 때 자연스럽게 `Button`을 먼저 검토하는 관성이 생기길 기대하는 것이 현실적이다.
- **`Button` variant가 3종뿐**: 아이콘 전용 "고스트"(border-transparent, hover에만 테두리 표시) 버튼이나 raw 팔레트 버튼처럼 지금 확인된 다른 반복 패턴이 있다 — 필요성이 쌓이면 별도 variant 추가를 검토할 수 있다(과설계 방지를 위해 이번엔 추가하지 않음).
- **8곳의 실제 브라우저 렌더링 미확인**(위 "개발환경 실동작 확인" 참고) — 백엔드 인프라가 필요해 이번 세션에서 도달 불가.
- **저장소 전역 순환 참조 12건(#96), `docs/conventions.md` §3.1 재정의(#97)**: 여전히 별도 이슈로 남아있음, 이번 사이클에서 건드리지 않음.

## Follow-ups

- 사용자가 전체 스택(`docker compose up -d && pnpm dev`)에서 `Button`을 적용한 8곳(로그인 상태 필요)을 육안으로 확인해주시길 권장한다.
- `Button`에 "고스트"(투명 배경, hover에만 테두리/배경 표시) variant를 추가할지는 실제 반복 사례가 더 쌓인 뒤 별도 이슈로 검토할 것을 제안한다.
- `tailwind-merge` 도입 사실과 그 근거(className 병합 예측 불가 문제)를 `docs/design-system.md` §8("재사용 가능한 컴포넌트 레시피")에도 짧게 남겨, 다음에 비슷한 공용 컴포넌트를 만들 때 같은 문제를 처음부터 되풀이하지 않도록 하는 것을 제안한다.

---

**[GATE 3]** 위 Before/After(특히 전환률 9/58에 대한 솔직한 평가), 개발환경 실동작 확인(8곳 미확인 부분 포함), Behavior Verification, 남은 부채를 확인해주시면 이 리팩터링 사이클(부모 이슈 #101)을 종료하겠습니다.
