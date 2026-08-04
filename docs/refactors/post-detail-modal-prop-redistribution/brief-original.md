# 문제 영역

`PostCardDetailModal` 도메인에서 `usePostDetailModal` 오케스트레이션 훅의 결과가 Desktop/Mobile 두 Shell(항상 동시 마운트)을 거쳐 leaf 컴포넌트까지 최대 2홉으로 재분배된다.

## 관찰한 증상

- 컴포넌트 안에 컴포넌트를 넣을 때 파라미터를 너무 많이 상속(prop으로 재전달)한다.
- 이 방식이 zustand/TanStack Query를 도입한 목적(어디서든 직접 구독 가능)과 맞지 않아 보인다.

## 실제 사례

- `usePostDetailModal.ts`가 6개 훅(`useAuthMe`/`usePostDetail`/`usePostReactions`/`useLikedUsers`/`useInlineEditField`/`usePostDetailUxLog`)을 합성해 중첩 객체(`reactions`/`editing`/`player`/`likedUsers`)를 반환한다.
- `PostCardDetailModal.tsx`가 이 결과를 Desktop Shell과 Mobile Sheet 양쪽에 동시에 넘긴다 — 두 Shell은 `hidden lg:flex`/`lg:hidden` CSS로만 전환될 뿐 **항상 둘 다 마운트**되어 있다.
- 각 Shell은 다시 `PostDetailBody`/`PostDetailActions`/`PostDetailCommentComposer` 등 leaf 컴포넌트에 `reactions`의 하위 집합을 `Pick<...>` 타입으로 각각 재정의해서 재전달한다 — 같은 데이터(`postDetailQueryKey` 캐시가 원천)가 Desktop 경로와 Mobile 경로로 두 번 재스레딩된다.

## 초기 가설

- 이전 사이클(post-detail-modal-responsibility-decomposition #125~131/#134)이 "이게 prop drilling인가?"를 검토했지만, 그때는 `PostCardDetailModal → 3개 직계 자식`까지만 봤고 그 Shell들이 내부적으로 leaf partial에 다시 전달하는 두 번째 홉은 재검토 대상에 없었던 것으로 보인다(가설, prd.md에서 확인 필요).
- leaf 컴포넌트가 `postDetailQueryKey` 캐시나 `usePostReactions`류 훅을 직접 구독하면 이 재스레딩을 줄일 수 있을 것 같다(가설).

## 기대 효과

- `reactions`에 필드가 추가/변경될 때 Desktop/Mobile 두 `Pick<>` 타입을 동시에 고치지 않아도 되게 만든다.
- 데이터 출처(캐시)와 실제 소비 컴포넌트 사이의 홉 수를 줄여 다음 변경(예: 새 반응 타입 추가)이 더 쉬워지게 한다.

## 제약

- 모바일 바텀시트의 슬라이드업/스와이프다운 애니메이션, 데스크탑↔모바일 리사이즈 전환, 편집/좋아요/댓글/좋아요한사용자목록 흐름은 그대로 유지되어야 한다.
- `post-detail-modal-responsibility-decomposition` 사이클이 이미 만들어둔 안전망(특성화 테스트 20개)을 깨지 않아야 한다.
