# ADR — feed-search-domain

## 3안 비교

### 안 1 — 최소 개선안

`PostMedia`의 props는 그대로 두고, 손대는 부분은 안전망(characterization test) 추가뿐이다. `currentMusicId`/`isPlayingGlobal` 드릴링 구조 자체는 남는다.

### 안 2 — 경계 재설계안 — **선택**

`PostMedia`가 `usePlayerStore`에서 `currentMusicId`/`isPlayingGlobal`을 직접 구독하도록 바꾼다. `PostCard.tsx`/`PostCardDetailModalDesktopShell.tsx` 양쪽에서 이 2개 prop 전달을 제거하고, `FeedList.tsx`/`usePostDetailModal.ts`의 다른 곳에서 안 쓰이는 관련 selector도 함께 정리한다. `onPlay`/`onPlayAll`은 caller별 부수효과가 달라 prop으로 유지(PRD Fact). 이번 세션에서 이미 3번 검증된 "leaf가 스토어/Context를 직접 구독" 패턴과 동일한 클래스.

### 안 3 — 검증된 패턴 도입안(공용 `usePlaybackStatus` 훅)

안 2와 동일하게 직접 구독하되, `usePlayerStore`를 `PostMedia`에서 바로 부르는 대신 `usePlaybackStatus(musicId)` 같은 공용 훅으로 감싸 `isActivePlaying` 계산까지 캡슐화한다. 향후 `PostMedia` 외 세 번째 소비처(예: 프로필 그리드)가 생겼을 때 재사용을 노린 선제적 추상화.

## 비교표 (10개 고정 기준)

| #   | 기준                 | 안 1                                                          | 안 2(선택)                                                                                                                                                                      | 안 3                                                                                     |
| --- | -------------------- | ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| 1   | 근본 원인 해결력     | 낮음 — 3단 드릴링 구조 자체는 그대로 남음                     | 높음 — `PostMedia`가 재생 상태를 스스로 구독하므로 드릴링 경로가 구조적으로 사라짐                                                                                              | 높음 — 안 2와 동일 + 향후 재사용 지점까지 선제 대응                                      |
| 2   | 동작 보존 난이도     | 매우 낮음 — 코드 변경 없음                                    | 낮음 — `isActivePlaying` 계산식(`activeMusic && isPlayingGlobal && currentMusicId === activeMusic.id`)은 `usePostMedia.ts` 안에서 그대로 유지, 값의 출처만 prop→selector로 바뀜 | 낮음~중간 — 안 2와 동일한 계산을 새 훅 인터페이스로 한 번 더 감싸야 해서 표면적이 늘어남 |
| 3   | 책임·의존성 변화     | 없음                                                          | 작음 — `PostMedia`가 `usePlayerStore`에 새로 의존(다른 leaf들도 이미 이렇게 함, PRD Fact 참고). 신규 파일 없음                                                                  | 중간 — 신규 훅 파일 1개 추가, `PostMedia`는 그 훅에 의존                                 |
| 4   | 테스트 용이성        | 낮음 — 안전망은 생기지만 구조 문제 자체는 검증 대상이 아님    | **높음** — 신규 characterization test로 "구독 전환 전후 렌더링 동일"을 직접 증명 가능                                                                                           | 중간 — `usePlaybackStatus` 자체의 단위 테스트가 추가로 필요해 테스트 표면이 늘어남       |
| 5   | 변경 범위            | 매우 작음 — 테스트 파일 1개                                   | 작음 — `PostMedia.tsx`/`PostCard.tsx`/`PostCardDetailModalDesktopShell.tsx`/`FeedList.tsx`/`usePostDetailModal.ts`                                                              | 중간 — 안 2 범위 + 신규 훅 파일                                                          |
| 6   | 점진적 전환 가능성   | 해당 없음(변경 없음)                                          | 쉬움 — characterization test(체크포인트 1) → 구독 전환(체크포인트 2) → dead code 정리(체크포인트 3) 순서로 독립 커밋 가능                                                       | 쉬움 — 안 2와 같은 순서에 훅 추출 커밋만 하나 더 얹으면 됨                               |
| 7   | 롤백 가능성          | 해당 없음                                                     | 쉬움 — 파일 5개 이내, 커밋 단위 `git revert`                                                                                                                                    | 쉬움 — 안 2와 동일하되 신규 파일 하나 추가 롤백                                          |
| 8   | 성능·운영 영향       | 무해                                                          | 무해 — selector 구독 위치만 이동, 구독하는 slice(`currentMusic?.id`, `isPlaying`)는 동일                                                                                        | 무해 — 안 2와 동일                                                                       |
| 9   | 기존 코드와의 일관성 | 낮음 — 3단 드릴링 패턴이 남아 다른 leaf 구독 패턴과 계속 다름 | **매우 높음** — `SongList.tsx`의 `SongItem`이 `usePlayerStore`를 직접 구독하는 것과 완전히 동일한 형태                                                                          | 중간 — 저장소에 아직 없는 "공용 재생상태 훅"이라는 새 추상화 계층을 도입                 |
| 10  | 유지 비용            | 중간 — 드릴링 유지 비용 그대로                                | 낮음 — 구독 지점이 leaf 하나로 줄어듦                                                                                                                                           | 낮음(세 번째 소비처가 실제로 생기면) / 중간(안 생기면 불필요한 추상화 유지 비용만 남음)  |

## 라이브러리 도입 심사

해당 없음 — 새 라이브러리 도입이 아니다. `usePlayerStore`는 이미 존재하는 전역 zustand 스토어이며, 이번 변경은 그 구독 위치를 상위 컴포넌트에서 leaf로 옮기는 것뿐이다.

## 의사결정 인터뷰 로그

**Q. 3안 중 어느 안을 선택할까요?**
A. 안 2 — 경계 재설계안(추천). 이유: 이번 세션에서 이미 3번 검증된 leaf 직접구독 패턴과 동일 클래스이고, 변경 범위가 파일 5개 이내로 작다. 안 3(공용 `usePlaybackStatus` 훅)이 제시하는 재사용 이득은 아직 세 번째 소비처가 존재하지 않아 가설적 이득이라, 지금 도입하면 저장소에 없던 새 추상화 계층만 하나 더 늘리는 셈이라는 비교표 근거를 그대로 채택.

## 선택: 안 2

비교표 기준 1(근본 원인 해결력)·4(테스트 용이성)·9(기존 코드 일관성)에서 안 2가 안 1보다 뚜렷이 우세하고, 기준 3(책임 변화)·5(변경 범위)·9(일관성) 전부에서 안 3보다 단순하다. 세 번째 소비처가 실제로 등장하기 전까지 안 3의 추가 추상화는 YAGNI다 — 필요해지는 시점에 `usePlaybackStatus` 추출을 다시 검토하면 된다(Follow-ups에 기록).

## ADR 본문

### Context

`PostMedia`는 `currentMusicId`/`isPlayingGlobal`을 자신을 렌더링하는 두 호출부(`PostCard.tsx`, `PostCardDetailModalDesktopShell.tsx`)로부터 prop으로 받는다. 두 호출부 모두 이 값을 `usePlayerStore`(전역 zustand 스토어, `FeedList.tsx`) 또는 `PostDetailModalContext`(`usePostDetailModal.ts`가 내부적으로 같은 스토어를 구독)에서 가져와 그대로 통과시킬 뿐, 두 값을 다른 용도로 쓰는 곳은 없다(PRD Fact, grep으로 확인). `onPlay`/`onPlayAll`은 겉보기엔 같은 통과 prop처럼 보이지만 `usePostDetailModal.ts:156-172`의 `handlePlayFromPost`/`handlePlayAll`이 `recordPlayedMusic(...)`(UX 로깅)을 추가로 호출한다는 caller별 차이가 있어(PRD Fact) prop으로 남겨야 한다.

### Decision

`PostMedia.tsx`가 `usePlayerStore`에서 `currentMusicId`(`s.currentMusic?.id ?? null`)와 `isPlayingGlobal`(`s.isPlaying`)을 직접 구독하도록 바꾼다. `usePostMedia.ts`가 받는 `Args`에서 이 두 필드를 제거하고 훅 내부에서 스토어를 직접 읽거나, `PostMedia.tsx`가 읽어서 `usePostMedia`에 넘기는 두 방식 중 구현 단계에서 `isActivePlaying` 계산이 있는 `usePostMedia.ts` 쪽에 두는 것으로 확정한다(계산 로직과 구독을 한 파일에 모으는 것이 `usePlaylistDetail` 등 기존 훅 패턴과 더 일관적). `PostCard.tsx`/`PostCardDetailModalDesktopShell.tsx`에서 `<PostMedia>`에 전달하던 `currentMusicId`/`isPlayingGlobal`을 제거하고, 그로 인해 `FeedList.tsx`의 `currentMusicId`/`isPlaying` selector와 `usePostDetailModal.ts`의 `player.currentMusicId`/`player.isPlaying`(다른 사용처 없음 확인됨, PRD Fact)도 함께 제거한다. `onPlay`/`onPlayAll`은 변경하지 않는다.

### Alternatives

안 1(변경 없이 안전망만)은 PRD가 GATE 1에서 확정한 목표(구독 전환)를 달성하지 못해 기각. 안 3(공용 `usePlaybackStatus` 훅)은 아직 존재하지 않는 세 번째 소비처를 가정한 선제적 추상화라 YAGNI 원칙에 어긋나 기각 — 세 번째 소비처가 실제로 생기면 그때 안 2의 구현을 훅으로 추출하는 리팩터는 안 3보다 훨씬 쉽다(이미 구독 로직이 한 곳에 모여 있으므로).

### Consequences

- `PostMedia`가 `usePlayerStore`에 새로 직접 의존하게 된다 — 다른 leaf(`SongItem` 등)와 동일한 의존 형태라 저장소 전체 관점에서 새로운 의존 방향은 아니다.
- `PostCard.tsx`는 prop이 7개→5개로 줄어든다(`onUserClick`/`onOpenDetail`/`onPlay`/`onPlayAll`/`post`만 남음).
- `FeedList.tsx`/`usePostDetailModal.ts`에서 제거되는 selector로 인해 두 파일의 리렌더 트리거가 아주 소폭 줄어들 수 있다(관찰 가능한 부수 효과, Behavior Invariant 위반 아님 — 최종 렌더링 결과는 동일).

### Migration

`PostMedia.tsx`(구독 전환)와 두 호출부(prop 제거)는 상호 의존적이다 — prop을 먼저 지우면 `PostMedia`가 값을 못 받고, 구독을 먼저 추가하고 prop도 그대로 두면 일시적으로 값이 중복 공급된다(둘 다 즉시 컴파일 에러는 아니지만 상태 불일치 위험). 안전하게 쪼개는 순서: ① 안전망(characterization test)을 먼저 깔아 현재 동작을 고정 → ② 같은 커밋에서 `PostMedia` 구독 전환 + 두 호출부 prop 제거를 함께 처리(원자적) → ③ dead code(`FeedList`/`usePostDetailModal`의 남은 selector) 정리는 별도 커밋으로 분리 가능(컴파일 경고만 있을 뿐 런타임 영향 없음).

### Rollback

`apps/api`/`packages/dto` 변경이 없다. 핵심 변경이 파일 3개(`PostMedia.tsx` 또는 `usePostMedia.ts`, `PostCard.tsx`, `PostCardDetailModalDesktopShell.tsx`)에 집중되므로 `git revert`로 즉시 이전 상태로 복귀 가능하다.

## 회귀 안전망

우선순위: Characterization → Contract → State-transition → Integration → E2E. `PostMedia`는 착수 전 전용 테스트가 0개이므로(PRD Fact) 이번 사이클의 안전망은 대부분 신규다.

1. **Characterization(신규)** — 구독 전환 전, 현재 동작을 고정하는 테스트를 `PostMedia.test.tsx`에 추가: (a) `isPlayingGlobal=true`+`currentMusicId`가 활성 트랙과 일치할 때 Pause 아이콘 렌더, 불일치/false일 때 Play 아이콘 렌더, (b) 커버 페이지(`activeIndex=0`)에서 전체재생 버튼 클릭 시 `onPlayAll` 호출, 트랙 페이지에서 재생 버튼 클릭 시 `onPlay(activeMusic)` 호출.
2. **Contract(신규)** — 구독 전환 후, 동일 테스트가 prop 없이(또는 prop을 안 넘기고) `usePlayerStore`를 직접 mock/set한 상태에서도 같은 결과를 내는지 확인 — "prop→store" 전환이 렌더링 결과를 바꾸지 않았다는 것을 직접 증명.
3. **State-transition** — 기존 `usePlayerStore` 관련 테스트(있다면)로 스토어 자체의 `currentMusic`/`isPlaying` 전이는 이미 커버된다고 가정, 이번 사이클에서 신규 추가 없음.
4. **Integration** — 기존 `PostCard.test.tsx`/`FeedView.test.tsx`가 `PostCard`→`PostMedia`까지 이어지는 렌더링을 이미 커버하므로(간접), 회귀 없이 통과하는지 확인하는 것으로 충분 — 신규 추가 없음.
5. **E2E** — Out of Scope(기존 사이클과 동일, 브라우저 자동화 도구 없음).

### 회귀 시나리오

| 시나리오                                                                  | 기존 결과                              | 검증 수준                          | 실패 시 조치 |
| ------------------------------------------------------------------------- | -------------------------------------- | ---------------------------------- | ------------ |
| 활성 트랙 재생 중일 때 Pause 아이콘, 아닐 때 Play 아이콘                  | `isActivePlaying` 계산대로 아이콘 전환 | Characterization(신규)             | 구현 중단    |
| 커버 페이지 전체재생 버튼 클릭 → `onPlayAll` 호출                         | 클릭 시 `onPlayAll()` 호출             | Characterization(신규)             | 구현 중단    |
| 트랙 페이지 재생 버튼 클릭 → `onPlay(activeMusic)` 호출                   | 클릭 시 `onPlay(activeMusic)` 호출     | Characterization(신규)             | 구현 중단    |
| prop 제거 후에도 위 3가지가 스토어 값 기준으로 동일하게 동작              | (신규) prop 대신 스토어 직접 구독      | Contract(신규)                     | 설계 재검토  |
| `PostCard`/`FeedView` 기존 스냅샷·렌더링 테스트가 회귀 없이 통과          | 기존 assertion 그대로 통과             | Integration(기존)                  | 구현 중단    |
| `variant="modal"` 경로(`PostCardDetailModalDesktopShell`)도 동일하게 동작 | 모달 쪽도 아이콘/클릭 동작 동일        | Characterization(신규, 파라미터화) | 구현 중단    |

## 체크포인트 이슈 목록

각 이슈는 반나절 이내 크기. 이전 두 사이클과 동일하게 하나의 브랜치에서 순서대로 구현하고 PR 1개로 병합한다.

1. **안전망 구축** — `PostMedia.test.tsx` 신규 생성, 위 characterization 시나리오(재생 아이콘 전환, `onPlay`/`onPlayAll` 호출)를 현재 prop 기반 구현 그대로 고정. 구조 변경 없음, 먼저 머지해도 안전.
2. **구독 전환 + prop 제거** — `usePostMedia.ts`(또는 `PostMedia.tsx`)가 `usePlayerStore`를 직접 구독하도록 변경. `PostCard.tsx`/`PostCardDetailModalDesktopShell.tsx`에서 `currentMusicId`/`isPlayingGlobal` prop 전달 제거. 체크포인트 1의 테스트를 prop 없는 형태로 갱신(Contract 시나리오 추가). 이 사이클의 핵심 변경.
3. **Dead code 정리 + 문서 갱신** — `FeedList.tsx`의 `currentMusicId`/`isPlaying` selector, `usePostDetailModal.ts`의 `player.currentMusicId`/`player.isPlaying`(다른 사용처 없음 확인됨) 제거. `docs/component-hook-audit/index.html`의 관련 finding에 해소 표시(`playlist-detail-caching/result.md` 갱신 사례와 동일 패턴). 이 사이클의 `result.md` 작성.

### 생성된 이슈

| 체크포인트                    | 이슈 |
| ----------------------------- | ---- |
| 1. 안전망 구축                | #277 |
| 2. 구독 전환 + prop 제거      | #278 |
| 3. Dead code 정리 + 문서 갱신 | #279 |

---

**[GATE 2]** 위 대안 선택, 인터뷰 로그, ADR 본문, 회귀 안전망, 이슈 분해를 확인해주시면 실제 GitHub 이슈를 생성하겠습니다.
