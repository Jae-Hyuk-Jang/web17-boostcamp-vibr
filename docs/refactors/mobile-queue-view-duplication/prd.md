# PRD — mobile-queue-view-duplication

## 문제 정의

`brief-original.md` 요약: 모바일 `MiniPlayerBar`에 재생목록(큐)을 여는 진입점이 두 개 있고, 각각 완전히 다른 화면·다른 구현으로 연결된다 — 앨범아트 탭은 `RightPanel`의 풀스크린 오버레이(`QueueList`, 보관함/글쓰기/드래그재정렬/`TickerText` 포함)를, `ListPlus` 버튼은 별도로 다시 짠 `MobileNowPlaylistModal`(Clear만 있고 기능이 적음)을 연다.

왜 지금 다뤄야 하는가: `search-widget-duplication` 사이클 이후 재사용성 문제를 계속 추적하는 과정에서 사용자가 직접 이 중복을 지목했다. 검색 위젯 케이스와 달리 이번엔 "UI 스타일 중복"이 아니라 "같은 기능을 여는 두 진입점이 서로 다른 기능 집합을 제공"하는, 사용자에게 직접 보이는 불일치라 우선순위가 높다.

## 비판적 진단 (시니어 개발자 시각)

### 근거

- **Fact** — `MiniPlayerBar.tsx`에는 재생목록을 여는 트리거가 두 개다: 앨범아트/곡정보 영역(`onClick={onOpenFullPlayer}`)과 `ListPlus` 아이콘 버튼(`onClick={handleToggleQueueClick}` → `onToggleQueue`).
- **Fact** — `onOpenFullPlayer`는 `RightPanel.tsx`의 로컬 state `isFullPlayerOpen`을 `true`로 바꿔, `NowPlaying` + `QueueList`를 담은 `fixed inset-0` 풀스크린 섹션을 연다. 이 `QueueList`는 데스크탑 상시 패널에서 쓰이는 것과 **동일한 컴포넌트**다.
- **Fact** — `onToggleQueue`(`handleToggleQueue`)는 `useModalStore.openModal(MODAL_TYPES.MOBILE_QUEUE)`를 호출해 `ModalContainer`가 렌더링하는 `MobileNowPlaylistModal`(140줄)을 연다. 이 컴포넌트는 `MobileQueueRow`를 자체 정의해서 큐 아이템을 다시 그린다.
- **Fact** — 두 화면이 제공하는 기능이 다르다: `QueueList`는 보관함 추가(`Box` 아이콘)·추천 글 작성(`Plus` 아이콘)·드래그 재정렬(`GripVertical`, `onMove`)·`TickerText` 마퀴 스크롤이 있다. `MobileNowPlaylistModal`은 Clear 버튼만 있고, 순서 변경은 위/아래 화살표뿐이며, 긴 제목은 그냥 `truncate`된다.
- **Fact** — 두 컴포넌트 모두 `usePlayerStore`의 같은 액션(`removeFromQueue`/`moveUp`/`moveDown`/`clearQueue`, `QueueList`는 추가로 `moveTo`)을 구독한다 — 상태 계층은 중복되지 않고, UI 계층만 중복됐다.
- **Fact** — `MODAL_TYPES.MOBILE_QUEUE`는 `MobileNowPlaylistModal.tsx` 자신의 렌더 게이트와 `RightPanel.tsx`의 `ListPlus` 버튼 타이틀(`isQueueOpen`) 표시에만 쓰이고, 실제 큐 리스트를 그리는 데는 관여하지 않는다.
- **Fact** — `MobileNowPlaylistModal.test.tsx`는 "배경을 클릭하면 모달이 닫힌다" 1개 테스트만 있다(`modal-shell-duplication` 사이클의 8개 모달 특성화 테스트 중 하나).
- **Fact** — `docs/component-design/modals.md`(이전 사이클 분석)는 `MobileNowPlaylistModal`을 "`ModalShell`/`ModalPanel` 둘 다 안 쓰는 2곳" 중 하나로 이미 기록했다 — 바텀시트 전용 자체 구현이라는 것 자체는 그때도 확인된 사실이다.
- **Inference** — 두 진입점이 서로 다른 기능을 제공하는 건 의도된 정보 구조(예: "빠른 확인용 축소 기능" vs "전체 기능")로 보기 어렵다. 오히려 `MobileNowPlaylistModal`이 `RightPanel`의 풀플레이어 경로가 이미 모바일에서도 동작한다는 사실과 무관하게 별도로 만들어졌을 가능성이 크다. git 히스토리가 2026-07-08 단일 initial commit으로 스쿼시돼 있어 제작 시점 인과관계는 확인 불가(Hypothesis).

### 증상 → 원인 체인

증상: 모바일에서 같은 "재생목록 보기"인데 버튼 위치에 따라 할 수 있는 기능이 다르다(보관함 추가·글쓰기·드래그 재정렬이 한쪽에만 있음).
→ (왜?) `MobileNowPlaylistModal`이 `QueueList`를 재사용하지 않고 자체 `MobileQueueRow`를 다시 그렸다.
→ (왜?) 모바일 전용 진입점(`ListPlus` 버튼 → 모달)을 만들 때, 이미 존재하던 다른 모바일 진입점(앨범아트 탭 → 풀플레이어 → `QueueList`)을 고려하지 않고 독립적으로 구현했다.
→ 구조 원인: "재생목록을 보여준다"는 하나의 사용자 요구에 대해 두 개의 서로 다른 진입 경로(모달 스토어 경유 vs 로컬 `isFullPlayerOpen` state 경유)가 각자의 UI 계층을 갖게 되면서, 어느 한쪽을 고칠 때 다른 쪽이 자동으로 갱신되지 않는 구조가 됐다.

### 아키텍처 관점

- **국지적인가 반복 패턴인가**: `search-widget-duplication`에서 확인한 "재사용 지점을 못 찾아서 새로 구현" 패턴과 같은 종류다. 다만 이번엔 검색처럼 여러 곳에 흩어진 게 아니라 **같은 컴포넌트(`MiniPlayerBar`) 안의 두 버튼이 서로 다른 화면으로 갈라진다**는 점에서 사용자에게 더 직접적으로 드러나는 불일치다.
- **기존 컨벤션과 충돌하는가**: 딱히 없다. `MODAL_TYPES`에 `MOBILE_QUEUE`를 등록한 것 자체는 컨벤션대로지만, 그 모달이 실제로 담당하는 기능이 이미 존재하는 다른 화면의 부분집합이라는 게 문제다.
- **전제가 깨진 결정인가**: 오히려 처음부터 근거가 약했던 결정에 가깝다 — "모바일에는 풀플레이어와 별개로 가벼운 큐 확인 화면이 필요하다"는 판단이 있었다면 타당할 수 있지만, 그렇다면 애초에 기능을 의도적으로 줄였어야 하는데 실제로는 그냥 `QueueList`의 하위 집합을 다시 구현한 형태라 의도적 축소로 보기 어렵다.

### 비판적 재검토 (사용자 문제 제기에 대한 반박 질문과 답)

- **이 증상이 정말 구조 문제인가, 우연인가?** 구조 문제다. 두 화면이 정확히 같은 데이터(`usePlayerStore.queue`)를 다루면서 기능 집합만 다른 건 우연으로 보기 어렵고, "몰라서 다시 만든" 패턴이 이번 세션에서 반복 확인되고 있다.
- **안 고치면 다음 몇 번의 변경에서 무슨 비용이 드는가?** 예를 들어 큐 아이템에 새 액션(예: "다음 곡으로 재생 예약")을 추가하면 `QueueList`에만 넣고 `MobileNowPlaylistModal`은 빠뜨리기 쉽다 — 이미 보관함/글쓰기/드래그 3가지가 이런 식으로 빠져 있는 게 그 증거다.
- **더 급한 다른 문제를 가리는 건 아닌가?** 아니다 — 사용자가 직접 실사용 관점(모바일에서 버튼 두 개가 다른 화면으로 간다)에서 지목한 문제라 회피할 이유가 없다.

### 후보 우선순위

후보가 하나(모바일 큐 진입점 이중화)이므로 별도 표는 생략한다. 목표 인터뷰에서 "진입점을 하나로 통합"할지 "두 진입점을 유지하되 내용만 통일"할지를 확정했다(아래 참고).

## 목표와 범위

### 목표 인터뷰 로그

**Q1. 정리 후 모바일에서 재생목록을 볼 때 어떤 경험을 원하십니까? 지금은 '가벼운 바텀시트'와 '무거운 풀플레이어 오버레이'라는 두 개의 서로 다른 진입점이 있고, 이 선택이 이후 ADR의 구체 구현 안(MobileNowPlaylistModal을 완전히 삭제할지, 내부만 QueueList로 교체할지)을 좌우합니다.**
A. **진입점을 하나로 통합** — `ListPlus` 버튼도 풀플레이어 오버레이(`onOpenFullPlayer`)로 연결해, `MobileNowPlaylistModal`과 `MODAL_TYPES.MOBILE_QUEUE`를 통째로 제거할 수 있게 한다는 이유로 선택. 두 버튼이 서로 다른 기능으로 연결되는 지금 상황이 가장 큰 문제라고 판단했고, 통합하면 코드와 기능이 동시에 정리된다.

**Q2(확정 질문). 아래 Behavior Invariants / Success Criteria / Out of Scope로 확정할까요?**
A. **이대로 확정** — 코드로 직접 검증한 사실과 Q1의 방향에 근거해 도출된 내용이라 추가 조정 없이 승인.

### Goal

모바일 재생목록 진입점을 하나(풀플레이어 오버레이)로 통합하고, `MobileNowPlaylistModal`과 그 전용 `MODAL_TYPES.MOBILE_QUEUE` 소비 코드를 제거한다.

### Success Criteria

- `MobileNowPlaylistModal` 관련 코드(컴포넌트 파일, `ModalContainer`/`modals/index.ts` 소비처)가 제거된다.
- 모바일에서 `ListPlus` 버튼 클릭 시 `QueueList`(보관함/글쓰기/드래그재정렬/`TickerText` 포함)를 볼 수 있다.
- 기존 특성화 테스트가 검증하던 사용자 동작(배경 클릭 등으로 닫힘)이 새 경로에서도 동등하게 검증된다.
- `pnpm lint`/`check-types`/`test`/`build` 전부 통과한다.

### Out of Scope

- 데스크탑(lg 이상) `RightPanel` 레이아웃·리사이즈 로직.
- `MiniPlayerBar`의 재생 컨트롤(재생/이전/다음/보관함/글쓰기) 자체 동작.
- `QueueList` 내부 로직(드래그 재정렬 방식 등) 자체의 변경.
- 새 라이브러리 도입(필요 없음).

### Behavior Invariants

- `MiniPlayerBar`의 재생/일시정지/이전곡/다음곡/보관함 추가/추천 글 작성 버튼 동작은 변경되지 않는다.
- 데스크탑(lg 이상)의 상시 `RightPanel` 레이아웃/리사이즈는 변경되지 않는다.
- 큐 아이템 클릭 시 해당 곡 재생, 삭제/순서 변경(위/아래 또는 드래그) 동작은 유지된다.
- 풀플레이어 오버레이를 ESC/뒤로가기/스와이프다운으로 닫는 기존 동작은 유지된다.

## 기준선 검증

| 명령               | 결과 | 실패 항목 | 비고                                                          |
| ------------------ | ---- | --------- | ------------------------------------------------------------- |
| `pnpm lint`        | 통과 | 없음      | 4/4 태스크, 전부 cache hit                                    |
| `pnpm check-types` | 통과 | 없음      | 3/3 태스크, 전부 cache hit                                    |
| `pnpm test`        | 통과 | 없음      | web 17 suites/67 tests, api 8 suites/37 tests, 전부 cache hit |
| `pnpm build`       | 통과 | 없음      | 3/3 태스크, 전부 cache hit                                    |

측정 지표:

- 모바일 큐 관련 코드: `MobileNowPlaylistModal.tsx` 140줄(+테스트 21줄) — 제거 대상.
- `QueueList.tsx` 243줄 — 변경 없이 그대로 재사용.
- `MODAL_TYPES.MOBILE_QUEUE` 소비처: `MobileNowPlaylistModal.tsx`(렌더 게이트), `RightPanel.tsx`(버튼 타이틀 표시용) — 2곳.

---

**[GATE 1]** 위 진단·목표·범위·Behavior Invariants·기준선을 확인해주시면 ADR 단계로 넘어가겠습니다.
