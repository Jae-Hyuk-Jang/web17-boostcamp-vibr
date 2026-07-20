# 문제 영역

## 관찰한 증상

- 게시글의 좋아요/댓글 반응 상태가 여러 파일에 걸쳐 있다: `PostCard.tsx`, `PostHeader.tsx`, `usePostReactions.ts`, `PostCardDetailModal.tsx`, `FeedView.tsx`, 그리고 전역 스토어 `usePostReactionOverridesStore`(위 5개 컴포넌트/훅 + `stores/index` 배럴까지 총 6곳에서 직접 참조).
- 좋아요 토글의 낙관적 갱신(optimistic update) + 실패 시 롤백 로직이 `PostCard.tsx`와 `usePostReactions.ts` 두 곳에 독립적으로 구현되어 있다.
- `usePostReactions.ts`(362줄)가 이 저장소 훅 중 가장 크고, `PostCardDetailModal.tsx`(396줄)가 컴포넌트 중 가장 크다.
- `PostCardDetailModal.tsx`는 최근 100개 커밋 중 3번 변경된 hot spot이다.

## 실제 사례

- 매크로 스캔(2026-07-20) 과정에서 `PostCard.tsx`(67-97행 `handleToggleLike`)와 `usePostReactions.ts`(264-297행 `toggleLike`)를 직접 읽어 비교한 결과, 두 구현이 "스냅샷 → 로컬 optimistic 반영 → 전역 store(`setLikeOverride`) 반영 → API 호출 → 실패 시 롤백"이라는 동일한 순서를 변수명만 다르게 각각 재구현하고 있음을 확인했다.
- 이 저장소는 자동화된 프론트엔드 테스트가 0개라(`apps/web/package.json`에 `test` 스크립트 없음), 이 중복이 실제로 회귀를 일으킨 사례가 있는지는 기록으로 확인할 수 없다 — 코드 구조상의 위험으로만 판단했다.

## 초기 가설

- 좋아요/댓글/본문수정/삭제 네 종류 반응 각각의 상태 소유권과 화면(피드 카드 ↔ 상세 모달) 간 동기화 계약이 명시적으로 정의되어 있지 않아서, 화면마다 낙관적 갱신 로직을 따로 구현하게 된 것으로 보인다. 아직 검증되지 않은 가설이다.

## 기대 효과

- 반응 상태(특히 좋아요)의 낙관적 갱신/롤백 로직을 단일 지점으로 모으면, 정책 변경(예: 실패 메시지, 디바운스) 시 여러 파일을 동시에 고칠 필요가 없어진다.
- `PostCardDetailModal.tsx`/`usePostReactions.ts`의 책임이 좁아지면 다음 변경(새 반응 타입 추가 등)의 영향 범위를 줄일 수 있다.

## 제약

- `@repo/dto`의 좋아요/댓글 요청·응답 타입(필드명, optional/nullable)은 이번에 바꾸지 않는다.
- 로그인하지 않은 사용자의 공개 피드/게시글 열람 동작은 그대로 유지되어야 한다.
- 사용자가 보는 동작(좋아요 즉시 반영, 실패 시 롤백, 피드↔상세모달 동기화)은 리팩터링 전후로 동일해야 한다.
