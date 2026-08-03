# Result — server-polling-optimistic-update

## 변경 요약

댓글(`usePostReactions`)과 알림(`useNotiStore`/`useNotiPolling`)의 수동 `setTimeout`/`setInterval` 폴링과 손으로 짠 optimistic 갱신+롤백을 TanStack Query의 `useQuery`(`refetchInterval` 함수형)+`useMutation`(`onMutate`/`onError`)으로 전환했다. 그 과정에서 #39 버그(댓글 작성 직후 방금 쓴 댓글이 사라짐)를 근본적으로 수정했다.

커밋 5개:

1. `6a961c0` docs: PRD·ADR 작성
2. `7419290` test: `useNotiStore`/`useNotiPolling` 특성화 테스트 추가(안전망 확보)
3. `c794561` fix: 댓글 폴링/작성을 TanStack Query로 전환 + #39 수정
4. `7bfd815` refactor: 알림을 `useNotifications` 훅으로 전환
5. `e6171fc` refactor: `useNotiStore` 제거

## Before/After

| 항목                                   | Before                                                                           | After                                                                                    |
| -------------------------------------- | -------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| 댓글 폴링 구현                         | `setTimeout` 재귀 스케줄러(`schedule()`) + `mergeComments`/`isTmp` 수동 병합     | `useQuery`(`refetchInterval` 함수형), 병합 로직 없음(캐시가 유일한 진실 공급원)          |
| 댓글 작성                              | optimistic append → tmp id 교체 → **즉시 refetch**(#39의 원인)                   | `useMutation`(`onMutate`/`onSuccess`/`onError`), 성공 후 refetch 호출 없음               |
| #39 재현 테스트                        | "방금 쓴 댓글이 사라진다"를 characterization으로 고정                            | "방금 쓴 댓글이 사라지지 않는다"를 검증(테스트명 `[수정 완료·버그 #39]`)                 |
| 온라인/오프라인 처리                   | `window.addEventListener('online'/'offline')` 수동 관리                          | TanStack Query 기본 `networkMode`/`refetchOnReconnect`에 위임, 커스텀 리스너 제거        |
| 알림 폴링 구현                         | `setInterval`(5초) + `useNotiStore`의 수동 `status` 상태머신                     | `useQuery`(`refetchInterval: 5000`), `status`는 `isLoading`/`isError`/`enabled`에서 파생 |
| 알림 읽음/전체읽음/전체삭제            | zustand 액션 내부에서 각각 수동 `prev` 스냅샷 저장 → 실패 시 수동 롤백(3회 반복) | `useMutation`(`onMutate`/`onError`) 3개, 패턴 통일                                       |
| 알림 상태 보관 위치                    | `useNotiStore`(zustand, 전역 싱글턴)                                             | TanStack Query 캐시(`notiQueryKey`), 훅은 `useNotifications()`                           |
| `useNotiStore`/`useNotiPolling` 테스트 | 0건                                                                              | 삭제(스토어 자체가 없어짐) — 대신 `useNotifications.test.ts` 13건                        |
| 삭제된 파일                            | -                                                                                | `useNotiStore.ts`, `useNotiStore.test.ts`, `useNotiPolling.ts`, `useNotiPolling.test.ts` |
| 신규 파일                              | -                                                                                | `useNotifications.ts`, `useNotifications.test.ts`                                        |

### 테스트 수 비교 (prd.md 기준선 대비)

| 명령                   | Before (prd.md 기준선)         | After                          |
| ---------------------- | ------------------------------ | ------------------------------ |
| `pnpm lint`            | ✅ 성공                        | ✅ 성공                        |
| `pnpm check-types`     | ✅ 성공                        | ✅ 성공                        |
| `pnpm test` (apps/web) | ✅ 33 suites / 155 tests, 5.6s | ✅ 34 suites / 171 tests, 5.6s |
| `pnpm build`           | ✅ 16개 라우트                 | ✅ 16개 라우트(동일)           |

테스트: 33→34 suites(`useNotifications.test.ts` 신설, `useNotiStore.test.ts`/`useNotiPolling.test.ts` 삭제로 순증 1), 155→171 tests(+16). `usePostReactions.test.ts`에 3건 순증(#39 테스트는 내용 갱신, `getEffectivePollMs`/입력 중 skip/전송 중 skip 3건 신규), `useNotifications.test.ts` 13건 신규.

## 개발환경 실동작 확인

이번에도 이 샌드박스에는 `docker-compose.yml`이 없고 `docker compose`/`docker-compose` CLI가 정상 동작하지 않아(`unknown shorthand flag: 'd'`) `apps/api` + MySQL/Neo4j/Redis를 띄울 수 없었다. 이전 사이클들과 동일한 제약이다.

**직접 확인한 것**:

- `pnpm --filter web dev`로 Next.js dev 서버(webpack)를 기동 — 컴파일/런타임 에러 없이 `✓ Ready in 1547ms`.
- `curl`로 `/`, `/archive`, `/setting/terms`, `/offline` 4개 라우트 모두 200 응답 확인. 이 라우트들은 모두 `Header`/`Sidebar`를 통해 `useNotifications()`를 렌더링하므로, 비로그인 상태(서버 사이드 렌더 시 인증 토큰 없음)에서 이 훅이 크래시 없이 `no-login` 상태로 정상 렌더됨을 간접 확인했다.
- dev 서버 로그에 컴파일 경고/에러 없음.

**직접 확인하지 못한 것(백엔드 필요, 사용자 확인 요청)**:

- [ ] 로그인 상태에서 댓글 작성 시 낙관적으로 즉시 화면에 반영되는지
- [ ] 댓글 작성 직후 폴링이 도착해도 방금 쓴 댓글이 사라지지 않는지(#39 실제 수정 확인)
- [ ] 댓글 입력 중 폴링이 멈추는지, 입력을 멈추면 다시 폴링이 재개되는지
- [ ] 탭을 백그라운드로 보냈을 때 댓글 폴링 주기가 늘어나는지
- [ ] 네트워크를 끊었다 복귀했을 때 댓글이 즉시 재조회되는지
- [ ] 알림이 5초마다 갱신되는지, 읽음/전체읽음/전체삭제가 낙관적으로 반영되고 실패 시 롤백되는지
- [ ] 여러 컴포넌트(Header 벨 아이콘, Sidebar, 알림 드로어)에서 동시에 `useNotifications()`를 구독해도 네트워크 요청이 중복되지 않는지(TanStack Query dedup 기대)

## Behavior Verification

prd.md의 Behavior Invariants 대비:

| Invariant                                    | 검증 방법                                                                                                                               | 결과                                 |
| -------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------ |
| 댓글: 입력 중/전송 중 폴링 skip              | `usePostReactions.test.ts` 신규 2건(입력 중/전송 중)                                                                                    | ✅ 통과                              |
| 댓글: 탭 숨김 시 주기 6배/최소 30초          | `usePostReactions.test.ts` `getEffectivePollMs` 단위 테스트                                                                             | ✅ 통과                              |
| 댓글: 온라인 복귀 시 즉시 재조회             | TanStack Query 기본값(`refetchOnReconnect: true`)에 위임 — 커스텀 코드 없음. 별도 유닛 테스트 대신 라이브러리 문서 신뢰(자체 로직 아님) | 코드 변경 없음, 라이브러리 기본 동작 |
| 댓글: `usePostLikeToggle` 롤백 미변경        | 기존 `toggleLike` 관련 테스트 전부 그대로 통과                                                                                          | ✅ 통과                              |
| 알림: 5초 주기 폴링                          | `useNotifications.test.ts` fake timer 테스트                                                                                            | ✅ 통과                              |
| 알림: 비로그인 시 `no-login`                 | `useNotifications.test.ts` 2건                                                                                                          | ✅ 통과                              |
| 알림: 읽음/전체읽음/전체삭제 optimistic+롤백 | `useNotifications.test.ts` 8건                                                                                                          | ✅ 통과                              |
| **의도된 변경**: #39 수정                    | `usePostReactions.test.ts` `[수정 완료·버그 #39]`                                                                                       | ✅ 통과(사라지지 않음 확인)          |

## Decision Review

- **안 2(경계 재설계안) 선택이 예상대로 동작했는가?** 그렇다. 댓글의 `mergeComments`/`isTmp` 병합 로직과 온라인/오프라인 수동 리스너가 완전히 사라졌고, 알림의 3중복 롤백 패턴이 `useMutation` 표준 계약으로 통일됐다. 코드량도 줄었다(`usePostReactions.ts` diff: `+260/-322` — net 62줄 감소, `useNotiStore.ts` 98줄 완전 삭제).
- **예상과 다르게 나온 부분**: onError 롤백 설계 시 원래 ADR에서는 "onMutate에서 `previous` 스냅샷을 저장했다가 onError에서 복원"하는 교과서적 패턴을 계획했으나, 실제 구현 중 "쿼리가 아직 한 번도 fetch되지 않은 시점에 mutation이 시작되면 `previous`가 `undefined`이고, TanStack Query의 `setQueryData`는 updater 결과가 `undefined`이면 캐시를 건드리지 않는다"는 라이브러리 세부 동작 때문에 롤백이 씹히는 문제를 발견했다. ADR 문서에는 없던 조정으로, `previous` 스냅샷 방식 대신 "실패한 낙관적 항목(tmp id)만 filter로 제거"하는 방식으로 변경했다 — 원래 `usePostReactions.ts`의 옛 롤백 로직과 사실상 동일한 접근이다. 알림 쪽(`useNotifications.ts`)은 항목 추가가 아니라 필드 갱신/전체 교체라 `previous` 스냅샷 방식이 문제없이 동작해 그대로 유지했다.
- **안 3(공용 폴링 래퍼) 기각이 맞았는가?** 그렇다. 구현해보니 댓글의 optimistic append(3-way rollback: filter-by-tmpId)와 알림의 optimistic field-update/전체 교체(snapshot-restore)가 실제로 롤백 전략부터 갈렸다 — 공용 래퍼였다면 이 차이를 흡수하기 위한 분기가 필요했을 것이므로 기각 판단이 사후적으로도 타당했다.

## Remaining Debt

- 댓글 mutation과 postId 전환 사이의 극단적 엣지 케이스(다른 게시글로 빠르게 전환하며 이전 mutation이 아직 pending인 상태)는 명시적으로 처리하지 않았다 — 기존 코드에도 없던 보호였고 Behavior Invariant에도 없어 이번 사이클 범위 밖으로 남긴다.
- 백엔드 `read-after-write` 일관성 자체는 여전히 보장되지 않는다(#39는 "즉시 refetch를 하지 않는" 방식으로 이 race의 발생 확률을 실질적으로 없앴지만, 이론적으로 폴링 주기(5초)보다 replica lag이 더 길면 여전히 재현 가능하다 — prd.md Out of Scope에 이미 명시된 사항).

## Follow-ups

- #178(`useProfileStore` → 쿼리 캐시 전환)은 이번 사이클과 무관하게 여전히 backlog로 남아있다.
- 개발환경 실동작 확인 중 사용자 확인이 필요한 체크리스트(위 표) — 백엔드(MySQL/Neo4j/Redis)가 뜨는 환경에서 직접 로그인 후 댓글 작성/알림 폴링을 조작해 확인 요청.

---

**[GATE 3]** 위 Before/After, Behavior Verification, 개발환경 실동작 확인 결과(직접 확인한 것/사용자 확인이 필요한 것), Decision Review, 남은 부채를 확인해주시면 커밋/푸시/PR을 진행하겠습니다.
