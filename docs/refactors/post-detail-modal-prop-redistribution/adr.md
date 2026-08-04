# ADR — post-detail-modal-prop-redistribution

## 3안 비교

### 안 1 — 최소 개선안

Desktop Shell/Mobile Sheet가 각자 정의하던 `Pick<UsePostDetailModalResult['reactions'], ...>` 타입을 공용 파일 하나로 추출해 재사용한다. prop 전달 구조(Modal→Shell→leaf)는 그대로 유지하고, "두 곳에서 따로 정의"라는 유지비용만 없앤다.

### 안 2 — 경계 재설계안 (Context)

`PostCardDetailModal.tsx` 레벨(두 Shell의 공통 부모, 항상 1번만 마운트됨)에서 `usePostReactions`를 지금처럼 딱 1번 호출하되, 그 결과를 props로 흘려보내는 대신 React Context Provider(`PostDetailReactionsProvider`)로 감싸서 내려준다. leaf 컴포넌트(`PostDetailBody`/`PostDetailActions`/`PostDetailCommentComposer`)는 `usePostDetailReactions()` 같은 커스텀 훅으로 Context에서 직접 필요한 슬라이스만 구독한다. Shell은 레이아웃 분기 책임만 남고 데이터 배분 책임을 벗는다. `components/player/nowPlaying/PlaybackProvider.tsx`가 이미 이 패턴(변경 빈도가 다른 값을 Context로 분리)의 선례다.

### 안 3 — leaf 독립 구독안 (자체 구현 대안)

`PostCard.tsx`의 `usePostCacheSync` 패턴처럼, leaf 컴포넌트가 각자 `usePostReactions()`(또는 `postDetailQueryKey` 캐시)를 직접 호출해 완전히 독립적으로 구독한다. 새 라이브러리나 Context 없이 "각자 필요한 걸 각자 가져온다"는 가장 단순한 형태다.

## 비교표 (10개 고정 기준)

| #   | 기준                 | 안 1                                      | 안 2 (Context)                                                                              | 안 3 (leaf 독립 구독)                                                                                                                                                                                      |
| --- | -------------------- | ----------------------------------------- | ------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | 근본 원인 해결력     | 낮음 — 홉 자체(Modal→Shell→leaf)는 그대로 | 높음 — Shell을 거치지 않고 leaf가 직접 구독, 홉이 사라짐                                    | 높음 — 홉은 사라지지만 아래 2번 항목의 새 위험과 맞바꿈                                                                                                                                                    |
| 2   | 동작 보존 난이도     | 낮음(거의 무변화)                         | 중간 — Provider 배선 추가, 기존 leaf mock 테스트 업데이트 필요                              | **높음** — Desktop/Mobile 항상 동시 마운트(Q1)라 `usePostReactions`를 leaf가 각자 부르면 `commentText`/`isSubmittingComment` 등 로컬 상태가 인스턴스별로 갈라져 리사이즈 시 입력값이 사라지는 새 버그 위험 |
| 3   | 책임·의존성 변화     | 없음                                      | 있음 — Shell은 레이아웃만, Provider가 데이터 배분을 전담                                    | 있음 — leaf 각각이 mutation 소유자가 됨(더 큰 책임 이동)                                                                                                                                                   |
| 4   | 테스트 용이성        | 낮음(구조 그대로라 테스트 이음새 그대로)  | 높음 — Context 훅 단독 계약 테스트 + leaf를 Provider로 감싸 독립 테스트 가능                | 중간 — leaf 각각 테스트는 쉬워지나, 인스턴스 간 동기화 버그는 단위 테스트로 잡기 어려움                                                                                                                    |
| 5   | 변경 범위            | 작음(타입 파일 1개 추출)                  | 중간(Provider 1개 신설 + leaf 3개 전환 + 테스트)                                            | 중간(leaf 각각 훅 호출 전환 + 동기화 버그 대응 비용 추가 가능성)                                                                                                                                           |
| 6   | 점진적 전환 가능성   | 즉시 가능                                 | 가능 — leaf 하나씩 Context로 전환 가능                                                      | 가능하지만 위험을 내포한 채 진행하게 됨                                                                                                                                                                    |
| 7   | 롤백 가능성          | 높음                                      | 높음 — Provider 제거하면 원복                                                               | 중간 — 버그 발견 후 되돌리는 추가 비용                                                                                                                                                                     |
| 8   | 성능·운영 영향       | 없음                                      | 긍정적 가능 — Context를 값 변경 빈도별로 나누면 불필요한 리렌더 축소(PlaybackProvider 선례) | 부정적 가능 — 동일 `postId`에 대해 mutation 인스턴스가 2개(Desktop/Mobile) 생겨 중복 요청 위험                                                                                                             |
| 9   | 기존 코드와의 일관성 | 낮음(기존 패턴 유지라 비일관성 그대로)    | 높음 — `PlaybackProvider` 선례와 정확히 일치                                                | 낮음 — `usePostCacheSync`는 read-only라 다른 성격인데 억지로 유사하게 감                                                                                                                                   |
| 10  | 유지 비용            | 중간(Shell이 여전히 배분 책임을 가짐)     | 낮음 — Shell은 레이아웃만 책임지면 됨                                                       | 낮음~중간 — 배분 책임은 사라지지만 동기화 버그 대응 비용이 새로 생길 수 있음                                                                                                                               |

## 라이브러리 도입 심사

해당 없음 — 안 2(Context)는 React 내장 기능이라 새 npm 패키지 도입이 아니다. `package.json` 변경 없음.

## 의사결정 인터뷰 로그

이 사이클은 PRD 목표 인터뷰(1-3)에서 "leaf가 직접 구독"이라는 방향까지는 정했지만, 그 구체적 구현 방식(Context vs 독립 훅 호출)은 ADR 단계에서 새로 발견한 위험(Desktop/Mobile 동시 마운트 + `usePostReactions`의 로컬 mutation 상태)을 근거로 다시 물었다.

**Q. leaf가 '직접 구독'하도록 바꾸기로 했는데, 구체적으로 어떻게 구현할까요? `usePostReactions`는 `postDetailQueryKey` 캐시 읽기만이 아니라 `commentText`/`isSubmittingComment` 같은 로컬 입력 상태와 mutation까지 갖고 있어서, Desktop/Mobile이 항상 동시에 마운트되는 상황(Q1에서 유지 결정)에서 leaf가 각자 `usePostReactions()`를 독립 호출하면 새로운 버그(댓글 입력칸 텍스트가 모바일/데스크탑에서 서로 다르게 남는 등)가 생길 수 있습니다.**
A. Context로 감싸기(추천안 채택). 이유: `usePostReactions` 호출은 여전히 딱 1번만 일어나고(`PostCardDetailModal` 레벨), 그 결과를 Context Provider로 감싸서 leaf가 `useContext` 커스텀 훅으로 구독한다. mutation/로컬 입력 상태가 중복될 위험이 없고, `PlaybackProvider`라는 검증된 선례가 이미 이 저장소에 있다.

## 선택: 안 2 (Context)

**안 2**를 선택한다. 근거:

- 근본 원인(Shell이 레이아웃 분기와 데이터 배분 책임을 동시에 짐)을 직접 해결하면서도, `usePostReactions` 호출 지점을 1곳으로 유지해 안 3의 mutation 상태 중복 위험을 피한다.
- `PlaybackProvider`라는 이미 검증된 동일 패턴이 이 저장소에 있어 새로운 개념 도입이 아니다(기존 코드와의 일관성 항목 최고점).
- 안 1은 근본 원인을 해결하지 못해(홉이 그대로) 이번 사이클의 Goal("Shell의 Pick<> 재분배 제거")을 충족하지 못한다.
- 안 3은 Q1("Desktop/Mobile 동시 마운트 유지")과 결합하면 실제로 새 버그를 만들 가능성이 높아, "고치려다 새 문제를 만드는" 실패 패턴에 해당한다.

## ADR 본문

### Context

`PostCardDetailModalDesktopShell`/`MobileSheet`가 `usePostDetailModal`의 `reactions` 결과를 각자 다른 `Pick<>` 타입으로 재정의해 leaf 컴포넌트(`PostDetailBody`/`PostDetailActions`/`PostDetailCommentComposer`)에 전달한다. 이 재정의는 `reactions`에 새 필드가 생길 때마다 두 곳을 동시에 고쳐야 하는 유지비용을 만든다. Desktop/Mobile 두 트리는 항상 동시 마운트되므로(PRD Q1 결정, 애니메이션 의존성 때문에 이번엔 바꾸지 않음), leaf가 데이터를 직접 구독하는 해법은 "훅 호출이 몇 번 일어나는가"를 반드시 함께 고려해야 한다.

### Decision

`PostDetailReactionsContext`(가칭)를 신설해 `PostCardDetailModal.tsx`가 두 Shell을 감싸는 위치에서 Provider로 제공한다. `usePostReactions`는 지금처럼 `usePostDetailModal` 내부에서 1번만 호출된다(PRD Q3 결정과 일치 — 훅 내부 구조는 안 바꿈). `PostDetailActions`/`PostDetailCommentComposer`/`PostDetailBody`는 `usePostDetailReactionsContext()` 같은 커스텀 훅으로 Context에서 필요한 슬라이스만 가져오고, Shell의 `Pick<>` 재정의는 제거한다. `editing`/`player`/`likedUsers` 등 다른 그룹은 PRD의 Out of Scope 결정에 따라 이번엔 건드리지 않는다(Mobile Sheet가 애초에 이 필드들을 쓰지 않아 중복이 없었음).

### Alternatives

- 안 1(최소 개선안)은 기각 — Success Criteria("Shell의 Pick<> 재분배 코드 제거")를 충족하지 못한다.
- 안 3(leaf 독립 구독)은 기각 — Desktop/Mobile 동시 마운트와 결합하면 `usePostReactions`의 로컬 mutation 상태(특히 `commentText`)가 인스턴스별로 갈라지는 새 버그를 만들 위험이 크다.

### Consequences

- **장점**: Shell이 레이아웃 분기 책임만 지게 되어 책임이 명확해진다. `reactions`에 필드가 추가돼도 Context 훅 반환 타입 1곳만 고치면 된다. `PlaybackProvider`와 같은 패턴이라 팀 내 학습 비용이 낮다.
- **단점**: Context Provider와 커스텀 훅이라는 새 파일이 생겨 파일 수가 늘어난다(안 1 대비). leaf 컴포넌트가 이제 "props만 받는 순수 컴포넌트"가 아니게 되어 Storybook 등 독립 렌더링 도구를 쓴다면(현재 이 저장소엔 없음) Provider로 감싸야 하는 의존성이 생긴다.
- **새로 생기는 위험**: Context 값이 바뀔 때마다 Provider 하위 전체가 리렌더 대상이 될 수 있다 — `PlaybackProvider`가 이미 이 문제를 "변경 빈도가 다른 값을 Context 2개로 분리"해서 대응한 선례가 있으므로, 필요하면 같은 방식을 적용한다(구현 중 실측 후 판단).
- **운영 비용**: 낮음 — 새 외부 의존성 없음, React 내장 기능만 사용.

### Migration

Behavior Invariant(모바일 애니메이션, 리사이즈 전환, 좋아요/댓글/편집 흐름 유지)를 지키면서 아래 체크포인트 순서로 진행한다. 각 체크포인트는 그 자체로 저장소를 정상 상태로 유지한다.

1. **체크포인트 1**: leaf 컴포넌트(`PostDetailBody`/`PostDetailActions`/`PostDetailCommentComposer`) 특성화 테스트 추가(현재 0건) — 안전망 확보, 코드 변경 없음.
2. **체크포인트 2**: `PostDetailReactionsContext`(Provider + 커스텀 훅) 신설, `PostCardDetailModal.tsx`가 두 Shell을 감싸는 위치에 Provider 배선. 아직 아무 leaf도 Context를 쓰지 않음(seam만 추가, 기존 동작 무변화).
3. **체크포인트 3**: `PostDetailActions`/`PostDetailCommentComposer`를 Context 구독으로 전환. Desktop/Mobile Shell의 `Pick<>`에서 해당 필드 제거. 리사이즈 시 댓글 입력 텍스트가 유지되는지 확인하는 회귀 테스트 추가(안 3을 기각한 근거를 테스트로도 증명).
4. **체크포인트 4**: `PostDetailBody`를 Context 구독으로 전환, 남은 dead prop 제거, 문서(CLAUDE.md 컴포넌트 패턴 섹션에 이번에 정한 "Shell은 레이아웃만" 경계 규칙 언급 여부 검토) 갱신.

### Rollback

각 체크포인트가 독립 커밋이므로, 특정 체크포인트에서 문제가 발견되면 그 커밋만 `git revert`한다. 체크포인트 2(Provider 신설)까지만 롤백해도 leaf는 여전히 props를 받는 이전 방식으로 동작하므로 중간 상태에서 되돌리는 것도 안전하다.

## 회귀 안전망

### 테스트 우선순위

1. **Characterization**: `PostDetailBody`/`PostDetailActions`/`PostDetailCommentComposer` 단독 렌더링 테스트(현재 0건 — 체크포인트 1).
2. **Contract**: `PostDetailReactionsContext`/`usePostDetailReactionsContext()`가 `usePostReactions`의 반환값을 그대로 노출하는지 계약 테스트(체크포인트 2).
3. **State-transition**: 데스크탑↔모바일 리사이즈 전환 시 댓글 입력 텍스트(`commentText`)가 유지되는지(안 3을 기각한 핵심 이유를 검증, 체크포인트 3).
4. **Integration**: `PostCardDetailModal.test.tsx`(현재 14개 시나리오) — leaf mock이 이제 Context 사용으로 바뀌므로 mock 전략(현재 `jest.mock('./partials/PostDetailActions', ...)`처럼 컴포넌트 자체를 스텁)은 그대로 유지 가능할 것으로 예상되나, Context Provider가 mock되지 않은 실제 컴포넌트 트리에 포함되므로 테스트 wrapper에 Provider가 없어도 되는지(Provider는 `PostCardDetailModal.tsx` 안에서 조립되므로 실제 렌더링 트리에 자동 포함됨) 확인 필요.
5. **E2E**: 없음(브라우저 자동화 불가 — dev 서버 수동 확인으로 대체).

### 회귀 시나리오

| 시나리오                                                                | 기존 결과                           | 검증 수준         | 실패 시 조치                      |
| ----------------------------------------------------------------------- | ----------------------------------- | ----------------- | --------------------------------- |
| 좋아요 토글 후 Desktop/Mobile 양쪽 뷰의 좋아요 수가 동일하게 반영되는가 | 동일 캐시를 구독하므로 항상 일치    | 통합              | 구현 중단, Context 값 배선 재검토 |
| 댓글 입력 중 리사이즈(데스크탑↔모바일)해도 입력 텍스트가 유지되는가     | (현재도 단일 훅 인스턴스라 유지됨)  | 상태 전이         | 구현 중단                         |
| 댓글 제출 실패 시 토스트/롤백이 정상 동작하는가                         | `usePostReactions` 내부 로직 그대로 | 계약              | 구현 중단                         |
| `PostCardDetailModal.test.tsx` 14개 시나리오 전부 통과                  | 통과(기준선)                        | 통합              | mock 전략 조정 후 재실행          |
| 모바일 바텀시트 슬라이드업/스와이프다운 애니메이션이 그대로 동작하는가  | 동일(레이아웃 로직 미변경)          | 특성화(육안 확인) | 구현 중단                         |

## 체크포인트 이슈 목록

### 이슈 1 — test: PostDetailBody/PostDetailActions/PostDetailCommentComposer 특성화 테스트 추가

# 목적

이 세 leaf 컴포넌트는 현재 단독 유닛 테스트가 0건이다. Context로 구독 방식을 바꾸기 전에, 현재 props 기반 렌더링 결과를 특성화 테스트로 고정해 이후 체크포인트에서 회귀를 즉시 감지할 수 있게 한다.

## Scope

- `components/modals/PostCardDetailModal/partials/{PostDetailBody,PostDetailActions,PostDetailCommentComposer}.test.tsx` 신규 작성.

## Out of Scope

- 컴포넌트 구현 자체는 변경하지 않는다.

## Behavior Invariants

- 현재 props 기반 렌더링 결과(좋아요 수/댓글 목록/입력창 상태 등)가 테스트로 고정된다.

## Acceptance Criteria

- [ ] 세 컴포넌트 각각 현재 props 조합(로딩/에러/빈 상태 포함)에 대한 렌더링 테스트가 있다.
- [ ] 콜백 prop(`onToggleLike`/`onSubmitComment` 등) 호출 검증이 있다.

## Verification

- [ ] `pnpm test`(web) 신규 테스트 포함 통과.

## Rollback

- 테스트 파일만 추가하므로 되돌릴 동작 변경 없음.

## Dependency

- 없음(선행 이슈 없음). 체크포인트 2의 전제 조건.

---

### 이슈 2 — refactor(web): PostDetailReactionsContext 신설 및 Provider 배선(미사용 seam)

# 목적

leaf 컴포넌트가 Context로 전환할 수 있는 새 경계를 만든다. 이 이슈 자체는 아직 아무 leaf도 Context를 쓰지 않아 기존 동작에 영향이 없다.

## Scope

- `components/modals/PostCardDetailModal/PostDetailReactionsContext.tsx`(가칭) 신설: Provider + `usePostDetailReactionsContext()` 커스텀 훅.
- `PostCardDetailModal.tsx`에서 두 Shell을 감싸는 위치에 Provider 배선.

## Out of Scope

- leaf 컴포넌트의 실제 Context 전환(체크포인트 3/4).

## Behavior Invariants

- Provider 추가가 기존 렌더링 트리·동작에 어떤 변화도 주지 않는다(아직 아무도 소비하지 않으므로).

## Acceptance Criteria

- [ ] `PostDetailReactionsContext`가 `usePostDetailModal`의 `reactions` 전체를 값으로 제공한다.
- [ ] `usePostDetailReactionsContext()`가 Provider 밖에서 호출되면 명확한 에러를 던진다(`PlaybackProvider`의 `usePlaybackRefs` 패턴과 동일).
- [ ] 이슈 1의 특성화 테스트가 회귀 없이 통과한다.

## Verification

- [ ] `pnpm lint`/`check-types`/`test`/`build` 통과.

## Rollback

- Provider 파일과 배선 코드를 삭제하면 원복.

## Dependency

- 이슈 1 이후 진행 권장(특성화 테스트가 먼저 있어야 다음 체크포인트의 회귀를 감지 가능).

---

### 이슈 3 — refactor(web): PostDetailActions·PostDetailCommentComposer를 Context 구독으로 전환

# 목적

Desktop/Mobile Shell의 `Pick<>` 재정의 중 실제로 겹치는 필드(7개)를 우선 제거해 가장 큰 중복부터 해소한다.

## Scope

- `PostDetailActions.tsx`/`PostDetailCommentComposer.tsx`가 `usePostDetailReactionsContext()`로 필요한 값을 직접 구독하도록 전환.
- `PostCardDetailModalDesktopShellProps`/`PostCardDetailModalMobileSheetProps`에서 해당 필드 제거.

## Out of Scope

- `PostDetailBody.tsx` 전환(체크포인트 4).

## Behavior Invariants

- 좋아요 토글/댓글 작성 흐름의 결과가 기존과 동일하다.
- 데스크탑↔모바일 리사이즈 시 댓글 입력 텍스트가 유지된다(신규 회귀 테스트로 확인).

## Acceptance Criteria

- [ ] `PostDetailActions`/`PostDetailCommentComposer`가 props 대신 Context에서 값을 구독한다.
- [ ] Desktop/Mobile Shell의 `Pick<>` 타입에서 이관된 필드가 제거된다.
- [ ] 리사이즈 시 댓글 입력 텍스트 유지 회귀 테스트 추가 및 통과.
- [ ] 이슈 1의 특성화 테스트가 회귀 없이 통과(또는 Context 배선에 맞게 최소 수정 후 통과).

## Verification

- [ ] `pnpm lint`/`check-types`/`test`/`build` 통과.
- [ ] `pnpm dev`로 실제 좋아요/댓글 흐름 수동 확인.

## Rollback

- 이 커밋만 `git revert`하면 이전 props 전달 방식으로 복귀(Provider는 이슈 2에서 이미 존재하므로 영향 없음).

## Dependency

- 이슈 2 선행 필요.

---

### 이슈 4 — refactor(web): PostDetailBody Context 전환 + dead prop 정리 + 문서 갱신

# 목적

남은 leaf 하나까지 전환을 완료하고, Shell의 데이터 배분 책임을 완전히 제거한다.

## Scope

- `PostDetailBody.tsx`를 Context 구독으로 전환.
- Desktop/Mobile Shell에서 더 이상 쓰이지 않는 `reactions` 관련 prop/타입 완전 제거.
- 필요 시 CLAUDE.md 컴포넌트 패턴 섹션에 "레이아웃 분기 컴포넌트(Shell)는 데이터 배분 책임을 갖지 않는다"는 경계 규칙 추가 검토.

## Out of Scope

- `editing`/`player`/`likedUsers` 그룹(PRD Out of Scope).

## Behavior Invariants

- 게시글 본문/작성자 정보/댓글 목록 표시가 기존과 동일하다.

## Acceptance Criteria

- [ ] `PostDetailBody`가 props 대신 Context에서 값을 구독한다.
- [ ] `PostCardDetailModalDesktopShellProps`/`MobileSheetProps`에 `reactions` 관련 필드가 남아있지 않다(필요한 다른 필드만 유지).
- [ ] 이슈 1의 특성화 테스트 + 이슈 3의 회귀 테스트 모두 통과.

## Verification

- [ ] `pnpm lint`/`check-types`/`test`/`build` 통과.
- [ ] `pnpm dev`로 게시글 상세 모달 전체 흐름(좋아요/댓글/편집/좋아요한사용자목록/리사이즈/모바일 스와이프) 수동 확인.

## Rollback

- 이 커밋만 `git revert`.

## Dependency

- 이슈 3 선행 필요. 완료 후 이슈 #252(부모 이슈) 종료.

---

**[GATE 2]** 위 대안 비교·인터뷰 로그·ADR·회귀 안전망·이슈 분해를 확인해주시면 이슈를 실제로 생성하고 구현 단계로 넘어가겠습니다.
