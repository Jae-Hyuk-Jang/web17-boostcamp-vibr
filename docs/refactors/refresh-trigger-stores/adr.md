# ADR — refresh-trigger-stores

## 3안 비교

### 안 1 — 최소 개선안

`usePostReactionOverridesStore`를 그대로 두되, `usePostDetailModal.ts`의 본문수정 이중 쓰기만 정리한다(쿼리 캐시 쓰기 `updatePostContent`를 제거하고 스토어 쓰기만 남기거나, 반대로 스토어 쓰기를 제거하고 캐시만 남긴다). 좋아요/댓글수/삭제는 손대지 않는다.

### 안 2 — 경계 재설계안

좋아요/댓글수/본문 3개 필드를 `postDetailQueryKey(postId)` 쿼리 캐시로 정규화한다. 새 경량 읽기 훅(`usePostCacheSync`, 가칭)을 도입해 `PostCard` 등 목록 항목 소비처가 캐시를 구독하도록 하고, 쓰기 쪽(`usePostLikeToggle`, `usePostReactions`, `usePostDetailModal`)은 `queryClient.setQueryData`를 직접 호출하도록 전환한다. `deletedPostId`(목록 멤버십 제거 신호, writer/reader 각 1곳)는 값 동기화와 성격이 달라 정규화 대상에서 제외하고, 1개 필드만 남은 초경량 전용 스토어(`usePostDeletionSignalStore`)로 축소해 유지한다.

### 안 3 — 검증된 패턴 도입안

안 2와 동일하되, `deletedPostId`까지 쿼리 캐시 기반 신호로 전환한다 — `queryClient.getQueryCache().subscribe()`(TanStack Query의 캐시 이벤트 구독 API)를 이용해 `FeedView`가 "이 postId 캐시가 제거됨" 이벤트를 받아 자기 로컬 배열에서 필터링하게 만든다. `usePostReactionOverridesStore`를 완전히 제거한다.

## 비교표 (10개 고정 기준)

| #   | 기준                 | 안 1                                                     | 안 2                                                                          | 안 3                                                                                                                           |
| --- | -------------------- | -------------------------------------------------------- | ----------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| 1   | 근본 원인 해결력     | 낮음 — 이중화 근본 원인(캐시/스토어 이원화) 그대로       | 높음 — 값 동기화 3/4 필드 근본 해결                                           | 매우 높음 — 4/4 완전 해결                                                                                                      |
| 2   | 동작 보존 난이도     | 낮음(변경 작음) — 단, 캐시만 남기면 stale 위험 새로 생김 | 중간 — 6개 소비처 조정                                                        | 중간~높음 — 안 2 + 삭제 신호 재설계까지                                                                                        |
| 3   | 책임·의존성 변화     | 거의 없음                                                | 중간 — 값 필드는 캐시로, 삭제는 여전히 전용 스토어(경계 명확)                 | 큼 — 모든 동기화가 쿼리 캐시로 일원화, `getQueryCache().subscribe()`라는 신규 패턴 도입                                        |
| 4   | 테스트 용이성        | 낮음 — 근본 문제 안 풀림                                 | 중간~높음 — 기존 `usePostReactions`/`PostCard` 테스트 패턴 재사용 가능        | 중간 — 삭제 이벤트 구독 테스트는 QueryCache 이벤트 모킹이 필요해 다소 생소                                                     |
| 5   | 변경 범위            | 최소                                                     | 중간 — 6개 소비처, 3개 필드 + 신규 경량 훅 1개                                | 중간+ — 안 2 + 삭제 신호 메커니즘 추가                                                                                         |
| 6   | 점진적 전환 가능성   | 해당 없음                                                | 가능 — 필드별로 순차 전환 가능                                                | 가능 — 안 2 다음에 삭제만 추가로 전환 가능                                                                                     |
| 7   | 롤백 가능성          | 쉬움                                                     | 쉬움 — 값 필드/삭제 신호가 분리돼 있어 부분 롤백 용이                         | 중간 — 신규 이벤트 구독 패턴이라 롤백 시 더 신중해야 함                                                                        |
| 8   | 성능·운영 영향       | 없음                                                     | 없음                                                                          | 미미 — 전역 캐시 이벤트 콜백이 모든 캐시 변경마다 호출(필터링 포함), 무시 가능한 수준이지만 유일 API 사용 사례가 이거 하나뿐   |
| 9   | 기존 코드와의 일관성 | 높음(변경 없음) — 단, stale 위험은 새 비일관성           | 높음 — `usePostDetail`의 `enabled:false`/`initialData` 패턴(#144 선례)과 일관 | 중간 — "쿼리 캐시=서버 상태"라는 이 저장소의 기존 원칙에서 다소 벗어난 사용(캐시를 이벤트 버스로 씀)                           |
| 10  | 유지 비용            | 나쁨 — 이중화 문제 계속 유지                             | 좋음 — 스토어는 1필드로 초경량화, 나머지는 기존 패턴 재사용                   | 좋음(스토어는 완전 제거) — 그러나 "캐시-as-이벤트버스"라는 새 개념을 유일한 사례(writer/reader 각 1곳)를 위해 계속 유지해야 함 |

## 라이브러리 도입 심사

해당 없음 — 이미 도입된 TanStack Query(`@tanstack/react-query`)의 기존 API(`useQuery`, `queryClient.setQueryData`)를 확장 사용하는 것이며, 안 3의 `getQueryCache().subscribe()`도 같은 라이브러리의 공개 API다. 새 패키지 도입 없음.

## 의사결정 인터뷰 로그

(아래는 PRD 1-3 목표 인터뷰에서 이미 결정된 항목의 참조다 — ADR 단계에서 다시 묻지 않았다.)

- 사이클 범위: `usePostReactionOverridesStore`만 이번에 다루고 `useFeedRefreshStore`는 별도 후속으로 미룸(PRD 참고).
- 품질 속성 우선순위: 응집도/단일 진실 공급원.
- 필드 범위: 4개 필드(좋아요/댓글수/본문/삭제) 모두 이번 사이클에서 다룸.

ADR 설계 중 새로 발견해 물은 질문:

**Q. 좋아요/댓글수/본문 3개는 "같은 객체의 값 동기화"라 `postDetailQueryKey` 캐시로 깔끔하게 정규화되지만, `deletedPostId`는 "목록에서 항목을 제거하라"는 이벤트성 신호라 성격이 다릅니다(유일한 writer는 `PostHeader`, 유일한 reader는 `FeedView` 1곳씩뿐). 이 사실을 감안하면 `deletedPostId`도 쿼리 캐시로 옮길까요, 아니면 이것만 초경량 전용 신호로 따로 남길까요?**
A. 좋아요/댓글수/본문만 캐시로, 삭제는 초경량 전용 신호 유지(추천). 이유: writer/reader가 각각 1곳뿐인 단순 신호에 `QueryClient` 전역 이벤트 구독이라는 생소한 API를 도입하는 건 과잉이며, 스토어가 완전히 사라지지는 않지만(1필드만 남음) 이중쓰기와 응집도 문제는 거의 다 해결되고 기존 패턴(`usePostDetail`의 `enabled:false`)과 일관성이 높다.

## 선택: 안 2

안 2가 근본 원인(이중 쓰기, 값 동기화 스토어 의존)을 3/4 필드에서 완전히 해결하면서도, 유일한 예외(`deletedPostId`)에 대해서는 오버엔지니어링을 피했다. 안 1은 근본 문제를 해결하지 못하고, 안 3은 writer/reader가 각 1곳뿐인 신호를 위해 이 저장소에 없던 새 패턴(`QueryCache` 이벤트 구독)을 도입해야 해 유지 비용 대비 이득이 작다(의사결정 인터뷰 로그 참고).

## ADR 본문

### Context

`usePostReactionOverridesStore`는 좋아요/댓글수/본문/삭제 4개 필드를 관리한다. `usePostDetail`(#144)이 이미 `postDetailQueryKey(postId)` 쿼리 캐시로 상세보기 데이터를 관리하고 있어서, 본문수정은 이 캐시와 스토어 양쪽에 같은 값을 이중으로 쓰고 있다(`usePostDetailModal.ts` 129-144줄). 좋아요/댓글수는 캐시 쪽 대응물이 없어 스토어에만 의존한다. `deletedPostId`는 값 동기화가 아니라 "목록에서 이 postId를 제거하라"는 이벤트성 신호로, 유일한 writer(`PostHeader`)와 유일한 reader(`FeedView`)를 가진 별개의 문제다.

### Decision

좋아요(`likesByPostId`)/댓글수(`commentsByPostId`)/본문(`contentByPostId`) 3개 필드를 `postDetailQueryKey(postId)` 캐시로 정규화한다:

- **읽기**: 새 경량 훅 `usePostCacheSync(postId, passedPost)`를 도입한다 — `useQuery({queryKey: postDetailQueryKey(postId), queryFn: () => getPostDetail(postId), enabled: false, initialData: passedPost, staleTime: POST_DETAIL_STALE_TIME_MS})`을 감싸 `{ post: data ?? passedPost }`를 반환한다. `usePostDetail`(모달 전용, `enabled`가 "이 훅 자체의 활성 여부"를 겸하는 계약)은 건드리지 않고, "그냥 최신 캐시 값을 구독만 하고 싶다"는 별개의 계약을 가진 훅을 새로 만든다.
- **쓰기**: `usePostLikeToggle`, `usePostReactions`(댓글수), `usePostDetailModal`(본문, 기존 `updatePostContent` 재사용)이 각각 `queryClient.setQueryData(postDetailQueryKey(postId), (prev) => prev ? {...prev, ...변경 필드} : prev)`를 직접 호출한다.
- `PostCard`는 `usePostCacheSync(post.id, post)`로 얻은 `post`를 렌더링 소스로 쓴다(스토어 selector 제거).
- `deletedPostId`는 `usePostReactionOverridesStore.ts`를 `usePostDeletionSignalStore.ts`로 리네임하고 이 필드 하나만 남긴 초경량 스토어로 축소한다.

### Alternatives

- 안 1(최소 개선안) 기각: 이중 쓰기 문제의 근본 원인(두 개의 진실 공급원)을 해결하지 못한다. 캐시만 남기고 스토어를 없애는 국소 수정은 좋아요/댓글수가 여전히 스토어에 의존하므로 반쪽 해결이다.
- 안 3(완전 정규화) 기각: `deletedPostId`의 writer/reader가 각 1곳뿐인 상황에서 `QueryCache` 이벤트 구독이라는 이 저장소에 없던 패턴을 도입하는 비용이, 스토어를 완전히 없애는 이득보다 크다고 판단했다(사용자 확인).

### Consequences

**장점**: 좋아요/댓글수/본문 동기화가 `postDetailQueryKey` 캐시 하나로 단일화된다. `usePostDetailModal`의 이중 쓰기가 사라진다. `usePostReactionOverridesStore`는 1개 필드(`deletedPostId`)만 남아 스토어 자체의 복잡도가 크게 준다.

**단점/새 위험**: `usePostCacheSync`라는 신규 훅이 생겨 "언제 `usePostDetail`을 쓰고 언제 `usePostCacheSync`를 쓰는가"라는 새 판단 기준이 필요하다(전자는 모달처럼 `enabled`가 활성/비활성을 겸하는 곳, 후자는 목록 항목처럼 항상 구독만 하는 곳) — 문서화 필요(`CLAUDE.md`/컨벤션 갱신 대상).

**의도된 범위 축소**: PRD 목표 인터뷰에서는 "4개 필드 모두 다룬다"고 확정했지만, ADR 설계 중 `deletedPostId`의 성격이 다르다는 것을 발견해 "3개는 캐시로, 1개는 초경량 스토어로 유지"로 조정했다(의사결정 인터뷰 로그 참고). `usePostReactionOverridesStore` 자체는 완전히 사라지지 않고 `usePostDeletionSignalStore`로 리네임되어 남는다 — PRD의 "스토어 제거" Success Criteria는 "값 동기화 전용 스토어 제거"로 재해석되며, 이 재해석은 GATE 2에서 사용자 확인을 받는다.

### Migration

1. 특성화 테스트: `usePostLikeToggle`(현재 0건), `PostHeader` 삭제 동기화(현재 0건) 테스트를 추가한다. `usePostReactions`/`PostCard`/`usePostDetailModal`은 기존 테스트가 회귀 안전망 역할을 한다.
2. 새 경계 도입: `usePostCacheSync` 훅을 추가하고 계약 테스트를 작성한다(아직 아무도 쓰지 않음, 저장소 동작 변화 없음).
3. 좋아요/댓글수 동기화 경로 전환: `PostCard`가 `usePostCacheSync`로 읽도록, `usePostLikeToggle`/`usePostReactions`가 캐시에 쓰도록 함께 전환한다(읽기·쓰기를 분리하면 중간 상태에서 반영이 안 되므로 한 이슈로 묶는다).
4. 본문수정 이중 쓰기 해소: `usePostDetailModal`에서 `setContentOverride` 호출과 `likeOverride` 읽기(더 이상 필요 없음, `post.isLiked`/`post.likeCount`로 대체)를 제거한다.
5. 스토어 축소: `usePostReactionOverridesStore.ts` → `usePostDeletionSignalStore.ts` 리네임, `likesByPostId`/`commentsByPostId`/`contentByPostId`와 관련 액션 제거, `deletedPostId` 관련만 남긴다. 모든 import 경로 갱신.
6. `result.md` 작성 + 개발환경 실동작 확인.

### Rollback

각 체크포인트 이슈는 별도 커밋/PR 단위다. 3번(좋아요/댓글수 전환) 이후 피드-상세 동기화가 깨지면 그 커밋만 되돌리고 스토어 경로를 임시 복원한다. 5번(스토어 리네임)은 3·4번이 실동작까지 확인된 뒤에만 진행해 되돌릴 필요가 없도록 한다.

## 회귀 안전망

### 테스트 우선순위

1. **Characterization** — `usePostLikeToggle`(현재 0건): 낙관적 갱신, 롤백, 비로그인 비활성화, 스토어(현재)/캐시(이후) 브로드캐스트 호출 여부. `PostHeader`(현재 0건): 삭제 성공 시 `setDeletedPostId` 호출.
2. **Contract** — `usePostCacheSync`: `initialData`로 즉시 값 노출, `enabled:false`라 자체 fetch 안 함, 캐시에 다른 곳이 쓰면 재렌더링됨.
3. **State-transition** — 좋아요 토글 성공/실패에 따른 캐시 값 전이(낙관적 반영 → 성공 시 유지/실패 시 롤백).
4. **Integration** — `PostCard`(피드)와 `usePostDetailModal`(상세)이 같은 `postId`를 동시에 보여줄 때, 한쪽에서 좋아요/댓글/본문을 바꾸면 다른 쪽도 갱신되는지(기존 `usePostReactions.test.ts`/`PostCard.test.tsx`의 스토어 기반 검증을 캐시 기반으로 갱신).
5. **E2E**: 상시 스위트에는 추가하지 않음(#100 참고). GATE 3의 개발환경 실동작 확인에서 직접 검증.

### 회귀 시나리오

| 시나리오                                        | 기존 결과                                                        | 검증 수준        | 실패 시 조치 |
| ----------------------------------------------- | ---------------------------------------------------------------- | ---------------- | ------------ |
| 좋아요 토글 성공                                | 낙관적 반영 유지, 카드/모달 동기화                               | State-transition | 구현 중단    |
| 좋아요 토글 실패                                | 롤백, 카드/모달 모두 원복                                        | State-transition | 구현 중단    |
| 비로그인 좋아요 클릭                            | 버튼 비활성화, API 미호출                                        | Characterization | 구현 중단    |
| 댓글 작성 성공                                  | optimistic → 서버 id로 교체, commentCount 카드 반영              | Integration      | 구현 중단    |
| 본문 수정                                       | 캐시 1곳만 갱신, 카드/모달 모두 새 본문 표시(이중쓰기 제거 확인) | Integration      | 구현 중단    |
| 게시글 삭제                                     | 피드에서 해당 게시글 사라짐(기존처럼 `deletedPostId` 경로 유지)  | Characterization | 구현 중단    |
| 같은 postId를 피드+상세에서 동시에 볼 때 동기화 | 한쪽 변경이 다른 쪽에 즉시 반영                                  | Integration      | 구현 중단    |

## 체크포인트 이슈 목록

### 이슈 1 — usePostLikeToggle/PostHeader 특성화 테스트 추가

**AC**:

- `usePostLikeToggle`에 낙관적 갱신/롤백/비로그인 비활성화/스토어 브로드캐스트 호출 테스트 추가(현재 0건).
- `PostHeader`에 삭제 성공 시 `setDeletedPostId` 호출 테스트 추가(현재 0건).
- 구조 변경 없음, 기존 `pnpm test` 통과 유지.

**의존성**: 없음.

### 이슈 2 — usePostCacheSync 경량 캐시 읽기 훅 도입

**AC**:

- `usePostCacheSync(postId, passedPost)` 신규 훅 추가 — `postDetailQueryKey` 캐시를 구독만 하고 자체 fetch는 하지 않음(`enabled:false`), `passedPost`를 `initialData`로 시딩.
- 계약 테스트: `initialData` 즉시 노출, 캐시가 외부에서 갱신되면 반영됨, 자체 fetch 호출 없음.
- 아직 아무 소비처도 이 훅을 쓰지 않음(저장소 동작 변화 없음).

**의존성**: 없음(이슈 1과 병행 가능하나 순서상 다음에 배치).

### 이슈 3 — 좋아요/댓글수 동기화를 캐시 기반으로 전환

**AC**:

- `PostCard`가 `usePostCacheSync(post.id, post)`로 좋아요/댓글수/본문을 읽도록 전환(`usePostReactionOverridesStore`의 `likesByPostId`/`commentsByPostId` selector 제거).
- `usePostLikeToggle`이 브로드캐스트를 `queryClient.setQueryData`로 전환.
- `usePostReactions`의 `setGlobalCommentCount`가 `queryClient.setQueryData`로 전환.
- 이슈 1의 특성화 테스트가 캐시 기반 동작에 맞게 갱신되어 통과.
- 피드 카드-상세모달 동시 반영(회귀 시나리오) 통과.

**의존성**: 이슈 1, 이슈 2.

### 이슈 4 — 본문수정 이중 쓰기 해소

**AC**:

- `usePostDetailModal`에서 `setContentOverride` 호출 제거(캐시 쓰기 `updatePostContent`만 남김).
- `usePostDetailModal`의 `likeOverride` 읽기 제거, `post.isLiked`/`post.likeCount`(캐시 기반)로 대체.
- `FeedView`의 `contentByPostId`/`clearContentOverride` 사용 제거(더 이상 필요 없음, `PostCard`가 캐시를 직접 구독하므로).
- 본문 수정 회귀 시나리오 통과.

**의존성**: 이슈 3.

### 이슈 5 — usePostReactionOverridesStore를 usePostDeletionSignalStore로 축소

**AC**:

- `stores/usePostReactionOverridesStore.ts` → `stores/usePostDeletionSignalStore.ts` 리네임.
- `likesByPostId`/`commentsByPostId`/`contentByPostId`와 관련 액션 제거, `deletedPostId`/`setDeletedPostId`/`clearDeletedPostId`만 남김.
- 모든 import 경로(`PostHeader`, `FeedView`, 테스트 파일 포함) 갱신.
- `pnpm lint`/`pnpm check-types`/`pnpm test`/`pnpm build` 통과.

**의존성**: 이슈 4.

### 이슈 6 — 결과 검증 및 문서화(`result.md`, GATE 3)

**AC**:

- Before/After(스토어 필드 수, 이중쓰기 제거 여부, 테스트 수)를 prd.md 기준선과 비교.
- 개발환경에서 피드/상세모달 동시 열람 시 좋아요·댓글·본문·삭제 동기화를 직접 확인(인프라 제약이 있다면 #149 result.md와 동일하게 한계를 명시).
- `CLAUDE.md`의 "usePostReactionOverridesStore로 피드/상세모달 간 좋아요 상태 동기화" 예시 문구 갱신 여부 판단.
- Remaining Debt/Follow-ups 기록(`useFeedRefreshStore` 후속 이슈 포함).

**의존성**: 이슈 5.

---

**[GATE 2]** 위 대안 비교, 의사결정 인터뷰 로그, ADR, 회귀 안전망, 체크포인트 이슈 목록을 확인해주시면 이슈를 생성하고 구현으로 넘어가겠습니다.
