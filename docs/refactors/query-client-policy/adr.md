# ADR — query-client-policy

## 3안 비교

### 안 1 — 최소 개선안 (채택)

`QueryProvider.tsx`의 `new QueryClient()`에 `defaultOptions.queries.staleTime`(전역 60초)과 `mutationCache: new MutationCache({ onError: ... })`(공통 토스트 1종)만 추가한다. `QueryCache`는 건드리지 않는다. 기존에 로컬 `toast.error`를 호출하던 5곳(playlist 4개 mutation + `followMutation`)은 호출을 제거해 전역 핸들러와 중복되지 않게 한다. 나머지 4곳(`updateProfileMutation`, noti×3, `createCommentMutation`)의 로컬 `onError`(캐시 롤백)는 그대로 두되, 이제 전역 핸들러가 자동으로 토스트를 추가해준다.

### 안 2 — 경계 재설계안 (기각)

`MutationCache` + `QueryCache` 둘 다 전역 처리하고, HTTP status/에러 타입별로 메시지를 분기하며, `staleTime`도 `constants/query.ts`에 도메인 성격별(list/detail/realtime) 계층 상수를 새로 설계한다.

### 안 3 — 자체 구현안: meta 기반 옵트인 메시지 (기각)

전역 핸들러는 `mutation.meta?.errorMessage`가 있을 때만 그 문구를, 없으면 공통 문구를 보여주는 조회형 구조. 각 mutation 정의부에 `meta: { errorMessage: '...' }`를 남겨 메시지 커스터마이징을 유지한다.

## 비교표 (10개 고정 기준)

| #   | 기준                 | 안 1                                                              | 안 2                                                                   | 안 3                                                                                         |
| --- | -------------------- | ----------------------------------------------------------------- | ---------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| 1   | 근본 원인 해결력     | mutation 침묵 문제를 100% 해결(9/9). staleTime 미설정 문제도 해결 | 동일 + 쿼리 에러까지 해결                                              | 동일(메시지 세분화는 유지)                                                                   |
| 2   | 동작 보존 난이도     | 낮음 — 로컬 toast 제거 5곳만 동작이 바뀜(승인된 범위)             | 높음 — `/user/me` 401과의 충돌 회피 로직 필요                          | 중간 — meta 스펙을 매 mutation에 새로 얹어야 함                                              |
| 3   | 책임·의존성 변화     | `QueryProvider.tsx` 1곳이 "에러 피드백 여부"의 유일한 소유자가 됨 | 위와 동일 + 쿼리 계층까지 소유                                         | 소유권이 `QueryProvider.tsx`와 각 mutation의 `meta`로 다시 분산됨                            |
| 4   | 테스트 용이성        | `MutationCache.onError` 단위로 한 번만 검증하면 됨                | QueryCache 케이스(특히 401 예외)까지 추가 검증 필요                    | mutation마다 meta 유무별 분기 검증 필요                                                      |
| 5   | 변경 범위            | `QueryProvider.tsx` + mutation 5곳(토스트 제거)                   | 위 + `internal/client.ts` 401 예외 처리 + 쿼리별 staleTime 계층 재설계 | `QueryProvider.tsx` + mutation 9곳 전부(meta 추가)                                           |
| 6   | 점진적 전환 가능성   | 높음 — 한 파일 수정으로 즉시 전체 적용                            | 낮음 — QueryCache 예외 규칙을 다 정한 뒤에만 안전                      | 중간 — meta 없는 mutation은 fallback으로 자연 전환되지만 커스텀 문구를 원하면 개별 작업 필요 |
| 7   | 롤백 가능성          | 매우 높음 — `mutationCache` 인자 제거 한 줄이면 원복              | 중간 — QueryCache 예외 로직까지 같이 걷어내야 함                       | 높음                                                                                         |
| 8   | 성능·운영 영향       | 없음(클라이언트 설정)                                             | 없음                                                                   | 없음                                                                                         |
| 9   | 기존 코드와의 일관성 | PRD가 이미 "전부 전역 핸들러로 통일" 결정과 정확히 일치           | PRD 결정과 부분 상충(쿼리까지 확대는 별도 근거 필요)                   | PRD의 "개별 메시지 제거" 결정과 상충                                                         |
| 10  | 유지 비용            | 낮음 — 새 mutation은 아무것도 안 해도 자동 커버됨                 | 중간 — 새 쿼리 추가 시마다 예외 규칙 검토 필요                         | 높음 — 커스텀 메시지가 필요한 mutation마다 meta 관리 필요                                    |

## 라이브러리 도입 심사

해당 없음 — 새 패키지를 추가하지 않는다. `QueryClient` 생성자의 `defaultOptions`/`queryCache`/`mutationCache`는 `@tanstack/react-query`(이미 설치됨)의 내장 옵션이고, 토스트는 이미 저장소 전역에서 쓰는 `react-toastify`를 그대로 재사용한다.

## 의사결정 인터뷰 로그

PRD 단계(목표 인터뷰)에서 이미 확정된 두 결정을 여기서 다시 묻지 않고 참조만 한다:

- 범위: "에러 핸들러만" vs "`staleTime` 전역 기본값까지 포함" → **"둘 다 포함"** 선택(PRD 참고).
- 기존 toast 5곳 처리: "기존 유지 + 로컬 피드백 없는 곳만 보완" vs "전부 전역 핸들러로 통일" → **"전부 통일"** 선택(PRD 참고).

ADR 단계에서 새로 필요했던 세 가지 기술 결정:

```markdown
**Q. 전역 에러 핸들러를 MutationCache에만 붙일까요, QueryCache(일반 쿼리 실패)까지 포함할까요? 이미 4개 쿼리 소비처가 `isError`로 인라인 에러 UI를 그리고 있고, `internal/client.ts`의 401 인터셉터와 겹치면 모달+토스트 중복이 생깁니다.**
A. MutationCache만(추천). 이유: mutation은 9개 중 4개가 침묵하는 실제 문제가 확인됐지만, 쿼리는 이미 컴포넌트 단위로 `isError` 인라인 에러 UI가 있어 전역 토스트를 더하면 오히려 중복이다. `/user/me` 401과의 충돌 위험까지 있어 이번 사이클은 근거가 확실한 mutation 쪽만 다룬다.
```

```markdown
**Q. 전역 staleTime 기본값을 몇 초로 정할까요? 기존에 명시적으로 staleTime을 준 4개 쿼리(PROFILE/PLAYLIST_DETAIL/POST_DETAIL/AUTH_ME 중 3개)가 모두 60초입니다.**
A. 60초(추천). 이유: 기존 3개 쿼리가 이미 검증해서 선택한 값이라 새 기본값으로 그대로 쓰면 "이 저장소의 개별 선택을 일반화한다"는 명확한 근거가 생긴다. feed/comments/playlists 등은 refetchInterval이나 명시적 invalidateQueries로 신선도를 별도로 확보하므로 60초로 올려도 문제가 적을 것으로 예상하되, 구현 단계에서 dev 서버 실동작으로 재확인한다.
```

```markdown
**Q. 전역 mutation 실패 메시지를 완전히 하나의 공통 문구로 통일할까요, 아니면 에러 종류별로 최소 분기할까요?**
A. 단일 공통 문구(추천). 이유: PRD에서 이미 "개별 toast 제거하고 전역 핸들러로 통일"하기로 결정했다 — 에러 종류별 분기까지 들어가면 그 결정의 취지(유지보수 지점을 하나로 줄임)와 반대로 다시 개별화하는 셈이 된다. 가장 단순하고 테스트하기 쉽다.
```

## 선택: 안 1

안 2는 PRD가 이미 결정한 범위("에러 핸들러만 vs staleTime 포함" 논쟁)와는 다른 축("QueryCache까지 포함할지")에서 근거가 약하다 — 쿼리는 이미 인라인 에러 UI가 있고, `/user/me` 401 인터셉터와 충돌 위험이 구체적으로 확인됐다. 안 3은 PRD의 "개별 메시지 제거, 전역 통일" 결정과 정면으로 상충한다. 안 1이 세 번의 인터뷰 결정 모두와 일관되고, 변경 범위가 가장 작으며(파일 1개 + 로컬 toast 제거 5곳), 롤백이 가장 쉽다.

## ADR 본문

### Context

`QueryProvider.tsx`의 `QueryClient`가 전역 정책 없이 생성되어 있어, mutation 9개 중 4개가 실패해도 사용자에게 아무 피드백이 없고, `staleTime` 미설정 쿼리 다수가 라이브러리 기본값(0)을 암묵적으로 쓰고 있다(prd.md 참고).

### Decision

`QueryProvider.tsx`에서 `new QueryClient()`에 다음을 추가한다:

```ts
const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 60 * 1000 },
  },
  mutationCache: new MutationCache({
    onError: () => {
      toast.error('요청 처리에 실패했습니다.');
    },
  }),
});
```

기존에 명시적으로 `staleTime`을 준 4개 쿼리(`PROFILE_STALE_TIME_MS` 등)는 개별 옵션이 `defaultOptions`보다 우선하는 TanStack Query의 기본 동작 덕분에 그대로 유지된다(코드 변경 불필요). `PlaylistDetailModal.tsx`의 4개 mutation과 `ProfileActionButton.tsx`의 `followMutation`에서 로컬 `toast.error(...)` 호출을 제거한다(`console.error`는 유지 — 개발자용 로그이지 사용자 피드백이 아니므로 이번 결정과 무관). `QueryCache`는 건드리지 않는다.

### Alternatives

- 안 2(QueryCache까지 포함, 에러 타입별 분기): `/user/me` 401 인터셉터와의 중복 위험, 기존 인라인 에러 UI와의 중복 위험이 구체적으로 확인돼 기각.
- 안 3(meta 기반 옵트인 메시지): PRD의 "전부 통일" 결정과 상충해 기각.

### Consequences

**장점**: 새 mutation을 추가할 때 아무것도 안 해도 실패 시 최소한의 사용자 피드백이 보장된다. `staleTime`을 깜빡해도 즉시 재요청(0)이 아니라 60초 캐시가 기본값이 된다. 변경 지점이 파일 1개 + mutation 5곳으로 작아 리뷰하기 쉽다.

**단점**: 개별 mutation의 구체적 실패 메시지(예: "플레이리스트 삭제에 실패했습니다")가 공통 문구로 바뀐다 — PRD에서 사용자가 명시적으로 승인한 트레이드오프다.

**새로 생기는 위험**:

- **`profilePostsFeedQueryKey`가 저장소 어디서도 `invalidateQueries`/`setQueryData` 대상이 아니다(코드 전수 확인, Fact)** — 지금은 `staleTime: 0`이라 컴포넌트가 재마운트될 때마다 항상 새로 fetch돼서 이 공백이 가려져 있다. 전역 `staleTime`이 60초가 되면, 게시글을 작성한 직후 60초 안에 프로필 게시글 피드(`ProfilePostsFeed`)를 다시 열어도 새 글이 안 보일 수 있다(반면 그리드뷰 `profileGridQueryKey`는 `useContentWrite.ts`가 명시적으로 invalidate하므로 문제없다). 이건 PRD의 Behavior Invariant("invalidateQueries 호출 시점·대상은 안 바꾼다")상 이번 사이클에서 고칠 수 없는 **기존에 이미 있던 버그**이지만, `staleTime` 기본값 도입이 이 버그를 "항상 안 보이던 것"에서 "가끔(60초 내) 보이는 것"으로 노출시킨다. 구현 단계에서 `pnpm dev`로 반드시 재현해보고, 실제로 체감되는 지연이면 **이 특정 쿼리 키에만 `staleTime: 0`을 명시적으로 override**해서 우회한다(아래 Rollback 참고). invalidateQueries를 새로 추가하는 건 Behavior Invariant를 넘는 별도 결정이라 이번 사이클에서 하지 않는다.
- `userSearchQueryKey`/`userListQueryKey`도 같은 이유로 재확인이 필요하지만, 검색어별로 쿼리키가 분리돼 있고(`userSearchQueryKey(trimmedQuery)`) 팔로워/팔로잉 목록도 변경 빈도가 낮아 위험도는 낮다고 판단한다(Hypothesis — 구현 단계에서 확인).

**운영 비용**: 없음 — 클라이언트 전용 설정 변경.

### Migration

1. `QueryProvider.tsx`에 `defaultOptions`/`mutationCache`를 추가하는 동시에, 5곳의 로컬 `toast.error`를 같은 이슈(체크포인트 이슈 1) 안에서 함께 제거한다 — 두 변경을 분리하면 그 사이에 배포가 끼어들 경우 실제 사용자에게 토스트가 두 번 뜨는 창이 생기므로, 의도적으로 원자적 단위로 묶는다.
2. 구현 직후 `pnpm dev`로 최소 다음을 실동작 확인한다: (a) mutation 실패 1건 이상에서 토스트가 정확히 1번만 뜨는지, (b) `profilePostsFeedQueryKey`/`userSearchQueryKey`/`userListQueryKey`가 재요청 지연으로 눈에 띄는 문제를 만드는지.
3. (b)에서 문제가 확인되면 해당 쿼리 키에만 `staleTime: 0`을 명시적으로 override하고 result.md의 Remaining Debt에 기록한다 — 전체 결정을 되돌리지 않는다.

### Rollback

- 전체 롤백: `QueryProvider.tsx`의 `defaultOptions`/`mutationCache` 인자와 5곳의 `toast.error` 제거를 되돌리는 revert 커밋 하나로 완결(다른 파일과의 결합이 없음).
- 부분 롤백: 특정 쿼리 키만 `staleTime: 0`으로 override하는 것은 되돌림이 아니라 정상적인 개별 오버라이드 패턴(기존 4개 쿼리가 이미 쓰는 방식과 동일)이므로 언제든 추가해도 구조를 해치지 않는다.

## 회귀 안전망

### 테스트 우선순위

- **Contract**: `MutationCache.onError`가 mutation 실패 시 공통 토스트를 정확히 1번 호출하는지 검증하는 테스트를 새로 추가한다(`QueryProvider.tsx` 또는 `test-utils/QueryClientWrapper.ts`에 실제 `mutationCache` 설정을 반영한 테스트 클라이언트로 검증).
- **Characterization → 갱신**: `PlaylistDetailModal.test.tsx`/`ProfileActionButton` 관련 테스트가 기존에 로컬 `toast.error` 호출·메시지를 mock으로 검증하고 있다면(확인 필요), 제거된 호출에 맞게 갱신한다 — 이건 "동작이 바뀌었으니 테스트도 갱신"이지 임의 리팩터링이 아니다.
- **State-transition**: `staleTime` 60초 적용 후 같은 쿼리를 60초 내 재마운트했을 때 네트워크 재요청이 안 일어나는지(기존 4개 쿼리와 동일한 검증 방식).

### 회귀 시나리오

| 시나리오                                                         | 기존 결과                                                                   | 검증 수준   | 실패 시 조치                                    |
| ---------------------------------------------------------------- | --------------------------------------------------------------------------- | ----------- | ----------------------------------------------- |
| mutation 성공                                                    | 캐시 갱신, UI 반영                                                          | 통합        | 구현 중단                                       |
| mutation 실패(로컬 toast 없던 4곳: updateProfile/noti×3/comment) | 캐시만 조용히 롤백 → **이제 공통 토스트 1회 추가로 뜸**                     | 통합        | 구현 중단                                       |
| mutation 실패(로컬 toast 있던 5곳: playlist×4/follow)            | 개별 문구 토스트 → **공통 문구 토스트로 대체, 중복 없이 1회만**             | 계약        | 설계 재검토                                     |
| `refetchInterval` 쿼리(noti/comments)                            | 폴링 주기·조건 그대로                                                       | 통합        | 구현 중단                                       |
| `/user/me` 401                                                   | 로그아웃 모달만 열림, 토스트 중복 없음(QueryCache 미적용이므로 원래도 안전) | 통합        | 구현 중단                                       |
| 게시글 작성 직후 60초 내 `ProfilePostsFeed` 재방문               | (신규 위험) 새 글이 60초간 안 보일 수 있음                                  | 실동작(dev) | 눈에 띄면 해당 쿼리키만 `staleTime: 0` override |

## 체크포인트 이슈 목록

```markdown
# 목적

QueryClient의 전역 defaultOptions/MutationCache 부재로 mutation 9개 중 4개가 실패를 침묵하는 구조적 위험과, staleTime 미설정으로 인한 암묵적 즉시 재요청 위험을 줄인다.

## Scope

- `apps/web/src/components/providers/QueryProvider.tsx` — `defaultOptions.queries.staleTime`(60초), `mutationCache: new MutationCache({ onError })` 추가.
- `apps/web/src/components/modals/PlaylistDetailModal/PlaylistDetailModal.tsx` — 4개 mutation의 로컬 `toast.error(...)` 제거(`console.error`는 유지).
- `apps/web/src/components/profile/ProfileInfo/ProfileActionButton.tsx` — `followMutation`의 로컬 `toast.error(...)` 제거.
- 관련 테스트 파일 갱신(토스트 mock 검증이 있다면).

## Out of Scope

- `QueryCache`(일반 쿼리 실패) 전역 처리 — adr.md에서 기각.
- `usePostLikeToggle.ts`(`useMutation` 아님), `useInlineEditField.ts` 기반 에러 처리.
- `profilePostsFeedQueryKey`에 새 `invalidateQueries` 호출 추가 — Behavior Invariant 위반이라 이번 이슈에서 안 함(실동작에서 문제 확인 시 해당 키에 `staleTime: 0` override만 허용).
- 낙관적 업데이트 롤백 방식 통합(#218), `useInfiniteQuery` 옵션 팩토리화(#219).

## Behavior Invariants

- 기존 4개 쿼리(`PROFILE`/`PLAYLIST_DETAIL`/`POST_DETAIL`/`AUTH_ME`)의 `staleTime` 값은 바뀌지 않는다.
- `refetchInterval`을 쓰는 쿼리(noti/comments)의 폴링 주기·조건은 바뀌지 않는다.
- 모든 `invalidateQueries`/`setQueryData`/`setQueriesData` 호출 시점·대상 쿼리키는 바뀌지 않는다.
- 각 mutation의 `onMutate`/`onSuccess`의 캐시 롤백·리컨실 로직 자체는 바뀌지 않는다 — 이 이슈는 실패를 "알리는" 책임만 옮긴다.

## Acceptance Criteria

- [ ] Given mutation이 성공, When 기존과 동일한 흐름을 수행, Then 캐시 갱신과 UI 반영이 기존과 동일하다.
- [ ] Given 로컬 toast가 없던 4개 mutation(updateProfile/noti×3/comment) 중 하나가 실패, When 전역 `MutationCache.onError`가 실행되면, Then 공통 문구("요청 처리에 실패했습니다.") 토스트가 정확히 1번 뜬다.
- [ ] Given 로컬 toast가 있던 5개 mutation(playlist×4/follow) 중 하나가 실패, When 전역 핸들러가 실행되면, Then 공통 문구 토스트가 중복 없이 1번만 뜬다.
- [ ] Given `staleTime`을 명시한 4개 쿼리, When 이 이슈 적용 후 다시 확인하면, Then 값이 그대로다.
- [ ] 새 구조의 책임(에러 피드백은 전역, 캐시 롤백은 로컬)이 adr.md의 Decision과 일치한다.

## Verification

- [ ] `pnpm lint`, `pnpm check-types`, `pnpm test`(web 40 suites/225 tests 유지 또는 갱신 사유 명시), `pnpm build`
- [ ] `pnpm dev` 실동작: mutation 실패 1건 이상 재현해 토스트 중복 여부 확인, `ProfilePostsFeed`/검색/유저리스트 재요청 지연 여부 확인

## Rollback

- `QueryProvider.tsx`의 `defaultOptions`/`mutationCache` 인자와 5곳의 `toast.error` 제거를 되돌리는 revert 커밋 하나.
- 데이터 마이그레이션 없음 — 클라이언트 전용 설정.

## Dependency

- 선행 이슈: 없음(query-key-centralization #216 완료 후 독립적으로 진행 가능).
- 후속 이슈: 이슈 2(문서 갱신 + result.md).
```

```markdown
# 목적

이 사이클에서 도입한 전역 정책을 `docs/tanstack-query/index.html`에 반영해, 앞으로 새 쿼리/mutation을 추가하는 사람이 "이제 staleTime과 에러 토스트는 기본으로 깔려 있다"는 사실을 알 수 있게 한다.

## Scope

- `docs/tanstack-query/index.html` — QueryClient 전역 정책(defaultOptions, MutationCache) 섹션 추가, 기존 "새 쿼리 추가 시 staleTime을 검토한다" 가이드 문구를 "전역 기본값이 있으니 다를 때만 override" 방식으로 갱신.
- `docs/refactors/query-client-policy/result.md` 작성.

## Out of Scope

- 코드 변경 없음(순수 문서 + 검증).

## Behavior Invariants

- 해당 없음(문서 전용 이슈).

## Acceptance Criteria

- [ ] Given 이슈 1이 머지된 상태, When `docs/tanstack-query/index.html`을 읽으면, Then 전역 defaultOptions/MutationCache 정책이 반영돼 있다.
- [ ] Given prd.md의 Success Criteria, When result.md를 작성하면, Then 각 항목의 충족 여부가 구체적 근거와 함께 기록돼 있다.

## Verification

- [ ] 이슈 1의 `pnpm dev` 실동작 확인 결과를 result.md에 그대로 옮기고, 문서 갱신 후 링크가 깨지지 않았는지 확인.

## Rollback

- 문서 커밋 revert.

## Dependency

- 선행 이슈: 이슈 1.
```

---

**[GATE 2]** 위 대안 비교, 인터뷰 로그, ADR, 안전망, 이슈 분해를 확인해주시면 이슈를 생성하고 구현으로 넘어가겠습니다.
