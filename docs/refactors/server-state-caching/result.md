# Result — server-state-caching

## 변경 요약

| 이슈 | 내용                                                                                                                                                                                                                                                                                                                        |
| ---- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| #140 | 플레이리스트 3곳/authMe 2곳/게시글상세 4개 진입점의 현재 동작을 특성화·계약 테스트로 고정(착수 전 0건). 플레이리스트 무효화 누락 버그는 `it.failing`로 의도적으로 실패시켜 목표 동작을 미리 코드화.                                                                                                                         |
| #141 | `@tanstack/react-query` 설치, `components/providers/QueryProvider.tsx` 신설(`ToastProvider`와 동일 패턴, 모듈 스코프 싱글턴 `QueryClient`), `app/layout.tsx`의 `<body>` 전체를 감쌈. React Compiler 호환성을 `pnpm dev` 실동작으로 조기 확인(경고/에러 없음).                                                               |
| #142 | `usePlaylists()` 공용 훅 신설(`queryKey: ['playlists']`). `usePlaylistRecommendations`/`ArchiveView`/`PlaylistPickerModal` 전환, `bumpPlaylistRefresh()` 호출부(`ArchiveView`/`ArchiveViewHeader`/`PlaylistDetailModal`)를 `queryClient.invalidateQueries` 로 교체, `usePlaylistRefreshStore` 삭제.                         |
| #143 | `useAuthMeQuery()` 공용 훅 신설(`queryKey: ['authMe']`), `useAuthMe`/`usePostReactions`가 공유. **구현 중 발견**: `staleTime` 없이는(기본값 0) 게시글 상세를 열 때마다 쿼리 옵저버가 새로 mount되어 여전히 재요청함 — `pnpm dev` 실동작 확인에서 직접 재현 후 `staleTime: 5분` 추가로 해결.                                 |
| #144 | `usePostDetail`을 `queryKey: ['postDetail', postId]` 기반으로 재작성, `passedPost` 있으면 `initialData` 시딩 + `enabled:false`로 fetch 자체 스킵. `ProfilePostsFeed`의 N+1 루프도 각 결과를 동일 `queryKey`로 캐시에 시딩(요청 개수 자체는 유지, ADR에서 확정된 범위). #143에서 배운 대로 `staleTime: 1분`을 처음부터 반영. |
| #145 | 이 문서 작성 + 백로그 이슈 #146(게시글상세 N+1 감소, API 계약 변경 필요), #147(알림/댓글 폴링 및 낙관적갱신+롤백을 TanStack Query 패턴으로 통합 검토) 등록. 선행 백로그 #124/#43(서버 상태 캐싱 라이브러리 도입 재검토) 종료.                                                                                               |

## Before / After

| 항목                              | Before(prd.md 기준선)                                                                                                                                                      | After                                                                                                                                                                                                        |
| --------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 플레이리스트 무효화 전파          | `usePlaylistRecommendations`가 `usePlaylistRefreshStore`를 구독하지 않아 다른 화면 변경이 반영되지 않음(재현된 버그)                                                       | `queryKey: ['playlists']` 공유 캐시 + `invalidateQueries`로 3곳 모두 자동 반영. `PlaylistPickerModal`도 원래 이 nonce를 구독하지 않았는데, 같은 queryKey를 쓰게 되며 부수적으로 함께 해소됨(실동작으로 확인) |
| authMe 네트워크 호출              | `useAuthMe`/`usePostReactions`가 독립 호출(게시글 상세를 열 때마다 추가 호출)                                                                                              | `queryKey: ['authMe']` 공유 + `staleTime: 5분` — 게시글 상세를 3번 열어도 추가 호출 0회(`pnpm dev` 실동작으로 확인)                                                                                          |
| 게시글상세 캐시 공유              | `passedPost` 없이 postId만으로 여는 진입점(`ProfilePosts`/`NotiDrawerContent`/`PostCard` 편집)은 다른 곳에서 이미 페칭됐어도 항상 재요청                                   | `queryKey: ['postDetail', postId]` 공유 + `staleTime: 1분` — 프로필 피드가 프리페치한 게시글을 상세 모달로 열어도 추가 요청 0회(`pnpm dev` 실동작으로 확인)                                                  |
| 삭제된 임시방편 코드              | `usePlaylistRefreshStore`(nonce+bump), `usePostDetail`의 `requestIdRef` 기반 취소 로직, `useAuthMe`/`usePostReactions`의 개별 `isAlive` 플래그+`try/catch`+`useState` 조합 | 전부 제거, `useQuery`의 내장 dedup/취소/상태 관리로 대체                                                                                                                                                     |
| `pnpm test`(web)                  | 21 suites / 104 tests                                                                                                                                                      | **25 suites / 116 tests**(+4 suites, +12 tests — 신규 계약/특성화 테스트)                                                                                                                                    |
| `pnpm lint`/`check-types`/`build` | 전부 통과                                                                                                                                                                  | 전부 통과(회귀 없음)                                                                                                                                                                                         |
| 변경 파일(diff stat)              | —                                                                                                                                                                          | 19개 파일 194(+)/283(-)줄(순감소) + 신규 파일 8개(약 313줄, 대부분 테스트/유틸)                                                                                                                              |
| 번들 크기                         | 측정 불가(analyzer 미도입)                                                                                                                                                 | 여전히 정확한 측정 불가 — 이번 사이클도 "문서만"/"코드 변경 없음" 범위라 `@next/bundle-analyzer` 도입은 하지 않음. ADR에서 확인한 라이브러리 공식 게시 수치(최소 사용 gzip 약 10.4KB)를 참고치로만 유지      |

## 개발환경 실동작 확인

`packages/dto`는 변경하지 않아 `pnpm dto` 재빌드는 필요 없었다. 각 이슈마다 `docker compose up -d`(mysql/neo4j/redis) + `apps/api`/`apps/web` `pnpm dev`를 직접 기동해 실제 백엔드·DB로 확인했다(이 저장소의 시드 유저로 `POST /api/auth/login/tmp` 임시 로그인 후 진행):

- **#141**: `pnpm dev`로 `/`, `/archive` 요청 — 컴파일·런타임 에러 없음, React Compiler 관련 경고 없음.
- **#142**: Playwright로 실제 브라우저 세션을 띄워 `/archive`에서 플레이리스트 이름을 실제로 변경 — **새로고침 없이 즉시 화면에 반영**됨을 스크린샷으로 확인(`플레이리스트 3` → `플레이리스트 3 (수정됨)`).
- **#143**: 같은 방식으로 프로필 게시글 피드에서 게시글 상세를 3회 열고 닫으며 `/api/user/me` 요청 수를 네트워크 레벨에서 직접 카운트. **최초 수정본은 3회 모두 추가 호출이 발생하는 회귀를 실제로 재현**했고(staleTime 누락), 수정 후 재검증에서 추가 호출 0회를 확인했다.
- **#144**: 프로필 게시글 피드 로드 시 `/api/post/:id` GET이 1회만 발생하고(N+1 프리페치), 같은 게시글을 상세 모달로 열어도 추가 GET이 0회임을 네트워크 레벨에서 확인. 상세 모달이 좋아요/댓글/음악 재생 UI와 함께 정상 렌더링되는 것도 스크린샷으로 확인.
- **확인하지 못한 부분**: `NotiDrawerContent`(알림)를 통한 postId 전용 진입, `PostCard` 편집 진입(`initialIsEditing`) 각각의 라이브 클릭 경로는 별도로 띄우지 못했다 — 대신 이 두 경로는 `usePostDetail.test.ts`/`usePostDetailModal.test.ts`가 실제 `usePostDetail`(mock 없이 실제 `@tanstack/react-query` 사용)을 렌더링해 캐시 공유를 코드 레벨로 검증한다. 페이지 간(예: 프로필 그리드 ↔ 프로필 피드) 클라이언트 사이드 라우팅을 유지한 채로 캐시 공유를 직접 클릭해 확인하는 것은 Playwright 스크립트의 내비게이션 복잡도 때문에 이번엔 생략했다 — 코드 레벨 검증(동일 `QueryClient`·`queryKey`를 공유하는 `usePostDetail`의 실제 라이브러리 동작)으로 대체했다.

## Behavior Verification

prd.md의 Behavior Invariants 전부를 확인했다:

- ✅ 플레이리스트/추천/피커 화면 데이터가 서버 상태와 최종적으로 일치 — #142 라이브 확인(즉시 반영) + `ArchiveView.test.tsx`/`PlaylistPickerModal.test.tsx`/`usePlaylistRecommendations.test.ts`.
- ✅ `authMe` 401 시 `internal/client.ts`의 좁은 범위 처리(로그아웃+로그인모달 재오픈)는 코드 변경 없음 — 그대로 유지됨을 코드 리뷰로 확인(이 파일 자체를 이번 사이클에서 건드리지 않음).
- ✅ `usePlaylistRecommendations`의 `MOCK_PLAYLIST_BRIEFS` 폴백 — `usePlaylistRecommendations.test.ts`("getAllPlaylists 실패 시 MOCK_PLAYLIST_BRIEFS로 폴백...").
- ✅ 기존 로딩/에러 UI 표시 유지 — `PlaylistPickerModal`/`ArchiveView`의 로딩 스피너·에러 문구 분기 로직은 값의 출처만 `useState`에서 `useQuery`로 바뀌었을 뿐 JSX 분기는 그대로.
- ✅ `ProfilePostsFeed`의 목록/페이지네이션 동작 불변 — N+1 호출 개수 자체는 유지(캐시 시딩만 추가), `useInfiniteScroll` 로직은 손대지 않음.
- ✅ 이슈 1에서 추가한 계약 테스트가 전부 "통과"로 전환됨 — 플레이리스트 재현 테스트(`it.failing` → 일반 `it`), authMe 2회→1회, 게시글상세 캐시 재사용 0회 재요청.

## Decision Review

adr.md에서 선택한 안 3(TanStack Query 도입)의 예상과 실제 비교:

- **예상**: 비교표 기준 1(근본 원인 해결력)·4(테스트 용이성)·10(유지 비용)에서 우세 → 실제로도 무효화 전파가 라이브러리 계약(`queryKey`+`invalidateQueries`)으로 강제돼, 애초 버그였던 `usePlaylistRecommendations` 누락 같은 실수가 구조적으로 재발하기 어려워졌다. `renderHook`+`QueryClientProvider` 조합의 테스트 패턴도 예상대로 커뮤니티에 검증된 형태로 바로 적용됐다.
- **예상하지 못했던 점 1(가장 중요)**: ADR은 authMe에 대해 "staleTime을 짧게라도 두면"이라고만 적었을 뿐 게시글상세에는 이 필요성을 언급하지 않았다. 실제로는 **두 쿼리 모두** `staleTime` 없이는(기본값 0) 모달을 닫았다 다시 열 때마다 쿼리 옵저버가 새로 mount되며 여전히 재요청이 발생한다는 것을, #143의 `pnpm dev` 실동작 확인에서 실제로 재현하고서야 알았다. 정적 검증(lint/type-check/test)만으로는 이 문제를 잡지 못했을 것이다 — `renderHook`을 이용한 유닛 테스트는 각 테스트마다 새 `QueryClient`를 써서 격리했기 때문에, "같은 세션에서 반복 mount"라는 실제 사용자 시나리오를 우연히 가리고 있었다. 이 사이클에서 "개발환경 실동작 확인은 사용자에게 위임하지 않는다"는 워크플로 규칙이 실제로 버그를 잡아낸 사례다.
- **예상하지 못했던 점 2**: `initialData`가 `enabled: false`인 관측자(observer)에서도 쿼리 캐시를 시딩한다는 세부 동작(TanStack Query 라이브러리 자체 동작)에 실제로 의존하게 됐다. ADR 작성 시점에는 "passedPost가 있으면 initialData로 시딩"이라고만 적었는데, 구현 중 이 값이 정말 "네트워크 호출 없음"을 보장하려면 `enabled`를 `!matchedPost`로 함께 낮춰야 한다는 것이 드러났다(그렇지 않으면 `staleTime`이 있어도 첫 마운트 자체는 fetch를 시도함). 유닛 테스트로 이 조합의 실제 동작을 먼저 검증한 뒤 구현에 반영했다.
- **예상**: 비교표 기준 9(기존 코드와 일관성)의 약점(새 의존성)을 감수하기로 했었다 → 실제로 새 개념(`staleTime`, `initialData`, `enabled`, `invalidateQueries`)을 프로젝트에 도입했지만, 각 훅의 반환 타입(`AuthMeState`, `usePlaylistRecommendations`의 `State` 등)을 그대로 유지해 소비 측(`AuthBootstrap`, `MusicSearch` 등) 코드는 전혀 바뀌지 않았다 — ADR이 명시한 "제거 비용을 훅 내부로 한정" 설계가 실제로 그렇게 작동했다.

## Remaining Debt

- `ProfilePostsFeed`의 N+1(서로 다른 postId N개 각각 요청) 자체는 줄지 않았다 — 캐시 공유로 "재요청"만 없앴을 뿐, 최초 로드 시의 요청 개수는 그대로다. API 계약 변경이 필요해 이번 사이클 범위 밖 — 백로그 #146.
- 알림 폴링(`useNotiPolling`)·댓글 폴링(`usePostReactions`)·좋아요/댓글/알림 낙관적 갱신+롤백은 이번에 손대지 않았다(PRD Out of Scope). TanStack Query의 `refetchInterval`/optimistic update 패턴으로 통합할 수 있는 후보이지만, 이번 사이클의 "3개 데이터 경로" 범위와 섞지 않기로 한 판단을 유지 — 백로그 #147.
- 이슈 #39(댓글 작성 직후 `refetchComments`가 방금 쓴 댓글을 지울 수 있음)는 이번 사이클에서 다루지 않았다 — `usePostReactions`의 댓글 로직 자체(폴링·낙관적 갱신)는 그대로 남아 있어 이 버그도 그대로 남아 있다.
- `usePlaylistRecommendations`/`PlaylistPickerModal`의 `selectPlaylist`(플레이리스트 상세 조회)는 여전히 `useQuery` 밖에서 직접 `getPlaylistDetail`을 호출한다(ADR에서 명시적으로 Out of Scope) — 플레이리스트 "목록"만 캐시를 공유하고 "상세"는 아직 개별 페칭이다.
- `useInfiniteScroll`/`useFeedInfiniteScroll` 중복 통합은 PRD Out of Scope대로 이번에도 다루지 않았고, 별도 백로그로 등록하지도 않았다(이미 알려진 항목이라 중복 등록하지 않음, 필요 시 재검토).

## Follow-ups

- 백로그 #146: 게시글상세 N+1 감소 — 목록 API가 상세 필드를 함께 내려주도록 `apps/api`/`packages/dto` 계약 변경 검토(프론트엔드 전용이었던 이번 사이클과 분리).
- 백로그 #147: 알림/댓글 폴링 및 낙관적 갱신+롤백을 TanStack Query의 `refetchInterval`/optimistic update 패턴으로 통합할지 별도 PRD로 검토.
- 백로그 #124, #43(서버 상태 캐싱 라이브러리 도입 재검토)은 이번 사이클로 완료돼 종료함.
- 별도로 다루지 않은 기존 백로그: #39(댓글 작성 직후 사라짐), #96(저장소 전역 순환참조), #97(conventions.md 배럴 규칙 갱신), #100(Playwright CI 통합), #117(TrackItem/MusicPickerSearch 결과 행 레이아웃 공용화 검토), #132(스와이프 중복 통합), #133(PlaylistDetailModal 편집 훅 전환).

---

**[GATE 3]** 위 Before/After, 개발환경 실동작 확인, Behavior Verification, 남은 부채를 확인해주시면 이 리팩터링 사이클을 종료하겠습니다.
