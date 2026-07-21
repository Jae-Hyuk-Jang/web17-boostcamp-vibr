# Result — post-detail-modal-responsibility-decomposition

## 변경 요약

| 이슈              | 내용                                                                                                                                                                                                                                                                                                                                                                                               |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| #126              | 편집 시작/저장 성공·실패/취소, 리사이즈→라우팅 전환, 좋아요한 사용자 목록 열기 특성화 테스트 추가(착수 전 0건)                                                                                                                                                                                                                                                                                     |
| #127              | 재사용 가능한 인라인 편집 훅 `useInlineEditField<T>` 신설(제네릭, 도메인 무관) — 아직 미연결                                                                                                                                                                                                                                                                                                       |
| #128              | `usePostDetailModal` 오케스트레이션 훅 신설(데이터 4개 훅 조합, 플레이어 연동, 라우팅 전환, `useInlineEditField` 사용) — 아직 미연결. 구현 중 `PostCard.tsx`가 곧바로 편집 모드로 진입시키는 기존 동작을 지원하려면 `useInlineEditField`에 `initialSeed` 옵션이 필요하다는 게 드러나 추가                                                                                                          |
| #129              | `PostCardDetailModal`이 `usePostDetailModal`을 쓰도록 전환, 편집 UI를 `PostDetailEditForm` partial로 추출. JSX 구조는 건드리지 않음                                                                                                                                                                                                                                                                |
| #130              | 모바일/데스크탑 레이아웃을 `PostCardDetailModalMobileSheet`/`PostCardDetailModalDesktopShell`로 분리, `PostCardDetailModal.tsx`는 얇은 컨테이너로 축소                                                                                                                                                                                                                                             |
| #130(추가 다듬기) | GATE 3 초안 이후 사용자 리뷰로 발견된 인터페이스 다듬기 3건 — ① `MobileSheet`/`DesktopShell`의 `reactions` prop을 실제 사용 필드만 `Pick`으로 좁힘 ② `MobileSheet`의 `post: Post` 전체를 `nickname`/`content` 개별 prop으로 좁힘(DesktopShell은 `PostMedia`/`PostHeader`에 전체가 필요해 유지) ③ `LikedUsersOverlay`가 손으로 그리던 패널을 `ModalPanel`로 교체하고 단독 테스트 8개 추가(기존 0건) |
| #131              | 이 문서 작성 + 백로그 이슈 #132(스와이프 중복), #133(PlaylistDetailModal 편집 훅 전환) 등록                                                                                                                                                                                                                                                                                                        |

## Before / After

| 항목                                    | Before(prd.md 기준선)                                                             | After                                                                                                   |
| --------------------------------------- | --------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `PostCardDetailModal.tsx` 파일 길이     | 329줄(오케스트레이션+모바일/데스크탑 JSX 혼재)                                    | **69줄**(훅 호출 + 두 서브컴포넌트·`LikedUsersOverlay`에 props 분배만)                                  |
| 컴포넌트가 직접 떠안는 책임 수          | 7가지(모달 상태·반응 상태·본문수정·라우팅전환·좋아요유저목록·재생트리거·스와이프) | **1가지**(레이아웃 조립) — 나머지는 `usePostDetailModal`(오케스트레이션)과 두 서브컴포넌트(뷰)로 분리   |
| 편집 모드 로직                          | 컴포넌트 로컬 상태(재사용 불가)                                                   | `useInlineEditField<string>`(제네릭, 독립 파일, 향후 `PlaylistDetailModal` 전환 가능하도록 설계 — #133) |
| `PostCardDetailModal.test.tsx` 시나리오 | 8개(UX 로그만)                                                                    | **13개**(+ 편집 성공/실패/취소, 라우팅 전환, 좋아요한 사용자 목록)                                      |
| 신규 훅 단독 테스트                     | 해당 없음                                                                         | `useInlineEditField.test.ts` 7개, `usePostDetailModal.test.ts` 7개                                      |
| `LikedUsersOverlay` 단독 테스트         | 0건(기존에 테스트 없었음)                                                         | **8개**(추가 다듬기 과정에서 신규 작성)                                                                 |
| `pnpm test`(web)                        | 17 suites/73 tests                                                                | **20 suites/100 tests**                                                                                 |
| `pnpm lint`/`check-types`/`build`       | 전부 통과(cache hit)                                                              | 전부 통과                                                                                               |
| madge 순환참조                          | 3건(모두 `post`/`player`, 이번 변경과 무관)                                       | 3건(불변, backlog #96)                                                                                  |

## 개발환경 실동작 확인

- `packages/dto`는 변경하지 않아 `pnpm dto` 재빌드는 필요 없었다.
- 각 이슈(#129, #130) 완료 시점마다 `pnpm dev`로 `apps/web`을 기동해 컴파일 로그를 확인했다 — 홈페이지 200 응답, 콘솔에는 `apps/api` 미기동으로 인한 예상된 500 2건 외 런타임/모듈 로드 에러 없음. `ModalContainer`가 `app/layout.tsx`에 상시 마운트되어 `PostCardDetailModal`(및 그 안의 `usePostDetailModal`, 두 서브컴포넌트)이 초기 번들에 포함되므로, 이 확인만으로도 새 훅·컴포넌트 분리가 번들링·평가 단계에서 깨지지 않았음을 검증한다.
- `pnpm build` 정적 페이지 생성까지 정상 완료.
- **직접 확인하지 못한 부분**: 실제 게시글 상세 모달을 열어 편집/좋아요한사용자목록/리사이즈 전환을 시각적으로 조작하는 것은 이 샌드박스에 `apps/api`/인증/실제 게시글 데이터가 없어 확인하지 못했다. 대신 `PostCardDetailModal.test.tsx`(13개 시나리오, 실제 `usePostDetailModal`+두 서브컴포넌트 조합을 그대로 렌더링해 leaf partial만 mock)가 이 흐름들을 상세히 커버한다. 사용자가 로컬에서 `apps/api` 기동 후 편집·좋아요한사용자목록·모바일 리사이즈 전환을 한 번 확인해주면 좋다.

## Behavior Verification

prd.md의 Behavior Invariants 전부를 확인했다:

- ✅ `postId` 없으면 자동 닫힘, `isEnabled` 아니면 렌더 안 함 — `usePostDetailModal.test.ts`("postId가 없으면 모달을 자동으로 닫는다").
- ✅ 좋아요 토글/댓글 작성/좋아요한 사용자 목록 열기 — 기존 8개 UX 로그 테스트가 반응 관련 렌더링을 그대로 통과, `usePostDetailModal.test.ts`가 `useLikedUsers` 재호출을 검증.
- ✅ 편집 시작/저장/취소(2곳 캐시 동기화, 무시 조건, 실패 처리) — `PostCardDetailModal.test.tsx` 3개 시나리오 + `usePostDetailModal.test.ts`(`editing.commit` 성공 시 `updatePost`/`updatePostContent`/`setContentOverride` 전부 검증) + `useInlineEditField.test.ts`(상태머신 자체).
- ✅ 리사이즈 시 프로필 페이지에서 posts 피드로 전환 — `PostCardDetailModal.test.tsx`("리사이즈로 데스크탑→모바일 전환...").
- ✅ UX 로그 배선/emit — 기존 8개 시나리오 전부 리팩터링 후에도 동일하게 통과(코드 변경 없이 mock 대상만 유지).
- ✅ 재생 트리거 순서 — 기존 "모달에서 곡을 재생하면 playedMusicCount에 반영된다" 테스트 통과.
- ✅ 모바일 스와이프 닫기 — `useSwipeToDismiss`를 그대로 재사용(이번 사이클에서 이동/변경하지 않음).
- ✅ (뒤늦게 발견해 추가 보강) `PostCard.tsx`에서 곧바로 편집 모드로 진입하는 동작(`modalProps.initialIsEditing`) — `usePostDetailModal.test.ts`("modalProps.initialIsEditing이 true면...").

## Decision Review

adr.md에서 선택한 안 3(훅 분리 + JSX 분리)의 예상과 실제 비교:

- **예상**: 변경·회귀 범위가 크다(안 1/안 2 대비) → 실제로도 파일이 1개(329줄)에서 8개(`usePostDetailModal.ts`/`useInlineEditField.ts`/`PostCardDetailModal.tsx`/서브컴포넌트 2개/`PostDetailEditForm.tsx`+각 테스트)로 늘었지만, 체크포인트를 훅 전환(#129)과 JSX 분리(#130)로 나눠 각각 독립 커밋·독립 테스트 통과로 진행해 실제 구현 중 큰 충돌은 없었다.
- **예상하지 못했던 점 1**: `PostCard.tsx`가 `modalProps.initialIsEditing`으로 상세 모달을 곧바로 편집 모드로 여는 동작을 PRD/ADR 작성 시점에 놓쳤다 — `usePostDetailModal` 구현(#128) 중 원본 코드를 한 줄씩 옮기다가 발견했다. `useInlineEditField`에 `initialSeed` 옵션을 추가해 최초 렌더부터 편집 모드로 시작할 수 있게 했다(리렌더 1프레임 지연으로 인한 깜빡임 없이).
- **예상하지 못했던 점 2**: `PostHeader.onDeletePost`가 `handleClose`(UX 로그 emit 포함)가 아니라 raw `closeModal`(emit 없음)을 쓰는 미묘한 차이를 발견했다 — 삭제된 게시글의 UX 요약을 굳이 emit하지 않는 기존 의도로 보고 그대로 보존했다. `usePostDetailModal`이 `handleClose`와 `closeModal`을 둘 다 반환하도록 ADR에 없던 필드를 추가했다.
- **예상**: 테스트 mock 전략(`jest.mock('./partials', ...)`)이 JSX 분리(#130) 이후에도 그대로 유지될 것으로 가정하지 않았다 — 실제로는 leaf partial을 배럴이 아니라 개별 파일 단위로 mock하도록 바꿔야 했다(두 서브컴포넌트 자체는 실제 구현으로 렌더링해 props 배선을 검증하기 위해). 이 조정 덕분에 오히려 #130이 만든 새 서브컴포넌트 배선까지 특성화하는 더 견고한 테스트가 됐다.
- **GATE 3 초안 이후 사용자 리뷰로 추가된 검증** (모두 코드 변경 없이 답만 하고 넘어간 것과, 실제 다듬기로 이어진 것이 섞여 있다): `usePostDetail`/`usePostDetailModal` 병합 여부 검토(부모-자식 훅 관계로 결론, 병합 안 함) · `PostCardDetailModal`의 3개 자식 컴포넌트로의 props 분배가 prop drilling인지 검토(단일 홉 전달이라 해당 없음, 다만 `reactions`/`post` 과다 전달은 확인돼 실제로 좁힘) · `partials/` 폴더 전체에 걸친 prop drilling 재확인(추가로 발견된 것 없음).

## Remaining Debt

- `RightPanel.tsx`/`MobileNotiOverlay.tsx`의 스와이프 닫기 중복(발견했지만 범위 밖) — 백로그 #132.
- `PlaylistDetailModal.tsx`의 제목 편집 로직은 여전히 `useInlineEditField`를 쓰지 않는다(Post 전용 추출로 범위를 좁힘) — 백로그 #133.
- 스와이프다운 닫기 자동화 테스트는 이번 사이클에서도 추가하지 않았다(기존 `useSwipeToDismiss`를 건드리지 않아 회귀 위험 낮음, `mobile-queue-view-duplication`에서도 같은 이유로 보류됨).

## Follow-ups

- 별도로 다루지 않은 백로그: #96(저장소 전역 순환참조), #97(conventions.md 배럴 규칙 갱신), #98(하드 섀도 색상 통일), #100(Playwright CI 통합), #117(TrackItem/MusicPickerSearch 결과 행 레이아웃 공용화 검토), #124(서버 상태 캐싱 라이브러리 도입 재검토), #132(스와이프 중복 통합), #133(PlaylistDetailModal 편집 훅 전환).

---

**[GATE 3]** 위 Before/After, 개발환경 실동작 확인, Behavior Verification, 남은 부채를 확인해주시면 이 리팩터링 사이클을 종료하겠습니다.
