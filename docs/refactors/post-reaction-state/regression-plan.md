# Regression Plan — post-reaction-state

이번 리팩터링이 실제로 건드리는 코드는 `PostCard.tsx`의 좋아요 토글 부분과 `usePostReactions.ts`의 좋아요 토글 부분뿐입니다(댓글/본문수정/삭제는 Out of Scope). 안전망도 이 범위에 맞춰 판단합니다.

> **업데이트(#44 진행 중 발견)**: 4번 공백(중복 요청 방지)을 테스트로 채우던 중, `PostCard.tsx`는 애초 기대("진행 중이면 재클릭이 무시된다")와 다르게 동작함을 확인했습니다. override 동기화 `useEffect`(59-63행)가 첫 클릭의 optimistic store 기록을 감지해 `isLikeSubmitting`을 곧바로 `false`로 되돌리기 때문에, 같은 tick 안의 두 번째 클릭이 가드를 통과해 반대 방향으로 토글됩니다(addLike 1회 + removeLike 1회, 순변화 없음). `usePostReactions.ts`(모달 측)는 이 문제가 없습니다(store를 반응형으로 구독하지 않고 `getState()`로만 쓰기 때문). 테스트는 이 실제 동작을 그대로 특성화했습니다 — 동작 변경이 필요한 사안인지는 별도 판단이 필요하나, 실사용 더블클릭 간격에서는 문제로 드러나지 않을 가능성이 높아 이번 리팩터링 범위에서 고치지는 않습니다(Out of Scope 유지, 필요시 후속 이슈로 분리).

## 기존 특성화 테스트(#36) 커버리지 감사

| Behavior Invariant(baseline.md)                    | 관련 테스트                                                  | 상태                                                    |
| -------------------------------------------------- | ------------------------------------------------------------ | ------------------------------------------------------- |
| 1. 좋아요 누르면 즉시 낙관적 반영, 실패 시 롤백    | `PostCard.test.tsx` #1,#2 / `usePostReactions.test.ts` #1,#2 | 커버됨                                                  |
| 2. 비로그인 시 버튼 비활성화, API 미호출           | `PostCard.test.tsx` #3                                       | 커버됨                                                  |
| 3. 카드/모달 간 좋아요 override 동기화             | `PostCard.test.tsx` #4 / `usePostReactions.test.ts` #1       | 커버됨                                                  |
| 4. 좋아요 진행 중 중복 요청 방지                   | 없음                                                         | **공백**                                                |
| 5. 댓글 작성 optimistic + refetch 보정 + 실패 롤백 | `usePostReactions.test.ts` #4,#5,#6                          | 커버됨(이번 리팩터링과 무관 — 안 건드림)                |
| 6. 댓글 수 카드 반영                               | `PostCard.test.tsx` #5                                       | 커버됨(이번 리팩터링과 무관 — 안 건드림)                |
| 7. 댓글 폴링 주기/skip 규칙                        | 없음                                                         | 공백이지만 Out of Scope(안 건드림) — 이번엔 채우지 않음 |
| 8. 본문수정 동기화                                 | 없음                                                         | Out of Scope(안 건드림) — 이번엔 채우지 않음            |
| 9. 삭제 동기화                                     | 없음                                                         | Out of Scope(안 건드림) — 이번엔 채우지 않음            |
| 10. DTO 타입 불변                                  | `pnpm check-types`                                           | TypeScript로 자동 검증                                  |

## 새로 채워야 할 공백 (구현 착수 전 이슈 1번으로 진행)

1. **중복 요청 방지 테스트**: `isLikeSubmitting`/`isSubmittingLike`가 true인 동안 같은 토글을 다시 눌러도(또는 `toggleLike()`를 다시 호출해도) API가 두 번 호출되지 않는지 — `PostCard.test.tsx`, `usePostReactions.test.ts` 양쪽에 추가.
2. **Contract test — `usePostReactions`의 반환 타입 동일성**: plan.md에서 지목한 마이그레이션 위험("반환 필드명·타입을 정확히 유지하지 못하면 `PostCardDetailModal`이 깨질 수 있음")에 대한 안전망. `usePostReactions`가 반환하는 객체의 키 목록(`isAuthenticated, isLiked, likeCount, toggleLike, isSubmittingLike, comments, isCommentsLoading, commentText, setCommentText, submitComment, isSubmittingComment, commentCount, refetchComments`)이 리팩터링 전후로 동일한지 확인하는 테스트.

이 두 가지는 **구조를 옮기기 전에** 먼저 작성해서 기존(리팩터링 전) 코드 기준으로 통과시켜 둡니다 — 그래야 리팩터링 도중 이 두 가지가 깨지면 "새로 만든 문제"라는 걸 바로 알 수 있습니다.

## 회귀 행렬

| 시나리오                         | 기존 결과                 | 검증 수준                                             | 실패 시 조치                  |
| -------------------------------- | ------------------------- | ----------------------------------------------------- | ----------------------------- |
| 정상 좋아요 토글                 | 낙관적 반영 + store 기록  | 통합(`PostCard.test.tsx`, `usePostReactions.test.ts`) | 구현 중단, plan.md 재검토     |
| 좋아요 API 실패                  | 로컬+store 모두 롤백      | 통합                                                  | 구현 중단                     |
| 좋아요 중복 클릭(진행 중 재클릭) | API 1회만 호출            | 단위(신규 작성)                                       | 구현 중단                     |
| 비로그인 좋아요 클릭             | 버튼 비활성화, API 미호출 | 통합                                                  | 구현 중단                     |
| `usePostReactions` 반환 타입     | 키·타입 동일              | 계약(신규 작성)                                       | 설계 재검토(합성 방식 재점검) |
| 카드↔모달 좋아요 동기화          | override 통해 반영        | 통합                                                  | 구현 중단                     |

## Seam(최소 허용 변경)

이번 리팩터링 자체가 "seam 도입"(새 훅 추출)이라 별도의 추가 seam은 필요하지 않습니다. 다만 위 공백 2건을 채우는 테스트 작성이 선행되어야 하며, 이 테스트 작성 자체는 **동작을 바꾸지 않는 별도 커밋**(이슈 분해 1번)으로 둡니다.

---

**[GATE 4]** 위 공백 2건(중복 요청 방지, `usePostReactions` 반환 타입 계약)과 회귀 행렬을 확인해주세요. 확인되면 단계 5(이슈 분해)로 넘어가겠습니다.
