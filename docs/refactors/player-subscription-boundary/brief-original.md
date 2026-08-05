# 문제 영역

player 도메인 — zustand 구독 경계 불일치

## 관찰한 증상

- 컴포넌트 안에 컴포넌트를 넣을 때(RightPanel → NowPlaying/MiniPlayerBar/QueueList) 파라미터를 너무 많이 상속한다. zustand/TanStack Query 도입 목적에 맞지 않아 보인다.
- 같은 트리 안에서 어떤 값은 부모가 구독해 props로 내려주고, 어떤 값은 자식이 직접 구독하는 방식이 기준 없이 섞여 있다.

## 실제 사례

- `RightPanel.tsx:24-36` — `usePlayerStore` selector 11개를 개별 구독한 뒤, `currentMusic`/`isPlaying`/`canPrev`/`canNext`/`onTogglePlay`/`onPrev`/`onNext` 7개를 `NowPlaying`과 `MiniPlayerBar`에 완전히 동일하게 이중 전달.
- `NowPlaying.tsx:25-28`은 같은 스토어의 `volume`/`setVolume`/`playError`/`setPlayError`를 자기가 직접 구독 — 같은 트리에서 두 접근 방식이 공존.
- `usePlayback.ts:10-11` — `useItunesHook()`과 `useYouTubeHook()`이 현재 재생 provider와 무관하게 항상 둘 다 호출돼, 재생 중이 아닌 엔진의 `<audio>`/YT.Player 인스턴스와 이펙트가 항상 함께 돈다.
- `hooks/queue/useQueueSync.ts:10-52` — now-playlist 서버 동기화가 TanStack Query가 아닌 수동 폴링/디바운스이고, 실패 시 재시도 없이 영구 중단된다.
- 이슈 #251(부모 이슈)과 `docs/component-hook-audit/index.html#dom-player`(컴포넌트·훅 신호 경로 감사)에 총 9건이 파일:라인 근거와 함께 정리돼 있음.

## 초기 가설

- (가설) RightPanel이 자식 3개(NowPlaying/MiniPlayerBar/QueueList)를 대표해서 구독하는 값과, 각 자식이 직접 구독해도 되는 값의 경계 규칙이 없어서 두 방식이 뒤섞였다.
- (가설) `usePlayback`이 provider 분기 이전에 두 재생 엔진 훅을 무조건 호출하는 것은 설계 의도가 아니라 구현 편의(분기 로직을 나중에 넣음)로 생긴 결과다.
- `PlaybackProvider`(Context 2개로 ref/progress 분리)는 이미 검증된 패턴인데 그 경계가 `NowPlaying` 서브트리 밖으로 확장되지 않은 것도 같은 "경계 미정의" 문제의 일부로 보인다.

## 기대 효과

- RightPanel의 이중 prop 전달이 없어지면 11개 필드 중 하나만 바뀌어도 3개 자식이 전부 리렌더되는 문제가 해소된다.
- usePlayback이 provider에 따라 조건부로만 엔진을 마운트하면 재생 중이 아닌 엔진의 리소스 낭비와, 두 엔진이 같은 스토어 필드를 병렬로 쓰는 실질적 회귀 위험이 사라진다.
- 다음에 플레이어 관련 컴포넌트(예: 가사, 재생목록 편집)를 추가할 때 "이 값을 어떻게 구독해야 하는가"를 판단할 근거(경계 규칙)가 생긴다.

## 제약

- 재생 중 곡 전환, 큐 조작, 볼륨/시크 등 사용자가 체감하는 재생 동작은 전혀 바뀌면 안 된다.
- iTunes/YouTube 두 재생 프로바이더 전환이 매끄럽게 유지돼야 한다(오디오 끊김, 이중 재생 등 회귀 없이).
- now-playlist 서버 동기화가 실패해도 로컬 재생 자체는 계속 동작해야 한다(기존처럼).
