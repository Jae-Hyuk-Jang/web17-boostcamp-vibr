# 인접·신흥 기회 영역 카탈로그: 음악 × 관계·정체성·기억·장소·라이브·팬덤·창작·유틸리티 (2026-11-13 기준)

> **범례.** 평가는 상/중/하. "실현성" = 1인 개발자 + Spotify Web API가 신규 앱에 사실상 닫힌 조건(YouTube 임베드·iTunes 30초 미리듣기·오픈데이터만 쓸 수 있다고 가정)에서의 실현 가능성. "기술 깊이" = 실시간 동기화·그래프 알고리즘·추천/랭킹·데이터 파이프라인·오프라인/PWA 등 면접관에게 어필할 수 있는 깊이. "재사용" = VIBR 기존 자산 활용도.
> **VIBR 기존 자산(과제 설명 + 코드 확인):** following/recent/trending FeedSource와 배분·구성 정책, 팔로우 그래프, Neo4j `INTERACTED` 그래프 + GDS Louvain 커뮤니티, Redis Streams 이벤트 버스 + 트렌딩 랭킹(시간 감쇠), YouTube IFrame + iTunes 미리듣기 멀티 프로바이더 플레이어(트랙 정규화 mapper), 플레이리스트·재생 큐(now-playlist), 알림, PWA.
> **조사 한계:** 조사 막바지에 이 세션의 웹 검색 한도(전체 에이전트 공유 200회)가 소진되어 일부 항목은 추가 검증을 못 했다. 각 Gaps 절에 명시했다. 일부 한국어 수치는 검색 요약에서 가져와 기사 URL에 연결했으므로 인용 전에 원문을 다시 확인하는 것이 좋다.

---

## 1. 2023–2026년에 수요 성장이나 바이럴이 확인된 영역은 어디인가 (지표·날짜 포함)

### Takeaway

지표로 강하게 검증된 축은 다섯 가지다. ① 플랫폼 안으로 흡수되고 있는 친밀 공유·함께 듣기(Spotify Messages가 약 5개월 만에 약 4천만 명, Jam 월 1억 청취시간). ② 자기표현형 리캡(Wrapped 2025 첫날 2억 명, 공유 5억 건). ③ 음악 게임(Hitster 누적 800만 개 이상, Bandle 하루 10만 명 이상). ④ 라이브·팬덤 인프라(Bandsintown 등록 1억 명, DICE MAU 1천만, Weverse MAU 약 1,200만 이상). ⑤ AI 음악 창작(Suno 누적 이용자 1억 명 이상)과 그 반작용(Deezer 신규 업로드의 50% 이상이 AI, Bandcamp의 AI 음악 금지).
반면 장소 기반 음악, 단독 음악 데이팅 앱, 그리고 2025–26년에 쏟아진 "하루 한 곡"·음악 일기·공연 일기 인디 앱은 공개된 트랙션 지표가 거의 없다.

### Cited Findings

#### A. 친밀·폐쇄형 공유 (위젯, 하루 한 곡, DM, "노래 보내기")

- Spotify는 2025-08-26 앱 안에 1:1 메시지 기능 "Messages"를 출시했다. 음악·팟캐스트·오디오북을 친구·가족과 공유하는 용도다 — [TechCrunch, 2025-08-26](https://techcrunch.com/2025/08/26/spotify-launches-a-messages-feature-in-a-bid-to-become-more-social/)
- 2026-01-07에는 Messages 안에 두 기능을 추가했다. 실시간 청취 활동 공유(옵트인, 이미 연결된 상대에게만 보임)와 "Request to Jam"(Premium 사용자가 채팅에서 원격 Jam에 초대)이다. 이때 Spotify는 Messages가 "almost 40 million users since it relaunched last year"를 기록했다고 밝혔다. 두 기능 모두 16세 이상 대상이다 — [RouteNote, 2026-01-08](https://routenote.com/blog/spotify-listening-activity-and-request-to-jam/)
- 2026-01-28부터는 Messages에서 채팅 하나로 최대 10명과 공유할 수 있다(그룹 공유) — [Spotify Newsroom](https://newsroom.spotify.com/tag/messaging/)
- (맥락) Airbuds는 회사 발표 기준 다운로드 1,500만 이상, MAU 500만, 하루 실행 150만이다(2025-09) — [TechCrunch, 2025-09-17](https://techcrunch.com/2025/09/17/airbuds-is-the-music-social-network-apple-and-spotify-wish-they-had-built/). Appfigures는 주간 다운로드가 2024년 초 5.1만에서 15.6만으로 정점을 찍었다고 추정했다 — [Appfigures, 2024-05](https://appfigures.com/resources/insights/20240503?f=1). 서드파티 트래커 추정치(iOS 설치 830만 등)는 회사 수치와 맞지 않는다 — [AppGoblin](https://appgoblin.info/apps/1638906106)
- "하루 한 곡" 인디 앱이 많이 출시됐다.
  - Lowkey: 최근 Spotify/Apple Music 재생곡 중 하루 한 곡을 올리라는 일일 알림, 홈 화면 위젯 — [App Store](https://apps.apple.com/ca/app/lowkey/id6753359216)
  - Soundcheck!: 무작위 알림이 오면 하루 1회 공유, 친구가 좋아요·청취·댓글 — [mwm.ai](https://mwm.ai/apps/soundcheck/6463963681)
  - Cue: Music Diary with Friends: "one song, once a day", 위젯, 개인 저널에 저장 — [App Store](https://apps.apple.com/us/app/id6763956781)
  - Sway: 좋아요가 가장 많은 곡이 그날의 곡 — [App Store](https://apps.apple.com/app/sway-song-of-the-day/id6743491738)
  - Discover: 2026-02-18 Product Hunt 출시 — [Product Hunt](https://www.producthunt.com/products/discover-share-your-music/launches)
  - Spin: 짧은 일일 창 안에서 하루 한 곡 게시 — [Product Hunt](https://www.producthunt.com/products/spin-8)
  - 위 앱 중 이용자 지표를 공개한 곳은 찾지 못했다(검색 범위 안에서).
- "노래 보내기"·익명 고백형: sendthesong.xyz는 인도네시아에서 시작된 사이트다. 익명 메시지와 곡을 특정인 이름 앞으로 남기고, 누구나 browse로 볼 수 있다. 2024년 11월 X와 TikTok에서 바이럴됐다 — [Preview.ph, 2024-11-11](https://old.preview.ph/culture/what-is-sendthesong-xyz-a5200-20241111), [Batam News Asia, 2024-11-15](https://batamnewsasia.com/2024/11/15/the-send-the-song-trend-a-new-way-to-express-feelings-anonymously/), [Tirto](https://tirto.id/link-send-the-song-yang-lagi-viral-dan-cara-ikut-tren-g5rZ). "72시간에 8,001만 방문"이라는 주장은 단일 매체에만 나오며 검증되지 않았다 — [VCGamers](https://vcgamers.com/news/en/all-about-send-the-song-xyz-which-went-viral/amp)
- 프로필·상태 음악
  - Instagram은 2024-08 프로필에 30초 곡 클립을 붙이는 기능을 출시했다. 곡은 Instagram 자체 라이선스 라이브러리에서 고르고, 자동재생은 없다 — [Business Standard, 2024-08-23](https://business-standard.com/technology/tech-news/instagram-introduces-song-on-profile-feature-similar-to-myspace-details-124082300227_1.html), [TechCrunch](https://techcrunch.com/?p=2841261)
  - Notes에는 최대 30초 음악을 붙일 수 있다 — [Social Media Today](https://www.socialmediatoday.com/news/instagram-adds-new-option-include-music-tracks-notes/)
  - 2025-06에는 Spotify 재생곡을 Notes로 공유하는 기능이 보도됐다 — [Ubergizmo, 2025-06](https://www.ubergizmo.com/2025/06/instagram-spotify-notes-grid)
- 한국: 카카오톡 프로필뮤직은 멜론과 연동된다. 설정하면 상태메시지 자리에 곡명이 뜨고, 기본은 1분 미리듣기이며 전곡 감상은 멜론 유료회원만 가능하다. 친구에게 공유할 수 있다 — [카카오](https://www.kakaocorp.com/page/detail/8211). 2020년에 가장 많이 설정된 곡은 지코 '아무노래'였다 — [카카오](https://www.kakaocorp.com/page/detail/8863)

#### B. 음악 기억·저널링·리캡·타임캡슐

- Spotify Wrapped 2025는 첫 24시간 동안 2억 명 이상이 참여했다. 전년보다 19% 많고, 2024년에는 2억 명에 도달하는 데 62시간이 걸렸다. 첫날 공유는 5억 건 이상으로 전년보다 41% 늘었다(네이티브 공유, 스크린샷, 다운로드 포함). 모두 회사 발표 수치다 — [TechCrunch, 2025-12-04](https://techcrunch.com/2025/12/04/spotify-says-wrapped-2025-is-its-biggest-yet-with-200m-users-in-its-first-day), [Music Week](https://www.musicweek.com/digital/read/spotify-wrapped-2025-was-biggest-ever-with-200-million-engaged-users/093178)
- 음악 일기 앱도 잇달아 출시됐다.
  - Melodiary(2025-08): 일기에 담긴 감정을 AI가 읽고 곡을 생성 — [App Store](https://apps.apple.com/us/app/-/id6749401999)
  - MULOG(뮤로그, 한국 앱): 하루 최대 3곡 기록, 주간·월간 통계, 과거 곡 랜덤 재생 — [App Store](https://apps.apple.com/np/app/mulog-my-music-diary/id6469449605)
  - Mixtape(2025-01): 삶의 사건을 플레이리스트로 기록 — [AppAdvice](https://appadvice.com/app/mixtape-a-music-based-journal/6740045350)
  - Songstamp: 하루 한 곡과 글, 좋아요·댓글 없음 — [App Store](https://apps.apple.com/app/id6758682448)
  - Chooning: 곡·공연에 얽힌 감정과 기억을 적는 노트, 다른 사용자와 공유 — [Google Play](https://play.google.com/store/apps/details?id=app.chooning)
  - Tempo(안드로이드): 여러 음악 앱(20개 이상)의 청취를 추적해 하나의 저널로 통합 — [Feedbagel](https://feedbagel.com/post/tempo-android-app-that-tracks-music-listening-across-20-apps-and-provides-unifie)
  - 위 앱들의 트랙션 지표는 공개되지 않았다.
- 장소와 기억의 결합: Reverie.fm은 Apple Music 곡을 지도에 핀으로 남기는, 완전 비공개·오프라인 음악 일기다 — [Product Hunt](https://www.producthunt.com/posts/reverie-fm)
- 한국 공연 기록 문화
  - 10~20대 공연 관객 사이에 '관극다꾸'(관람 + 다이어리 꾸미기)가 퍼지고 있다. 완성한 페이지를 SNS에 공유해 서로의 취향을 확인한다 — [데일리안](https://www.dailian.co.kr/news/view/1639830/)
  - 2026년 데일리안 '기록하는 팬덤' 연재는 이런 아카이빙이 공연 시장을 지탱한다고 분석했다 — [데일리안 ①](https://www.dailian.co.kr/news/view/1657200/), [데일리안 ③](https://www.dailian.co.kr/news/view/1657221/)

#### C. 장소·맥락 기반 음악

- Paseo: Songs & Places는 음악을 "그 일이 일어난 장소"에 핀으로 남기고, 주변 사용자 핀 피드를 보여준다(Apple Music) — [App Store](https://apps.apple.com/app/id6760364437)
- Retune은 도시를 청취 습관 지도로 보여주고, 근처 친구가 듣는 곡을 보여준다(Spotify 기반) — [App Store](https://apps.apple.com/us/app/id6741438431)
- Pinwave에서는 아티스트나 팬이 장소에 음악을 남기고, 청취자는 현장에 가야 잠금을 풀 수 있다 — [App Store](https://apps.apple.com/kr/app/pinwave/id6756684355)
- 2025-08에는 미발표곡을 야외 특정 장소에 걸어 두어(geolock) 팬을 밖으로 나오게 하는 앱이 보도됐다. 기사는 "Pokémon GO"에 비유했다 — [EDM.com](https://edm.com/gear-tech/new-app-hides-unreleased-songs-in-nature-forcing-fans-outside-to-listen/)
- 이 영역 앱들의 이용자 지표는 찾지 못했다.

#### D. 취향 궁합·데이팅

- Tinder는 2016-09 Spotify와 연동한 "Anthem"(프로필 대표곡)과 Top Artists를 도입했다 — [TechCrunch, 2016-09-20](https://techcrunch.com/2016/09/20/tinder-taps-spotify-to-let-you-add-music-to-your-profile/)
- 2021-12에는 Music Mode를 출시해 상대의 대표곡을 30초 루프로 들려줬다. 당시 Gen Z 사용자의 약 40%가 Anthem을 설정했고, 설정하면 매치가 약 10% 늘었다고 회사가 밝혔다 — [TechCrunch, 2021-12-09](https://techcrunch.com/2021/12/09/tinder-is-partnering-with-spotify-to-launch-a-new-music-mode-feature/)
- 2026년 Tinder 개편에는 취향 기반 매칭을 위한 "revamped music mode"와 astrology mode가 포함됐다. 이용자의 약 60%가 Gen Z다 — [Shortlist](https://www.shortlist.com/health-and-fitness/tinders-big-ai-overhaul-is-here-and-its-making-swiping-more-personal-than-ever). 2026년 기사에도 나오는 "40%" 수치는 2021년 발표를 다시 인용한 것으로 보인다.
- 단독 음악 데이팅 앱: Vinylly(스트리밍 데이터와 음악 프로필 기반 매칭) — [Screenshot Media](https://screenshot-media.com/the-future/dating/vinylly-music-dating-app/), Beatmatch(2022, Gen Z 타깃) — [NYU News, 2022-10-21](https://nyunews.com/culture/2022/10/21/beatmatch-dating-app-music-lovers). 두 앱 모두 트랙션 지표를 공개하지 않았다.

#### E. 라이브·로컬 씬

- Bandsintown은 2025-10 등록 팬 1억 명(196개국), 아티스트 70만, 공연장·페스티벌·프로모터 6.5만을 기록했다 — [MBW](https://www.musicbusinessworldwide.com/live-music-discovery-platform-bandsintown-reaches-100m-registered-users), [Hypebot, 2025-10](https://www.hypebot.com/hypebot/2025/10/bandsintown-hits-100m-registered-users-as-global-reach-tops-4-1b.html). 2025년 한 해 동안 팬이 1천만 명 늘었다 — [Hypebot](https://www.hypebot.com/bandsintowns-high-notes-reveals-the-artists-genres-cities-that-led-live-music-in-2025)
- Fever는 2025-06-05 DICE를 인수하면서 동시에 펀딩을 받았다. DICE의 월간 활성 팬은 1천만을 넘었다 — [Fever Newsroom](https://newsroom.feverup.com/en-US/250537-fever-and-dice-join-forces-to-build-a-live-entertainment-tech-powerhouse/), [Digital Music News, 2025-06-05](https://www.digitalmusicnews.com/2025/06/05/fever-dice-acquisition/)
- Suno는 2025-11 Warner와 합의하면서 그 일환으로 Songkick을 인수했다 — [The Statesman](https://www.thestatesman.com/entertainment/suno-raises-400-million-series-d-ai-music-app-5-billion-valuation-1503601648.html)
- "공연판 Letterboxd"를 표방하는 인디 앱이 많다.
  - Encore: Concert Diary: 총 공연 수, 희귀 아티스트, 자주 간 공연장, 연간 리캡, 팬 랭크 배지 — [mwm.ai](https://mwm.ai/apps/encore-concert-diary/6748657647)
  - Gigvault: 공연마다 갱신되는 "Concert Wrapped" — [App Store](https://apps.apple.com/app/id6765689126). 출시 3개월 만에 페스티벌 페이지 608개, 13개 언어로 확장했다 — [Product Hunt](https://www.producthunt.com/p/gigvault/three-months-in-608-festival-pages-13-languages-and-what-a-summer-of-festivals-taught-me)
  - Rail: setlist.fm 세트리스트 이력을 바탕으로 관람 기록 — [App Store](https://apps.apple.com/app/id6772891700)
  - ONGA: 관람 패스포트, 곡 단위 평점 — [mwm.ai](https://mwm.ai/apps/onga-live-saver/6768066370)
  - Afterlight: 로컬 우선, 친구 기능은 선택 — [App Store](https://apps.apple.com/app/id6755545440)
  - Concert Archives: 관람 이력 DB와 소셜 기능 — [Marlvel](https://marlvel.ai/apps/concert-archives)
- 한국 관람 기록 앱
  - 티켓스토리(iOS): 온라인 예매 내역 자동 등록, 실물 티켓 카메라 인식, 별점·리뷰, 통계. 평가 10건, 평점 4.5 — [App Store](https://apps.apple.com/kr/app/%ED%8B%B0%EC%BC%93%EC%8A%A4%ED%86%A0%EB%A6%AC-%EC%98%81%ED%99%94-%EB%AE%A4%EC%A7%80%EC%BB%AC-%EA%B3%B5%EC%97%B0-%EC%A0%84%EC%8B%9C-%EC%8A%A4%ED%8F%AC%EC%B8%A0-%EA%B4%80%EB%9E%8C-%EA%B8%B0%EB%A1%9D/id6503619368)
  - PL@Y2: 디지털 티켓 아카이브, 평점 3.6 — [mwm.ai](https://mwm.ai/ko/apps/ply2/1159328039)
  - 포도알(podo.r): 공연 생활 기록 — [App Store](https://apps.apple.com/us/app/%ED%8F%AC%EB%8F%84%EC%95%8C-podo-r/id1594315823?l=ko)

#### F. 팬덤 (K-pop)

- Weverse는 HYBE 2025 Fandom Trend Report 기준 2025년 MAU 약 1,200만으로 사상 최고였다. 2025 Q2 평균 1,090만, 6월 정점 1,200만이며, 1인당 월 263분을 쓰고 게시물·댓글이 3.03억 건이다. HYBE는 Weverse가 "casual fans into superfans"로 전환시킨다고 주장한다 — [MBW](https://www.musicbusinessworldwide.com/hybe-says-weverse-hit-12m-monthly-users-last-year-and-that-its-turning-casual-fans-into-superfans)
- 누적 다운로드는 1.5억, 2024년 이용자는 19% 늘었다 — [MBW](https://musicbusinessworldwide.com/weverse-hits-150m-downloads-sees-19-user-growth-in-2024-as-ariana-grande-dua-lipa-join-superfan-platform12)
- 2026년에는 BTS·BLACKPINK 활동 효과로 사상 최고치를 경신했다는 보도가 있다 — [Sports Khan, 2026-02](https://sports.khan.co.kr/en/article/202602061002007), [Outlook Respawn](https://respawn.outlookindia.com/pop-culture/pop-culture-news/bts-return-lifts-weverses-active-users-to-12m). 2026 Q1 1,337만, Q2 1,443만이라는 수치는 검색 요약에 나온 보도치이며 1차 공시로 확인하지 못했다.
- Berriz는 카카오엔터테인먼트가 2025-03 Weverse의 직접 경쟁 플랫폼으로 출시했다(웹·모바일, 18개 언어) — [MBW](https://musicbusinessworldwide.com/youve-heard-of-superfan-app-weverse-now-the-parent-company-of-hybes-arch-rival-has-launched-a-direct-competitor-meet-berriz), [Asiae, 2025-01](https://view.asiae.co.kr/en/article/2025010315343302485)
- 팬 투표 앱: 최애돌은 실시간 아이돌 순위 투표, 기부 이벤트, 배경화면을 제공한다 — [App Store](https://apps.apple.com/kr/app/%EC%B5%9C%EC%95%A0%EB%8F%8C-%EC%BC%80%EC%9D%B4%ED%8C%9D-%EC%95%84%EC%9D%B4%EB%8F%8C-%EC%88%9C%EC%9C%84-%EC%8A%A4%EC%BC%80%EC%A4%84-%EC%97%B0%EC%98%88%EC%9D%B8-%EB%B0%B0%EA%B2%BD%ED%99%94%EB%A9%B4/id1131995698). 많은 팬덤 플랫폼이 투표를 핵심 기능으로 쓰며, 팬앤스타와 유픽은 투표 성과를 전광판 광고 혜택과 연결한다 — [더팩트 '팬들의 놀이터②'](https://news.tf.co.kr/read/ogmeta/2354540.htm)
- 총공(스밍 총공) 문화
  - 특정 시간대에 특정 곡을 집중적으로 스트리밍·다운로드·선물해 음원 점수를 올리는 팬 활동이다 — [더위키](https://thewiki.kr/w/총공)
  - 멜론·지니·벅스·바이브·플로·유튜브별 스트리밍 가이드가 커뮤니티에서 정리돼 돌아다닌다(2021년 게시물) — [디시인사이드](https://gall.dcinside.com/m/yangjunil/125078)
  - 케이팝포플래닛은 스트리밍 탄소 배출 문제로 1만 명 이상이 서명한 청원을 국내 플랫폼에 전달했다(2022) — [아시아경제](https://www.asiae.co.kr/en/article/2022093011283150646)

#### G. 인디 아티스트·크리에이터 발굴, 큐레이션 부활

- Bandcamp: Epic이 2022-03 인수했다가 2023-09 Songtradr에 매각했고, 이후 인력이 약 절반으로 줄었다 — [Soundwave Music Media](https://www.soundwavemusicmedia.net/stories-1/all-stories/2892502_bandcamp-ban-a-i-generated-music)
- Bandcamp Fridays는 2025년 아티스트·레이블에 1,900만 달러 이상을 지급했다(검색 요약 기준) — [Digital Music News, 2026-01-14](https://www.digitalmusicnews.com/2026/01/14/bandcamp-takes-a-stand-and-bans-ai-generated-music/). 2020-03 이후 누적은 약 1.54억 달러다 — [MBW](https://www.musicbusinessworldwide.com/tag/bandcamp-fridays)
- Bandcamp는 2026-01-13 생성형 AI로 "wholly or in substantial part" 만든 음악을 금지했다 — [Engadget](https://www.engadget.com/entertainment/streaming/bandcamp-prohibits-music-made-wholly-or-in-substantial-part-by-ai-130050593.html), [Stereogum](https://stereogum.com/2485199/bandcamp-bans-ai-music)
- 유료 큐레이터 피칭 시장
  - SubmitHub: 유료 프리미엄 크레딧을 쓰면 청취와 최소 10단어 피드백 또는 플레이리스트 추가가 보장된다.
  - Groover: Grooviz 크레딧으로 큐레이터·블로그·라디오·레이블 등 3,000곳 이상에 보내고, 7일 안에 응답이 없으면 환불한다.
  - 큐레이터 규모와 수락률은 비교 글마다 다르다 — [Hypebot](https://www.hypebot.com/which-music-submission-service-is-best-submithub-musosoup-others-compared/), [Two Story Melody](https://twostorymelody.com/groover-review/), [Musosoup](https://musosoup.com/blog/groover-vs-submithub)
- 비평·큐레이션 매체의 독립화: Condé Nast는 2024년 초 Pitchfork 인력의 약 절반을 줄이고 GQ에 편입했다. 그러자 전 Pitchfork 기자 5명이 2024년 멤버십 기반 매체 "Hearing Things"를 창간했고, 이후 100% 노동자 소유로 전환했다 — [AV Club](https://www.avclub.com/hearing-things-former-pitchfork-writers-music-new-site), [Hearing Things](https://www.hearingthings.co/hearing-things-is-now-100-worker-owned-2/)
- AI 업로드 홍수(Deezer)
  - AI 트랙 비중은 2025-01 약 10%(하루 1만) → 2025-04 18%(2만) → 2025-09 28%(3만 이상)로 늘었다 — [Music in Africa](https://www.musicinafrica.net/magazine/ai-generated-music-now-makes-third-daily-uploads-deezer), [Digital Music News, 2025-09-11](https://www.digitalmusicnews.com/2025/09/11/deezer-ai-tracks-daily-stat/)
  - 이후 하루 7.5만(44%) — [MBW](https://www.musicbusinessworldwide.com/75000-ai-generated-tracks-now-flood-deezer-daily-representing-44-of-all-new-music-uploaded-to-the-platform-says-streamer/) — 를 거쳐, 2026-07 하루 9만으로 신규 업로드의 50%를 처음 넘었다 — [MBW](https://www.musicbusinessworldwide.com/90000-ai-tracks-flood-deezer-daily-passing-half-of-new-music-uploads-for-the-first-time/). 44% 수치의 보도 시점은 매체마다 2025년, 2026년으로 다르게 표기된다.
  - 실제 스트림에서 AI 트랙 비중은 약 0.5%이고, 완전 합성 트랙 스트림의 최대 85%가 사기성으로 추정된다(검색 요약 기준, 원문 재확인 필요) — [Engadget](https://engadget.com/entertainment/music/deezer-says-ai-made-songs-make-up-44-percent-of-daily-uploads-163642921.html)

#### H. 함께 듣기·라디오 부활

- Spotify Jam
  - 2023-09 출시, 최대 32명 — [BetaNews, 2023-09-26](https://betanews.com/2023/09/26/spotify-launches-new-collaborative-playlist-feature-called-jam), [iMusician](https://imusician.pro/en/resources/blog/spotify-jam-a-new-real-time-collaborative-feature-for-up-to-32-users)
  - 2025-08-25 월 청취 1억 시간 돌파 — [Spotify Newsroom](https://newsroom.spotify.com/2025-08-25/jam-reaches-100-million-monthly-listening-hours/)
  - DAU는 전년 대비 2배 이상 — [RouteNote](https://routenote.com/blog/spotify-listening-activity-and-request-to-jam/)
  - 가장 많이 쓰는 기기는 자동차다. Jam 시작은 Premium만 가능하고 참여는 누구나 가능하다 — [PPC Land](https://ppc.land/spotify-jam-reaches-100-million-monthly-listening-hours/)
- NTS
  - 청취자 수치는 출처마다 다르다. 2024-03 NYT 기준 하루 약 36만, 2025-12 032c 기준 월 약 600만이며 둘 다 위키 미러에서 재인용했다 — [Wikipedia 미러](https://wiki.krisyotam.com/content/wikipedia_en_all_nopic_2026-03/Nts.live)
  - 후원 프로그램 NTS Supporters는 월 £3.99부터이며, 수수료를 뺀 절반을 레지던트에게 준다. 총수입의 17%를 차지한다 — [NTS](https://www.nts.live/supporters)
  - MIDiA(2025-11)는 NTS 같은 온라인 라디오가 알고리즘 플레이리스트가 하지 못하는 커뮤니티 형성 역할을 한다고 분석했다 — [MIDiA Research](https://www.midiaresearch.com/blog/online-radio-and-community-building-a-closer-look-at-nts-dont-assume-day), [Hypebot, 2025-11](https://www.hypebot.com/hypebot/2025/11/nts-thrives-in-the-spaces-that-streaming-leaves-behind.html)
- Twitch DJ Program: 2024-06-06 UMG·WMG·Sony·Merlin과 함께 발표했다. 수익화한 DJ는 수익 일부를 권리자와 나눈다(처음엔 Twitch가 더 부담하고 이후 대부분 50/50). 수익화하지 않은 DJ의 비용은 Twitch가 부담한다. 2024-08부터 가동했다 — [Twitch Blog](https://fr.blog.twitch.tv/en/2024/06/06/introducing-the-twitch-dj-program/), [Digital Music News, 2024-06-06](https://www.digitalmusicnews.com/2024/06/06/twitch-dj-program-officially-launches/), [Digital Music News, 2024-08-08](https://www.digitalmusicnews.com/2024/08/08/twitch-dj-celebration-launches-after-inking-major-labels/)
- Lofi Girl: 구독자 1,580만, 누적 조회 27.3억(2026-11-06 스냅샷) — [vidIQ](https://vidiq.com/youtube-stats/channel/UCSJ4gkVC6NrvII8umztf0Ow). 2025-07-29 '졸업' 방송이 화제가 됐다 — [Malay Mail, 2025-07-31](https://www.malaymail.com/news/life/2025/07/31/lofi-girl-finally-graduates-after-seven-years-of-non-stop-studying/185984). 2025년 시청 시간 1.73억 시간이라는 수치는 Streams Charts를 인용한 서드파티 추정이다 — [Voxbooster](https://voxbooster.com/blog/lofi-study-music-24-7-livestream-statistics-2026/)
- 오프라인 청음 공간
  - Gen Z가 클럽 대신 일본식 리스닝 바로 옮겨 가고 있다는 보도 — [Smithsonian](https://www.smithsonianmag.com/travel/why-gen-z-is-trading-night-clubs-for-japanese-style-listening-bars-180988044/), [Dazed](https://www.dazeddigital.com/music/article/68170/1/pub-club-rise-of-listening-bars-music-gen-z-tokyo-london-new-york)
  - 서울의 소규모 청음 공간 소개(2025-06): 망원동 쿼터는 신청곡을 '문장'으로 받아 어울리는 음악을 틀어준다. 상수동 제비다방은 2012년 문을 연 뒤 주 4회 이상 공연을 열었다 — [헤이팝](https://heypop.kr/n/123955/)

#### I. 게임·바이럴 생성기

- Heardle: Spotify가 2022년 인수한 뒤 2023-05-05 종료했다 — [BetaNews, 2023-04-16](https://betanews.com/2023/04/16/spotify-is-killing-heardle-after-less-than-a-year/), [PC Gamer](https://pcgamer.com/spotify-is-killing-wordle-like-music-puzzle-game-heardle-next-month)
- Bandle: Johann Levy가 2022-08 출시했다. 하루 한 문제, 최대 6단계 오디오 단서를 주며, 하루 10만 명 이상이 한다(단일 출처) — [Berklee Online Take Note](https://online.berklee.edu/takenote/bandle-creator-johann-levy-on-the-music-quiz-100k-daily-players-love/)
- Hitster(Jumbo, 고안자 Marcus Carleson)
  - 브랜드 누적 800만 개 이상 판매(Original, Summer Party, Bingo 포함, 2025-12-03 보도) — [Toys n Playthings](https://www.toysnplaythings.media/jumbo-amplifies-hitster-sales-success-with-uk-pop-ups/)
  - 2024년 독일·네덜란드 게임 판매 1위, 30개국 이상 출시, Fremantle과 TV 게임쇼 제작 — [People of Play, 2024-10-22](https://peopleofplay.com/blog/fremantle-partners-with-newbe-and-jumbo-group-to-bring-popular-music-party-game-hitster-to-life-in-new-game-show)
  - 앱 다운로드 250만 이상, 50개국 이상, 100개 이상의 버전, 유럽 업계 상 10개 이상(2025-09) — [People of Play, 2025-09-11](https://www.peopleofplay.com/blog/jumbo-groups-hitster-a-fast-paced-music-driven-party-game)
- Instafest: USC 학생 Anshay Saboo가 2022-11-22 출시했다. 상위 아티스트로 페스티벌 포스터를 만들어 주고, Spotify·Apple Music·Last.fm을 지원했다. 정점에서 시간당 신규 이용자 50만, 하루 600만 명이었고, 그 주 페이지뷰는 1억 이상이었다 — [Vercel](https://vercel.com/blog/from-idea-to-100-million-views-instafest-music-festival-application). Questlove 등 셀럽도 참여했다 — [NBC Los Angeles](https://nbclosangeles.com/news/local/instafest-the-latest-viral-trend-created-by-a-usc-student/3047195)
- The Pudding "How Bad Is Your Spotify?"(2020-12, Matt Daniels): 청취 이력을 AI가 조롱하는 사이트로, 접속이 몰려 자주 다운됐다 — [MusicTech](https://www.musictech.net/news/how-bad-is-your-spotify/), [Digital Music News, 2020-12-24](https://www.digitalmusicnews.com/2020/12/24/spotify-ai-music-tastes/). 이후 ChatGPT 같은 범용 챗봇에 플레이리스트 "roast"를 맡기는 식으로 퍼졌다 — [Tom's Guide](https://www.tomsguide.com/ai/chatgpt/i-asked-chatgpt-to-roast-my-spotify-playlists-and-it-didnt-hold-back-at-all)
- 한국형 취향 테스트: 10문항 점수제에 결과 링크를 공유하는 '플레이리스트 취향 테스트' 같은 사이트가 있다 — [k-calc](https://k-calc.com/play/test/playlist), [tali.kr](https://tali.kr/test-music). 참여자 수 자료는 찾지 못했다.
- 생성기의 데이터 원천이 막혔다. Spotify는 2025-05-15 Web API 확장 쿼터 기준을 바꿨다. 커뮤니티 포스트와 서드파티 보도에 따르면 법인, 출시된 서비스, MAU 25만 이상 등이 요건이다 — [Spotify Community](https://community.spotify.com/t5/Spotify-for-Developers/Updating-the-Criteria-for-Web-API-Extended-Access/td-p/6920661/page/8), [Spotify Docs](https://developer.spotify.com/documentation/web-api/concepts/quota-modes). 개발 모드 허용 인원은 5명(2026-02 포스트)과 25명(2025)으로 엇갈린다 — [Spotify Community](https://community.spotify.com/t5/Spotify-for-Developers/February-2026-Spotify-for-Developers-update-thread/m-p/7368752/highlight/true)

#### J. AI 큐레이션 보조·AI 음악 창작

- Spotify의 ChatGPT 앱(2025-10-06, 145개국, 영어): 자연어로 플레이리스트를 만들고 음악을 찾는다. 무료 Spotify 사용자는 기존 플레이리스트 검색 위주로 쓸 수 있다 — [Neowin](https://www.neowin.net/news/spotify-announces-chatgpt-integration-heres-how-to-use-it/), [Tom's Guide](https://www.tomsguide.com/ai/you-can-now-make-spotify-playlists-using-chatgpt-heres-how-to-do-it)
- Prompted Playlists: 2025-12 뉴질랜드에서 베타를 시작했다. 전체 청취 이력을 바탕으로 하고, 프롬프트를 수시로 고칠 수 있다. 2026-01-22부터 미국·캐나다 Premium으로 확대됐고 영어 전용이다 — [BetaNews, 2025-12-11](https://betanews.com/2025/12/11/spotify-is-testing-a-new-prompt-powered-playlist-feature/), [9to5Mac, 2025-12-11](https://9to5mac.com/2025/12/11/spotify-joins-potential-new-trend-of-giving-us-more-control-over-the-algorithms/), [Spotify Support](https://support.spotify.com/au/article/prompted-playlists)
- Taste Profile: 사용자가 자신의 추천 모델을 보고 자연어로 고칠 수 있다(Premium, SXSW에서 발표) — [MBW](https://www.musicbusinessworldwide.com/spotify-to-let-users-edit-the-algorithm-behind-their-personalized-recommendations-with-taste-profile), [TNW](https://thenextweb.com/news/spotify-launches-taste-profile-editor)
- Suno
  - 누적 이용자 1억 명 이상, 유료 구독 약 200만 — [TNW](https://thenextweb.com/news/suno-5-4-billion-valuation-raise)
  - CEO가 밝힌 ARR은 3억 달러다 — [MBW](https://www.musicbusinessworldwide.com/suno-hits-2m-paid-subscribers-300m-annual-revenue/). TNW는 2025년 매출을 약 1.5억 달러로 보도했는데, 런레이트와 연매출의 차이로 보인다.
  - 2025-11 시리즈C(기업가치 24.5억 달러), 2026-06 시리즈D 4억 달러 이상(54억 달러) — [The Statesman](https://www.thestatesman.com/entertainment/suno-raises-400-million-series-d-ai-music-app-5-billion-valuation-1503601648.html), [MBW](https://www.musicbusinessworldwide.com/suno-is-far-beyond-2m-subscribers-and-300m-in-revenue-says-mikey-shulman-who-argues-its-good-that-ai-music-has-no-firm-rules-of-the-road-yet/)
  - 2025-11 Warner와 소송을 합의하고 라이선스 모델 파트너십을 맺었다 — [Claims Journal, 2025-11-26](https://amp.claimsjournal.com/news/national/2025/11/26/334294.htm). UMG와의 합의 여부는 매체마다 다르다 — [TNW](https://thenextweb.com/news/suno-5-4-billion-valuation-raise) vs [GCN](https://gcn.com/?p=20405)

#### K. 유틸리티 (집중·수면·운동·어학·노래방)

- Endel: 2020 시리즈A 500만 달러, 2022-04 시리즈B 1,500만 달러(총 약 2,210만 달러). 2022년 MAU 100만 이상 — [TechCrunch, 2022-04-05](https://techcrunch.com/2022/04/05/endel-raises-15m-to-further-develop-its-ai-powered-sound-wellness-technology/), [Endel PR](https://endel.io/pages/newsroom/press-releases/series-b/Endel-PressRelease-Funding.pdf)
- Duolingo Music: 2023-10 출시. 회사는 "millions of learners"라고만 밝히고 성과 수치는 공개하지 않았다. 2025-08 NextBeat 팀을 인수해 게임화를 강화했다 — [Fast Company](https://www.fastcompany.com/91382293/duolingo-wants-to-make-music-lessons-more-addictive). Sony Music 카탈로그의 히트곡을 수록했다 — [iMusician](https://imusician.pro/en/resources/blog/duolingo-partners-with-sony-music)
- K-pop 가사로 한국어 배우기
  - Duolingo 공식 블로그가 K-pop을 한국어·문화 학습 경로로 소개한다 — [Duolingo Blog](https://blog.duolingo.com/learn-korean-culture-with-kpop)
  - Duolingo 2022 Language Report 기준 한국어 학습자가 전년 대비 29% 늘었다 — [Korea Herald via Daum, 2023-01-29](https://v.daum.net/v/20230129155131623)
  - K-lingo, DicToc KPOP: Lyrics Game 같은 소형 앱이 있다 — [App Store K-lingo](https://apps.apple.com/us/app/id6743989630), [App Store DicToc](https://apps.apple.com/us/app/id6451875389)
- 노래방: '애창곡 노트'(TJ·금영 통합 번호, 가사, 최고음, 주간 인기차트) — [App Store](https://apps.apple.com/kr/app/%EC%95%A0%EC%B0%BD%EA%B3%A1-%EB%85%B8%ED%8A%B8-%EB%85%B8%EB%9E%98%EB%B0%A9%EC%97%90%EC%84%9C-%EB%B6%80%EB%A5%BC-%EB%85%B8%EB%9E%98-%EA%B8%B0%EB%A1%9D-%EB%B0%8F-%EA%B4%80%EB%A6%AC/id1627953850?l=ko), '노래방Book'(TJ·금영 통합 검색, 애창곡 저장) — [App Store](https://apps.apple.com/us/app/%EB%85%B8%EB%9E%98%EB%B0%A9book/id1672848960?l=ko). 두 앱 모두 설명에 친구 공유 기능은 없다.

#### L. (추가 영역) 서비스 중립 공유 레이어와 한국 스트리밍 파편화

- 2025-05 국내 음원 앱 MAU(와이즈앱·리테일): 유튜브 뮤직 982만(42%), 멜론 654만(26%), 스포티파이 359만(14%), 지니 263만(11%), 플로 175만(8%) — [뉴스스페이스](https://www.newsspace.kr/mobile/article.html?no=6969)
- 스포티파이는 무료 요금제 출시 이후 이용자가 2배 이상 늘었다는 보도가 있다 — [파이낸셜뉴스, 2025-07](https://www.fnnews.com/news/202507210701257985)
- 2025-08 스포티파이가 424만으로 멜론(623만)을 제치고 2위가 됐다(1위 유튜브 뮤직 1,012만) — [더팩트](https://news.tf.co.kr/read/ogmeta/2355749.htm)
- 2025년 전체 이용자는 약 2,627만이고, 점유율은 유튜브 뮤직 36.1%, 스포티파이 23.6%다 — [더팩트](https://news.tf.co.kr/read/ogmeta/2278669.htm)
- 2026-07 보도 기준 유튜브 뮤직 949만, 스포티파이 622만이다. 스포티파이는 2024년 같은 달 161만에서 약 4배가 됐다 — [CEO스코어데일리, 2026-07-29](https://www.ceoscoredaily.com/page/view/2026072916262538897), [한국경제, 2026-07-28](https://www.hankyung.com/article/2026072812091)
- 유튜브 뮤직 이용자 수에는 YouTube Premium 번들 때문에 실제로는 쓰지 않는 결제자도 포함된다는 지적이 있다 — [한국경제, 2025-04](https://www.hankyung.com/article/202504180202g)
- 서비스 간 링크 수요의 글로벌 증거: Songlink/Odesli(한 링크로 모든 스트리밍 서비스 연결)는 2021년 Linktree가 인수할 당시 전 세계 1,600만 명 이상이 쓰고 있었다 — [PR Newswire](https://prnewswire.com/news-releases/linktree-announces-acquisition-of-songlinkodesli-and-launches-music-link-feature-301358565.html), [MBW](https://musicbusinessworldwide.com/linktree-acquires-songlink-odesli-and-launches-music-link-feature)

### Inferences

- **수요 신호 강도.**
  - 강함(대규모 지표와 성장 확인): A의 플랫폼 내장형, B의 연간 리캡, E의 라이브 인프라, F의 기획사 플랫폼, I의 게임, J의 AI 창작.
  - 중간(지표는 있으나 규모가 작거나 출처가 엇갈림): H의 커뮤니티 라디오·함께 듣기, G의 유료 큐레이션·Bandcamp.
  - 약함(출시는 많지만 지표 없음): C, D의 단독 앱, A·B·E의 인디 포맷 앱.
- 2023–2026년에 검증된 수요의 대부분은 대형 플랫폼이 이미 흡수했거나 흡수 중이다(Messages, Jam, Wrapped, Prompted Playlists, Instagram 프로필 곡, 카카오 프로필뮤직). 1인 개발자에게 남는 공간은 네 가지다.
  1. 특정 서비스에 묶이지 않는 공유 레이어
  2. 자체(1st-party) 데이터로 만드는 리캡·정체성 아티팩트
  3. 모임·공연 같은 오프라인 맥락에서 쓰는 보조 앱
  4. AI 홍수 속에서 "사람이 고른 음악"임을 보증하는 신뢰 레이어
- 인디 앱은 2025–26년에 하루 한 곡 6종 이상, 음악 일기 6종 이상, 공연 일기 6종 이상, 장소 기반 4종 이상이 나왔지만 공개된 트랙션은 거의 없다. 포맷만으로는 차별화가 안 된다. 승부는 콜드스타트를 넘는 수단(기존 소셜 그래프, 바이럴 아티팩트, 오프라인 접점)에서 갈린다.
- 가장 큰 바이럴 순간은 모두 "공유 가능한 카드나 이미지"를 만들어 냈다(Wrapped 공유 5억 건, Instafest 페이지뷰 1억, sendthesong). 다만 Spotify 청취 데이터에 기대는 생성기 모델은 2025-05 이후 신규 진입이 사실상 막혔다.
- Deezer의 AI 업로드 비중은 18개월 만에 10%에서 50% 이상으로 뛰었다. Bandcamp는 AI 음악을 금지했고, 사람의 귀를 사는 유료 큐레이션 시장도 존재한다. 그래서 "사람이 고른 음악"의 신뢰 프리미엄이라는 내러티브는 2024년보다 2026년에 훨씬 강하다. VIBR의 원래 컨셉("알고리즘이 아니라 관계")을 다시 포지셔닝할 근거가 된다.
- 한국은 1위 서비스 점유율이 40% 안팎에 그치고, 2위가 2년 만에 바뀔 만큼 서비스 간 이동이 크다. 그래서 "친구가 다른 앱을 쓴다"는 문제가 글로벌보다 더 첨예할 가능성이 높다.

### Gaps

- Receiptify, Spotify Blend, Locket·BeReal의 음악 기능, Seoul Community Radio의 지표는 확보하지 못했다. Receiptify는 신뢰할 만한 이용자 수 출처가 없었고, 나머지는 검색 한도가 소진돼 조사하지 못했다.
- 하루 한 곡·음악 일기·공연 일기·장소 기반 인디 앱의 DAU와 리텐션은 비공개라 실제 수요 강도를 판단할 수 없다.
- 한국 음악 취향 테스트의 참여 규모, 한국 인디 큐레이션 플랫폼 현황, 국내 플레이리스트 이전(멜론 → 스포티파이 등) 수요 데이터는 확인하지 못했다.
- How Bad Is Your Spotify의 이용자 수, Hitster의 구체적 플레이 방식은 1차 출처로 확인하지 못했다.

---

## 2. 승자들의 핵심 루프는 무엇이고, 왜 리텐션 또는 바이럴로 이어지는가

### Takeaway

승자의 루프는 네 유형으로 모인다.

1. **의례·빈도형**: 하루 1회 프롬프트나 퍼즐(Bandle, 하루 한 곡 앱, 팬 투표 앱 출석)
2. **정체성 아티팩트형**: 내 취향을 한 장으로 압축한 공유 카드(Wrapped, Instafest, How Bad Is Your Spotify)
3. **실시간 동반형**: 친구가 "지금" 듣는 곡이나 함께 듣기(Airbuds 위젯, Jam, Messages 청취 활동)
4. **집단 목표·지위형**: 팬덤 투표, 총공, 랭크 배지(Weverse, 최애돌, Encore 팬 랭크)

바이럴은 2번에서, 리텐션은 1·3·4번에서 나온다. 강한 제품은 획득 장치와 반복 장치를 함께 갖고 있다.

### Cited Findings

- **Airbuds**: 위젯이 친구의 실시간 청취를 앱을 열지 않아도 보여 준다 — [TechCrunch](https://techcrunch.com/2025/09/17/airbuds-is-the-music-social-network-apple-and-spotify-wish-they-had-built/). 친구를 초대해야 추가 기능이 열리는 feature-gating을 성장 요인으로 꼽은 분석이 있다(단일 분석, 검색 요약 기준) — [Consumer App Lab](https://consumerapplab.substack.com/p/inside-airbuds-the-app-that-grew). Appfigures는 "Music + Widgets = Downloads"라며 위젯 결합을 다운로드 동인으로 지목했다 — [Appfigures](https://appfigures.com/resources/insights/20240503?f=1)
- **Spotify의 흡수 경로**: Jam(2023-09) → Messages(2025-08) → 실시간 청취 활동과 Request to Jam(2026-01) → 그룹 공유(2026-01) — [BetaNews](https://betanews.com/2023/09/26/spotify-launches-new-collaborative-playlist-feature-called-jam), [TechCrunch](https://techcrunch.com/2025/08/26/spotify-launches-a-messages-feature-in-a-bid-to-become-more-social/), [RouteNote](https://routenote.com/blog/spotify-listening-activity-and-request-to-jam/), [Spotify Newsroom](https://newsroom.spotify.com/tag/messaging/). Jam을 가장 많이 쓰는 기기가 자동차라는 점은 같은 공간에서 함께 듣는 용도를 시사한다 — [PPC Land](https://ppc.land/spotify-jam-reaches-100-million-monthly-listening-hours/)
- **Wrapped 2025**: 첫날 참여 2억 명, 공유 5억 건(네이티브 공유, 스크린샷, 다운로드 포함) — [TechCrunch](https://techcrunch.com/2025/12/04/spotify-says-wrapped-2025-is-its-biggest-yet-with-200m-users-in-its-first-day)
- **Instafest**: 내 상위 아티스트를 페스티벌 포스터 한 장으로 바꿔 준다. 정점에서 시간당 신규 50만 명이었고 셀럽도 참여했다 — [Vercel](https://vercel.com/blog/from-idea-to-100-million-views-instafest-music-festival-application), [NBC LA](https://nbclosangeles.com/news/local/instafest-the-latest-viral-trend-created-by-a-usc-student/3047195)
- **How Bad Is Your Spotify**: 조롱("roast")형 판정 결과를 사용자가 SNS에 올리며 퍼졌다 — [MusicTech](https://www.musictech.net/news/how-bad-is-your-spotify/)
- **sendthesong**: 익명, 특정인 이름, 곡, 공개 browse를 결합했다. 하지 못한 고백이나 미련을 노래로 대신 표현하는 감정 루프다 — [Batam News Asia](https://batamnewsasia.com/2024/11/15/the-send-the-song-trend-a-new-way-to-express-feelings-anonymously/), [Preview.ph](https://old.preview.ph/culture/what-is-sendthesong-xyz-a5200-20241111)
- **Bandle**: 하루 한 문제, 최대 6단계 오디오 단서. 매일 하는 의례로 하루 10만 명 이상이 플레이한다 — [Berklee](https://online.berklee.edu/takenote/bandle-creator-johann-levy-on-the-music-quiz-100k-daily-players-love/)
- **Hitster**: 고안자와 Jumbo는 "It's a game and soundtrack in one!"이라고 설명한다 — [Mojo Nation](https://www.mojo-nation.com/its-a-game-and-soundtrack-in-one-inventor-marcus-carleson-and-jumbos-ferran-codina-on-the-story-behind-hitster/). 카드 게임이지만 앱 다운로드가 250만 이상이다 — [People of Play](https://www.peopleofplay.com/blog/jumbo-groups-hitster-a-fast-paced-music-driven-party-game)
- **Weverse**: 1인당 월 263분, 게시물·댓글 3.03억 건. "casual fans into superfans" — [MBW](https://www.musicbusinessworldwide.com/hybe-says-weverse-hit-12m-monthly-users-last-year-and-that-its-turning-casual-fans-into-superfans)
- **팬 투표 앱**: 매일 출석하게 만드는 루프가 있고, 투표 성과가 전광판 광고라는 보상으로 이어진다 — [더팩트](https://news.tf.co.kr/read/ogmeta/2354540.htm)
- **공연 일기 앱**: 연간 또는 공연별 리캡("Concert Wrapped"), 팬 랭크 배지, 희귀 아티스트 통계 — [mwm.ai Encore](https://mwm.ai/apps/encore-concert-diary/6748657647), [App Store Gigvault](https://apps.apple.com/app/id6765689126)
- **하루 한 곡 앱**: 무작위 알림에 하루 1회 공유(Soundcheck!), 좋아요가 가장 많은 곡이 그날의 곡(Sway), 짧은 일일 창(Spin) — [mwm.ai](https://mwm.ai/apps/soundcheck/6463963681), [App Store](https://apps.apple.com/app/sway-song-of-the-day/id6743491738), [Product Hunt](https://www.producthunt.com/products/spin-8)
- **관극다꾸**: 기록 → SNS 공유 → 서로 취향 확인으로 이어진다 — [데일리안](https://www.dailian.co.kr/news/view/1639830/)
- **NTS**: 레지던트가 진행하는 쇼와 후원(총수입의 17%). 진행자에 대한 애착이 수익으로 이어진다 — [NTS](https://www.nts.live/supporters)
- **Tinder**: 대표곡을 설정하면 매치가 약 10% 늘었다(2021) — [TechCrunch](https://techcrunch.com/2021/12/09/tinder-is-partnering-with-spotify-to-launch-a-new-music-mode-feature/)
- **카카오 프로필뮤직**: 프로필의 상태메시지 자리에 곡이 늘 보인다 — [카카오](https://www.kakaocorp.com/page/detail/8211)

### Inferences

- **동기 유형별 해석**(빈도·감정·정체성·실용)
  - **빈도**: 하루 1회라는 제약(희소성, BeReal과 비슷한 구조)과 알림이 핵심이다. 다만 봐 줄 사람이 없는 일기형(Songstamp처럼 좋아요·댓글이 없는 형태)은 관여도가 낮아 이탈이 빠를 것이다.
  - **감정**: 익명이나 간접 고백(sendthesong), 기억 소환(일기, 리캡)은 한 번에 크게 터지지만 반복 동기가 약하다. 주·월·연 단위 정기 리캡이나 타임캡슐 열람일 같은 장치로 반복성을 줘야 한다.
  - **정체성**: 공유 카드는 바이럴 효과가 가장 크지만 데이터 원천이 필요하다. VIBR은 자체 이벤트 로그(게시, 좋아요, 재생, 팔로우)로 이를 충당할 수 있다.
  - **실시간 동반**: 핵심은 presence(지금 접속·청취 중임을 보여 주는 것)다. Spotify가 같은 기능을 빠르게 내장하고 있어, 독립 가치는 서비스가 섞인 친구 사이나 소규모 그룹에서만 남는다.
  - **집단 목표·지위**: 팬덤의 투표, 출석, 랭크는 리텐션이 가장 강하다. 대신 어뷰징과 차트 조작 논란을 함께 떠안는다.
- 강한 제품은 세 가지를 결합한다: 바이럴 아티팩트(획득), 일일 의례(리텐션), 소셜 그래프(이탈 방지).
  - Wrapped: 연례 아티팩트 + 매일 쓰는 Spotify 앱
  - Airbuds: 위젯으로 매일 노출 + 초대해야 기능이 열리는 구조로 획득
  - Hitster: 오프라인 파티가 획득 장면, 앱은 재생 도구라는 동반 구조(추론)
- VIBR의 현재 루프(게시 → 좋아요·댓글 → 팔로우)에는 정체성 표현은 있지만 세 가지가 빠져 있다: (a) 매일 돌아올 이유, (b) 외부로 퍼질 공유 아티팩트, (c) 실시간 동반 요소. 그래서 이탈하기 쉬운 구조다. 방향을 바꾸든 다듬든, 반복 트리거 하나와 외부 공유 아티팩트 하나는 반드시 설계해야 한다.

### Gaps

- 앱별 D1/D30 리텐션처럼 루프 효과를 정량 비교할 공개 데이터가 없다.
- Hitster의 구체적 메커닉(QR 재생, 연도 배치 등)과 Airbuds의 반응 형식은 1차 자료로 확인하지 못했다(검색 요약 기반).

---

## 3. 미충족 갭: 한국 사용자, 그리고 친구들이 서로 다른 스트리밍 서비스를 쓰는 경우

### Takeaway

가장 선명한 갭은 **"서비스 중립적인 소셜 레이어"**다. 플랫폼의 공유·함께 듣기 기능은 모두 자기 생태계 안에서만 작동한다(Spotify Messages·Jam, 멜론에 묶인 카카오 프로필뮤직, Meta 라이선스 라이브러리를 쓰는 Instagram). 그런데 한국은 1위 점유율이 36–42%에 그치고 상위 5개 서비스로 나뉘어 있어, 친구끼리 쓰는 서비스가 다른 것이 일상이다.
그 밖의 한국 특유의 갭은 네 가지다.

1. 공연 기록 문화(관극다꾸)를 받쳐 줄 디지털 도구가 없다.
2. 노래방 애창곡을 친구와 공유하는 도구가 없다.
3. 기획사 플랫폼 사일로(Weverse 대 Berriz) 밖에서 팬이 주도하는 큐레이션 도구가 없다.
4. AI 생성곡이 쏟아지는 가운데 "사람이 보증한" 발견 경로가 없다.

### Cited Findings

- 서비스 잠금
  - Spotify의 실시간 청취 활동은 Messages에서 이미 연결된 상대에게만 보인다. Request to Jam은 Premium 사용자가 초대하는 방식이다 — [RouteNote](https://routenote.com/blog/spotify-listening-activity-and-request-to-jam/)
  - Jam 시작은 Premium만 가능하다 — [PPC Land](https://ppc.land/spotify-jam-reaches-100-million-monthly-listening-hours/)
  - 카카오 프로필뮤직은 멜론과 연동되고 기본은 1분 미리듣기다 — [카카오](https://www.kakaocorp.com/page/detail/8211)
  - Instagram 프로필 곡은 Instagram 자체 라이선스 라이브러리의 30초 클립이다 — [Business Standard](https://business-standard.com/technology/tech-news/instagram-introduces-song-on-profile-feature-similar-to-myspace-details-124082300227_1.html)
- 한국 파편화: 2025-05 기준 유튜브 뮤직 42%, 멜론 26%, 스포티파이 14%, 지니 11%, 플로 8%(MAU 점유율) — [뉴스스페이스](https://www.newsspace.kr/mobile/article.html?no=6969). 2025년 연간 점유율은 유튜브 뮤직 36.1%, 스포티파이 23.6% — [더팩트](https://news.tf.co.kr/read/ogmeta/2278669.htm). 스포티파이는 2년 만에 약 4배로 늘었다(2026-07) — [CEO스코어데일리](https://www.ceoscoredaily.com/page/view/2026072916262538897). 유튜브 뮤직 수치는 번들 효과로 부풀었다는 지적이 있다 — [한국경제](https://www.hankyung.com/article/202504180202g)
- 교차 서비스 링크 수요의 글로벌 증거: Odesli 이용자 1,600만 명 이상(2021) — [PR Newswire](https://prnewswire.com/news-releases/linktree-announces-acquisition-of-songlinkodesli-and-launches-music-link-feature-301358565.html)
- 팬덤은 이미 여러 서비스를 손으로 조율하고 있다. 플랫폼별(멜론, 지니, 벅스, 바이브, 플로, 유튜브) 스트리밍 가이드가 커뮤니티에서 돌아다닌다 — [디시인사이드](https://gall.dcinside.com/m/yangjunil/125078)
- 공연 기록: 관극다꾸는 퍼지고 있지만 국내 관람 기록 앱의 반응은 작다(티켓스토리 평가 10건, PL@Y2 평점 3.6) — [데일리안](https://www.dailian.co.kr/news/view/1639830/), [App Store 티켓스토리](https://apps.apple.com/kr/app/%ED%8B%B0%EC%BC%93%EC%8A%A4%ED%86%A0%EB%A6%AC-%EC%98%81%ED%99%94-%EB%AE%A4%EC%A7%80%EC%BB%AC-%EA%B3%B5%EC%97%B0-%EC%A0%84%EC%8B%9C-%EC%8A%A4%ED%8F%AC%EC%B8%A0-%EA%B4%80%EB%9E%8C-%EA%B8%B0%EB%A1%9D/id6503619368), [mwm.ai PL@Y2](https://mwm.ai/ko/apps/ply2/1159328039)
- 노래방 앱은 번호 검색과 애창곡 저장 기능만 있고, 설명에 공유 기능이 없다 — [App Store 애창곡 노트](https://apps.apple.com/kr/app/%EC%95%A0%EC%B0%BD%EA%B3%A1-%EB%85%B8%ED%8A%B8-%EB%85%B8%EB%9E%98%EB%B0%A9%EC%97%90%EC%84%9C-%EB%B6%80%EB%A5%BC-%EB%85%B8%EB%9E%98-%EA%B8%B0%EB%A1%9D-%EB%B0%8F-%EA%B4%80%EB%A6%AC/id1627953850?l=ko), [App Store 노래방Book](https://apps.apple.com/us/app/%EB%85%B8%EB%9E%98%EB%B0%A9book/id1672848960?l=ko)
- 기획사 사일로: Weverse(HYBE) 대 Berriz(카카오엔터, 2025-03) — [MBW](https://musicbusinessworldwide.com/youve-heard-of-superfan-app-weverse-now-the-parent-company-of-hybes-arch-rival-has-launched-a-direct-competitor-meet-berriz)
- AI 홍수와 신뢰 수요의 간접 증거: Deezer 신규 업로드의 50% 이상이 AI(2026-07) — [MBW](https://www.musicbusinessworldwide.com/90000-ai-tracks-flood-deezer-daily-passing-half-of-new-music-uploads-for-the-first-time/). Bandcamp는 AI 음악을 금지했다(2026-01) — [Engadget](https://www.engadget.com/entertainment/streaming/bandcamp-prohibits-music-made-wholly-or-in-substantial-part-by-ai-130050593.html). 사람 큐레이터에게 돈을 내는 피칭 시장(Groover 3,000곳 이상)이 있다 — [Two Story Melody](https://twostorymelody.com/groover-review/)
- 알고리즘을 통제하고 설명받고 싶은 수요: Spotify가 Prompted Playlists와 Taste Profile로 사용자에게 "알고리즘 편집"을 열어 줬다 — [MBW](https://www.musicbusinessworldwide.com/spotify-to-let-users-edit-the-algorithm-behind-their-personalized-recommendations-with-taste-profile), [9to5Mac](https://9to5mac.com/2025/12/11/spotify-joins-potential-new-trend-of-giving-us-more-control-over-the-algorithms/)
- 서드파티 데이터 접근 봉쇄: Spotify 확장 쿼터는 MAU 25만 이상 등을 요구한다(2025-05) — [Spotify Community](https://community.spotify.com/t5/Spotify-for-Developers/Updating-the-Criteria-for-Web-API-Extended-Access/td-p/6920661/page/8)

### Inferences

1. **서비스 중립 "노래 한 곡 보내기"와 "오늘의 곡"**: 받는 사람이 어떤 앱을 쓰든 바로 들을 수 있는 공유 단위다. YouTube 임베드나 iTunes 미리듣기로 재생하고, 각 서비스 링크를 함께 붙인다. 멜론에 묶이고 1분만 들리는 카카오 프로필뮤직, Spotify에 묶인 Messages가 남긴 틈이다.
2. **서비스 중립 함께 듣기**: Jam은 Spotify와 Premium을 전제로 한다. 서로 다른 서비스를 쓰는 친구들이 YouTube 기반으로 동시에 재생하는 소규모 방이 빈자리다. 단, 권리와 약관을 확인해야 한다.
3. **청취 데이터 없이 돌아가는 리캡**: 자동 청취 이력 대신 "내가 고르고 보낸 곡, 받은 곡, 반응"이라는 의도적 행동 데이터로 Wrapped 같은 아티팩트를 만든다. API 봉쇄를 우회하면서 관계까지 보여 준다(누가 내 취향에 영향을 줬나, 내가 퍼뜨린 곡).
4. **한국 공연 기록**: 기록 문화는 강하지만 디지털 도구 반응은 미미하다. 티켓, 세트리스트, 사진, 함께 간 친구를 묶은 기록에 연말 리캡과 "같은 공연을 본 사람" 그래프를 더할 수 있다.
5. **노래방 애창곡의 사회화**: 번호 검색 도구는 있지만 친구끼리 "18번"을 공유하거나 모임 세트리스트를 함께 짜는 도구는 비어 있다(수요 강도는 검증되지 않음).
6. **팬 주도 큐레이션**: 기획사 플랫폼은 공식 콘텐츠 중심이다. 팬이 새 팬을 위해 만드는 그룹·기획사 횡단 큐레이션은 플랫폼 밖 커뮤니티에 흩어져 있는 것으로 보인다(직접 근거는 약함).
7. **"사람 보증" 신뢰 레이어**: AI 생성곡이 급증하는 가운데 "누가, 언제, 왜 골랐는지" 보이는 발견 경로다. VIBR의 원래 컨셉과 정확히 맞는다.

- 교차 서비스 갭은 친구 활동을 자동으로 수집하는 방식(Airbuds형)으로는 메울 수 없다. API 봉쇄 때문이다. 사용자가 의도적으로 골라 보내는 방식으로 메워야 하며, 이는 VIBR의 게시 기반 구조와 잘 맞는다.

### Gaps

- "친구와 쓰는 앱이 달라 공유가 불편하다"는 한국 사용자 설문이나 리뷰 같은 직접 데이터는 확보하지 못했다. 위 갭은 추론에 의존한다.
- 다음 사항은 이번 범위(API 상세 제외)와 검색 한도 때문에 검증하지 못했다: 멜론·지니·FLO·바이브의 웹 딥링크·임베드 가능 여부, YouTube IFrame 동기 재생의 약관 적합성, iTunes 미리듣기 이용 조건.
- 팬덤의 "영업"(입덕 유도) 큐레이션 관행, 국내 노래방 번호 데이터의 공식 제공처, 한국 인디 씬의 큐레이션 공백은 출처를 확인하지 못했다.

---

## 4. 영역별 평가(1인 실현성·기술 깊이·VIBR 자산 재사용)와 최종 우선순위

### Takeaway

1인 개발, API 제약, 면접 어필, 기존 자산을 함께 보면 상위 후보는 다섯 가지다.

1. "사람 보증" 설명 가능 큐레이션 + 테이스트메이커 점수
2. 서비스 중립 "노래 보내기 / 오늘의 곡" 폐쇄형 루프
3. 자체 데이터 기반 소셜 리캡·기억 아카이브
4. 서비스 중립 함께 듣기 방 / 친구 라디오
5. 친구 그래프 기반 음악 게임

데이팅, AI 창작, 장소 기반, 유틸리티는 수요 근거나 실현성이 약하다. 1~3위는 하나의 제품 방향으로 묶을 수 있다: "서비스와 상관없이 음악을 주고받고, 그 기록이 사람이 보증한 추천과 리캡이 되는 앱." 4~5위는 기술 깊이를 더하는 확장 모듈로 쓰기 좋다.

### Cited Findings

- VIBR 코드 자산(로컬 확인)
  - Neo4j GDS로 상호작용 그래프를 투영한 뒤 `gds.louvain.write`로 커뮤니티를 기록한다 — [algorithm.service.ts](apps/api/src/modules/algorithm/algorithm.service.ts)
  - `INTERACTED` 관계에 관계 유형별로 `last_interacted_at`를 기록한다 — [algorithm.service.ts](apps/api/src/modules/algorithm/algorithm.service.ts)
  - 트렌딩 점수는 매시간 ×0.9로 감쇠하고, 2,000건씩 배치로 스캔한다 — [trending.constants.ts](apps/api/src/modules/trending/trending.constants.ts)
  - 피드 소스 following·recent·trending이 공통 인터페이스를 구현한다 — [feed/sources](apps/api/src/modules/feed/sources/)
- 데이터 접근 제약: Spotify 확장 쿼터는 MAU 25만 이상 등을 요구하고(2025-05-15), 개발 모드 허용 인원은 5명 또는 25명으로 엇갈린다 — [Spotify Community](https://community.spotify.com/t5/Spotify-for-Developers/Updating-the-Criteria-for-Web-API-Extended-Access/td-p/6920661/page/8), [Spotify Community 2026-02](https://community.spotify.com/t5/Spotify-for-Developers/February-2026-Spotify-for-Developers-update-thread/m-p/7368752/highlight/true)
- 대체 데이터 경로의 실제 사례
  - Instafest는 Spotify 외에 Apple Music과 Last.fm도 지원했다 — [Vercel](https://vercel.com/blog/from-idea-to-100-million-views-instafest-music-festival-application)
  - Rail은 setlist.fm 세트리스트 이력을 쓴다 — [App Store](https://apps.apple.com/app/id6772891700)
  - Odesli는 API를 제공한다 — [publicapi.dev](https://publicapi.dev/songlink-odesli-api)
- 권리 비용 사례: Twitch DJ는 수익 일부를 권리자와 나눠야 합법적으로 스트리밍할 수 있다 — [Twitch Blog](https://fr.blog.twitch.tv/en/2024/06/06/introducing-the-twitch-dj-program/). 공개 방송형 함께 듣기에는 권리 리스크가 실제로 있다.
- 플랫폼 의존 리스크: Heardle은 인수 후 1년도 안 돼 종료됐다 — [BetaNews](https://betanews.com/2023/04/16/spotify-is-killing-heardle-after-less-than-a-year/)
- 대형사의 AI 큐레이션 선점: ChatGPT 앱(2025-10), Prompted Playlists(2025-12 ~ 2026-01), Taste Profile — [Neowin](https://www.neowin.net/news/spotify-announces-chatgpt-integration-heres-how-to-use-it/), [BetaNews](https://betanews.com/2025/12/11/spotify-is-testing-a-new-prompt-powered-playlist-feature/), [MBW](https://www.musicbusinessworldwide.com/spotify-to-let-users-edit-the-algorithm-behind-their-personalized-recommendations-with-taste-profile)
- AI 창작의 법적 리스크: Suno는 Warner와 합의했지만 다른 소송은 상태가 엇갈린다 — [Claims Journal](https://amp.claimsjournal.com/news/national/2025/11/26/334294.htm), [GCN](https://gcn.com/?p=20405)

### Inferences

#### 영역별 3축 평가 (상/중/하와 한 줄 이유)

| 영역                                         | 1인 실현성 (API 제약 하)                                                                                            | 기술 깊이 (면접 어필)                                                                                   | VIBR 자산 재사용                                                                   |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| A. 친밀·폐쇄형 공유 (하루 한 곡·노래 보내기) | **상**: 자동 청취 수집 없이 사용자가 고른 곡만 다루면 YouTube·iTunes로 충분하다                                     | **중**: 알림 스케줄링·팬아웃·presence 수준. 홈 위젯 루프는 PWA로 재현하기 어렵다(검증 필요)             | **상**: 팔로우 그래프·피드·알림·멀티 플레이어·PWA 푸시를 그대로 쓴다               |
| B. 기억·리캡·타임캡슐                        | **상**: 자체 이벤트만으로 만들 수 있고 외부 API가 필요 없다                                                         | **중~상**: 이벤트 → 집계 → 카드 렌더링 파이프라인, 대량 생성 시 멱등성·재처리·캐싱                      | **상**: Redis Streams 이벤트 버스·log 모듈·Neo4j 영향 경로                         |
| C. 장소 기반                                 | **중**: 지도 SDK·위치 권한·프라이버시 처리, 지역 밀도 콜드스타트가 치명적이다                                       | **상**: geohash/H3 인덱싱, Redis GEO 근접 검색, 위치 흐리기, 공간 클러스터링                            | **중**: FeedSource에 nearby 소스를 추가하는 식으로 정책을 재사용, 나머지는 신규    |
| D. 취향 궁합·데이팅                          | **하**: 데이팅은 임계 질량·신원·안전·신고 대응 부담이 크고 청취 데이터가 막혀 있다(친구 간 궁합 카드 기능으로는 상) | **중**: 유사도(Jaccard, 임베딩)와 매칭 최적화                                                           | **중**: Louvain 커뮤니티와 상호작용 그래프로 궁합 점수 산출                        |
| E. 라이브·공연 기록                          | **중**: 해외는 setlist.fm 같은 오픈데이터가 있지만 국내는 수동 입력·OCR·공공데이터 검증이 필요하다                  | **상**: 아티스트·공연장 엔티티 정규화, 공동 관람 그래프, 오프라인 우선 기록 + 동기화, 공연 리캡         | **중~상**: 피드·팔로우·Neo4j·알림·PWA는 재사용, 공연 엔티티는 신규                 |
| F. 팬덤                                      | **중**: 공식 콘텐츠·IP는 쓸 수 없고 기획사 플랫폼과 경쟁하며 어뷰징·차트 조작 논란을 관리해야 한다                  | **상**: 실시간 집단 카운터, 레이트 리밋·봇 탐지, 대규모 랭킹                                            | **상**: Redis 트렌딩·피드·플레이리스트·알림                                        |
| G. 인디 발굴·사람 보증 큐레이션              | **중**: 양면 시장 콜드스타트가 있지만 결제는 미룰 수 있고 재생은 임베드로 된다                                      | **상**: 얼리 디스커버리 점수, 그래프 신뢰 전파(PageRank류)로 스팸·AI 대량 업로드에 저항, 경로 기반 설명 | **상**: 트렌딩 타임스탬프·INTERACTED 그래프·Louvain·FeedSource 정책을 그대로 확장  |
| H. 함께 듣기·친구 라디오                     | **중**: YouTube 동기 재생은 가능하지만 iTunes는 30초 한계, 공개 방송형은 권리 리스크, 동시 접속 운영비              | **상**: 시계 동기화·드리프트 보정·WebSocket 팬아웃·presence·호스트 이양·재접속 복구, 면접 최상급 소재   | **상**: now-playlist 큐·전역 플레이어 스토어·알림·팔로우                           |
| I. 게임·바이럴 생성기                        | **상**: iTunes 30초 미리듣기가 퀴즈 클립에 맞고, 자체 데이터 생성기는 API가 필요 없다(미리듣기 약관은 확인 필요)    | **중~상**: 서버 권위 타이머·정답 비노출(치팅 방지)·실시간 멀티플레이·난이도 보정·Redis ZSET 리더보드    | **중~상**: 플레이어·Redis 랭킹·팔로우 그래프로 친구 리더보드                       |
| J-1. AI 큐레이션 보조                        | **중**: LLM 비용, 오디오 특징 데이터 부재, Spotify와 정면 경쟁은 불가하니 사람 큐레이터를 돕는 역할로 좁혀야 한다   | **상**: 텍스트 임베딩 + 그래프 하이브리드 랭킹, 경로 기반 설명 생성, 오프라인 평가                      | **상**: 게시글 텍스트·커버 이미지·그래프                                           |
| J-2. AI 음악 창작 커뮤니티                   | **하**: 생성 API 비용과 저작권 소송 리스크                                                                          | **중**                                                                                                  | **중**: 피드·좋아요 정도                                                           |
| K. 유틸리티 (집중·수면·어학·노래방)          | **중**: 생성 오디오·가사 라이선스 장벽, 노래방 번호 데이터 출처 불명                                                | **하~중**: 노래방 세트리스트 실시간 공동 편집 정도                                                      | **하~중**: 플레이리스트·플레이어                                                   |
| L. 서비스 중립 공유 레이어                   | **중~상**: YouTube·iTunes 검색 매칭은 이미 가능하고 Odesli API도 쓸 수 있다. 국내 서비스 딥링크는 검증 필요         | **상**: 트랙 엔티티 매칭(한·영 표기, 리마스터·라이브 구분, 퍼지 매칭, 신뢰도·캐시)                      | **상**: `mappers/*ToMusic.ts` 정규화와 멀티 프로바이더 플레이어가 바로 기반이 된다 |

#### 최종 우선순위 숏리스트

1. **"사람 보증" 발견: 설명 가능한 소셜 큐레이션 + 테이스트메이커(얼리 디스커버리) 점수** (G + J-1, VIBR 코어를 다시 정의)
   - 근거
     - Deezer AI 업로드 비중 10% → 50% 이상(2025-01 → 2026-07)
     - Bandcamp AI 금지(2026-01)
     - 유료 큐레이터 시장(SubmitHub·Groover)과 멤버십 비평 매체(Hearing Things), 후원형 라디오(NTS)
     - 대형 플랫폼도 "통제·설명" 기능을 투입(Prompted Playlists, Taste Profile)
   - 컨셉
     - 피드 카드에 "왜 보이는지" 경로를 노출한다. 예: "당신이 팔로우하는 A가 3일 전 처음 올렸고 B·C가 좋아요."
     - 트렌딩되기 전에 먼저 고른 사람에게 얼리 디스커버리 평판을 준다.
     - Louvain 커뮤니티 단위로 "이 취향권의 숨은 큐레이터"를 보여 준다.
   - 기술 훅
     - Neo4j 경로 질의와 신뢰 전파
     - 트렌딩 타임스탬프 기반 선행성 점수(배치 파이프라인)
     - 시빌·어뷰징 저항
     - 오프라인 평가 지표(precision@k, 선행성의 예측력)
   - 첫 슬라이스: 기존 피드 응답에 추천 사유 경로를 붙이고, 큐레이터 점수를 계산하는 배치 잡을 만든다.
   - 리스크: "사람 보증"에 돈을 내거나 더 쓰겠다는 수요를 직접 보여 주는 지표가 없다(근거가 간접적).
2. **서비스 중립 "노래 보내기 + 오늘의 한 곡"** (A + L)
   - 근거
     - Spotify Messages 약 4천만 명(5개월), Jam 월 1억 시간, Airbuds MAU 500만
     - sendthesong 바이럴(2024-11), 카카오 프로필뮤직 문화
     - 그러나 전부 특정 서비스에 묶여 있고, 한국은 1위 점유율 36–42%로 분산
   - 컨셉
     - 받는 사람이 어떤 앱을 쓰든 열리는 "노래 카드"(커버 + 한 줄 + 즉시 재생 + 각 서비스 링크, 로그인 없이 열람)
     - 소규모 그룹의 하루 한 곡 의례
     - 기명·익명을 고를 수 있는 마음 전하기
   - 기술 훅
     - 트랙 엔티티 매칭
     - OG 이미지 카드 렌더링·캐싱
     - 알림 스케줄링·팬아웃
     - 웹 푸시(PWA)
   - 첫 슬라이스: 게시글을 "특정 친구나 그룹에게 보내기"로 확장하고, 공개 카드 링크를 만든다.
   - 리스크: 하루 한 곡 인디 앱 포화, PWA 위젯 한계, 카카오톡·인스타그램 공유 채널 의존.
3. **소셜 리캡·기억 아카이브("VIBR Recap", 그룹 타임캡슐)** (B)
   - 근거: Wrapped 2025 첫날 2억 명, 공유 5억 건. 서드파티 생성기 경로는 Spotify API 봉쇄로 막혀, 자체 데이터를 가진 쪽만 만들 수 있다.
   - 컨셉: 월간·연간 리포트("누가 내 취향을 바꿨나"(영향 경로), "내가 퍼뜨린 곡", "우리 그룹의 올해"), 1년 뒤 열어 보는 타임캡슐.
   - 기술 훅: Redis Streams 이벤트 → 집계 → 카드 렌더링 파이프라인, 멱등 재처리, 대량 생성 스케일.
   - 리스크: 단독 제품이라기보다 1·2위의 획득·리텐션 장치다.
4. **서비스 중립 함께 듣기 방 / 친구 라디오** (H)
   - 근거: Jam(Spotify와 Premium 전제) 월 1억 시간, NTS 후원(수입 17%), Lofi Girl 구독 1,580만, 리스닝 바 트렌드.
   - 컨셉: 팔로워를 위한 주간 "내 쇼"를 예약하고, 끝나면 플레이리스트로 아카이브한다. 친구끼리 함께 듣는 방.
   - 기술 훅: 실시간 동기화 전반(이 목록에서 면접 소재로 가장 강함).
   - 리스크: 권리·약관, 동시 접속 콜드스타트, 운영비.
5. **친구 그래프 기반 음악 게임(데일리 퍼즐 + 파티 모드)** (I)
   - 근거: Hitster 800만 개 이상, Bandle 하루 10만 명 이상, Instafest 정점 하루 600만 명.
   - 컨셉: iTunes 미리듣기 기반 데일리 "1초 듣기", 친구 리더보드, 모임용 실시간 파티 모드.
   - 기술 훅: 실시간 멀티플레이, 치팅 방지, Redis ZSET 리더보드, 난이도 보정.
   - 리스크: Heardle처럼 일회성 유행으로 끝날 수 있다. 미리듣기 약관을 확인해야 한다.

- 차순위: 6위 한국 공연 기록·동행(E), 7위 팬 주도 큐레이션(F), 8위 장소 기반(C), 9위 유틸리티 중 노래방 사회화(K), 10위 AI 창작(J-2), 11위 데이팅(D, 단독 앱 기준. 친구 간 궁합 카드 기능은 1~3위에 흡수 가능).

#### 요약 표

| 순위 | 영역                                    | 대표 제품 (2023–26 중심)                                              | 핵심 지표 (날짜)                                                               | 핵심 동인                  | 주요 갭 (한국·서비스 혼재 친구)                          | 실현성 | 기술 깊이 | 재사용 |
| ---- | --------------------------------------- | --------------------------------------------------------------------- | ------------------------------------------------------------------------------ | -------------------------- | -------------------------------------------------------- | ------ | --------- | ------ |
| 1    | 사람 보증 큐레이션·발굴 (G+J-1)         | Bandcamp, SubmitHub/Groover, Hearing Things, Spotify Taste Profile    | Deezer AI 업로드 50% 이상 (2026-07), Bandcamp Fridays 1,900만 달러 이상 (2025) | 신뢰·평판, 큐레이터 정체성 | 누가·왜 골랐는지 보이는 발견 경로가 없음                 | 중     | 상        | 상     |
| 2    | 서비스 중립 노래 보내기·오늘의 곡 (A+L) | Spotify Messages, Airbuds, Lowkey·Cue, sendthesong, 카카오 프로필뮤직 | Messages 약 4천만 명 (2026-01), Airbuds MAU 500만 (2025-09)                    | 일일 의례, 감정 표현       | 모든 기능이 특정 서비스에 묶임 vs 한국 분산 (1위 36–42%) | 상     | 중        | 상     |
| 3    | 소셜 리캡·기억 (B)                      | Spotify Wrapped, Instafest, MULOG, Melodiary                          | Wrapped 첫날 2억 명·공유 5억 건 (2025-12)                                      | 정체성 아티팩트            | 서드파티 데이터 봉쇄, 관계형 리캡 부재                   | 상     | 중~상     | 상     |
| 4    | 함께 듣기·친구 라디오 (H)               | Spotify Jam, NTS, Twitch DJ, Lofi Girl                                | Jam 월 1억 시간 (2025-08)                                                      | 실시간 동반, 진행자 애착   | Jam은 Spotify·Premium 전제                               | 중     | 상        | 상     |
| 5    | 음악 게임·생성기 (I)                    | Hitster, Bandle, Instafest                                            | Hitster 800만 개 이상 (2025-12), Bandle 하루 10만 명 이상                      | 일일 퍼즐, 파티            | 한국형 콘텐츠·친구 리더보드                              | 상     | 중~상     | 중~상  |
| 6    | 라이브·공연 기록 (E)                    | Bandsintown, DICE, Encore, Gigvault, 티켓스토리                       | Bandsintown 1억 명 (2025-10), DICE MAU 1천만 (2025-06)                         | 기록·리캡·배지             | 관극다꾸 문화 vs 약한 국내 앱                            | 중     | 상        | 중~상  |
| 7    | 팬덤 (F)                                | Weverse, Berriz, 최애돌                                               | Weverse MAU 약 1,200만 (2025)                                                  | 집단 목표, 매일 출석       | 기획사 사일로, 팬 주도 큐레이션 부재                     | 중     | 상        | 상     |
| 8    | 장소 기반 (C)                           | Paseo, Retune, Reverie.fm, Pinwave                                    | 공개 지표 없음                                                                 | 장소와 기억의 결합         | 밀도 콜드스타트                                          | 중     | 상        | 중     |
| 9    | 유틸리티 (K)                            | Endel, Lofi Girl, Duolingo Music, 애창곡 노트                         | Endel MAU 100만 이상 (2022), Lofi Girl 구독 1,580만 (2026-11)                  | 기능적 반복 사용           | 노래방 애창곡 공유 부재                                  | 중     | 하~중     | 하~중  |
| 10   | AI 음악 창작 (J-2)                      | Suno, Udio                                                            | Suno 이용자 1억 명 이상, ARR 3억 달러 (2026)                                   | 창작을 통한 자기표현       | 저작권 리스크                                            | 하     | 중        | 중     |
| 11   | 취향 궁합·데이팅 (D)                    | Tinder Music Mode, Vinylly, Beatmatch                                 | Gen Z 약 40%가 Anthem 설정 (2021)                                              | 대화의 실마리              | 기능으로는 유효, 단독 앱은 불리                          | 하     | 중        | 중     |

### Gaps

- 이 평가는 공개 지표와 문헌을 바탕으로 한 추론이며, 한국 사용자 인터뷰나 설문으로 검증하지 않았다(특히 1위 "사람 보증"의 수요 강도).
- 검색 한도가 소진돼 실현성 평가에 영향을 주는 항목을 확인하지 못했다: YouTube IFrame 동기 재생 약관, iTunes 미리듣기 이용 조건, 국내 공연 공공데이터(KOPIS 등) API 제공 여부, PWA가 iOS 홈 위젯을 만들 수 없는지 여부, 국내 스트리밍 서비스의 딥링크 규격.
