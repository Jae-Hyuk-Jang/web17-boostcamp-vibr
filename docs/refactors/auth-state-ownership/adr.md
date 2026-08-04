# ADR — auth-state-ownership

## 3안 비교

### 안 1 — 최소 개선안: 객체 반환 `useAuthMe()` 그대로 사용 (최종 채택 — 아래 "결정 번복" 참고)

PRD 1차 결정대로 `useAuthMe()`(`{ userId, isAuthenticated, isLoading }` 객체 반환)를 그대로 쓰고 15곳을 기계적으로 치환. 구현은 가장 단순하지만, `useAuthMe` 내부가 `useAuthMeQuery()`의 `data`/`isPending`/`isError`를 매번 전부 읽어 TanStack Query v5의 tracked-query 최적화(실제로 접근한 필드만 구독)를 무력화한다 — 필드 하나만 쓰는 컴포넌트도 다른 필드가 바뀔 때마다 리렌더된다.

### 안 2 — 경계 재설계안: 필드별 개별 훅, TanStack 내장 tracked query 활용 (탐색 후 기각)

`useAuthMe()`(단일 복합 훅)를 없애고 `useIsAuthenticated()`/`useAuthUserId()`/`useIsAuthLoading()` 3개의 개별 훅을 만든다. 각 훅이 독립적으로 `useAuthMeQuery()`를 구독하고 자신이 필요한 최소 필드만 읽는다 — 인증 상태는 세션당 1~2회만 바뀌는 값이라 실질적 리렌더 절감 효과는 크지 않지만, 라이브러리가 이미 제공하는 기능을 그대로 쓰는 것이라 추가 인프라 비용이 0에 가깝다.

### 안 3 — 자체 구현안: `useSyncExternalStore` 기반 커스텀 selector 인프라 (기각)

zustand의 선택자 동작을 `QueryClient` 캐시 위에 직접 재구현(캐시 구독 + 얕은 비교로 변경된 필드만 리렌더). 가장 zustand와 동일한 동작을 내지만, 라이브러리가 이미 주는 tracked-query 기능을 다시 만드는 셈이라 유지보수 비용 대비 실익이 없다 — 인증 상태처럼 거의 안 바뀌는 값에는 과설계.

## 비교표 (10개 고정 기준)

| #   | 기준                 | 안 1                                                                                           | 안 2                                                                             | 안 3                                         |
| --- | -------------------- | ---------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- | -------------------------------------------- |
| 1   | 근본 원인 해결력     | 인다이렉션은 제거하지만 리렌더 문제는 그대로                                                   | 인다이렉션 제거 + 리렌더 문제도 해소                                             | 동일 + 완전한 zustand 동등성                 |
| 2   | 동작 보존 난이도     | 낮음                                                                                           | 낮음 — 훅 3개 모두 순수 파생값                                                   | 중간 — 캐시 구독 로직 신규 작성·검증 필요    |
| 3   | 책임·의존성 변화     | `useAuthMe` 1곳이 소유                                                                         | 3개 훅이 각자 명확한 단일 필드 소유                                              | 커스텀 selector 레이어가 새 책임으로 추가됨  |
| 4   | 테스트 용이성        | 훅 1개만 검증                                                                                  | 훅 3개, 각각 단순해 개별 검증 쉬움                                               | 커스텀 구독 로직까지 검증해야 해 범위 넓음   |
| 5   | 변경 범위            | 소비처 15곳 + 훅 1개                                                                           | 소비처 15곳 + 훅 3개                                                             | 소비처 15곳 + 커스텀 인프라 모듈 신규        |
| 6   | 점진적 전환 가능성   | 높음                                                                                           | 높음                                                                             | 중간 — 인프라부터 안정화해야 전환 가능       |
| 7   | 롤백 가능성          | 높음                                                                                           | 높음 — 각 훅이 독립적이라 개별 롤백도 가능                                       | 중간 — 커스텀 인프라까지 같이 되돌려야 함    |
| 8   | 성능·운영 영향       | 불필요한 리렌더 잔존(미미)                                                                     | 불필요한 리렌더 최소화                                                           | 가장 최소화되지만 체감 차이는 미미           |
| 9   | 기존 코드와의 일관성 | 다른 도메인은 `useProfile()`처럼 훅 하나가 여러 필드를 반환하는 패턴이 흔함 — 이 패턴과는 맞음 | "훅 하나 = 값 하나"는 이 저장소에 새 패턴이지만, 근거(tracked query 활용)가 명확 | 새 인프라 자체가 기존 컨벤션에 없음          |
| 10  | 유지 비용            | 낮음                                                                                           | 낮음                                                                             | 높음 — 커스텀 구독 인프라를 계속 관리해야 함 |

## 라이브러리 도입 심사

해당 없음 — 새 패키지를 추가하지 않는다. 안 2는 `@tanstack/react-query`(이미 설치됨)의 v5 기본 동작(tracked queries)을 그대로 활용한다.

## 의사결정 인터뷰 로그

PRD 단계에서 이미 확정된 결정을 참조만 한다:

- 마이그레이션 범위: "한 번에 전체 전환" vs "2단계 분할" → **"한 번에 전체 전환"** 선택.

ADR 단계에서 새로 필요했던 두 가지 결정(둘 다 PRD의 "훅 이름은 `useAuthMe` 유지" 결정을 대체함 — 아래 참고):

```markdown
**Q. 지금 `useAuthMe()`는 `{ userId, isAuthenticated, isLoading }` 객체를 통째로 반환해서, 필드 하나만 쓰는 컴포넌트도 다른 필드가 바뀌면 리렌더됩니다. 이번에 필드별 selector를 지원하도록 재설계할까요?**
A. 필드별 selector 지원하도록 재설계. (사용자가 추천안과 다른 선택을 함 — 자유 입력 근거는 없었음. 추천안은 "지금처럼 객체 통째 반환"이었다: 인증 상태가 세션당 1~2회만 바뀌어 추가 리렌더가 실질적으로 무시할 만한 수준이라는 근거였다. 사용자는 그럼에도 selector 지원을 명시적으로 선택했다.)
```

```markdown
**Q. 필드별 selector를 진짜로 구현하는 세 가지 방식(TanStack 내장 tracked query 활용 / `useAuthMe(selector)` 형태이지만 실질적 리렌더 감소는 없음 / `useSyncExternalStore` 기반 커스텀 인프라) 중 어느 걸 선택할까요?**
A. TanStack 내장 tracked query 활용(추천). 이유: 라이브러리가 이미 제공하는 기능을 그대로 쓰는 게 가장 비용이 적고, 커스텀 인프라(3번째 안)는 인증 상태처럼 거의 안 바뀌는 값에 과설계라고 판단.
```

```markdown
**Q. 개별 훅 3개(`useIsAuthenticated`/`useAuthUserId`/`useIsAuthLoading`)만 두고, 여러 필드가 필요한 곳(`Sidebar.tsx` 등)은 그 훅들을 여러 번 부르는 식으로 갈까요, 아니면 복합 `useAuthMe()`도 병존시킬까요?**
A. 개별 훅 3개만, 복합 훅 없음(추천). 이유: 패턴이 하나로 통일되고, "언제 복합 훅을 쓰고 언제 개별 훅을 쓰는가"라는 새 판단 기준이 생기지 않는다. 15개 소비처 중 8개는 필드 1개, 5개는 2개, `Sidebar.tsx` 1곳만 3개 다 쓰는 정도라 개별 훅을 여러 번 부르는 비용이 크지 않다.
```

**[결정 번복 — 안 1로 회귀]** 위 세 인터뷰로 개별 훅 3개 구조까지 확정했으나, 이후 사용자가 방향을 다시 검토해 **안 1(객체 반환 `useAuthMe()`)로 되돌리기로 결정했다.** 근거(사용자 발언): "일단은 기존 코드를 정리하고 효율화가 목표니까." 이번 사이클의 실제 동기(query-client-policy 이후 zustand 스토어 전수 재조사에서 발견한 죽은 인다이렉션 제거)는 리렌더 최적화가 아니라 **불필요한 미러 스토어 제거**였다 — 안 2의 selector 인프라는 이 목적에 필요하지 않은 범위 확장이었다고 재평가한다. `useAuthMe()`는 이미 `hooks/auth/client/useAuthMe.ts`에 정확히 필요한 형태(`{ userId, isAuthenticated, isLoading }`)로 구현돼 있어 **새 코드를 한 줄도 안 써도 된다** — PRD의 원래 결정("훅 이름은 `useAuthMe` 유지")으로 그대로 복귀한다. 안 2 탐색 과정(위 비교표·인터뷰 로그)은 "왜 이 선택지를 검토했다가 기각했는지" 근거로 남겨둔다.

## 선택: 안 1 (최종)

안 2(개별 훅 3개)는 기술적으로는 유효한 선택지였지만, 이번 사이클의 목표(죽은 인다이렉션 정리)에 비해 과한 범위였다고 재평가됐다 — 새 인프라(훅 3개+barrel)를 만드는 비용이 "인증 상태는 세션당 1~2회만 바뀐다"는 이미 확인된 사실 대비 실익이 낮다. 안 3(커스텀 selector 인프라)은 애초에 과설계로 기각된 상태 그대로다. 안 1은 이미 존재하는 `useAuthMe()`를 그대로 쓰는 것이라 변경 범위가 가장 작고(새 파일 0개), "기존 코드 정리"라는 이번 사이클의 목적과 가장 직접적으로 일치한다.

## ADR 본문

### Context

`stores/useAuthStore.ts`가 `useAuthMeQuery`의 파생 상태를 미러링하는 인다이렉션이고, 15개 소비처가 전부 리액티브 훅 형태로만 쓴다(prd.md 참고). 이번 사이클의 목적은 리렌더 최적화가 아니라 이 불필요한 미러 스토어를 제거하는 것이다(위 "결정 번복" 참고).

### Decision

`hooks/auth/client/useAuthMe.ts`는 이미 정확히 필요한 형태로 구현돼 있다:

```ts
export function useAuthMe(): AuthMeState {
  const { data, isPending, isError } = useAuthMeQuery();
  if (isPending) return { userId: null, isAuthenticated: false, isLoading: true };
  if (isError || !data) return { userId: null, isAuthenticated: false, isLoading: false };
  return { userId: data.id, isAuthenticated: true, isLoading: false };
}
```

새 코드를 추가하지 않는다. `hooks/auth/client/index.ts` 바럴을 신설해 `useAuthMe`(와 기존 `useAuthMeQuery`)를 재export한다. 15개 소비처가 `useAuthStore((s) => s.X)`를 `useAuthMe().X`로 치환한다. `AuthBootstrap.tsx`(및 `app/layout.tsx`의 `<AuthBootstrap />` 마운트), `stores/useAuthStore.ts`를 삭제한다.

### Alternatives

- 안 2(개별 훅 3개 + tracked query): 기술적으로 유효했으나 이번 사이클 목적(인다이렉션 정리)에 비해 과한 범위로 재평가돼 기각.
- 안 3(`useSyncExternalStore` 커스텀 인프라): 과설계로 기각.

### Consequences

**장점**: 변경 범위가 가장 작다(새 파일 0개, 기존 `useAuthMe` 재사용). `AuthBootstrap`의 매 렌더 `useEffect` 동기화 계층이 사라진다. 인증 상태를 읽는 모든 곳이 이제 표준 TanStack Query 패턴(다른 도메인과 동일)을 따른다.

**단점**: `useAuthMe()`가 필드 하나만 필요한 컴포넌트에서도 세 필드를 통째로 반환해, 다른 필드가 바뀔 때 이론상 불필요한 리렌더가 발생할 수 있다(인증 상태가 세션당 1~2회만 바뀌는 값이라 실질적 영향은 무시할 만한 수준으로 판단 — Remaining Debt로 기록).

**위험**: 6개 소비처(`ProfileView`/`useNotifications`/`RightPanel`/`usePostDetailModal`/`UserListModal`/`PostCard`)는 기존 테스트가 `useAuthStore.setState(...)`로 인증 상태를 시딩하고 있을 가능성이 높다 — 이 테스트들을 `authMe` 쿼리 캐시 시딩(mock `authMe` API 또는 `queryClient.setQueryData`) 방식으로 갱신해야 한다. 나머지 9곳은 전용 테스트가 없어 `pnpm dev` 실동작 확인으로 보완한다(아래 회귀 안전망 참고).

### Migration

1. **이슈 1**: `hooks/auth/client/index.ts` 바럴 신설 + 15개 소비처를 `useAuthMe()`로 전환 + `useAuthStore.ts`/`AuthBootstrap.tsx`/layout 마운트 삭제 + `AuthBootstrap.test.tsx`의 #139 계약 테스트를 새 구조로 재작성. 새로 만들 코드가 없어(기존 `useAuthMe` 재사용) "한 번에 전체 전환" 결정대로 한 이슈에서 끝낸다.
2. **이슈 2**: 문서 갱신 + `result.md`.

### Rollback

- 이슈 1의 커밋을 revert하면 `useAuthStore`/`AuthBootstrap`이 즉시 복원된다. `useAuthMe.ts`/`useAuthMeQuery.ts` 자체는 이번 사이클에서 건드리지 않으므로 롤백 대상이 아니다.

## 회귀 안전망

### 테스트 우선순위

- **Contract(최우선)**: `AuthBootstrap.test.tsx`의 "#139 — authMe 쿼리 캐시 공유로 네트워크 호출 1회" 계약을 새 구조 기준으로 재작성한다 — `<AuthBootstrap />` 대신 `useAuthMe()`를 구독하는 컴포넌트와 `usePostReactions`(내부에서 `useAuthMeQuery` 직접 구독)를 함께 렌더링해 `authMe`가 여전히 1회만 호출되는지 검증.
- **Characterization → 갱신**: `ProfileView`/`useNotifications`/`RightPanel`/`usePostDetailModal`/`UserListModal`/`PostCard` 6개 테스트가 `useAuthStore.setState(...)`로 인증 상태를 시딩하고 있다면, `authMe` API mock 또는 쿼리 캐시 시딩으로 갱신.

### 회귀 시나리오

| 시나리오                                     | 기존 결과                                | 검증 수준          | 실패 시 조치                                         |
| -------------------------------------------- | ---------------------------------------- | ------------------ | ---------------------------------------------------- |
| 여러 소비처가 동시에 인증 상태 구독          | `authMe` 네트워크 호출 1회로 공유(#139)  | 계약               | 구현 중단                                            |
| 로그인 성공                                  | `userId`/`isAuthenticated`가 정확히 반영 | 통합               | 구현 중단                                            |
| 로그아웃(리로드)                             | 리로드 전후 시점·순서 불변               | 통합               | 구현 중단                                            |
| `/user/me` 401(세션 만료)                    | 로그인 모달 노출, 판정 조건 불변         | 통합               | 구현 중단                                            |
| 테스트 없는 9개 소비처(`useContentWrite` 등) | 마이그레이션 전후 렌더 결과 동일         | 실동작(`pnpm dev`) | 눈에 띄면 해당 소비처만 특성화 테스트 추가 후 재검토 |

## 체크포인트 이슈 목록

```markdown
# 목적

`useAuthStore`(쿼리 미러 인다이렉션)를 제거하고 15개 소비처가 `useAuthMe()`를 직접 구독하도록 전환한다.

## Scope

- `hooks/auth/client/index.ts` 바럴 신설(`useAuthMe`, `useAuthMeQuery` re-export)
- `ProfileView.tsx`/`useNotifications.ts`/`RightPanel.tsx`/`usePostDetailModal.ts`/`useContentWrite.ts`/`PrivacyConsentGate.tsx`/`MobileBottomNav.tsx`/`UserListModal.tsx`/`Sidebar.tsx`/`PostCard.tsx`/`QueueList.tsx`/`NowPlaying.tsx`/`MiniPlayerBar.tsx`/`SearchDrawerContent.tsx` — `useAuthStore` selector를 `useAuthMe()` 호출로 치환
- `stores/useAuthStore.ts`, `hooks/auth/client/AuthBootstrap.tsx` 삭제, `app/layout.tsx`의 `<AuthBootstrap />` 마운트 제거
- `stores/index.ts` 바럴에서 `useAuthStore` export 제거
- `AuthBootstrap.test.tsx`의 #139 계약 테스트를 `useAuthMe()` 기준으로 재작성

## Out of Scope

- `useSpotifyAuthStore` 등 다른 스토어 — 무관.
- 필드별 리렌더 최적화(안 2) — 이번 사이클 목적과 무관하다고 판단해 기각(Remaining Debt로 기록).

## Behavior Invariants

- prd.md의 Behavior Invariants 전체(로그인/로그아웃/401 흐름 불변, 15개 소비처의 렌더 결과 불변).

## Acceptance Criteria

- [ ] Given 각 소비처가 기존에 읽던 필드, When `useAuthMe()`로 치환한 뒤 렌더하면, Then 화면 결과가 마이그레이션 전과 동일하다(6개는 테스트로, 9개는 `pnpm dev` 실동작으로 확인).
- [ ] Given 여러 컴포넌트가 동시에 `useAuthMe()`/`useAuthMeQuery()`를 구독, When 렌더되면, Then `authMe` 네트워크 호출이 1회로 공유된다(#139 계약 재확인).
- [ ] Given 로그인/로그아웃/401 흐름, When 기존과 동일하게 수행하면, Then 리다이렉트·모달·리로드 시점이 동일하다.
- [ ] `stores/useAuthStore.ts`/`AuthBootstrap.tsx`가 삭제되고 어디서도 참조되지 않는다(전수 grep).

## Verification

- [ ] `pnpm lint && pnpm check-types && pnpm test && pnpm build`
- [ ] `pnpm dev` 실동작: 로그인 상태/비로그인 상태 양쪽에서 사이드바·하단 네비·NowPlaying 정상 렌더 확인

## Rollback

- 이 이슈의 커밋을 revert하면 `useAuthStore`/`AuthBootstrap`이 즉시 복원된다.

## Dependency

- 선행 이슈: 없음.
- 후속 이슈: 이슈 2(문서 갱신 + result.md).
```

```markdown
# 목적

이 사이클에서 확립한 "인증 상태 = `useAuthMeQuery`(`useAuthMe`) 직접 구독" 패턴을 문서에 반영하고 result.md를 작성한다.

## Scope

- `docs/tanstack-query/index.html`의 "zustand ↔ TanStack Query 경계 원칙" 표에서 `useAuthStore` 관련 서술 갱신(더 이상 "인증 상태 자체"로 남아있지 않음을 반영)
- `docs/refactors/auth-state-ownership/result.md` 작성

## Out of Scope

- 코드 변경 없음(문서 + 검증).

## Behavior Invariants

- 해당 없음(문서 전용).

## Acceptance Criteria

- [ ] prd.md의 Success Criteria 각 항목 충족 여부를 근거와 함께 확인.

## Verification

- [ ] 이슈 1의 `pnpm dev` 실동작 확인 결과를 result.md에 반영.

## Rollback

- 문서 커밋 revert.

## Dependency

- 선행 이슈: 이슈 1.
```

---

**[GATE 2]** 위 대안 비교, 인터뷰 로그, ADR, 안전망, 이슈 분해를 확인해주시면 이슈를 생성하고 구현으로 넘어가겠습니다.
