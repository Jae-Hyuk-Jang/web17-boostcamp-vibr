# PRD — post-detail-modal-prop-redistribution

## 문제 정의

이슈 #252(부모 이슈)와 brief-original.md 요약: `usePostDetailModal` 오케스트레이션 훅이 6개 훅을 합성해 반환한 결과를, `PostCardDetailModal.tsx`가 항상 동시에 마운트되는 Desktop Shell/Mobile Sheet 두 곳에 나눠 넘기고, 각 Shell이 다시 leaf 컴포넌트(`PostDetailBody`/`PostDetailActions`/`PostDetailCommentComposer`)에 `Pick<>`으로 좁힌 하위 집합을 재전달한다 — 같은 데이터가 훅→부모→Shell→leaf까지 최대 2홉으로 재스레딩된다.

**왜 지금 다뤄야 하는가**: 사용자가 이 저장소 전반의 컴포넌트/훅 설계를 시니어 개발자 시점에서 재검토하다가 발견한 문제로, player 도메인(#251)·playlist 도메인(#253)과 함께 "zustand/TanStack Query 도입 목적과 실제 컴포넌트 구독 경계가 어긋나 있다"는 동일 패턴의 세 사례 중 하나다. 이 파일은 그중 이미 한 차례(#125~131/#134) 리팩터링을 거친 영역이라, "왜 그때 안 잡혔는가"까지 함께 진단할 가치가 있다.

## 비판적 진단 (시니어 개발자 시각)

### 근거

- **Fact** — `PostCardDetailModal.tsx:32-58`는 `<PostCardDetailModalMobileSheet>`와 `<PostCardDetailModalDesktopShell>`을 조건 없이 둘 다 렌더링한다. 화면 크기에 따른 조건부 렌더링이 아니라 각 Shell 내부의 CSS 클래스(`lg:hidden`/`hidden lg:flex`)로만 전환된다(직접 코드 확인).
- **Fact** — `PostCardDetailModalDesktopShellProps`는 `Pick<UsePostDetailModalResult['reactions'], ...>`로 11개 필드를, `PostCardDetailModalMobileSheetProps`는 같은 `reactions`에서 7개 필드를 별도로 `Pick`한다. 두 타입 사이에 7개 필드(`comments`/`isCommentsLoading`/`isAuthenticated`/`isSubmittingComment`/`commentText`/`setCommentText`/`submitComment`)가 겹친다(직접 코드 확인).
- **Fact** — `PostDetailBody.tsx`/`PostDetailActions.tsx`는 저장소 **초기 커밋부터 존재**하는 leaf 파일이다(`git log --follow` 확인). `PostCardDetailModalDesktopShell.tsx`/`MobileSheet.tsx`는 `post-detail-modal-responsibility-decomposition` 사이클의 #134 커밋에서 신설됐다(`git log --diff-filter=A` 확인). 즉 Shell 계층은 이미 존재하던 leaf 파티셜과 최상위 Modal **사이에 나중에 삽입**된 것이고, 이 삽입이 기계적으로 홉을 1(Modal→leaf 직접)에서 2(Modal→Shell→leaf)로 늘렸다.
- **Fact** — 같은 사이클의 `result.md`(Decision Review, 57행)는 "`PostCardDetailModal`의 3개 자식 컴포넌트로의 props 분배가 prop drilling인지 검토(**단일 홉 전달이라 해당 없음**, 다만 reactions/post 과다 전달은 확인돼 실제로 좁힘)"이라고 명시적으로 결론 내렸다. 이 검토는 `Modal → {MobileSheet, DesktopShell, LikedUsersOverlay}` 1홉만 확인한 것으로 보이고, `Shell → leaf partial`이라는 이미 존재하던 2번째 홉은 재검토 대상에 없었다(원문 인용, Inference: 왜 빠졌는지는 추정).
- **Fact** — `postDetailQueryKey` 캐시를 다른 컴포넌트가 직접 구독하는 선례가 이미 있다 — `PostCard.tsx`는 `usePostCacheSync`로 같은 캐시를 `enabled:false` 구독 전용으로 직접 읽는다(architecture-diagram-drift 사이클에서 확인한 사실, 재확인 완료).
- **Fact** — 안전망: `PostCardDetailModal.test.tsx` 14개, `usePostDetailModal.test.ts` 9개, `LikedUsersOverlay.test.tsx`(별도) 존재. `post-detail-modal-responsibility-decomposition` 종료 시점(13개/7개)보다 늘어나 있다(현재 코드 기준 재확인).

### 증상 → 원인 체인

증상: `reactions` 같은 객체에 필드 하나를 추가/변경하면 Desktop Shell과 Mobile Sheet 두 `Pick<>` 타입을 동시에 고쳐야 한다.
→ (왜?) 데이터가 리프 컴포넌트까지 도달하는 경로가 Modal→Shell→leaf 2홉이고, 두 Shell이 같은 상위 데이터에서 각자 다른 하위 집합을 다시 정의한다.
→ (왜?) Shell 계층(#134)이 "레이아웃 분기" 목적(모바일 바텀시트 vs 데스크탑 패널)으로 도입됐는데, 원래 Modal이 leaf에 직접 넘기던 데이터 전달 책임까지 같이 넘겨받았다 — 레이아웃 분기와 데이터 전달이 같은 컴포넌트에 묶였다.
→ 구조 원인: "레이아웃을 나누는 컴포넌트"와 "데이터를 배분하는 경계"가 동일시됐다. Shell은 반응형 레이아웃 전환만 책임지면 되는데, 실제로는 데이터 재분배 책임까지 떠안고 있다.

### 아키텍처 관점

- 이 패턴은 이 파일에 국한되지 않는다 — player 도메인(#251, `RightPanel`이 zustand를 대표 구독해 3개 자식에 재분배)과 playlist 도메인(#253, 로컬 state가 쿼리 캐시와 별도로 렌더링 소스)에서도 "중앙에서 상태를 모아 자식에 재분배"라는 같은 유형의 경계 불명확이 확인됐다. 다만 이 파일의 구체적 형태(레이아웃 분기용 Shell이 데이터 배분까지 겸함)는 이 도메인에 고유하다.
- CLAUDE.md의 "post-reaction-state" 관련 컨벤션(`좋아요/댓글수/본문처럼... postDetailQueryKey 쿼리 캐시로 정규화하세요`)과 충돌하지는 않는다 — 이미 캐시가 정규화 지점 역할을 하고 있고, 문제는 그 캐시에서 leaf까지 "누가 구독하는가"의 경계일 뿐이다.
- 이전 결정(#134 Shell 도입)은 "당시엔 맞았지만 지금은 전제가 깨진" 결정이라기보다, **검토 범위가 Modal의 직계 자식까지만이었고 그 아래 이미 존재하던 leaf 홉은 검토 대상에서 누락**된 경우에 가깝다(Inference — result.md에 "partials/ 폴더 전체에 걸친 prop drilling 재확인(추가로 발견된 것 없음)"이라는 문장도 있어, 당시 리뷰어가 재확인했다고 믿었지만 실제로는 놓쳤을 가능성).

### 비판적 재검토 (사용자 문제 제기에 대한 반박 질문과 답)

- **이 증상이 정말 구조 문제인가, 우연한 버그·일회성 실수인가?** 구조 문제에 가깝다. #134가 만든 두 Shell 각각의 `Pick<>` 타입이 서로 독립적으로 정의돼 있어, 향후 `reactions`에 필드가 추가될 때마다 "이 필드가 Desktop에도 필요한가, Mobile에도 필요한가"를 매번 두 곳에서 따로 판단해야 하는 구조적 비용이 있다. 실제로 지난 사이클의 "추가 다듬기" 항목 ①이 정확히 이 `Pick<>` 좁히기 작업이었다 — 한 번 발생했던 유형의 수정이 반복될 가능성이 있다.
- **지금 안 고치면 다음 몇 번의 실제 변경에서 구체적으로 어떤 비용이 드는가?** 게시글 반응에 새 필드(예: 리액션 이모지, 북마크)가 추가되면 Desktop/Mobile 두 Shell의 `Pick<>` 정의와 JSX 전달 라인을 동시에 고쳐야 한다. 하나를 빠뜨려도 타입 에러 없이(각 Shell이 필요한 필드만 쓰므로) 조용히 넘어갈 수 있어 리뷰에서 놓치기 쉽다.
- **더 급한 다른 문제를 가리는 건 아닌가?** 아니다 — 이 사이클은 컴포넌트 트리의 구독 경계만 다루고(사용자 결정, 목표 인터뷰 참고) `usePostDetailModal` 내부 재설계나 다른 도메인(#251/#253)과 섞지 않는다. 독립적으로 완결 가능한 범위다.

### 후보 우선순위

후보가 이 도메인 하나(Shell→leaf 재스레딩)로 이미 좁혀져 있어 우선순위표는 생략한다.

## 목표와 범위

### 목표 인터뷰 결과 (AskUserQuestion)

**Q1. Desktop Shell과 Mobile Sheet가 항상 동시에 마운트되는 현재 구조를 이번에 바꿀까요? (둘 다 마운트 vs 실제 화면크기에 맞는 하나만 조건부 마운트)**
A. 동시 마운트 유지(추천안 채택). 이유: `PostCardDetailModalMobileSheet`가 `animate-slide-up` CSS 애니메이션에 의존하는데, 조건부 마운트로 바꾸면 리사이즈 중 언마운트→재마운트가 일어나면서 이 애니메이션이 깨질 위험이 있고, 이번 사이클의 목표(prop 재분배 감소)와 무관한 회귀 위험을 추가로 안게 된다.

**Q2. leaf 컴포넌트(`PostDetailBody`/`PostDetailActions`/`PostDetailCommentComposer`)가 `postDetailQueryKey` 캐시나 `usePostReactions`류 훅을 직접 구독하도록 바꿀까요?**
A. 직접 구독으로 전환(추천안 채택). 이유: `PostCard.tsx`가 `usePostCacheSync`로 이미 같은 캐시를 직접 구독하는 검증된 선례가 있다. leaf가 직접 구독하면 Shell 계층의 `Pick<>` 재정의(Desktop 11개/Mobile 7개, 7개 중복) 자체가 사라진다.

**Q3. `usePostDetailModal` 자체(6개 훅을 합성하는 오케스트레이션 훅의 내부 구조)도 이번에 재설계 대상에 포함할까요?**
A. 포함 안 함 — 컴포넌트 트리 구독 경계만(추천안 채택). 이유: `usePostDetailModal`은 이전 사이클(#128)에서 의도적으로 설계된 오케스트레이션 훅이고, 이번 문제(prop 재분배)의 원인은 훅 자체가 아니라 "훅 결과를 컴포넌트 트리에 어떻게 배분하는가"다. 훅 내부까지 손대면 범위가 커져 회귀 위험이 늘어난다.

### Goal

Desktop Shell/Mobile Sheet 항상 동시 마운트 구조는 유지하되, leaf 컴포넌트(`PostDetailBody`/`PostDetailActions`/`PostDetailCommentComposer`)가 필요한 반응 데이터를 각 Shell의 `Pick<>` 재분배 없이 직접 얻도록 구독 경계를 바꾼다.

### Success Criteria

- Desktop Shell(`PostCardDetailModalDesktopShellProps`)과 Mobile Sheet(`PostCardDetailModalMobileSheetProps`)가 `reactions`를 `Pick<>`으로 재정의해 leaf에 전달하는 코드가 제거된다.
- leaf 컴포넌트가 `postDetailQueryKey(postId)` 캐시(또는 `usePostReactions`류 훅)를 직접 구독해 필요한 값을 얻는다.
- `PostCardDetailModal.test.tsx`(14개)/`usePostDetailModal.test.ts`(9개)/`LikedUsersOverlay.test.tsx`가 회귀 없이 통과한다(필요하면 mock 전략만 조정, 시나리오 자체는 유지).
- 좋아요/댓글/편집/좋아요한사용자목록/리사이즈 전환/모바일 스와이프 흐름이 시각적으로도 동일하게 동작한다(dev 서버에서 직접 확인).

### Out of Scope

- Desktop/Mobile 동시 마운트 구조 변경(Q1 결정에 따라 유지).
- `usePostDetailModal` 내부의 6개 훅 합성 구조 재설계(Q3 결정에 따라 제외).
- player 도메인(#251), playlist 도메인(#253) — 각각 별도 사이클.
- `editing`/`player`/`likedUsers` 등 `reactions` 이외의 다른 그룹 필드의 재분배 방식 — 이번엔 가장 크고 중복이 확인된 `reactions` 그룹만 다룬다. 다른 그룹은 재스캔 결과 중복 `Pick`이 없어(각 Shell이 필요한 필드가 겹치지 않음) 범위에서 제외.

## Behavior Invariants

- 모바일 바텀시트의 슬라이드업 등장 애니메이션과 스와이프다운 닫기 동작은 그대로 유지된다.
- 데스크탑↔모바일 리사이즈 시 프로필 페이지에서 열린 모달이 posts 피드로 전환되는 동작은 그대로 유지된다.
- 좋아요 토글/댓글 작성/좋아요한 사용자 목록 열기/편집 시작·저장·취소 흐름의 최종 결과(캐시 반영, UI 표시)는 그대로 유지된다.
- 게시글 삭제 시 `PostHeader.onDeletePost`가 `handleClose`(UX 로그 emit 포함)가 아니라 `closeModal`(emit 없음)을 쓰는 기존의 의도된 차이는 그대로 유지된다(이전 사이클에서 확인된 의도).
- UX 로그(체류 시간·재생 곡 수) emit 흐름은 그대로 유지된다.

## 기준선 검증

| 명령                  | 결과    | 실패 항목 | 비고                                                                                                                    |
| --------------------- | ------- | --------- | ----------------------------------------------------------------------------------------------------------------------- |
| `pnpm lint`           | ✅ 통과 | 없음      | 4/4 태스크 성공(캐시 히트)                                                                                              |
| `pnpm check-types`    | ✅ 통과 | 없음      | `@repo/ui`/`@repo/dto`/`web` 3/3 성공(캐시 히트). `apps/api`는 기존부터 `check-types` 스크립트가 없어 스코프에서 제외됨 |
| `pnpm test`(apps/api) | ✅ 통과 | 없음      | 8 suites / 37 tests                                                                                                     |
| `pnpm test`(apps/web) | ✅ 통과 | 없음      | 40 suites / 226 tests                                                                                                   |
| `pnpm build`          | ✅ 통과 | 없음      | web 빌드 성공(캐시 히트)                                                                                                |

측정 가능한 지표: 이번 사이클의 직접 영향 파일은 `PostCardDetailModalDesktopShell.tsx`/`MobileSheet.tsx`/`PostDetailBody.tsx`/`PostDetailActions.tsx`/`PostDetailCommentComposer.tsx`(및 각 테스트) 최대 8개 파일로 예상된다. 번들 크기 변화는 leaf 컴포넌트가 훅을 하나 더 호출하게 되는 정도라 유의미한 차이가 없을 것으로 예상되며, 측정은 `pnpm build`의 `First Load JS` 출력으로 before/after 비교한다.

---

**[GATE 1]** 위 진단·목표·범위·Behavior Invariants·기준선을 확인해주시면 다음 단계로 넘어가겠습니다.
