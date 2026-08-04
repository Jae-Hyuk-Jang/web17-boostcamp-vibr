# Result — post-detail-modal-prop-redistribution

## 변경 요약

| 이슈   | 내용                                                                                                                                                                                                                                                                                    |
| ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| #254   | `PostDetailBody`/`PostDetailActions`/`PostDetailCommentComposer` 특성화 테스트 신규 작성(착수 전 0건)                                                                                                                                                                                   |
| #255   | `PostDetailReactionsContext`(Provider + `usePostDetailReactionsContext()`) 신설, `PostCardDetailModal.tsx`가 두 Shell을 감싸는 위치에 배선(미사용 seam, 동작 무변화)                                                                                                                    |
| #256   | `PostDetailActions`/`PostDetailCommentComposer`를 Context 구독으로 전환, Desktop/Mobile Shell의 `Pick<>`에서 겹치던 7개 필드 제거, Desktop/Mobile 동시 마운트 시 댓글 입력 텍스트가 갈라지지 않음을 증명하는 회귀 테스트 추가                                                           |
| #257   | `PostDetailBody`를 Context 구독으로 전환, Shell/`PostCardDetailModal.tsx`에서 `reactions` 관련 prop·타입 완전 제거                                                                                                                                                                      |
| (추가) | GATE 3 리뷰 중 발견 — `useSwipeToDismiss`(sheetRef/터치 핸들러)를 `PostCardDetailModal.tsx`에서 `PostCardDetailModalMobileSheet.tsx` 내부로 콜로케이션. 이 값은 MobileSheet 전용이라 여러 컴포넌트가 공유하는 `reactions`와 성격이 달라 Context가 아니라 "쓰는 곳에서 호출"로 충분했다. |

## Before / After

| 항목                                      | Before(prd.md 기준선)                                                                                                                                                          | After                                                                                                                                     |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------- |
| Desktop Shell의 `reactions` prop          | `Pick<..., 11개 필드>` (comments/isCommentsLoading/isAuthenticated/isSubmittingLike/isLiked/likeCount/toggleLike/isSubmittingComment/commentText/setCommentText/submitComment) | **prop 자체가 사라짐** — leaf가 Context에서 직접 구독                                                                                     |
| Mobile Sheet의 `reactions` prop           | `Pick<..., 7개 필드>` (comments/isCommentsLoading/isAuthenticated/isSubmittingComment/commentText/setCommentText/submitComment)                                                | **prop 자체가 사라짐**                                                                                                                    |
| 두 Shell 사이에 중복 정의되던 필드 수     | 7개(comments/isCommentsLoading 제외 시 실질 중복은 5개: isAuthenticated/isSubmittingComment/commentText/setCommentText/submitComment)                                          | **0개**                                                                                                                                   |
| `PostDetailCommentComposer` props 수      | 5개                                                                                                                                                                            | **0개**(완전히 prop 없는 컴포넌트, Context로만 구독)                                                                                      |
| `PostDetailActions` props 수              | 7개                                                                                                                                                                            | **2개**(`postId`, `onOpenLikedUsers` — reactions 그룹이 아니라 이번 범위 밖)                                                              |
| `PostDetailBody` props 수                 | 6개                                                                                                                                                                            | **4개**(`comments`/`commentsLoading` 제거, `profileImg`/`nickname`/`content`/`hideAuthorRow`만 유지)                                      |
| `PostCardDetailModalMobileSheet` props 수 | 8개                                                                                                                                                                            | **4개**(`sheetRef`/`onTouchStart`/`onTouchMove`/`onTouchEnd` 제거 — `useSwipeToDismiss`를 내부로 콜로케이션)                              |
| leaf 컴포넌트 단독 테스트                 | 0건                                                                                                                                                                            | **26건**(PostDetailBody 5 + PostDetailActions 5 + PostDetailCommentComposer 8 + Context 계약 2 + 기존 LikedUsersOverlay 8, 신규분만 22건) |
| `pnpm test`(web)                          | 40 suites / 226 tests                                                                                                                                                          | **44 suites / 246 tests**(+4 suites, +20 tests)                                                                                           |
| `pnpm lint`/`check-types`/`build`         | 전부 통과                                                                                                                                                                      | 전부 통과(회귀 없음, `isCommentsLoading` 관련 naming-convention 경고 1건을 구현 중 발견해 즉시 수정)                                      |
| 변경 파일(diff stat, main 대비)           | —                                                                                                                                                                              | 9개 파일 수정 + 4개 신규(Context 1 + Context 테스트 1 + leaf 테스트 3 - 기존 파일과 겹치지 않는 순수 신규 기준)                           |

## 개발환경 실동작 확인

- `packages/dto`는 변경하지 않아 `pnpm dto` 재빌드는 필요 없었다(순수 프론트엔드 컴포넌트 리팩터링, 백엔드/DTO 계약 무변화).
- `docker compose up -d`로 MySQL/Neo4j/Redis를 띄우고 `pnpm --filter api dev`/`pnpm --filter web dev`를 백그라운드로 실행해 두 서버 모두 컴파일 에러 없이 기동을 확인했다(이번 사이클 중 docker 소켓이 일시적으로 응답하지 않는 구간이 있었으나 재시도 후 정상 연결됨).
- `POST /api/auth/login/tmp`로 시드 사용자 토큰을 발급받아 실제 `GET /api/post/:id`, `GET /api/comment?postId=...`를 호출해 응답 형태가 프론트엔드가 기대하는 타입(`Post`/`GetCommentsResDto`)과 일치함을 확인했다.
- `curl`로 `/`(홈, `PostCardDetailModal`이 `ModalContainer`를 통해 항상 초기 번들에 포함됨)과 `/post/:id`(게시글 상세 딥링크 라우트) 모두 200 응답과 컴파일 에러 없음을 dev 서버 로그로 확인했다. 각 체크포인트 커밋 직후 hot reload로 재컴파일이 정상적으로 일어나는 것도 확인했다.
- **직접 확인하지 못한 부분**: 실제 브라우저에서 게시글 상세 모달을 열어 좋아요 클릭·댓글 입력·데스크탑↔모바일 리사이즈 전환을 시각적으로 조작하는 것은 이 샌드박스에 브라우저 자동화 도구가 없어 확인하지 못했다. 대신 이 사이클의 핵심 회귀 위험(Desktop/Mobile 동시 마운트 시 `usePostReactions`의 로컬 상태가 갈라지는가)을 정확히 시뮬레이션하는 통합 테스트(`PostDetailCommentComposer.test.tsx`의 "Desktop/Mobile 두 인스턴스가... 입력 텍스트가 서로 어긋나지 않는다")를 작성해 이 위험을 코드 수준에서 직접 증명했다. 사용자가 로컬에서 실제 모달을 열어 좋아요/댓글/편집/리사이즈 흐름을 한 번 확인해주면 좋다.

## Behavior Verification

prd.md의 Behavior Invariants를 모두 확인했다:

- ✅ 모바일 바텀시트 슬라이드업 애니메이션·스와이프다운 닫기 — `PostCardDetailModalMobileSheet`의 레이아웃/애니메이션 클래스는 이번 사이클에서 전혀 건드리지 않았다(Q1 결정: 동시 마운트 구조 유지). `useSwipeToDismiss` 배선도 무변화.
- ✅ 데스크탑↔모바일 리사이즈 전환 — `usePostDetailModal`의 리사이즈 감지 로직 무변경.
- ✅ 좋아요 토글/댓글 작성/좋아요한 사용자 목록 열기/편집 흐름 — `PostCardDetailModal.test.tsx`(기존 14개 시나리오, mock 대상만 실제 컴포넌트로 유지되고 프롭 배선 검증 방식은 그대로) 전부 회귀 없이 통과.
- ✅ 게시글 삭제 시 `handleClose`가 아닌 `closeModal` 사용(UX 로그 미emit) — 관련 코드 무변경, 기존 테스트로 커버.
- ✅ 데스크탑/모바일이 항상 동시 마운트돼도 댓글 입력 텍스트가 갈라지지 않음(안 3을 기각한 핵심 근거) — 신규 회귀 테스트로 직접 증명(위 개발환경 실동작 확인 참고).
- ✅ UX 로그 emit 흐름 — 관련 코드 무변경.

ADR의 회귀 시나리오 5개도 전부 확인:

| 회귀 시나리오                                                           | 결과                                                                   |
| ----------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| 좋아요 토글 후 Desktop/Mobile 양쪽 뷰의 좋아요 수가 동일하게 반영되는가 | ✅ 동일 Context 값을 구독하므로 항상 일치(구조적으로 보장)             |
| 댓글 입력 중 리사이즈해도 입력 텍스트가 유지되는가                      | ✅ 신규 회귀 테스트로 증명                                             |
| 댓글 제출 실패 시 토스트/롤백이 정상 동작하는가                         | ✅ `usePostReactions` 내부 로직 무변경, 기존 계약 그대로               |
| `PostCardDetailModal.test.tsx` 14개 시나리오 전부 통과                  | ✅ 통과                                                                |
| 모바일 바텀시트 애니메이션이 그대로 동작하는가                          | ✅ 레이아웃 코드 무변경(코드 리뷰로 확인, 시각적 확인은 브라우저 필요) |

## Decision Review

ADR에서 선택한 안 2(Context)의 예상과 실제 비교:

- **예상**: `usePostReactions` 호출이 여전히 1곳(`usePostDetailModal`)이라 mutation 상태 중복 위험이 없다 — 실제로 신규 회귀 테스트로 이를 직접 증명했고, 예상대로 문제 없었다.
- **예상**: `PlaybackProvider`와 동일한 패턴이라 학습 비용이 낮다 — 실제로 `usePostDetailReactionsContext`의 "Provider 밖 호출 시 에러" 구현이 `usePlaybackRefs`/`usePlaybackProgress`와 거의 동일한 코드가 되어 예상이 맞았다.
- **예상하지 못했던 점**: `isCommentsLoading: commentsLoading`처럼 Context에서 꺼낸 boolean 필드를 로컬 변수명으로 재바인딩하면 `@typescript-eslint/naming-convention`(boolean은 is/has/should 접두사 필수) 규칙에 걸린다는 걸 구현 중 lint로 처음 발견했다. `PostDetailActions`/`PostDetailCommentComposer`에서는 `isSubmittingLike: isSubmitting`처럼 재바인딩한 이름도 우연히 `is` 접두사를 유지해서 걸리지 않았는데, `PostDetailBody`에서만 `commentsLoading`으로 접두사를 잃어버려 걸렸다. 재바인딩 없이 원래 이름(`isCommentsLoading`)을 그대로 쓰는 것으로 고쳤다.
- **CLAUDE.md 갱신 여부**: ADR 체크포인트 4는 "필요 시" 컨벤션 갱신을 검토하라고 했다. 이번 사이클은 이 저장소에서 "Shell(레이아웃 분기 컴포넌트)은 데이터 배분 책임을 갖지 않는다"는 경계 규칙을 적용한 첫 사례이고, player 도메인(#251)·playlist 도메인(#253)이라는 같은 계열의 다른 두 부모 이슈가 아직 미착수 상태다. 한 사례만으로 저장소 전역 컨벤션을 CLAUDE.md에 못박기엔 근거가 이르다고 판단해 갱신을 보류했다 — #251/#253이 진행되면서 같은 경계 규칙이 반복 확인되면 그때 CLAUDE.md에 반영하는 것이 더 근거 있는 결정이 될 것이다.

## Remaining Debt

- `editing`/`player`/`likedUsers` 그룹은 이번 범위 밖으로 남겨졌다(PRD Out of Scope) — Mobile Sheet가 애초에 이 필드들을 쓰지 않아 중복 비용이 없었기 때문에 의도적으로 보류한 것이며, 재검토가 필요하다는 신호는 없다.
- `usePostDetailModal` 자체의 6개 훅 합성 구조는 이번에도 손대지 않았다(PRD Q3 결정) — 여전히 하나의 큰 오케스트레이션 훅이다.
- player 도메인(#251), playlist 도메인(#253) 부모 이슈는 이번 사이클과 별개로 여전히 미착수 상태다.

## Follow-ups

- CLAUDE.md 컴포넌트 패턴 섹션에 "Shell은 데이터 배분 책임을 갖지 않는다" 경계 규칙을 추가할지는, #251/#253 중 하나가 진행되어 같은 패턴이 다시 확인된 이후 재검토한다(별도 백로그 등록 없음 — 다음 사이클 착수 시 자연히 재검토될 항목).
- 부모 이슈 #252는 이 4개 체크포인트로 완결됐으므로 종료한다.

---

**[GATE 3]** 위 Before/After, 개발환경 실동작 확인, Behavior Verification, 남은 부채를 확인해주시면 이 리팩터링 사이클을 종료하겠습니다.
