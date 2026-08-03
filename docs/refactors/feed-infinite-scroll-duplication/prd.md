# PRD — feed-infinite-scroll-duplication

## 문제 정의

`hooks/useInfiniteScroll.ts`(제네릭, 4개 소비처: `ProfilePostsFeed`, `ProfileView`, `useUserSearch`, `UserListModal`)와 `hooks/useFeedInfiniteScroll.ts`(`Post[]` 고정, 1개 소비처: `FeedView`)가 무한 스크롤 상태 머신(items/posts, hasNext, isLoading, errorMsg, isInitialLoading, `initialLoadedRef`/`prevResetKeyRef` 가드, `reset`/`loadInitialData`/`loadMore`, `useInView` 배선)을 사실상 동일하게 중복 구현하고 있다. `server-state-caching` 사이클(#139) PRD 진단 중 발견됐고 이슈 #149로 등록됐다.

지금 다뤄야 하는 이유: 두 훅 중 하나에서 버그(예: `loadMore` 가드 로직, 스크롤 트리거 임계값)를 고치면 다른 하나에는 반영되지 않는 채로 남는다. 실제로 이번 조사에서 그런 drift 사례를 하나 발견했다(아래 근거 참고).

## 비판적 진단 (시니어 개발자 시각)

### 근거

- **Fact**: 두 파일의 상태 선언·이펙트·헬퍼 함수 구조가 거의 1:1로 대응한다(직접 코드 대조, `apps/web/src/hooks/useInfiniteScroll.ts` 1-122줄 vs `useFeedInfiniteScroll.ts` 1-124줄).
- **Fact**: 실제 차이는 세 가지뿐이다.
  1. 커서 타입 — `useInfiniteScroll`은 제네릭 `T[]` + 단일 `nextCursor?: string`, `useFeedInfiniteScroll`은 `Post[]` 고정 + 다중 소스 `Cursor: {following, trending, recent}` + postId 기반 `dedupePosts`.
  2. `useFeedInfiniteScroll`만 `initialData?: Post[]`(공유 라우트에서 특정 글을 목록 맨 앞에 시딩) 파라미터를 받는다.
  3. `useInfiniteScroll`에 `initialError: Error | null` 상태가 있지만, `setInitialError`는 `reset()` 안에서 `null`로 되돌리는 호출 한 번뿐이고 실제 에러를 담는 코드 경로가 없다(`loadInitialData`의 catch 블록은 `errorMsg`만 설정한다) — **죽은 상태**다.
- **Fact**: 그런데 `useUserSearch.ts`(64-84줄)는 이 `initialError`를 읽어 `if (initialError) return 'error'`로 상태를 분기하고, 에러 메시지도 `initialError?.message`를 우선 사용한다. `initialError`가 항상 `null`이므로 이 분기는 현재 코드 상 절대 진입할 수 없는 죽은 브랜치다 — 두 훅이 나뉘어 있으면서 한쪽의 미완성 상태가 소비처에 새어나간 구체적 사례.
- **Fact**: 두 훅 모두 테스트 파일이 없다(`find . -iname "*useInfiniteScroll*" -o -iname "*useFeedInfiniteScroll*"` → 소스 파일 2개만 존재).
- **Inference**: 두 훅이 각각 언제 만들어졌는지는 이 저장소 히스토리로는 알 수 없다(`git log --follow`가 둘 다 "initial commit"까지만 보여줌 — 팀 프로젝트 시절 히스토리가 스쿼시됨). "먼저 있던 훅을 복사해서 피드 전용으로 다시 짰다"는 추정은 Hypothesis이며 근거 등급을 Fact로 올릴 수 없다.
- **Inference**: `ProfilePostsFeed`의 `fetchFn`은 훅 자체가 아니라 소비처 레벨에서 N+1 상세조회 + `queryClient.setQueryData` 캐시 시딩(#144 TanStack Query 전환분)을 하고 있다. 이는 훅 통합과 독립적인 소비처 로직이라 이번 리팩터링 범위에 영향을 주지 않는다.

### 증상 → 원인 체인

증상: 두 훅이 상태 머신 코드를 거의 그대로 중복하고 있다.
→ (왜?) 직접 원인: 커서 형태(단일 vs 다중소스+dedupe)와 초기 데이터 시딩(`initialData`) 요구사항이 훅마다 달라서, 하나의 구현을 공유하지 않고 각자 새로 짰다.
→ (왜?) 구조 원인: "무한 스크롤의 상태 전이 로직(로딩/에러/재시도/스크롤 트리거 시점)"과 "데이터 셰이프 정책(커서 형태, dedupe·시딩 전략)"이 한 훅 안에 뒤섞여 있다. 전이 로직은 두 훅에서 완전히 동일한데, 셰이프 정책 하나가 다르다는 이유로 전이 로직까지 통째로 다시 구현해야 하는 구조다.

### 아키텍처 관점

- 저장소 반복 패턴인가?: 이 저장소에서 "제네릭 훅 vs 도메인 전용 훅"이 병렬로 존재하는 사례는 이 한 쌍이 유일하다(`Explore`로 재확인하지 않았으나, `hooks/` 배럴(`hooks/index.ts`)에 무한스크롤류 항목이 이 둘뿐임 — Fact).
- 기존 컨벤션과 충돌하는가?: `CLAUDE.md`의 "커스텀 훅은 `use{도메인}{동작}.ts`로 명명" 컨벤션 자체와는 충돌하지 않는다. 다만 `docs/conventions.md`에 무한스크롤 훅 통합/분리 기준을 명시한 이전 ADR은 없다(신규 판단).
- 전제가 깨진 결정인가, 애초에 근거가 약했던 결정인가?: 판단 불가(Hypothesis) — 다중 소스 커서라는 요구사항 자체는 지금도 유효하므로 "전제가 깨졌다"기보다는, 애초에 상태 전이 로직과 데이터 셰이프 정책을 분리하지 않고 통째로 복제한 설계였을 가능성이 높다.

### 비판적 재검토 (사용자 문제 제기에 대한 반박 질문과 답)

- **이 증상이 정말 구조 문제인가, 우연한 버그인가?** 구조 문제에 더 가깝다. `initialError` 죽은 상태 사례처럼, 한쪽 훅의 변경이 다른 쪽에 반영되지 않는 게 우연이 아니라 필연적 구조(두 개의 독립된 진실 소스)이기 때문이다.
- **지금 안 고치면 다음 몇 번의 실제 변경에서 구체적으로 어떤 비용이 드는가(YAGNI)?** 무한스크롤 관련 다음 변경(예: 로딩 스피너 지연시간 조정, 에러 재시도 정책 변경, `rootMargin`/`threshold` 튜닝)마다 두 파일을 동시에 고쳐야 하고, 하나를 빠뜨리면 지금 발견한 `initialError`류의 drift가 계속 쌓인다. 다만 무한스크롤 정책 변경이 실제로 얼마나 자주 있었는지는 커밋 히스토리가 스쿼시돼 있어 빈도를 정량화할 수 없다(측정 불가).
- **더 급한 다른 문제를 가리는 건 아닌가?** 아니다 — 이 이슈는 `server-state-caching`(#139) 사이클에서 부수적으로 발견돼 별도로 분리된 것이며, 다른 백로그(#153 등)와 범위가 겹치지 않는다. 목표 인터뷰에서 useInfiniteQuery 전환까지 포함할지 물었고, 사용자가 범위를 훅 통합으로 명시적으로 좁혔다(아래 참고).

## 목표와 범위

### Goal

`useInfiniteScroll`과 `useFeedInfiniteScroll`을 하나의 구현으로 통합해, 무한 스크롤 상태 전이 로직(로딩/에러/재시도/스크롤 트리거/reset)이 한 곳에만 존재하게 한다. 데이터 셰이프 정책(커서 형태, dedupe, 초기 데이터 시딩)은 제네릭 파라미터/옵션으로 흡수한다.

### Success Criteria

- `useFeedInfiniteScroll.ts` 파일이 제거되고, 5개 소비처(`ProfilePostsFeed`, `ProfileView`, `useUserSearch`, `UserListModal`, `FeedView`) 모두 통합된 단일 훅을 사용한다.
- `initialError` 같은 죽은 상태가 통합 후 남지 않는다(실제로 쓰이지 않으면 제거, 쓰인다면 실제로 채워지도록 고침).
- 통합된 훅에 최소 characterization 테스트(초기 로드, `loadMore` 가드, 에러 처리, `resetKey` 재조회)가 추가된다 — 목표 인터뷰에서 "테스트 용이성"을 최우선 품질 속성으로 선택함에 따름.
- 5개 소비처의 기존 UI 동작(로딩 스피너 노출 시점, 에러 메시지, 스크롤 트리거 시점, `resetKey`/`initialData` 시딩)이 전후 동일하다.

### Out of Scope

- 무한스크롤 데이터 조회를 TanStack Query(`useInfiniteQuery`)로 전환하는 것 — 목표 인터뷰에서 "훅 통합만 진행"으로 명시적으로 범위를 좁힘. `useFeedRefreshStore` 등 관련 후속 검토는 이슈 #153에 남겨둔다.
- `useFeedRefreshStore`/`usePostReactionOverridesStore` 전환(#153에서 별도 다룸).
- 무한스크롤 UI(스켈레톤, 스피너 디자인) 변경.
- API 응답 포맷(`InfiniteResponse<T>`, `FeedResponseDto`) 변경.
- 5개 소비처 외 다른 화면의 데이터 페칭 패턴 변경.

### Behavior Invariants

- 5개 소비처 각각의 무한스크롤 트리거 시점(`rootMargin: '200px'`, `threshold: 0.8`)은 동일하게 유지된다.
- 로딩 중 `loadMore` 재호출 방지(`hasNext`/`isLoading` 가드)는 유지된다.
- 에러 발생 시 `errorMsg` 표시 및 재시도(다음 스크롤 트리거 시 재요청) 동작은 유지된다.
- `resetKey` 변경 시 전체 초기화 후 재조회하는 동작은 유지된다.
- `ProfilePostsFeed`의 postId별 TanStack Query 캐시 시딩(`setQueryData`)은 유지된다.
- `FeedView`의 `initialData`(공유 라우트 초기 게시글) 시딩 동작은 유지된다.
- (통합 과정에서 허용된 범위) 소비처 호출부의 `fetchFn` 시그니처 등은 제네릭 인터페이스에 맞게 최소 수정될 수 있다 — 목표 인터뷰에서 "소비처 호출부 최소 수정 허용"으로 확정.

## 기준선 검증

| 명령                   | 결과    | 실패 항목 | 비고                                                                                                                                           |
| ---------------------- | ------- | --------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm lint`            | ✅ 성공 | 없음      | 4/4 태스크 성공(캐시 3, 신규 실행 1), 13.6s                                                                                                    |
| `pnpm check-types`     | ✅ 성공 | 없음      | 3/3 태스크 성공(`@repo/dto`, `@repo/ui`, `web`), 4.7s. `api` check-types 태스크는 스코프에 포함되지 않음(turbo 파이프라인상 web/dto/ui만 대상) |
| `pnpm test` (apps/web) | ✅ 성공 | 없음      | 25 suites / 116 tests 모두 통과, 6.3s. `useInfiniteScroll`/`useFeedInfiniteScroll` 자체 테스트는 0건(안전망 공백, Success Criteria에 반영)     |
| `pnpm build`           | ✅ 성공 | 없음      | 3/3 태스크 성공(캐시 2, 신규 1), 18.8s. 16개 라우트 정상 생성                                                                                  |

측정 불가: 두 훅 관련 변경 빈도(히스토리 스쿼시로 커밋 단위 추적 불가), 번들 크기 개별 기여분(하나의 Next.js 번들에 포함돼 분리 측정 어려움 — 통합 후 총 파일 수/라인 수 감소로 대체 측정 예정).

변경 영향 파일 수(예상): 훅 파일 2개(통합 후 1개), 소비처 5개, 신규 테스트 파일 1개.

---

**[GATE 1]** 위 진단·목표·범위·Behavior Invariants·기준선을 확인해주시면 다음 단계로 넘어가겠습니다.
