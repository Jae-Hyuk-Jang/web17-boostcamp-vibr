# 문제 영역

feed/search 도메인(이슈 #260)에 두 가지 문제가 얽혀 있다. ① `PostCard`가 재생 상태/콜백을 전혀 쓰지 않으면서 `PostMedia`까지 그대로 통과만 시키는 prop drilling, ② `useSearchDrawer` 하위 검색 훅 3개의 데이터 페칭 전략이 서로 다름(하나만 TanStack Query, 나머지 둘은 수동 구현).

## 관찰한 증상

- `PostCard.tsx`가 `currentMusicId`/`isPlayingGlobal`/`onPlay`/`onPlayAll` 4개 prop을 받아 `PostMedia`에 그대로 넘기기만 하고, 컴포넌트 본문 어디서도 이 값을 직접 사용하지 않는다(순수 통과).
- `useItunesSearch`/`useYoutubeSearch`는 `useState`+`useEffect`+`AbortController`로 수동 페칭하는데, 같은 `useSearchDrawer`가 묶는 `useUserSearch`만 `useInfiniteQuery`(TanStack Query)를 쓴다 — 같은 드로어 안에서 탭(음악/영상/유저)마다 데이터 계층이 다르다.
- `useYoutubeSearch`는 `useRef(new Map())`으로 컴포넌트 로컬 캐시를 자체 구현한다 — 쿼리 클라이언트 캐시가 아니라서 드로어를 닫았다 열면(컴포넌트 unmount) 캐시가 사라진다.
- `PostHeader.tsx`가 게시글 삭제 성공 시 `feedQueryKey` 캐시를 `queryClient.setQueriesData`로 직접 조작한다 — `FeedView`/`FeedList`를 거치지 않고, 소유자가 아닌 컴포넌트가 피드 캐시를 직접 건드린다.

## 실제 사례

- `PostCard.tsx:24,75-78`: `currentMusicId`/`isPlayingGlobal`/`onPlay`/`onPlayAll`를 구조분해하지만 JSX에서 `<PostMedia>`로 그대로 전달하는 것 외엔 전혀 쓰지 않는다.
- `FeedList.tsx:24-26`: `handlePlay(music)`은 사실상 `playMusic(music)` 그대로다(피드 고유 로직 없음). `handlePlayAll(post)`은 `post.musics`를 클로저로 잡아 `addToQueue`/`selectMusic`을 호출하는데, `PostMedia`는 이미 `post` prop을 받고 있어(`post.musics`로 동일 데이터 접근 가능) 이 로직도 `PostMedia` 내부로 옮길 수 있어 보인다(가설).
- `hooks/search/useYoutubeSearch.ts:39,62-80`: `cache.current.has(trimmedQuery)` / `cache.current.set(...)`로 로컬 Map 캐시를 직접 구현.
- `components/post/partials/PostHeader.tsx:73-76`: 삭제 성공 콜백 안에서 `queryClient.setQueriesData({ queryKey: feedQueryKey }, ...)`로 피드 목록에서 직접 항목을 제거.
- `PostMedia.tsx`는 294줄로 저장소에서 가장 큰 컴포넌트이자 전용 테스트가 0개다(자체 스와이프 제스처 로직 포함) — 이 파일을 건드리는 변경은 안전망 없이 진행하면 위험이 크다.

## 초기 가설

- `PostCard`의 4개 prop 모두 `PostMedia`가 `usePlayerStore`를 직접 구독(다른 leaf 컴포넌트, 예: `PlaylistDetailModal/components/SongList.tsx`의 `SongItem`이 이미 쓰는 패턴)하면 없앨 수 있을 것 같다 — Context 없이 zustand 스토어를 바로 구독하면 되므로 이번 세션에서 쓴 Context 패턴보다 더 단순할 수 있다(가설, PostMedia가 `post.musics`를 이미 갖고 있어 `onPlayAll`까지 내부화 가능해 보이는지는 PRD에서 확인 필요).
- 검색 훅 3개를 전부 TanStack Query로 통일하면 로컬 Map 캐시 문제(드로어 재오픈 시 캐시 소실)가 자연히 해소될 것 같다(가설 — 서드파티 API라 쿼리 키 설계, rate limit 고려가 필요한지 PRD에서 확인).
- `feedQueryKey` 조작 책임을 `hooks/post` 공용 함수로 빼면 "누가 피드 캐시를 쓰는가"가 한 곳에 모일 것 같다(가설).

## 기대 효과

- `PostCard`/`FeedList`가 재생 상태를 몰라도 되게 만들어, 새 카드 변형이 추가될 때마다 재생 관련 4개 prop을 반복 배선하지 않아도 된다.
- 검색 탭 3개가 같은 데이터 계층(TanStack Query)을 쓰면, 로딩/에러/캐시 정책을 한 군데서 판단할 수 있다.
- 피드 캐시를 누가 쓰는지 명확해지면, 다음에 피드 표시 항목이 바뀔 때 어디를 고쳐야 하는지 바로 알 수 있다.

## 제약

- `PostMedia`의 기존 렌더링/스와이프 제스처 동작은 그대로 유지돼야 한다(전용 테스트가 없으므로, 구조 변경 전 characterization test 확보가 선행돼야 함).
- 서드파티 검색(iTunes/YouTube)의 현재 UX(디바운스, 취소 동작 등)는 그대로 유지돼야 한다.
- `useUserSearch`(이미 `useInfiniteQuery`)의 기존 동작(`followOverrides` 낙관적 UI 등)은 손대지 않는다.
- 두 문제(prop drilling / 검색 fetch 전략)를 한 사이클에서 같이 다룰지, 나눠서 다룰지는 PRD 목표 인터뷰에서 결정한다.
