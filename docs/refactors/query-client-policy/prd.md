# PRD — query-client-policy

## 문제 정의

`apps/web/src/components/providers/QueryProvider.tsx`의 `new QueryClient()`가 인자 없이 생성돼 있다. 전역 `defaultOptions`도, `QueryCache`/`MutationCache` 레벨의 공통 에러 핸들러도 없다. 그 결과 (1) `staleTime`을 명시하지 않은 쿼리가 라이브러리 기본값(`staleTime: 0`)을 암묵적으로 쓰고, (2) mutation 실패 시 사용자에게 알리는 책임이 mutation을 작성하는 개발자 각자에게 맡겨져 있어 절반 가까이가 조용히 실패한다.

`query-key-centralization`(#216) 사이클 종료 후 TanStack Query 전체 사용처를 훑는 과정에서 발견됐고, "중앙관리"에 가장 부합하는 지점인데 어느 사이클에서도 다뤄지지 않았다는 점에서 지금 다룰 가치가 있다고 판단했다(백로그 이슈 #220).

## 비판적 진단 (시니어 개발자 시각)

### 근거

- **[Fact]** `QueryProvider.tsx:9` — `const queryClient = new QueryClient();`. `defaultOptions` 인자 없음.
- **[Fact]** TanStack Query v5 라이브러리 기본값: `staleTime: 0`(쿼리), 쿼리 `retry: 3`·mutation `retry: 0`. `defaultOptions`를 안 주면 이 값이 전부 적용된다.
- **[Fact]** `staleTime`을 명시적으로 준 쿼리는 4개뿐이다: `AUTH_ME_STALE_TIME_MS`(5분, `useAuthMeQuery.ts`), `PROFILE_STALE_TIME_MS`(60초, `useProfile.ts`), `PLAYLIST_DETAIL_STALE_TIME_MS`(60초, `usePlaylistDetail.ts`), `POST_DETAIL_STALE_TIME_MS`(60초, `usePostDetail.ts`). 나머지(`feedQueryKey`, `PLAYLISTS_QUERY_KEY`, `commentsQueryKey`, `useInfiniteQuery` 5곳 전부)는 `staleTime` 미설정 → 0.
- **[Fact]** `docs/tanstack-query/index.html:529`에 `AUTH_ME_STALE_TIME_MS`를 나중에 추가하게 된 경위가 기록돼 있다 — 처음엔 `staleTime` 없이 구현했다가, 정적 테스트는 못 잡고 **`pnpm dev` 실동작 확인 중에만** "게시글 상세를 열 때마다 불필요한 재요청이 발생하는" 회귀를 발견해서 수정했다. 즉 이 저장소는 "새 쿼리를 추가할 때 `staleTime`을 반드시 검토한다"는 지침을 문서(`docs/tanstack-query/index.html:742`)로만 갖고 있고, 구조적으로 강제하지 않는다 — 지침을 놓치면 실동작 확인 전까지 안 드러나는 걸 이미 한 번 경험했다.
- **[Fact]** 저장소의 실제 TanStack `useMutation` 인스턴스 9개와 각각의 실패 시 사용자 피드백을 전수 확인한 결과:

  | mutation                                                                  | 파일                      | 실패 시 사용자 피드백                                                                                                                                                                                   |
  | ------------------------------------------------------------------------- | ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
  | `changeOrderMutation`/`addSongMutation`/`renameMutation`/`deleteMutation` | `PlaylistDetailModal.tsx` | `toast.error(...)` ✅                                                                                                                                                                                   |
  | `followMutation`                                                          | `ProfileActionButton.tsx` | `toast.error(...)` ✅                                                                                                                                                                                   |
  | `updateProfileMutation`                                                   | `ProfileInfo.tsx`         | **없음** — `onError` 자체가 정의돼 있지 않고, `isError`/`error`도 렌더링에서 읽지 않는다. 실패해도 `setIsEditing(false)`가 안 불려서 편집 폼이 열린 채로 남을 뿐, 실패했다는 표시가 화면 어디에도 없다. |
  | `readNotiMutation`/`readAllNotisMutation`/`deleteAllNotisMutation`        | `useNotifications.ts`     | **없음** — `onError`가 `context.previous`로 캐시만 조용히 롤백.                                                                                                                                         |
  | `createCommentMutation`                                                   | `usePostReactions.ts`     | **없음** — `onError`가 실패한 tmp-id 항목만 필터로 제거.                                                                                                                                                |

  9개 중 4개(약 44%)가 실패를 사용자에게 전혀 알리지 않는다.

- **[Fact]** `usePostLikeToggle.ts`(좋아요 토글)는 `useMutation`이 아니라 수동 `try/catch`로 구현돼 있고, `catch` 블록도 로컬 state·캐시만 롤백할 뿐 사용자 피드백이 없다 — TanStack `useMutation` 기반이 아니므로 `MutationCache` 전역 핸들러를 도입해도 이 경로는 적용 대상이 아니다(구조적 한계).
- **[Fact]** `docs/tanstack-query/index.html:336`에 이미 낙관적 업데이트 롤백 전략(스냅샷 복원 vs tmp-id filter)을 "공용 추상화로 묶지 않기로 결정"한 기록이 있다 — 이건 **롤백 방식**에 대한 기존 결정이고, 이번 사이클이 다루는 **실패를 사용자에게 알리는 책임**과는 다른 관심사다. 같은 `onError` 콜백 안에 있어 섞이기 쉬우므로 범위를 명확히 분리해야 한다.

### 증상 → 원인 체인

**증상 1**: mutation 실패 시 사용자 피드백이 케이스마다 다르다(9개 중 5개는 toast, 4개는 완전 침묵).
→ (왜?) 각 mutation 작성자가 `onError`를 개별적으로 작성하면서 toast 여부를 그때그때 판단했다.
→ (왜?) `QueryClient`에 전역 `MutationCache.onError`가 없어서, "실패를 알린다"가 인프라 레벨 보장이 아니라 매번 개별 훅이 빠뜨릴 수 있는 선택 사항으로 남아 있다.
→ **구조 원인**: 에러 피드백 책임이 `QueryClient` 설정(인프라 레벨)이 아니라 각 mutation 작성 시점의 개별 판단(호출부 레벨)에 있다.

**증상 2**: `staleTime` 미설정 쿼리가 다수(`feed`, `playlists`, `comments`, `useInfiniteQuery` 5곳 전부)이고, 이게 문제였던 사례(`AUTH_ME`)가 실제로 한 번 있었다.
→ (왜?) 각 훅이 `staleTime`을 명시하지 않으면 라이브러리 기본값 0이 조용히 적용된다.
→ (왜?) "새 쿼리 추가 시 `staleTime`을 검토한다"는 지침이 `docs/tanstack-query/index.html`이라는 **문서로만** 존재하고, 코드 구조(린트·타입체크·기본값)로는 강제되지 않는다.
→ **구조 원인**: 전역 fallback(`defaultOptions.staleTime`)이 없어서, 지침을 놓치는 순간 곧바로 "대부분의 화면에서 원치 않는 즉시 재요청(0)"이라는 기본 동작으로 이어진다.

### 아키텍처 관점

- 이 문제는 특정 도메인(post/playlist/profile 등)에 국한되지 않는다 — `QueryProvider.tsx`라는 저장소 전체에 딱 하나 있는 진입점의 설정 공백이라, 고치면 모든 도메인에 동시에 적용되고 앞으로 추가되는 모든 새 쿼리/mutation에도 자동으로 적용된다. 반대로 지금처럼 두면 새 mutation을 추가할 때마다 "이번에도 toast를 깜빡하지 않았는지"를 사람이 매번 기억해야 한다.
- `CLAUDE.md`나 기존 ADR 중 이 설정을 명시적으로 "지금은 안 한다"고 결정한 기록은 없다 — `server-state-caching`(#148) 등 TanStack Query를 처음 도입한 사이클들이 각 쿼리 단위 마이그레이션에 집중하느라 `QueryClient` 자체의 전역 정책은 애초에 논의되지 않은 것으로 보인다(Inference — 관련 사이클 문서에 반대 근거가 없음).
- "당시엔 맞았지만 전제가 깨진" 결정이 아니라, **애초에 한 번도 결정되지 않은 공백**에 가깝다.

### 비판적 재검토 (사용자 문제 제기에 대한 반박 질문과 답)

- **이 증상이 정말 구조 문제인가, 우연인가?** — mutation 4개가 동일하게 "롤백만 하고 피드백 없음" 패턴을 반복하는 건 우연으로 보기 어렵다(반복 빈도 Fact). 다만 `staleTime` 미설정이 전부 실수는 아닐 수 있다 — `comments`/`notifications`는 `refetchInterval`로 신선도를 이미 확보하고 있어 `staleTime: 0`이 오히려 의도에 가까울 수 있다(Hypothesis, ADR에서 쿼리별로 재검증 필요).
- **지금 안 고치면 다음 몇 번의 변경에서 무슨 비용이 드는가?** — 새 mutation을 추가할 때마다 toast 여부를 또 개별 판단해야 하고, 이미 4번 반복된 "깜빡함"이 다음 mutation에서도 반복될 가능성이 높다(Inference). `staleTime` 쪽은 `AUTH_ME` 사례처럼 dev 서버 실동작 확인 전까지 안 드러나는 회귀를 이미 한 번 만들었다.
- **더 급한 다른 문제를 가리는 건 아닌가?** — `onError`의 "롤백 방식"(#218 범위)과 "사용자에게 알리는 방식"(이번 사이클)은 같은 콜백 안에 있지만 다른 관심사다. 이번 사이클은 후자만 다루고 전자는 명시적으로 Out of Scope로 둔다. 전역 `staleTime` 기본값을 섣불리 올리면 오히려 실시간성이 필요한 화면(`comments`, `feed`)에서 새 버그를 만들 수 있어, 정적 판단만으로 값을 정하지 않고 ADR/구현 단계에서 쿼리별 영향을 실동작으로 재확인한다.

## 목표와 범위

### Goal

`QueryClient`에 전역 `defaultOptions`(staleTime 포함)와 `QueryCache`/`MutationCache` 레벨 공통 에러 핸들러를 도입해, "새 쿼리/mutation을 추가할 때 신선도·에러 피드백을 개별적으로 챙겨야 하는" 현재 구조를 "기본값이 안전 쪽으로 깔려 있고 필요할 때만 개별 오버라이드하는" 구조로 바꾼다.

### Success Criteria

- 저장소의 TanStack `useMutation` 인스턴스 9개 전체가 실패 시 최소 하나의 사용자 피드백(토스트 등)을 받는다(현재 4개 침묵 → 0개).
- 동일 실패에 대해 토스트가 중복으로 뜨지 않는다(로컬 `onError`와 전역 핸들러가 동시에 안 뜬다).
- `defaultOptions.staleTime` 전역값이 도입되고, 기존에 명시적으로 값을 준 4개 쿼리의 `staleTime`은 그대로 유지된다.
- `refetchInterval`을 쓰는 쿼리(`notifications`, `comments`)의 폴링 동작과, `invalidateQueries`/`setQueryData`/`setQueriesData` 호출 시점·대상은 전역값 도입 전후로 동일하다.
- `pnpm lint`/`check-types`/`test`/`build`가 베이스라인과 동일하게 통과하고, `pnpm dev` 실동작으로 최소 1개 성공 흐름 + 1개 인위적 실패 흐름(네트워크 차단 등)에서 토스트 중복 없이 정상 동작함을 확인한다.

### Out of Scope

- 낙관적 업데이트의 **롤백 방식**(스냅샷 복원 vs tmp-id filter) 통합 — 별도 이슈 #218.
- `useInfiniteQuery`의 `getNextPageParam`/`initialPageParam` 보일러플레이트 통합 — 별도 이슈 #219.
- `usePostLikeToggle.ts`(좋아요 토글)를 `useMutation`으로 전환하는 것 — 현재 수동 `try/catch` 구조라 `MutationCache` 전역 핸들러의 적용 대상이 아니다. 이번 사이클 종료 후에도 이 경로는 여전히 조용히 실패한다 — 전환 여부는 별도 판단이 필요해 이번 범위에 넣지 않는다(Remaining Debt로 남긴다).
- `useInlineEditField.ts`/`usePostDetailModal.ts`의 게시글 본문 수정 에러 처리 — TanStack `useMutation`이 아니라 별도 커스텀 커밋 훅(`onCommitError` 콜백) 기반이라 이번 `QueryClient` 설정 범위 밖. 이미 자체적으로 `toast.error`를 호출하고 있어 시급하지 않다.
- 각 mutation의 **개별 toast 메시지 문구**를 공통 문구로 대체하는 것은 Out of Scope가 아니라 오히려 **명시적으로 포함**한다(아래 결정 참고) — 헷갈리지 않도록 여기 기록.
- `staleTime` 전역 기본값의 **구체적인 숫자**(예: 30초 vs 60초)와, 쿼리별로 그 값을 그대로 받아들일지 개별 오버라이드가 필요한지는 ADR 단계에서 결정한다.

### 목표 인터뷰에서 확정된 결정

- **범위**: "에러 핸들러만" vs "`staleTime` 전역 기본값까지 포함" 중, 사용자가 **"둘 다 포함"**을 선택했다. AI 추천은 "에러 핸들러만"(근거: `staleTime` 미설정이 일부 쿼리에서는 의도적일 수 있어 검증 비용이 더 크다)이었으나, 사용자는 "두 문제 다 같은 근본 원인(전역 정책 부재)이니 한 번에 정리"하는 쪽을 택했다. 이에 따라 ADR과 구현 단계에서 쿼리별 `staleTime` 영향을 실동작으로 하나씩 검증하는 절차를 필수로 둔다(중단 조건에 반영).
- **기존 toast 5곳 처리**: "기존 5곳 유지 + 전역 핸들러는 로컬 피드백 없는 곳에만 적용" vs "전부 전역 핸들러로 통일하고 개별 toast 제거" 중, 사용자가 **"전부 전역 핸들러로 통일"**을 선택했다. AI 추천은 전자(근거: 기존 메시지 문구가 더 구체적)였으나, 사용자는 유지보수 지점을 하나로 줄이는 쪽을 택했다. 결과적으로 `PlaylistDetailModal.tsx`의 4개 mutation과 `followMutation`이 갖고 있던 구체적 메시지 문구(예: "플레이리스트 삭제에 실패했습니다")는 이번 사이클에서 사라지고 공통 문구로 대체된다 — 이건 사용자가 명시적으로 승인한 메시지 UX 변경이므로 Behavior Invariant 위반이 아니라 **의도된 범위**로 기록한다.

## Behavior Invariants

- 기존에 명시적으로 `staleTime`을 설정한 4개 쿼리(`PROFILE`/`PLAYLIST_DETAIL`/`POST_DETAIL`=60초, `AUTH_ME`=5분)의 값은 바뀌지 않는다.
- `refetchInterval`을 쓰는 쿼리(`notifications` 5초, `comments` 함수형)의 폴링 주기·조건은 전역 `staleTime` 도입 후에도 동일하게 동작한다.
- `invalidateQueries`/`setQueryData`/`setQueriesData` 호출 시점과 대상 쿼리키는 바뀌지 않는다(무효화는 `staleTime`과 무관하게 항상 강제 재요청을 일으킨다).
- 각 mutation의 낙관적 업데이트(`onMutate`)와 롤백 로직 자체(스냅샷 방식, tmp-id filter 방식)는 바뀌지 않는다 — 이번 사이클은 "실패를 사용자에게 알리는 방법"만 통일하고 "롤백 방식"은 건드리지 않는다.
- 로그인하지 않은 사용자·`enabled: false`인 쿼리의 동작(요청 자체를 안 함)은 바뀌지 않는다.

**변경이 승인된 것(참고, invariant 아님)**: `PlaylistDetailModal.tsx`·`ProfileActionButton.tsx`의 개별 `toast.error` 메시지 문구는 공통 문구로 대체된다(위 "목표 인터뷰에서 확정된 결정" 참고).

## 기준선 검증

| 명령               | 결과 | 실패 항목 | 비고                            |
| ------------------ | ---- | --------- | ------------------------------- |
| `pnpm lint`        | 성공 | 없음      | 6개 패키지 전부 통과(캐시 히트) |
| `pnpm check-types` | 성공 | 없음      | 3개 패키지 전부 통과(캐시 히트) |
| `pnpm test` (api)  | 성공 | 없음      | 8 suites / 37 tests             |
| `pnpm test` (web)  | 성공 | 없음      | 40 suites / 225 tests           |
| `pnpm build`       | 성공 | 없음      | web 14개 라우트 정상 생성       |

측정 가능 지표: 이번 사이클의 변경 영향 파일 수는 `QueryProvider.tsx`(defaultOptions 추가) 1곳 + `onError`를 정리하는 mutation 9곳(4곳은 로컬 `onError` 제거/단순화) + 테스트 파일(토스트 검증 방식이 바뀌는 테스트가 있다면)로 예상된다. 정확한 수는 ADR의 이슈 분해 단계에서 확정한다.

---

**[GATE 1]** 위 진단·목표·범위·Behavior Invariants·기준선을 확인해주시면 다음 단계로 넘어가겠습니다.
