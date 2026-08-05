# ADR — player-subscription-boundary

## 3안 비교

PRD 범위(A: 구독 경계, B: 엔진 동시 마운트, C: 큐 재시도)를 관통하는 세 가지 해결 수준을 비교한다.

### 안 1 — 최소 개선안 (patch in place)

- **A**: 구조는 그대로 두고, `RightPanel`이 자식에게 전달하지만 자식이 그대로 다시 넘기기만 하는(순수 통과) 필드만 국소적으로 제거한다. `NowPlaying`/`MiniPlayerBar`/`QueueList`가 해당 필드만 `usePlayerStore`에서 직접 구독하도록 바꾸되, "합성 컴포넌트는 조립만, 리프는 직접 구독"이라는 규칙을 문서화하지는 않는다.
- **B**: `useItunesHook`/`useYouTubeHook`의 리소스 생성 이펙트 최상단에 `if (!isItunes) return;` / `if (!isYoutube) return;` 가드를 추가한다. 두 훅은 여전히 `usePlayback`에서 항상 호출된다.
- **C**: `useQueueSync`에 실패 횟수 카운터 + `setTimeout` 기반 수동 재시도(지수 백오프)를 직접 추가한다. TanStack Query로 옮기지 않는다.

### 안 2 — 경계 재설계안

- **A**: "합성 컴포넌트(RightPanel)는 레이아웃 조립 책임만, 실제 소비 컴포넌트가 직접 구독"이라는 규칙을 명시적으로 채택한다. `RightPanel`에서 재생 상태 관련 selector 7개(`currentMusic,isPlaying,selectMusic,clearQueue,removeFromQueue,moveUp,moveDown,moveTo,playPrev,playNext` 중 자식에게 그대로 넘기던 것들)를 제거하고, `NowPlaying`/`MiniPlayerBar`/`QueueList`가 각자 필요한 필드를 `usePlayerStore`에서 직접 구독한다. `RightPanel`에는 `isFullPlayerOpen` 등 자신의 로컬 UI 상태만 남는다.
- **B**: `PlaybackProvider`(또는 그 바로 아래)에서 `provider` 값에 따라 **JSX 레벨로 분기**해 활성 엔진의 훅만 호출하는 자식 컴포넌트를 렌더한다 — 예: `provider === 'youtube' ? <YouTubeEngine>...</YouTubeEngine> : <ItunesEngine>...</ItunesEngine>`. 각 Engine 컴포넌트는 자신의 단일 훅만 호출하므로, React가 비활성 엔진의 훅/이펙트를 실제로 마운트하지 않는다(early-return 흉내가 아니라 진짜 unmount).
- **C**: `useQueueSync`를 TanStack Query(`useQuery`+`useMutation`, `retry`/`retryDelay` 옵션)로 재작성한다. 이미 저장소 전역에 도입된 라이브러리를 더 쓰는 것이므로 "새 라이브러리 도입"에 해당하지 않는다.

### 안 3 — 검증된 도구 도입안 / 자체 구현안 (전략 패턴 + 레지스트리)

- **A, C**: 안 2와 동일.
- **B**: 안 2의 JSX 조건부 마운트에서 한 단계 더 나아가, 재생 엔진을 공통 인터페이스로 추상화한다.
  ```ts
  interface PlaybackEngine {
    containerRef: React.RefObject<HTMLDivElement | null> | null;
    seekToMs: (ms: number) => void;
    positionMs: number;
    durationMs: number;
  }
  ```
  `useItunesHook`/`useYouTubeHook`을 이 인터페이스의 구현체로 정리하고, `provider → Engine 컴포넌트` 매핑을 레지스트리(`ENGINE_REGISTRY: Record<MusicProvider, EngineComponent>`)로 관리한다. 향후 재생 프로바이더가 추가되면 레지스트리에 항목 하나만 추가하면 된다.
- **검토했으나 기각한 라이브러리 후보**: XState(재생 엔진 전환을 상태머신으로 모델링). 아래 "라이브러리 도입 심사" 참고 — 최종적으로 **자체 구현(전략 패턴 + 레지스트리)**을 택하고 새 라이브러리는 도입하지 않는다.

## 비교표 (10개 고정 기준)

| #   | 기준                 | 안 1                                                                                | 안 2                                                               | 안 3(채택)                                                  |
| --- | -------------------- | ----------------------------------------------------------------------------------- | ------------------------------------------------------------------ | ----------------------------------------------------------- |
| 1   | 근본 원인 해결력     | 낮음 — B는 최초 마운트 시점의 provider만 반영되고 이후 전환에 반응 안 함(아래 참고) | 높음 — A/B/C 모두 구조적으로 해결                                  | 높음 + 확장성(향후 엔진 추가 대비)                          |
| 2   | 동작 보존 난이도     | B가 오히려 함정(아래 참고)이라 중간                                                 | 중간 — 마운트/언마운트 타이밍 주의 필요                            | 중간 — 인터페이스 정확성까지 함께 검증 필요                 |
| 3   | 책임·의존성 변화     | 거의 없음                                                                           | RightPanel 책임 축소, PlaybackProvider 책임 확대                   | 여기에 엔진 추상화 계층 추가                                |
| 4   | 테스트 용이성        | 제한적(구조 그대로)                                                                 | 좋음(컴포넌트 분리로 독립 테스트)                                  | 가장 좋음(인터페이스 단위 mock 가능)                        |
| 5   | 변경 범위            | 가장 작음                                                                           | 중간(파일 12~15개)                                                 | 중간~큼(레지스트리 파일 추가)                               |
| 6   | 점진적 전환 가능성   | 좋음                                                                                | 좋음(A/B/C 순차 진행 가능)                                         | B는 이슈 내에서 일괄 도입 필요(부분 도입 시 패턴 혼재)      |
| 7   | 롤백 가능성          | 쉬움                                                                                | 중간(git revert로 안전)                                            | 중간(레지스트리까지 되돌리려면 파일 더 많음)                |
| 8   | 성능·운영 영향       | B 효과 불완전(아래 참고)                                                            | 리소스 낭비 근본 해결                                              | 안 2와 동일 + 향후 확장 비용 절감                           |
| 9   | 기존 코드와의 일관성 | 구조 유지(문제도 유지)                                                              | `PlaybackProvider`의 기존 Context 분리·JSX 조건부 렌더 패턴과 일관 | 인터페이스/레지스트리는 저장소에 선례 없는 새 패턴          |
| 10  | 유지 비용            | 구조적 문제 미해결로 장기 재발 위험                                                 | 낮음(경계 명확)                                                    | 지금 당장은 추상화 자체의 학습 비용, 엔진이 늘어나면 낮아짐 |

**안 1의 B가 근본적으로 취약한 이유(코드 근거)**: `useItunesHook`의 Audio 생성 이펙트(`useItunesHook.ts:41-55`)는 의존성 배열이 `[setVolume]`뿐이라 **마운트 시 1회만 실행**된다. 가드(`if (!isItunes) return;`)를 최상단에 추가해도, 마운트 시점에 `isItunes`가 `false`였다가 이후 사용자가 iTunes 곡을 재생해 `isItunes`가 `true`로 바뀌면 이 이펙트는 다시 실행되지 않으므로 **영원히 Audio 엘리먼트가 생성되지 않는 회귀**가 생긴다. 이를 막으려면 `isItunes`를 의존성에 추가해야 하는데, 그러면 매 provider 전환마다 Audio를 파괴·재생성하게 되어 "최소 변경"이라는 안 1의 장점이 사라진다. YouTube 쪽(`useYouTubePlayer.ts`)도 마운트 시 1회 실행되는 초기화 이펙트라 동일한 함정이 있다.

## 라이브러리 도입 심사 — XState(기각)

| 항목                           | 검토 결과                                                                                                                                                                                                                                    |
| ------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 해결 책임과 핵심 추상화의 일치 | 상태머신은 다수 상태·복잡한 전이·병렬 상태에 강점이 있는데, 이 문제는 `provider`(`itunes`\|`youtube`) 2값 분기 하나뿐이다 — 문제 크기 대비 추상화가 과하다.                                                                                  |
| Next.js/React 버전 호환성      | `@xstate/react`는 React 18+ 호환, 이 저장소(React 19 계열) 사용에 기술적 장벽은 없음.                                                                                                                                                        |
| SSR/RSC/브라우저 제약          | 플레이어 컴포넌트는 이미 전부 `'use client'`라 문제 없음.                                                                                                                                                                                    |
| 최근 릴리스·유지보수 상태      | 활발히 유지됨(문제 되지 않음).                                                                                                                                                                                                               |
| 라이선스·보안                  | MIT, 문제 없음.                                                                                                                                                                                                                              |
| 번들·런타임 비용               | `xstate` 코어만 수십 KB 추가 — 2값 분기 하나를 위해 들이기엔 과함.                                                                                                                                                                           |
| 제거 비용                      | 도입 시 상태머신 정의·React 바인딩이 여러 컴포넌트에 스며들어, 나중에 제거하려면 다시 조건부 렌더링으로 되돌리는 작업이 필요 — 지금 안 도입하는 것보다 되돌리는 비용이 더 큼.                                                                |
| 실제로 삭제되는 기존 코드/책임 | 없음 — `provider === MusicProvider.YOUTUBE` 삼항 분기 한 줄을 상태머신 정의로 바꾸는 것뿐이라, 삭제되는 복잡도가 없고 오히려 새 개념(states/transitions/guards/actors)을 팀이 익혀야 한다.                                                   |
| **결론**                       | **기각.** 저장소에 XState 사용 이력이 없어 버스팩터 비용도 크다(사용자 확인). 안 3은 새 라이브러리 없이 TypeScript 인터페이스 + 컴포넌트 레지스트리(이미 저장소 곳곳에서 쓰는 패턴)만으로 같은 목표(조건부 마운트 + 확장 용이성)를 달성한다. |

## 의사결정 인터뷰 로그

**Q. 재생 엔진 마운트 문제(B)를 어느 수준까지 고칠까요? 안 2는 JSX 조건부 마운트로 직접 문제(두 엔진 동시 생성)만 고치고, 안 3은 여기서 더 나아가 provider→엔진 매핑을 레지스트리로 추출해 향후 재생 엔진 추가를 대비합니다.**
A. 안 3 — 전략 패턴 + 레지스트리. (옵션 설명에 "지금 당장 프로바이더를 더 추가할 계획이 없다면 이 추상화의 효용을 지금 증명하기 어렵다"는 안 2 쪽 반론이 제시됐음에도, 향후 확장 대비를 우선해 안 3을 선택.)

**Q. 재생 엔진 전환을 XState 같은 상태머신 라이브러리로 모델링하는 안을 검토해보고 기각하려고 합니다 — 이유: 2개 상태(itunes\|youtube)만 있는 단순 분기에 상태머신 추상화는 과하고, 저장소에 XState 사용 이력이 없어 버스팩터 비용이 큽니다. 이대로 기각해도 될까요?**
A. 기각(추천대로). 자체 구현(전략 패턴 + 레지스트리)으로 진행.

## 결정 (Decision)

**채택안: 안 3.** 구체적으로는 안 2의 A(리프 직접 구독)·C(TanStack Query 기반 재작성)를 그대로 채택하고, B만 안 3의 전략 패턴 + 레지스트리 수준까지 확장한다. XState 등 새 라이브러리는 도입하지 않는다.

### Context

player 도메인은 이 저장소에서 유일하게 심각도 "심각" 발견이 2건(엔진 동시 마운트, 큐 동기화 영구 중단) 있는 도메인이고, 재생은 앱 전역에서 항상 활성 상태라 영향 범위가 크다. `PlaybackProvider`가 이미 변경 빈도 기반 Context 분리라는 검증된 패턴을 갖고 있어, 이번 사이클은 그 패턴을 일반화하는 자연스러운 다음 단계다.

### Alternatives

안 1(최소 개선안)은 B의 이펙트 의존성 함정 때문에 "최소 변경"이라는 장점이 실제로는 성립하지 않아 기각. 안 2(경계 재설계안)는 근본 해결력과 기존 코드 일관성 면에서 가장 우수했으나, 사용자가 향후 확장성을 더 우선해 안 3을 선택. 안 3 안에서 검토된 XState 기반 하위 대안은 문제 크기 대비 추상화 과잉으로 기각.

### Consequences

- 좋음: RightPanel의 이중 전달 제거, 엔진 리소스 낭비 해결, 큐 동기화 복원력 확보, 향후 재생 프로바이더 추가 시 레지스트리 등록만으로 확장 가능.
- 트레이드오프: `PlaybackEngine` 인터페이스와 `ENGINE_REGISTRY`라는 새 개념이 코드베이스에 추가된다 — 다음 개발자가 "왜 이렇게 추상화돼 있는가"를 이해해야 하는 진입 장벽이 소폭 생긴다. 이 문서(ADR)가 그 근거를 남긴다.
- `useQueueSync`가 TanStack Query 기반으로 바뀌면서 `useState`/`setTimeout` 대신 `useMutation`의 `onMutate`/디바운스 처리 방식을 새로 설계해야 한다(1500ms 디바운스 유지, 아래 체크포인트 참고).

### Migration

체크포인트 이슈 순서(아래)를 따라 A → B → C 순으로(또는 병렬 가능, 서로 의존하지 않음) 단계적으로 전환한다. 각 체크포인트는 이전 체크포인트가 머지된 상태에서도 저장소가 정상 동작해야 한다.

### Rollback

각 체크포인트는 독립된 PR/커밋 단위라 `git revert`로 개별 롤백 가능하다. 가장 리스크가 큰 체크포인트(B: 엔진 조건부 마운트)는 `usePlayback.ts`/`PlaybackProvider.tsx`/신규 `ItunesEngine.tsx`·`YouTubeEngine.tsx`·`engineRegistry.ts`에 변경이 집중되므로, 문제가 생기면 이 커밋 하나만 되돌리면 A·C는 영향받지 않는다.

## 회귀 안전망

우선순위: Characterization → Contract → State-transition → Integration → E2E.

- **Characterization**: 리팩터링 착수 전, 현재 동작(RightPanel의 정확한 prop 전달 셋, `usePlayback` 마운트 시 두 엔진 모두 생성됨, `useQueueSync` 실패 후 재시도 없음)을 테스트로 고정한다 — 이 중 뒤의 두 개는 리팩터링 후 **의도적으로 깨져서 새 기대값으로 갱신**된다(정상적인 특성화 테스트 갱신 흐름).
- **Contract**: `usePlayerStore` 액션 시그니처(playMusic/selectMusic/playPrev/playNext 등)는 변경하지 않으므로 최소 스모크 테스트만 추가.
- **State-transition**: 곡 선택→재생, 트랙 종료→다음곡 자동 재생, provider 전환(iTunes↔YouTube) 시 재생 상태 유지.
- **Integration**: RightPanel·NowPlaying·MiniPlayerBar·QueueList 조합 렌더, 풀플레이어 오버레이(기존 8케이스).
- **E2E**: 범위 밖 — 이 저장소에 `apps/web` E2E 프레임워크가 없다(`apps/api`만 `test:e2e` 보유). dev 서버 수동 확인으로 대체(각 체크포인트 구현 후, 그리고 최종 result.md 단계에서 필수 수행).

### 최소 회귀 시나리오

| 시나리오                                                                                             | 유형                   | 우선순위        |
| ---------------------------------------------------------------------------------------------------- | ---------------------- | --------------- |
| iTunes 곡 재생 중 볼륨 조절이 정상 반영된다                                                          | State-transition       | 높음            |
| YouTube 곡 재생 중 볼륨 조절이 정상 반영된다                                                         | State-transition       | 높음            |
| iTunes 곡 재생 중에는 YouTube 엔진의 마운트 이펙트(스크립트 로드/Player 생성)가 실행되지 않는다      | Contract(신규)         | 높음            |
| YouTube 곡 재생 중에는 iTunes 엔진의 마운트 이펙트(Audio 생성)가 실행되지 않는다                     | Contract(신규)         | 높음            |
| 곡 전환(iTunes→YouTube, YouTube→iTunes) 후에도 재생/일시정지/이전/다음이 정상 동작한다               | State-transition       | 높음            |
| 트랙 종료 시 다음 곡이 자동 재생된다(iTunes `ended` 이벤트, YouTube 유사 로직)                       | State-transition       | 높음            |
| RightPanel/NowPlaying/MiniPlayerBar/QueueList가 함께 렌더될 때 현재 곡·재생 상태가 일관되게 표시된다 | Integration            | 높음            |
| 풀플레이어 오버레이 열기/닫기(기존 8케이스)가 그대로 동작한다                                        | Integration            | 중간(이미 커버) |
| `useQueueSync` 최초 로드 실패 시 재시도가 시도된다                                                   | Contract(신규)         | 높음            |
| `useQueueSync` 업데이트 실패 후 재시도, 재시도 성공 시 동기화가 복구된다                             | State-transition(신규) | 높음            |
| 큐 동기화가 실패한 상태에서도 로컬 재생·큐 조작은 정상 동작한다(Behavior Invariant)                  | Integration            | 높음            |
| 비로그인 게스트 세션(`useGuestQueueSession`)이 서버 동기화 변경에 영향받지 않는다                    | Contract               | 중간            |

## 체크포인트 이슈 목록

각 이슈는 머지 후에도 저장소가 정상 동작 상태를 유지한다. CP2·CP3·CP4는 서로 독립적이라 순서를 바꾸거나 병렬 진행 가능하지만, 전부 CP1(안전망)이 선행돼야 한다.

1. **CP1 — 안전망: player 도메인 특성화 테스트 추가**
   프로덕션 코드는 건드리지 않고, 위 회귀 시나리오 표의 "Characterization" 대상(RightPanel 현재 prop 전달, `usePlayback` 이중 마운트, `useQueueSync` 무재시도)을 테스트로 고정한다.

2. **CP2 — 구독 경계 정리 (A)**
   `RightPanel`에서 순수 통과 selector 제거, `NowPlaying`/`MiniPlayerBar`/`QueueList`가 필요한 필드를 `usePlayerStore`에서 직접 구독하도록 전환. Success Criteria ①.

3. **CP3 — 재생 엔진 전략 패턴 + 레지스트리 전환 (B)**
   `PlaybackEngine` 인터페이스 정의, `useItunesHook`/`useYouTubeHook`을 각각 `ItunesEngine`/`YouTubeEngine` 컴포넌트로 감싸 JSX 조건부 마운트로 전환, `ENGINE_REGISTRY`로 provider→엔진 매핑. `usePlayback.ts`는 이 시점에 제거되거나 얇은 어댑터로 축소될 수 있음(구현 중 판단). Success Criteria ②.

4. **CP4 — 큐 동기화 TanStack Query 전환 (C)**
   `useQueueSync`를 `useQuery`(초기 로드) + `useMutation`(디바운스 업데이트, `retry`/`retryDelay`)로 재작성. 1500ms 디바운스는 유지. Success Criteria ③.

5. **CP5 — 정리 및 문서 갱신**
   CP2~CP4로 인해 죽은 코드(예: 안 쓰이게 된 `usePlayback.ts`, 기존 특성화 테스트 중 "의도적으로 깨진" 기대값 갱신)를 제거·갱신하고, `docs/component-hook-audit/index.html#dom-player`의 해당 발견 항목에 해소 상태를 반영할지 검토. Success Criteria ④(전체 테스트 통과) 최종 확인.

---

**[GATE 2]** 위 대안 비교·의사결정 인터뷰·회귀 안전망·체크포인트 분해를 확인해주시면 실제 이슈를 생성하고 구현에 착수하겠습니다.
