# VIBR 두 코드베이스 현황 비교 — 개인 사본 vibr vs 팀 저장소 Busy, 그리고 기반 자산 평가

> 조사 기준일 2026-11-13. 비교 기준: Busy `dev` HEAD [`eb3b2060`](https://github.com/boostcampwm2025/web17-Busy/commit/eb3b2060)(2026-09-04), vibr `main` HEAD [`e05dc2e`](https://github.com/Jae-Hyuk-Jang/web17-boostcamp-vibr/commit/e05dc2e)(2026-08-06), 공통 분기점 Busy [`f5a1c442`](https://github.com/boostcampwm2025/web17-Busy/commit/f5a1c442)(2026-06-11).
> 수치는 Busy 전체 클론(+ vibr를 원격으로 fetch)에 git/gh/grep/curl만 써서 낸 정적 분석 결과다. 빌드·테스트·앱 실행은 하지 않았다. "~케이스" 수는 `it(`/`test(` 줄을 정규식으로 센 근사치다.
> 표기: Busy = `boostcampwm2025/web17-Busy`, vibr = `Jae-Hyuk-Jang/web17-boostcamp-vibr`. myc0603(문예찬)의 커밋 author명은 `Yechan Moon`과 `chnn` 두 가지이며 같은 이메일/noreply ID를 쓴다.

## 1. 원래 서비스 기획: 문제 정의, 타깃, 핵심 가치, 핵심 기능, 성공 지표

### Takeaway

VIBR(Vibe + Resonance)는 "Human Curation"을 내건 소셜 뮤직 큐레이션 SNS로 기획됐다. 장르 유사도 알고리즘 대신 내가 신뢰하는 사람(팔로우)의 추천으로 음악을 발견하고, 추천 → 재생 → 반응을 한 앱 안에서 한 흐름으로 잇는 것이 핵심이다. 위키에는 개념, UX 루프, MVP 기능이 텍스트로 남아 있다. 반면 정량 성공 지표(KPI)와 구체적 페르소나는 없다. 팀은 아이디어를 고른 시점(2025-12)에 이미 "인스타 클론처럼 보일 위험", "효용을 한 문장으로 설명하기 어렵다"는 리스크를 적어 두었다.

### Cited Findings

- 서비스 정의: "음악으로 나를 표현하고 타인의 취향을 탐험하는 소셜 뮤직 큐레이션 플랫폼, VIBR(바이버)". 이름은 "Vibe(분위기) + Resonance(공명)". 목표로 "기계적인 알고리즘 추천이 아닌, 사람이 중심이 되는 음악 공유 공간"과 "음악을 추천받는 공간과 재생하는 공간이 달라서 생기는 반응의 단절을 하나의 흐름으로 잇는다"를 내세웠다. — [위키: 서비스 기획서](https://github.com/boostcampwm2025/web17-Busy/wiki/서비스-기획서) (최종 수정 2026-02-01, Yebin Kim)
- 같은 페이지의 '문제 정의'와 '우리의 목표' 슬라이드는 이미지로만 올라가 있고 텍스트 본문이 없다. — [위키: 서비스 기획서](https://github.com/boostcampwm2025/web17-Busy/wiki/서비스-기획서)
- 핵심 가치 "Human Curation"은 네 가지다. ① 신뢰하는 친구와 구독하는 사람의 추천으로 이뤄지는 "사람 기반의 알고리즘" ② 내가 공유한 곡이 누군가에게 닿는 "연결의 경험" ③ 앨범 아트 중심의 "시각적인 피드"와 프로필에 쌓이는 "나의 음악적 색깔 아카이빙" ④ 상대가 어떤 앱을 쓰든 "누구나 제약 없이" 공유하고 즉시 재생. — [위키: 서비스 기획서](https://github.com/boostcampwm2025/web17-Busy/wiki/서비스-기획서)
- 목표 UX 루프는 네 단계다. Discover(친구 피드에서 발견하고 앨범 커버를 누르면 즉시 재생) → Reaction(좋아요·댓글) → Expand(보관함에 저장, 추천자 프로필 방문) → Share(듣고 있는 곡을 바로 포스팅하는 퀵 액션). 이렇게 쓴 글이 "또다시 누군가의 발견 경험"이 되며 순환한다. — [위키: 서비스 기획서](https://github.com/boostcampwm2025/web17-Busy/wiki/서비스-기획서)
- 아이디어 단계 기록(2025-12-09). 문제 정의는 "음악 취향을 공유하고 싶은 사람은 많지만, 링크 공유를 넘어서 나만의 음악 정체성을 표현할 수 있는 공간은 부족하다"였다. 타깃은 "음악 듣는 걸 좋아하고, 자신의 취향을 적극 공유하고 싶은 사람들 / 넓게는 모든 음악 리스너"다. AS-IS는 "링크 공유 중심", 유사 서비스로 Solance를 들었다. Pain Point는 "Solance는 스포티파이 계정의 들었던 곡/아티스트 공유에 가깝고, 특정 곡을 골라 추천하는 경험은 약함"이다. — [위키: Day-02 회의](https://github.com/boostcampwm2025/web17-Busy/wiki/🗓️-Day-02-회의)
- 팀이 남긴 검증 질문은 세 가지다. "이미 스트리밍, 인스타, 카톡 등에서 음악을 충분히 공유할 수 있는데, 굳이 우리 서비스에서 공유하는 것이 더 좋은가?", "사람들은 알고리즘 추천으로도 음악을 잘 받는데, 굳이 사람에게 추천받고 싶어 할까?", "왜 이 서비스가 SNS 형태여야 하는가?" — [위키: Day-03 회의](https://github.com/boostcampwm2025/web17-Busy/wiki/🗓️-Day-03-회의)
- 최종 Key Question은 "어떻게 하면 사용자가 '내가 좋아하는 음악을 친구에게 추천하고, 그 친구가 실제로 그 음악을 듣고, 반응까지 받는 경험'을 한 화면/한 플로우 안에서 끝낼 수 있을까?"이고, 요약은 "추천과 체험의 공간이 동일한 소셜 음악 공간"이다. — [위키: Day-04 회의](https://github.com/boostcampwm2025/web17-Busy/wiki/🗓️-Day-04-회의)
- 아이디어 선택 때 적은 리스크는 "'인스타 클론코딩'처럼 보일 위험", "현재까지의 기획만으로는 효용성을 한 문장으로 설명하기 어렵다", "Spotify API 등 외부 스트리밍 플랫폼 의존성이 크다"였다. 선택 이유는 단계별 개발과 확장성, 웹 기술 도전 요소(피드·알고리즘·실시간·스트리밍), 팀 전원이 "써보고 싶다"고 공감한 점이다. — [위키: Day-04 회의](https://github.com/boostcampwm2025/web17-Busy/wiki/🗓️-Day-04-회의)
- MVP 페이지 초안은 세 화면이다. 피드(팔로우한 사람들의 추천곡, 재생, 플레이리스트 추가), 프로필(추천곡·플레이리스트의 타임라인/그리드, 후순위로 기간별 통계 '리캡'), 검색(음악·사용자). — [위키: Day-04 회의](https://github.com/boostcampwm2025/web17-Busy/wiki/🗓️-Day-04-회의)
- 위키 '기능' 페이지가 정리한 완성 기능은 세 묶음이다. 음악 통합 플레이어("음원 30초 미리듣기 기능과 음악 영상 재생 기능"), 검색과 재생 흐름(음원 검색→오디오 재생, 유튜브 검색→비디오 재생, 사용자 검색), SNS 커뮤니티(무한스크롤 피드, "팔로잉 유저의 게시글과 사용자 로그 기반 알고리즘으로 필터링한 추천 컨텐츠", 알림, 좋아요·댓글). — [위키: 기능](https://github.com/boostcampwm2025/web17-Busy/wiki/기능)
- 팀 구성: J048 김승호(seunghok22), J055 김예빈(yebinGold), J100 문예찬(myc0603), J237 장재혁(Jae-Hyuk-Jang). — [위키: Home](https://github.com/boostcampwm2025/web17-Busy/wiki/Home)
- 성공 지표: 위키 전체를 "지표/KPI/MAU/DAU/리텐션/전환율/성공 기준"으로 검색했지만 제품 지표는 없었다. 유일하게 Day-08에 "기능별 DoD/완성도 기준을 측정 가능한 지표(응답시간 p95, 오류율, 동시성, 상태복구 등) 형태로 재정리"라는 기술 지표 문구가 있다. — [위키: Day-08 회의](https://github.com/boostcampwm2025/web17-Busy/wiki/🗓️-Day-08-회의)

### Inferences

- 기획이 내세운 차별점은 "사람 기반 추천 + 앱 안에서 즉시 재생 + 반응"의 결합이다. 그런데 팀 스스로 Day-03·04에 이 차별성("왜 굳이 이 앱인가")을 미해결 질문으로 남겼다. 지금 사용자가 느끼는 "차별점이 없다"는 감각은 기획 단계부터 풀리지 않은 문제가 이어진 것으로 보인다.
- 정량 성공 지표가 없어서, 배포 기간(vibr.site)에 제품 가설이 검증됐는지 저장소와 위키만으로는 판단할 근거가 없다.

### Gaps

- '문제 정의'·'목표' 슬라이드는 이미지라서 텍스트 내용을 확인하지 못했다.
- 위키가 링크한 Notion 기획 문서(https://www.notion.so/2fa4d1a0b22880389f4bcb03842db03a)는 HTTP 200을 반환했지만 JS로 렌더링되는 페이지라 내용을 읽지 못했다. 페르소나와 KPI가 그쪽에 있을 수 있다.
- 실사용자 수, 리텐션 같은 운영 데이터는 저장소와 위키에서 찾지 못했다.

## 2. 두 코드베이스의 사용자 기능 현황 (공통 기능 / 한쪽에만 있는 기능)

### Takeaway

사용자에게 보이는 기능은 두 저장소가 사실상 같다. 라우트 파일 12개와 API 모듈 17개가 이름까지 일치하고, 컴포넌트 이름 86개가 공통이다. 차이는 내부 구조와 품질(버그 수정, 성능) 쪽이다. 분기 이후 어느 쪽에도 새 사용자 기능은 추가되지 않았다. 모바일 RN 앱과 사용설명 모달은 Busy의 미병합 브랜치에만 있다.

### Cited Findings

- 라우트는 양쪽 동일한 12개다. `(home)`, `archive`, `post/[id]`, `profile`, `profile/[id]`, `profile/[id]/posts`, `setting`, `setting/terms`, `offline` 페이지와 route handler `api/youtube-search`, `auth/google`, `auth/google/callback`. — [Busy apps/web/app](https://github.com/boostcampwm2025/web17-Busy/tree/dev/apps/web/app), [vibr apps/web/app](https://github.com/Jae-Hyuk-Jang/web17-boostcamp-vibr/tree/main/apps/web/app) (`git ls-tree`로 비교)
- API 모듈도 양쪽 동일한 17개다. algorithm, auth, comment, feed, follow, like, log, music, noti, now-playlist, playlist, post, privacy, seed, trending, upload, user. — [Busy modules](https://github.com/boostcampwm2025/web17-Busy/tree/dev/apps/api/src/modules), [vibr modules](https://github.com/Jae-Hyuk-Jang/web17-boostcamp-vibr/tree/main/apps/api/src/modules)
- 공통 컴포넌트 86개로 확인되는 기능군(`*.tsx` 이름 비교):
  - 피드: FeedList, FeedView, PostCard
  - 게시글 작성·상세: ContentWriteModal, PostCardDetailModal, PostDetailCommentComposer, LikedUsersOverlay
  - 플레이어·큐: NowPlaying, MiniPlayerBar, QueueList, SeekBar, VolumeControl, PlaybackProvider
  - 플레이리스트·보관함: PlaylistDetailModal, PlaylistPickerModal, ArchiveView
  - 알림: NotiDrawerContent, NotiItem, MobileNotiOverlay
  - 검색: MusicSearch, UserSearchResults, SearchDrawerContent
  - 프로필·팔로우: ProfileInfo, FollowStats, ProfileActionButton, UserListModal
  - 약관: PrivacyConsentModal/Form/View
  - PWA: PwaInstallBanner, PwaRegister
  - 모바일 UX: MobileBottomNav, MobileBottomSheet, Drawer, ResizableRightPanel
  - 로그인: GoogleLoginButton, TmpLoginButton

  — [Busy components](https://github.com/boostcampwm2025/web17-Busy/tree/dev/apps/web/src/components), [vibr components](https://github.com/Jae-Hyuk-Jang/web17-boostcamp-vibr/tree/main/apps/web/src/components)

- Busy에만 있는 컴포넌트 이름 27개는 대부분 분해된 하위 컴포넌트다(PostDetailDesktopModal, PostDetailMobileSheet, QueueToolbar, QueueReorderControls, PrivacyConsentGate, SearchTabs, SearchDropdown, CloseButton, IconButton 등). vibr에만 있는 16개는 Context와 공용 UI다(PostDetailModalContext, PlaylistDetailModalContext, ContentWriteContext, PostDetailReactionsContext, Button, ModalCloseButton, ModalPanel, MusicPickerSearch, ItunesEngine, YouTubeEngine, NotiPollingGate 등). — 위 두 components 트리 비교
- Spotify 연동은 양쪽이 각자 삭제했다. vibr [`7312f69`](https://github.com/Jae-Hyuk-Jang/web17-boostcamp-vibr/commit/7312f69)(2026-08-04, #241), Busy [`90b26a34`](https://github.com/boostcampwm2025/web17-Busy/commit/90b26a34)(2026-08-25, "미사용 Spotify 인증·재생 경로 제거").
- '리캡' 버튼은 양쪽 `ProfileActionButton.tsx`에 있다. vibr 이슈는 이를 "미완성 상태로 프로덕션에 노출"로 기록했다. — [vibr #229](https://github.com/Jae-Hyuk-Jang/web17-boostcamp-vibr/issues/229)
- `usePlaylistRecommendations`는 이름과 달리 글쓰기 드롭다운에서 내 플레이리스트 목록과 상세를 불러오는 훅이다. 양쪽 `apps/api/src` 어디에도 'recommend'를 쓰는 추천 API가 없다.
  - vibr는 실패하면 `MOCK_PLAYLIST_BRIEFS` 목업으로 폴백하고, 이슈로 "실제 백엔드 에러를 가림"을 남겼다. — [vibr #224](https://github.com/Jae-Hyuk-Jang/web17-boostcamp-vibr/issues/224)
  - Busy는 목업이 없다. — [Busy use-playlist-recommendations.ts](https://github.com/boostcampwm2025/web17-Busy/blob/dev/apps/web/src/hooks/playlist/use-playlist-recommendations.ts)
- Busy에서만 반영된 사용자 체감 수정(2026-08):
  - YouTube가 저장된 볼륨을 무시하던 문제 [`362dd55d`](https://github.com/boostcampwm2025/web17-Busy/commit/362dd55d)
  - 컨트롤 disabled/hover 오작동 [`c82c5756`](https://github.com/boostcampwm2025/web17-Busy/commit/c82c5756)
  - 드래그 시 0번 곡이 이동하던 문제 [`7353006a`](https://github.com/boostcampwm2025/web17-Busy/commit/7353006a)
  - 전체화면 플레이어 history 누수와 스와이프 오작동 [`4928831c`](https://github.com/boostcampwm2025/web17-Busy/commit/4928831c)
  - 좋아요·음악추가 시 unhandled rejection [`6c651fc2`](https://github.com/boostcampwm2025/web17-Busy/commit/6c651fc2), [`285e45b4`](https://github.com/boostcampwm2025/web17-Busy/commit/285e45b4)
  - 무한스크롤 중복 요청과 고정 지연 제거 [`0333504c`](https://github.com/boostcampwm2025/web17-Busy/commit/0333504c), [`cb81cf96`](https://github.com/boostcampwm2025/web17-Busy/commit/cb81cf96)
  - 팔로우 상태가 되돌아가던 문제 [`0821e39a`](https://github.com/boostcampwm2025/web17-Busy/commit/0821e39a)
  - 이미지 lazy 로딩과 커버 크기 축소 [`fabd88bc`](https://github.com/boostcampwm2025/web17-Busy/commit/fabd88bc), [`370a4125`](https://github.com/boostcampwm2025/web17-Busy/commit/370a4125)
- Busy는 프로필 피드 N+1도 없앴다. 상수 쿼리 수로 동작하는 프로필 피드 엔드포인트를 새로 만들었고([`570f50db`](https://github.com/boostcampwm2025/web17-Busy/commit/570f50db), [`38dc1342`](https://github.com/boostcampwm2025/web17-Busy/commit/38dc1342), [`cb91985a`](https://github.com/boostcampwm2025/web17-Busy/commit/cb91985a)), 위키에 "두 지표 모두 O(N)에서 O(1)로 바뀌었다"는 실측 결과를 남겼다. — [위키: 프로필-게시글-목록-요청-수-실측](https://github.com/boostcampwm2025/web17-Busy/wiki/프로필-게시글-목록-요청-수-실측)
- vibr에서만 반영된 사용자 체감 수정:
  - "방금 쓴 댓글이 사라지는 버그" [`987f586`](https://github.com/Jae-Hyuk-Jang/web17-boostcamp-vibr/commit/987f586)(#184)
  - 플레이리스트 피커 저장 후 캐시 동기화 [`e05dc2e`](https://github.com/Jae-Hyuk-Jang/web17-boostcamp-vibr/commit/e05dc2e)(#291)
  - `PATCH /post/:id`의 `await` 누락. vibr는 `await this.postService.update(...)`로 고쳤고, Busy는 아직 `this.postService.update(...)`를 await 없이 호출한다. Busy 이슈 #382 "await 없이 응답해 수정 실패가 성공으로 반환됨"이 가리키는 버그다. — [Busy post.controller.ts](https://github.com/boostcampwm2025/web17-Busy/blob/dev/apps/api/src/modules/post/post.controller.ts), [vibr post.controller.ts](https://github.com/Jae-Hyuk-Jang/web17-boostcamp-vibr/blob/main/apps/api/src/modules/post/post.controller.ts), [Busy #382](https://github.com/boostcampwm2025/web17-Busy/issues/382)
- 약관 동의 화면은 두 쪽이 다르다. Busy는 `api/queryKeys/consents.ts`, `hooks/privacy`(6파일), `PrivacyConsentGate`로 TanStack Query 전환을 마쳤다. vibr의 `PrivacyConsentView`는 아직 `useState`+`useEffect`로 직접 페칭한다(CLAUDE.md에 명시). — [Busy queryKeys](https://github.com/boostcampwm2025/web17-Busy/tree/dev/apps/web/src/api/queryKeys), [vibr CLAUDE.md](https://github.com/Jae-Hyuk-Jang/web17-boostcamp-vibr/blob/main/CLAUDE.md)
- 어느 메인라인에도 병합되지 않은 사용자 기능이 둘 있다.
  - React Native 앱 `apps/mobile`: Expo ~54.0.0, react-native 0.81.5, expo-router, react-native-youtube-iframe 사용. 로그인, 탭(피드·검색·프로필), 팔로우, 타인 프로필 화면이 있다. — [compare dev...feat/mobile-app](https://github.com/boostcampwm2025/web17-Busy/compare/dev...feat/mobile-app)
  - 사용설명 모달 `UsageModal`. — [compare dev...feat/296-user-manual](https://github.com/boostcampwm2025/web17-Busy/compare/dev...feat/296-user-manual)

### Inferences

- 사용자 관점에서 A/B 선택은 "기능 차이"가 아니라 "버그·성능·운영 신뢰성 차이"의 선택이다. Busy 쪽이 플레이어, 무한스크롤, 로그 유실, 이미지 성능 같은 체감 문제를 더 많이 고쳤다. vibr 쪽은 API 계약 버그(#382)와 댓글 소실 같은 일부만 고쳤다.
- 핵심 컨셉("사람 기반 추천")을 UI에서 드러낼 기능은 양쪽 모두 비어 있거나 미완성이다. 추천 API가 없고 리캡 버튼은 미완성이며, 피드의 그룹 필터는 사용자에게 보이지 않는다.

### Gaps

- 런타임 실행을 하지 않았기 때문에 각 기능이 실제로 동작하는지, 특히 Busy의 대규모 8월 리팩터 이후 상태는 확인하지 못했다.

## 3. vibr 스냅샷은 Busy의 어느 커밋과 가까운가, 이후 각자 무엇이 바뀌었나, 이중 TanStack Query 전환 후 얼마나 호환되지 않는가

### Takeaway

vibr의 첫 커밋 `8bc7786`("chore: initial commit", 2026-07-08)은 Busy `dev`의 [`f5a1c442`](https://github.com/boostcampwm2025/web17-Busy/commit/f5a1c442)(2026-06-11, PR #308 머지)와 `apps/web/public/favicon.svg` 한 파일만 다르다. Busy `dev`에는 06-11부터 07-18까지 커밋이 없었으므로 vibr는 사실상 당시 dev 최신본의 사본이다. 이후 같은 사람(장재혁)이 두 저장소를 각자 크게 고쳐 놓아서, 지금 `apps/web`에서 같은 경로·같은 내용인 파일은 39개뿐이다(Busy 384개, vibr 345개 중). 두 쪽이 모두 고친 기준 경로도 177개다. merge나 cherry-pick로 합치는 것은 비현실적이고, 한쪽을 골라 다른 쪽 개선을 다시 구현해야 하는 상태다.

### Cited Findings

- 가장 가까운 커밋 찾기: 2026-05-01~07-12 사이 모든 ref의 커밋을 vibr `8bc7786`과 `git diff --name-only`로 비교했다.
  - Busy `f5a1c442`(2026-06-11 16:42 KST, "Merge pull request #308 … fix/sidebar-icon-flicker", 작성 chnn=myc0603)와 직전 `9f8886de`는 1개 파일(`favicon.svg`, ±9줄)만 다르다.
  - main의 `13ef808f`(2026-06-18, PR #310 dev→main)는 여기에 `MobileNotiOverlay.tsx` 3줄이 더해져 2개 파일이 다르다.

  — [PR #308](https://github.com/boostcampwm2025/web17-Busy/pull/308), [vibr 8bc7786](https://github.com/Jae-Hyuk-Jang/web17-boostcamp-vibr/commit/8bc7786)

- `f5a1c442`는 dev의 first-parent 체인 위에 있다. dev에서 그 다음 커밋은 07-18의 `d2b9727b`이고, 그 사이에는 커밋이 없다. — [Busy dev 커밋 목록](https://github.com/boostcampwm2025/web17-Busy/commits/dev)
- **Busy의 분기 이후 변경**: 352커밋(비머지 263). 월별로 2026-07에 장재혁 17·myc0603 13, 2026-08에 장재혁 230, 2026-09에 장재혁 3이다. 파일 474개가 바뀌었고(+19,943/−8,801), 그중 apps/web이 434개, apps/api가 18개다. — [compare f5a1c442...dev](https://github.com/boostcampwm2025/web17-Busy/compare/f5a1c442...dev)
- Busy 8월은 302커밋(머지 73)이고, 비머지 기준 유형은 refactor 140, test 36, fix 22, feat 16, chore 9, docs 3, perf 2, ci 1이다. — `git log --no-merges origin/dev --since=2026-08-01 --until=2026-09-01`, [Busy dev](https://github.com/boostcampwm2025/web17-Busy/commits/dev)
- Busy의 분기 이후 주요 흐름:
  - AWS 이전(myc0603, 07-18): [`d2b9727b`](https://github.com/boostcampwm2025/web17-Busy/commit/d2b9727b) "배포 워크플로우를 단일 EC2 + ARM 구조로 재작성", [`b814b5d8`](https://github.com/boostcampwm2025/web17-Busy/commit/b814b5d8) compose dev/prod 분리, [`4ed95fb2`](https://github.com/boostcampwm2025/web17-Busy/commit/4ed95fb2) nginx 독립 컨테이너, [`7564762f`](https://github.com/boostcampwm2025/web17-Busy/commit/7564762f) 커버 이미지 NCP→S3
  - TanStack Query(장재혁): [`144a6782`](https://github.com/boostcampwm2025/web17-Busy/commit/144a6782)(07-25 "tanstack query 기반 설정 추가")에서 [`cd21f0fe`](https://github.com/boostcampwm2025/web17-Busy/commit/cd21f0fe)(08-01 "authMe 조회를 query cache로 통합")를 거쳐 8월까지 이어짐
  - 훅 파일 kebab-case 전환: 현재 `hooks/` 67개 파일이 모두 `use-*.ts`
  - 플레이어 정책/어댑터 분리: `hooks/player/playback-policy.ts`, `use-itunes-playback.ts`, `use-youtube-playback.ts`
  - `components/common/{CloseButton,ModalShell}.tsx` 공용화
  - 로그 keepalive: [`d2312b95`](https://github.com/boostcampwm2025/web17-Busy/commit/d2312b95)(09-03), 측정 하네스 [`1c9447c8`](https://github.com/boostcampwm2025/web17-Busy/commit/1c9447c8)(09-04)
  - CLAUDE.md와 .claude를 git 추적에서 제외: [`e7db569b`](https://github.com/boostcampwm2025/web17-Busy/commit/e7db569b)(09-03)
- **vibr의 분기 이후 변경**: 80커밋(전부 장재혁, 2026-07-18~08-06). 파일 487개가 바뀌었고(+31,765/−4,367), apps/web 257, docs 134, apps/api 58, packages/dto 12, .claude 9개다. — [vibr 커밋 목록](https://github.com/Jae-Hyuk-Jang/web17-boostcamp-vibr/commits/main), `git diff --stat 8bc7786 vibr/main`
- vibr의 주요 흐름:
  - 품질 기반 정비(07-18): CI [`f5b38ce`](https://github.com/Jae-Hyuk-Jang/web17-boostcamp-vibr/commit/f5b38ce)(#16), web lint 경고 162건 정리 [`6928835`](https://github.com/Jae-Hyuk-Jang/web17-boostcamp-vibr/commit/6928835)(#19), API 타입 위반 191건 정리 [`b1454b6`](https://github.com/Jae-Hyuk-Jang/web17-boostcamp-vibr/commit/b1454b6)(#20), API 테스트 3스위트 복구 [`65fc63b`](https://github.com/Jae-Hyuk-Jang/web17-boostcamp-vibr/commit/65fc63b)(#21), API strict 모드 [`0c24e46`](https://github.com/Jae-Hyuk-Jang/web17-boostcamp-vibr/commit/0c24e46)(#24)
  - jest+RTL 도입 [`e2fbfff`](https://github.com/Jae-Hyuk-Jang/web17-boostcamp-vibr/commit/e2fbfff)(#40)
  - ModalShell [`998e6cc`](https://github.com/Jae-Hyuk-Jang/web17-boostcamp-vibr/commit/998e6cc)(#72)
  - Playwright [`7e84baf`](https://github.com/Jae-Hyuk-Jang/web17-boostcamp-vibr/commit/7e84baf)(#95)
  - TanStack Query: [`0c44247`](https://github.com/Jae-Hyuk-Jang/web17-boostcamp-vibr/commit/0c44247)(#148, 07-22) → 쿼리 키 중앙화 [`1734996`](https://github.com/Jae-Hyuk-Jang/web17-boostcamp-vibr/commit/1734996)(#217) → QueryClient 정책 [`1dea131`](https://github.com/Jae-Hyuk-Jang/web17-boostcamp-vibr/commit/1dea131)(#223) → useAuthStore 제거 [`6bace72`](https://github.com/Jae-Hyuk-Jang/web17-boostcamp-vibr/commit/6bace72)(#235)
  - Spotify 삭제 [`7312f69`](https://github.com/Jae-Hyuk-Jang/web17-boostcamp-vibr/commit/7312f69)(#241)
  - Context 기반 모달 구독: [`a144edd`](https://github.com/Jae-Hyuk-Jang/web17-boostcamp-vibr/commit/a144edd)(#258), [`0e47a3a`](https://github.com/Jae-Hyuk-Jang/web17-boostcamp-vibr/commit/0e47a3a)(#268), [`b9580a7`](https://github.com/Jae-Hyuk-Jang/web17-boostcamp-vibr/commit/b9580a7)(#270), [`0167e18`](https://github.com/Jae-Hyuk-Jang/web17-boostcamp-vibr/commit/0167e18)(#287)
  - 기획·리팩터 스킬: [`68773c3`](https://github.com/Jae-Hyuk-Jang/web17-boostcamp-vibr/commit/68773c3)(#31), [`388911d`](https://github.com/Jae-Hyuk-Jang/web17-boostcamp-vibr/commit/388911d)(#35), [`1026515`](https://github.com/Jae-Hyuk-Jang/web17-boostcamp-vibr/commit/1026515)(#80)
- **현재 두 저장소의 차이**: vibr `main`과 Busy `dev`는 파일 764개가 다르고, 그중 603개가 apps·packages 안에 있다. — `git diff --name-status -M vibr/main origin/dev`, [Busy dev](https://github.com/boostcampwm2025/web17-Busy/tree/dev), [vibr main](https://github.com/Jae-Hyuk-Jang/web17-boostcamp-vibr/tree/main)
- 영역별로 같은 경로의 blob을 비교한 결과:

  | 영역     | 같은 경로·동일 내용 | 같은 경로·내용 다름 | Busy에만 | vibr에만 | 전체 파일 수       |
  | -------- | ------------------- | ------------------- | -------- | -------- | ------------------ |
  | apps/web | 39                  | 82                  | 263      | 224      | Busy 384, vibr 345 |
  | apps/api | 60                  | 59                  | 3        | 2        |                    |
  | packages | 58                  | 11                  | 5        | 11       |                    |

  — `git ls-tree -r` 비교, [Busy dev](https://github.com/boostcampwm2025/web17-Busy/tree/dev), [vibr main](https://github.com/Jae-Hyuk-Jang/web17-boostcamp-vibr/tree/main)

- 분기점 이후 두 쪽이 모두 수정한 기준 경로는 177개(apps/web 156, apps/api 11)다. 이름 변경은 Busy 61건, vibr 16건이다. — 위 두 diff의 교집합
- 설계가 충돌하는 지점:
  - **쿼리 키**: Busy는 `src/api/queryKeys/{auth,consents,notifications,playlists,posts,profiles,search,users}.ts`에 팩토리 객체를 둔다(예: `postQueryKeys.detail(postId)` → `['post', postId]`). vibr는 `src/query-keys/{auth,feed,noti,nowPlaylist,playlist,post,profile,search}.ts`에 함수를 하나씩 export한다(예: `postDetailQueryKey(postId)` → `['postDetail', postId]`). — [Busy posts.ts](https://github.com/boostcampwm2025/web17-Busy/blob/dev/apps/web/src/api/queryKeys/posts.ts), [vibr post.ts](https://github.com/Jae-Hyuk-Jang/web17-boostcamp-vibr/blob/main/apps/web/src/query-keys/post.ts)
  - **QueryProvider 위치**: Busy는 `components/app/QueryProvider.tsx`, vibr는 `components/providers/QueryProvider.tsx`.
  - **테스트 러너**: Busy는 vitest+jsdom, vibr는 jest+jest-environment-jsdom이다(양쪽 모두 @testing-library/react와 @playwright/test). — [Busy web package.json](https://github.com/boostcampwm2025/web17-Busy/blob/dev/apps/web/package.json), [vibr web package.json](https://github.com/Jae-Hyuk-Jang/web17-boostcamp-vibr/blob/main/apps/web/package.json)
  - **훅 파일명**: Busy는 kebab-case 67개·camelCase 0개, vibr는 kebab-case 0개·camelCase 39개.
  - **모달 배치**: Busy는 `components/modals`를 해체해 `auth/LoginModal`, `post/ContentWriteModal`, `post/PostCardDetailModal`, `common/ModalShell`, `app/ModalContainer`로 흩었다. vibr는 `components/modals`를 유지하고 `components/ui`(Button, ModalCloseButton, ModalPanel 등)를 새로 만들었다.
  - **TanStack Query 훅 사용 파일**: Busy 23개, vibr 30개(`useQuery|useMutation|useInfiniteQuery` grep).
- 핵심 의존성 버전은 같다. next 16.0.10, react ^19.2.0, @tanstack/react-query ^5.101.x, zustand ^5.0.9. — 위 두 package.json

### Inferences

- 두 웹 앱은 "같은 앱의 두 갈래"라기보다 "같은 기능을 서로 다른 구조로 다시 쓴 두 구현"에 가깝다. 같은 내용의 파일이 약 10%뿐이다. git으로 합칠 수 있는 단계는 지났고, 한쪽을 기준으로 다른 쪽 개선을 의미 단위로 다시 구현해야 한다.
- 백엔드는 덜 갈라졌다. apps/api 파일의 절반이 동일하고, 현재 차이는 +999/−469줄이다. 그래서 백엔드 개선은 비교적 적은 비용으로 서로 옮길 수 있다.
- 장재혁은 2026-07-22~08-06 동안 두 저장소에서 같은 주제(TanStack Query 도입, ModalShell 공통화, Spotify 제거)를 병행했다. 결과적으로 같은 문제를 두 번 풀었다.

### Gaps

- vibr 초기 커밋에서 favicon만 다른 이유(의도적 수정인지)는 확인할 수 없었다.

## 4. 저장소별 품질 신호: 테스트, CI, lint/타입 설정, 문서, 코드 규모

### Takeaway

Busy는 테스트 양이 더 많다(웹 유닛 61파일/~331케이스, Playwright 13스펙 중 측정 하네스 7개). 하지만 CI 워크플로가 둘 다 수동 비활성화돼 있고, 8월 품질 워크플로 실행의 80%(45회 중 36회)가 실패했으며, web lint 경고 허용치를 89로 열어 두었다. vibr는 테스트가 적다(웹 49파일/~277케이스, e2e 스모크 1개). 대신 CI가 켜져 있고 최근 100회 중 99회 통과했으며, lint 경고 0, API strict 타입과 API 테스트 복구, 27개 리팩터 사이클 문서화를 갖췄다.

### Cited Findings

- 규모와 테스트 비교(`r1-scripts/quality.sh`로 산출: `git grep -c ''` 줄 수, 정규식 케이스 수 근사):

  | 항목                                      | Busy `dev`                                                                        | vibr `main`                       | 분기점 `f5a1c442`  |
  | ----------------------------------------- | --------------------------------------------------------------------------------- | --------------------------------- | ------------------ |
  | apps/web 코드(ts/tsx/js/css, 테스트 포함) | 368파일 / 23,868줄                                                                | 331 / 19,867                      | 261 / 14,461       |
  | apps/web 비테스트 ts/tsx                  | 286 / 13,478                                                                      | 276 / 13,742                      | 256 / 14,160       |
  | apps/api (테스트 포함)                    | 111 / 8,421                                                                       | 110 / 7,884                       | 110 / 7,895        |
  | apps/api 비테스트                         | 99 / 6,638                                                                        | 100 / 6,445                       | 100 / 6,529        |
  | packages/dto                              | 62 / 534                                                                          | 63 / 512                          | 62 / 510           |
  | packages/ui                               | 삭제([`fb8a13c3`](https://github.com/boostcampwm2025/web17-Busy/commit/fb8a13c3)) | 1 / 4                             | 1 / 4              |
  | docs/ (md·html)                           | 없음(위키 사용)                                                                   | 134 / 19,940                      | 없음               |
  | 웹 유닛 테스트                            | vitest 61파일 / ~331케이스                                                        | jest+RTL 49파일 / ~277케이스      | 0                  |
  | 웹 E2E                                    | Playwright 13스펙 / ~27테스트                                                     | Playwright 1스펙(smoke) / 2테스트 | 0                  |
  | API 유닛                                  | 10 spec / ~52                                                                     | 8 / ~37                           | 8 / ~37            |
  | API e2e                                   | 기본 `app.e2e-spec.ts` 1개                                                        | 동일                              | 동일               |
  | web lint 스크립트                         | `eslint --max-warnings 89`                                                        | `eslint --max-warnings 0`         | `--max-warnings 0` |
  | API tsconfig                              | `strictNullChecks: true`, `noImplicitAny: false`(분기점과 같음)                   | 공유 base 상속(`strict: true`)    | Busy와 같음        |

  — [Busy dev 트리](https://github.com/boostcampwm2025/web17-Busy/tree/dev), [vibr main 트리](https://github.com/Jae-Hyuk-Jang/web17-boostcamp-vibr/tree/main), [f5a1c442 트리](https://github.com/boostcampwm2025/web17-Busy/tree/f5a1c442)

- Busy CI는 두 개다. `deploy.yml`("Build and Deploy", main push 시 ECR 빌드 → EC2 SSH 배포)과 `frontend-quality.yml`(dev/main 대상 PR에서 check-types, lint, vitest, Playwright 실행). GitHub API 기준 둘 다 `disabled_manually` 상태이고, API 테스트를 돌리는 CI는 없다. — [Busy .github/workflows](https://github.com/boostcampwm2025/web17-Busy/tree/dev/.github/workflows)
- Busy Frontend Quality 실행 이력: 2026-07 성공 12/실패 2, 2026-08 성공 9/실패 36. 마지막 실행(2026-08-24) 5건은 모두 실패다. — [Actions: frontend-quality.yml](https://github.com/boostcampwm2025/web17-Busy/actions/workflows/frontend-quality.yml)
- Busy는 2026-08-24 [`ab5f9c04`](https://github.com/boostcampwm2025/web17-Busy/commit/ab5f9c04) "lint 경고 상한을 CI가 강제하도록 변경"으로 상한을 89로 두었고, 2026-07-22 [`f39f5e8c`](https://github.com/boostcampwm2025/web17-Busy/commit/f39f5e8c) "commitlint 설정 제거"를 했다. vibr는 commitlint와 lint-staged를 유지한다. — [vibr 루트](https://github.com/Jae-Hyuk-Jang/web17-boostcamp-vibr/tree/main)
- vibr CI `ci.yml`은 main 대상 PR/push에서 `pnpm dto` → `pnpm lint` → `pnpm check-types` → `pnpm test`(전 워크스페이스)를 실행하며 활성 상태다. 최근 100회 실행 중 성공 99/실패 1이다. — [vibr ci.yml](https://github.com/Jae-Hyuk-Jang/web17-boostcamp-vibr/blob/main/.github/workflows/ci.yml), [vibr Actions](https://github.com/Jae-Hyuk-Jang/web17-boostcamp-vibr/actions)
- vibr의 API 위생 작업은 세 가지다.
  - [`b1454b6`](https://github.com/Jae-Hyuk-Jang/web17-boostcamp-vibr/commit/b1454b6): "apps/api 타입 안전성 위반 191건 전부 정리"(32파일 +233/−167)
  - [`0c24e46`](https://github.com/Jae-Hyuk-Jang/web17-boostcamp-vibr/commit/0c24e46): API strict 모드 활성화
  - [`65fc63b`](https://github.com/Jae-Hyuk-Jang/web17-boostcamp-vibr/commit/65fc63b): "apps/api 테스트 스위트 3개 실패(14건) 전부 정리". `user.repository.ts`와 `user.service.ts` 본 코드 수정도 들어 있다.

  이 커밋이 고친 spec 3개(`algorithm.spec.ts`, `follow.service.spec.ts`, `user.service.spec.ts`)는 Busy에서 분기 이후 한 번도 바뀌지 않았다. Busy에는 "백엔드 테스트 스위트 복구 및 CI 게이트 추가" 이슈가 열려 있다. — [Busy #384](https://github.com/boostcampwm2025/web17-Busy/issues/384)

- Busy 웹 테스트 61개 중 47개가 `hooks/` 아래 있다(post 12, playlist 8, player 6, common 5 등). 테스트 실행 기반은 [`c73e9a3d`](https://github.com/boostcampwm2025/web17-Busy/commit/c73e9a3d)(2026-08-07)에서 처음 들어왔다. E2E 13개 중 7개는 측정 하네스(infinite-scroll, log-batching, log-event-rate, log-loss, log-terminate-keepalive, profile-posts, search-pipeline)이고, 나머지는 화면/스모크(auth-session-persistence, infinite-scroll-screens, login-modal-stacking, modal-shell-screens, offline-smoke, sidebar-drawer)다. — [Busy apps/web/e2e](https://github.com/boostcampwm2025/web17-Busy/tree/dev/apps/web/e2e)
- vibr 웹 테스트는 `components/modals`(14), `hooks/post`(6), `components/profile`(5), `components/ui`(4) 순으로 많다. 리팩터 전 동작을 고정하는 특성화 테스트 중심이다(예: [`86378f8`](https://github.com/Jae-Hyuk-Jang/web17-boostcamp-vibr/commit/86378f8) "8개 모달 배경-클릭-닫기 특성화 테스트"). Playwright를 CI에 넣을지는 이슈로 열려 있다. — [vibr #100](https://github.com/Jae-Hyuk-Jang/web17-boostcamp-vibr/issues/100)
- vibr 문서:
  - `docs/refactors/` 아래 27개 리팩터 사이클이 각각 `result.md`(50~94줄)를 가진다. PRD/ADR/result 3문서 구조이며, 테스트 수치와 개발환경 실동작 확인을 기록하고 "확인하지 못한 부분"도 따로 적는다. 예를 들어 server-state-caching result에는 "`pnpm test`(web) 21 suites / 104 tests", Playwright로 `/archive`를 실제로 조작한 확인이 있다. — [vibr docs/refactors](https://github.com/Jae-Hyuk-Jang/web17-boostcamp-vibr/tree/main/docs/refactors), [server-state-caching/result.md](https://github.com/Jae-Hyuk-Jang/web17-boostcamp-vibr/blob/main/docs/refactors/server-state-caching/result.md)
  - 그 밖에 `docs/architecture/index.html`, `component-design/`, `conventions.md`, `design-system.md`, `tanstack-query/index.html`가 있고, 루트 `CLAUDE.md`와 `.claude/skills` 4종(feature-planner, refactoring-planner, test-scenarios, mermaid-diagram)이 있다. `docs/features/`에는 워크플로 문서 1개뿐이라 실제 기능 PRD는 없다. — [vibr docs](https://github.com/Jae-Hyuk-Jang/web17-boostcamp-vibr/tree/main/docs), [vibr .claude/skills](https://github.com/Jae-Hyuk-Jang/web17-boostcamp-vibr/tree/main/.claude/skills)
- Busy 문서는 위키 67쪽(회의록 13쪽 포함)이다. 장재혁이 2026-07~09에 약 20쪽을 새로 쓰거나 고쳤다(Query-Foundation-Specification, Player-Hooks-Architecture, Player-Components-Architecture, Log-Terminate-Keepalive-Architecture, Notification-Query-Cache-Specification, 서버-상태-캐시-불일치-진단-및-재현-시나리오, 프론트엔드-테스트-러너-선택, 검색-파이프라인-Playwright-실측-결과 등). 위키 커밋은 07월 9건, 08월 39건, 09월 3건이다. — [Busy 위키](https://github.com/boostcampwm2025/web17-Busy/wiki)

### Inferences

- Busy는 근거 중심 성능 개선과 테스트 폭(훅 테스트, 측정 하네스)에서 앞선다. 하지만 CI 게이트가 꺼져 있고 8월 대부분이 실패였기 때문에 지금 테스트가 전부 통과하는지는 보장되지 않는다. lint 상한 89는 정리하지 못한 경고가 남아 있다는 뜻이다.
- vibr는 위생(경고 0, strict 타입, API 테스트 복구, 녹색 CI)과 의사결정 기록에서 앞서지만, 자동화된 테스트 폭과 E2E가 약하다.
- 두 저장소 모두 백엔드 자동 테스트가 얇다(API 비테스트 약 6.5k줄에 spec 8~10개). 트렌딩 모듈에는 spec이 없다.

### Gaps

- 테스트와 빌드를 실행하지 못하는 조건이라, 두 저장소의 실제 통과/실패 상태(특히 CI가 꺼진 Busy)는 확인하지 못했다. 케이스 수는 정규식 근사치다.

## 5. vibr.site 가동 여부와 각 저장소가 가정하는 인프라

### Takeaway

2026-11-13 기준 vibr.site는 다운 상태다. DNS A 레코드(15.164.123.14, AWS 서울 리전 EC2 대역)는 남아 있지만 80/443 모두 연결이 타임아웃된다. Busy가 마지막으로 배포에 성공한 것은 2026-07-18의 main이라서, 장재혁의 7~9월 dev 작업은 한 번도 배포되지 않았다. 인프라 가정도 다르다. Busy는 "단일 EC2(ARM) + ECR + docker compose(nginx/web/api/mysql/redis/neo4j) + S3"를 가정한다. vibr는 이전 세대 구성인 "AWS 2계정 ECS + ECR + Route53 IP 갱신 워크플로 + NCP Object Storage 업로드"를 그대로 갖고 있고, README에 "현재는 대상 인프라가 없다"고 적어 두었다.

### Cited Findings

- 2026-11-13 접속 확인:
  - `curl -sI https://vibr.site`: 20초 타임아웃, 40초로 다시 시도해도 타임아웃
  - `http://vibr.site`, `https://www.vibr.site`: 타임아웃
  - 대조군 `https://github.com`: 200

  — [vibr.site](https://vibr.site)

- DNS: `vibr.site` → `15.164.123.14`(`getent hosts`). AWS 공개 IP 대역표에서 `15.164.0.0/15`는 ap-northeast-2(서울)의 AMAZON/EC2 대역이다. — [AWS ip-ranges.json](https://ip-ranges.amazonaws.com/ip-ranges.json)
- Busy 저장소의 homepage 필드는 `https://vibr.site`다. — [Busy 저장소](https://github.com/boostcampwm2025/web17-Busy)
- Busy 배포 워크플로는 총 96회 실행됐다. 마지막 성공은 2026-07-18 05:54Z(main `9f7eef0d`), 그 전 성공은 2026-06-18(`13ef808f`)이다. `deploy.yml`은 `push: branches: [main]`으로만 트리거되고, main의 마지막 커밋은 `9f7eef0d`(07-18)이며 dev가 main보다 339커밋 앞서 있다. — [Actions: deploy.yml](https://github.com/boostcampwm2025/web17-Busy/actions/workflows/deploy.yml), [Busy main](https://github.com/boostcampwm2025/web17-Busy/commits/main)
- 인프라는 세 단계를 거쳤다.
  1. 2026-02 위키 기준 NCP VPC: ALB, Bastion, NAT Gateway, private App Server(Docker Compose로 Next.js·NestJS·Redis·Watchtower 자동 배포), private MySQL, Neo4j는 관리형 AuraDB. — [위키: 배포/인프라](https://github.com/boostcampwm2025/web17-Busy/wiki/배포---인프라)
  2. AWS ECS: [`2d75a0df`](https://github.com/boostcampwm2025/web17-Busy/commit/2d75a0df)(02-13) "aws 서버 이전으로 CICD 방식 변경 #274", [`d9bcded3`](https://github.com/boostcampwm2025/web17-Busy/commit/d9bcded3)·[`58dffb5d`](https://github.com/boostcampwm2025/web17-Busy/commit/58dffb5d)(03-11) ECS 배포와 FE IP 갱신, [`4c4d3ef1`](https://github.com/boostcampwm2025/web17-Busy/commit/4c4d3ef1) SSM 기반 SSL.
  3. 07-18 myc0603의 단일 EC2(ARM) 전환: [`d2b9727b`](https://github.com/boostcampwm2025/web17-Busy/commit/d2b9727b), [`87e3894a`](https://github.com/boostcampwm2025/web17-Busy/commit/87e3894a)(neo4j 5.26), [`30555b58`](https://github.com/boostcampwm2025/web17-Busy/commit/30555b58)(`/data` 바인드 마운트), [`7564762f`](https://github.com/boostcampwm2025/web17-Busy/commit/7564762f)(S3).
- Busy `compose.prod.yml`은 한 호스트에서 nginx:1.27-alpine, web·api(ECR `vibr-web`/`vibr-api`:latest, linux/arm64), mysql:8.4, redis, neo4j:5.26을 띄운다. — [compose.prod.yml](https://github.com/boostcampwm2025/web17-Busy/blob/dev/compose.prod.yml)
- 업로드 저장소도 다르다. Busy는 AWS S3(`AWS_S3_BUCKET_NAME`, 기본 리전 ap-northeast-2)를 쓴다. vibr는 NCP Object Storage(`https://kr.object.ncloudstorage.com`, region `kr-standard`, `NCP_BUCKET_NAME`)를 쓴다. — [Busy upload 모듈](https://github.com/boostcampwm2025/web17-Busy/tree/dev/apps/api/src/modules/upload), [vibr upload 모듈](https://github.com/Jae-Hyuk-Jang/web17-boostcamp-vibr/tree/main/apps/api/src/modules/upload)
- vibr 워크플로는 둘이다.
  - `deploy.yml` "Deploy to Each Account ECR": workflow_dispatch로만 실행되고, AWS 계정 A/B 키와 SSM `/vibr/ssl/*`를 쓴다.
  - `ecsTrigger.yml`: 위 워크플로에 workflow_run으로 체이닝되어 `aws ecs update-service`를 실행하고, 태스크 공인 IP로 Route53 레코드를 갱신한다.

  Busy의 2~3월 ECS 시절 구성을 그대로 물려받은 것이고, [`4abf062`](https://github.com/Jae-Hyuk-Jang/web17-boostcamp-vibr/commit/4abf062)(#10)에서 수동 실행으로 바꿨다. — [vibr workflows](https://github.com/Jae-Hyuk-Jang/web17-boostcamp-vibr/tree/main/.github/workflows)

- vibr README 93행: "위 다이어그램은 원래 설계된 배포 아키텍처를 옮긴 것입니다. 현재는 대상 인프라가 없어 배포·트리거 워크플로우(deploy.yml, ecsTrigger.yml)는 수동 실행(workflow_dispatch)으로 전환된 상태이며, CI(ci.yml)만 push/PR 시 자동 실행됩니다." — [vibr README](https://github.com/Jae-Hyuk-Jang/web17-boostcamp-vibr/blob/main/README.md)
- 로컬 개발 인프라는 양쪽 모두 mysql 8.4, neo4j 5.15, redis 8.4-alpine compose다. vibr는 `compose.yml`(mysql 호스트 포트 3307, [`877f75d`](https://github.com/Jae-Hyuk-Jang/web17-boostcamp-vibr/commit/877f75d)), Busy는 `compose.dev.yml`이다. — [vibr compose.yml](https://github.com/Jae-Hyuk-Jang/web17-boostcamp-vibr/blob/main/compose.yml), [Busy compose.dev.yml](https://github.com/boostcampwm2025/web17-Busy/blob/dev/compose.dev.yml)

### Inferences

- DNS는 남았는데 서버가 응답하지 않는다. EC2 중지, 보안 그룹 차단, 인스턴스 삭제 같은 원인이 추정되지만 확인할 수 없다.
- 서버가 살아 있었더라도 프로덕션 코드는 07-18의 main(분기점 + AWS 이전)이다. 장재혁의 7~9월 개선(TanStack Query, 8월 리팩터, keepalive)은 배포된 적이 없다.
- vibr에는 실제로 동작하는 배포 정의가 없다(2계정 ECS + NCP 스토리지 모두 실체가 없음). B를 택해 다시 배포하려면 Busy의 compose.prod, nginx, EC2 워크플로, S3 업로드를 옮겨오거나 새로 설계해야 한다.

### Gaps

- 서버가 언제 왜 내려갔는지, 도메인 소유·갱신 주체, AWS 계정 소유자(myc0603 개인 계정인지 등)는 저장소에서 확인할 수 없었다.

## 6. 열린 이슈, 열린 PR, 미병합 브랜치

### Takeaway

두 저장소 모두 열린 PR은 0개다. Busy의 열린 이슈 20개 중 18개는 장재혁이 2026-08~09에 쓴 백엔드·로그·피드 설계 과제다. vibr의 열린 이슈 35개는 모두 장재혁이 쓴 프론트엔드 리팩터 백로그 위주다. Busy에는 dev에 병합되지 않은 브랜치가 6개 있다. 대부분 팀원들의 3~5월 작업(RN 모바일 앱, 백엔드 infra 분리·관측성 로깅·GDS compose, 사용설명 모달, 문서)이다. 특히 `feat/be-log`에만 있는 Neo4j GDS 플러그인 compose 설정이 dev에는 빠져 있다.

### Cited Findings

- Busy: 이슈 232 closed/20 open, PR 240 merged/4 closed-unmerged/0 open. GitHub 브랜치 41개 중 36개는 dev에 병합됐다(`git branch -r --merged origin/dev`). — [Busy issues](https://github.com/boostcampwm2025/web17-Busy/issues), [Busy pulls](https://github.com/boostcampwm2025/web17-Busy/pulls)
- Busy 열린 이슈:
  - 로그 파이프라인 내구성(2026-09-04): #492 write-ahead와 다음 세션 복구, #493 트랜잭션 아웃박스, #494 과거 확정 이벤트 복원 배치, #495 DLQ 부재, #496 배치 한 건 실패 시 전체 재처리
  - 피드: #389 "피드 소스 조회가 Promise.all 안쪽 await로 순차 실행됨", #390 "피드 최종 순서를 Math.random()이 정해 결정론이 없음", #392 피드 조합 알고리즘 정리, #402 무한 스크롤 프리페치 검토, #403 dedupePosts 존치 검토
  - API 버그: #382 PATCH await 누락, #383 `GET /post/user/:userId`가 내부 에러 메시지를 노출, #386 "AuthOptionalGuard가 만료 토큰에 401을 던져 익명 폴백이 동작하지 않음"
  - 기타: #384 백엔드 테스트 복구와 CI 게이트, #394 로그 수집 파이프라인 내구성, #395 인증 세션 재설계, #396 GraphQL 슬라이스 비교 실험, #365 Playwright 시각화
  - 팀원 이슈: #297 모니터링 환경(myc0603, 05-06), #296 사용설명 모달(seunghok22, 05-01)

  — [Busy open issues](https://github.com/boostcampwm2025/web17-Busy/issues?q=is%3Aissue+is%3Aopen)

- #386과 #390이 지적한 코드는 vibr에도 그대로 있다. 양쪽 `auth.optional-guard.ts`가 verify 실패 시 `UnauthorizedException`을 던지고, 양쪽 `feed-composition.policy.ts` 27행이 `Math.random()`으로 셔플한다. — [Busy auth.optional-guard.ts](https://github.com/boostcampwm2025/web17-Busy/blob/dev/apps/api/src/common/guards/auth.optional-guard.ts), [vibr feed-composition.policy.ts](https://github.com/Jae-Hyuk-Jang/web17-boostcamp-vibr/blob/main/apps/api/src/modules/feed/policy/feed-composition.policy.ts)
- vibr: 이슈 185 closed/35 open, PR 71 merged/0 open, 브랜치는 main 하나다. 열린 이슈의 주제:
  - 부모 이슈: #259 app-shell, #260 feed/search, #261 profile 도메인
  - 리캡 미완성 노출 #229, useQueueSync가 일시 실패 후 동기화를 영구 중단 #226, mock 폴백이 에러를 가림 #224
  - N+1 #146, #150
  - Button 전환 #104~#107
  - 검토 과제: GraphQL #53, WebSocket #55, Playwright CI #100

  — [vibr open issues](https://github.com/Jae-Hyuk-Jang/web17-boostcamp-vibr/issues?q=is%3Aissue+is%3Aopen)

- Busy 미병합 브랜치(dev 대비):
  - `feat/mobile-app`: +32/−407커밋, myc0603, 2026-03-30~04-14. 63파일 +9,888/−293. Expo ~54, RN 0.81.5, expo-router, expo-av, react-native-youtube-iframe, zustand를 쓰고, 화면은 `(auth)/login`, `(tabs)/index·profile·search`, `follows`, `profile/[userId]`다. — [compare](https://github.com/boostcampwm2025/web17-Busy/compare/dev...feat/mobile-app)
  - `feat/be-log`: +12커밋, myc0603, 04-03~05-05. 25파일 +338/−102. API·cron Nest logger, redis/neo4j 연결 로그, [`45e51ab6`](https://github.com/boostcampwm2025/web17-Busy/commit/45e51ab6) "neo4j gds 플러그인 추가하도록 compose.yml 수정 (개발환경 설정)", [`cf7394c1`](https://github.com/boostcampwm2025/web17-Busy/commit/cf7394c1) "neo4j plugin 환경변수 변경". — [compare](https://github.com/boostcampwm2025/web17-Busy/compare/dev...feat/be-log)
  - `refactor/be-infra`: +4커밋, myc0603, 04-03~04-24. 21파일 +126/−91. neo4j/redis/typeorm을 `modules/infra`로 분리한다. — [compare](https://github.com/boostcampwm2025/web17-Busy/compare/dev...refactor/be-infra)
  - `feat/296-user-manual`: +4커밋, seunghok22, 05-11. 9파일 +132(UsageModal). — [compare](https://github.com/boostcampwm2025/web17-Busy/compare/dev...feat/296-user-manual)
  - `docs`: +1커밋, myc0603, 05-19. `docs/project-structure.md`와 `docs/refactoring-candidates.md`, 총 301줄. 리팩터 후보로 "Promise.all 내부 이중 await" 버그, Post/Music→DTO 매핑 중복, 스트림 로그 인터셉터 3개의 보일러플레이트 중복, `FeedCompositionPolicy.shuffle`의 `any` 타입, FollowingSource 쿼리 빌더 중복을 든다. — [compare](https://github.com/boostcampwm2025/web17-Busy/compare/dev...docs)
  - `main`: +10/−339(실질 차이는 layout 1파일 +3줄).
- 이름이 언급된 다른 브랜치는 이미 병합됐다.
  - `refactor/291-neo4j-gds`: dev 대비 0커밋 앞섬. PR #292(2026-03-31, [`686effe2`](https://github.com/boostcampwm2025/web17-Busy/commit/686effe2))로 들어갔다. 내용은 [`6c7bbeea`](https://github.com/boostcampwm2025/web17-Busy/commit/6c7bbeea) "그룹화 함수 gds 라이브러리 추가하는 방식으로 수정", [`ba5194d5`](https://github.com/boostcampwm2025/web17-Busy/commit/ba5194d5) "그룹화 주기 변경(1시간)", [`87d49e19`](https://github.com/boostcampwm2025/web17-Busy/commit/87d49e19) "graphology louvain 라이브러리 제거"(seunghok22, 03-30).
  - `feat/log-event-idempotency`([`5b204e42`](https://github.com/boostcampwm2025/web17-Busy/commit/5b204e42)), `feat/log-queue-counters`([`2f0b9708`](https://github.com/boostcampwm2025/web17-Busy/commit/2f0b9708)): 둘 다 0커밋 앞섬(병합됨, 08-26).

### Inferences

- Busy의 열린 백엔드 이슈 다수(#383, #386, #389, #390)는 두 저장소가 공유하는 백엔드 코드의 결함이라 vibr에도 남아 있다. 예외는 #382로, vibr에서는 이미 고쳤다. 어느 옵션을 고르든 백엔드 결함 목록은 Busy 이슈를 출발점으로 삼을 수 있다.
- 미병합 브랜치 가운데 실질 가치가 있는 것은 두 개다. `feat/be-log`(GDS 플러그인 compose 설정과 관측성 로깅)와 `feat/mobile-app`(RN 앱 프로토타입, 약 9.9k줄). 둘 다 dev보다 400커밋 넘게 뒤처져 있어 그대로 병합하기는 어렵다.

### Gaps

- 닫혔지만 병합되지 않은 Busy PR 4건의 내용은 확인하지 않았다.

## 7. 소유권과 포트폴리오 관점: 저자별 기여 비중, 팀원 활동 여부

### Takeaway

Busy dev 전체에서 장재혁은 비머지 커밋 459/1,423(32.3%), 병합 PR 122/240(50.8%), 추가 라인 최다(+32,584)로 사실상 최대 기여자다. 분기점(06-11) 이후 Busy 비머지 커밋의 95%(250/263)도 장재혁이다. 팀원 중에는 문예찬(myc0603)만 2026-07-18(AWS 이전)까지 활동했고, 김승호의 마지막 커밋은 2026-05-11, 김예빈은 2026-02-05다. vibr는 81커밋 100%가 장재혁이지만, 팀원들의 코드가 장재혁 명의의 "initial commit" 한 개에 묶여 들어가 있다.

### Cited Findings

- Busy dev 비머지 커밋 1,423개: myc0603 493(34.6%), Jae-Hyuk-Jang 459(32.3%), yebinGold 290(20.4%), seunghok22 178(12.5%), Turbobot 3. 머지를 포함한 전체 1,735개 기준으로는 myc0603 595, 장재혁 583, 김예빈 321, 김승호 233이다. — `git log --no-merges origin/dev --format=%an`, [Busy contributors](https://github.com/boostcampwm2025/web17-Busy/graphs/contributors)
- 추가/삭제 라인(비머지, pnpm-lock 제외): 장재혁 +32,584/−14,633, myc0603 +15,341/−6,449, seunghok22 +6,335/−4,878, Yebin Kim +5,352/−2,887, Turbobot(스캐폴드) +4,686/−45. — `git log --numstat`, [Busy dev](https://github.com/boostcampwm2025/web17-Busy/commits/dev)
- 병합 PR 240개를 author login으로 나누면 Jae-Hyuk-Jang 122, myc0603 54, seunghok22 44, yebinGold 20이다. — [Busy closed PRs](https://github.com/boostcampwm2025/web17-Busy/pulls?q=is%3Apr+is%3Amerged)
- dev 비머지 커밋의 월별 분포:

  | 월      | 장재혁 | myc0603 | 김승호 | 김예빈 |
  | ------- | ------ | ------- | ------ | ------ |
  | 2026-01 | 188    | 336     | 146    | 198    |
  | 2026-02 | 8      | 76      | 17     | 92     |
  | 2026-03 | —      | 33      | 13     | —      |
  | 2026-05 | —      | 7       | —      | —      |
  | 2026-06 | —      | 28      | —      | —      |
  | 2026-07 | 17     | 13      | —      | —      |
  | 2026-08 | 230    | —       | —      | —      |
  | 2026-09 | 3      | —       | —      | —      |

  — `git log --no-merges origin/dev`, [Busy dev](https://github.com/boostcampwm2025/web17-Busy/commits/dev)

- 장재혁의 2026-07~09 Busy dev 커밋은 머지 포함 338개, 비머지 250개다. — 같은 출처
- myc0603의 모든 ref 비머지 커밋은 2026-04 19개, 05 13개, 06 28개, 07 13개다. 마지막은 [`7564762f`](https://github.com/boostcampwm2025/web17-Busy/commit/7564762f)(2026-07-18, S3 이전). 김승호의 마지막 커밋은 미병합 브랜치의 [`89a0de31`](https://github.com/boostcampwm2025/web17-Busy/commit/89a0de31)(2026-05-11), 김예빈의 마지막 커밋은 [`94e1b968`](https://github.com/boostcampwm2025/web17-Busy/commit/94e1b968)(2026-02-05)다. — `git log --all --no-merges --author=…`
- 위키 커밋은 장재혁이 2025-12 67, 2026-01 75, 2026-02 23, 2026-07 9, 2026-08 39, 2026-09 3이다. 다른 작성자는 seunghok22, Yebin, chnn이고 활동은 2026-02까지다. — [Busy 위키 히스토리](https://github.com/boostcampwm2025/web17-Busy/wiki/_history)
- vibr는 81커밋 전부 Jae-Hyuk-Jang이다(noreply 계정 73, 개인 이메일 계정 8). 첫 커밋 [`8bc7786`](https://github.com/Jae-Hyuk-Jang/web17-boostcamp-vibr/commit/8bc7786)은 팀 전체 코드를 하나의 커밋으로 담는다. — [vibr commits](https://github.com/Jae-Hyuk-Jang/web17-boostcamp-vibr/commits/main)
- 저장소 메타데이터:
  - Busy: 조직 `boostcampwm2025` 소유, public, star 5, fork 1, 기본 브랜치 dev, 마지막 push 2026-09-04
  - vibr: public, star 0, fork 0, 생성 2026-07-08, 마지막 push 2026-08-06
  - 두 저장소 모두 LICENSE 파일, package.json `license` 필드, GitHub license 메타데이터가 없다.

  — [Busy](https://github.com/boostcampwm2025/web17-Busy), [vibr](https://github.com/Jae-Hyuk-Jang/web17-boostcamp-vibr)

- 두 README 모두 "🌟 팀원 소개" 섹션을 유지하고 있다. — [Busy README](https://github.com/boostcampwm2025/web17-Busy/blob/dev/README.md), [vibr README](https://github.com/Jae-Hyuk-Jang/web17-boostcamp-vibr/blob/main/README.md)

### Inferences

- 포트폴리오 관점에서 장재혁의 가장 큰 단일 작업 묶음(2026-08, 230커밋, 측정 하네스·위키 아키텍처 문서 포함)은 팀 조직 저장소인 Busy에 있다. vibr에는 그 이전의 다른 구현만 있다. B를 택하면 이 8월 작업이 개인 저장소 이력에서 빠진다.
- vibr의 "initial commit" 방식 복사는 팀원 커밋 이력(저자 정보)을 지웠다. A를 단순 재복사로 하면 같은 일이 반복된다. Busy를 remote로 추가해 이력을 그대로 가져오면(unrelated histories merge 또는 fork) 저자 이력을 보존할 수 있다.
- 라이선스가 없으므로 팀원 기여분의 저작권은 각자에게 남아 있다고 보는 것이 일반적이다(법률 자문 아님). 공개 포트폴리오를 넘어 피벗한 제품이나 상업적 용도에 재사용하려면 팀원 동의를 받아 두는 편이 안전하다.
- 팀원들은 2026-07-18 이후 활동이 없다. 지금 Busy는 사실상 장재혁 1인 저장소처럼 쓰이고 있다.

### Gaps

- 장재혁이 `boostcampwm2025` 조직에서 가진 권한(관리자 여부, 부트캠프 종료 후 아카이브 정책)과, 팀원들이 계속 사용·리브랜딩하는 데 동의했는지는 확인하지 못했다.

## 8. 기술적 차별 자산과 성숙도 (테스트 여부, UI 연결 여부, 프로덕션 사용 여부)

### Takeaway

기술 자산은 두 저장소 백엔드에 거의 똑같이 들어 있다(이 영역에서 Busy만의 추가분은 로그 멱등성 정도). 실제로 피드와 UI까지 연결된 경로는 하나다. 댓글·팔로우·좋아요 인터셉터와 클라이언트 로그가 Redis Streams에 쌓이고, 트렌딩 ZSET과 감쇠 cron을 거쳐 피드 trending 소스로 들어간다. 여기에 멀티 프로바이더 플레이어와 PWA가 더해진다. Neo4j 상호작용 그래프와 GDS Louvain 그룹핑도 코드상으로는 trending 소스의 그룹 필터에 연결돼 있다. 그러나 병합된 어떤 compose에도 GDS 플러그인 설정이 없어서, 기본 배포에서는 그룹핑 단계가 실패할 가능성이 크다(추론). 테스트는 부분적이고, 프로덕션에서 실제로 동작했는지는 지금 검증할 수 없다.

### Cited Findings

- **Redis Streams 이벤트 버스**
  - 스트림 키 `stream:log:events`(`REDIS_KEYS.LOG_EVENTS_STREAM`)에 `logs.service.ts`가 XADD한다. 컨슈머는 `trending/stream/trending-steam.consumer.ts`(파일명 오타 그대로)와 `algorithm/algorithm-stream.consumer.ts`(`@Cron(EVERY_30_MINUTES)` 배치로 Neo4j 반영) 두 개다.
  - Busy에만 이벤트 멱등성 키 `log:seen:{eventId}`, 중복 차단 지표 `metrics:log:duplicates-blocked`, XADD pipeline이 있다([`5b204e42`](https://github.com/boostcampwm2025/web17-Busy/commit/5b204e42)).
  - 규모: infra와 인터셉터 7파일/283줄, log 모듈 3파일/233줄(Busy, 비테스트).
  - 테스트: `algorithm.spec.ts`(양쪽), `logs.service.spec.ts`(Busy만, +155줄).

  — [redis-keys.ts](https://github.com/boostcampwm2025/web17-Busy/blob/dev/apps/api/src/infra/redis/redis-keys.ts), [logs.service.ts](https://github.com/boostcampwm2025/web17-Busy/blob/dev/apps/api/src/modules/log/logs.service.ts), [vibr CLAUDE.md 백엔드 아키텍처 절](https://github.com/Jae-Hyuk-Jang/web17-boostcamp-vibr/blob/main/CLAUDE.md)

- **트렌딩 랭킹과 감쇠**: ZSET `rank:trending:posts`, `jobs/trending-decay.job.ts`의 `@Cron(TRENDING_DECAY_INTERVAL, { waitForCompletion: true })`. 8파일/356줄이고 trending 모듈에는 spec 파일이 없다(양쪽). — [Busy trending 모듈](https://github.com/boostcampwm2025/web17-Busy/tree/dev/apps/api/src/modules/trending)
- **Neo4j 상호작용 그래프와 Louvain**
  - `addRelationshipsBatch`가 `MERGE (u:User)-[r:INTERACTED {type}]->(t:User|Content)` 형태로 엣지를 만들고 `ON MATCH SET r.weight = r.weight + log.weight`로 가중치를 누적한다.
  - `runUnifiedGrouping`은 `gds.graph.project.cypher`로 그래프를 투영하고 `gds.louvain.write`(relationshipWeightProperty: weight)로 각 노드에 `partition`을 쓴다. `syncAllGroupsToRedis`가 결과를 `users:{id}:group`, `posts:{id}:group`으로 옮긴다.
  - `@Cron(EVERY_HOUR)`로 돌고, 실패하면 `console.error` 후 다시 throw한다. 3파일/607줄.

  — [algorithm.service.ts](https://github.com/boostcampwm2025/web17-Busy/blob/dev/apps/api/src/modules/algorithm/algorithm.service.ts)

- **GDS 프로비저닝**: Busy `compose.dev.yml`(neo4j:5.15), `compose.prod.yml`(neo4j:5.26), vibr `compose.yml`(neo4j:5.15) 어디에도 `NEO4J_PLUGINS`나 GDS 설정이 없다. GDS 플러그인을 추가하는 compose 수정은 미병합 `feat/be-log`([`45e51ab6`](https://github.com/boostcampwm2025/web17-Busy/commit/45e51ab6), [`cf7394c1`](https://github.com/boostcampwm2025/web17-Busy/commit/cf7394c1))에만 있다. — [compose.prod.yml](https://github.com/boostcampwm2025/web17-Busy/blob/dev/compose.prod.yml), [compose.dev.yml](https://github.com/boostcampwm2025/web17-Busy/blob/dev/compose.dev.yml)
- **GDS 도입 경위**:
  - 2026-02 위키 기록: AuraDB Free/Starter에서는 "GDS(Graph Data Science) 라이브러리 미지원", APOC 우회도 실패했다. 그래서 NestJS 메모리에서 graphology/ngraph로 Louvain을 돌리는 방식을 택했다. — [위키: 배포/인프라](https://github.com/boostcampwm2025/web17-Busy/wiki/배포---인프라)
  - 2026-03-31 PR #292에서 GDS 호출로 바꾸고 graphology를 제거했다. — [`686effe2`](https://github.com/boostcampwm2025/web17-Busy/commit/686effe2)
- **피드에 연결되는 방식**: `TrendingSource`는 로그인했고, 사용자 그룹을 Redis에서 찾았고, 후보 수가 limit보다 많을 때에만 사용자 그룹 밖의 글부터 잘라낸다. 그 밖의 경우에는 점수순으로 자른다. — [trending.source.ts](https://github.com/boostcampwm2025/web17-Busy/blob/dev/apps/api/src/modules/feed/sources/trending.source.ts)
- **피드 소스·정책**
  - `SourceAllocationPolicy.allocate`는 following·trending·recent에 각각 `Math.ceil(limit / 3)`을 고정 배분한다.
  - `FeedCompositionPolicy`는 `Math.random()`으로 셔플한다(#390). 소스 조회는 순차로 실행된다(#389).
  - 9파일/536줄, spec 4개(feed.service, following·recent·trending source, 양쪽 동일).

  — [source-allocation.policy.ts](https://github.com/boostcampwm2025/web17-Busy/blob/dev/apps/api/src/modules/feed/policy/source-allocation.policy.ts), [Busy #389](https://github.com/boostcampwm2025/web17-Busy/issues/389), [Busy #390](https://github.com/boostcampwm2025/web17-Busy/issues/390)

- **멀티 프로바이더 플레이어**: YouTube iframe 재생과 iTunes 30초 미리듣기를 지원한다. Busy는 `hooks/player`, `components/player`, `usePlayerStore`를 합쳐 30파일/1,978줄이고, `playback-policy.ts`와 player 훅 테스트 6개(playback-policy, use-itunes-sync, use-youtube-sync, use-queue-navigation, use-full-player, use-current-music-actions)가 있다. vibr는 엔진 조건부 마운트 방식(`ItunesEngine`/`YouTubeEngine`, [`c073acf`](https://github.com/Jae-Hyuk-Jang/web17-boostcamp-vibr/commit/c073acf) #267)이고 player 컴포넌트 테스트 3개와 훅 테스트 1개가 있다. — [Busy hooks/player](https://github.com/boostcampwm2025/web17-Busy/tree/dev/apps/web/src/hooks/player), [vibr components/player](https://github.com/Jae-Hyuk-Jang/web17-boostcamp-vibr/tree/main/apps/web/src/components/player)
- **클라이언트 로그 파이프라인**
  - 구성: `utils/logQueue.ts`(배칭), `api/internal/logsClient.ts`, `logging.ts`, `hooks/post/use-post-detail-log.ts`.
  - Busy에만 있는 보강: 탭 종료 시 keepalive fetch([`d2312b95`](https://github.com/boostcampwm2025/web17-Busy/commit/d2312b95)), 유실 사유별 카운터([`2f0b9708`](https://github.com/boostcampwm2025/web17-Busy/commit/2f0b9708)), `initLogQueue` 미호출로 생기던 유실 수정([`34496252`](https://github.com/boostcampwm2025/web17-Busy/commit/34496252)), 상세 열람 로그 유실 수정([`c3d5a18e`](https://github.com/boostcampwm2025/web17-Busy/commit/c3d5a18e)).
  - Busy에는 로그 측정 Playwright 4개와 설계 문서가 있다. — [위키: 사용자-로그-수집-파이프라인-설계](https://github.com/boostcampwm2025/web17-Busy/wiki/사용자-로그-수집-파이프라인-설계), [위키: Log-Terminate-Keepalive-Architecture](https://github.com/boostcampwm2025/web17-Busy/wiki/Log-Terminate-Keepalive-Architecture)
- **PWA**: 양쪽에 `app/manifest.ts`(33줄), `public/sw.js`(79줄, 캐시명 `vibr-pwa-v2`, 앱 셸 `['/', '/offline', '/manifest.webmanifest', '/favicon.svg', '/icons/icon-192.png']`, skipWaiting과 clients.claim), `PwaRegister`, `PwaInstallBanner`, `/offline` 페이지가 있다. Busy에는 `offline-smoke.spec.ts` E2E도 있다. — [Busy sw.js](https://github.com/boostcampwm2025/web17-Busy/blob/dev/apps/web/public/sw.js), [Busy e2e](https://github.com/boostcampwm2025/web17-Busy/tree/dev/apps/web/e2e)
- **기타 모듈 규모**(Busy 비테스트): post 7/810줄, playlist 6/537, noti 4/314, auth(Google OAuth + JWT) 4/223, now-playlist 5/172, upload 2/67. — [Busy modules](https://github.com/boostcampwm2025/web17-Busy/tree/dev/apps/api/src/modules)
- **프로덕션 포함 여부**: 위 백엔드 자산은 모두 분기점 이전부터 있었으므로 2026-06-18과 07-18의 main 배포에 들어 있었다. — [Actions: deploy.yml](https://github.com/boostcampwm2025/web17-Busy/actions/workflows/deploy.yml)

### Inferences

- 가장 차별적인 자산(로그 이벤트 → 스트림 → 그래프 그룹 → 피드 필터)은 설계로서는 완결돼 있다. 하지만 성숙도는 낮다. GDS가 없는 환경에서는 그룹이 생기지 않아 trending 소스가 점수순으로만 동작하고, 셔플이 무작위이며, 배분이 고정 1/3이고, 트렌딩 모듈에는 테스트가 없다. 지금 상태로는 "사람 관계 기반 추천"이 사용자 경험에서 체감되는 수준이라고 보기 어렵다.
- 성숙도가 가장 높은 쪽은 프론트엔드 인프라 성격의 자산이다(플레이어, 로그 큐와 keepalive, 쿼리 캐시 계층, PWA 셸). 특히 Busy 쪽은 테스트와 측정 근거까지 갖췄다.

### Gaps

- 프로덕션 Neo4j에 GDS가 별도로 설치됐는지, 그룹핑 cron이 실제로 성공한 적이 있는지 확인할 수 없다(서버 다운, 로그 없음).
- 트렌딩 consumer의 점수 산정식과 감쇠 주기 상수는 이번 조사에서 자세히 읽지 않았다.

## 9. 옵션별 대략적 노력과 리스크: A(Busy 최신본 재복사), B(vibr 계속), C(피벗 시 이월 자산)

### Takeaway

(평가) A를 고르면 vibr의 문서·스킬·CI 같은 파일 단위 자산은 그대로 옮길 수 있다. 그러나 vibr에서만 한 코드 개선(API strict 타입과 191건 수정, API 테스트 복구, lint 경고 0, jest 테스트 49개, Context 기반 모달 분해)은 다시 적용하거나 버려야 하고, 27개 리팩터 문서가 가리키는 코드 구조가 사라진다. B를 고르면 Busy에서 이미 해결한 배포 가능한 인프라 정의, 로그 내구성, N+1과 플레이어 버그 수정, 더 넓은 테스트·측정 하네스를 다시 만들어야 하고, 장재혁의 8월 230커밋이 개인 저장소에 남지 않는다. C에서는 백엔드 이벤트 파이프라인, 트렌딩, 그래프 그룹핑, 피드 정책, 로그 큐, PWA, 인증, DTO와 모노레포·CI 기반이 도메인에 상관없이 이월된다. 이 자산들은 A/B 어느 쪽에도 거의 같게 들어 있으므로, C를 택한다면 A/B 선택이 미치는 영향은 작다.

### Cited Findings

- vibr 분기 이후 변경 487파일의 구성: apps/web 257, docs 134, apps/api 58(+411/−425), packages/dto 12(DTO 파일명 kebab-case 정리 포함), .claude 9, eslint-config 5, .github 4. — `git diff --stat 8bc7786 vibr/main`, [vibr commits](https://github.com/Jae-Hyuk-Jang/web17-boostcamp-vibr/commits/main)
- Busy 분기 이후 변경 474파일의 구성: apps/web 434, apps/api 18(+732/−216), packages/ui 4(삭제), packages/dto 3, .github 3, compose dev/prod, nginx. — [compare f5a1c442...dev](https://github.com/boostcampwm2025/web17-Busy/compare/f5a1c442...dev)
- Busy에서만 한 API 개선:
  - 프로필 피드 엔드포인트와 상수 쿼리 조회: [`220e858c`](https://github.com/boostcampwm2025/web17-Busy/commit/220e858c) `FindByUserFeedDto`, [`2227e362`](https://github.com/boostcampwm2025/web17-Busy/commit/2227e362) `getFullPostsByUser`, [`570f50db`](https://github.com/boostcampwm2025/web17-Busy/commit/570f50db), [`38dc1342`](https://github.com/boostcampwm2025/web17-Busy/commit/38dc1342)
  - orderIndex 정렬: [`2a9fcfdd`](https://github.com/boostcampwm2025/web17-Busy/commit/2a9fcfdd)
  - 로그 멱등성: [`5b204e42`](https://github.com/boostcampwm2025/web17-Busy/commit/5b204e42)
  - S3 업로드: [`7564762f`](https://github.com/boostcampwm2025/web17-Busy/commit/7564762f)

  — [Busy commits](https://github.com/boostcampwm2025/web17-Busy/commits/dev)

- vibr에서만 한 API 개선: 타입 위반 191건 [`b1454b6`](https://github.com/Jae-Hyuk-Jang/web17-boostcamp-vibr/commit/b1454b6), strict [`0c24e46`](https://github.com/Jae-Hyuk-Jang/web17-boostcamp-vibr/commit/0c24e46), 테스트 3스위트와 user 본 코드 [`65fc63b`](https://github.com/Jae-Hyuk-Jang/web17-boostcamp-vibr/commit/65fc63b), Spotify 제거 [`7312f69`](https://github.com/Jae-Hyuk-Jang/web17-boostcamp-vibr/commit/7312f69), `PATCH /post/:id` await. — [vibr commits](https://github.com/Jae-Hyuk-Jang/web17-boostcamp-vibr/commits/main)
- 지금 apps/api의 두 저장소 차이는 63파일 +999/−469다. apps/web은 같은 내용 파일이 39개뿐이다(3절 표). — `git diff --shortstat vibr/main origin/dev -- apps/api`
- vibr README의 "기술적 개선" 표는 vibr PR(#52, #78, #94, #116)과 vibr 코드 구조(ModalShell/ModalCloseButton, MusicPickerSearch, usePostLikeToggle)를 근거로 든다. — [vibr README](https://github.com/Jae-Hyuk-Jang/web17-boostcamp-vibr/blob/main/README.md)
- Busy는 2026-09-03 CLAUDE.md와 `.claude`를 git 추적에서 뺐다. AI 워크플로 자산(스킬 4종, docs 파이프라인)은 vibr에만 커밋돼 있다. — [`e7db569b`](https://github.com/boostcampwm2025/web17-Busy/commit/e7db569b), [vibr .claude/skills](https://github.com/Jae-Hyuk-Jang/web17-boostcamp-vibr/tree/main/.claude/skills)
- 두 웹 앱의 테스트 러너가 다르다(Busy vitest, vibr jest). 테스트 파일 이식에는 러너 API 전환이 필요하다. — 3절 package.json 출처
- 도메인에 상관없이 이월할 수 있는 자산의 규모(Busy dev 비테스트 기준):

  | 자산                            | 규모               |
  | ------------------------------- | ------------------ |
  | Redis infra + 스트림 인터셉터   | 283줄              |
  | log 모듈                        | 233줄              |
  | trending                        | 356줄              |
  | algorithm(Neo4j)                | 607줄              |
  | feed(소스·정책)                 | 536줄              |
  | auth(Google OAuth + JWT)        | 223줄              |
  | upload                          | 67줄               |
  | packages/dto                    | 534줄(테스트 포함) |
  | PWA(sw.js 79줄 + manifest 33줄) | 112줄              |

  음악 특화 자산은 플레이어(1,978줄), iTunes·YouTube 검색 프록시와 매퍼다. — 8절 출처들

### Inferences

- **A(Busy 최신본 재복사)**
  - 얻는 것: 더 최신이고 더 큰 작업 기반. 장재혁의 8월 230커밋, vitest 61파일과 Playwright 13스펙, 배포 가능한 단일 EC2 정의와 S3, 로그 내구성, 성능·버그 수정.
  - 잃거나 다시 해야 하는 것: API 위생(약 40파일 규모 수정. 백엔드는 덜 갈라졌으므로 수일 이내로 재적용 가능해 보임), web lint 경고 0 정책(Busy 상한 89), jest 테스트 49개(vitest로 다시 쓰거나 폐기), Context 기반 모달 분해와 공용 Button/ModalPanel/MusicPickerSearch(Busy는 다른 방식으로 같은 목표를 상당 부분 달성했으므로 손실보다는 중복에 가까움).
  - 남는 것과 리스크: docs·스킬·CI·템플릿은 파일 복사로 남는다. 다만 27개 result 문서와 README "기술적 개선" 표가 더 이상 현재 코드를 설명하지 못하는 문서-코드 불일치가 생긴다.
  - 실행 방식: vibr 이력을 지우지 말고 "Busy 트리를 새 커밋으로 덮기", 또는 Busy를 remote로 merge하는 방식이 PR 링크와 저자 이력 보존에 유리하다.
- **B(vibr 계속)**
  - 얻는 것: 깨끗한 위생, 녹색 CI, 문서와 코드가 맞는 상태.
  - 빠지는 것: 동작하는 배포 정의(compose.prod, nginx, EC2 워크플로, S3. 약 10개 파일이며 비교적 이식 쉬움), 로그 keepalive·멱등성·유실 계측, 프로필 피드 N+1 제거, 플레이어 버그 수정 5건, 무한스크롤 수정, 약관 Query 전환, 측정 하네스. 웹 파일 구조가 다르기 때문에(kebab-case 개명, 모달 재배치) 대부분 의미 단위로 다시 구현해야 한다.
  - 포트폴리오 리스크: 같은 사람이 같은 문제를 두 저장소에서 풀었는데 더 큰 쪽(Busy)이 대표 저장소에서 빠진다.
- **C(피벗)**
  - 이월할 수 있는 핵심은 두 묶음이다. 첫째, 이벤트 기반 비동기 집계 파이프라인(인터셉터와 클라이언트 로그 → Redis Streams → 트렌딩 ZSET/감쇠 → 그래프 가중치 → Louvain 그룹 → 피드 필터). 둘째, 피드 소스/정책 패턴. 단 GDS 프로비저닝과 테스트 보강이 전제다.
  - 범용 기반: 인증, 업로드, DTO 패키지, 모노레포·CI·commitlint, 로그 큐와 keepalive, TanStack Query 캐시 계층, PWA 셸, AI 기획·리팩터 워크플로(vibr의 스킬과 문서 파이프라인).
  - 이 자산들은 A/B 어느 기반에도 거의 같은 형태로 있으므로, C를 택하면 기반은 "인프라와 테스트가 더 많은 Busy" 대 "위생과 문서가 좋은 vibr"의 상대적 장점으로만 고르면 된다.
- 세 옵션 모두 "제품 차별성"이라는 1절의 미해결 문제를 그 자체로 풀지는 못한다. A와 B는 엔지니어링 기반 선택일 뿐이고, 제품 질문에 답하는 것은 C(또는 A/B 위에서 하는 컨셉 재정의)다.
- 공통 리스크: 두 저장소 모두 라이선스가 없고 팀원 4인의 공동 저작물이다. Busy 조직 저장소의 권한과 지속성도 불확실하다.

### Gaps

- 각 재적용 작업의 실제 소요 시간은 코드를 실행·수정해 보지 않아 정량 추정할 수 없다(위 일수는 규모 기반의 대략적 판단이다).
- 팀원의 재사용·리브랜딩 동의, 조직 저장소의 장기 보존 정책, AWS·도메인 자산의 소유 주체는 확인하지 못했다.
