# Diagnosis — post-reaction-state (진행 중)

이 문서는 아직 정식 단계 1(비판적 구조 진단, 후보 우선순위·추천)이 완료되지 않은 상태입니다. `baseline.md`의 안전망 공백을 메우기 위해 앞당겨 진행한 특성화 테스트(이슈 #36)의 결과만 먼저 Fact로 기록합니다. 후보 우선순위·근본 원인 비교 등 정식 Stage 1 산출물은 GATE 1 진행 시 이어서 작성합니다.

## 특성화 테스트 결과 (2026-07-20, `apps/web` Jest + React Testing Library 도입 후)

- `apps/web/src/components/post/PostCard.test.tsx` — 5개 테스트, 전부 PASS
- `apps/web/src/hooks/post/usePostReactions.test.ts` — 6개 테스트, 전부 PASS(버그 특성화 포함)
- `pnpm test` 실행 시 `apps/web`이 처음으로 포함됨(이전에는 `apps/api`만 실행됨)

## Fact — 확인된 정상 동작

- 카드에서 좋아요를 누르면 즉시 낙관적으로 반영되고, 성공 시 `usePostReactionOverridesStore.likesByPostId`에 기록된다.
- 좋아요 API가 실패하면 로컬 상태와 전역 override 모두 이전 값으로 롤백된다.
- 비로그인 사용자는 좋아요 버튼이 비활성화되고 API가 호출되지 않는다.
- 한쪽 화면(카드 또는 모달)이 먼저 override를 남기면, 다른 화면은 마운트/재계산 시 그 값을 그대로 반영한다 — 카드↔모달의 좋아요·댓글 수 동기화 자체("어느 한쪽이 store에 쓰면 다른 쪽이 읽는다")는 설계대로 동작한다.
- 서버가 read-after-write consistency를 보장하는 정상 케이스에서는 댓글 작성 후 `commentsByPostId`가 올바르게 갱신된다.

## Fact — 재현된 문제

### 1. 댓글 작성 직후 refetch가 방금 쓴 댓글을 지울 수 있음 → 버그 이슈 [#39](https://github.com/Jae-Hyuk-Jang/web17-boostcamp-vibr/issues/39)

`usePostReactions.ts`의 `submitComment`(298-341행)는 `createComment` 성공 후 tmp id를 서버 id로 교체한 다음 곧바로 `refetchComments()`를 호출합니다. `mergeComments`(55-63행)는 "아직 tmp-로 시작하는" 로컬 댓글만 서버 응답에 강제로 합쳐주는데, 이미 서버 id로 교체된 댓글은 이 보호를 받지 못합니다. 따라서 `refetchComments`가 받아온 서버 스냅샷이 방금 생성된 댓글을 아직 포함하지 않으면(캐시 지연, read replica lag, 네트워크 순서 역전 등) 그 댓글이 화면에서 조용히 사라지고 댓글 수도 되돌아갑니다.

이것이 사용자가 애초에 의심했던 "의도와 다른 이상한 댓글 수 업데이트"의 실제 재현 사례입니다. 재현 테스트: `usePostReactions.test.ts`의 `[재현·버그 #39]`.

### 2. 카드와 모달의 인증 판단 소스가 다름(`baseline.md`에서 이미 관찰, 테스트로 재현 확인)

`PostCard`는 전역 `useAuthStore.isAuthenticated`를 쓰지만, `usePostReactions`(모달)는 자체적으로 `authMe()`를 호출해 별도로 `isAuthenticated`를 판단합니다. `authMe()` 응답이 오기 전에 좋아요를 누르면 — 실제로는 로그인한 사용자여도 — `toggleLike`이 조용히 아무 일도 하지 않습니다(API 호출 없음, 낙관적 갱신 없음, 에러 메시지도 없음). 재현 테스트: `usePostReactions.test.ts`의 `[재현·버그 후보] authMe() 응답이 오기 전에...`.

이 항목은 아직 별도 버그 이슈로 분리하지 않았습니다 — 실제 UI에서 사용자가 체감할 만큼의 시간 동안 이 상태가 지속되는지(로딩 스피너 등으로 이미 가려지고 있는지) 확인이 필요해 보입니다. Stage 1 정식 진단에서 근본 원인 후보로 다룰지 결정합니다.

## 다음 결정 필요 사항

- 이 두 가지 Fact(#39, 인증 소스 불일치)를 Stage 1의 근본 원인 후보에 포함할지, 아니면 온전히 별도 버그 트랙(#39)으로만 남기고 리팩터링 범위에서는 제외할지.
- 정식 Stage 1(후보 우선순위·추천, GATE 1)로 언제 진행할지.
