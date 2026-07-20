# Issues — post-reaction-state (안 2: 전담 훅 추출)

수직 슬라이싱 대신 "이 이슈만 머지해도 기존 동작이 유지되고 저장소가 정상 상태인가"를 기준으로 4개로 나눴습니다. 순서대로 의존합니다.

---

## 이슈 1 — 회귀 안전망 보강 (중복 요청 방지 + 반환 타입 계약 테스트)

### 목적

구조를 옮기기 전에, `regression-plan.md`에서 찾은 공백 2건을 기존(리팩터링 전) 코드 기준으로 먼저 통과시켜 둔다. 이후 이슈에서 뭔가 깨지면 "새로 만든 문제"라는 걸 바로 구분할 수 있게 한다.

### Scope

- `PostCard.test.tsx`에 중복 클릭 방지 테스트 추가
- `usePostReactions.test.ts`에 중복 토글 방지 테스트 추가
- `usePostReactions.test.ts`(또는 별도 계약 테스트 파일)에 반환 객체 키 목록을 고정하는 계약 테스트 추가

### Out of Scope

- `PostCard.tsx`, `usePostReactions.ts`의 실제 로직 변경(테스트만 추가)

### Behavior Invariants

- baseline.md의 4번("좋아요 진행 중 중복 요청 방지")을 테스트로 고정

### Acceptance Criteria

- [ ] Given 좋아요 요청이 진행 중인 상태, When 같은 토글을 다시 호출하면, Then API가 추가로 호출되지 않는다(카드/모달 양쪽)
- [ ] Given `usePostReactions`의 현재 반환 객체, When 키 목록을 스냅샷/명시적 비교로 검증하면, Then 13개 필드(`isAuthenticated, isLiked, likeCount, toggleLike, isSubmittingLike, comments, isCommentsLoading, commentText, setCommentText, submitComment, isSubmittingComment, commentCount, refetchComments`)가 그대로 존재한다

### Verification

- [ ] `pnpm --filter web test`, `pnpm --filter web lint`, `pnpm --filter web check-types`

### Rollback

- 테스트 파일만 변경되므로 해당 커밋 revert로 충분

### Dependency

- 없음(첫 이슈)

---

## 이슈 2 — `usePostLikeToggle` 훅 신설 및 `PostCard` 전환

### 목적

좋아요의 optimistic state·API 호출·롤백·store 반영을 캡슐화하는 전담 훅을 만들고, 첫 번째 소비처(`PostCard`)를 이 훅으로 전환해서 중복의 절반을 제거한다.

### Scope

- `apps/web/src/hooks/post/usePostLikeToggle.ts` 신설: `{ postId, initialIsLiked, initialLikeCount, isAuthenticated }`를 받아 `{ isLiked, likeCount, isSubmitting, toggleLike }`를 반환. `isAuthenticated`는 파라미터로만 받고 내부에서 직접 판단하지 않는다(plan.md ADR).
- `apps/web/src/hooks/post/index.ts` 배럴에 export 추가
- `PostCard.tsx`: `isOptimisticLiked`/`optimisticLikeCount`/`isLikeSubmitting`/`handleToggleLike`/override 동기화 `useEffect`를 제거하고 `usePostLikeToggle` 호출로 교체. `useAuthStore`의 `isAuthenticated`를 그대로 파라미터로 전달

### Out of Scope

- `usePostReactions.ts`, `PostCardDetailModal.tsx` 변경(다음 이슈)

### Behavior Invariants

- baseline.md 1, 2, 3, 4번(좋아요 낙관적 갱신/롤백, 비로그인 처리, 카드↔모달 동기화, 중복 요청 방지)

### Acceptance Criteria

- [ ] Given 로그인 사용자가 카드에서 좋아요를 누름, When API가 성공하면, Then 기존과 동일하게 즉시 반영 + store 기록(이슈 1에서 추가한 테스트 포함, `PostCard.test.tsx` 전부 통과)
- [ ] Given 리팩터링 전/후, When `PostCard.test.tsx`를 그대로 실행하면, Then 테스트 코드 수정 없이 전부 통과한다(관찰 가능한 동작이 바뀌지 않았다는 증거)

### Verification

- [ ] `pnpm --filter web test -- PostCard`, `pnpm --filter web lint`, `pnpm --filter web check-types`

### Rollback

- `usePostLikeToggle.ts` 삭제 + `PostCard.tsx`를 이전 커밋으로 되돌리면 즉시 복구(다른 소비처가 아직 없어 영향 없음)

### Dependency

- 이슈 1 선행

---

## 이슈 3 — `usePostReactions` 합성 전환

### 목적

두 번째 소비처(`usePostReactions`, 상세 모달이 사용)도 같은 훅을 쓰게 해서 중복을 완전히 제거한다. `PostCardDetailModal.tsx`는 건드리지 않는다.

### Scope

- `usePostReactions.ts`: 좋아요 관련 `useState`(`isLiked`, `likeCount`, `isSubmittingLike`)와 `toggleLike` 구현을 제거하고, 내부에서 `usePostLikeToggle({ postId, initialIsLiked, initialLikeCount, isAuthenticated })`를 호출해 그 결과를 기존 `Result` 타입과 동일한 필드명(`isLiked`, `likeCount`, `isSubmittingLike`, `toggleLike`)으로 반환. `isAuthenticated`는 기존처럼 훅 내부의 `authMe()` 판정 결과를 그대로 전달(소스 변경 없음).
- 댓글 관련 코드(`comments`, `applyComments`, `refetchComments`, `submitComment`, 폴링)는 손대지 않는다.

### Out of Scope

- `PostCardDetailModal.tsx`, `PostDetailActions.tsx` 등 소비 컴포넌트 변경 — `usePostReactions`의 반환 계약이 동일하면 이 파일들은 수정이 필요 없어야 한다(그게 이 이슈의 성공 기준).
- 인증 판단 소스 통일(Out of Scope, brief-fixed.md)

### Behavior Invariants

- baseline.md 1, 2, 3, 4, 5, 6번(좋아요 전체 + 댓글수 카드 반영까지, 댓글 CRUD/폴링 자체는 미변경이므로 자동 보존)

### Acceptance Criteria

- [ ] Given 리팩터링 전/후, When `usePostReactions.test.ts`를 그대로 실행하면, Then 테스트 코드 수정 없이 전부 통과한다
- [ ] Given 이슈 1에서 추가한 반환 타입 계약 테스트, When 리팩터링 후 실행하면, Then 여전히 통과한다(13개 필드 동일)
- [ ] Given `PostCardDetailModal.tsx`, When 이 이슈의 diff를 확인하면, Then 이 파일은 수정되지 않았다

### Verification

- [ ] `pnpm --filter web test -- usePostReactions`, `pnpm --filter web lint`, `pnpm --filter web check-types`
- [ ] 수동 확인: 로컬에서 상세 모달을 열어 좋아요 토글이 기존과 동일하게 동작하는지 1회 확인

### Rollback

- `usePostReactions.ts`만 이전 커밋으로 되돌리면 복구(카드 쪽은 이슈 2로 이미 독립적으로 전환 완료된 상태라 영향 없음)

### Dependency

- 이슈 2 선행(같은 훅을 재사용)

---

## 이슈 4 — 결과 검증 및 `result.md`

### 목적

전체 기준선을 재확인하고 Before/After를 비교해 이번 사이클을 공식적으로 종료한다.

### Scope

- `pnpm lint`/`check-types`/`test`/`build` 전체 재실행 및 결과 기록
- `docs/refactors/post-reaction-state/result.md` 작성(GATE 6)
- 남은 부채(인증 소스 불일치, #39 등) 정리 및 후속 이슈 링크 확인

### Out of Scope

- 새 기능 추가, 추가 리팩터링

### Verification

- [ ] `pnpm lint`, `pnpm check-types`, `pnpm test`, `pnpm build` 전부 통과
- [ ] baseline.md의 Behavior Invariants 10개 재확인

### Rollback

- 문서 변경뿐이므로 해당 없음

### Dependency

- 이슈 1~3 전부 완료 후
