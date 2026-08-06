# PRD — feed-search-domain

## 문제 정의

`docs/component-hook-audit/index.html`(02 피드/검색 도메인 감사)이 이 도메인에서 5건을 발견했고, 이슈 #260으로 등록됐다. 실제로는 서로 파일이 겹치지 않는 3개의 독립적인 문제다: ① `FeedList`가 구독한 재생 상태를 `PostCard`가 그대로 통과시켜 `PostMedia`까지 3단 드릴링하는 문제, ② `useSearchDrawer` 하위 검색 훅 3개의 데이터 페칭 전략이 서로 다른 문제, ③ `PostHeader.tsx`가 `feedQueryKey` 캐시를 직접 조작해 소유권이 불명확한 문제. 목표 인터뷰에서 사용자가 ①(`PostMedia` 구독 전환)만 이번 사이클 범위로 확정했다.

## 비판적 진단 (시니어 개발자 시각)

### 근거

- **Fact** — `PostCard.tsx:15-16,24,75-78`: `currentMusicId`/`isPlayingGlobal`/`onPlay`/`onPlayAll` 4개 prop을 구조분해하지만, `<PostMedia>`로 그대로 전달하는 것 외엔 컴포넌트 본문 어디서도 쓰지 않는다.
- **Fact** — `FeedList.tsx:16-20`: `playMusic`/`addToQueue`/`selectMusic`/`currentMusicId`/`isPlaying`을 `usePlayerStore`에서 selector로 구독한다. `handlePlay(music)`은 `playMusic(music)` 그대로다(피드 고유 로직 없음).
- **Fact** — `PostCardDetailModalDesktopShell.tsx:46-53`도 동일한 4개 값을 `PostMedia`에 전달한다 — 다만 출처가 `usePlayerStore` selector가 아니라 `PostDetailModalContext`의 `player` 객체다. 즉 이 문제는 피드 경로에만 있는 게 아니라 `PostMedia`의 두 호출부 모두에 있다.
- **Fact(중요, 재검토로 발견)** — `onPlay`/`onPlayAll`은 겉보기엔 같은 상황처럼 보이지만 caller마다 다른 부수효과를 가진다. `usePostDetailModal.ts:156-172`의 `handlePlayFromPost`/`handlePlayAll`은 `recordPlayedMusic(...)`(UX 로깅)을 먼저 호출한 뒤 `playMusic`/`selectMusic`을 호출하는데, `FeedList.tsx`의 `handlePlay`/`handlePlayAll`은 이 로깅이 없다. 즉 이 두 콜백은 순수 통과가 아니라 caller별로 다른 동작을 주입하는 진짜 prop이라 prop으로 유지해야 한다 — `currentMusicId`/`isPlayingGlobal`(둘 다 순수 상태 읽기, caller 간 차이 없음)과는 성격이 다르다.
- **Fact** — `currentMusicId`/`isPlaying`(또는 `isPlayingGlobal`)이 `PostMedia` 전달 이외의 용도로 쓰이는 곳은 없다: `FeedList.tsx`에서 grep 결과 이 두 selector는 `PostCard`로 전달하는 데만 쓰이고, `usePostDetailModal.ts:101-102,151-152,216-217`의 `currentMusicId`/`isPlaying`도 `player` 객체를 통해 `PostCardDetailModalDesktopShell`에만 전달되고 그 외 사용처가 없다(grep 확인). 즉 두 호출부 모두 완전한 pure passthrough다.
- **Fact** — `<PostMedia>` 호출부는 정확히 2곳뿐이다(grep 확인): `PostCard.tsx`(피드 카드, `variant="card"`), `PostCardDetailModalDesktopShell.tsx`(게시글 상세 데스크톱, `variant="modal"`). 모바일 바텀시트(`PostCardDetailModalMobileSheet.tsx`)는 `PostMedia`를 렌더링하지 않는다 — 이번 변경과 무관.
- **Fact** — `PostMedia.tsx`는 294줄로 저장소에서 가장 큰 컴포넌트이고 전용 테스트가 0개다(`find` 확인). 내부적으로 `usePostMedia` 훅(캐러셀 인덱스, `isActivePlaying` 계산 등)과 자체 스와이프 제스처 로직(드래그 오프셋, 임계값 판정)을 갖고 있다.
- **Fact(재검토로 기각)** — 감사 문서는 `PostHeader`의 `onDeletePost` prop을 "PostCard가 넘기지 않아 항상 undefined — 죽은 통로"라고 표현했다. 직접 확인한 결과 이는 부정확하다: `PostHeader.tsx:98-129`의 삭제 메뉴는 `onDeletePost`와 무관하게 항상 렌더링되고, `handleDeletePost`(삭제 API 호출·토스트·`feedQueryKey` 캐시 패치)도 `onDeletePost` 존재 여부와 무관하게 항상 실행된다. `onDeletePost`는 "삭제 후 추가로 할 일"을 위한 옵셔널 콜백일 뿐이다 — 모달 경로(`PostCardDetailModalDesktopShell.tsx:29,63`)는 `closeModal()`이 필요해 넘기고, 피드 카드는 추가로 할 일이 없어 안 넘기는 게 맞다(카드는 캐시 패치만으로 목록에서 사라짐). 버그가 아니므로 이번 조사에서 손대지 않는다 — 사용자가 확정한 범위(A만)에도 포함되지 않는 항목이라 다시 확인 질문을 하지 않았다.
- **Inference** — `PostMedia`가 재생 상태를 직접 구독하는 방향은 이번 세션에서 이미 3번 검증된 패턴(`PostCardDetailModal`의 leaf들이 `PostDetailModalContext` 직접 구독, `ContentWriteModal`의 leaf들이 `ContentWriteContext` 직접 구독, `PlaylistDetailModal/components/SongList.tsx`의 `SongItem`이 `usePlayerStore`를 직접 구독)과 같은 클래스다. 다만 여기선 Context가 필요 없다 — `usePlayerStore`가 이미 전역 zustand 스토어라 `PostMedia`가 바로 구독하면 된다(더 단순한 케이스).

### 증상 → 원인 체인

`PostMedia`가 재생 상태 변화에 반응하는 경로가 두 단계 위(`FeedList`/모달 Context)까지 거슬러 올라간다 → (왜?) `currentMusicId`/`isPlayingGlobal`이 상위에서 구독되고 `PostCard`/`PostCardDetailModalDesktopShell`을 거쳐 전달된다 → (왜?) `PostMedia`가 만들어질 당시엔 "leaf가 스토어를 직접 구독"하는 패턴이 이 저장소에 아직 없었고, 이후 다른 도메인(post-detail, content-write, playlist)에서 이 패턴이 확립됐지만 `PostMedia`에는 소급 적용되지 않았다(구조 원인: 나중에 확립된 패턴이 기존 코드로 역전파되지 않음).

### 아키텍처 관점

- 이 문제는 `PostMedia`에 국한되지 않는 반복 패턴이다 — 이번 세션에서만 3개 도메인(post-detail, content-write, playlist 일부)이 같은 클래스의 문제를 같은 해법(leaf의 직접 구독)으로 풀었다.
- 기존 컨벤션과 충돌하지 않는다 — `usePlayerStore`는 이미 전역 zustand 스토어이므로 어디서든 직접 구독 가능하다는 것이 원래 설계 의도다.
- "당시엔 맞았지만 전제가 깨진" 결정이라기보다, 나중에 정착된 패턴이 오래된 코드에 아직 안 돌아온 경우다.

### 비판적 재검토 (사용자 문제 제기에 대한 반박 질문과 답)

- **이 증상이 정말 구조 문제인가, 아니면 우연·오독인가?** `currentMusicId`/`isPlayingGlobal` 드릴링은 구조 문제다(3세션 연속 같은 패턴이 반복 확인). 반면 감사 문서의 `onDeletePost` "죽은 통로" 표현은 재검토 결과 오독이었다(위 참고) — 이번 범위에서 제외했다.
- **지금 안 고치면 다음 몇 번의 변경에서 구체적으로 어떤 비용이 드는가?** `PostMedia`의 세 번째 호출부(예: 프로필 그리드 카드)가 생기면 같은 4개 prop 배선을 또 반복해야 한다. 이미 호출부가 2곳이라 다음 변경(예: 재생 상태에 새 필드 추가)마다 두 곳을 동시에 고쳐야 하는 비용이 실재한다.
- **더 급한 다른 문제를 가리는 건 아닌가?** `PostMedia`가 테스트 0개라는 사실 자체가 이 사이클에서 가장 큰 리스크지만, 이는 "지금 고치지 말아야 할 이유"가 아니라 "구조를 옮기기 전에 먼저 안전망부터 깔아야 할 이유"다 — 체크포인트 1번으로 반영한다.

## 목표와 범위

### Goal

`PostMedia`가 `currentMusicId`/`isPlayingGlobal`을 `usePlayerStore`에서 직접 구독하도록 전환해, `PostCard`와 `PostCardDetailModalDesktopShell` 양쪽에서 이 2개 prop 전달을 제거한다. `onPlay`/`onPlayAll`은 caller별 부수효과 차이 때문에 prop으로 유지한다.

### Success Criteria

- `PostMedia.tsx`의 props에서 `currentMusicId`/`isPlayingGlobal`이 사라지고, 컴포넌트 내부에서 `usePlayerStore`를 직접 구독한다.
- `PostCard.tsx`(7개 prop → 5개), `PostCardDetailModalDesktopShell.tsx`(해당 2개 prop 전달) 양쪽에서 이 prop 전달 코드가 사라진다.
- `FeedList.tsx`의 `currentMusicId`/`isPlaying` selector, `usePostDetailModal.ts`의 `currentMusicId`/`isPlaying`(및 `player` 객체의 해당 필드) 중 다른 용도로 쓰이지 않는 것은 함께 제거된다(dead code 정리, 위 Fact에서 다른 사용처 없음을 확인).
- `PostMedia`에 이번 변경이 건드는 부분(재생 상태 파생 렌더링, `isActivePlaying` 계산)을 고정하는 characterization test가 신규로 추가된다(착수 전 0개).
- 기존 `PostCard.test.tsx`/`PostHeader.test.tsx`/`FeedView.test.tsx`/`usePostDetailModal.test.ts`가 회귀 없이 통과한다.
- `lint`/`check-types`/`build`가 기존과 동일하게 통과한다.

### Out of Scope

- **검색 fetch 전략 통일**(`useItunesSearch`/`useYoutubeSearch` → `useQuery`) — 목표 인터뷰에서 사용자가 명시적으로 이번 사이클 범위 밖으로 결정. `PostMedia`와 파일이 전혀 겹치지 않는 독립 문제라 별도 사이클로 다룬다.
- **`feedQueryKey` 캐시 소유권 정리**(`PostHeader.tsx`의 inline 조작을 공용 함수로 추출) — 위와 같은 이유로 범위 밖.
- **`PostHeader`의 `onDeletePost`** — 재검토 결과 버그가 아님을 확인, 손대지 않는다.
- **`PostCard`의 `post`/`postForActions` 두 표현 공존**(감사 문서 finding, 경미) — 각자 다른 소비처(좋아요 상태 필요 여부)를 반영한 의도적 최소 설계로 보여, 이번 사이클에서 손대지 않는다.
- `onPlay`/`onPlayAll`을 `PostMedia` 내부화 — 위 Fact에서 확인했듯 caller별 부수효과(모달의 `recordPlayedMusic` 로깅)가 달라 그대로 prop 유지.
- `apps/api`, `packages/dto` 변경.

## Behavior Invariants

- `PostMedia`의 캐러셀 인덱스 전환(`activeIndex`, `prev`/`next`), 커버 이미지 계산 로직은 변경 없다.
- `isActivePlaying` 계산 결과(`activeMusic && isPlayingGlobal && currentMusicId === activeMusic.id`)는 동일하게 유지된다.
- `onPlay`/`onPlayAll`은 여전히 prop으로 유지되며, 각 caller의 기존 동작 차이(모달 경로의 `recordPlayedMusic` 로깅 포함 vs 피드 경로의 단순 재생)가 그대로 보존된다.
- `variant="card"`(피드)/`variant="modal"`(게시글 상세 데스크톱) 두 호출부 모두 동일하게 동작한다.
- 모바일 바텀시트는 `PostMedia`를 쓰지 않으므로 이번 변경과 무관하다.

## 목표 인터뷰 결과 (AskUserQuestion)

**Q. feed/search 도메인에 서로 독립적인 3개 문제가 있습니다. 이번 사이클에 어디까지 포함할까요?**
A. A만 — `PostMedia` 구독 전환(추천). 이유: `PostMedia`가 저장소에서 가장 크고(294줄) 테스트가 0개인 컴포넌트라 위험이 가장 큰데, 이미 3번 검증된 패턴(leaf의 직접 구독)이라 단독으로 먹으면 검증 부담만 먼저 지고 위험을 낮출 수 있다는 진단을 그대로 채택. B(검색 fetch 통일)·C(`feedQueryKey` 소유권)는 파일이 전혀 겹치지 않는 독립 문제라 별도 사이클 후보로 남긴다.

**Q. `PostMedia`에 추가할 특성화 테스트 범위는 어디까지가 좋을까요? (현재 이 파일은 전용 테스트가 0개입니다)**
A. 이번 변경이 건드는 부분만(추천). 이유: 지금까지 모든 사이클이 "변경 대상만 테스트로 고정"해온 기존 관례를 그대로 따르며, 안 건드리는 스와이프 제스처 등까지 지금 다 커버하려다 변경 자체가 커지는 것을 원하지 않는다는 진단을 채택.

**Q. 위 Behavior Invariants와 Success Criteria 초안을 코드에서 그대로 도출했습니다. 이대로 확정해도 될까요?**
A. 제시된 대로 확정(추천).

## 기준선 검증

| 명령             | 결과 | 실패 항목 | 비고                                                    |
| ---------------- | ---- | --------- | ------------------------------------------------------- |
| pnpm lint        | 성공 | 없음      | turbo 4개 태스크 전부 cache hit(FULL TURBO)             |
| pnpm check-types | 성공 | 없음      | turbo 3개 태스크 전부 cache hit(FULL TURBO)             |
| pnpm test        | 성공 | 없음      | web 48 suites/265 tests 모두 통과(cache hit)            |
| pnpm build       | 성공 | 없음      | web 프로덕션 빌드 성공(FULL TURBO, 전 패키지 cache hit) |

- feed/post/search 관련 테스트만 별도 실행(`pnpm test -- --testPathPatterns="feed|PostCard|PostHeader|PostMedia|search"`): **13 suites / 72 tests** 통과 — `FeedView.test.tsx`, `PostCard.test.tsx`, `PostHeader.test.tsx`, `MusicPickerSearch.test.tsx`, `usePostCacheSync.test.ts`, `usePostDetail.test.ts`, `usePostDetailModal.test.ts`, `usePostDetailUxLog.test.ts`, `usePostLikeToggle.test.ts`, `usePostReactions.test.ts`, `useUserSearch.test.ts` 등. `PostMedia`/`FeedList`/`useSearchDrawer`/`useItunesSearch`/`useYoutubeSearch`는 이 목록에 없다 — 전용 테스트 0개(안전망 공백, 이번 사이클의 첫 체크포인트가 이를 메운다).
- 변경 영향 예상 파일: `PostMedia.tsx`(핵심), `PostCard.tsx`, `PostCardDetailModalDesktopShell.tsx`, `FeedList.tsx`, `usePostDetailModal.ts`(dead code 정리 대상이면), 신규 테스트 파일 1개 — 측정 불가(실제 구현 전이라 확정값 아님, ADR 단계에서 구체화).
- 번들 크기·빌드 시간 증분: 측정 불가 — 새 라이브러리 도입이 없고 변경 범위가 파일 4~5개 수준이라 유의미한 증분이 예상되지 않지만, PRD 단계에서 별도 측정은 하지 않음.

---

**[GATE 1]** 위 진단·목표·범위·Behavior Invariants·기준선을 확인해주시면 다음 단계(ADR)로 넘어가겠습니다.
