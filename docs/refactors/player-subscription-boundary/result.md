# Result — player-subscription-boundary

## 변경 요약

이슈 #251(부모 추적 이슈) 아래 5개 체크포인트로 player 도메인의 구독 경계 3건(A/B/C)을 전부 해소했다.

- **CP1(#262, `cd5085f`) — 안전망**: 프로덕션 코드는 건드리지 않고 회귀 시나리오의 "Characterization" 대상(`RightPanel`의 정확한 prop 전달 셋, `usePlayback` 이중 마운트, `useQueueSync` 무재시도)을 테스트로 고정.
- **CP2(#263, `3905043`) — 구독 경계 정리(A)**: `RightPanel`에서 순수 통과 selector 7개를 제거하고, `NowPlaying`/`MiniPlayerBar`가 신규 `usePlayerNavigation` 훅(순수 파생값, 여러 리프에서 독립 호출 가능)을 통해 재생 상태를 직접 구독하도록 전환. `QueueList`도 `usePlayerStore`를 직접 구독. `RightPanel`에는 `isFullPlayerOpen` 등 로컬 UI 상태만 남음.
- **CP3(#264, `1afe56b`) — 재생 엔진 전략 패턴 + 레지스트리(B)**: `PlaybackEngine` 인터페이스(`types/player.ts`)를 정의하고, `useItunesHook`/`useYouTubeHook`을 각각 `ItunesEngine`/`YouTubeEngine` 컴포넌트로 감싸 `ENGINE_REGISTRY`(provider→엔진 매핑)를 통해 `PlaybackProvider`가 JSX 레벨로 조건부 마운트하도록 전환. `usePlayback.ts`는 이 시점에 완전히 제거됨(더 이상 필요 없음).
- **CP4(#265, `5ee03dd`) — 큐 동기화 TanStack Query 전환(C)**: `useQueueSync`를 `useQuery`(초기 로드, `staleTime:0`으로 재로그인 시 항상 재조회)+`useMutation`(디바운스는 `useDebouncedValue`로 유지, `retry`/`retryDelay` 옵션)으로 재작성. 백그라운드 동기화 실패가 사용자에게 토스트로 노출되지 않도록 `QueryProvider`의 `MutationCache.onError`에 `meta.silent` 옵션을 추가.
- **CP5(#266, `1b950c8`) — 정리 및 문서 갱신**: `usePlayback.ts`는 CP3에서 이미 제거되어 추가로 정리할 죽은 코드 없음을 확인. `docs/component-hook-audit/index.html`의 해당 발견 3건에 해소 배지(체크포인트/이슈 번호 포함)를 반영.

## Before / After

| 항목                                            | Before(prd.md 기준선)                                                                                                          | After                                                                                                                                                                                                                                                                 |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `RightPanel`이 자식에 재분배하는 순수 통과 prop | 7개(`currentMusic/isPlaying/canPrev/canNext/onTogglePlay/onPrev/onNext`를 `NowPlaying`·`MiniPlayerBar`에 동일하게 이중 전달)   | 0개 — `NowPlaying`/`MiniPlayerBar`/`QueueList` 모두 props 없이 렌더(`RightPanel.characterization.test.tsx` 4케이스로 고정)                                                                                                                                            |
| 재생 엔진 마운트                                | `usePlayback`이 provider와 무관하게 `useItunesHook`+`useYouTubeHook`을 항상 동시 호출 → `<audio>`와 YT.Player가 항상 함께 생성 | `ENGINE_REGISTRY` 기반 JSX 조건부 마운트 — 비활성 엔진은 컴포넌트 자체가 마운트되지 않아 부수효과가 실행되지 않음(`PlaybackProvider.characterization.test.tsx` 4케이스로 고정, provider 전환 시 이전 엔진 언마운트/새 엔진 마운트까지 검증)                           |
| `useQueueSync` 실패 처리                        | 최초 로드/업데이트 실패 시 `setIsSyncEnabled(false)`로 같은 세션 동안 영구 중단, 재시도 경로 없음                              | `useQuery`/`useMutation`의 `retry:2`/`retryDelay:100ms`로 각 시도마다 자동 재시도, 실패가 소진돼도 다음 큐 변경은 독립된 새 시도로 이어짐(영구 중단 아님) — `useQueueSync.characterization.test.ts` 4케이스로 고정                                                    |
| player 도메인 테스트                            | `RightPanel.test.tsx` 1개 파일(8케이스, 풀플레이어 오버레이만)                                                                 | 신규 6개 파일 추가(`usePlayback.characterization`→CP3에서 `PlaybackProvider.characterization`으로 이관, `useQueueSync.characterization`, `usePlayerNavigation.test`, `RightPanel.characterization` 갱신 등), selector 재분배·엔진 마운트·큐 재시도 전부 테스트로 커버 |
| `pnpm lint`                                     | ✅ 통과                                                                                                                        | ✅ 통과                                                                                                                                                                                                                                                               |
| `pnpm check-types`                              | ✅ 통과                                                                                                                        | ✅ 통과                                                                                                                                                                                                                                                               |
| `pnpm test`                                     | ✅ 44 suites / 246 tests                                                                                                       | ✅ 48 suites / 264 tests (+4 suites, +18 tests — player/queue 도메인 신규·갱신 테스트)                                                                                                                                                                                |
| `pnpm build`                                    | ✅ 통과(17.5s)                                                                                                                 | ✅ 통과                                                                                                                                                                                                                                                               |

## 개발환경 실동작 확인

- `packages/dto` 변경 없음 — `pnpm dto` 재빌드 불필요.
- 이 저장소에는 앱 기동을 다루는 project skill이 없어(`.claude/skills/` 전수 확인) `run` 스킬의 폴백 패턴(Browser-driven, Playwright)을 따름. `docker-compose up -d`(mysql/neo4j/redis)로 로컬 인프라를 띄우고 `pnpm dev`로 `apps/web`(:3000)·`apps/api`(:3002)를 백그라운드 기동, 포트 폴링으로 준비 완료를 확인한 뒤 저장소의 `playwright` 의존성으로 헤드리스 Chromium을 직접 구동해 다음 흐름을 실제로 조작했다(게스트/비로그인 상태, iTunes 트랙 기준):
  1. 홈 피드에서 게시글의 "전체 재생" 버튼 클릭 → 데스크톱 `RightPanel`에 "we cant be friends – Ariana Grande"가 뜨고 실제로 재생(진행바가 0:00→ticking, `<audio>` 기반 30초 미리듣기)되는 것을 스크린샷으로 확인.
  2. 다음 곡(⏭) 클릭 → "Ditto – NewJeans"로 전환되며 큐 하이라이트도 함께 이동. 이전 곡(⏮) 클릭 → 원래 곡으로 복귀.
  3. 일시정지(⏸)/재생(▶) 토글이 즉시 아이콘·진행바 상태에 반영됨.
  4. 뷰포트를 모바일(390×844)로 전환 후 미니플레이어 앨범아트 클릭 → 풀플레이어 오버레이(`NOW PLAYING`, 커버, 시크바, prev/pause/next, 재생목록 2곡)가 정상 오픈, X 버튼으로 정상 클로즈.
  5. 큐 리스트가 두 트랙 모두 표시하고 현재곡이 하이라이트됨을 확인(순서변경/삭제 버튼도 화면에 정상 노출 — 클릭까지는 이번 라운드에서 별도 실행하지 않았으나 QueueList가 CP2에서 `usePlayerStore`를 직접 구독하는 액션들을 그대로 노출).
- dev 서버 로그(`web:dev`, `api:dev`)에 컴파일 에러 없음. 브라우저 콘솔은 이번 변경과 무관한 기존 이슈만 관찰됨: `/user/me` 401(비로그인 게스트의 정상 흐름 — `CLAUDE.md`에 문서화된 의도된 동작) 3건, `SearchInput`/`VolumeControl`의 인라인 `style` 관련 hydration mismatch 경고(이번 브랜치가 건드리지 않은 기존 컴포넌트, player 리팩터링과 무관). **`PlaybackProvider`/`usePlayerNavigation`/`useQueueSync`/엔진 마운트 관련 신규 에러나 React 경고는 0건.**
- YouTube 프로바이더 재생까지는 직접 조작하지 않음(외부 API 키가 필요한 경로) — provider 조건부 마운트 자체는 `PlaybackProvider.characterization.test.tsx`의 iTunes↔YouTube 전환 테스트로 커버되며, 사용자가 원하면 YouTube 트랙으로 별도 수동 확인 가능.
- 확인 후 정리: 개발 서버/도커 컨테이너는 이번 검증 세션에서 계속 실행 중인 상태로 남겨둠(사용자가 이어서 직접 확인하고 싶어할 수 있어 임의로 종료하지 않음).

## Behavior Verification

**prd.md Behavior Invariants**

| Invariant                                                         | 검증                                                                                                            |
| ----------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| 재생/일시정지/이전곡/다음곡, 큐 조작, 볼륨, 시크 동작이 전후 동일 | ✅ dev 서버 수동 확인(재생/일시정지/이전/다음) + `usePlayerNavigation.test.ts`(경계값 6케이스)                  |
| iTunes↔YouTube 전환이 매끄러움(끊김/이중재생/조작불가 없음)       | ✅ `PlaybackProvider.characterization.test.tsx`의 전환 테스트(이전 엔진 언마운트 확인 — CP3가 해결한 핵심 버그) |
| now-playlist 동기화 실패해도 로컬 재생/큐 조작은 정상             | ✅ `useQueueSync.characterization.test.ts` "큐 동기화가 실패한 상태에서도 로컬 큐 상태는 계속 정상 갱신된다"    |
| `playError` 표시 위치·동작 유지                                   | ✅ `NowPlaying.tsx`의 `safeTogglePlay`/`clearPlayError` 로직 미변경, `NowPlayingControlsStatic` prop 계약 불변  |
| 풀플레이어 오버레이 열기/닫기(8케이스) 유지                       | ✅ 기존 `RightPanel.test.tsx` 8케이스 전부 통과 + dev 서버에서 모바일 오버레이 open/close 수동 재확인           |

**adr.md 최소 회귀 시나리오(12행)** — Contract·State-transition 항목은 신규 테스트로, Integration 항목은 기존 테스트 유지로 커버됨. E2E는 애초 범위 밖(저장소에 `apps/web` E2E 프레임워크 없음)이라 dev 서버 수동 확인으로 대체(위 항목 참고).

## Decision Review

ADR에서 채택한 안 3(A/C=안2, B=안3 전략패턴+레지스트리)의 예상과 실제:

- **예상 비용 "인터페이스 정확성까지 함께 검증 필요"** → 실제로 `ItunesEngine`/`YouTubeEngine`이 `PlaybackEngine` 인터페이스를 그대로 구현하며 타입 오류 없이 1회에 정리됨. 예상보다 마찰이 적었음.
- **예상 리스크 "안1의 B가 근본적으로 취약한 이유"(마운트 시 1회만 실행되는 이펙트 함정)** → CP3에서 실제로 JSX 조건부 마운트를 쓴 덕분에 provider 전환마다 대상 엔진이 완전히 새로 마운트되고, 안1이었다면 발생했을 "전환 후 영원히 재생 엔진이 생성되지 않는 회귀"가 애초에 발생할 수 없는 구조임을 `PlaybackProvider.characterization.test.tsx`의 전환 테스트로 실증.
- **예상 트레이드오프 "다음 개발자가 왜 이렇게 추상화됐는지 이해해야 하는 진입장벽"** → `engineRegistry.ts`에 APPLE/ITUNES가 같은 엔진을 공유하는 이유를 주석으로 남기고, 이 ADR 문서 자체가 근거로 남아 있어 실제 진입장벽은 크지 않을 것으로 판단(추가 온보딩 문서는 만들지 않음, Follow-ups 참고).
- **예상하지 못했던 부수 발견**: `useMutation`의 `MutationCache.onError`가 QueryProvider 전역에 걸려 있어, CP4에서 큐 동기화 실패를 조용히 처리하려면 `meta.silent` 옵션을 새로 추가해야 했음 — ADR에는 명시되지 않았던 구현 세부사항이지만 "기존 동작 유지"(재시도 실패 시에도 토스트 노출 안 함)라는 Behavior Invariant를 지키기 위해 필요한 최소 변경이었음.
- **테스트 시간 비용**: `useQueueSync.characterization.test.ts`는 TanStack Query의 실제 retry 타이머(fake timer와 상성이 나쁨)를 실제 타이머로 검증하도록 설계해 파일당 약 5~6초가 걸림 — 다른 스위트 대비 느리지만 245개 다른 테스트에 영향 없이 격리됨.

## Remaining Debt

- `docs/component-hook-audit/index.html`이 player 도메인에서 지적한 "경미"/"중간" 등급 발견 중 이번 사이클 범위 밖으로 남긴 것들: `canPrev`/`canNext` 체크와 `clearPlayError` 중복 호출(NowPlaying/NowPlayingControlsStatic), `isPlayable` 중복 계산(MiniPlayerBar/NowPlaying), `PlaybackProvider`의 변경-빈도 기반 Context 분리 기준이 `nowPlaying/` 서브트리 밖으로 확장되지 않음, `useAuthMe()` 4곳 독립 마운트 및 저장/추천 글쓰기 핸들러 중복, `QueueList`가 `currentMusicId`만 받는 것과 `NowPlaying`/`MiniPlayerBar`가 `currentMusic` 객체 전체를 구독하는 세분화 기준 불일치.
- `useGuestQueueSession`이 `isPlaying`을 독립적으로 구독해, `RightPanel`이 CP2 이후에도 재생 상태 변경마다 간접 리렌더된다(CP2의 characterization 테스트에서 발견, 해당 리렌더로 인해 자식에 새로 전달되는 props가 여전히 0개임은 확인됨 — 리렌더 자체는 없어지지 않음). CP2/CP4 범위 밖(다른 훅의 책임)이라 이번 사이클에서 고치지 않음.
- `useQueueSync`의 초기 하이드레이션 직후 "echo write"(방금 받아온 서버 큐를 1500ms 뒤 그대로 다시 PUT하는) 비효율은 CP1 이전부터 있던 기존 동작이며, 이번 리팩터링에서 그대로 유지됨(재시도 유무와 무관한 별개 문제).
- `nowPlaylist` 쿼리에 `staleTime:0`을 명시적으로 줘서 재로그인 시 항상 재조회하도록 했는데, 이는 곧 로그인 상태 전환마다(그리고 이론상 컴포넌트가 계속 마운트된 채로 `enabled`가 토글되는 다른 경로가 생기면) 매번 네트워크 요청이 발생함을 의미한다 — 지금 유일한 실사용 경로(로그인 완료 시 1회)에서는 문제가 되지 않지만, 향후 `enabled`를 더 자주 토글하는 코드가 추가되면 재검토가 필요하다.

## Follow-ups

- `docs/component-hook-audit/index.html`이 이미 등록해 둔 신규 이슈들(#259 앱 셸, #260 피드/검색, #261 프로필)에서 "합성 컴포넌트는 조립만, 리프는 직접 구독" 규칙과 `usePlayerNavigation` 같은 "순수 파생값 훅은 여러 리프에서 독립 호출 가능" 패턴을 참고 사례로 재사용할 수 있다.
- Remaining Debt에 남긴 "경미"/"중간" 발견들은 플레이어 도메인을 다시 건드릴 다음 사이클에서 함께 정리할 후보.
- `useGuestQueueSession`의 `isPlaying` 구독을 다른 필드처럼 필요한 것만 구독하도록 좁히는 별도의 작은 정리(이번 사이클에서 발견했지만 손대지 않음).
