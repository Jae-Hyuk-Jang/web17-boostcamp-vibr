# 문제 영역

모바일 재생목록(큐) 조회 화면의 이중 구현

## 관찰한 증상

- 모바일 `MiniPlayerBar`에 재생목록을 여는 진입점이 두 개 있고, 각각 다른 화면·다른 구현으로 연결된다.
  - 앨범아트/곡정보 탭(`onOpenFullPlayer`) → `RightPanel.tsx`의 풀스크린 오버레이(`isFullPlayerOpen`) → `NowPlaying` + `QueueList`(데스크탑과 동일 컴포넌트, 보관함/글쓰기 버튼 + 드래그 재정렬 + `TickerText` 마퀴 포함)
  - `ListPlus` 아이콘 버튼(`onToggleQueue`) → `useModalStore`의 `MODAL_TYPES.MOBILE_QUEUE` → `MobileNowPlaylistModal`(완전히 별도로 다시 짠 바텀시트, Clear 버튼만 있고 보관함/글쓰기 없음, 위/아래 화살표로만 순서 변경 가능, `TickerText` 없이 단순 truncate)
- 같은 "재생목록 보기"인데 어느 버튼으로 들어가느냐에 따라 할 수 있는 기능이 다르다.

## 실제 사례

- `apps/web/src/components/modals/MobileNowPlaylistModal/MobileNowPlaylistModal.tsx`(140줄) — `MobileQueueRow`를 자체 정의, `usePlayerStore`의 `queue`/`currentMusic`/`playMusic`/`clearQueue`/`removeFromQueue`/`moveUp`/`moveDown`을 직접 구독.
- `apps/web/src/components/player/QueueList.tsx`(243줄) — 같은 `usePlayerStore` 액션들을 쓰지만 `moveTo`(드래그 재정렬)까지 추가로 쓰고, 보관함 추가/추천 글 작성 버튼과 `TickerText`가 있다. `RightPanel.tsx`가 데스크탑 상시 패널과 모바일 풀플레이어 오버레이 양쪽에서 동일하게 이 컴포넌트를 사용한다.
- `MODAL_TYPES.MOBILE_QUEUE`는 `MobileNowPlaylistModal.tsx` 자신의 렌더 게이트와 `RightPanel.tsx`의 `ListPlus` 버튼 상태(`isQueueOpen`) 표시에만 쓰이고, 실제 큐 리스트 렌더링에는 관여하지 않는다.

## 초기 가설

- (가설) `MobileNowPlaylistModal`은 `RightPanel`의 풀플레이어 오버레이(및 그 안의 `QueueList`)가 이미 모바일에서도 동작한다는 걸 모른 채(또는 다른 시점에) 독립적으로 만들어졌을 가능성이 높다. git 히스토리가 스쿼시돼 있어 확정할 수는 없다.
- (가설) `MobileNowPlaylistModal`을 없애고 `ListPlus` 버튼도 `onOpenFullPlayer`로 연결하면 진입점이 하나로 합쳐지면서 모바일에서도 보관함/글쓰기/드래그 재정렬을 쓸 수 있게 될 것이다 — 다만 "풀스크린으로 전환되는 게" "가벼운 바텀시트로 슬쩍 열리는 것"보다 사용자 경험상 무거워지는 트레이드오프가 있을 수 있어 확인이 필요하다.

## 기대 효과

- 모바일 재생목록 관련 코드가 한 곳(`QueueList`)으로 모이면, 큐 UI를 바꿀 때 두 곳을 동시에 손대지 않아도 된다.
- 모바일에서도 보관함 추가/추천 글 작성/드래그 재정렬 같은 기능을 추가 구현 없이 바로 쓸 수 있게 된다.

## 제약

- `MiniPlayerBar`의 재생/이전곡/다음곡/보관함/글쓰기 버튼 동작은 이번 변경과 무관하게 유지되어야 한다.
- `RightPanel`의 데스크탑 상시 패널 동작(레이아웃, 리사이즈)은 변경하지 않는다.
- 기존 `MobileNowPlaylistModal.test.tsx`가 검증하던 "배경 클릭으로 닫힘" 같은 사용자 동작은 최종적으로 어떤 형태로든(같은 컴포넌트가 아니어도) 동등하게 유지되어야 한다.
