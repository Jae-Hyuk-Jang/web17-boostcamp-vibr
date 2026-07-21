# ADR — post-detail-modal-responsibility-decomposition

## 3안 비교

### 안 1 — 최소 개선안 (통합 훅 1개, JSX 유지)

오케스트레이션 로직(데이터+플레이어+라우팅+편집)을 전부 `usePostDetailModal` 훅 하나에 인라인으로 담는다. 편집 로직을 별도의 재사용 가능한 훅으로 분리하지 않는다. 편집 UI만 `partials/PostDetailEditForm.tsx`로 추출. 모바일/데스크탑 JSX는 그대로 `PostCardDetailModal.tsx`에 유지.

### 안 2 — 경계 재설계안 (훅만 분리, JSX 유지)

편집 로직을 제네릭 재사용 가능한 훅 `useInlineEditField`로 독립시키고, 나머지(데이터 조합+플레이어+라우팅)를 `usePostDetailModal` 오케스트레이션 훅으로 모은다(내부에서 `useInlineEditField`를 사용). 편집 UI는 partial로 추출. 모바일/데스크탑 JSX는 `PostCardDetailModal.tsx`에 그대로 유지.

### 안 3 — 검증된 도구 도입안 (훅 분리 + JSX 분리, 채택)

안 2와 동일하게 훅을 분리하고, 추가로 모바일/데스크탑 JSX도 `PostCardDetailModalMobileSheet.tsx`/`PostCardDetailModalDesktopShell.tsx` 서브컴포넌트로 분리한다. `PostCardDetailModal.tsx`는 `usePostDetailModal()`을 호출해 얻은 데이터를 두 서브컴포넌트(+`LikedUsersOverlay`)에 나눠주는 얇은 컨테이너가 된다.

## 비교표 (10개 고정 기준)

| #   | 기준                 | 안 1                                                      | 안 2                                         | 안 3                                                                                                                                   |
| --- | -------------------- | --------------------------------------------------------- | -------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | 근본 원인 해결력     | 중간 — 로직은 컴포넌트 밖으로 나가지만 재사용성 기준 미달 | 높음 — Success Criteria 완전 충족            | 매우 높음 — 로직·뷰 둘 다 분해                                                                                                         |
| 2   | 동작 보존 난이도     | 쉬움                                                      | 쉬움~중간                                    | 어려움 — 모바일/데스크탑 각각 독립 컴포넌트로 옮기며 props 경계 새로 설계, 회귀 표면 2배                                               |
| 3   | 책임·의존성 변화     | 작음                                                      | 명확(편집=독립 훅, 나머지=오케스트레이션 훅) | 큼(파일 4개로 분산: 훅 2개+뷰 2개)                                                                                                     |
| 4   | 테스트 용이성        | 중간                                                      | 높음 — 편집 훅 독립 유닛테스트 가능          | 높음 — 뷰별 독립 테스트도 가능하나 설계 비용 큼                                                                                        |
| 5   | 변경 범위            | 작음                                                      | 중간                                         | 큼                                                                                                                                     |
| 6   | 점진적 전환 가능성   | 쉬움(한 번에)                                             | 가능(훅부터)                                 | 가능(훅 → JSX 순서로 단계 분리)                                                                                                        |
| 7   | 롤백 가능성          | 쉬움                                                      | 쉬움                                         | 쉬움(단, 커밋 수가 많아 부분 롤백 시 순서 주의 필요)                                                                                   |
| 8   | 성능·운영 영향       | 미미                                                      | 미미                                         | 미미                                                                                                                                   |
| 9   | 기존 코드와의 일관성 | `useContentWrite`보다도 응집도 낮음(재사용형 훅 없음)     | `useContentWrite` 패턴의 확장판              | 이 저장소에 전례 없는 "모달 1개 = 파일 여러 개" 패턴 신규 도입(다른 모달은 전부 단일 파일+`partials/`만 있고 뷰 자체를 쪼갠 전례 없음) |
| 10  | 유지 비용            | 중간                                                      | 낮음                                         | 낮음(파일 수 증가로 탐색 비용은 약간 늘 수 있음)                                                                                       |

## 라이브러리 도입 심사

**Q. 이번 사이클에서 TanStack Query 도입은 부적절한가?**
A. 도입하지 않는다. `CLAUDE.md`의 "서버 상태 캐싱 라이브러리 미도입" 항목은 금지 규칙이 아니라 프로젝트 초기 파악 시점의 현재 상태 기록임을 사용자가 확인해줬다 — 그래서 이 결정은 그 문서를 근거로 삼지 않고, 순수하게 이번 사이클의 기술적 적합성만으로 판단한다:

1. 이번 사이클이 진단한 문제(오케스트레이션 책임이 컴포넌트에 뭉쳐 있음)는 캐싱/재검증 부재가 원인이 아니다. TanStack Query를 넣어도 반응 상태·플레이어 연동·라우팅 전환·편집 모드를 조합하는 오케스트레이션 훅 자체는 여전히 필요해서, 근본 원인 해결에 기여하지 않는다.
2. PRD Out of Scope(`usePostDetail`/`useLikedUsers`/`usePostReactions` 내부 구현 변경 금지)를 정면으로 건드리고, `usePostReactionOverridesStore`(zustand, 피드-상세모달 간 낙관적 업데이트 동기화)와의 관계까지 재설계해야 해서 범위가 이 사이클(컴포넌트 책임 분리)을 훨씬 벗어난다.
3. `tailwind-merge` 사례처럼 구현 중 실제로 막힌 구체적 문제가 있었던 것도 아니다 — 지금은 순수히 사전 검토 단계라 강한 도입 근거가 없다.

**후속 조치**: 저장소 전역에 서버 상태 캐싱 라이브러리를 도입할 가치가 있는지는 별도 백로그 이슈(#124)로 남긴다 — `usePostReactionOverridesStore`처럼 서버 상태 동기화를 수동으로 짜맞추는 사례가 반복되는지, 그게 실제 비용을 만드는지 데이터를 모은 뒤 근거가 쌓이면 별도 PRD/ADR로 다룬다. 이번 사이클에서는 도입하지 않는다.

## 의사결정 인터뷰 로그

**Q. 편집 로직을 재사용 가능한 별도 훅(`useInlineEditField`)으로 뽑고 나머지를 `usePostDetailModal` 오케스트레이션 훅으로 모으는 건 공통입니다. 마지막 변수는 모바일/데스크탑 JSX도 별도 서브컴포넌트로 분리할지입니다. 어느 쪽을 택할까요?**
A. 안 3 — 훅 + JSX 둘 다 분리. 이유: "책임이 너무 많다"는 진단을 가장 철저하게 해결하는 방향을 선택. 이 저장소에 전례 없는 패턴(모달 1개=파일 여러 개)을 새로 도입하고 변경·회귀 범위가 커진다는 점은 감수하고, 체크포인트 이슈를 훅 분리 → JSX 분리 순서로 나눠 단계별로 안전하게 진행하기로 함.

## 선택: 안 3

비교표 기준 1(근본 원인 해결력)에서 가장 철저하고, 사용자가 명시적으로 더 큰 변경 범위를 감수하기로 선택했다. 대신 기준 2(동작 보존 난이도)의 위험은 체크포인트를 훅 분리(3~4단계)와 JSX 분리(5단계)로 나눠 각 단계마다 회귀 안전망을 통과시키는 방식으로 관리한다.

## ADR 본문

### Context

`PostCardDetailModal.tsx`(329줄)가 모달 게이팅·데이터 오케스트레이션·플레이어 연동·라우팅 전환·편집 모드·모바일/데스크탑 두 레이아웃까지 전부 담당한다. 선행 사이클(`post-detail-modal-responsibility`, #41)이 UX 로그만 추출하고 나머지는 YAGNI로 보류했는데, 이번에 편집 로직이 `PlaylistDetailModal`과 구조적으로 중복된다는 새 증거가 확인되며 재평가 시점이 됐다.

### Decision

**1. `useInlineEditField<T>` 신설** (`apps/web/src/hooks/useInlineEditField.ts`, 도메인 무관 공용 훅 — `hooks/` 최상위):

```ts
interface UseInlineEditFieldOptions<T> {
  onCommit: (next: T) => Promise<void>;
  isNoOpChange?: (next: T, current: T) => boolean; // 기본: next === current
}

interface UseInlineEditFieldResult<T> {
  isEditing: boolean;
  draft: T;
  isSaving: boolean;
  startEdit: (seed: T) => void;
  setDraft: (next: T) => void;
  commit: (current: T) => Promise<void>;
  cancel: (current: T) => void;
}
```

`PostCardDetailModal`의 `isEditing`/`editedContent`/`isSaving`/`handleStartEdit`/`handleSave`/`handleCancelEdit`(99~130행)를 그대로 이 훅으로 옮긴다. `PlaylistDetailModal`의 `validateRename` 같은 부가 검증은 이번엔 추가하지 않는다(YAGNI — Post는 검증이 없고, Playlist 전환은 Out of Scope). `PlaylistDetailModal` 전환은 이 훅이 실제로 두 번째 소비처를 얻는 시점(별도 이슈)에 필요한 옵션을 그때 추가한다.

**2. `usePostDetailModal` 신설** (`apps/web/src/hooks/post/usePostDetailModal.ts`):

기존 `usePostDetail`/`useLikedUsers`/`usePostReactions`/`usePostDetailUxLog`를 내부에서 조합하고, 플레이어 연동(`usePlayerStore` 구독+`handlePlayFromPost`/`handlePlayAll`)과 리사이즈→라우팅 전환 이펙트(75~96행), `useInlineEditField<string>` 인스턴스(콘텐츠 편집용)를 함께 묶는다. 반환값은 가독성을 위해 성격별로 묶어서 반환한다(플랫 20개 필드 대신 네임스페이스):

```ts
interface UsePostDetailModalResult {
  isEnabled: boolean;
  postId: string | undefined;
  safePost: Post;
  isLoading: boolean;
  error: string | null;
  isOwner: boolean;
  profileImg: string;

  reactions: ReturnType<typeof usePostReactions>;
  likedUsers: { isOpen: boolean; open: () => void; close: () => void } & ReturnType<typeof useLikedUsers>;
  editing: UseInlineEditFieldResult<string>;

  player: {
    currentMusicId: string | null;
    isPlaying: boolean;
    handlePlayFromPost: (m: Music) => void;
    handlePlayAll: () => void;
  };

  handleClose: () => void;
  handleUserClick: (targetUserId: string) => void;
}
```

`useScrollLock(isEnabled)`과 `postId` 없을 때 자동 닫힘 이펙트도 이 훅으로 옮긴다. `useSwipeToDismiss`는 옮기지 않는다(Fact: 이미 정상적으로 재사용되는 부분이라 이 사이클의 대상이 아님) — `sheetRef` 등은 컴포넌트가 계속 직접 호출해 JSX에 붙인다.

**3. 컴포넌트 3분할**:

- `PostCardDetailModal.tsx` — `usePostDetailModal()` + `useSwipeToDismiss()` 호출, 조기 반환(`!isEnabled`), 두 서브컴포넌트에 필요한 slice를 props로 전달하는 얇은 컨테이너.
- `partials/PostCardDetailModalMobileSheet.tsx` — 기존 187~228행(모바일 바텀시트) 그대로 이동.
- `partials/PostCardDetailModalDesktopShell.tsx` — 기존 231~317행(데스크탑 `ModalShell`) 그대로 이동. 편집 모드 UI(265~288행)는 여기서 다시 `partials/PostDetailEditForm.tsx`로 한 번 더 추출한다(데스크탑 전용이므로).
- `LikedUsersOverlay` 렌더링은 `PostCardDetailModal.tsx`에 남긴다(모바일/데스크탑 공통).

두 레이아웃은 현재도 항상 동시에 DOM에 존재하고 Tailwind 반응형 클래스(`lg:hidden`/`hidden lg:flex`)로만 표시 여부가 갈리므로, 서브컴포넌트로 나눠도 이 렌더링 방식(조건부 마운트 아님)은 그대로 유지한다.

### Alternatives

- 안 1(통합 훅 1개): 편집 로직이 재사용 가능한 독립 단위가 아니게 되어 Success Criteria(편집 훅의 향후 재사용성)를 충족하지 못해 기각.
- 안 2(훅만 분리): 안 3보다 안전하지만, 사용자가 "책임이 너무 많다"는 원 진단을 뷰 레벨까지 철저히 해결하는 쪽을 선택해 기각(다만 안 3의 4단계까지만 하고 5단계를 별도 사이클로 미루면 사실상 안 2와 같은 중간 지점에서 멈출 수 있다 — 아래 Rollback 참고).

### Consequences

- 장점: `PostCardDetailModal.tsx`가 오케스트레이션 조합 로직과 두 레이아웃 마크업을 모두 떠안는 상태에서 벗어나, 각 파일이 "무슨 훅을 조합하는가"(`usePostDetailModal`), "모바일에서 어떻게 보이는가"(`MobileSheet`), "데스크탑에서 어떻게 보이는가"(`DesktopShell`) 중 하나만 책임진다.
- 단점: 파일 수가 늘어(1개→최소 5개: 훅 2개+뷰 2개+partial 1개) 이 컴포넌트를 처음 보는 사람이 전체 흐름을 파악하려면 여러 파일을 오가야 한다.
- 새 위험: 두 서브컴포넌트가 `usePostDetailModal`의 반환값을 어떻게 나눠 받을지(예: `editing`을 데스크탑에만 넘길지, 모바일에도 필요한지) props 설계를 잘못하면 한쪽 레이아웃에서만 동작이 깨질 수 있다 — 각 서브컴포넌트 분리 시점에 기존 특성화 테스트(모바일/데스크탑 각각)가 통과하는지 반드시 확인한다.

### Migration

1. 편집 모드·라우팅 전환·좋아요한 사용자 목록의 특성화 테스트를 먼저 추가한다(현재 미커버, 구조 변경 없음).
2. `useInlineEditField` 신설(아직 미연결) + 단독 테스트.
3. `usePostDetailModal` 신설(아직 미연결) + 단독 테스트.
4. `PostCardDetailModal.tsx`가 `usePostDetailModal`을 쓰도록 전환(인라인 오케스트레이션 코드 제거), 편집 UI를 `PostDetailEditForm` partial로 추출. **이 시점에는 JSX 구조(모바일/데스크탑 인라인)는 그대로 둔다** — 로직 교체와 뷰 분리를 같은 커밋에서 섞지 않는다.
5. 모바일/데스크탑 JSX를 `PostCardDetailModalMobileSheet`/`PostCardDetailModalDesktopShell`로 분리.
6. 결과 검증 및 문서화.

### Rollback

각 체크포인트는 독립 커밋이다. 4단계까지만 진행하고 5단계에서 문제가 발견되면, 5단계만 되돌려 "훅은 분리됐지만 JSX는 통합된" 상태(사실상 안 2와 동일)로 안전하게 멈출 수 있다 — 이것이 안 3을 선택하면서도 안 2를 사실상의 폴백으로 확보해두는 방법이다.

## 회귀 안전망

### 테스트 우선순위

1. **Characterization** — 기존 `PostCardDetailModal.test.tsx`(8개)는 전부 UX 로그만 다룬다. 편집 시작/저장(성공+실패)/취소, 리사이즈→라우팅 전환, 좋아요한 사용자 목록 열기는 현재 테스트가 0건이다 — 리팩터링 전에 먼저 고정한다.
2. **Contract** — `useInlineEditField`가 `startEdit`으로 시딩한 draft를 유지하고, `commit` 성공/실패 시 `isSaving`이 올바르게 전이하며, `isNoOpChange`일 때 API를 호출하지 않는지 검증. `usePostDetailModal`이 기존 4개 훅(`usePostDetail` 등)을 올바른 인자로 호출하는지 검증.
3. **State-transition** — 편집 훅의 `idle → editing → saving → idle`(성공) / `saving → editing`(실패) 전이.
4. **Integration** — 기존 8개 + 신규 특성화 테스트가 4단계(훅 전환)와 5단계(JSX 분리) 각각의 커밋 이후에도 통과.
5. **E2E** — PRD에 명시하지 않음, Out of Scope로 간주.

### 회귀 시나리오

| 시나리오                                        | 기존 결과                                                                                                                     | 검증 수준        | 실패 시 조치 |
| ----------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- | ---------------- | ------------ |
| 편집 시작→저장 성공                             | `usePostDetail.updatePostContent` + `usePostReactionOverridesStore.setContentOverride` 둘 다 갱신, 토스트 성공, 편집모드 종료 | Characterization | 구현 중단    |
| 편집 저장 실패(API 에러)                        | 토스트 에러+콘솔에러, 편집모드 유지(`isEditing` 그대로)                                                                       | Characterization | 구현 중단    |
| 편집 취소                                       | draft가 원본으로 복귀, 편집모드 종료                                                                                          | Characterization | 구현 중단    |
| 저장 중 내용 변경 없음                          | API 호출 안 함(no-op)                                                                                                         | Contract         | 구현 중단    |
| 리사이즈로 모바일 전환(+프로필 페이지에서 열림) | 모달 닫히고 `/profile/[id]/posts?postId=` 이동                                                                                | Characterization | 구현 중단    |
| 좋아요한 사용자 목록 열기                       | `LikedUsersOverlay`가 열리고 `useLikedUsers` fetch 트리거                                                                     | Characterization | 구현 중단    |
| 기존 UX 로그 8개 시나리오                       | 변경 없음                                                                                                                     | Integration      | 구현 중단    |

## 체크포인트 이슈 목록

### 이슈 1 — 편집/라우팅전환/좋아요한사용자목록 특성화 테스트 추가

# 목적

리팩터링 대상이 될 로직 중 현재 테스트가 없는 부분(편집 모드, 라우팅 전환, 좋아요한 사용자 목록)을 먼저 고정해 안전망을 확보한다.

## Scope

- `PostCardDetailModal.test.tsx`에 시나리오 추가(기존 8개는 그대로 유지)

## Out of Scope

- 구조 변경 없음

## Behavior Invariants

- prd.md의 Behavior Invariants 전체

## Acceptance Criteria

- [ ] 편집 시작→저장 성공/실패/취소 3가지 시나리오
- [ ] 리사이즈 시 프로필 페이지에서 열린 모달이 posts 피드로 전환되는 시나리오
- [ ] 좋아요한 사용자 목록 열기 시나리오

## Verification

- [ ] `pnpm test -- PostCardDetailModal`

## Rollback

- 테스트 추가만이므로 삭제만으로 되돌릴 수 있다.

## Dependency

- 없음(선행 이슈)

---

### 이슈 2 — `useInlineEditField` 제네릭 훅 신설

# 목적

편집 모드 상태머신을 재사용 가능한 독립 훅으로 만들어, 이후 `PostCardDetailModal` 전환과 향후 `PlaylistDetailModal` 전환(별도 이슈) 양쪽에서 쓸 수 있는 기반을 마련한다.

## Scope

- `apps/web/src/hooks/useInlineEditField.ts`, `useInlineEditField.test.ts` 신설

## Out of Scope

- 어떤 컴포넌트도 아직 이 훅을 쓰지 않음(다음 이슈에서 연결)

## Behavior Invariants

- 해당 없음(신규 코드)

## Acceptance Criteria

- [ ] `startEdit(seed)` 호출 시 `isEditing=true`, `draft=seed`
- [ ] `commit` 성공 시 `isSaving`이 `true→false`로 전이하고 `isEditing=false`
- [ ] `commit` 실패 시 `isEditing`이 유지되고 에러가 호출부로 전파(호출부가 토스트 처리)
- [ ] `cancel` 시 `isEditing=false`, `draft`는 호출부가 넘긴 `current`로 복귀

## Verification

- [ ] `pnpm test -- useInlineEditField`, `pnpm lint`, `pnpm check-types`

## Rollback

- 신규 파일만 추가되므로 삭제만으로 되돌릴 수 있다.

## Dependency

- 선행: 이슈 1

---

### 이슈 3 — `usePostDetailModal` 오케스트레이션 훅 신설

# 목적

데이터 조합·플레이어 연동·라우팅 전환·편집(useInlineEditField 사용)을 하나의 훅으로 모아, `PostCardDetailModal`이 다음 이슈에서 이 훅 하나만 호출하면 되게 만든다.

## Scope

- `apps/web/src/hooks/post/usePostDetailModal.ts`, `usePostDetailModal.test.ts` 신설

## Out of Scope

- `PostCardDetailModal.tsx`는 아직 이 훅을 쓰지 않음(다음 이슈)
- `useSwipeToDismiss`는 옮기지 않음

## Behavior Invariants

- ADR Decision 2번 항목에 정의된 반환 형태

## Acceptance Criteria

- [ ] `usePostDetail`/`useLikedUsers`/`usePostReactions`/`usePostDetailUxLog`를 기존과 동일한 인자로 호출
- [ ] 리사이즈→라우팅 전환 로직이 기존과 동일하게 동작(라우터 mock으로 검증)
- [ ] `editing` 필드가 `useInlineEditField` 인스턴스를 올바르게 반환

## Verification

- [ ] `pnpm test -- usePostDetailModal`, `pnpm lint`, `pnpm check-types`

## Rollback

- 신규 파일만 추가되므로 삭제만으로 되돌릴 수 있다.

## Dependency

- 선행: 이슈 2

---

### 이슈 4 — `PostCardDetailModal`이 `usePostDetailModal`을 쓰도록 전환

# 목적

컴포넌트 본문의 인라인 오케스트레이션 코드를 제거하고 훅 호출로 교체한다. JSX 구조(모바일/데스크탑 인라인)는 이 단계에서 건드리지 않는다.

## Scope

- `PostCardDetailModal.tsx`: 인라인 상태/이펙트 제거, `usePostDetailModal()` 호출로 교체
- `partials/PostDetailEditForm.tsx` 신설(편집 UI, 265~288행 이동)

## Out of Scope

- 모바일/데스크탑 JSX를 서브컴포넌트로 쪼개는 것(다음 이슈)

## Behavior Invariants

- prd.md의 Behavior Invariants 전체

## Acceptance Criteria

- [ ] 기존 `PostCardDetailModal.test.tsx`(이슈 1까지 포함) 전부 통과
- [ ] `pnpm dev`로 편집/좋아요/댓글/좋아요한사용자목록/리사이즈 전환 직접 확인

## Verification

- [ ] `pnpm test -- PostCardDetailModal`, `pnpm lint`, `pnpm check-types`, `pnpm build`

## Rollback

- 이 커밋만 revert하면 인라인 오케스트레이션 코드로 복구된다(이슈 2·3의 신규 훅 파일은 아직 미연결 상태라 영향 없음).

## Dependency

- 선행: 이슈 3

---

### 이슈 5 — 모바일/데스크탑 JSX를 서브컴포넌트로 분리

# 목적

`PostCardDetailModal.tsx`를 훅 호출+데이터 분배만 하는 얇은 컨테이너로 만들고, 두 레이아웃을 각각 독립 파일로 분리한다.

## Scope

- `partials/PostCardDetailModalMobileSheet.tsx`(187~228행 이동)
- `partials/PostCardDetailModalDesktopShell.tsx`(231~317행 이동, `PostDetailEditForm` 소비)
- `PostCardDetailModal.tsx`: 두 서브컴포넌트+`LikedUsersOverlay`만 렌더링

## Out of Scope

- 두 레이아웃이 항상 동시에 DOM에 존재하고 CSS로만 전환되는 현재 방식(조건부 마운트 아님) 자체는 변경하지 않음

## Behavior Invariants

- prd.md의 Behavior Invariants 전체

## Acceptance Criteria

- [ ] 이슈 1~4에서 쌓인 모든 테스트가 통과
- [ ] `pnpm dev`로 모바일/데스크탑 뷰포트 각각 직접 확인

## Verification

- [ ] `pnpm test`, `pnpm lint`, `pnpm check-types`, `pnpm build`

## Rollback

- 이 커밋만 revert하면 이슈 4 시점(훅은 분리, JSX는 통합)으로 되돌아간다.

## Dependency

- 선행: 이슈 4

---

### 이슈 6 — 결과 검증 및 문서화

# 목적

전후 비교와 개발환경 실동작 확인을 기록하고 사이클을 종료한다.

## Scope

- `docs/refactors/post-detail-modal-responsibility-decomposition/result.md` 작성
- 필요 시 `docs/refactors/post-detail-modal-responsibility/result.md`(선행 사이클)의 Remaining Debt 갱신

## Out of Scope

- 새로운 코드 변경 없음(문서만)

## Behavior Invariants

- 해당 없음

## Acceptance Criteria

- [ ] Before/After, 개발환경 실동작 확인, Behavior Verification, Decision Review, Remaining Debt 기록
- [ ] 스와이프 중복(RightPanel/MobileNotiOverlay), PlaylistDetailModal 편집 훅 전환 후속 이슈를 백로그로 등록

## Verification

- [ ] `pnpm lint`/`check-types`/`test`/`build` 최종 재확인

## Rollback

- 문서만 변경되므로 해당 없음

## Dependency

- 선행: 이슈 5

---

**[GATE 2]** 위 대안 비교, 인터뷰 로그, ADR, 회귀 안전망, 이슈 분해를 확인해주시면 이슈를 생성하고 구현으로 넘어가겠습니다.
