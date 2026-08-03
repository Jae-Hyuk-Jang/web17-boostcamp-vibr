# PRD — refresh-trigger-stores

## 문제 정의

`usePlaylistRefreshStore`는 `server-state-caching` 사이클(#139~145)에서 TanStack Query로 대체되어 제거됐다. 같은 계열(리프레시 트리거/서버 데이터 오버라이드 전용 zustand 스토어)인 `useFeedRefreshStore`와 `usePostReactionOverridesStore`는 그 사이클 범위 밖이라 남아있었고, #153으로 등록됐다.

이번 진단 결과 두 스토어는 성격이 다르다는 것이 드러났다(아래 참고). 목표 인터뷰에서 사용자가 범위를 **`usePostReactionOverridesStore`만 이번에 다루고 `useFeedRefreshStore`는 별도 후속으로 미루는 것**으로 확정했다. 이 문서는 그 확정된 범위를 기준으로 작성한다.

## 비판적 진단 (시니어 개발자 시각)

### 근거

- **Fact**: `usePostReactionOverridesStore`(`stores/usePostReactionOverridesStore.ts`)는 `likesByPostId`/`commentsByPostId`/`contentByPostId`/`deletedPostId` 4개 필드를 관리하며, 11개 파일(`usePostReactions`, `usePostLikeToggle`, `usePostDetailModal`, `PostCard`, `PostHeader`, `FeedView`, 그리고 이들의 테스트 파일)에서 참조된다.
- **Fact(핵심 발견)**: `usePostDetailModal.ts`의 `editing.onCommit`(129-144줄)은 게시글 본문 수정 시 **같은 값을 두 시스템에 이중으로 쓴다** — `updatePostContent(next)`(`usePostDetail.ts`의 `queryClient.setQueryData(postDetailQueryKey(postId), ...)`, TanStack Query 캐시)와 `setContentOverride(postId, { content: next })`(zustand 스토어) 둘 다 호출한다. 캐시만 쓰면 `FeedView`(카드 목록, 쿼리 캐시를 구독하지 않음)에 반영되지 않고, 스토어만 쓰면 상세모달을 다시 열었을 때(쿼리 캐시가 `staleTime` 동안 재사용됨) 반영되지 않기 때문에 이렇게 된 것으로 보인다(Inference).
- **Fact**: 좋아요(`likesByPostId`)/댓글수(`commentsByPostId`)는 쿼리 캐시 쪽 대응물이 전혀 없다 — 오직 스토어를 통해서만 `PostCard`(피드/프로필 목록 항목, `usePostReactions`/`usePostLikeToggle`가 갱신한 값)와 `usePostDetailModal`(상세모달) 사이에 동기화된다.
- **Fact**: `ProfilePostsFeed.tsx`(#144에서 도입)는 이미 각 게시글을 `queryClient.setQueryData(postDetailQueryKey(p.postId), detail)`로 개별 쿼리 캐시 엔트리에 시딩하는 패턴을 쓰고 있다 — 목록 조회 방식(무한스크롤 커스텀 훅)과 무관하게 "항목 하나하나를 postId별 캐시로 시딩"하는 게 이미 이 저장소에 선례로 존재한다.
- **Fact**: `usePostReactionOverridesStore` 자체의 전용 테스트는 없다. 다만 이를 사용하는 `usePostReactions.test.ts`(8건), `PostCard.test.tsx`(6건), `usePostDetailModal.test.ts`가 이미 존재해(`post-reaction-state` 사이클 #48 산출물) 완전한 안전망 공백은 아니다. `usePostLikeToggle.ts`, `PostHeader.tsx`(삭제 동기화 부분)는 전용 테스트가 없다.
- **Fact**: `docs/refactors/post-reaction-state/result.md`(Remaining Debt)가 이미 "본문수정 동기화"/"삭제 동기화"를 Out of Scope로 명시하며 "#43(서버 상태 캐싱 라이브러리 도입 검토)"을 후속 과제로 남겨뒀다 — 그 라이브러리(TanStack Query)는 이제 도입됐지만(#139~145) 상세보기(`usePostDetail`)에만 적용됐고, 목록/오버라이드 계층에는 아직 적용되지 않았다. 이번 사이클은 그 연장선이다.

### 증상 → 원인 체인

증상: 좋아요/댓글수/본문/삭제가 바뀌면 `usePostReactionOverridesStore`라는 수동 오버라이드 맵을 거쳐 피드 카드와 상세모달을 동기화해야 하고, 본문수정은 그 동기화를 TanStack Query 캐시와 zustand 스토어 양쪽에 이중으로 써야 한다.
→ (왜?) 직접 원인: 같은 게시글 데이터의 두 소비 경로 — 목록(`PostCard`가 읽는 배열 항목)과 상세(`usePostDetail`의 쿼리 캐시) — 가 서로 다른 상태 관리 계층에 있다. 목록 항목은 `useInfiniteScroll`이 들고 있는 훅 로컬 배열 상태이고, 상세는 이미 postId별 쿼리 캐시다.
→ (왜?) 구조 원인: `server-state-caching`(#139~145) 사이클이 상세보기만 쿼리 캐시로 옮기고 목록은 Out of Scope로 남겼다 — "일부만 마이그레이션된 상태"가 지금의 이중 동기화(및 본문수정의 이중 쓰기)를 만들었다.

### 아키텍처 관점

- **저장소 반복 패턴인가?**: 그렇다. `post-reaction-state`(#48) → `server-state-caching`(#139~145, 상세만) → 지금(#153, 목록 항목의 오버라이드) 순서로, "서버 상태 캐싱을 어디까지 확장할 것인가"라는 같은 축의 결정이 세 번째로 반복되고 있다. 매번 범위를 좁혀 Out of Scope로 미룬 이력이 있다.
- **기존 컨벤션과 충돌하는가?**: `CLAUDE.md`는 zustand를 "여러 컴포넌트에 걸쳐 동기화가 필요한 서버 데이터 오버라이드(예: `usePostReactionOverridesStore`)"에 명시적으로 허용하고 있다 — 이 문서 자체가 이 스토어의 존재를 "서버 상태 캐싱이 아직 부분적이라 필요한 것"으로 정당화하고 있다. 즉 컨벤션이 이 구조를 금지하지 않고 오히려 설명하고 있으므로, 이번 리팩터링이 성공하면 `CLAUDE.md`의 이 문장도 갱신 대상이다.
- **전제가 깨졌나, 애초에 근거가 약했나?**: 전제가 부분적으로 깨졌다. `usePostReactionOverridesStore` 도입 당시엔 "서버 상태 캐싱 레이어가 아직 없다"는 게 전제였지만, 지금은 TanStack Query가 있고 `ProfilePostsFeed`가 postId별 캐시 시딩 선례까지 만들어뒀다 — 스토어를 유지할 원래 근거(캐싱 레이어 부재)가 사라졌다.

### 비판적 재검토 (사용자 문제 제기에 대한 반박 질문과 답)

- **이 증상이 정말 구조 문제인가, 우연한 버그인가?** 구조 문제다. `usePostDetailModal.ts`의 이중 쓰기 코드가 실존한다 — 우연이 아니라, "캐시만 쓰면 피드에 반영 안 됨 / 스토어만 쓰면 재오픈된 상세에 반영 안 됨"이라는 두 시스템 분리의 필연적 결과다.
- **지금 안 고치면 다음 몇 번의 실제 변경에서 어떤 비용이 드는가(YAGNI)?** 새 반응 필드(예: 북마크, 재생수)가 추가될 때마다 "쿼리 캐시에 쓸지, 오버라이드 스토어에 쓸지, 둘 다 쓸지"를 매번 새로 판단해야 한다. 이미 `content` 필드에서 "둘 다"라는 가장 비용이 큰 답을 택한 전례가 있다는 것 자체가, 다음 필드 추가 때 같은 실수가 반복될 위험을 보여준다.
- **더 급한 다른 문제를 가리는 건 아닌가?** 아니다 — #149(무한스크롤 훅 상태 전이 로직 중복)와는 명확히 다른 계층(서버 데이터 동기화)의 문제이고, 사용자가 명시적으로 순서(먼저 #149, 다음 #153)를 지정했다.
- **(자기 수정) 이전 코멘트(#153 초기 조사)에서 "피드가 쿼리 캐시 기반으로 바뀌어야 재검토 가능"이라고 썼던 판단은 정확했나?** 부분적으로 틀렸다. 그 코멘트는 "피드 목록 _조회 방식_ 자체(`useInfiniteQuery` 전환)"가 선행돼야 한다고 암시했지만, 실제로는 `ProfilePostsFeed`의 선례처럼 "목록 조회는 그대로 두고, 각 항목만 postId별 캐시로 시딩"하면 되는 문제였다 — 목록 조회 메커니즘과 항목별 캐시 정규화는 독립적인 축이다. 이번 진단에서 이 전제를 재검증하고 범위를 좁혔다(목표 인터뷰에서 사용자가 확정).

## 목표와 범위

### Goal

`usePostReactionOverridesStore`가 관리하는 4개 필드(좋아요/댓글수/본문/삭제)를 postId별 TanStack Query 캐시(`postDetailQueryKey`, `usePostDetail`이 이미 쓰는 것과 동일)로 정규화해, 피드 카드와 상세모달이 같은 캐시 엔트리를 구독하도록 만든다. 결과적으로 `usePostReactionOverridesStore`를 제거하고, 값 동기화를 `queryClient.setQueryData` 한 곳으로 단일화한다.

### Success Criteria

- `usePostReactionOverridesStore.ts`가 제거되고, 좋아요/댓글수/본문/삭제 상태 변경이 모두 `postDetailQueryKey(postId)` 쿼리 캐시 갱신 한 곳으로 이뤄진다.
- `usePostDetailModal.ts`의 본문수정 이중 쓰기(`updatePostContent` + `setContentOverride`)가 단일 쓰기(쿼리 캐시)로 통합된다.
- `PostCard`가 피드/프로필 목록 항목을 렌더링할 때, 좋아요/댓글수/본문 값을 postId별 쿼리 캐시에서 읽는다(현재처럼 props로 받은 정적 값 + 별도 스토어 오버라이드 조합이 아니라).
- 11개 소비처의 기존 동작(낙관적 업데이트, 롤백, 삭제 시 피드 반영)이 전후 동일하다.

### Out of Scope

- `useFeedRefreshStore` 전환 — 피드 목록 자체가 `useInfiniteQuery`가 아니라서 근본 대체가 어렵고, 이는 #149에서 이미 Out of Scope로 미뤄둔 더 큰 작업이다. 목표 인터뷰에서 사용자가 명시적으로 범위에서 제외했다. 별도 후속 이슈로 등록한다.
- 피드/프로필 목록 조회 방식(현재 `useInfiniteScroll` 기반 커스텀 훅) 자체를 `useInfiniteQuery`로 바꾸는 것 — 이번 사이클은 "항목별 캐시 시딩"만 다루고 목록 조회 메커니즘은 그대로 둔다.
- 댓글 폴링 주기/온라인 감지 로직(`usePostReactions`) 변경.
- 인증 판단 소스 불일치(`PostCard`: `useAuthStore` / `usePostReactions`: `authMe()`) 통일 — `post-reaction-state`(#48)에서 이미 의도적으로 남겨둔 별개 문제.
- UI 시각적 변경.

### Behavior Invariants

- 좋아요 낙관적 갱신/실패 시 롤백 동작은 유지된다.
- 비로그인 사용자는 좋아요 버튼이 비활성화되고 API를 호출하지 않는다.
- 댓글 작성 optimistic + refetch 보정 + 실패 롤백 동작은 유지된다.
- 피드 카드와 상세모달이 동일 게시글을 동시에 보고 있을 때, 한쪽에서의 좋아요/댓글수/본문 변경이 다른 쪽에도 반영된다(현재 동작 유지).
- 게시글 삭제 시 피드에서 해당 게시글이 사라진다.
- `@repo/dto` 타입 변경 없음.

## 기준선 검증

| 명령                   | 결과    | 실패 항목 | 비고                                                |
| ---------------------- | ------- | --------- | --------------------------------------------------- |
| `pnpm lint`            | ✅ 성공 | 없음      | 4/4 태스크 성공(전부 캐시, FULL TURBO)              |
| `pnpm check-types`     | ✅ 성공 | 없음      | 3/3 태스크 성공(전부 캐시, FULL TURBO)              |
| `pnpm test` (apps/web) | ✅ 성공 | 없음      | 27 suites / 123 tests 모두 통과, 7.0s               |
| `pnpm build`           | ✅ 성공 | 없음      | 3/3 태스크 성공(전부 캐시, FULL TURBO), 16개 라우트 |

측정 불가: `usePostReactionOverridesStore` 관련 변경 빈도(히스토리 스쿼시). 번들 크기 개별 기여분(하나의 Next.js 번들에 포함돼 분리 측정 어려움).

변경 영향 파일 수(예상): 스토어 파일 1개 삭제, 소비처 6개(`usePostReactions`, `usePostLikeToggle`, `usePostDetailModal`, `PostCard`, `PostHeader`, `FeedView`) + 관련 테스트.

---

**[GATE 1]** 위 진단·목표·범위·Behavior Invariants·기준선을 확인해주시면 다음 단계로 넘어가겠습니다.
