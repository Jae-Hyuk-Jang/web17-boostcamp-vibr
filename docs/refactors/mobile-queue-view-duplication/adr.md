# ADR — mobile-queue-view-duplication

PRD에서 이미 "진입점을 하나(풀플레이어 오버레이)로 통합한다"는 방향은 확정했다. 이 ADR은 그 통합을 구현할 때 남는 유일한 기술적 갈림길 — **`ListPlus` 버튼으로 열었을 때 사용자를 어디로 랜딩시킬 것인가** — 를 다룬다. `RightPanel`의 풀플레이어 섹션은 `NowPlaying`이 위, `QueueList`가 그 아래에 있는 단일 스크롤 컨테이너라, 그냥 열기만 하면 "재생목록 보기" 버튼인데 재생목록이 화면에 안 보이는 상태로 시작한다.

## 3안 비교

### 안 1 — 최소 개선안 (그냥 열기)

`ListPlus`도 `onOpenFullPlayer`를 그대로 호출한다. 스크롤 위치 제어 없음 — 사용자가 직접 아래로 스크롤해서 큐를 봐야 한다.

### 안 2 — 경계 재설계안 (큐로 자동 스크롤, 채택)

풀플레이어를 여는 방식을 두 가지로 구분한다: 기존 `onOpenFullPlayer`(스크롤 없음, 앨범아트 탭용)와 신규 `onOpenQueue`(열기 + `QueueList` 위치로 `scrollIntoView`, `ListPlus` 버튼용). `RightPanel`에 `queueSectionRef`와 "열릴 때 큐로 스크롤할지" 플래그를 추가한다.

### 안 3 — 검증된 도구 도입안 (풀플레이어 내부 탭)

풀플레이어 안에 "재생 중"/"재생목록" 탭을 두고, 트리거에 따라 기본 탭을 다르게 연다. 사용자가 이후 자유롭게 탭을 전환할 수 있다.

## 비교표 (10개 고정 기준)

| #   | 기준                 | 안 1                                                | 안 2                                            | 안 3                                           |
| --- | -------------------- | --------------------------------------------------- | ----------------------------------------------- | ---------------------------------------------- |
| 1   | 근본 원인 해결력     | 낮음 — 버튼 의미("재생목록 보기")가 사실상 무력화됨 | 높음 — 버튼 목적을 그대로 달성                  | 높음 — 가장 명시적으로 달성 + 자유 전환        |
| 2   | 동작 보존 난이도     | 매우 쉬움                                           | 쉬움 — `scrollIntoView` 한 번                   | 어려움 — 새 탭 상태·전환 UI 추가               |
| 3   | 책임·의존성 변화     | 없음                                                | `RightPanel`에 "어떻게 열렸는지" 상태 하나 추가 | `RightPanel`에 탭 상태 + 전환 로직 추가(더 큼) |
| 4   | 테스트 용이성        | 쉬움                                                | 쉬움 — ref/스크롤 호출 여부만 확인              | 복잡 — 탭 전환 상태까지 테스트 필요            |
| 5   | 변경 범위            | 최소(버튼 핸들러 1줄 교체)                          | 작음(`RightPanel`에 ref+스크롤 로직)            | 중간(새 UI 컴포넌트/상태)                      |
| 6   | 점진적 전환 가능성   | 가능                                                | 가능                                            | 가능                                           |
| 7   | 롤백 가능성          | 쉬움                                                | 쉬움                                            | 쉬움                                           |
| 8   | 성능·운영 영향       | 미미                                                | 미미                                            | 미미                                           |
| 9   | 기존 코드와의 일관성 | 낮음 — 라벨("재생목록 열기")과 실제 동작이 어긋남   | 높음                                            | 낮음 — 이 저장소에 없던 탭 패턴 신규 도입      |
| 10  | 유지 비용            | 낮음(그러나 UX 결함 리포트 유발 가능)               | 낮음                                            | 중간(탭 상태 유지)                             |

## 라이브러리 도입 심사

해당 없음 — PRD에서 이미 "새 라이브러리 도입 없음"으로 확정.

## 의사결정 인터뷰 로그

**Q. `ListPlus` 버튼을 누르면 풀플레이어가 열리는데, `RightPanel` 구조상 `NowPlaying`이 위에 있고 `QueueList`는 그 아래에 있어서 그냥 열기만 하면 사용자가 직접 스크롤해야 큐가 보인다. 이 랜딩 위치 문제를 어떻게 처리할까요?**
A. 안 2 — 큐로 자동 스크롤. 이유: 버튼의 원래 의도(재생목록을 보여줌)를 그대로 달성하면서, 변경 범위는 `RightPanel`에 ref 하나 추가하는 수준으로 작다. Out of Scope로 명시한 "`QueueList` 내부 로직 변경"에는 해당하지 않는다 — 스크롤 제어는 컨테이너(`RightPanel`) 레벨 변경이다.

## 선택: 안 2

비교표 기준 1(근본 원인 해결력)·9(일관성)에서 안 2가 안 1을 명확히 앞서고, 기준 2·3·5(구현 난이도·범위)에서 안 3보다 훨씬 저비용이다. 안 3의 "탭으로 자유 전환"이라는 이점은 이번 PRD의 목표(진입점 통합)를 넘어서는 기능 확장이라 채택하지 않는다.

## ADR 본문

### Context

모바일 재생목록 진입점이 `MobileNowPlaylistModal`(모달 스토어 경유)과 `RightPanel`의 풀플레이어 오버레이(로컬 state 경유) 두 갈래로 나뉘어 있고, 기능 집합도 다르다. PRD에서 후자로 통합하기로 확정했다.

### Decision

1. `RightPanel.tsx`에 `queueSectionRef`(QueueList를 감싸는 wrapper에 부착)와 큐로 스크롤할지를 나타내는 상태를 추가한다. `isFullPlayerOpen`이 켜지고 그 상태가 참이면 `queueSectionRef.current?.scrollIntoView({ block: 'start' })`를 실행한 뒤 플래그를 리셋한다.
2. `MiniPlayerBar`에 전달하는 콜백을 `onOpenFullPlayer`(스크롤 없음)와 `onOpenQueue`(스크롤 있음) 두 가지로 명확히 나눈다 — `ListPlus` 버튼은 `onOpenQueue`를, 앨범아트/곡정보 영역은 기존대로 `onOpenFullPlayer`를 쓴다.
3. `ListPlus` 버튼의 동작은 "토글(열림↔닫힘)"에서 "열기+스크롤(멱등)"로 의미가 바뀐다 — 통합 이전엔 모달 스토어의 열림/닫힘을 토글했지만, 통합 이후엔 별도의 "큐 화면"이라는 개념 자체가 없어지므로 토글할 대상이 없다. 이미 풀플레이어가 열려 있는 상태에서 다시 누르면 큐 섹션으로 스크롤만 한다(닫지 않는다). 이는 의도적인 동작 변화이며 아래 Behavior Invariants에는 포함하지 않는다(기존 "닫힘" 동작 자체가 모달 스토어에 종속돼 있었으므로, 모달이 사라지면 자연 소멸하는 개념).
4. `MobileNowPlaylistModal.tsx`(컴포넌트+테스트), `components/modals/MobileNowPlaylistModal/` 폴더, `modals/index.ts`/`ModalContainer.tsx`의 소비처를 제거한다.
5. `stores/useModalStore.ts`의 `MODAL_TYPES.MOBILE_QUEUE` 값도 함께 제거한다 — 제거 후 이 값을 참조하는 곳이 하나도 남지 않으므로(1번~4번 완료 시점 기준) 죽은 enum 값으로 남겨두지 않는다.

### Alternatives

- 안 1(그냥 열기): 구현은 가장 쉽지만 버튼 라벨("재생목록 열기")과 실제 동작이 어긋나는 새로운 UX 결함을 만들어 기각.
- 안 3(탭 UI): 이번 사이클 목표(진입점 통합)를 넘어서는 새 UI 개념 도입이라 범위 초과로 기각. 필요해지면 별도 PRD로 재검토.

### Consequences

- 장점: 모바일 큐 관련 코드가 `QueueList` 하나로 모이고, 기능(보관함/글쓰기/드래그재정렬)이 모바일에서도 전부 쓰인다.
- 단점: `ListPlus` 버튼의 "토글" 의미가 사라진다(3번 항목) — 열려 있는 상태에서 다시 눌러도 안 닫힌다. X 버튼/ESC/뒤로가기/스와이프다운으로는 계속 닫을 수 있어 큰 손실은 아니라고 판단했다.
- 새 위험: `scrollIntoView`가 실행되는 타이밍(풀플레이어 애니메이션 완료 전/후)에 따라 스크롤이 어색하게 보일 수 있다 — 구현 중 실제로 확인 필요(중단 조건에 포함).

### Migration

1. `RightPanel`의 풀플레이어 열기/닫기(ESC/뒤로가기/스와이프다운) 현재 동작을 특성화 테스트로 고정한다(구조 변경 없음).
2. `RightPanel`/`MiniPlayerBar`에 "큐로 스크롤하며 열기" 기능을 추가한다 — 이 시점까지는 `MobileNowPlaylistModal`을 그대로 둔다(두 경로가 공존해도 안전).
3. `MobileNowPlaylistModal`과 `MODAL_TYPES.MOBILE_QUEUE`를 제거한다.
4. 결과 검증 및 문서 갱신.

### Rollback

각 체크포인트는 독립 커밋이다. 2단계에서 스크롤 동작이 어색하면 3단계(삭제)를 시작하지 않고 2단계만 되돌리면 기존 두 진입점 상태로 복귀한다. 3단계 이후 문제가 발견되면 `git revert`로 `MobileNowPlaylistModal` 삭제 커밋을 되돌려 임시 복구할 수 있다.

## 회귀 안전망

### 테스트 우선순위

1. **Characterization** — `RightPanel`의 풀플레이어 오버레이는 현재 테스트가 0건이다. 열기(앨범아트 탭)/닫기(X 버튼, ESC, 뒤로가기, 스와이프다운) 동작을 리팩터링 전에 먼저 고정한다. 이번 사이클에서 가장 중요한 안전망이다.
2. **Contract** — `onOpenQueue` 호출 시 `isFullPlayerOpen`이 켜지고 `queueSectionRef`로 스크롤이 호출되는지 검증한다.
3. **State-transition** — 스크롤 플래그가 스크롤 실행 후 리셋되어, 이후 `onOpenFullPlayer`(스크롤 없음)로 열었을 때 스크롤이 재실행되지 않는지 확인한다.
4. **Integration** — `MiniPlayerBar`의 `ListPlus` 클릭 → `RightPanel` 풀플레이어 오버레이 표시 → `QueueList` 보임까지 통합 시나리오.
5. **E2E** — PRD Out of Scope. Follow-up으로 남긴다.

### 회귀 시나리오

| 시나리오                                                 | 기존 결과                                                          | 검증 수준        | 실패 시 조치 |
| -------------------------------------------------------- | ------------------------------------------------------------------ | ---------------- | ------------ |
| 앨범아트/곡정보 탭                                       | 풀플레이어 열림(스크롤 없음, `NowPlaying`부터 시작)                | Characterization | 구현 중단    |
| `ListPlus` 클릭(신규 경로)                               | 풀플레이어 열림 + `QueueList`로 스크롤                             | Contract         | 구현 중단    |
| 풀플레이어 열린 상태에서 ESC/뒤로가기/스와이프다운/X버튼 | 닫힘                                                               | Characterization | 구현 중단    |
| 데스크탑(lg 이상) 진입                                   | 항상 상시 패널, `isFullPlayerOpen` 무관하게 정상 표시              | Characterization | 구현 중단    |
| 큐 비어있음                                              | "재생목록이 비어있습니다" 메시지(`QueueList` 자체 로직, 변경 없음) | 단위             | 구현 중단    |

## 체크포인트 이슈 목록

### 이슈 1 — `RightPanel` 풀플레이어 열기/닫기 특성화 테스트 추가

# 목적

현재 테스트가 0건인 `RightPanel`의 풀플레이어 오버레이 열기/닫기 동작을 리팩터링 전에 고정해, 이후 단계에서 동작이 깨지면 즉시 알 수 있게 한다.

## Scope

- `components/player/RightPanel.test.tsx`(신규)

## Out of Scope

- 구조 변경 없음

## Behavior Invariants

- prd.md의 Behavior Invariants 전체

## Acceptance Criteria

- [ ] Given 모바일 뷰포트, When 앨범아트 영역을 클릭하면, Then 풀플레이어 오버레이가 열린다.
- [ ] Given 풀플레이어가 열린 상태, When X 버튼/ESC/뒤로가기(popstate)/스와이프다운 중 하나를 실행하면, Then 오버레이가 닫힌다.

## Verification

- [ ] `pnpm test -- RightPanel`

## Rollback

- 테스트 파일만 추가되므로 삭제만으로 되돌릴 수 있다.

## Dependency

- 없음(선행 이슈)

---

### 이슈 2 — `ListPlus`가 큐로 스크롤하며 풀플레이어를 열도록 통합

# 목적

두 번째 진입점(`ListPlus`)을 기존 풀플레이어 경로로 합치되, 버튼의 원래 의도(재생목록을 보여줌)를 스크롤 이동으로 그대로 살린다. `MobileNowPlaylistModal`은 이 단계에서는 그대로 둬서, 스크롤 동작이 어색할 경우 이전 단계로 안전하게 되돌릴 수 있게 한다.

## Scope

- `components/player/RightPanel.tsx` — `queueSectionRef`, 스크롤 플래그, `onOpenQueue` 핸들러 추가
- `components/player/MiniPlayerBar.tsx` — `onOpenQueue` prop 추가, `ListPlus` 버튼에 연결

## Out of Scope

- `MobileNowPlaylistModal` 삭제(다음 이슈)
- `QueueList` 내부 로직 변경

## Behavior Invariants

- 앨범아트 탭(`onOpenFullPlayer`) 동작은 스크롤 없이 그대로 유지된다.

## Acceptance Criteria

- [ ] Given 모바일 뷰포트, When `ListPlus` 버튼을 클릭하면, Then 풀플레이어가 열리고 `QueueList` 위치로 스크롤된다.
- [ ] Given 앨범아트를 클릭해 이미 풀플레이어가 열린 상태, When 다시 렌더링해도, Then 스크롤 위치가 임의로 바뀌지 않는다(스크롤은 `onOpenQueue`를 거칠 때만 발생).

## Verification

- [ ] `pnpm test -- RightPanel MiniPlayerBar`
- [ ] `pnpm dev`로 모바일 뷰포트에서 `ListPlus` 클릭 시 실제 스크롤 동작 확인

## Rollback

- 이 커밋만 revert하면 `ListPlus`가 다시 기존 모달(`MobileNowPlaylistModal`)로 연결된 상태로 돌아간다(3단계 시작 전이므로 안전).

## Dependency

- 선행: 이슈 1

---

### 이슈 3 — `MobileNowPlaylistModal` 제거

# 목적

더 이상 쓰이지 않는 진입점과 그 전용 코드를 제거해, "재생목록을 보여준다"는 기능이 저장소에 정확히 한 곳(`QueueList` 경유)에만 존재하게 한다.

## Scope

- `components/modals/MobileNowPlaylistModal/`(컴포넌트+테스트) 삭제
- `components/modals/index.ts`, `components/modals/ModalContainer.tsx`의 소비처 제거
- `stores/useModalStore.ts`의 `MODAL_TYPES.MOBILE_QUEUE` 제거
- `RightPanel.tsx`의 `isQueueOpen`(모달 스토어 기반) 계산을 `isFullPlayerOpen` 기반으로 교체

## Out of Scope

- 없음(이 이슈 자체가 삭제 작업)

## Behavior Invariants

- prd.md의 Behavior Invariants 전체(특히 데스크탑 레이아웃 불변)

## Acceptance Criteria

- [ ] `MODAL_TYPES.MOBILE_QUEUE`를 참조하는 코드가 저장소에 없다(`grep -rn "MOBILE_QUEUE"` 결과 0건).
- [ ] `ModalContainer`가 더 이상 `MobileNowPlaylistModal`을 import하지 않는다.
- [ ] 모바일에서 `ListPlus`/앨범아트 두 트리거 모두 정상 동작한다(이슈 2에서 만든 테스트가 계속 통과).

## Verification

- [ ] `pnpm test`, `pnpm lint`, `pnpm check-types`, `pnpm build`
- [ ] `grep -rn "MOBILE_QUEUE" apps/web/src`

## Rollback

- `git revert`로 삭제 커밋을 되돌리면 기존 모달이 복구된다.

## Dependency

- 선행: 이슈 2

---

### 이슈 4 — 결과 검증 및 문서 갱신

# 목적

전후 비교와 개발환경 실동작 확인을 기록하고 사이클을 종료한다.

## Scope

- `docs/refactors/mobile-queue-view-duplication/result.md` 작성
- 필요 시 `docs/component-design/modals.md`(모바일 큐 항목) 갱신

## Out of Scope

- 새로운 코드 변경 없음(문서만)

## Behavior Invariants

- 해당 없음

## Acceptance Criteria

- [ ] Before/After, Behavior Verification, Decision Review, Remaining Debt가 result.md에 기록된다.

## Verification

- [ ] `pnpm lint`/`check-types`/`test`/`build` 최종 재확인

## Rollback

- 문서만 변경되므로 해당 없음

## Dependency

- 선행: 이슈 3

---

**[GATE 2]** 위 대안 비교, 인터뷰 로그, ADR, 회귀 안전망, 이슈 분해를 확인해주시면 이슈를 생성하고 구현으로 넘어가겠습니다.
