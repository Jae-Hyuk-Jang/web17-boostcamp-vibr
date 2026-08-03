# PRD — server-polling-optimistic-update

## 문제 정의

댓글 폴링(`usePostReactions.ts`)과 알림 폴링(`useNotiStore.ts`/`useNotiPolling.ts`)이 TanStack Query 없이 각각 수동 `setTimeout`/`setInterval` 스케줄러 + 수동 optimistic append/rollback으로 구현되어 있다. 이로 인해 실제 버그(#39: 댓글 작성 직후 `refetchComments`가 방금 쓴 댓글을 지워버릴 수 있음)가 발생했다.

## 비판적 진단 (시니어 개발자 시각)

### 근거

- **Fact(버그 #39 재확인)**: `usePostReactions.ts`의 `submitComment`(246-287줄)는 `createComment` 성공 후 `tmpId`를 서버 id로 교체(`replaced`, 275줄)한 다음 곧바로 `refetchComments()`(279줄)를 호출한다. `mergeComments`(57-65줄)는 로컬 댓글 중 **아직 `tmp-`로 시작하는 것만** 서버 응답에 강제 보존한다. 275줄에서 이미 tmp id를 서버 id로 바꿔버렸으므로, 279줄의 `refetchComments`가 받은 서버 스냅샷이 그 댓글을 아직 포함하지 않으면(`read-after-write` 지연) 285번째 줄 `mergeComments`는 그 댓글을 지킬 이유가 없다고 판단해 버린다 — 재현 테스트로 이미 확인됨(`usePostReactions.test.ts`).
- **Fact**: 댓글 폴링은 `setTimeout` 재귀 스케줄러(`schedule()`, 203-220줄)로 직접 구현되어 있고, 탭이 숨겨지면 주기를 늘리는 로직(`getEffectivePollMs`, 67-71줄), 입력 중/전송 중 skip(209줄), online/offline 리스너(222-234줄)를 전부 손으로 구현한다. TanStack Query의 `useQuery`는 `refetchInterval`(함수로 전달 가능해 탭 숨김 조건 반영 가능), `refetchOnReconnect`(온라인 복귀 시 자동 재조회)를 라이브러리 레벨로 제공한다 — "입력 중/전송 중 skip"만 `enabled` 토글이나 `refetchInterval` 콜백 내부 조건으로 흡수해야 한다.
- **Fact**: `useNotiStore.ts`(98줄)는 `notis`/`unreadCount`/`status`(idle/loading/success/error/no-login)를 전부 수동으로 관리하고, `useNotiPolling.ts`가 `setInterval`(5초 고정)로 폴링한다. `readNoti`/`readAllNotis`/`deleteAllNotis`는 각각 이전 상태를 `prev`로 저장했다가 실패 시 수동 롤백하는 동일한 패턴을 3번 반복한다.
- **Fact**: `useNotiStore`/`useNotiPolling`에는 전용 테스트가 0건이다(`find` 결과). `usePostReactions.test.ts`는 이미 9건 존재(좋아요/댓글 관련, #39 재현 테스트 포함).
- **Inference**: 댓글 쪽 버그(#39)의 근본 원인은 "낙관적으로 추가한 로컬 상태"와 "폴링으로 받아온 서버 스냅샷"이 별도의 값(React state)으로 존재하고, 그 둘을 `mergeComments`라는 수동 병합 함수로 매번 다시 화해시켜야 한다는 것이다. 댓글 목록 자체가 TanStack Query 캐시 하나였다면(값이 하나만 존재), 이 "병합" 단계 자체가 필요 없어진다 — mutation 성공 시 캐시를 직접 갱신(`setQueryData`)하고 다음 폴링이 그 위에 최신 서버 상태를 반영하면 된다.
- **Inference**: 다만 `read-after-write` 자체가 백엔드에서 보장되지 않는다면(#39 TODO 항목), mutation 성공 직후 **굳이 즉시 refetch를 부르지 않고** mutation이 캐시에 반영한 값을 신뢰하는 편이 이 race를 원천적으로 피한다 — 이건 TanStack Query 전환 여부와 무관하게 적용 가능한 수정이기도 하다(안 1 최소 개선안으로도 가능).

### 증상 → 원인 체인

증상: 댓글 작성 직후 방금 쓴 댓글이 사라지거나(#39), 댓글/알림 폴링·낙관적 갱신 로직이 두 곳(댓글, 알림)에서 각각 손으로 재구현되어 있다.
→ (왜?) 직접 원인: 서버 목록 데이터(댓글, 알림)가 쿼리 캐시가 아니라 컴포넌트/스토어 로컬 상태이고, "낙관적 추가분"과 "폴링으로 받은 서버 스냅샷"을 매번 수동으로 병합해야 한다.
→ (왜?) 구조 원인: `server-state-caching`(#139)이 상세보기/목록 캐시만 도입했고, 폴링·optimistic mutation 패턴은 그 사이클에서 의도적으로 Out of Scope였다(당시 PRD에 명시).

### 아키텍처 관점

- **저장소 반복 패턴인가?**: 그렇다 — `post-reaction-state`(#48) → `server-state-caching`(#139~145) → `feed-infinite-scroll-duplication`(#149) → `refresh-trigger-stores`(#153) → `feed-list-query-migration`(#166)까지 이어진 "서버 상태를 TanStack Query로 옮기는" 축의 다음 단계다. 댓글/알림은 "폴링 + 낙관적 변경"이라는, 앞의 사이클들이 다루지 않은 새로운 하위 패턴이다.
- **기존 컨벤션과 충돌하는가?**: 충돌 없음. `CLAUDE.md`가 이미 "서버 상태는 쿼리 캐시로" 원칙을 여러 차례 갱신해왔다.
- **전제가 깨졌나, 애초에 근거가 약했나?**: `server-state-caching` 도입 당시 폴링/optimistic update까지 한 번에 다루지 않은 것은 범위를 좁힌 합리적 결정이었다(그 사이클 자체도 이미 컸음) — 근거가 약했던 결정이 아니라 의도적으로 미룬 다음 단계.

### 비판적 재검토 (사용자 문제 제기에 대한 반박 질문과 답)

- **이 증상이 정말 구조 문제인가, 우연한 버그인가?** #39는 구조적 원인(낙관적 상태와 폴링 스냅샷의 이중 관리)에서 나온 버그다 — 우연한 실수가 아니라, 지금 구조에서는 언제든 같은 클래스의 race가 재현될 수 있다.
- **지금 안 고치면 다음 몇 번의 실제 변경에서 무슨 비용이 드는가(YAGNI)?** #39와 같은 종류의 버그(낙관적 항목과 폴링 스냅샷 불일치)가 다른 낙관적 갱신 기능(알림 읽음 처리 등)에서도 반복될 수 있다. 다만 알림 쪽은 "목록에 새 항목을 낙관적으로 추가"하는 패턴이 아니라 "기존 항목의 필드(isRead)만 바꾸는" 패턴이라 #39와 같은 tmp-id 병합 문제는 구조적으로 발생하지 않는다 — 알림 쪽 리스크는 댓글 쪽보다 낮다.
- **더 급한 다른 문제를 가리는 건 아닌가?** #39는 이미 실사용자에게 재현 가능한 버그로 확인됐다(백엔드 read-after-write 보장 여부와 무관하게, 최소한 이론적으로는 재현 가능) — 더 급한 문제를 가리는 게 아니라 그 자체로 우선순위가 있다.
- **(범위 재검토) 댓글과 알림을 한 사이클에서 같이 다뤄야 하는가?** 근본 원인(수동 폴링/optimistic update)은 같지만, 실제 코드 경로와 리스크 수준은 다르다(댓글=실제 버그+tmp-id 병합, 알림=수동 상태머신+3중복 롤백 패턴이지만 확인된 버그 없음). 목표 인터뷰에서 범위를 어디까지 묶을지 확인이 필요하다.

## 목표와 범위

### Goal

댓글(`usePostReactions`)과 알림(`useNotiStore`/`useNotiPolling`) 양쪽의 폴링·낙관적 갱신을 TanStack Query의 `refetchInterval`/`useMutation`(`onMutate`/`onError` 롤백) 패턴으로 통합하고, 그 과정에서 #39 버그(댓글 작성 직후 방금 쓴 댓글이 사라짐)를 근본적으로 제거한다.

목표 인터뷰에서 "댓글만 우선, 알림은 후속"이라는 추천안 대신, 근본 원인이 같다는 이유로 사용자가 댓글+알림 모두를 이번 사이클에 포함하는 더 넓은 범위를 선택했다.

### Success Criteria

- 댓글 폴링/optimistic append가 TanStack Query 기반으로 전환되고, #39 재현 테스트가 "고쳐진 동작"을 검증하도록 갱신된다.
- `useNotiStore`/`useNotiPolling`이 TanStack Query 기반으로 전환되고, 전용 테스트가 추가된다(현재 0건).
- 좋아요 낙관적 갱신(`usePostLikeToggle`)은 이번 사이클에서 변경하지 않는다(이미 별도 훅으로 분리돼 있고, 이번 문제와 무관).
- 댓글/알림 각각의 기존 폴링 조건(입력 중 skip, 탭 숨김 시 주기 확대, 온라인 복귀 시 즉시 재조회, 5초 주기, no-login 상태)이 전후 동일하게 동작한다.

### Out of Scope

- 좋아요 낙관적 갱신(`usePostLikeToggle.ts`) 리팩터링 — 이미 분리돼 있고 이번 문제(폴링+댓글/알림 optimistic append)와 무관.
- `PostCardDetailModal`/`usePostReactions`의 책임 분리(#6) — 별개 이슈.
- 실시간(WebSocket) 반영 도입(#55) — 이번 사이클은 폴링 방식을 유지한 채 구현만 TanStack Query로 옮긴다.
- 백엔드 `read-after-write` 일관성 보장 여부 자체를 API 레벨에서 고치는 것 — 프론트엔드에서 "mutation 성공 직후 불필요한 refetch로 자기 자신의 optimistic 결과를 덮어쓰지 않는" 방식으로 회피한다.
- API 응답 포맷(`GetCommentsResDto`, `NotiResponseDto` 등) 변경.

### Behavior Invariants

- 댓글: 입력 중/전송 중에는 폴링을 skip한다.
- 댓글: 탭이 숨겨지면 폴링 주기를 늘린다(6배, 최소 30초).
- 댓글: 온라인 복귀 시 즉시 재조회한다.
- 댓글: 좋아요 낙관적 갱신/실패 시 롤백은 그대로 유지된다(이번 사이클 범위 밖, `usePostLikeToggle` 미변경).
- 알림: 5초 주기 폴링, 비로그인 시 `no-login` 상태.
- 알림: 읽음/전체읽음/전체삭제 낙관적 갱신+실패 시 롤백은 그대로 유지된다.
- **수정 대상(의도된 동작 변경)**: #39 버그 자체(방금 쓴 댓글이 사라지는 것)만 수정된다 — 이건 "동작 보존"의 예외로 명시적으로 허용된 변경이다.

## 기준선 검증

| 명령                   | 결과    | 실패 항목 | 비고                                   |
| ---------------------- | ------- | --------- | -------------------------------------- |
| `pnpm lint`            | ✅ 성공 | 없음      | 4/4 태스크 성공(전부 캐시, FULL TURBO) |
| `pnpm check-types`     | ✅ 성공 | 없음      | 3/3 태스크 성공(전부 캐시, FULL TURBO) |
| `pnpm test` (apps/web) | ✅ 성공 | 없음      | 33 suites / 155 tests 모두 통과, 5.6s  |
| `pnpm build`           | ✅ 성공 | 없음      | 3/3 태스크 성공, 16개 라우트           |

측정 불가: `useNotiStore`/`useNotiPolling` 전용 테스트 — 0건(안전망 공백, Success Criteria에 반영 예정).

---

**[GATE 1]** 위 진단·목표·범위(댓글+알림 모두, 사용자가 추천안보다 넓게 선택)·Behavior Invariants·기준선을 확인해주시면 다음 단계로 넘어가겠습니다.
