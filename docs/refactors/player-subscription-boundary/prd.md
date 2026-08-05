# PRD — player-subscription-boundary

## 문제 정의

`brief-original.md` 요약: `RightPanel`이 `usePlayerStore` selector 11개를 개별 구독한 뒤, 그중 7개(`currentMusic`/`isPlaying`/`canPrev`/`canNext`/`onTogglePlay`/`onPrev`/`onNext`)를 `NowPlaying`과 `MiniPlayerBar`에 완전히 동일하게 이중 전달하고, 같은 트리의 `NowPlaying`은 또 다른 4개 필드(`volume`/`setVolume`/`playError`/`setPlayError`)를 스스로 직접 구독한다 — 한 서브트리 안에서 "부모가 구독해 내려주기"와 "자식이 직접 구독하기"가 기준 없이 공존한다. 같은 도메인에서 `usePlayback`은 현재 재생 provider와 무관하게 iTunes·YouTube 두 재생 엔진 훅을 항상 동시에 호출하고, `useQueueSync`는 TanStack Query 없이 수동 폴링으로 now-playlist를 동기화하다가 실패하면 영구 중단된다.

왜 지금 다뤄야 하는가: 이슈 #251(부모 추적 이슈)과 `docs/component-hook-audit/index.html`(컴포넌트·훅 신호 경로 감사)에서 7개 도메인 37건 중 player 도메인이 9건으로 가장 많고 유일하게 심각도 "심각" 2건(엔진 동시 마운트, 큐 동기화 영구 중단)을 포함한다. 사용자가 플레이어(영향 범위가 가장 큰 도메인)와 플레이리스트(안전하게 빠른 승리가 가능한 도메인) 중 플레이어를 명시적으로 선택했다.

## 비판적 진단 (시니어 개발자 시각)

### 근거

- **[Fact]** `RightPanel.tsx:24-36`에서 `usePlayerStore` selector를 11회 개별 호출한다(`currentMusic,isPlaying,queue,selectMusic,togglePlay,clearQueue,removeFromQueue,moveUp,moveDown,moveTo,playPrev,playNext`).
- **[Fact]** `RightPanel.tsx:141-149`(`NowPlaying`)와 `RightPanel.tsx:169-179`(`MiniPlayerBar`)에 `currentMusic/isPlaying/canPrev(=isPrevAvailable)/canNext(=isNextAvailable)/onTogglePlay(=handleTogglePlay)/onPrev(=playPrev)/onNext(=playNext)` 7개가 완전히 동일한 값으로 각각 전달된다. 두 컴포넌트 모두 `React.memo`로 감싸지 않은 `export default function`이다 — 11개 구독 필드 중 하나(예: `queue`)만 바뀌어도 `RightPanel`이 리렌더되고, 두 자식에게는 새 함수 참조(`useCallback`으로 감싼 `handleTogglePlay` 제외 — `playPrev`/`playNext`/`clearQueue` 등은 zustand action이라 참조가 안정적이지만, `isPrevAvailable`/`isNextAvailable`은 매 렌더 재계산되는 `boolean` 값이라 참조가 아니라 값 자체가 바뀔 수 있음)가 새로 전달된다.
- **[Fact]** `RightPanel.tsx`는 `MiniPlayerBar`와 `{section}`(`NowPlaying`+`QueueList` 포함)을 **항상 동시에** 렌더한다(`RightPanel.tsx:167-183`) — 반응형 표시 여부는 Tailwind 클래스(`hidden lg:flex` vs `lg:hidden`)로만 제어되고 조건부 마운트가 아니다. 즉 데스크톱/모바일 두 레이아웃이 뷰포트와 무관하게 **항상 동시에 마운트돼 있다.**
- **[Fact]** `NowPlaying.tsx:25-28`은 같은 `usePlayerStore`의 `volume`/`setVolume`/`playError`/`setPlayError`를 **자체적으로 직접** 구독한다 — `RightPanel`을 거치지 않는다.
- **[Fact]** `usePlayback.ts:10-11` — `const it = useItunesHook(); const yt = useYouTubeHook();`가 `currentMusic.provider` 분기(`:13`) **이전에** 무조건 실행된다.
- **[Fact]** `useItunesHook.ts:41-55`의 `<audio>` 생성 `useEffect`는 `isItunes` 여부를 검사하지 않고 마운트 시 무조건 `new Audio()`를 만든다. 같은 파일 `:108-123`(재생/정지 제어 effect)는 `if (!currentMusic || !isItunes) return;`으로 provider를 걸러내지만, **엘리먼트 생성 자체는 막지 않는다.**
- **[Fact]** `useYouTubePlayer.ts:68-` 이하의 초기화 `useEffect`도 provider 분기 없이 마운트 시 무조건 `loadScript()`(IFrame 스크립트 삽입) → `waitForContainer()` → `new window.YT.Player(...)`를 실행한다.
- **[Fact]** `useItunesHook`은 `currentMusic,isPlaying,queue.length,playNext,togglePlay,setVolume,volume,setPlayError` 8개 필드를, `useYouTubeSync`(useYouTubeHook 내부)는 `volume,isPlaying,currentMusic,setPlayError` 4개 필드를 각각 독립적으로 구독한다 — `volume`/`isPlaying`/`currentMusic`/`setPlayError` 4개가 두 훅에서 **병렬로 겹친다.** 어떤 provider로 재생 중이든 두 훅의 구독이 모두 살아있어 store 변경마다 두 훅 모두 재평가된다.
- **[Fact]** `PlaybackProvider.tsx:19-20`은 `PlaybackRefsContext`(ref/seek, 변경 적음)와 `PlaybackProgressContext`(progress, tick으로 자주 변함)를 분리해 제공한다. `NowPlayingMetaActions.tsx`는 `PlaybackProvider` 안에서 렌더되지만(`NowPlaying.tsx:85`) 두 Context를 모두 구독하지 않는다(grep 확인, 0건) — props(`currentMusic,playError,onPost,onSave`)만으로 동작한다.
- **[Fact]** `hooks/queue/useQueueSync.ts:17-37`(최초 로드)과 `:39-52`(1500ms 디바운스 업데이트) 둘 다 `catch` 블록에서 `setIsSyncEnabled(false)`만 하고 재시도 로직이 없다. `isSyncEnabled`를 다시 `true`로 되돌리는 코드는 파일 전체에 없다(grep 확인) — `enabled`가 `false`→`true`로 바뀌는 경우(로그인 전환)에만 첫 effect가 재실행되며 그 안에서 `setIsSyncEnabled(true)`로 리셋된다(`:20`). 즉 **같은 로그인 세션 안에서 한 번 실패하면 그 세션 동안은 재시도 경로가 없다.**
- **[Fact]** player 도메인 테스트는 `RightPanel.test.tsx` 1개뿐이고(8개 케이스), 전부 풀플레이어 오버레이 열기/닫기(#119/#120) 특성화 테스트다 — selector 재분배, `usePlayback`의 엔진 마운트, `useQueueSync`의 재시도 동작을 검증하는 테스트는 하나도 없다.
- **[Inference]** `usePlayback`이 두 엔진 훅을 무조건 호출하는 방식은 실수라기보다 **React Hooks 규칙(조건부 훅 호출 금지)을 우회한 결과**로 보인다 — "provider가 바뀔 때만 해당 훅을 마운트"하려면 훅 레벨이 아니라 컴포넌트(JSX 조건부 렌더링) 레벨에서 분기해야 하는데, 지금 구조는 훅 레벨에서 "둘 다 부르고 결과만 고른다"는 손쉬운 우회를 택했다. 이 저장소에 이 판단을 설명하는 커밋 메시지나 PR 논의는 없다(`git log`상 player 도메인 관련 커밋에 관련 논의 없음, 초기 커밋에 이미 포함).
- **[Hypothesis]** `RightPanel`이 대표로 구독하는 이유는 "여러 자식이 같은 여러 필드를 동시에 필요로 하니 한 번에 구독해서 내려주면 리렌더가 줄어들 것"이라는 (검증되지 않은) 가정이었을 수 있다 — 그러나 실제로는 자식이 `memo`가 아니라서 이 가정이 성립하지 않고, 오히려 11개 필드 중 무엇이 바뀌든 두 자식이 함께 리렌더된다.

### 증상 → 원인 체인

**증상 A(구독 경계)**: RightPanel이 11개 selector를 구독해 자식에 재분배하고, 같은 트리의 NowPlaying은 다른 4개를 직접 구독한다.
→ (왜?) 직접 원인: "부모가 대표 구독 후 props로 전달"과 "자식이 직접 구독"을 언제 쓸지 정한 규칙이 코드에도 문서에도 없다.
→ (왜?) 구조 원인: `PlaybackProvider`가 이미 "변경 빈도"라는 기준으로 Context를 분리하는 정교한 패턴을 도입했지만, 이 기준이 "재생 엔진 파생값(ref/progress)"에만 적용되고 **도메인 상태(currentMusic 등)나 그 바깥 트리(RightPanel/MiniPlayerBar/QueueList)로는 일반화되지 않았다.**

**증상 B(엔진 동시 마운트)**: `usePlayback`이 provider와 무관하게 `useItunesHook`+`useYouTubeHook`을 항상 호출해 `<audio>`와 YT.Player가 동시에 살아있다.
→ (왜?) 직접 원인: 두 훅 다 Rules of Hooks를 지키기 위해 무조건 호출되고, 각자의 마운트 이펙트가 provider 여부와 무관하게 실행된다.
→ (왜?) 구조 원인: "provider별로 다른 재생 엔진을 완전히 갈아 끼운다"는 전략 패턴이 필요한 지점인데, 현재 구현은 훅 레벨에서 분기해 "둘 다 부르고 하나만 쓴다"는 형태로 우회했다 — 컴포넌트 레벨 조건부 마운트(JSX 분기)라는 대안이 검토되지 않았거나 기각된 흔적이 코드에 없다.

**증상 C(큐 동기화 영구 중단)**: `useQueueSync`가 실패 후 재시도 없이 그 세션 동안 계속 비활성 상태로 남는다.
→ (왜?) 직접 원인: 실패 처리가 `setIsSyncEnabled(false)` 한 줄로 끝나고, 재시도·백오프·수동 재활성화 경로가 없다.
→ (왜?) 구조 원인: 이 훅은 TanStack Query 없이 `useState`+`useEffect`+`setTimeout`으로 서버 동기화를 직접 구현한다 — 재시도는 TanStack Query가 기본 제공하는 기능인데, 이 훅만 그 인프라 밖에 있다(다른 서버 상태 대부분은 이미 TanStack Query로 이전됨 — `docs/component-hook-audit/index.html`의 전제 정정 참고).

### 아키텍처 관점

- 이 패턴(zustand 구독 경계 미정의)은 player 도메인에 국한되지 않는다 — 같은 감사 문서에서 앱 셸(#259)·피드/검색(#260)·프로필(#261)에도 유사한 "구독 방식이 컴포넌트마다 다름" 문제가 별도로 등록돼 있다. 저장소 전역 패턴이지만, **이번 사이클의 범위는 player 도메인으로 한정한다**(Out of Scope 참고) — 전역 규칙화는 각 도메인이 실제로 정리된 뒤에 근거를 모아 별도로 판단하는 게 안전하다(지금 하나의 사례만 보고 전역 규칙을 성급히 못 박으면, 다른 3개 도메인의 실제 제약을 반영하지 못한 규칙이 될 위험이 있다).
- `PlaybackProvider`의 변경-빈도 기반 Context 분리는 **기존 컨벤션과 충돌하지 않는다** — 오히려 이번 사이클이 따라야 할 유일한 기존 선례다. 이 사이클은 이 패턴을 뒤엎는 게 아니라 적용 범위를 넓히는 작업이다.
- `usePlayback`의 "둘 다 부르고 하나만 쓰기"는 애초에 근거가 약했던 결정이라기보다, **당시엔 몰랐던 비용(리소스 중복, store 필드 병렬 구독)이 나중에 알려진 경우**로 보인다 — Rules of Hooks 제약 자체는 여전히 유효하므로, 해결책은 "규칙을 어기기"가 아니라 "분기 위치를 훅에서 컴포넌트로 옮기기"가 돼야 한다(ADR에서 구체화).

### 비판적 재검토 (사용자 문제 제기에 대한 반박 질문과 답)

- **이 증상이 정말 구조 문제인가, 우연한 버그인가?** 구조 문제다. RightPanel의 11-selector 패턴은 파일 전체에 일관되게 적용된 설계이지 오타나 누락이 아니고, `usePlayback`의 이중 호출도 두 훅 모두 완전한 부수효과(이펙트 5~6개씩)를 가진 채로 항상 함께 존재한다 — 한 줄만 고치면 되는 버그가 아니라 "언제 무엇을 구독/마운트할지"에 대한 설계 공백이다.
- **지금 안 고치면 다음 몇 번의 변경에서 구체적으로 어떤 비용이 드는가?** (1) 다음에 플레이어 관련 컴포넌트를 추가하는 개발자는 RightPanel의 재분배 패턴과 NowPlaying의 직접구독 패턴 중 아무 근거 없이 하나를 골라야 한다. (2) 재생 엔진을 하나 더 추가하면(예: 팟캐스트, 로컬 파일) 같은 "무조건 호출" 패턴이 세 번째로 반복돼 리소스 낭비가 선형으로 늘어난다. (3) `useQueueSync`가 한 번이라도 실패하면(백엔드 일시 장애 등) 그 세션의 나머지 동안 사용자의 큐 변경 사항이 전혀 서버에 반영되지 않는데, 사용자에게 그 사실이 전혀 노출되지 않는다 — 지금은 재현되지 않았지만 백엔드 배포 중 일시 실패만으로도 트리거될 수 있는 조용한 데이터 손실 경로다.
- **더 급한 다른 문제를 가리는 건 아닌가?** 아니다. `docs/component-hook-audit/index.html` 기준 7개 도메인 37건 중 심각도 "심각"은 player(2건)와 playlist(2건)뿐이고, 사용자가 두 도메인을 비교한 뒤 영향 범위(재생은 앱 전역에서 항상 활성)를 이유로 player를 명시적으로 선택했다.

## 목표와 범위

### Goal

player 도메인의 zustand 구독 경계를 명확한 규칙으로 통일하고, `usePlayback`의 재생 엔진을 provider에 맞게 조건부로만 마운트하며, `useQueueSync`에 재시도 경로를 추가한다 — 재생 관련 사용자 동작은 전혀 바꾸지 않는다.

### Success Criteria

1. `RightPanel`이 자식에게 전달하는 값 중 **자식이 사용하지 않고 그대로 다시 전달만 하는 prop이 0개**다.
2. `usePlayback`이 현재 `currentMusic.provider`가 아닌 엔진의 마운트 부수효과(`<audio>` 엘리먼트 생성, YT.Player 인스턴스 생성)를 실행하지 않는다 — 테스트로 검증 가능한 형태로.
3. `useQueueSync`가 동기화 실패 후에도 재시도 경로를 가진다(영구 중단 제거).
4. 기존 246개 테스트가 전부 통과하고, player 도메인에 이번 변경을 검증하는 신규 특성화/회귀 테스트가 추가된다.

### Out of Scope

- 재생 UI/UX 변경(레이아웃, 인터랙션, 시각 디자인)
- 새로운 재생 프로바이더 추가
- 서버(API, now-playlist 엔드포인트) 변경
- 앱 셸(#259)·피드/검색(#260)·플레이리스트(#253)·프로필(#261) 등 다른 도메인의 유사 구독 패턴 통일 — 각각 별도 이슈

### 우선 품질 속성

**장애 격리/복원력**을 최우선으로 한다(사용자 선택). `useQueueSync`처럼 "실패해도 로컬 재생은 계속 동작해야 한다"는 제약과, `usePlayback`이 provider별로 독립적으로 동작해 한쪽 엔진의 문제가 다른 쪽에 새지 않아야 한다는 방향으로 구현 판단을 내린다. 테스트성은 이 목표를 검증하는 수단으로 함께 따라온다(현재 player 도메인 테스트가 1개뿐이라는 안전망 공백 자체가 장애 격리를 확인할 방법이 없었다는 뜻이기도 하다).

### 라이브러리 도입

이번 사이클은 새 라이브러리를 도입하지 않는다 — 기존 zustand selector, React Context, TanStack Query(`useQueueSync`를 `useMutation`/`retry` 옵션으로 옮기는 정도)로 9건 모두 해결 가능하다는 게 진단 결과다. ADR 단계에서 대안을 비교하다 이 전제가 깨지면(예: 예상보다 복잡도가 커지면) 별도로 재검토한다.

## Behavior Invariants

- 곡 재생/일시정지/이전곡/다음곡, 큐 조작(추가/제거/순서변경/전체비우기), 볼륨 조절, 시크(seek) 등 사용자가 체감하는 재생 동작은 이번 변경 전후로 동일하다.
- iTunes ↔ YouTube 재생 프로바이더 전환이 매끄럽게 유지된다(전환 시 오디오 끊김, 이중 재생, 조작 불가 등 회귀 없음).
- now-playlist 서버 동기화가 실패해도 로컬 재생(현재 곡 재생, 큐 조작)은 계속 정상 동작한다.
- 재생 실패 시 사용자에게 보이는 에러 메시지(`playError`)와 그 표시 위치는 유지된다.
- 풀플레이어 오버레이 열기/닫기(앨범아트 클릭, X 버튼, ESC, 뒤로가기, 스와이프 다운) 동작은 `RightPanel.test.tsx`에 이미 특성화돼 있으며 그대로 유지된다.

## 기준선 검증

| 명령               | 결과    | 실패 항목 | 비고                                                                                                                                                                                                                             |
| ------------------ | ------- | --------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm lint`        | ✅ 통과 | 없음      | 6개 패키지 전부 캐시 히트                                                                                                                                                                                                        |
| `pnpm check-types` | ✅ 통과 | 없음      | web은 `next typegen && tsc --noEmit`까지 포함                                                                                                                                                                                    |
| `pnpm test`        | ✅ 통과 | 없음      | 44개 테스트 스위트, 246개 테스트 전부 통과(6.877s). player 도메인은 `RightPanel.test.tsx` 1개뿐(8케이스, 풀플레이어 오버레이 열기/닫기만 검증) — **안전망 공백**: selector 재분배, 엔진 마운트, 큐 재시도를 검증하는 테스트 없음 |
| `pnpm build`       | ✅ 통과 | 없음      | `apps/web` Next.js 프로덕션 빌드 성공(17.5s), 정적/동적 라우트 12개 정상 생성                                                                                                                                                    |

작업 트리는 이 사이클의 `brief-original.md` 외에는 깨끗한 상태(`git status --short` 확인).

변경 영향 예상 파일: `components/player/{RightPanel,NowPlaying,MiniPlayerBar,QueueList}.tsx`, `components/player/nowPlaying/{PlaybackProvider,NowPlayingCoverPlayback,NowPlayingMetaActions,NowPlayingProgressTick,NowPlayingControlsStatic}.tsx`, `hooks/player/{usePlayback,useItunesHook,useYouTubeHook}.ts`, `hooks/player/youtube/*.ts`, `hooks/queue/{useQueueSync,useGuestQueueSession}.ts`, `stores/usePlayerStore.ts`(읽기 전용, 수정 여부는 ADR에서 결정) — 약 12~15개 파일.

---

**[GATE 1]** 위 진단·목표·범위·Behavior Invariants·기준선을 확인해주시면 다음 단계(ADR)로 넘어가겠습니다.
