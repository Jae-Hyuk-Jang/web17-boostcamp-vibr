# PRD — query-key-centralization

## 문제 정의

`apps/web`에서 TanStack Query 쿼리키 팩토리 12개가 10개 파일에 흩어져 있다. 대부분은 "이 쿼리를 처음 쓴 곳"(주로 훅 파일)에 정의돼 있지만, 4개(`feedQueryKey`/`profileGridQueryKey`/`profilePostsFeedQueryKey`/`userListQueryKey`)는 **컴포넌트 파일**에 정의돼 있다. 그중 2개는 다른 도메인의 훅이 그 컴포넌트 파일을 직접 import하는 역방향 의존을 만든다. `docs/tanstack-query/index.html` 작성 중 이 상태가 관찰됐고, 사용자가 "쿼리키를 한 곳에서 관리해야 한다"는 문제의식으로 이슈를 제기했다.

## 비판적 진단 (시니어 개발자 시각)

### 근거

- **Fact** — 쿼리키 12개의 정의 위치: 훅 파일 8개(`playlistDetailQueryKey`, `PLAYLISTS_QUERY_KEY`, `profileQueryKey`, `AUTH_ME_QUERY_KEY`, `postDetailQueryKey`, `commentsQueryKey`, `userSearchQueryKey`, `notiQueryKey`), 컴포넌트 파일 4개(`feedQueryKey`, `profileGridQueryKey`, `profilePostsFeedQueryKey`, `userListQueryKey`).
- **Fact** — 컴포넌트 파일에 정의된 4개 중 **실제로 다른 파일이 import하는 것은 2개뿐**이다: `feedQueryKey`(`components/feed/FeedView.tsx`에 정의, `components/layout/Header.tsx`/`components/post/partials/PostHeader.tsx`/`hooks/post/useContentWrite.ts` 3곳이 import)와 `profileGridQueryKey`(`components/profile/ProfileView.tsx`에 정의, `hooks/post/useContentWrite.ts`가 import). 나머지 2개(`userListQueryKey`, `profilePostsFeedQueryKey`)는 정의한 파일 자신만 쓴다 — 외부 소비처가 없다.
- **Fact** — `hooks/post/useContentWrite.ts`(훅)가 `components/feed/FeedView.tsx`와 `components/profile/ProfileView.tsx`(둘 다 컴포넌트) 두 곳을 동시에 import한다 — 같은 파일에서 훅→컴포넌트 역방향 의존이 두 번 발생.
- **Fact** — 훅 파일에 정의된 8개 키 중 다중 소비처를 가진 것들(`postDetailQueryKey` 7곳, `PLAYLISTS_QUERY_KEY` 4곳, `playlistDetailQueryKey` 3곳, `profileQueryKey` 3곳)은 전부 문제없이 동작한다 — 여러 도메인이 공유해도 정의 위치가 훅이면 역방향 의존이 생기지 않는다.
- **Fact** — `docs/tanstack-query/index.html`(이전 사이클에서 작성한 명세서)은 "각 키는 정의 파일이 export해 오너십을 명확히 한다"는 현재의 co-location 패턴을 이미 의도된 설계로 문서화해뒀다 — 지금의 분산 배치는 실수가 아니라 각 사이클에서 반복적으로 내린 결정이었다.
- **Fact** — 문자열 쿼리키를 하드코딩하는 소비처는 없다(`grep`으로 재확인) — 전부 export된 팩토리 함수/상수를 통해서만 접근한다. 즉 "같은 의미의 키를 여러 곳에서 다르게 하드코딩해 충돌"하는 유형의 버그는 애초에 없다.
- **Fact** — 이 리팩터링을 전체 범위(12개 키 전부)로 하면 소비처 24개 파일의 import 경로가 바뀐다(기준선 검증 시점 `grep` 기준). 쿼리키 "값" 자체는 바꾸지 않는다.

### 증상 → 원인 체인

`hooks/post/useContentWrite.ts`가 `components/feed/FeedView.tsx`/`components/profile/ProfileView.tsx`를 import한다 → (왜?) `feedQueryKey`/`profileGridQueryKey`가 그 컴포넌트 파일에 정의돼 있고, 다른 훅이 이 키로 캐시를 무효화하려면 그 파일을 import할 수밖에 없다 → (왜?) 쿼리키를 어디에 둘지에 대한 명시적 규칙이 없어 "이 쿼리를 처음 쓴 화면"에 두는 관행이 굳어졌고, 이번엔 그 첫 소비처가 컴포넌트였다(구조 원인: CLAUDE.md가 타입에는 "공유되면 전역, 아니면 로컬"이라는 규칙을 명시해뒀지만 쿼리키에는 같은 규칙이 없었다).

### 아키텍처 관점

- 이 문제는 저장소 전역에 반복되는 패턴이 아니라, 12개 중 2개(`feedQueryKey`, `profileGridQueryKey`)에 국한된 구체적 사례다. 나머지 10개는 이미 CLAUDE.md의 "공유되면 전역(훅), 아니면 로컬" 원칙을 사실상 따르고 있다.
- 기존 컨벤션과 충돌하지 않는다 — 오히려 CLAUDE.md의 타입 배치 원칙(`src/types/{domain}.ts` vs 로컬 `{domain}.types.ts`)을 쿼리키에도 명시적으로 적용하는 방향이다.
- `docs/tanstack-query/index.html`이 문서화한 기존 co-location 설계와는 정면으로 배치된다 — 이 문서를 "전제가 깨졌다"고 폐기하는 것이 아니라, "오너십은 훅에 있다"는 그 문서의 원칙 자체는 유지한 채 "훅 파일 = query-keys 도메인 파일"로 오너십의 물리적 위치만 재배치하는 것으로 볼 수 있다.

### 비판적 재검토 (사용자 문제 제기에 대한 반박 질문과 답)

- **이 증상이 정말 구조 문제인가?** 부분적으로만 그렇다. 훅→컴포넌트 역방향 의존은 2개 키에서 실제로 존재하는 구조 문제(Fact)다. 하지만 사용자가 원래 제기한 "지금처럼 분산되어 있을 이유가 없다"는 진단은 나머지 10개에는 근거가 약하다 — 그 10개는 이미 훅에 있고 다중 소비처가 있어도 아무 문제가 재현되지 않았다(Fact). 이 점을 사용자에게 그대로 전달했고, 사용자는 "그래도 12개 전체를 중앙화하겠다"고 확정했다 — 이유는 앞으로 쿼리가 계속 늘어날 것이므로 지금 규칙을 세워두면 반복적으로 "어디에 둘지" 판단할 필요가 없어진다는 예방적 근거다.
- **지금 안 고치면 다음 몇 번의 변경에서 구체적으로 어떤 비용이 드는가?** 좁은 범위(2개 키)만 보면 비용은 작다 — 새 훅이 `feedQueryKey`/`profileGridQueryKey`를 참조할 때마다 컴포넌트 파일을 import해야 하는 정도. 넓은 범위(12개 전체)를 보면, 이미 12개까지 늘어났고 5개 사이클에 걸쳐 계속 늘어나 온 추세(Fact: `server-state-caching`→`feed-list-query-migration`→`server-polling-optimistic-update`→`playlist-detail-caching`→`profile-info-caching`마다 쿼리키가 추가됨)를 고려하면, 다음 사이클에서도 "어디에 둘지" 판단 비용이 반복될 것이라는 예측(Inference)은 합리적이다.
- **더 급한 다른 문제를 가리는 건 아닌가?** 이번 조사에서 발견한 더 급한 문제는 없다. 다만 이 작업은 순수 구조 이동(값 불변)이라 위험이 낮고, 다음 이슈(`usePostReactionOverridesStore`, #185)보다 먼저 처리해도 충돌하지 않는다.

## 목표와 범위

### Goal

12개 쿼리키 팩토리를 모두 `src/query-keys/{domain}.ts`(`feed.ts`/`playlist.ts`/`post.ts`/`profile.ts`/`noti.ts`/`auth.ts`/`search.ts`) + `src/query-keys/index.ts` 바럴로 옮긴다. 컴포넌트 파일은 더 이상 쿼리키를 정의하지 않는다.

### Success Criteria

- 컴포넌트 파일(`.tsx`, `app/`/`components/` 하위)이 쿼리키를 `export`하지 않는다.
- 12개 쿼리키 전부가 `src/query-keys/` 하위에서만 정의된다.
- 쿼리키 값(배열 내용) 자체는 변경 전후 동일하다 — 캐시 무효화/공유 동작이 바뀌지 않는다.
- 기존 테스트(40 suites/225 tests, 기준선)가 전부 그대로 통과한다.

### Out of Scope

- 쿼리키의 값(배열 내용) 변경 — 이번엔 위치만 옮긴다.
- `useQuery`/`useMutation`의 `staleTime`, `refetchInterval` 등 옵션 조정.
- `usePostReactionOverridesStore`(#185) 등 다른 백로그 항목.
- `apps/api`, `packages/dto` 변경.

## Behavior Invariants

- 모든 쿼리키의 배열 값(예: `['profile', userId]`)은 리팩터링 전후 정확히 동일하다.
- 각 쿼리의 `staleTime`, `enabled`, `refetchInterval` 등 옵션은 변경하지 않는다.
- 캐시 무효화 시점(`invalidateQueries`/`setQueryData`/`setQueriesData` 호출 위치와 시점)은 변경하지 않는다 — 오직 그 호출에 쓰이는 쿼리키를 어디서 import하는지만 바뀐다.
- 기존 40개 테스트 스위트/225개 테스트가 모두 그대로 통과한다(mock 대상 모듈 경로가 바뀌는 테스트는 import 경로만 갱신).

## 목표 인터뷰 결과 (AskUserQuestion)

**Q. 실제로 역방향 의존이 있는 건 12개 중 2개뿐입니다(`feedQueryKey`, `profileGridQueryKey`). 나머지 10개는 자기 파일 안에서만 쓰여 문제가 없습니다. 이번 사이클 범위를 어느 쪽으로 잡을까요?**
A. 12개 전체를 한 곳으로 중앙화(추천안 아님, 사용자가 직접 선택). 이유: 앞으로도 쿼리키가 계속 늘어날 것이므로, 문제가 없는 10개까지 포함해 지금 규칙을 세워두면 다음에 "어디에 둘지" 판단할 필요가 없어진다는 예방적 근거. AI는 "실제로 문제 있는 2개만"을 추천했으나(근거: 나머지 10개는 재현된 문제가 없어 YAGNI 관점에서 손댈 이유가 약함), 사용자가 이 근거를 인지한 상태에서 예방적 일관성을 더 우선한다고 확정했다.

**Q. 중앙화한 쿼리키를 어떻게 구조화할까요? 단일 파일 vs 도메인별 파일+바럴.**
A. 도메인별 파일 + 바럴(추천). 이유: 저장소가 이미 타입(`src/types/{domain}.ts`)·상수(`constants/{domain}.ts` + 바럴)에 쓰는 패턴과 동일해 새 컨벤션을 만들지 않아도 된다는 진단을 그대로 채택.

**Q. 정리하면 소비처 24개 파일의 import 경로만 바뀝니다(값 불변). 이대로 확정해도 될까요?**
A. 네, 이대로 진행(추천).

## 기준선 검증

| 명령             | 결과 | 실패 항목 | 비고                                                     |
| ---------------- | ---- | --------- | -------------------------------------------------------- |
| pnpm lint        | 성공 | 없음      | web lint 실행(cache miss), 나머지 패키지 cache hit       |
| pnpm check-types | 성공 | 없음      | web check-types 실행(cache miss), dto/ui cache hit       |
| pnpm test        | 성공 | 없음      | api 8 suites/37 tests, web 40 suites/225 tests 모두 통과 |
| pnpm build       | 성공 | 없음      | web 프로덕션 빌드 성공(전 패키지 cache hit)              |

- 영향받는 소비처 파일: 24개(쿼리키를 참조하는 파일, `grep -rl "QueryKey\b\|_QUERY_KEY\b"` 기준, 정의 파일 자신 포함).
- 정의를 옮길 원본 파일: 10개(훅 8개 + 컴포넌트 2개; `userListQueryKey`/`profilePostsFeedQueryKey`는 자기 파일 전용이라 옮겨도 소비처 추가 변경 없음).
- 신규 생성 파일: `src/query-keys/{feed,playlist,post,profile,noti,auth,search}.ts` 7개 + `src/query-keys/index.ts` 1개 = 8개.
- 번들 크기·빌드 시간 증분: 측정 불가 — 순수 코드 이동이라 유의미한 증분이 예상되지 않으나 별도 측정은 하지 않음.

---

**[GATE 1]** 위 진단·목표·범위·Behavior Invariants·기준선을 확인해주시면 다음 단계(ADR)로 넘어가겠습니다.
