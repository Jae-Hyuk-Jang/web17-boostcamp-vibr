# Brief Fixed — post-reaction-state

## Goal

좋아요 토글(및 향후 확장될 반응 타입)의 낙관적 갱신·롤백·`usePostReactionOverridesStore` 동기화 로직을 **전담 훅으로 캡슐화**해서, 피드 카드와 상세 모달이 같은 구현을 재사용하게 한다. 스토어(`usePostReactionOverridesStore`) 자체의 내부 구조는 바꾸지 않고, 그 위에 접근을 캡슐화하는 계층만 새로 만든다.

## Success Criteria

1. **응집도**: 좋아요 낙관적 갱신·롤백·인증 체크 로직이 한 곳(전담 훅)에만 존재한다 — 현재처럼 `PostCard.tsx`와 `usePostReactions.ts` 두 곳에 중복 구현되지 않는다.
2. **확장성**: 새 반응 타입(예: 북마크)을 추가할 때 건드려야 하는 파일 수가 지금보다 줄어든다. (현재는 스토어에 필드/액션 추가 + 최소 2곳의 개별 구현이 필요 — 목표는 "훅 1개 + 소비 지점에서 그 훅 호출"로 축소)
3. **인증 판단 소스 일원화**: 카드와 모달이 좋아요 가능 여부를 판단하는 소스가 하나로 통일된다(현재는 `useAuthStore` vs 자체 `authMe()`로 갈라져 있음 — 이 리팩터링이 이 불일치를 해소하는지 별도로 확인한다. 단, 이건 "동작을 고치는 버그 수정"이 아니라 "구조를 하나로 합치는 과정에서 자연히 소스가 하나가 되는가"를 뜻하며, 의도적으로 동작을 바꾸는 작업은 아니다).
4. `baseline.md`의 Behavior Invariants 10개가 리팩터링 후에도 모두 성립한다.
5. `PostCard.test.tsx`(5개) + `usePostReactions.test.ts`(6개, `[재현·버그 #39]` 제외 — 아래 Out of Scope 참고) 특성화 테스트가 리팩터링 후에도 계속 통과한다(단, 내부 구현이 바뀌므로 테스트 자체는 새 구조에 맞게 갱신될 수 있다 — "지금과 동일한 관찰 가능한 동작"을 계속 검증하는 것이 핵심).
6. `pnpm lint`/`check-types`/`test`/`build` 모두 통과.

## Behavior Invariants (baseline.md 재확인, 변경 없음)

`docs/refactors/post-reaction-state/baseline.md`의 10개 항목을 그대로 따른다. 이 리팩터링은 위 항목들을 유지한 채 **구조만** 바꾼다.

## Out of Scope

- **#39(댓글 작성 직후 refetch가 방금 쓴 댓글을 지우는 버그) 수정** — 구조 캡슐화 과정에서 기존 `submitComment`/`refetchComments` 로직은 동작 변경 없이 그대로 옮긴다. 버그 자체는 별도 이슈(#39)에서 다룬다.
- **인증 판단 소스 불일치를 "의도적으로" 고치는 것** — 훅 통합 결과로 자연히 하나의 소스로 합쳐질 수는 있지만, 그것을 목표로 별도 설계를 하지는 않는다(이것도 동작 변경에 해당할 수 있어서, 필요하면 별도 이슈로 분리한다).
- **`usePostReactionOverridesStore`의 내부 구조(반응 타입별 개별 필드) 재설계** — Stage 2 목표 인터뷰에서 스토어 모양은 유지하기로 확정.
- **새 라이브러리(React Query 등) 도입** — 백로그 이슈 [#43](https://github.com/Jae-Hyuk-Jang/web17-boostcamp-vibr/issues/43)로 분리.
- **`PostCardDetailModal`의 UX 로깅/반응형 라우팅/스와이프 제스처 책임 분리** — 백로그 이슈 [#41](https://github.com/Jae-Hyuk-Jang/web17-boostcamp-vibr/issues/41)로 분리.
- **`components/` 전반의 훅 기반 합성 패턴 정립** — 백로그 이슈 [#42](https://github.com/Jae-Hyuk-Jang/web17-boostcamp-vibr/issues/42)로 분리.
- **댓글 CRUD/폴링 로직 리팩터링** — 좋아요 부분만 범위. `usePostReactions`에서 댓글 부분은 이번에 건드리지 않는다(단, 좋아요 로직을 빼내는 과정에서 파일이 어떻게 나뉘는지는 단계 3에서 결정).
- **데이터 마이그레이션/배포 호환성** — 클라이언트 전용 zustand 상태라 해당 없음.

## 용어 정의 (Ubiquitous Language)

- **반응 상태(reaction state)**: 좋아요/댓글수/본문수정/삭제 오버라이드를 통칭.
- **오버라이드(override)**: 서버 응답(`Post` DTO) 위에 클라이언트가 낙관적으로 덮어쓰는 값. `usePostReactionOverridesStore`에 저장됨.
- **전담 훅**: 좋아요 상태의 낙관적 갱신/롤백/스토어 동기화를 캡슐화하는 새 훅(이름은 단계 3에서 확정, 가칭 `usePostLikeToggle`).
