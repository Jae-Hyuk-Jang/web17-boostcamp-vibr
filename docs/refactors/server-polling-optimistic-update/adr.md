# ADR — server-polling-optimistic-update

## 3안 비교

### 안 1 — 최소 개선안

TanStack Query로 옮기지 않고, `usePostReactions.ts`의 `submitComment`만 국소 수정한다 — `createComment` 성공 후 `refetchComments()`를 더 이상 호출하지 않고 `replaced`(tmp id → 서버 id로 교체한 로컬 배열)를 그대로 신뢰한다. 알림 쪽(`useNotiStore`/`useNotiPolling`)은 그대로 둔다.

### 안 2 — 경계 재설계안 (댓글+알림 모두 TanStack Query로)

댓글과 알림 각각을 TanStack Query의 `useQuery`(`refetchInterval`)+`useMutation`(`onMutate`/`onError` 롤백)으로 전환한다. `usePostReactions`의 댓글 상태(`comments`/`isCommentsLoading`)는 `useQuery`로, `submitComment`는 `useMutation`으로 바뀌고 `mergeComments`/`isTmp`(tmp-id 병합 로직)는 완전히 제거된다. `useNotiStore`/`useNotiPolling`은 새 훅(`useNotifications`, 가칭)으로 대체되고 zustand 스토어는 삭제된다.

### 안 3 — 검증된 도구 도입안 (공용 폴링 래퍼)

안 2와 같은 라이브러리를 쓰되, "폴링 목록 + optimistic mutation"의 공통 보일러플레이트를 감싸는 공용 훅(`usePollingListQuery`, 가칭)을 만들어 댓글/알림이 그 위에서 구현되게 한다.

## 비교표 (10개 고정 기준)

| #   | 기준                 | 안 1                                                | 안 2                                                                       | 안 3                                                                                                    |
| --- | -------------------- | --------------------------------------------------- | -------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| 1   | 근본 원인 해결력     | 낮음 — #39만 고치고 수동 스케줄러/상태머신은 그대로 | 높음 — 두 영역 모두 라이브러리 표준 패턴으로 통일                          | 높음 — 안 2와 동일 + 코드 중복도 줄임                                                                   |
| 2   | 동작 보존 난이도     | 매우 쉬움                                           | 중간 — 두 영역 각각 재작성                                                 | 중간~높음 — 공용 훅의 API가 두 영역의 서로 다른 optimistic 셰이프(추가 vs 필드 갱신)를 모두 감당해야 함 |
| 3   | 책임·의존성 변화     | 거의 없음                                           | 중간 — 각 영역이 자기 쿼리키/뮤테이션을 소유                               | 큼 — 공용 훅이라는 새 추상화 계층이 두 영역 사이에 생김                                                 |
| 4   | 테스트 용이성        | 낮음 — 알림 테스트 공백 그대로                      | 높음 — `useQuery`/`useMutation`은 표준 계약이라 검증 쉬움                  | 중간 — 공용 훅 자체 테스트 + 두 영역이 그 훅을 올바르게 쓰는지 간접 검증까지 필요                       |
| 5   | 변경 범위            | 최소                                                | 중간 — 댓글/알림 각 소비처                                                 | 중간+ — 안 2 + 공용 훅 설계                                                                             |
| 6   | 점진적 전환 가능성   | 해당 없음                                           | 가능 — 댓글/알림 순차 전환                                                 | 어려움 — 공용 훅의 API를 먼저 확정해야 두 영역을 그 위에 얹을 수 있음                                   |
| 7   | 롤백 가능성          | 쉬움                                                | 쉬움                                                                       | 중간 — 공용 훅을 되돌리면 두 영역 모두 영향                                                             |
| 8   | 성능·운영 영향       | 없음                                                | 미미                                                                       | 미미                                                                                                    |
| 9   | 기존 코드와의 일관성 | 높음                                                | 높음 — `usePostDetail`/`useAuthMeQuery` 등 기존 TanStack Query 패턴과 일관 | 낮음 — 이 저장소에 "폴링 목록" 추상화가 아직 없어 새 규약을 만드는 셈                                   |
| 10  | 유지 비용            | 나쁨 — 수동 스케줄러/상태머신 계속 유지             | 좋음                                                                       | 불확실 — 소비처가 2곳뿐인데 추상화 계층을 얹으면 오히려 간접비용이 늘 수 있음(과잉 추상화)              |

## 라이브러리 도입 심사

해당 없음 — 이미 도입된 `@tanstack/react-query`(v5.101.3)의 `useQuery`/`useMutation`/`refetchInterval`/`refetchOnReconnect`를 사용한다. 새 패키지 도입 없음.

## 의사결정 인터뷰 로그

(PRD 1-3 단계에서 이미 결정된 항목은 참조만 한다: 범위=댓글+알림 모두, 품질 속성=정확성/버그 재발 방지, Behavior Invariants.)

이번 ADR 설계에서는 안 2 vs 안 3(공용 폴링 래퍼 도입 여부)만 추가로 검토했다. 소비처가 댓글/알림 2곳뿐이고 두 곳의 optimistic 셰이프(목록에 새 항목 추가 vs 기존 항목 필드 갱신)가 근본적으로 달라, `CLAUDE.md`의 "세 줄 정도의 유사 코드는 섣부른 추상화보다 낫다" 원칙에 따라 별도 인터뷰 없이 안 3을 기각했다(아래 Alternatives 참고).

## 선택: 안 2

안 2가 근본 원인을 해결하면서(각 영역이 표준 TanStack Query 계약을 직접 사용) 과잉 추상화를 피한다. 안 1은 #39는 고치지만 알림 쪽 수동 상태머신·테스트 공백은 그대로 남겨 PRD가 확정한 범위(댓글+알림 모두)를 충족하지 못한다. 안 3은 소비처 2곳을 위한 조기 추상화라 유지 비용이 오히려 늘어날 위험이 있다.

## ADR 본문

### Context

`usePostReactions.ts`는 댓글 폴링을 `setTimeout` 재귀 스케줄러로, `useNotiStore.ts`/`useNotiPolling.ts`는 알림 폴링을 `setInterval`로 각각 손으로 구현하고 있다. 댓글 쪽은 낙관적으로 추가한 로컬 댓글과 폴링 스냅샷을 `mergeComments`로 매번 병합해야 하는데, `submitComment`가 tmp id를 서버 id로 이미 교체한 뒤 `refetchComments()`를 호출해서 서버 스냅샷이 그 댓글을 아직 포함하지 않으면 방금 쓴 댓글이 사라진다(#39). 알림 쪽은 확인된 버그는 없지만 같은 클래스의 수동 optimistic 갱신+롤백을 3번(읽음/전체읽음/전체삭제) 반복하고 있고 전용 테스트가 없다.

### Decision

**댓글(`usePostReactions.ts`)**:

- `commentsQueryKey(postId) = ['comments', postId] as const`로 `useQuery` 전환. `refetchInterval`을 함수로 전달해 `getEffectivePollMs`(탭 숨김 시 6배/최소 30초)와 "입력 중/전송 중 skip"(`commentText`/뮤테이션 `isPending`을 클로저로 참조해 `false` 반환) 조건을 그대로 반영한다. `refetchOnReconnect`(기본 `true`)가 기존 온라인 복�너 즉시 재조회를 대체한다.
- `createComment`를 `useMutation`으로 전환한다. `onMutate`에서 `cancelQueries` + 캐시에 낙관적 항목(tmp id) 직접 추가, `onSuccess`에서 tmp id → 서버 id로 캐시 내 치환(**refetch/invalidate 호출하지 않음** — 이게 #39의 핵심 수정: 자기 자신의 mutation 결과를 신뢰하고 불필요한 재조회로 덮어쓰지 않는다), `onError`에서 스냅샷 롤백.
- `mergeComments`/`isTmp` 헬퍼는 더 이상 필요 없어져 제거한다 — 낙관적 항목이 이미 캐시 안에서 직접 치환되므로 "폴링 스냅샷과 로컬 tmp 항목을 병합"하는 별도 단계 자체가 사라진다.

**알림(`useNotiStore.ts`/`useNotiPolling.ts`)**:

- 새 훅 `useNotifications()`(가칭, `hooks/noti/useNotifications.ts`)를 도입해 `notiQueryKey = ['notifications'] as const`로 `useQuery`(`refetchInterval: 5000`, `enabled: isAuthenticated && !isLoading`) 전환. `status`는 `!isAuthenticated || isLoading ? 'no-login' : isPending ? 'loading' : isError ? 'error' : 'success'`로 파생.
- `readNoti`/`readAllNotis`/`deleteAllNotis`를 각각 `useMutation`(`onMutate`/`onError` 롤백)으로 전환. `unreadCount`는 `notis.filter(n => !n.isRead).length`로 파생(별도 상태 불필요).
- `NotiPollingGate`는 계속 루트에 마운트되어 `useNotifications()`를 호출함으로써 쿼리 구독을 유지한다(`Sidebar`/`Header`/`NotiDrawerContent`가 같은 쿼리키를 구독하므로 TanStack Query가 중복 요청을 자동으로 합친다 — `authMe` dedup과 동일한 패턴, #139 참고).
- `useNotiStore.ts`는 삭제한다.

### Alternatives

- 안 1(최소 개선안) 기각: GATE 1에서 "댓글+알림 모두"로 이미 범위가 정해짐.
- 안 3(공용 폴링 래퍼) 기각: 소비처가 2곳뿐이고 optimistic 셰이프가 근본적으로 달라(추가 vs 필드 갱신) 조기 추상화 위험이 큼(비교표 참고).

### Consequences

**장점**: `mergeComments`/`isTmp` 같은 수동 병합 로직이 완전히 사라져 #39류의 race가 구조적으로 재발할 수 없다. 알림 쪽 수동 상태머신·3중복 롤백 패턴도 표준 `useMutation` 계약으로 통일된다.

**단점/새 위험**: `refetchInterval`을 함수로 전달해 컴포넌트 로컬 상태(`commentText`, 뮤테이션 `isPending`)를 조건에 반영하는 패턴은 이 저장소에 처음 도입되는 것이라, 실제로 "입력 중일 때 폴링이 정확히 멈추는지" 회귀 테스트로 꼼꼼히 검증해야 한다.

**의도된 동작 변경**: #39 버그(방금 쓴 댓글이 사라지는 것)가 수정된다 — PRD에서 이미 명시적으로 허용된 변경.

### Migration

1. `useNotiStore`/`useNotiPolling` 특성화 테스트 추가(현재 0건). `usePostReactions.test.ts`(9건, #39 재현 테스트 포함)는 기존 안전망으로 활용.
2. 댓글을 `useQuery`+`useMutation`으로 전환, `mergeComments`/`isTmp` 제거, #39 재현 테스트를 "고쳐진 동작" 검증으로 갱신.
3. 알림을 새 훅 `useNotifications()`로 전환, `Sidebar`/`Header`/`NotiDrawerContent`/`NotiPollingGate` 소비처 전환.
4. `useNotiStore.ts` 삭제, 배럴 정리, 잔존 참조 확인.
5. `result.md` 작성 + 개발환경 실동작 확인.

2번과 3번 사이에는 알림이 아직 구 스토어를 쓰는 병존 상태가 유지된다 — 이 상태로 커밋이 머지되어도 저장소는 정상이다.

### Rollback

각 체크포인트 이슈는 별도 커밋/PR 단위다. 댓글 전환(2번) 후 폴링·optimistic 동작에 문제가 생기면 그 커밋만 되돌린다. 알림 전환(3번) 후 문제가 생기면 `useNotiStore.ts`를 임시 복원한다(4번에서 삭제되기 전까지는 git 히스토리에만 존재하므로 revert로 복원 가능).

## 회귀 안전망

### 테스트 우선순위

1. **Characterization** — `useNotiStore`/`useNotiPolling`(현재 0건): 폴링 주기, `no-login` 상태, 읽음/전체읽음/전체삭제 optimistic+롤백.
2. **Characterization(버그 스냅샷 → 수정 검증)** — `usePostReactions.test.ts`의 #39 재현 테스트: "고쳐지기 전" 스냅샷에서 "고쳐진 뒤" 검증으로 갱신.
3. **Contract** — 댓글 `refetchInterval` 콜백: 입력 중/전송 중이면 `false`(polling 중단), 탭 숨김 시 6배/최소 30초, 그 외엔 `pollMs`.
4. **State-transition** — 댓글/알림 mutation의 `onMutate`(낙관적 반영)→`onSuccess`(확정)/`onError`(롤백) 전이.
5. **Integration** — 댓글 작성 성공 직후 폴링이 도착해도 방금 쓴 댓글이 유지되는지(#39의 실제 회귀 시나리오).
6. **E2E**: 상시 스위트에는 추가하지 않음(#100 참고). GATE 3의 개발환경 실동작 확인에서 직접 검증.

### 회귀 시나리오

| 시나리오                                    | 기존 결과                                 | 검증 수준        | 실패 시 조치 |
| ------------------------------------------- | ----------------------------------------- | ---------------- | ------------ |
| 댓글 작성 성공                              | optimistic 추가 → tmp id를 서버 id로 치환 | State-transition | 구현 중단    |
| 댓글 작성 성공 직후 폴링 도착(#39 시나리오) | (수정 전) 사라짐 → (수정 후) 유지됨       | Integration      | 구현 중단    |
| 댓글 작성 실패                              | optimistic 항목 롤백                      | State-transition | 구현 중단    |
| 댓글 입력 중                                | 폴링 skip                                 | Contract         | 구현 중단    |
| 탭 숨김                                     | 폴링 주기 6배/최소 30초                   | Contract         | 구현 중단    |
| 온라인 복귀                                 | 즉시 재조회                               | Contract         | 구현 중단    |
| 알림 읽음/전체읽음/전체삭제 성공            | optimistic 갱신 유지                      | State-transition | 구현 중단    |
| 알림 읽음/전체읽음/전체삭제 실패            | 롤백                                      | State-transition | 구현 중단    |
| 비로그인 상태                               | 알림 `no-login` 상태                      | Characterization | 구현 중단    |

## 체크포인트 이슈 목록

### 이슈 1 — useNotiStore/useNotiPolling 특성화 테스트 추가

**AC**:

- `useNotiStore`/`useNotiPolling`에 폴링 주기, `no-login` 상태, 읽음/전체읽음/전체삭제 optimistic+롤백 테스트 추가(현재 0건).
- 구조 변경 없음, 기존 `pnpm test` 통과 유지.

**의존성**: 없음.

### 이슈 2 — 댓글 폴링/작성을 TanStack Query로 전환 (#39 수정)

**AC**:

- `commentsQueryKey(postId)` 도입, `useQuery`(`refetchInterval` 함수, `refetchOnReconnect`)로 전환.
- `createComment`를 `useMutation`(`onMutate`/`onSuccess`/`onError`)으로 전환, 성공 후 refetch 호출 제거.
- `mergeComments`/`isTmp` 헬퍼 제거.
- `usePostReactions.test.ts`의 #39 재현 테스트가 "댓글 작성 직후 폴링이 도착해도 유지된다"를 검증하도록 갱신.
- 입력 중/전송 중 skip, 탭 숨김 시 주기 확대, 온라인 복귀 시 재조회 동작 유지.

**의존성**: 이슈 1(회귀 비교 기준 확보).

### 이슈 3 — 알림을 useNotifications 훅으로 전환

**AC**:

- `notiQueryKey`, `useNotifications()` 훅 신설 — `useQuery`(`refetchInterval: 5000`) + 3개 `useMutation`(읽음/전체읽음/전체삭제).
- `Sidebar`, `Header`, `NotiDrawerContent`, `NotiPollingGate`가 `useNotiStore` 대신 `useNotifications()`를 쓰도록 전환.
- 이슈 1의 특성화 테스트를 새 훅 기준으로 갱신.

**의존성**: 이슈 1.

### 이슈 4 — useNotiStore 제거

**AC**:

- `useNotiStore.ts` 삭제, 배럴 export 정리.
- grep으로 잔존 참조 확인.
- `pnpm lint`/`pnpm check-types`/`pnpm test`/`pnpm build` 통과.

**의존성**: 이슈 3.

### 이슈 5 — 결과 검증 및 문서화(`result.md`, GATE 3)

**AC**:

- Before/After(코드 구조, #39 수정 확인, 테스트 수)를 prd.md 기준선과 비교.
- 개발환경에서 댓글 작성/폴링, 알림 읽음/폴링을 직접 조작해 확인(가능한 범위 내).
- Remaining Debt/Follow-ups 기록.

**의존성**: 이슈 4.

---

**[GATE 2]** 위 대안 비교, 의사결정 인터뷰 로그, ADR, 회귀 안전망, 체크포인트 이슈 목록을 확인해주시면 이슈를 생성하고 구현으로 넘어가겠습니다.
