# 문제 영역

댓글 폴링(`usePostReactions`)과 알림 폴링(`useNotiStore`/`useNotiPolling`), 그리고 좋아요·댓글 낙관적 갱신+롤백이 TanStack Query 없이 각각 수동으로(`setTimeout`/`setInterval` 스케줄링, 수동 optimistic append/rollback) 구현되어 있다.

## 관찰한 증상

- `usePostReactions.ts`가 `setTimeout` 기반 폴링 스케줄러(`schedule()`), 온라인/오프라인 리스너, 입력 중 skip 로직을 손으로 구현하고 있다.
- `useNotiStore.ts` + `useNotiPolling.ts`가 `setInterval` 기반 폴링과 `status`(idle/loading/success/error/no-login) 수동 상태머신, `readNoti`/`readAllNotis`/`deleteAllNotis`의 수동 optimistic 갱신+롤백을 구현하고 있다.
- 둘 다 서버 상태를 각자의 방식으로 폴링/캐싱하고 있어, 같은 문제(재시도, 백오프, 요청 취소, 낙관적 갱신 롤백)를 두 번 다른 방식으로 풀고 있다.

## 실제 사례

- **버그(#39)**: `usePostReactions.ts`의 `submitComment`에서 `createComment` 성공 후 `tmpId`를 서버 id로 교체한 다음 바로 `refetchComments()`를 호출하는데, 이 refetch의 서버 응답이 아직 그 댓글을 포함하지 않으면(`mergeComments`가 `tmp-`로 시작하는 항목만 보호) 방금 작성한 댓글이 화면에서 사라지고 카운트도 되돌아간다. 재현 테스트: `usePostReactions.test.ts`의 "[재현·버그 #39]".
- `server-state-caching`(#139) PRD에서 이 영역(폴링, optimistic update)을 명시적으로 Out of Scope로 남기며 "TanStack Query가 이 패턴을 라이브러리 레벨로 제공하니 검토 가치가 있다"고 적어뒀다.

## 초기 가설

- TanStack Query의 `refetchInterval`(폴링)과 `useMutation`의 `onMutate`/`onError` 롤백 패턴으로 두 영역(댓글, 알림)의 수동 구현을 대체할 수 있을 것이라는 가설 — 아직 검증 안 됨.
- #39 버그는 "언제 refetch를 다시 부를지"와 "낙관적으로 추가한 항목을 어떻게 서버 데이터와 병합할지"의 책임이 명확히 분리되지 않아서 생긴 것이라는 가설.

## 기대 효과

- 폴링/optimistic update 로직이 라이브러리 레벨 패턴으로 통일되면, #39류의 수동 병합 로직 버그가 반복될 위험이 줄어든다.
- 새로운 폴링/낙관적 갱신이 필요한 기능이 추가될 때 매번 스케줄러를 새로 짜지 않아도 된다.

## 제약

- 댓글 폴링의 기존 동작(입력 중/전송 중 skip, 탭 숨김 시 폴링 주기 늘림, 온라인 복귀 시 즉시 재조회)은 유지되어야 한다.
- 알림 폴링의 기존 동작(비로그인 시 `no-login` 상태, 5초 주기)은 유지되어야 한다.
- 좋아요/댓글 낙관적 갱신+롤백의 사용자 체감 동작(즉시 반영, 실패 시 원상복구)은 유지되어야 한다.
- 근거가 부족하거나 비용이 이득보다 크면 "지금은 전환하지 않는다"는 결론도 유효한 결과다. 단, #39 버그 자체는 이 사이클에서든 별도로든 반드시 고쳐야 한다.
