# Result — modal-composition-structure

## 변경 요약

5개 이슈로 나눠 진행했다.

1. **#88** — `ContentWriteModal`의 자기참조 배럴 import(`from './index'`)를 개별 경로 import(`./partials/CoverImgUploader` 등)로 변경. 프로덕션 코드 동작 변화 없음, 순수 import 경로 수정.
2. **#89** — `ModalPanel` 컴포넌트 신설. `ModalShell`이 backdrop/판정/z-index/접근성을 캡슐화하듯, `ModalPanel`은 패널 컨테이너 공통 뼈대(`bg-white border-2 border-primary rounded-3xl overflow-hidden flex flex-col`)만 캡슐화하고 크기·그림자·애니메이션은 `className`으로 각 모달이 계속 소유하게 했다. 아직 어떤 모달도 쓰지 않는 안전한 상태로 병합.
3. **#90** — 7개 닫기 버튼(`ContentWriteModal`, `LoginModal`, `UserListModal`, `PlaylistPickerModal`, `PrivacyConsentModal`, `MobileNowPlaylistModal`, `PostCardDetailModal` 모바일)을 이미 존재하지만 안 쓰이던 `ModalCloseButton`으로 전환. 각 모달의 기존 시각적 차이(아이콘 크기·hover 색상·bare 스타일)는 `className`/`iconClassName`으로 보존. `MobileNowPlaylistModal`이 쓰던 `title` 툴팁을 지원하기 위해 `ModalCloseButton`에 `title` prop을 신규 추가.
4. **#91** — 6개 모달(`ContentWriteModal`, `LoginModal`, `PlaylistDetailModal`, `PlaylistPickerModal`, `UserListModal`, `PrivacyConsentModal`)의 패널 컨테이너를 `ModalPanel`로 전환. **계획과 달리** `PrivacyConsentModal`은 원래 `flex`/`flex-col`/`overflow-hidden`이 없던 유일한 모달이었는데, `ModalPanel`의 공통 기본 클래스에 포함되며 다른 6곳과 동일한 패널 뼈대를 갖게 됐다(자식이 헤더+바디 두 블록뿐이라 시각적으로는 동일하게 렌더링됨, 실제 확인은 아래 "개발환경 실동작 확인" 참고). `PostCardDetailModal` 데스크탑 패널(`rounded-2xl`/`shadow-2xl`/`max-w-5xl`)은 계획대로 전환 대상에서 제외.
5. **#92**(이 문서) — 최종 검증.

## Before / After

| 항목                                     | Before(prd.md 기준선)                                                             | After                                                                                                                                                                        |
| ---------------------------------------- | --------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `madge --circular` 전체 순환 참조        | 13건                                                                              | **12건** — 모달 도메인(`ContentWriteModal`) 0건                                                                                                                              |
| `ModalCloseButton` 실사용처              | 0곳                                                                               | **7곳**(`ContentWriteModal`, `LoginModal`, `UserListModal`, `PlaylistPickerModal`, `PrivacyConsentModal`, `MobileNowPlaylistModal`, `PostCardDetailModal` 모바일)            |
| `ModalPanel` 실사용처                    | 존재하지 않음                                                                     | **6곳**(`ContentWriteModal`, `LoginModal`, `PlaylistDetailModal`, `PlaylistPickerModal`, `UserListModal`, `PrivacyConsentModal`)                                             |
| 닫기 버튼 마크업 구현                    | 8곳 중 7곳이 각자 인라인 `<button><X /></button>` 직접 구현(4가지 className 변형) | 7곳 전부 `<ModalCloseButton />` 호출 하나로 수렴(시각적 변형은 prop으로 유지, JSX 반복은 사라짐)                                                                             |
| 패널 컨테이너 마크업 구현                | 7곳이 각자 인라인 `<div className="bg-white border-2 ...">` 직접 구현             | 6곳이 `<ModalPanel>` 호출로 수렴, 1곳(`PostCardDetailModal` 데스크탑)은 의도적 예외로 유지                                                                                   |
| 모달 8개 폴더 프로덕션 코드 총 줄 수     | 2,736줄                                                                           | 2,744줄(`ModalPanel`+`ModalCloseButton` 확장분 포함, +8줄)                                                                                                                   |
| `apps/web` 전체 Jest 테스트              | 48개(13개 파일)                                                                   | **51개**(14개 파일, `ModalPanel.test.tsx` 3개 신규) — **기존 8개 모달 테스트 파일은 전부 무수정 통과**(직전 `modal-shell-duplication` 사이클과 달리 쿼리 조정도 필요 없었음) |
| `pnpm lint`/`check-types`/`test`/`build` | 전부 PASS(prd.md, 2026-07-21 실행)                                                | 전부 PASS(2026-07-21 재실행)                                                                                                                                                 |

프로덕션 코드 줄 수가 줄지 않고 소폭(+8줄) 늘어난 점은 있는 그대로 밝힌다 — `<ModalCloseButton onClick={...} className="..." iconClassName="..." />`처럼 여러 prop을 넘기는 호출부가 prettier에 의해 여러 줄로 줄바꿈되면서, 기존의 압축된 한 줄 인라인 마크업보다 호출부 자체는 길어진 경우가 있었다. Success Criteria는 "줄 수 감소"가 아니라 "중복 마크업의 수렴"이었고, 이 기준은 위 표의 실사용처 수·변형 수 항목으로 확인된다.

## 개발환경 실동작 확인

`packages/dto` 변경은 없어 `pnpm dto` 재빌드는 해당 없음.

`run` 스킬을 통해 Playwright(headless Chromium)로 `apps/web` dev 서버(`pnpm dev`, webpack 모드)를 직접 기동하고 실제 화면을 조작해 확인했다:

- dev 서버가 컴파일 에러 없이 기동됨(`✓ Ready in 1717ms`, `GET / 200`).
- 사이드바의 "로그인" 버튼을 클릭해 `LoginModal`을 열고 스크린샷으로 확인 — `ModalPanel`(흰 배경·둥근 모서리·하드 섀도)과 `ModalCloseButton`(X 아이콘, 우측 상단)이 시각적으로 정상 렌더링됨.
- `ModalCloseButton` 클릭으로 모달이 닫히는지 확인(`role="dialog"` 요소 개수 0으로 확인).
- 모달을 다시 열고 배경(backdrop) 클릭으로도 닫히는지 확인(`closeOnBackdrop` 기본값 `true` 동작 재확인, `role="dialog"` 요소 개수 0으로 확인).
- 브라우저 콘솔 에러를 수집한 결과 `Failed to load resource: 500` 2건이 있었으나, dev 서버 로그(`Error: connect ECONNREFUSED 127.0.0.1:3002`)로 원인을 확인한 결과 이 환경에 `apps/api`(백엔드, 3002번 포트)와 MySQL/Neo4j/Redis 인프라를 기동하지 않았기 때문이며, 이번 변경(모달 마크업 리팩터링)과는 무관하다.

**직접 확인하지 못한 부분**: `UserListModal`, `PlaylistPickerModal`, `PlaylistDetailModal`, `MobileNowPlaylistModal`, `PostCardDetailModal`, `PrivacyConsentModal`은 로그인 세션 또는 특정 앱 상태(재생 큐에 곡 존재, 특정 게시글 조회 등)가 있어야 열리는 모달이라, 백엔드 미기동 환경(`apps/api`, MySQL, Neo4j, Redis 전부 미기동)에서는 실제 사용자 흐름으로 도달하지 못했다. 이 6개 모달은 Jest 특성화 테스트(각 파일 무수정 통과, 위 표 참고)로 DOM 구조·클릭 동작을 검증했지만, 실제 브라우저에서의 시각적 렌더링은 이번 세션에서 육안 확인하지 못했다. 사용자가 `docker compose up -d && pnpm dev`로 전체 스택을 띄운 뒤, 특히 `PrivacyConsentModal`(패널 기본 클래스가 새로 추가된 유일한 모달)과 `PlaylistDetailModal`(하드 섀도 색상이 `#00214D`로 다른 모달과 다름)을 육안으로 한 번 확인해주시길 권장한다.

## Behavior Verification

- prd.md의 Behavior Invariants 6개 중, 이번 사이클이 직접 다룬 3개를 확인했다:
  - **모달 열림/닫힘 트리거 유지**: 8개 모달 테스트 전부 무수정 통과로 확인.
  - **배경 클릭 닫힘/안 닫힘 차이(`closeOnBackdrop`) 유지**: `ContentWriteModal`/`PrivacyConsentModal`은 배경 클릭해도 안 닫힘, 나머지는 닫힘 — 각 모달의 특성화 테스트가 무수정 통과했고, `LoginModal`은 위 개발환경 확인에서 실제 브라우저로도 재확인.
  - **닫기 버튼 클릭 시 전부 닫힘**: 8개 모달 테스트로 확인, 전환 전후 변화 없음. `LoginModal`은 실제 브라우저로도 재확인.
- `role="dialog"`/`aria-modal` 접근성 속성(7곳)은 `ModalShell`을 건드리지 않았으므로 코드 리뷰로 유지 확인.
- 반응형 분기(`PostCardDetailModal`, `MobileNowPlaylistModal`)는 건드리지 않았으므로 코드 리뷰로 유지 확인.
- ESC/뒤로가기 처리(`ModalContainer`)는 범위 밖이라 건드리지 않음, 코드 리뷰로 유지 확인.

## Decision Review

- **선택한 안(adr.md 안 2 — `ModalPanel` 신설 + `ModalCloseButton` 전환)**: 예상대로 두 컴포넌트 모두 `ModalShell`과 같은 계층(`components/` 최상위)에 무리 없이 자리 잡았고, 8개 모달 중 7곳의 닫기 버튼과 6곳의 패널이 계획대로 전환됐다.
- **ADR Consequences에서 미리 경고했던 위험이 실제로 확인됨**: "`ModalCloseButton`을 만들어놓고도 안 썼던 전례가 있으므로, 이번에도 컴포넌트만 만들고 전환은 안 함으로 끝날 위험이 있다"고 적어뒀는데, 이번엔 "신설"(#89)과 "전환"(#90/#91)을 같은 사이클의 순차 이슈로 묶어둔 덕분에 실제로 전환까지 완료됐다 — 이슈 분해 단계의 그 판단이 유효했다.
- **계획에 없던 발견**: `PrivacyConsentModal`이 유일하게 `flex`/`flex-col`/`overflow-hidden`이 없던 모달이었다는 사실은 adr.md 작성 시점엔 몰랐고, #91 구현 중 발견했다. `ModalPanel`의 공통 기본 클래스에 자연스럽게 편입되며 해결됐지만, 이런 종류의 "계획 단계에서 놓친 기존 불일치"가 실제 전환 과정에서 드러나는 경우가 있다는 걸 다시 확인했다(직전 `modal-shell-duplication` 사이클의 `PostCardDetailModal` z-60 발견과 같은 패턴).
- **`MobileNowPlaylistModal`의 `title` prop 추가**: adr.md의 Migration에는 없던 작은 확장이었다. `ModalCloseButton`이 애초에 `title` 속성을 지원하지 않아, 기존 툴팁 동작을 보존하려면 prop을 하나 늘려야 했다 — 계획한 컴포넌트 API가 실제 8개 사례의 variance를 완전히 커버하지 못했던 사례이며, 작은 범위 안에서 즉시 대응했다.

## Remaining Debt

- **`PostCardDetailModal` 데스크탑 패널은 `ModalPanel` 미적용 상태로 남음**: 디자인 레시피 자체가 다른 의도된 예외(adr.md 참고)라 지금 당장 문제는 아니다.
- **`PlaylistDetailModal`의 하드 섀도 색상(`#00214D`)이 다른 6곳(`var(--color-primary)`)과 여전히 다름**: `docs/design-system.md` §11에 이미 알려진 불일치로 기록돼 있었고, 이번 사이클은 Out of Scope로 유지했다(공용 `Button` 컴포넌트 신설과 같은 이유로 범위 밖).
- **저장소 전역 순환 참조 12건은 여전히 남아있음**(`hooks/index.ts`, `api/index.ts`, `stores`, `components/post`, `components/search`, `components/player`) — prd.md에서 이미 Out of Scope로 명시했고, 별도 후속 이슈가 필요하다.
- **`docs/conventions.md` §3.1의 배럴 "예외 없음" 규칙이 실제 코드(PR #84, 이번 사이클)와 계속 어긋난 상태로 남음** — 규칙 자체를 다시 쓰는 건 이번 범위 밖이었다.
- **6개 모달의 실제 브라우저 렌더링을 육안으로 확인하지 못함**(위 "개발환경 실동작 확인" 참고) — 백엔드 인프라가 필요해 이번 세션에서 도달 불가.

## Follow-ups

- 저장소 전역 순환 참조 12건을 다루는 별도 리팩터링 사이클을 제안한다(`hooks`/`api`/`stores`/`components/post`/`components/search`/`components/player`). 이번 사이클에서 쓴 것과 같은 "자기 배럴 재import" 패턴이 원인인 경우가 많아 보인다(예: `components/post/index.ts > components/post/PostCard.tsx`).
- `docs/conventions.md` §3.1의 배럴 규칙을 실제 코드 상태(개별 경로 import가 이미 31개+ 파일에서 표준이 됨)에 맞게 갱신하는 문서 작업을 제안한다.
- `docs/design-system.md` §11의 하드 섀도 색상 혼용(`#00214D` vs `var(--color-primary)`)과 공용 `Button` 부재는 여전히 유효한 후속 리팩터링 후보다.
- 사용자가 전체 스택(`docker compose up -d && pnpm dev`)에서 6개 미확인 모달(특히 `PrivacyConsentModal`, `PlaylistDetailModal`)을 육안으로 확인해주시길 권장한다.

---

**[GATE 3]** 위 Before/After, 개발환경 실동작 확인(6개 모달 미확인 부분 포함), Behavior Verification, 남은 부채를 확인해주시면 이 리팩터링 사이클(부모 이슈 #87)을 종료하겠습니다.
