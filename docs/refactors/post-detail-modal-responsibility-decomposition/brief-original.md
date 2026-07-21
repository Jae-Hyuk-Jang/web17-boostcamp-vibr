# 문제 영역

`PostCardDetailModal.tsx`의 과도한 책임 (선행 사이클 `post-detail-modal-responsibility`의 후속)

## 관찰한 증상

- `PostCardDetailModal.tsx`(329줄)가 모달 게이팅, 데이터 오케스트레이션(`usePostDetail`/`useLikedUsers`/`usePostReactions` 3개 훅 조합 + 낙관적 오버라이드 병합), 플레이어 연동, 리사이즈 시 라우트 전환, 본문 편집 상태머신(인라인 textarea+버튼 UI 포함), UX 로그 방출 배선, 스와이프 제스처, 모바일/데스크탑 두 레이아웃까지 한 컴포넌트 안에서 전부 처리한다.
- 이 파일을 수정하려면 서로 무관한 여러 관심사를 동시에 이해해야 한다.

## 실제 사례

- 편집 모드 상태머신(`isEditing`/`editedContent`/`isSaving`, 99~130행)과 인라인 textarea+버튼 UI(265~288행)가 다른 관심사(데이터 페칭, 플레이어 연동 등)와 구분 없이 한 함수 본문에 나열돼 있다.
- 리사이즈 감지 후 프로필 페이지로 라우팅 전환하는 로직(75~96행, 22줄)도 마찬가지로 섞여 있다.

## 초기 가설

- (가설) 이미 완료된 `post-detail-modal-responsibility` 사이클(#41, #56~#58)이 UX 로그 부분만 `usePostDetailUxLog` 훅으로 뽑아냈고, 그때 후보 B(라우팅 전환 훅), C(본문 수정 훅), E(전면 컨테이너/표현 분리)는 YAGNI 근거로 보류됐다. 그 result.md가 "다음에 이 컴포넌트를 다시 다룰 일이 생기면 후보 B/C/E를 재평가할 것"을 명시적으로 권장했다 — 지금이 그 시점이다.
- (가설) `PlaylistDetailModal.tsx`의 제목 편집 상태머신(`isEditingTitle`/`draftTitle`/`startRename`/`commitRename`/`cancelRender`)이 `PostCardDetailModal`의 본문 편집 상태머신과 구조적으로 유사해 보인다(둘 다 "시작→로컬 드래프트 편집→API로 커밋→토스트→취소 시 되돌리기" 패턴) — 공용 훅으로 뽑을 수 있는지 확인이 필요하다.
- (가설) `apps/web/src/components/player/RightPanel.tsx`와 `apps/web/src/components/layout/MobileNotiOverlay.tsx`가 각각 스와이프 닫기 로직을 손으로 다시 구현하고 있는데, `PostCardDetailModal`이 이미 쓰고 있는 공용 훅 `useSwipeToDismiss`로 대체 가능한지 확인이 필요하다(다만 이건 `PostCardDetailModal` 자신의 책임 문제와는 별개로, 다른 컴포넌트들의 중복 문제다).

## 기대 효과

- `PostCardDetailModal.tsx`를 수정할 때 한 번에 이해해야 하는 관심사 수가 줄어든다.
- 본문 편집 로직이 재사용 가능한 형태로 분리되면, 향후 비슷한 인라인 편집 UI(플레이리스트 제목 등)와 공유할 수 있는 기반이 생긴다.

## 제약

- 좋아요/댓글/좋아요한 사용자 목록/재생/스와이프/모달 열림닫힘 등 기존 사용자 동작은 전부 그대로 유지되어야 한다.
- 선행 사이클에서 이미 정리한 `usePostDetailUxLog`는 그대로 유지한다(다시 건드리지 않음).
