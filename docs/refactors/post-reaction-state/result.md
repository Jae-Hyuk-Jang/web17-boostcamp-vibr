# Result — post-reaction-state

## 변경 요약

좋아요 낙관적 갱신·롤백·`usePostReactionOverridesStore` 동기화 로직을 `PostCard.tsx`와 `usePostReactions.ts`에 중복 구현하던 것을, 전담 훅 `usePostLikeToggle`(`apps/web/src/hooks/post/usePostLikeToggle.ts`) 하나로 캡슐화했다. `PostCard`는 이 훅을 직접 호출하고, `usePostReactions`는 내부에서 이 훅을 호출해 기존 반환 타입 그대로 위임(훅 합성)한다. `PostCardDetailModal.tsx` 등 소비 컴포넌트는 전혀 수정하지 않았다.

전체 4개 이슈(#44~#47)로 나눠 진행했고, 특성화 테스트(#36)까지 포함하면 이 사이클은 서브이슈 5개(#36, #44, #45, #46, #47) 전부로 구성된다(부모 이슈 #48).

## Before / After

| 지표                                            | Before(baseline.md)                                   | After                                                         |
| ----------------------------------------------- | ----------------------------------------------------- | ------------------------------------------------------------- |
| 좋아요 로직 소유 위치                           | `PostCard.tsx`, `usePostReactions.ts` 2곳에 중복 구현 | `usePostLikeToggle.ts` 1곳(양쪽이 재사용)                     |
| `PostCard.tsx`                                  | 134줄                                                 | 103줄                                                         |
| `usePostReactions.ts`                           | 362줄                                                 | 329줄                                                         |
| 신규: `usePostLikeToggle.ts`                    | —                                                     | 75줄                                                          |
| `apps/web` 프론트엔드 테스트                    | 0개                                                   | 14개(`PostCard.test.tsx` 6개, `usePostReactions.test.ts` 8개) |
| `pnpm test`에 `apps/web` 포함 여부              | 미포함(`apps/api`만)                                  | 포함                                                          |
| `PostCardDetailModal.tsx` 등 소비 컴포넌트 변경 | —                                                     | 무변경(전체 사이클 통틀어 0줄)                                |
| `pnpm lint`/`check-types`/`test`/`build`        | 전부 PASS(리팩터링 전)                                | 전부 PASS(리팩터링 후, 2026-07-20)                            |

성능(번들 크기·리렌더 횟수 등)은 애초에 이번 리팩터링의 목표 기준이 아니었고(brief-fixed.md), 실제로 측정 도구도 없어 "측정 불가"로 남긴다 — 클라이언트 상태 이동만 있었으므로 유의미한 변화가 있을 것으로 예상하지 않는다.

## Behavior Verification

`baseline.md`의 Behavior Invariants 10개를 항목별로 재확인했다.

| #   | 항목                                       | 상태                                                                                                                                                                                                      |
| --- | ------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | 좋아요 즉시 낙관적 반영, 실패 시 롤백      | ✅ 유지(`PostCard.test.tsx` #1,#2, `usePostReactions.test.ts` #1,#2)                                                                                                                                      |
| 2   | 비로그인 버튼 비활성화, API 미호출         | ✅ 유지(`PostCard.test.tsx` #3)                                                                                                                                                                           |
| 3   | 카드/모달 좋아요 override 동기화           | ✅ 유지(`PostCard.test.tsx` #4, `usePostReactions.test.ts` #1)                                                                                                                                            |
| 4   | 좋아요 진행 중 중복 요청 방지              | ✅ 유지 — 단, #44에서 발견한 두 소비처의 실제 견고함 차이(`PostCard`는 재클릭 시 토글→역토글, `usePostReactions`는 완전 차단)까지 `resetSubmittingOnSync` 옵션으로 그대로 보존했다. 새로운 동작 변경 없음 |
| 5   | 댓글 optimistic + refetch 보정 + 실패 롤백 | ✅ 유지(미변경 코드)                                                                                                                                                                                      |
| 6   | 댓글 수 카드 반영                          | ✅ 유지(미변경 코드)                                                                                                                                                                                      |
| 7   | 댓글 폴링 주기/skip 규칙                   | ✅ 유지(미변경 코드, Out of Scope)                                                                                                                                                                        |
| 8   | 본문수정 동기화                            | ✅ 유지(미변경 코드, Out of Scope)                                                                                                                                                                        |
| 9   | 삭제 동기화                                | ✅ 유지(미변경 코드, Out of Scope)                                                                                                                                                                        |
| 10  | `@repo/dto` 타입 불변                      | ✅ 유지(`pnpm check-types` PASS, DTO 파일 무변경)                                                                                                                                                         |

## Decision Review

plan.md에서 선택한 "안 2(전담 훅 추출)"의 실제 결과를 되짚어본다.

- **장점 실현됨**: 좋아요 로직이 실제로 한 곳(`usePostLikeToggle.ts`)에만 존재하게 됐고, 새 반응 타입을 추가할 때 이 패턴(전담 훅 + 필요 시 옵션 파라미터)을 그대로 복제할 수 있는 선례가 생겼다.
- **예상 밖 비용**: ADR 작성 시점에는 "카드/모달이 똑같은 로직을 복붙했다"고 봤지만, 실제로 구현하며 보니 **두 구현이 미묘하게 달랐다**(재동기화 이펙트가 `isSubmitting`을 리셋하는지 여부, `postId` 변경과 override 변경을 구분하는지 여부). "구조만 옮기고 동작은 그대로"를 지키려다 보니 `resetSubmittingOnSync` 옵션과 `postId` 변경 추적 로직이 추가로 필요했다 — 이는 애초 plan.md가 예상한 것보다 훅 인터페이스가 조금 더 복잡해졌다는 뜻이다.
- **트레이드오프 평가**: 그럼에도 이 옵션은 "동작 변경 없음" 원칙을 지키기 위한 정직한 대가였다고 본다. 옵션 없이 그냥 하나로 합쳤다면 둘 중 한 소비처의 동작이 조용히 바뀌었을 것이다(#44/#45 논의 참고).

## Remaining Debt

- **인증 판단 소스 불일치**(`PostCard`: 전역 `useAuthStore` / `usePostReactions`: 자체 `authMe()`)는 의도적으로 그대로 남겨뒀다(Out of Scope). `usePostLikeToggle`이 `isAuthenticated`를 파라미터로만 받게 설계해서, 나중에 소스를 통일하기로 결정하면 호출부만 고치면 되는 상태로 준비는 되어 있다.
- **`PostCard`의 "연타 시 토글→역토글" 특성**(#44에서 발견)은 버그로 확정하지 않고 그대로 보존했다. 실제 문제가 되는지는 후속 판단이 필요하다.
- **버그 #39**(댓글 작성 직후 refetch가 방금 쓴 댓글을 지울 수 있음)는 여전히 미해결 상태로 별도 이슈에 남아 있다.
- **백로그**: #41(`PostCardDetailModal` 책임 분리), #42(`components/` 훅 기반 합성 패턴 정립), #43(서버 상태 캐싱 라이브러리 도입 검토) — 전부 착수 전.

## Follow-ups

- #39: 댓글 소실 버그 수정(별도 사이클)
- 인증 판단 소스 통일 여부 판단 — 필요하면 새 이슈로 제안
- `PostCard`의 재클릭 특성이 실사용에서 문제가 되는지 관찰 후, 문제라면 별도 버그 이슈로 등록
- #41, #42, #43 백로그는 우선순위가 정해지면 각각 `/refactoring-planner`로 새 사이클 시작

---

**[GATE 6]** 위 전후 비교와 남은 부채를 확인해주세요. 확인되면 `post-reaction-state` 리팩터링 사이클(#48)을 종료합니다.
