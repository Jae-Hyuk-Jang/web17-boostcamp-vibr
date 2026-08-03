# Result — refresh-trigger-stores

## 변경 요약

- **#160**: `usePostLikeToggle`/`PostHeader`(삭제 동기화)에 characterization 테스트를 추가해 안전망을 확보했다(각각 현재 0건 → 6건/3건).
- **#161**: `postDetailQueryKey` 캐시를 구독만 하는 경량 훅 `usePostCacheSync`를 신설했다(`usePostDetail`은 건드리지 않음, 모달 전용 `enabled` 계약과 분리).
- **#162**: `PostCard`가 `usePostCacheSync`로 좋아요/댓글수/본문을 읽도록 전환하고, `usePostLikeToggle`/`usePostReactions`의 브로드캐스트를 `queryClient.setQueryData`로 전환했다.
- **#163**: `usePostDetailModal`의 본문수정 이중 쓰기(캐시 + 스토어)를 캐시 한 곳으로 단일화하고, `likeOverride` 읽기를 제거했다. `FeedView`의 `contentByPostId` 기반 배열 패치도 제거했다(더 이상 필요 없음).
- **#164**: `usePostReactionOverridesStore.ts` → `usePostDeletionSignalStore.ts`로 리네임하고, `deletedPostId` 하나만 남긴 초경량 스토어로 축소했다. `PostHeader`/`FeedView`와 관련 테스트의 import 경로를 모두 갱신했다.

결과적으로 좋아요/댓글수/본문 값 동기화는 `postDetailQueryKey` 쿼리 캐시 하나로 단일화됐고, 게시글 삭제(목록 멤버십 제거)만 초경량 zustand 스토어로 남았다.

## Before / After

| 항목                                 | Before(prd.md 기준선)                                                        | After                                                                                               |
| ------------------------------------ | ---------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| 스토어가 관리하는 필드 수            | 4개(`likesByPostId`, `commentsByPostId`, `contentByPostId`, `deletedPostId`) | 1개(`deletedPostId`)                                                                                |
| 스토어 파일                          | `usePostReactionOverridesStore.ts`(90줄)                                     | `usePostDeletionSignalStore.ts`(21줄)                                                               |
| 본문수정 쓰기 경로                   | 캐시(`updatePostContent`) + 스토어(`setContentOverride`) 이중 쓰기           | 캐시 1곳(`updatePostContent`)만                                                                     |
| 좋아요/댓글수 값 동기화 경로         | `usePostReactionOverridesStore`(zustand)만                                   | `postDetailQueryKey(postId)` 쿼리 캐시(`queryClient.setQueryData`)                                  |
| `usePostDetailModal`의 좋아요 초기값 | `likesByPostId` override → post → passedPost 순                              | post(캐시 반영값) → passedPost 순 — override 조회 단계 제거                                         |
| 관련 테스트 수                       | 27 suites / 123 tests                                                        | 30 suites / 135 tests (+3 suites: `usePostLikeToggle`, `PostHeader`, `usePostCacheSync`, +12 tests) |
| `pnpm lint`                          | ✅ 성공                                                                      | ✅ 성공                                                                                             |
| `pnpm check-types`                   | ✅ 성공                                                                      | ✅ 성공                                                                                             |
| `pnpm build`                         | ✅ 성공, 16개 라우트                                                         | ✅ 성공, 16개 라우트(라우트 구성 변경 없음)                                                         |

## 개발환경 실동작 확인

- `packages/dto` 변경 없음 — `pnpm dto` 재빌드 불필요.
- `cd apps/web && pnpm dev`로 dev 서버를 직접 백그라운드 기동(`next dev --port 3000 --webpack`, "Ready in 2.4s").
- `curl http://localhost:3000/` → `200`, 컴파일 에러 없음(`GET / 200 in 11.6s`), 응답 HTML에 `FeedSkeleton`(`animate-pulse`) 정상 포함 — `FeedView`가 리네임된 스토어(`usePostDeletionSignalStore`)와 캐시 기반 `PostCard`를 통해 초기 렌더까지 에러 없이 동작함을 확인.
- `curl http://localhost:3000/profile/test-user-id/posts` → `200`, 컴파일 에러 없음(`GET /profile/test-user-id/posts 200 in 4.6s`).
- dev 서버 로그를 검토했고 컴파일·모듈 resolve 에러 없음.
- **직접 확인하지 못한 부분**: #149 result.md와 동일한 인프라 제약(이 세션 환경에 `docker-compose.yml` 없음, MySQL/Neo4j/Redis + `apps/api` 기동 불가)으로, 다음은 실제 API 응답 기반 브라우저 실동작으로 확인하지 못했다(mock 기반 유닛/통합 테스트로는 검증됨):
  - 피드 카드에서 좋아요를 누른 뒤 같은 게시글의 상세모달을 열었을 때 좋아요 상태가 실제로 동기화되는지
  - 상세모달에서 본문을 수정한 뒤 피드로 돌아왔을 때 캐시 1곳 갱신만으로 카드 내용이 바뀌는지
  - 게시글 삭제 시 피드에서 실제로 사라지는지
  - **사용자에게 요청**: 로컬에서 `docker compose up -d && pnpm dev` 실행 후, ① 피드에서 좋아요 → 같은 글 상세모달 열어 동기화 확인 ② 상세모달에서 본문 수정 → 피드로 돌아와 반영 확인 ③ 게시글 삭제 → 피드에서 사라지는지, 이 세 가지만 육안으로 확인해주시면 됩니다.

## Behavior Verification

Behavior Invariants(prd.md) 검증:

- 좋아요 낙관적 갱신/실패 시 롤백 — `usePostLikeToggle.test.ts`(3건), `PostCard.test.tsx`(2건)로 검증. ✅
- 비로그인 사용자 좋아요 버튼 비활성화 — `usePostLikeToggle.test.ts`, `PostCard.test.tsx`로 검증. ✅
- 댓글 작성 optimistic + refetch 보정 + 실패 롤백 — `usePostReactions.test.ts`(기존 테스트, 캐시 기반으로 갱신)로 검증. ✅
- 피드 카드-상세모달 동시 반영(좋아요/댓글수/본문) — `PostCard.test.tsx`의 "[카드 ↔ 모달 동기화]" 테스트 2건 + `usePostReactions.test.ts`의 동기화 테스트로 검증(모두 같은 `postDetailQueryKey` 캐시를 공유하는지 확인). ✅
- 게시글 삭제 시 피드에서 제거 — `PostHeader.test.tsx`로 삭제 신호 설정까지 검증, `FeedView`의 필터링 로직은 코드 변경 없음(리뷰로 확인). ✅
- `@repo/dto` 타입 변경 없음 — `pnpm check-types` PASS, DTO 파일 무변경. ✅

adr.md 회귀 시나리오 검증:

| 시나리오                   | 검증 결과                                                       |
| -------------------------- | --------------------------------------------------------------- |
| 좋아요 토글 성공           | ✅ `usePostLikeToggle.test.ts`, `PostCard.test.tsx`             |
| 좋아요 토글 실패           | ✅ `usePostLikeToggle.test.ts`, `PostCard.test.tsx`             |
| 비로그인 좋아요 클릭       | ✅ `usePostLikeToggle.test.ts`, `PostCard.test.tsx`             |
| 댓글 작성 성공             | ✅ `usePostReactions.test.ts`(캐시 기반으로 갱신)               |
| 본문 수정(캐시 1곳만 갱신) | ✅ `usePostDetailModal.test.ts`, `PostCardDetailModal.test.tsx` |
| 게시글 삭제                | ✅ `PostHeader.test.tsx`                                        |
| 피드+상세 동시 반영        | ✅ `PostCard.test.tsx`, `usePostReactions.test.ts`              |

## Decision Review

- ADR에서 예상한 대로, 안 2(값 필드는 캐시로/삭제는 초경량 스토어)는 6개 소비처를 이슈별로 순차 전환하는 동안 저장소가 매 커밋마다 정상 상태를 유지했다 — Migration 계획이 실제로 맞아떨어졌다.
- ADR 설계 중 발견해 사용자에게 재확인한 "`deletedPostId`는 성격이 달라 정규화 대상에서 제외" 결정은, 구현해보니 실제로 옳았다 — `usePostDeletionSignalStore`가 1개 필드만 남아 21줄짜리 파일이 됐고, `QueryCache` 이벤트 구독 같은 새 패턴을 도입할 필요가 전혀 없었다.
- 예상과 다르게, `usePostDetailModal`의 좋아요 초기값 계산이 `likeOverride` 제거로 오히려 더 단순해졌다(`post?.isLiked ?? passedPost?.isLiked`) — ADR 작성 시점에는 "우선순위 로직 유지"만 염두에 뒀지 이렇게 짧아질 거라고는 예상하지 못했다.
- #149와 마찬가지로 개발환경 실동작 확인은 인프라 부재로 정적 컴파일/렌더 확인까지만 직접 수행했다 — 반복되는 제약이라 다음 사이클부터는 PRD 기준선 단계에서 미리 이 한계를 명시하는 것이 낫겠다.

## Remaining Debt

- 피드 카드+상세모달 동시 반영, 본문수정 단일 캐시 갱신, 삭제 시 피드 반영은 브라우저 실동작으로 아직 검증되지 않았다(위 "개발환경 실동작 확인" 참고, 사용자 확인 요청 대기 중).
- `ProfilePostsFeed`의 postId별 쿼리 캐시 시딩에는 여전히 전용 테스트가 없다(이번 사이클 범위 밖, #149에서도 동일하게 남겨둔 항목).
- `CLAUDE.md`의 "usePostReactionOverridesStore로 피드/상세모달 간 좋아요 상태 동기화" 예시 문구는 스토어가 리네임·축소됐으므로 갱신이 필요하다 — 이번 사이클에서 함께 반영한다(아래 참고).

## Follow-ups

- #166: `useFeedRefreshStore`를 피드 목록 무한스크롤 훅 통합과 함께 전환 검토(신규 등록).
- 사용자 확인 필요: 위 "개발환경 실동작 확인"의 3가지 브라우저 확인 항목.

---

**[GATE 3]** 위 Before/After, 개발환경 실동작 확인(인프라 제약으로 일부는 확인 요청으로 남김), Behavior Verification, 남은 부채를 확인해주시면 이 리팩터링 사이클을 종료하겠습니다.
