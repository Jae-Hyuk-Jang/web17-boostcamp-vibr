# ADR — feed-infinite-scroll-duplication

## 3안 비교

### 안 1 — 최소 개선안

`useInfiniteScroll`/`useFeedInfiniteScroll`을 구조적으로 합치지 않고 각각 유지한다. 대신 두 훅에 characterization 테스트를 추가하고, `useInfiniteScroll`의 `initialError` 죽은 상태만 로컬로 고친다(값을 채우거나, 안 쓰면 제거).

### 안 2 — 경계 재설계안 (단일 제네릭 훅)

상태 전이 로직(로딩/에러/재시도/`reset`/`useInView` 배선)과 데이터 셰이프 정책(커서 타입, 병합·dedupe 전략, 초기 아이템 시딩)을 분리한다. `useInfiniteScroll<T, TCursor>` 하나로 완전히 병합하고, 커서 타입은 제네릭 `TCursor`(기본 `string | undefined`)로, 병합 전략은 `mergeItems?: (prev: T[], next: T[]) => T[]` 옵션으로, 초기 시딩은 `initialItems?: T[]` 옵션으로 주입받는다. 기존 두 훅과 동일하게 `useState` 조합 스타일을 유지한다. `useFeedInfiniteScroll.ts`는 제거되고 5개 소비처 모두 이 훅 하나를 직접 호출한다.

### 안 3 — 검증된 패턴 도입안 (순수 reducer 추출)

라이브러리 도입은 목표 인터뷰에서 이미 Out of Scope로 확정됐으므로(PRD 참고), 여기서는 자체 구현 대안으로 상태 전이 로직을 React에 의존하지 않는 순수 reducer(`infiniteScrollReducer` + 액션 타입)로 추출한다. 얇은 `useInfiniteScroll` 훅은 `useReducer`로 이 reducer를 감싸고 `useInView` 배선만 얹는다. 데이터 셰이프 정책은 reducer 액션의 payload로 주입된다.

## 비교표 (10개 고정 기준)

| #   | 기준                 | 안 1                     | 안 2                                         | 안 3                                                       |
| --- | -------------------- | ------------------------ | -------------------------------------------- | ---------------------------------------------------------- |
| 1   | 근본 원인 해결력     | 낮음 — 중복 그대로 남음  | 높음 — 중복 제거                             | 높음 — 중복 제거                                           |
| 2   | 동작 보존 난이도     | 매우 쉬움 — 변경 없음    | 중간 — 제네릭화 + 소비처 5곳 조정            | 높음 — 훅 내부 구현을 통째로 재작성, 회귀 리스크 큼        |
| 3   | 책임·의존성 변화     | 없음                     | 중간 — 정책 주입 인터페이스 신설             | 큼 — reducer/액션 타입이라는 새 추상화 계층 신설           |
| 4   | 테스트 용이성        | 낮음 — 현행대로 RTL 필요 | 중간 — 단일 훅, 여전히 renderHook 필요       | 높음 — reducer는 plain 함수 호출로 unit test 가능          |
| 5   | 변경 범위            | 최소                     | 중간 — 훅 1개 + 소비처 5곳                   | 큼 — 훅 내부 전체 재설계 + 소비처 5곳                      |
| 6   | 점진적 전환 가능성   | 해당 없음                | 가능 — 소비처를 하나씩 전환 가능             | 가능하지만 더 어려움 — 전환 중 두 패턴이 공존              |
| 7   | 롤백 가능성          | 쉬움                     | 쉬움 — 파일 단위로 되돌리기 가능             | 중간 — 되돌릴 파일이 더 많음                               |
| 8   | 성능·운영 영향       | 없음                     | 없음                                         | 없음 — `useReducer`가 `useState`보다 특별히 무겁지 않음    |
| 9   | 기존 코드와의 일관성 | 최고 — 변경 없음         | 높음 — 기존 두 훅과 동일한 `useState` 스타일 | 낮음 — 이 저장소 다른 훅들은 reducer 패턴을 쓰지 않음      |
| 10  | 유지 비용            | 나쁨 — 중복 계속 유지    | 좋음 — 단일 파일, 익숙한 스타일              | 중간 — 테스트는 쉽지만 새 개념(reducer)을 계속 유지해야 함 |

## 라이브러리 도입 심사

해당 없음 — 목표 인터뷰에서 TanStack Query(`useInfiniteQuery`) 전환은 이번 사이클 범위에서 명시적으로 제외됐다(PRD Out of Scope 참고). 안 3도 라이브러리가 아닌 자체 구현(reducer 패턴) 대안이다.

## 의사결정 인터뷰 로그

**Q. 이번 사이클에서 두 훅 통합과 함께, 무한스크롤 데이터 조회 자체를 TanStack Query(`useInfiniteQuery`)로도 전환할까요?**
A. 훅 통합만 진행 (추천). 이유: `useInfiniteQuery` 전환은 fetchFn 재설계·staleTime/캐시 정책 설계·5개 소비처 검증까지 필요해 범위가 훨씬 크고, #153에서 이미 별도 후속 사이클로 분리하기로 결정한 사안이다.

**Q. 이번 리팩터링에서 가장 중요하게 볼 품질 속성은 무엇인가요?**
A. 테스트 용이성 (추천). 이유: 두 훅 모두 현재 테스트가 0건이라는 안전망 공백이 가장 시급한 리스크다.

**Q. 변경 허용 범위: 통합된 훅의 소비처(4+1곳) 호출부(fetchFn 시그니처 등)도 함께 조정할 수 있게 할까요?**
A. 소비처 호출부 최소 수정 허용 (추천). 이유: 제네릭 인터페이스로 통합하려면 커서 타입을 소비처가 넘기는 형태로 약간 조정해야 할 가능성이 높다.

**Q. 통합 방식을 어떻게 설계할까요? 안 2(단일 제네릭 커스텀 훅)와 안 3(순수 reducer 추출 + 얇은 useReducer 래퍼)이 모두 중복을 없애지만, 테스트 용이성과 동작 보존 난이도의 트레이드오프가 다릅니다.**
A. 안 2 — 단일 제네릭 훅 (추천). 이유: 동작 보존 난이도가 낮고 기존 코드 스타일과 일관되며, 테스트 용이성은 안 2에서도 훅 자체의 characterization 테스트 추가로 충분히 달성 가능하다는 근거를 확인한 뒤 선택.

## 선택: 안 2

안 2가 근본 원인 해결력(중복 제거)과 낮은 리스크(동작 보존 난이도, 롤백 가능성, 기존 코드와의 일관성)를 동시에 만족한다. 안 3은 테스트 용이성 기준 하나에서만 이론적 우위가 있고, 동작 보존 난이도·변경 범위·일관성에서 손해가 더 크다 — 그리고 안 2에서도 "테스트 용이성"이라는 우선 품질 속성은 characterization 테스트 추가로 달성 가능하므로, reducer 도입의 리스크를 감수할 근거가 부족하다.

## ADR 본문

### Context

`useInfiniteScroll`(4개 소비처)과 `useFeedInfiniteScroll`(1개 소비처, `FeedView`)이 무한 스크롤 상태 전이 로직을 중복 구현하고 있다. 실제 차이는 커서 타입(단일 vs 다중소스), 초기 아이템 시딩(`initialData`), 그리고 `useInfiniteScroll`에만 있는 죽은 상태 `initialError`뿐이다. `useUserSearch.ts`가 이 죽은 `initialError`를 읽어 에러 상태를 분기하는데, 이 값이 항상 `null`이라 `SearchDrawerContent`/`MusicPickerSearch`의 에러 UI(`status === 'error'`)가 **현재는 검색 초기 로드 실패 시에도 절대 노출되지 않는다** — 실패는 `errorMsg`로만 잡히는데 `status` 계산은 `errorMsg`가 아니라 `initialError`만 본다(코드 직접 확인, `useUserSearch.ts` 69-84줄).

### Decision

`useInfiniteScroll<T, TCursor>`를 단일 제네릭 커스텀 훅으로 병합한다. 커서 타입은 `TCursor`(기본값 `string | undefined`, 기존 4개 소비처와 100% 호환), 병합 전략은 `mergeItems?: (prev: T[], next: T[]) => T[]`(기본값: 단순 concat), 초기 시딩은 `initialItems?: T[]` 옵션으로 흡수한다. `initialError`는 제거하고, `useUserSearch`의 상태 계산을 `errorMsg` 기반으로 정정해 검색 초기 로드 실패가 실제로 에러 UI에 반영되도록 고친다(의도된 동작 변경, 아래 Consequences 참고). `useFeedInfiniteScroll.ts`는 소비처 전환이 끝난 뒤 삭제한다.

### Alternatives

- 안 1(최소 개선안) 기각: 중복이 그대로 남아 이번 사이클의 목표(Goal: "상태 전이 로직이 한 곳에만 존재")를 달성하지 못한다.
- 안 3(reducer 추출) 기각: 테스트 용이성 하나의 기준에서만 이점이 있고, 동작 보존 난이도·변경 범위·기존 코드 일관성에서 손해가 더 크다. 이 저장소 다른 훅들이 reducer 패턴을 쓰지 않아 새 팀원이 이해해야 할 개념이 하나 늘어난다.

### Consequences

**장점**: 무한 스크롤 상태 전이 로직이 한 파일에만 존재해 다음 변경(로딩 지연시간, 재시도 정책, 트리거 임계값 등)이 한 곳만 고치면 된다. 파일 수가 2개→1개로 줄고, `initialError` 죽은 상태가 사라진다.

**단점/새 위험**: 커서 타입 제네릭화로 인해 `FeedView`의 `fetchFn`이 `posts`가 아닌 `items` 필드를 반환하도록 어댑터가 필요하다(작은 매핑 코드 추가). `mergeItems` 옵션을 잘못 설정하면(예: `FeedView`에서 `dedupePosts` 전달을 빠뜨리면) 페이지네이션 시 중복 게시글이 노출될 수 있다 — characterization 테스트로 방지.

**의도된 동작 변경(Behavior Invariant 예외)**: `useUserSearch`의 검색 초기 로드 실패 시 에러 UI가 이제 실제로 노출된다. 기존에는 `initialError` 죽은 분기 때문에 절대 노출되지 않았다(이 자체가 버그였음, PRD 진단 참고). 이 변경은 PRD Success Criteria("죽은 상태가 통합 후 남지 않는다")에 이미 포함된 의도된 수정이다.

### Migration

1. 특성화 테스트로 현재 5개 소비처의 동작(정상 로드/`loadMore` 가드/에러/`resetKey`/초기 시딩)을 고정한다.
2. `useInfiniteScroll`을 확장한다(`TCursor`, `mergeItems`, `initialItems` 옵션 추가, `initialError` 제거) — 이 시점에는 새 옵션을 아무도 안 쓰므로 기존 4개 소비처는 코드 변경 없이 그대로 통과해야 한다(옵션 기본값이 기존 동작과 동일해야 함, 계약 테스트로 확인). `useUserSearch`만 `initialError` 제거에 맞춰 상태 계산을 수정한다.
3. `FeedView`를 새 훅으로 전환한다(`fetchFn` 어댑터, `mergeItems: dedupePosts 기반`, `initialItems` 매핑).
4. `useFeedInfiniteScroll.ts` 삭제, `hooks/index.ts` 배럴에서 제거.
5. `result.md` 작성 + 개발환경 실동작 확인.

중간 상태(2번과 3번 사이)에서는 `useInfiniteScroll`(확장됨)과 `useFeedInfiniteScroll`(구버전)이 병존한다 — 둘 다 정상 동작해야 하며, 이 상태로 커밋이 머지되어도 저장소는 정상이다.

### Rollback

각 체크포인트 이슈는 별도 커밋/PR 단위라 문제 발생 시 해당 커밋만 되돌리면 된다. 특히 3번(FeedView 전환) 이후 페이지네이션 중복/누락이 발견되면 `mergeItems`/`initialItems` 설정만 되짚어 수정하거나, 심각하면 3번 커밋을 되돌려 `useFeedInfiniteScroll`을 임시 복원한다. 4번(파일 삭제)은 3번이 실동작까지 확인된 뒤에만 진행해 되돌릴 필요가 없도록 한다.

## 회귀 안전망

### 테스트 우선순위

1. **Characterization** — `useInfiniteScroll`/`useFeedInfiniteScroll`(리팩터 전, 안전망 확보 목적): 초기 로드 성공, `loadMore` 가드(`hasNext`/`isLoading`), 에러 처리, `resetKey` 변경 시 재조회, `useFeedInfiniteScroll`의 다중 커서 병합·`dedupePosts`·`initialData` 시딩.
2. **Characterization(버그 스냅샷)** — `useUserSearch`: 초기 로드 실패 시 현재 `status`가 `'error'`가 되지 **않는다**(죽은 분기)는 현재 동작을 먼저 고정한 뒤, 훅 확장 이후 실제로 `'error'`가 되도록 수정하고 그 변경을 같은 테스트에서 갱신한다.
3. **Contract** — 확장된 `useInfiniteScroll`의 옵션 기본값(TCursor 기본 `string`, `mergeItems` 기본 concat)이 기존 `useInfiniteScroll` 동작과 동일함을 검증.
4. **State-transition** — `reset()` 호출 시 `items`/`hasNext`/`cursor`/`isInitialLoading` 등 전체 상태가 초기값으로 돌아감.
5. **Integration** — `FeedView`가 전환된 훅으로 무한스크롤(초기 로드 → `loadMore` → dedupe)이 정상 동작함(RTL).
6. **E2E** — 상시 스위트에는 추가하지 않음(저장소에 CI E2E 없음, #100 참고). GATE 3의 개발환경 실동작 확인에서 브라우저로 직접 검증.

### 회귀 시나리오

| 시나리오                                   | 기존 결과                                                 | 검증 수준                     | 실패 시 조치                                           |
| ------------------------------------------ | --------------------------------------------------------- | ----------------------------- | ------------------------------------------------------ |
| 정상 페이지네이션(스크롤 트리거)           | 다음 페이지 아이템이 이어붙음                             | Integration                   | 구현 중단                                              |
| `loadMore` 진행 중 재트리거                | 중복 호출 없음(`hasNext`/`isLoading` 가드)                | 계약                          | 구현 중단                                              |
| 추가 로드 실패                             | `errorMsg` 표시, 다음 트리거 시 재시도                    | 상태 전이                     | 구현 중단                                              |
| `resetKey` 변경                            | 전체 초기화 후 재조회                                     | 상태 전이                     | 구현 중단                                              |
| `FeedView` 다중 소스 커서 페이지네이션     | `dedupePosts`로 중복 게시글 없음                          | Characterization              | 구현 중단(3번 이슈 재검토)                             |
| `FeedView` `initialData`(공유 라우트) 시딩 | 목록 맨 앞에 해당 게시글 존재                             | Characterization              | 구현 중단                                              |
| `ProfilePostsFeed` postId별 쿼리 캐시 시딩 | `setQueryData` 호출 유지                                  | Integration                   | 구현 중단                                              |
| 검색 초기 로드 실패                        | (기존 버그) 에러 UI 노출 안 됨 → (수정 후) 에러 UI 노출됨 | Characterization(의도된 변경) | PRD/ADR 재확인, 사용자에게 명시적으로 변경 사실 재고지 |

## 체크포인트 이슈 목록

### 이슈 1 — 무한스크롤 훅 특성화 테스트 추가

**AC**:

- `useInfiniteScroll`/`useFeedInfiniteScroll`에 대해 위 "테스트 우선순위" 1·2번 항목의 characterization 테스트를 추가한다(리팩터 전 동작을 고정하는 목적, 구현 변경 없음).
- `useUserSearch`의 검색 초기 로드 실패 시 `status`가 `'error'`가 되지 않는 현재(버그) 동작을 스냅샷으로 고정한다.
- 기존 `pnpm test`가 그대로 통과한다(신규 테스트만 추가).

**의존성**: 없음(선행 이슈).

### 이슈 2 — `useInfiniteScroll` 제네릭 확장 + `initialError` 제거 + `useUserSearch` 정정

**AC**:

- `useInfiniteScroll<T, TCursor = string | undefined>`로 확장하고 `mergeItems?`, `initialItems?` 옵션을 추가한다.
- `initialError` 상태를 제거한다.
- `useUserSearch`의 `status` 계산을 `errorMsg` 기반으로 정정해 검색 초기 로드 실패 시 실제로 `'error'` 상태가 되도록 고친다 — 이슈 1의 버그 스냅샷 테스트를 이 변경에 맞게 갱신한다.
- 기존 4개 소비처(`ProfilePostsFeed`, `ProfileView`, `useUserSearch`, `UserListModal`)는 새 옵션을 쓰지 않아도 코드 변경 없이 기존과 동일하게 동작한다(계약 테스트로 확인).
- `useFeedInfiniteScroll.ts`는 아직 그대로 둔다(병존, 저장소는 정상 상태).

**의존성**: 이슈 1.

### 이슈 3 — `FeedView`를 통합 훅으로 전환

**AC**:

- `FeedView`가 `useFeedInfiniteScroll` 대신 확장된 `useInfiniteScroll`을 사용한다.
- `fetchFn` 어댑터로 `FeedResponseDto`의 `posts`를 `items`로 매핑하고, `nextCursor: Cursor`를 `TCursor`로 그대로 전달한다.
- `mergeItems`에 기존 `dedupePosts`(postId 기반) 로직을 주입한다.
- `initialData`(공유 라우트 초기 게시글)를 `initialItems`로 매핑한다.
- 이슈 1의 `FeedView`/다중커서/dedupe/initialData characterization 테스트가 그대로 통과한다.
- `useFeedInfiniteScroll.ts`는 이 시점부터 더 이상 어디에서도 import되지 않는다(단, 파일 삭제는 이슈 4에서).

**의존성**: 이슈 2.

### 이슈 4 — `useFeedInfiniteScroll` 제거 및 배럴/문서 정리

**AC**:

- `useFeedInfiniteScroll.ts` 파일을 삭제한다.
- `hooks/index.ts` 배럴에서 관련 export를 제거한다.
- 남은 참조(테스트 mock, 문서 등)가 없는지 grep으로 확인한다.
- `pnpm lint`/`pnpm check-types`/`pnpm test`/`pnpm build`가 모두 통과한다.

**의존성**: 이슈 3.

### 이슈 5 — 결과 검증 및 문서화(`result.md`, GATE 3)

**AC**:

- Before/After(파일 수, 테스트 수, 죽은 상태 제거 여부)를 PRD 기준선과 비교해 기록한다.
- 개발환경에서 5개 소비처 화면을 직접 조작해 무한스크롤이 정상 동작함을 확인한다(`pnpm dev` 또는 `run` 스킬).
- 검색 초기 로드 실패 시 에러 UI가 실제로 노출되는지(의도된 동작 변경) 직접 확인한다.
- Remaining Debt/Follow-ups를 기록한다(예: `useInfiniteQuery` 전환은 이번 사이클 Out of Scope로 남아있음을 재확인).

**의존성**: 이슈 4.

---

**[GATE 2]** 위 대안 비교, 의사결정 인터뷰 로그, ADR, 회귀 안전망, 체크포인트 이슈 목록을 확인해주시면 이슈를 생성하고 구현으로 넘어가겠습니다.
