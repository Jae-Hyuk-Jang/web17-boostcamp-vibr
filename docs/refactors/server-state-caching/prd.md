# PRD — server-state-caching

## 문제 정의

`apps/web`은 서버 상태 캐싱 라이브러리 없이 각 화면이 `useState`+`useEffect`로 서버 데이터를 개별 페칭한다(`brief-original.md`). 같은 서버 데이터를 여러 화면이 독립적으로 캐싱하다 보니, 한 화면에서 데이터를 바꿔도 다른 화면의 캐시에 반영되는 경로가 훅 작성자가 개별적으로 구현해야 하는 수동 계약이 됐고, 실제로 플레이리스트 화면에서 이 계약이 누락된 사례가 재현됐다. 이번 사이클은 이 문제를 다룬다.

## 비판적 진단 (시니어 개발자 시각)

### 근거

| 등급                | 내용                                                                                                                                                                                                                                                                     |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Fact                | `getAllPlaylists`가 `usePlaylistRecommendations.ts:56`, `ArchiveView.tsx:19`, `PlaylistPickerModal.tsx:79` 세 곳에서 각각 독립 fetch+state로 존재한다.                                                                                                                   |
| Fact                | 이 중 `usePlaylistRecommendations`만 `usePlaylistRefreshStore`의 nonce를 구독하지 않는다 — `ArchiveView`/`PlaylistDetailModal`에서 `bumpPlaylistRefresh`를 호출해도 `usePlaylistRecommendations`의 캐시는 갱신되지 않는다. 사용자가 실제로 재현한 버그다.                |
| Fact                | `authMe()`가 `useAuthMe.ts:24`, `usePostReactions.ts:159`에서 각각 독립 호출되고, 전역 `useAuthStore`는 `AuthBootstrap.tsx`에서 별도로 채워진다 — 인증 정보 소스가 3곳이다.                                                                                              |
| Fact                | `getPostDetail`이 상세 모달(`usePostDetail.ts:71`)과 프로필 피드(`ProfilePostsFeed.tsx:41`, 목록 개수만큼 반복 호출하는 N+1 패턴)에서 각각 독립 캐시로 존재한다.                                                                                                         |
| Fact                | "여러 컴포넌트 간 서버 상태 동기화"만을 목적으로 만들어진 zustand 스토어가 이미 4개 존재한다: `usePostReactionOverridesStore`, `useFeedRefreshStore`, `usePlaylistRefreshStore`, `useNotiStore`.                                                                         |
| Fact                | 요청 취소가 최소 3가지 다른 방식(`requestIdRef`, `AbortController`, `isAlive` 플래그)으로 훅마다 재구현돼 있다.                                                                                                                                                          |
| Fact                | 이번 사이클 범위(플레이리스트/authMe/게시글상세) 3개 데이터 경로에 관련된 파일들의 git 변경 이력은 대부분 1~3회로 낮다(`git log --follow` 확인).                                                                                                                         |
| Inference           | 무효화 전파가 "이 nonce store를 구독하겠다"는 각 훅 작성자의 개별 판단에 의존하고, 이를 강제하는 공용 메커니즘이 없다 — `usePlaylistRecommendations`의 누락은 우연이 아니라 이 계약 방식 자체의 구조적 취약점이다.                                                       |
| Inference           | 변경 이력이 낮은 것은 "안정적이라 안 바뀐다"기보다, 이 프로젝트 자체가 최근에 다시 쓰이기 시작한 젊은 코드베이스라 아직 반복 변경 기회가 적었기 때문이다(리팩터링 사이클 대부분이 최근 며칠 내 발생) — 따라서 변경 빈도는 이번 판단에서 약한 신호로만 취급한다.          |
| Hypothesis (미검증) | TanStack Query 같은 캐싱 라이브러리를 도입하면 무효화 전파를 라이브러리가 대신 보장할 수 있다 — 다만 이 저장소의 React Compiler(`babel-plugin-react-compiler`) 조합, SSR 라우트(`post/[id]/page.tsx`)와의 경계, 번들 비용은 아직 검증하지 않았다. ADR 단계에서 확인한다. |

### 증상 → 원인 체인

```
증상: 플레이리스트를 변경해도 추천 위젯(usePlaylistRecommendations)이 반영하지 않는다
  ↓ 왜?
직접 원인: usePlaylistRecommendations가 usePlaylistRefreshStore의 nonce를 구독하지 않는다
  ↓ 왜?
구조 원인: 서버 데이터의 무효화 전파가 "관련 nonce 스토어를 구독하겠다"는 각 훅 작성자의 개별 구현에 의존하는 수동 계약이고,
          이를 강제하거나 컴파일 타임/린트로 검증하는 공용 메커니즘이 없다.
```

### 아키텍처 관점

- 이 문제는 특정 화면 하나가 아니라 저장소 전역 패턴이다 — 최소 12개 훅이 서버 상태 페칭/캐싱을 각자 구현하고, 그중 최소 3곳(플레이리스트/authMe/게시글상세)에서 같은 서버 데이터가 중복 캐시로 존재한다.
- `CLAUDE.md`의 "서버 상태 캐싱 라이브러리를 쓰지 않는다"는 문구는 금지 규칙이 아니라 프로젝트 초기 파악 시점의 현재 상태 기록임이 이미 확인됐다(`docs/refactors/post-detail-modal-responsibility-decomposition/adr.md`, 이슈 #124).
- 그 사이클(#125~131)의 ADR은 이 문제를 인지했지만 "그 사이클의 범위(컴포넌트 책임 분리)와 무관하다"는 이유로 도입을 보류하고, "반복 사례가 쌓이면 근거가 된다"며 이슈 #124/#43으로 이관했다. 지금이 그 반복 사례(플레이리스트 실제 버그 + authMe/게시글상세 구조적 동일 위험)가 쌓인 시점이다 — 즉 이 결정은 "당시엔 맞았지만 전제가 깨졌다"기보다 "근거가 약해서 보류했던 것이 이제 근거가 쌓였다"는 케이스다.

### 비판적 재검토 (사용자 문제 제기에 대한 반박 질문과 답)

**Q. 이 증상이 정말 구조 문제인가, 우연한 버그·일회성 실수인가?**
A. 구조 문제로 판단한다. 동일한 종류의 실수(무효화 구독 누락 또는 캐시 중복)가 재발할 수 있는 지점이 최소 3곳(플레이리스트/authMe/게시글상세) 확인됐고, 그중 1곳에서 실제로 발현됐다. "이 화면이 이 데이터에 의존하니 저 nonce도 구독해야 한다"는 규칙이 코드 어디에도 강제되어 있지 않아, 다음에 같은 데이터를 보여주는 화면을 또 추가하면 같은 실수가 재발할 개연성이 높다.

**Q. 지금 안 고치면 다음 몇 번의 실제 변경에서 구체적으로 어떤 비용이 드는가? (YAGNI)**
A. 이미 authMe(3중화)와 게시글상세(N+1)에서 같은 계열의 문제가 구조적으로 확인됐다. 플레이리스트/게시글/유저 정보를 보여주는 새 화면을 추가할 때마다, 기존 캐시를 재사용하는 경로가 없으니 또 새로운 `useState`+`useEffect` 훅을 만들 가능성이 높고(이미 3중복 사례), 그때마다 무효화 신호를 빠뜨릴 위험이 반복된다. 다음 2~3번의 실제 변경(예: 새 리스트/프로필 관련 화면 추가)에서 같은 종류의 버그가 재발할 개연성이 충분하다.

**Q. 더 급한 다른 문제를 가리는 건 아닌가?**
A. 이슈 #39(댓글 작성 직후 `refetchComments`가 방금 쓴 댓글을 지울 수 있음)가 더 시급한 개별 버그로 남아 있다. 같은 계열("서버 상태 재조회 시점 문제")이지만 이번 사이클 범위(플레이리스트/authMe/게시글상세)와 직접 겹치지 않으므로 별도 이슈로 유지하고, 이번 사이클을 미룰 만큼 더 급한 문제는 확인되지 않았다.

### 후보 우선순위

이번 진단은 "서버 상태 캐싱" 단일 후보만 다룬다(brief-original.md 시작부터 이 문제로 좁혀져 있었음) — 우선순위 비교표는 생략한다.

## 목표와 범위

### Goal

- 플레이리스트/authMe/게시글상세를 새로 보여주는 화면을 추가할 때, 기존 캐시를 재사용하면 다른 화면의 변경이 자동으로 반영된다.
- 위 3개 데이터별 무효화 규칙을 훅 작성자가 개별적으로 구현하지 않아도 된다.

### Success Criteria

- 플레이리스트 세 곳(`usePlaylistRecommendations`/`ArchiveView`/`PlaylistPickerModal`) 중 한 곳에서 변경하면 나머지도 자동 반영된다 — 재현된 버그의 재발 방지를 특성화 테스트로 검증한다.
- `authMe`가 `useAuthMe`/`usePostReactions`/`AuthBootstrap` 세 곳에서 같은 캐시 경로를 공유한다.
- `getPostDetail`이 상세 모달과 프로필 피드 간 캐시를 공유해 중복 네트워크 호출이 줄어든다.
- 기존 Behavior Invariants가 모두 통과하고, `lint`/`check-types`/`test`/`build`가 기존과 동일하게 통과한다.

### Out of Scope

- 알림 폴링(`useNotiPolling`), 댓글 폴링(`usePostReactions`) 로직 변경.
- 좋아요/댓글/알림 낙관적 갱신+롤백(`usePostLikeToggle`, `usePostReactions` 댓글, `useNotiStore`) 구현 교체.
- `useInfiniteScroll`/`useFeedInfiniteScroll` 중복 통합.
- `apps/api`, `packages/dto` 변경.
- SSR 라우트(`post/[id]/page.tsx`)의 서버사이드 fetch 변경.
- 새 라이브러리(TanStack Query 등) 도입 여부 자체를 미리 확정하는 것 — ADR 단계에서 대안으로 검토하되, 목표로 고정하지 않는다.

### Behavior Invariants

- 플레이리스트/추천/피커 화면에 표시되는 데이터는 최종적으로 실제 서버 상태와 일치한다(짧은 지연은 허용되나 영구적 불일치는 허용하지 않는다).
- `authMe` 401 응답 시 기존 좁은 범위 처리(`internal/client.ts` — `/user/me` 요청의 401에서만 인증 스토어 정리+로그인 모달 재오픈, 다른 요청의 401은 무시)는 유지된다.
- `usePlaylistRecommendations`의 외부 API 실패 시 `MOCK_PLAYLIST_BRIEFS` 폴백 동작은 유지된다.
- 기존 로딩/에러 UI 표시 방식(스피너, 에러 문구 등 사용자에게 보이는 상태)은 바뀌지 않는다.
- `ProfilePostsFeed`가 프로필별 게시글 목록을 보여주는 화면 동작 자체(정렬, 페이지네이션 등)는 바뀌지 않는다 — N+1 호출 감소는 캐시 재사용으로 달성하고 화면 동작을 바꾸지 않는다.

### 마이그레이션/배포 호환성

불필요 — 프론트엔드 전용 변경이며 `packages/dto` 계약과 `apps/api` 엔드포인트는 바뀌지 않는다.

## 기준선 검증

| 명령               | 결과 | 실패 항목 | 비고                                                                                                                                                                                                                                         |
| ------------------ | ---- | --------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm lint`        | 성공 | 없음      | 4개 패키지(dto/ui/api/web), web만 cache miss로 재실행, 12.9s                                                                                                                                                                                 |
| `pnpm check-types` | 성공 | 없음      | 전부 cache hit, 60ms                                                                                                                                                                                                                         |
| `pnpm test`        | 성공 | 없음      | 21 suites / 104 tests 전부 통과 (web). `useItunesHook`의 jsdom "Not implemented: HTMLMediaElement.prototype.pause" 경고와 `PostCardDetailModal.test.tsx`의 의도된 실패 케이스 `console.error` 로그는 기존에도 있던 것으로 테스트 실패가 아님 |
| `pnpm build`       | 성공 | 없음      | web 프로덕션 빌드 컴파일 8.8s, 정적 페이지(14개) 생성 1.02s                                                                                                                                                                                  |

- 번들 크기: 측정 불가 — Next 16 빌드 출력에 route별 First Load JS 크기 표가 기본 노출되지 않는다. ADR에서 라이브러리 도입안을 실제로 비교할 때 `@next/bundle-analyzer` 등으로 별도 측정한다.
- 핵심 테스트 수: 104개(web), 이번 사이클 대상 3개 데이터 경로(플레이리스트/authMe/게시글상세) 관련 특성화 테스트는 현재 0건 — 안전망 공백으로 기록.
- 변경 이력: 이번 사이클 대상 파일들의 git 변경 횟수는 1~3회로 낮음(위 "근거" 표 참고, 신생 코드베이스라 약한 신호).

---

**[GATE 1]** 위 진단·목표·범위·Behavior Invariants·기준선을 확인해주시면 다음 단계로 넘어가겠습니다.
