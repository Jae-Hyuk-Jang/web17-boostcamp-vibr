# Regression Plan — post-detail-modal-responsibility

`PostCardDetailModal.tsx`를 겨냥한 테스트가 0개(baseline.md)이므로, 안전망을 처음부터 만들어야 합니다. UX 로그 로직만 옮기는 리팩터링이지만, 그 로직이 지금 컴포넌트 안에 있으므로 **이관 전 기준 동작을 먼저 특성화**합니다.

## 특성화 대상과 이유

| 대상                                                                                                           | 왜 필요한가                                                                                                                                       |
| -------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `emitOnce` 가드가 "닫기 버튼/배경클릭/스와이프" 경로와 "unmount cleanup" 경로 양쪽에서 정확히 1번만 전송하는지 | diagnosis.md에서 결함 위험 3점 — 두 경로가 겹치는 타이밍(예: 닫기 버튼 클릭과 동시에 unmount)에 중복 전송될 가능성을 코드만 보고는 확신할 수 없음 |
| 재생 시간(`listenMsByMusicRef`) 누적이 "이 게시글의 음악을 재생 중일 때만" 정확히 이루어지는지                 | 다른 게시글 음악을 재생 중이면 누적되면 안 됨(179-193행의 `postMusicIdSet.has` 체크) — 실수하기 쉬운 조건                                         |
| 비로그인 사용자는 로그를 아예 전송하지 않는지                                                                  | Behavior Invariant 5번                                                                                                                            |
| 모달이 열릴 때마다(같은 세션 안에서 다른 게시글로 전환 포함) 상태가 초기화되는지                               | `emittedRef`가 리셋 안 되면 두 번째 게시글에서 로그가 영영 안 나갈 수 있음                                                                        |

## 테스트 접근 — 컴포넌트 레벨 특성화 (이번 사이클의 이슈 1)

`PostCardDetailModal.tsx`는 12개 훅/스토어에 의존하지만, `PostCard.test.tsx`(#45)에서 이미 쓴 패턴(실제 zustand 스토어는 그대로 사용 + 네트워크 훅/자식 컴포넌트만 mock)을 그대로 적용할 수 있습니다.

- **실제 스토어 사용**(mock 불필요): `useModalStore`, `usePlayerStore`, `usePostReactionOverridesStore`, `useAuthStore` — `beforeEach`에서 `.setState()`로 초기화.
- **mock 필요**: `usePostDetail`, `useLikedUsers`, `usePostReactions`(네트워크 호출 훅), `useIsMobile`, `useSwipeToDismiss`(브라우저 API 의존), `next/navigation`(`useRouter`/`usePathname`), `react-toastify`, `@/api`(`updatePost`), **`@/utils/logQueue`의 `enqueueLog`(스파이 대상 — 이게 UX 로그 전송의 관찰 지점)**.
- **자식 컴포넌트 mock**: `PostHeader`, `PostMedia`, `PostDetailBody`, `PostDetailActions`, `PostDetailCommentComposer`, `LikedUsersOverlay`, `LoadingSpinner` — `PostCard.test.tsx`처럼 최소 stub으로 대체(테스트 대상은 UX 로그 로직이지 자식 렌더링이 아님).

## 회귀 행렬

| 시나리오                                                            | 기존 결과                                    | 검증 수준            | 실패 시 조치              |
| ------------------------------------------------------------------- | -------------------------------------------- | -------------------- | ------------------------- |
| 모달 닫기 버튼 클릭                                                 | `enqueueLog` 1회 호출, dwell/재생 정보 포함  | 통합(신규 작성)      | 구현 중단, plan.md 재검토 |
| 모달 unmount(닫기 버튼 없이)                                        | `enqueueLog` 1회 호출                        | 통합(신규 작성)      | 구현 중단                 |
| 닫기 버튼 클릭 직후 unmount(중복 가능성)                            | `enqueueLog` 정확히 1회만                    | 통합(신규 작성)      | 구현 중단                 |
| 비로그인 상태로 모달 닫힘                                           | `enqueueLog` 미호출                          | 통합(신규 작성)      | 구현 중단                 |
| 이 게시글 음악 재생 중 시간 경과                                    | `listenMsByMusic`에 누적됨                   | 단위/통합(신규 작성) | 구현 중단                 |
| 다른 게시글 음악 재생 중                                            | 이 게시글의 `listenMsByMusic`에는 누적 안 됨 | 단위/통합(신규 작성) | 구현 중단                 |
| `usePostDetailUxLog` 반환 함수(`recordPlayedMusic`/`emit`) 시그니처 | 컴포넌트가 기대하는 형태와 일치              | 계약(신규 작성)      | 설계 재검토               |

## Seam

- `Date.now()`/`window.setInterval`을 훅 내부에서 직접 호출하되, 테스트에서는 실제 타이머(jest는 fake timer 없이도 `setInterval` 콜백을 짧은 간격으로 실행해 검증 가능 — `post-reaction-state`에서 실시간 타이머를 그대로 쓴 전례가 있음)로 검증한다. 별도의 시간 주입 파라미터는 이번엔 추가하지 않는다(YAGNI — 지금 필요성이 확인되지 않음).

## 산출물

- 이슈 1(아래 이슈 분해 참고)에서 `PostCardDetailModal.test.tsx`를 신설해 위 회귀 행렬을 코드로 고정한다 — **UX 로그 이관 전, 기존 인라인 코드 기준으로 먼저 통과시킨다.**

---

**[GATE 4]** 위 특성화 대상과 회귀 행렬을 확인해주세요. 확인되면 단계 5(이슈 분해)로 넘어가겠습니다.
