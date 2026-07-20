# Baseline — post-reaction-state

## 범위 (이번 사이클에서 실제로 읽은 대상)

- `apps/web/src/stores/usePostReactionOverridesStore.ts` — 좋아요/댓글수/본문/삭제 오버라이드를 담는 전역 zustand 스토어
- `apps/web/src/hooks/post/usePostReactions.ts` — 상세 모달 전용 좋아요/댓글 로직(폴링, optimistic, 스토어 동기화)
- `apps/web/src/components/post/PostCard.tsx`, `partials/PostHeader.tsx` — 피드 카드의 좋아요/댓글 표시, 자체 optimistic 로직, 삭제 트리거
- `apps/web/src/components/modals/PostCardDetailModal/PostCardDetailModal.tsx` — 상세 모달 컨테이너, 본문 수정 오버라이드 반영
- `apps/web/src/components/feed/FeedView.tsx` — 오버라이드(본문 수정/삭제) 소비 지점

`packages/dto`의 Like/Comment 관련 요청·응답 타입은 이번 조사에서 변경 대상으로 보지 않았습니다(브리프의 제약과 일치).

## 관찰한 구조 (Fact)

- **좋아요 토글 로직이 두 곳에 독립적으로 존재합니다.**
  - `PostCard.tsx`(67-97행 `handleToggleLike`): 로컬 `useState`(`isOptimisticLiked`, `optimisticLikeCount`)로 낙관적 갱신 후 `setLikeOverride`로 전역 스토어에 씀. 인증 여부는 전역 `useAuthStore`의 `isAuthenticated`를 사용.
  - `usePostReactions.ts`(264-297행 `toggleLike`): 별도의 로컬 `useState`(`isLiked`, `likeCount`)로 낙관적 갱신 후 동일한 `setLikeOverride`에 씀. **인증 여부는 전역 스토어를 쓰지 않고 훅 내부에서 `authMe()`를 호출해 별도로 판단**(149-172행).
  - 두 구현은 "스냅샷 → optimistic 반영 → store 반영 → API 호출 → 실패 시 롤백" 순서가 동일하지만 코드가 중복돼 있고, **인증 여부 판단 소스마저 다릅니다.** 로드 타이밍에 따라 카드와 모달이 서로 다른 로그인 상태를 잠깐 보여줄 가능성이 있는 지점입니다.
- **읽기 쪽 병합(override → 화면에 보여줄 값) 규칙도 두 곳에 흩어져 있습니다.**
  - `PostCard.tsx`(36-37행): `likeOverride?.isLiked ?? post.isLiked`, `likeOverride?.likeCount ?? post.likeCount`.
  - `PostCardDetailModal.tsx`(48-49행): `likeOverride?.isLiked ?? post?.isLiked ?? passedPost?.isLiked ?? false` — `passedPost`까지 포함한 별도의 3단 fallback 체인.
- **반응 타입마다 오버라이드 생명주기가 다릅니다.**
  - `likesByPostId`/`commentsByPostId`: `setXxx`만 있고 `clearXxx`를 호출하는 지점이 코드베이스 어디에도 없습니다(스토어 정의엔 `clearLikeOverride`/`clearCommentOverride`가 있지만 미사용) — 모달을 닫아도 값이 남아 있습니다.
  - `contentByPostId`/`deletedPostId`: `FeedView.tsx`(55-68행)가 구독 즉시 로컬 `posts` 배열에 반영한 뒤 `clearContentOverride`/`clearDeletedPostId`를 명시적으로 호출합니다.
- **댓글 수 갱신은 상세 모달에서만 발생하고, 피드 카드는 읽기만 합니다.** `usePostReactions.ts`의 `applyComments`(114-124행)가 댓글이 바뀔 때마다 `setGlobalCommentCount`로 스토어에 쓰고, `PostCard.tsx`(33-34행)가 `commentsByPostId`를 읽어 반영합니다.
- **본문 수정은 `PostCardDetailModal.tsx`(121행)가 훅 없이 컴포넌트에서 직접 `setContentOverride`를 호출**하고, **삭제는 `PostHeader.tsx`(70행)가 훅 없이 컴포넌트에서 직접 `setDeletedPostId`를 호출**합니다 — 좋아요/댓글이 훅을 경유하는 것과 다른 접근 패턴입니다.
- `usePostReactions.ts` 104행의 "store가 없거나 미구현이면 타입 에러가 날 수 있음(스토어 확장 필요)" 주석은 스토어가 이미 4종류 오버라이드로 확장된 지금도 남아 있는 낡은 주석입니다(Inference: 이 파일이 임시방편으로 여러 번 손질됐을 가능성).
- `PostCardDetailModal.tsx`는 좋아요/댓글/본문수정 오버라이드 반영 외에도 UX 로그 수집(체류 시간, 재생한 곡 추적, dwell 계산), 모바일↔데스크톱 리사이즈 시 라우팅 전환, 스와이프-투-디스미스 처리까지 396줄 안에서 함께 담당합니다.

## 기존 안전망 공백 (Fact)

- `apps/web`에는 `test` 스크립트도 `*.test.*`/`*.spec.*` 파일도 전혀 없습니다. 이번에 다룰 반응 상태 로직은 characterization test가 하나도 없는 상태에서 리팩터링을 시작하게 됩니다 — 이번 사이클의 가장 큰 리스크입니다.

## 기준선 검증 결과 (2026-07-20, 실제 저장소에서 실행)

| 명령               | 결과                                                                                                |
| ------------------ | --------------------------------------------------------------------------------------------------- |
| `pnpm lint`        | **PASS** — 4/4 태스크(`@repo/dto`, `@repo/ui`, `api`, `web`) 성공, 14.4s                            |
| `pnpm check-types` | **PASS** — 3/3 태스크 성공(`apps/api`는 `check-types` 스크립트 자체가 없어 turbo가 스킵, 기존 구조) |
| `pnpm test`        | **PASS** — 8 suites / 37 tests, 전부 `apps/api`(`apps/web`은 test 스크립트 없어 0개 실행)           |
| `pnpm build`       | **PASS** — 3/3 태스크(`@repo/dto`, `nest build`, `next build`) 성공, 19.3s                          |

기존에 실패하던 항목은 없습니다 — 기준선은 전부 초록입니다.

## 측정 지표

- 반응 상태 관련 프런트엔드 테스트 수: 0 (측정 불가가 아니라 실제로 0)
- 커버리지 / 번들 크기: 측정 불가 — `apps/web`에 해당 도구 없음
- 오버라이드를 직접 만지는 파일 수(현재): 6개(`usePostReactionOverridesStore.ts`, `usePostReactions.ts`, `PostCard.tsx`, `PostHeader.tsx`, `PostCardDetailModal.tsx`, `FeedView.tsx`) + `stores/index.ts` 배럴
- `PostCardDetailModal.tsx`: 396줄(컴포넌트 중 최대), 최근 100개 커밋 중 3회 변경
- `usePostReactions.ts`: 362줄(훅 중 최대)

## Behavior Invariants

1. 로그인한 사용자가 피드 카드 또는 상세 모달에서 좋아요를 누르면 하트 아이콘/카운트가 즉시(낙관적으로) 반영되고, `addLike`/`removeLike` 요청이 실패하면 이전 값으로 롤백된다.
2. 비로그인 사용자는 좋아요 버튼이 비활성화(`disabledLike`)로 표시되고, 클릭해도 API 호출이나 상태 변경이 일어나지 않는다.
3. 피드 카드와 상세 모달 중 한쪽에서 바뀐 좋아요 상태는 `usePostReactionOverridesStore`를 통해 다른 쪽에도 반영된다.
4. 좋아요 요청이 진행 중(`isLikeSubmitting`/`isSubmittingLike`)인 동안에는 같은 토글에 대해 중복 요청을 보내지 않는다.
5. 상세 모달에서 댓글을 작성하면 임시 id(`tmp-*`)로 낙관적 추가되고, 서버 응답을 받으면 실제 id로 교체된 뒤 `refetchComments`로 목록이 다시 보정된다. 요청이 실패하면 임시 댓글은 제거된다.
6. 상세 모달에서 댓글 수가 바뀌면(`setGlobalCommentCount`) 피드 카드의 댓글 수 표시도 갱신된다.
7. 상세 모달은 열려 있는 동안에만 주기적으로(기본 5초, 탭이 숨겨지면 6배 이상 느리게) 댓글을 다시 조회하며, 댓글 입력 중이거나 전송 중이거나 오프라인이면 그 주기의 폴링을 건너뛴다.
8. 게시글 소유자가 상세 모달에서 본문을 수정해 저장하면(`setContentOverride`), 모달 내부 표시와 피드 카드의 본문(`FeedView`가 소비 후 clear)이 모두 새 내용으로 갱신된다.
9. 게시글 소유자가 게시글을 삭제하면(`setDeletedPostId`), 피드 목록에서 해당 게시글이 사라진다(`FeedView`가 소비 후 clear).
10. `@repo/dto`의 좋아요/댓글 요청·응답 타입(필드명, optional/nullable 여부)은 이번 리팩터링에서 변경하지 않는다.

## 다음 결정 필요 사항 (GATE 0 승인 후)

- 단계 1(비판적 구조 진단, `diagnosis.md`)로 진행하며, 위에서 발견한 "인증 판단 소스 불일치"·"오버라이드 생명주기 불일치"·"PostCardDetailModal의 과다 책임" 세 갈래 중 근본 원인 후보를 좁힙니다.
