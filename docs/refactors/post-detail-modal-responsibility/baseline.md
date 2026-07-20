# Baseline — post-detail-modal-responsibility

## 범위 (이번 사이클에서 실제로 읽은 대상)

- `apps/web/src/components/modals/PostCardDetailModal/PostCardDetailModal.tsx` (396줄)
- `apps/web/src/components/modals/PostCardDetailModal/partials/`(`PostDetailActions.tsx`, `PostDetailBody.tsx`, `PostDetailCommentComposer.tsx`, `LikedUsersOverlay.tsx`) — 참고용, 이번 조사에서 상세히 읽진 않음

## 관찰한 구조 (Fact)

`PostCardDetailModal.tsx` 하나가 담당하는 서로 다른 책임을 나열하면:

1. **모달 열림/닫힘 상태 관리** — `useModalStore`의 `isOpen`/`modalType`/`modalProps` 기반 `isEnabled` 계산, `postId` 없으면 자동 close(36-39행).
2. **반응 상태 표시** — `usePostReactions`(#48에서 이미 정리됨) 호출, 좋아요/댓글 UI에 결과 전달(51-56, 366-381행). **이번 사이클에서는 손대지 않음.**
3. **본문 수정** — `isEditing`/`editedContent`/`isSaving` 로컬 상태, `handleStartEdit`/`handleSave`/`handleCancelEdit`, 성공 시 `setContentOverride` 호출(101-133행).
4. **UX 로그 수집** — 체류 시간(`openedAtRef`), 재생한 곡 목록(`playedMusicIdsRef`), 곡별 재생 시간(`listenMsByMusicRef`, 1초 tick interval), `emitOnce` 가드로 중복 방지, `handleClose`/unmount 시 전송(135-239행). **이번 조사에서 baseline.md 작성 중 새로 확인**: 브리프에 이미 언급됐지만 실제로는 그 자체로 5개의 ref + 2개의 effect + 2개의 콜백을 쓰는, 파일 안에서 가장 큰 단일 블록(105줄)이다.
5. **반응형 라우팅 전환** — 데스크톱→모바일 리사이즈 감지, 프로필 페이지에서 열려 있었다면 모달을 닫고 다른 라우트로 전환(78-99행).
6. **좋아요한 사용자 목록 오버레이** — `useLikedUsers` 호출, 열림 상태 관리(58-67, 386-393행).
7. **재생 트리거** — `handlePlayFromPost`/`handlePlayAll`, `usePlayerStore` 액션 호출과 UX 로그용 ref 갱신이 같은 콜백 안에 섞여 있음(156-173행).
8. **스와이프 제스처** — `useSwipeToDismiss` 훅 자체는 이미 분리되어 있고, 이 컴포넌트는 `handleClose`를 넘겨주고 반환된 핸들러를 모바일 바텀시트에 연결하는 정도(241행)만 담당.

**수정 사항(Fact, diagnosis.md 대비 갱신)**: `docs/refactors/post-reaction-state/diagnosis.md`는 이 파일이 "최근 100개 커밋 중 3회 변경된 hot spot"이라고 기록했지만, 실제 커밋 로그(`git log -- PostCardDetailModal/`)를 확인하니 3건 전부 `initial commit` + 저장소 전체 lint 정리 2건이며 **이 파일을 겨냥한 기능적 변경 커밋은 없다.** "변경 빈도가 높다"는 근거는 이번 사이클에서는 기각한다 — 문제는 변경 빈도가 아니라 코드를 읽을 때 여러 관심사를 동시에 이해해야 한다는 점(책임 응집도)이다.

## 기존 안전망 공백 (Fact)

- `PostCardDetailModal.tsx`를 겨냥한 테스트가 전혀 없다(`find ... -iname "*.test.*"` 결과 0건). #48에서 추가한 특성화 테스트(`PostCard.test.tsx`, `usePostReactions.test.ts`)는 이 파일을 직접 렌더링하지 않는다.
- 특히 UX 로그 수집(dwell 계산, 중복 방지 가드)과 반응형 라우팅 전환은 로직이 복잡한데도 안전망이 전혀 없다 — 이번 사이클에서 어떤 부분을 옮기든 특성화 테스트를 먼저 추가해야 한다(VIBR 기본 규칙 7).

## 기준선 검증 결과 (2026-07-20, 실제 저장소에서 실행)

| 명령               | 결과                                                                   |
| ------------------ | ---------------------------------------------------------------------- |
| `pnpm lint`        | **PASS** — 4/4 태스크 성공                                             |
| `pnpm check-types` | **PASS** — 3/3 태스크 성공                                             |
| `pnpm test`        | **PASS** — `api` 37개, `web` 14개(#48에서 추가된 것, 이 파일과는 무관) |
| `pnpm build`       | **PASS**                                                               |

기존에 실패하던 항목은 없다.

## 측정 지표

- `PostCardDetailModal.tsx` 관련 테스트: 0개
- 파일 길이: 396줄(`apps/web` 컴포넌트 중 최대, #48 이전과 동일 — 이번 사이클은 반응 상태 외 책임을 다룸)
- 이 파일이 직접 쓰는 서로 다른 훅/스토어 수: `useModalStore`, `usePlayerStore`, `usePostReactionOverridesStore`, `useAuthStore`, `useIsMobile`, `useScrollLock`, `usePostDetail`, `useLikedUsers`, `usePostReactions`, `useSwipeToDismiss`, `useRouter`, `usePathname` — 12개
- 변경 이력: 기능적 변경 커밋 0건(위 "수정 사항" 참고) — 측정 불가가 아니라 실제로 낮음

## Behavior Invariants

1. 모달은 `isOpen && modalType === POST_DETAIL`이고 `postId`가 있을 때만 렌더링된다. `postId`가 없으면 자동으로 닫힌다.
2. 모바일 뷰포트(`lg:hidden`)에서는 바텀시트, 데스크톱에서는 중앙 정렬 모달로 렌더링된다.
3. 데스크톱에서 모바일로 리사이즈되는 순간 모달이 `/profile/[id]` 페이지에서 열려 있었다면, 모달을 닫고 `/profile/{id}/posts?postId={postId}`로 라우팅한다. 그 외 페이지에서는 라우팅하지 않는다. 모바일→데스크톱 방향 전환이나 최초 마운트 시에는 이 라우팅이 발생하지 않는다.
4. 로그인 사용자가 모달이 열린 동안 이 게시글의 음악을 재생하면 재생 시간이 누적되고, 모달이 닫히거나(닫기 버튼/배경 클릭/스와이프) 언마운트될 때 dwell 시간·재생 곡 수·곡별 재생 시간을 담은 로그가 **정확히 한 번만** 전송된다.
5. 비로그인 사용자는 로그를 전송하지 않는다.
6. 게시글 소유자만 수정 버튼을 볼 수 있다. 수정 취소 시 원본 내용으로 되돌아간다. 저장 성공 시 토스트 표시 + 모달 내부 표시 갱신 + `usePostReactionOverridesStore.setContentOverride` 호출. 실패 시 에러 토스트가 뜨고 편집 모드는 유지된다.
7. "좋아요한 사용자" 오버레이는 버튼을 눌러야만 데이터 로딩이 시작된다(모달이 열리자마자 로드하지 않음).
8. 모바일 바텀시트는 스와이프-다운으로 닫을 수 있다.
9. 좋아요/댓글 표시·토글·폴링 동작(`usePostReactions`)은 이번 사이클에서 변경하지 않는다.
10. `@repo/dto`의 `Post` 관련 타입은 이번 리팩터링에서 변경하지 않는다.

## 다음 결정 필요 사항 (GATE 0 승인 후)

- 단계 1(비판적 구조 진단, `diagnosis.md`)로 진행하며, 위 8개 책임(모달 상태/반응 상태/본문수정/UX로그/라우팅전환/좋아요유저목록/재생트리거/스와이프) 중 이번 사이클에서 다룰 후보를 좁힙니다.
