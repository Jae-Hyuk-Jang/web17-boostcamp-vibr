# PRD — post-detail-modal-responsibility-decomposition

## 문제 정의

`brief-original.md` 요약: `PostCardDetailModal.tsx`(329줄)가 모달 게이팅, 데이터 오케스트레이션(`usePostDetail`/`useLikedUsers`/`usePostReactions` 조합 + 낙관적 오버라이드 병합), 플레이어 연동, 리사이즈 시 라우팅 전환, 편집 모드 상태머신(인라인 UI 포함), UX 로그 배선, 스와이프 제스처, 모바일/데스크탑 두 레이아웃까지 한 컴포넌트에서 전부 처리한다.

왜 지금 다뤄야 하는가: 이 파일은 이미 한 번(`post-detail-modal-responsibility` 사이클, #41·#56~#58) 다뤄졌다 — 그때 UX 로그 부분(105줄)만 `usePostDetailUxLog`로 뽑아냈고, 나머지 후보(B: 라우팅 전환, C: 본문 편집, E: 전면 분리)는 YAGNI 근거로 보류하면서 그 result.md에 "다음에 이 컴포넌트를 다시 다룰 일이 생기면 재평가할 것"을 명시적으로 권장해뒀다. 사용자가 직접 "책임이 너무 많다"고 다시 지목했고, 이번 조사에서 후보 C를 보류했던 근거("이미 충분히 짧고 응집돼 있다")가 더 이상 유효하지 않다는 새 증거(PlaylistDetailModal과의 구조적 중복)를 확인했다 — 재평가 시점이 맞다.

## 비판적 진단 (시니어 개발자 시각)

### 근거

- **Fact** — 선행 사이클(`docs/refactors/post-detail-modal-responsibility/diagnosis.md`)이 이미 8가지 책임(모달 상태·반응 상태·본문수정·UX 로그·라우팅 전환·좋아요유저목록·재생트리거·스와이프)을 확인했고, UX 로그만 추출해 396→329줄이 됐다. 나머지 7가지는 그대로 남아있다.
- **Fact** — 편집 모드 상태머신(`isEditing`/`editedContent`/`isSaving`, `PostCardDetailModal.tsx:99-130`)과 인라인 textarea+버튼 UI(`265-288`)가 다른 관심사와 구분 없이 나열돼 있다. `PostDetailBody`/`PostDetailActions`/`PostDetailCommentComposer`/`LikedUsersOverlay`는 이미 `partials/`로 뽑혀 있는데 편집 UI만 예외다.
- **Fact** — `PlaylistDetailModal.tsx:114-149`의 제목 편집 로직(`isEditingTitle`/`draftTitle`/`startRename`/`commitRename`/`cancelRename`)이 구조적으로 거의 동일한 패턴을 쓴다: 시작(드래프트 시딩+모드 진입) → 로컬 드래프트 편집 → API 커밋(성공 시 로컬 상태 갱신+토스트+새로고침 트리거, 실패 시 토스트+콘솔에러) → 취소(드래프트 원복+모드 종료). 차이는 필드 타입(단일 라인 제목 vs 여러 줄 본문)과 부가 검증(`PlaylistDetailModal`은 `validateRename` 있음, `Post`는 없음)과 사후 동기화 대상(`Post`는 `usePostDetail.updatePostContent`+`usePostReactionOverridesStore.setContentOverride` 2곳, `Playlist`는 로컬 상태 1곳+refresh 스토어 bump)뿐이다.
- **Fact** — `ContentWriteModal`이 이미 `useContentWrite`라는 "오케스트레이션 훅이 상태+콜백을 플랫 객체로 반환하고 컴포넌트는 그 값을 그대로 렌더링만 한다"는 패턴의 선례를 갖고 있다. 다만 `useContentWrite`는 폼 상태 하나만 다루는 반면, `PostCardDetailModal`은 이미 존재하는 훅 4개(`usePostDetail`/`useLikedUsers`/`usePostReactions`/`usePostDetailUxLog`) + 플레이어 연동 + 라우팅 전환 + 편집 모드까지 조합해야 해서 "플랫 재작성"이 아니라 "기존 훅들을 한 단계 더 조합하는 상위 훅"이 필요하다.
- **Fact** — `PostCardDetailModal`은 이미 `useSwipeToDismiss`(공용 훅)를 정상적으로 재사용하고 있다(176행) — 이 부분은 이 파일 자체의 문제가 아니다.
- **Fact(부수 발견)** — `apps/web/src/components/player/RightPanel.tsx:103-111`과 `apps/web/src/components/layout/MobileNotiOverlay.tsx:85-114`가 각각 스와이프 닫기를 손으로 다시 구현하고 있다(전자는 스냅백/드래그 추적 없는 단순 80px 임계값 체크, 후자는 수평 방향 별도 구현). `useSwipeToDismiss`로 대체 가능해 보이지만, 이 컴포넌트들은 `PostCardDetailModal`과 직접적인 의존 관계가 없는 다른 도메인(플레이어, 알림)이라 이번 사이클의 "책임 분리" 문제와는 별개다.
- **Fact** — `usePostReactions`/`useLikedUsers`/`usePostDetail`은 전부 `PostCardDetailModal`이 유일한 소비처다(`PostCard.tsx` 등 피드 카드는 이 훅들을 쓰지 않음) — 오케스트레이션 방식을 바꿔도 다른 화면에 영향이 없다.

### 증상 → 원인 체인

증상: `PostCardDetailModal.tsx`를 수정하려면 서로 무관한 7가지 관심사를 동시에 이해해야 한다.
→ (왜?) 선행 사이클에서 UX 로그(가장 크고 명확한 덩어리) 하나만 추출하고, 나머지는 "이미 충분히 짧다"는 이유로 각각 개별적으로는 추출할 가치가 낮다고 판단했다.
→ (왜?) 그 판단은 각 후보를 "이 파일 안에서 단독으로 봤을 때" 평가한 것이라, 파일 밖의 중복(PlaylistDetailModal의 편집 로직)이나 "여러 개를 한꺼번에 컨테이너 훅으로 뽑으면 전체 파일이 얇아진다"는 누적 효과는 고려 대상이 아니었다.
→ 구조 원인: 개별 관심사는 각각 작아도, "이 컴포넌트가 UI 조합과 무관한 것들을 전부 떠안는다"는 경계 부재 자체가 근본 원인이며, 그 경계는 각 후보를 낱개로 평가해서는 드러나지 않고 전체를 한 번에 다시 봐야 드러난다.

### 아키텍처 관점

- **국지적인가 반복 패턴인가**: 이 세션에서 반복 확인된 "재사용 지점을 못 찾아서 중복 구현" 패턴과 같은 계열이다 — 이번엔 컴포넌트 밖 재사용(PlaylistDetailModal)과 컴포넌트 내부 책임 응집(오케스트레이션) 두 층위가 겹쳐 있다.
- **기존 컨벤션과 충돌하는가**: `ContentWriteModal`의 오케스트레이션 훅 패턴이 이미 컨벤션으로 자리 잡아가고 있는데, `PostCardDetailModal`만 아직 그 패턴을 안 따르고 있다.
- **전제가 깨진 결정인가**: 선행 사이클의 후보 B·C 보류 결정 중, B(라우팅 전환)는 여전히 유효해 보인다(새 증거 없음). C(편집 로직)는 "PlaylistDetailModal과 구조가 겹친다"는 새 사실이 확인돼 전제가 바뀌었다.

### 비판적 재검토 (사용자 문제 제기에 대한 반박 질문과 답)

- **이 증상이 정말 구조 문제인가, 우연인가?** 구조 문제다. 8가지 책임 중 하나(UX 로그)만 추출했는데도 여전히 "너무 많다"는 지적이 다시 나온 것 자체가, 남은 7가지도 실질적인 부담이라는 근거다.
- **안 고치면 다음 몇 번의 변경에서 무슨 비용이 드는가?** 편집 로직을 고칠 일이 생기면 PlaylistDetailModal의 비슷한 로직도 따로 손봐야 한다는 걸 모르고 지나칠 수 있다(지금 이 조사로 처음 드러남). 라우팅 전환/플레이어 연동 로직에 버그가 생기면 편집·반응 상태 코드까지 다 읽어야 원인을 좁힐 수 있다.
- **더 급한 다른 문제를 가리는 건 아닌가?** 아니다 — 선행 사이클이 이미 "다음에 재평가하라"고 명시적으로 남겨둔 항목이라 순서상 자연스럽다.
- **후보 B(라우팅 전환)를 이번에도 보류해야 하나?** 아니다 — 이번엔 다른 오케스트레이션 로직들과 함께 상위 훅으로 묶여 나가므로 "따로 추출할 가치가 있는가"가 아니라 "어차피 나머지를 다 옮기는데 22줄만 남겨두는 게 더 어색한가"의 문제가 됐다. Goal에 포함한다.

### 후보 우선순위

| 후보                 | 선행 사이클 판정 | 이번 재평가                                                  | 이번 사이클 범위                                    |
| -------------------- | ---------------- | ------------------------------------------------------------ | --------------------------------------------------- |
| A(UX 로그)           | 완료             | 재작업 안 함                                                 | Out of Scope                                        |
| B(라우팅 전환)       | 보류(YAGNI)      | 새 증거 없음, 다만 나머지와 함께 묶어 추출하는 게 자연스러움 | 포함(오케스트레이션 훅에 통합)                      |
| C(편집 로직)         | 보류(YAGNI)      | **전제 변화** — PlaylistDetailModal과 구조 중복 확인         | 포함(Post 전용 훅으로 재평가, 목표 인터뷰에서 확정) |
| E(전면 분리)         | 범위 밖 명시     | 지금이 그 "다시 다룰 시점"                                   | 이번 사이클의 핵심 목표                             |
| (신규) 스와이프 중복 | 해당 없음        | RightPanel/MobileNotiOverlay에서 발견                        | 별도 백로그(목표 인터뷰에서 확정)                   |

## 목표와 범위

### 목표 인터뷰 로그

**Q1. 이전 사이클이 보류했던 후보 C(본문 편집 로직 훅 추출)를 다시 꺼내는 이유는 PlaylistDetailModal의 제목 편집 로직과 구조가 거의 같기 때문입니다. 이번 훅 추출 범위를 어디까지 잡을까요?**
A. **Post 전용으로만 추출** — 이번 사이클은 `PostCardDetailModal`의 책임 분리에만 집중한다. 훅은 재사용 가능한 형태(제네릭 필드 타입, API 커밋 콜백 주입)로 설계하지만, `PlaylistDetailModal`을 지금 함께 전환하지는 않는다는 이유로 선택. `PlaylistDetailModal`은 이미 완료된 다른 사이클의 산출물이라, 지금 같이 건드리면 이번 사이클 범위가 두 배로 늘고 서로 다른 모달 2개의 동작을 동시에 보존해야 해 위험이 커진다. 전환은 훅이 준비된 다음 별도 이슈로 다룰 수 있다.

**Q2. PostCardDetailModal은 이미 `useSwipeToDismiss`를 쓰고 있어 문제가 없지만, 조사 중 `RightPanel.tsx`와 `MobileNotiOverlay.tsx`가 각자 손으로 스와이프 닫기를 다시 구현한 걸 발견했습니다. 이 발견을 이번 사이클에 포함할까요?**
A. **별도 백로그 이슈로 분리** — `PostCardDetailModal` 자신의 책임 문제와는 무관한, 완전히 다른 컴포넌트(플레이어/알림)의 중복이다. 지금 끼워넣으면 이번 사이클의 진단 범위("이 파일이 너무 많은 책임을 진다")를 벗어나 서로 다른 도메인 3곳을 동시에 바꾸게 돼 위험이 커진다는 이유로 선택. #96, #98, #117처럼 라벨 붙여 백로그 이슈로 등록해두고 별도 사이클에서 다룬다.

**Q3(확정 질문). 아래 Goal / Behavior Invariants / Success Criteria / Out of Scope로 확정할까요?**
A. **이대로 확정** — 코드와 이전 사이클 기록으로 직접 검증한 사실 기반이라 추가 조정 없이 승인.

### Goal

`PostCardDetailModal`의 오케스트레이션 책임(데이터 페칭 조합, 플레이어 연동, 리사이즈 시 라우팅 전환, 편집 모드 상태머신)을 컴포넌트 밖으로 분리한다. 구체적으로 훅을 몇 개로 나눌지, 모바일/데스크탑 JSX까지 서브컴포넌트로 쪼갤지는 ADR에서 3안을 비교해 결정한다.

### Success Criteria

- 오케스트레이션 로직이 별도 훅(들)로 추출된다.
- 편집 모드 훅은 `PlaylistDetailModal`에 강제 적용하지 않되, 향후 재사용 가능하게 설계한다(필드 타입 파라미터화, API 커밋 콜백 주입).
- 기존 `PostCardDetailModal.test.tsx`(8개 시나리오)가 리팩터링 후에도 그대로 통과한다.
- 새 훅(들)에 대한 단독 유닛 테스트가 추가된다.
- `pnpm lint`/`check-types`/`test`/`build` 전부 통과한다.

### Out of Scope

- `PlaylistDetailModal` 자체 수정(편집 훅 공유는 이번에 하지 않음, 후속 사이클 후보로 남김).
- `RightPanel`/`MobileNotiOverlay`의 스와이프 로직 교체(별도 백로그).
- `usePostDetailUxLog` 재수정(선행 사이클 산출물, 그대로 유지).
- `usePostReactions`/`useLikedUsers`/`usePostDetail` 내부 구현 변경(조합 방식만 이동, 각 훅 자체는 안 건드림).
- 새 라이브러리 도입.

### Behavior Invariants

- `postId`가 없으면 자동으로 모달이 닫히고, `isEnabled`가 아니면 아무것도 렌더링하지 않는다.
- 좋아요 토글/댓글 작성/좋아요한 사용자 목록 열기 동작은 변경되지 않는다.
- 편집 시작/저장/취소 동작 — 저장 시 `postId`가 없거나 저장 중이거나 내용 변경이 없으면 무시하고, 성공 시 `usePostDetail.updatePostContent`와 `usePostReactionOverridesStore.setContentOverride`를 둘 다 갱신하며, 실패 시 토스트+콘솔 에러를 남기는 동작은 유지된다.
- 리사이즈로 데스크탑→모바일 전환 시, 프로필 페이지에서 열린 모달이면 `/profile/[id]/posts?postId=` 경로로 전환되는 동작은 유지된다.
- `usePostDetailUxLog` 배선과 닫기/언마운트 시 `emit` 호출은 변경되지 않는다.
- 재생 트리거(`recordPlayedMusic` 호출 순서 — 재생 전에 기록)는 유지된다.
- 모바일 바텀시트를 `useSwipeToDismiss`로 스와이프해 닫는 동작은 유지된다.

## 기준선 검증

| 명령               | 결과 | 실패 항목 | 비고                                                          |
| ------------------ | ---- | --------- | ------------------------------------------------------------- |
| `pnpm lint`        | 통과 | 없음      | 4/4 태스크, 전부 cache hit                                    |
| `pnpm check-types` | 통과 | 없음      | 3/3 태스크, 전부 cache hit                                    |
| `pnpm test`        | 통과 | 없음      | web 17 suites/73 tests, api 8 suites/37 tests, 전부 cache hit |
| `pnpm build`       | 통과 | 없음      | 3/3 태스크, 전부 cache hit                                    |

측정 지표:

- `PostCardDetailModal.tsx`: 329줄(오케스트레이션+마모바일/데스크탑 JSX 혼재).
- `PostCardDetailModal.test.tsx`: 8개 시나리오(선행 사이클 산출물, 회귀 안전망으로 그대로 활용).
- 편집 모드 코드: 상태 3개+핸들러 3개+인라인 UI 24줄 = `PostCardDetailModal.tsx`의 약 60줄.
- 라우팅 전환 코드: 22줄(75-96행).
- `PlaylistDetailModal.tsx`의 구조적으로 유사한 편집 로직: 상태 3개+핸들러 3개+검증 1개 = 약 40줄(이번 사이클에서 건드리지 않지만 참고 자료로 활용).

---

**[GATE 1]** 위 진단·목표·범위·Behavior Invariants·기준선을 확인해주시면 ADR 단계로 넘어가겠습니다.
