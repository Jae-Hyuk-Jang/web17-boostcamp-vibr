# Result — feed-search-domain

## 변경 요약

| 이슈 | 내용                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| #277 | `PostMedia.test.tsx` 신규 생성(전용 테스트 0개 → 10개). 착수 전 prop 기반 구현의 재생 아이콘 전환/`onPlay`/`onPlayAll` 호출을 `variant="card"`/`variant="modal"` 양쪽 파라미터화로 고정.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| #278 | `usePostMedia.ts`가 `currentMusicId`/`isPlayingGlobal`을 prop 대신 `usePlayerStore`에서 직접 구독하도록 전환. `PostCard.tsx`/`PostCardDetailModalDesktopShell.tsx`에서 `<PostMedia>`로의 해당 prop 전달 제거(`PostCard` 7개 prop → 5개). `onPlay`/`onPlayAll`은 caller별 부수효과(모달 경로의 `recordPlayedMusic` 로깅) 때문에 prop으로 유지. **구현 중 발견**: PRD/ADR은 `<PostMedia>` 호출부만 grep해 2곳(`PostCard`, `PostCardDetailModalDesktopShell`)이라 확인했는데, 실제로 `<PostCard>` 자체의 호출부는 `FeedList.tsx` 외에 `ProfilePostsFeed.tsx`(프로필 게시글 목록)에도 하나 더 있었다 — `PostCard`의 prop 인터페이스를 줄이려면 이 호출부도 같이 고쳐야 빌드가 유지돼 CP2 범위에 포함시켰다. `#277`에서 만든 테스트도 prop 없는 형태로 갱신(contract 테스트로 전환). |
| #279 | `usePostDetailModal.ts`의 반환 타입에서 더 이상 쓰이지 않는 `player.currentMusicId`/`player.isPlaying` 제거(UX 로깅용 로컬 `currentMusicId`/`isPlaying` 자체는 유지). `docs/component-hook-audit/index.html`의 관련 finding·개선 방향에 해소 표시 추가. 이 문서(`result.md`) 작성.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |

## Before / After

| 항목                                                         | Before(prd.md 기준선)                                                                     | After                                                                                                                 |
| ------------------------------------------------------------ | ----------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- | --------- | --------- | -------------------- | -------------------------------------------------------- |
| `PostMedia` 재생 상태 구독                                   | `currentMusicId`/`isPlayingGlobal` prop(호출부 2곳에서 각각 상위 selector/Context를 통과) | `usePostMedia.ts`가 `usePlayerStore`를 직접 구독 — prop 자체가 사라짐                                                 |
| `PostCard.tsx` prop 수                                       | 7개(`post,currentMusicId,isPlayingGlobal,onPlay,onPlayAll?,onUserClick,onOpenDetail`)     | **5개**(`post,onPlay,onPlayAll?,onUserClick,onOpenDetail`)                                                            |
| `<PostCard>` 호출부(`currentMusicId`/`isPlayingGlobal` 전달) | `FeedList.tsx`, `ProfilePostsFeed.tsx`(PRD 미확인, 구현 중 발견) — 각 2개 selector        | 두 파일 모두 해당 selector·prop 전달 제거                                                                             |
| `usePostDetailModal.ts`의 `player` 반환 필드                 | `currentMusicId`/`isPlaying`/`handlePlayFromPost`/`handlePlayAll`(4개)                    | `handlePlayFromPost`/`handlePlayAll`(2개) — UX 로깅용 로컬 변수는 함수 내부에 그대로 있음                             |
| `PostMedia` 전용 테스트                                      | 0개                                                                                       | **10개**(`describe.each`로 `variant` 2종 × 5 시나리오)                                                                |
| feed/post/search 관련 테스트(`--testPathPatterns="feed       | PostCard                                                                                  | PostHeader                                                                                                            | PostMedia | search"`) | 13 suites / 72 tests | **14 suites / 82 tests**(+1 suite, +10 tests, 회귀 없음) |
| `pnpm test`(web 전체)                                        | 48 suites / 265 tests                                                                     | **49 suites / 275 tests**(+1 suite, +10 tests, 회귀 없음)                                                             |
| `pnpm lint`/`check-types`/`build`                            | 전부 통과                                                                                 | 전부 통과(회귀 없음)                                                                                                  |
| 변경 파일(diff stat, main 대비, `apps/web`)                  | —                                                                                         | 9개 파일, 109(+)/49(-)줄 — PRD가 예상한 "파일 4~5개"보다 많은 이유는 위 `ProfilePostsFeed.tsx` 발견분이 추가됐기 때문 |

## 개발환경 실동작 확인

- `packages/dto`는 변경하지 않았다(순수 `apps/web` 컴포넌트/훅 변경).
- `docker compose up -d`(mysql/neo4j/redis)로 실제 인프라를 띄우고 `pnpm dev`(api+web)를 백그라운드로 실행, 컴파일 에러/런타임 에러 없이 두 서버 모두 정상 기동을 dev 로그로 확인했다(`api:dev`가 라우트 전부 정상 매핑, `web:dev`가 `✓ Ready in 1571ms`, 이후 로그에 `error`/`warn` 없음을 `grep`으로 확인).
- `POST /api/auth/login/tmp`로 시드 사용자(`user1Id`) JWT를 발급받아, 이번 변경이 건드리는 두 화면이 실제로 소비하는 엔드포인트를 직접 호출해 응답 형태를 확인했다:
  - `GET /api/feed`(`FeedList`→`PostCard`→`PostMedia`, `variant="card"` 경로) — `musics` 배열을 포함한 실제 게시글이 정상 반환됨을 확인, 테스트에서 쓴 mock 데이터 형태와 일치.
  - `GET /api/post/{id}`(`PostCardDetailModalDesktopShell`→`PostMedia`, `variant="modal"` 경로) — 동일하게 `musics` 배열 포함 정상 반환.
  - `GET /api/post/user/{userId}`(`ProfilePostsFeed`가 쓰는 목록 프리뷰 엔드포인트) — 정상 응답, `PostCard`는 이 화면에서 mock돼 있어 프로필 화면 자체 테스트(`ProfilePostsFeed.test.tsx`)에는 영향 없음을 재확인.
- `curl -o /dev/null -w '%{http_code}'`로 홈(`/`) 라우트가 200으로 응답함을 확인했다.
- **직접 확인하지 못한 부분**: 실제 브라우저에서 피드/게시글 상세를 열어 재생 버튼을 누르고 아이콘이 실시간으로 전환되는지 시각적으로 확인하는 것은 이 샌드박스에 브라우저 자동화 도구가 없어 확인하지 못했다(이전 사이클들과 동일한 제약). 대신 이 변경의 핵심 위험(prop→store 전환 후에도 렌더링이 동일한가)은 jsdom 기반 테스트(`PostMedia.test.tsx` 10개, 실제 zustand 스토어를 `setState`로 조작해 DOM으로 검증)와 실제 API 응답 형태 확인(`curl`)으로 커버했다. 사용자가 로컬에서 피드/게시글 상세 양쪽에서 재생 버튼과 전체재생 버튼을 한 번씩 눌러봐 주면 좋다.
- 사용 후 `docker compose down`으로 인프라를 정리했다.

## Behavior Verification

prd.md의 Behavior Invariants를 모두 확인했다:

- ✅ `PostMedia`의 캐러셀 인덱스 전환(`activeIndex`, `prev`/`next`), 커버 이미지 계산 로직 — 변경하지 않음, 관련 코드 무수정.
- ✅ `isActivePlaying` 계산 결과(`activeMusic && isPlayingGlobal && currentMusicId === activeMusic.id`) — `usePostMedia.ts`에서 계산식 자체는 그대로, 두 입력값의 출처만 prop→selector로 전환. 신규 테스트로 직접 재확인.
- ✅ `onPlay`/`onPlayAll`은 prop으로 유지, 각 caller의 동작 차이(모달 경로의 `recordPlayedMusic` 로깅 포함 vs 피드 경로의 단순 재생) — `usePostDetailModal.ts`/`FeedList.tsx`의 해당 콜백 정의부 무변경.
- ✅ `variant="card"`(피드)/`variant="modal"`(게시글 상세 데스크톱) 두 호출부 모두 동일하게 동작 — `PostMedia.test.tsx`가 `describe.each`로 두 variant를 동일 시나리오로 파라미터화해 직접 증명.
- ✅ 모바일 바텀시트는 `PostMedia`를 쓰지 않아 무관 — 해당 컴포넌트 무변경 확인.

ADR의 회귀 시나리오 6개도 전부 확인:

| 회귀 시나리오                                                | 결과                                                                   |
| ------------------------------------------------------------ | ---------------------------------------------------------------------- |
| 활성 트랙 재생 중일 때 Pause 아이콘, 아닐 때 Play 아이콘     | ✅ 신규 테스트(#277→#278에서 store 기반으로 갱신)로 직접 확인          |
| 커버 페이지 전체재생 버튼 클릭 → `onPlayAll` 호출            | ✅ 신규 테스트로 직접 확인                                             |
| 트랙 페이지 재생 버튼 클릭 → `onPlay(activeMusic)` 호출      | ✅ 신규 테스트로 직접 확인                                             |
| prop 제거 후에도 위 3가지가 스토어 값 기준으로 동일하게 동작 | ✅ #278에서 prop을 아예 없애고 `usePlayerStore.setState`로 검증, 통과  |
| `PostCard`/`FeedView` 기존 렌더링 테스트가 회귀 없이 통과    | ✅ 무수정 통과(`PostCard.test.tsx`는 render 호출부만 prop 제거로 수정) |
| `variant="modal"` 경로도 동일하게 동작                       | ✅ `describe.each`로 파라미터화해 동일 시나리오로 확인                 |

## Decision Review

ADR에서 선택한 안 2(경계 재설계, `PostMedia` 직접 구독)의 예상과 실제 비교:

- **예상**: 변경 범위가 파일 5개 이내로 작다 — 실제로는 9개 파일이 바뀌었다. 차이의 원인은 아래 "예상하지 못했던 점" 그대로다.
- **예상하지 못했던 점**: PRD/ADR 작성 단계에서 `<PostMedia>` 호출부만 grep해 "정확히 2곳"이라고 확인했는데, 이는 사실이었다(여전히 2곳). 하지만 `<PostCard>` 자체의 호출부는 확인하지 않았고, 실제로는 `FeedList.tsx` 외에 `ProfilePostsFeed.tsx`에도 하나 더 있었다 — `PostCard`가 `currentMusicId`/`isPlayingGlobal`을 prop으로 받지 않게 되면(Success Criteria가 명시한 "7개→5개") 이 prop을 여전히 전달하는 두 번째 호출부가 있으면 TS가 즉시 "존재하지 않는 property" 에러를 낸다. 결과적으로 CP2 범위가 `ProfilePostsFeed.tsx`까지 넓어졌다. `ProfilePostsFeed.test.tsx`가 `PostCard`를 통째로 mock하고 있어 테스트 수정은 필요 없었지만, 이는 "PostMedia 호출부"만 조사하고 "PostMedia가 실제로 영향을 주는 컴포넌트(PostCard)의 모든 호출부"까지는 확인하지 않은 조사 범위의 좁음이었다 — 다음 사이클에서는 leaf 컴포넌트뿐 아니라 prop 인터페이스가 바뀌는 중간 컴포넌트의 호출부까지 함께 grep하는 것이 안전하다.
- **예상**: `PostMedia`가 저장소에서 가장 크고 테스트가 0개라 위험이 가장 크다 — 실제로 CP1(안전망 먼저 깔기)이 그 위험을 정확히 상쇄했다. CP2에서 prop을 실제로 제거했을 때 테스트가 갱신만 필요했을 뿐 실패 없이 통과했고, `isActivePlaying` 계산 로직 자체를 손대지 않았기 때문에(값의 출처만 바뀜) 회귀가 발생하지 않았다.
- **체크포인트 3개 판단**: CP1→CP2→CP3 순서가 실제로도 그대로 유지됐다. 다만 CP2의 실제 범위가 계획보다 넓어진 것은 "체크포인트 분해가 잘못됐다"기보다 "PRD의 Fact 조사가 PostMedia 직접 호출부에만 좁게 grep했다"는 조사 단계의 아쉬움에 가깝다.

## Remaining Debt

- `onPlay`/`onPlayAll`을 `PostMedia` 내부화하는 것은 caller별 부수효과 차이 때문에 이번 사이클에서도 의도적으로 범위 밖으로 유지했다(전제 변화 없음).
- 검색 fetch 전략 통일(`useItunesSearch`/`useYoutubeSearch` → `useQuery`)과 `feedQueryKey` 캐시 소유권 정리(`PostHeader.tsx`의 inline 조작)는 목표 인터뷰에서 처음부터 이번 사이클 범위 밖으로 결정됐고, `PostMedia`와 파일이 겹치지 않는 독립 문제라 그대로 남아있다.
- `PostCard`의 `post`/`postForActions` 두 표현 공존(경미)은 재검토 결과 의도된 최소 설계로 판단, 손대지 않았다.

## Follow-ups

- 부모 이슈 #260은 이번 사이클이 다룬 ①(`PostMedia` 구독 전환)만 닫는다 — ②(검색 fetch 전략 통일), ③(`feedQueryKey` 소유권 정리)가 남아있어 #260 자체는 닫지 않고 남은 두 문제로 범위를 좁혀 유지한다.
- ②/③은 파일이 서로 겹치지 않는 독립 문제이므로, 착수 시점에 각각 별도 `/refactoring-planner` 사이클로 다룬다.
- 이번 사이클에서 확인된 "prop 인터페이스가 바뀌는 컴포넌트는 leaf 호출부뿐 아니라 자기 자신의 모든 호출부까지 grep해야 한다"는 조사 방법론은 향후 유사 사이클의 PRD Fact 조사 단계에 반영할 만하다(문서화하지 않고, 다음 사이클에서 실제로 적용하는 것으로 충분).

---

**[GATE 3]** 위 Before/After, 개발환경 실동작 확인, Behavior Verification, 남은 부채를 확인해주시면 이 리팩터링 사이클을 종료하겠습니다.
