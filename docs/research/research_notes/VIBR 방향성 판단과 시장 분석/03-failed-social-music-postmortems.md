# 실패·종료·피벗한 소셜 뮤직 서비스 포스트모템 (2008–2026): VIBR 컨셉은 '알려진 함정'인가

> 기준일 2026-11-13. 출처 유형 표기: **【공식】** 창업자·회사가 직접 밝힌 사유 / **【분석】** 언론·애널리스트·투자자의 해석 / **【추론】** 본 연구자의 추론(원칙적으로 Inferences에만 기재).
> 조사 후반에 세션 공유 웹검색 한도가 소진되어, 그 뒤로는 이미 확보한 URL을 직접 열람하는 방식으로만 보완했다. 확인하지 못한 항목은 각 Gaps에 적었다.
> 과제 설명의 일부 전제는 실제 자료와 다르다. Cymbal은 "~2021–2023, Twitter for music"이 아니라 2015–2018년의 "Instagram for music"이었다. Stereo는 종료가 확인되지 않았고, Jukely·Discz·Kakao Music도 종료를 확인하지 못했다. 자세한 내용은 해당 항목에 적었다.

## 1. 사례 검증과 포스트모템: 개념, 메커닉, 피크, 타임라인, 종료 사유, 교훈

### Takeaway

2008–2026년의 소셜 뮤직 사례를 보면 "사람이 사람에게 곡을 추천하는 피드"는 독립 스타트업(This Is My Jam, Cymbal, Blip.fm)에서도, 압도적 배포력을 가진 거대 플랫폼(Apple Ping/Connect, Twitter #Music, Spotify Inbox)에서도 반복해서 실패했다. 종료 사유는 다섯 갈래로 모인다. ① 재생 권리와 라이선스 비용, ② 외부 API·플랫폼 의존, ③ 낮은 참여·공유 빈도, ④ 인컴번트의 흡수·번들링, ⑤ 수익모델 부재. 2021–2024년의 라이브 오디오 실험(Greenroom/Live, Amp)과 TikTok Music도 출시 후 1~2년 만에 정리됐다.

### Cited Findings

#### 1-0. 요약 표

| 서비스                           | 기간                                                                   | 핵심 메커닉                                                                                                                                      | 확인된 피크                                       | 종료·피벗 사유(유형)                                                                                                                                | 교훈                                                                  | 주요 근거                                                                                                                                                                                                                                                         |
| -------------------------------- | ---------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| This Is My Jam                   | 2011 – 2015.9(읽기전용 아카이브)                                       | 지금 꽂힌 곡 1개("jam") 공유, YouTube·SoundCloud 등 외부 임베드 재생                                                                             | 사용자 약 20만 명, jam 약 200만 개                | 【공식】외부 API 변경 대응에 개발 시간 100% 소모, 라이선스·지역 제한으로 재생 불가 증가, 스트리밍이 웹에서 앱으로 이동, 모바일 재구축 여력 없음     | 임베드 의존형 1곡 공유는 '재생 가능성' 자체를 통제하지 못한다         | [TechCrunch](https://techcrunch.com/?p=1193462), [Hypebot](https://www.hypebot.com/this-is-my-jam-to-close-playlist-service/)                                                                                                                                     |
| Cymbal                           | 2015 – 2018.6.1                                                        | 프로필에 곡을 포스팅하면 팔로워 뉴스피드가 '친구들의 곡 플레이리스트'가 됨(Spotify·SoundCloud 원본 재생). 후기에는 플랫폼 불문 플레이리스트 공유 | "hundreds of thousands"가 이용(팀 고별 노트)      | 【공식】명시적 사유 없음, "a tough nut to crack", 라이선스 / 【분석】수익화 불명확, Spotify 규모, 사용자는 자기 스트리머 안에서 플레이리스트를 만듦 | 스트리밍 파편화 속에서 싱글플레이 가치 없이 소셜부터 시작하면 안 된다 | [Bandwagon](https://bandwagon.asia/articles/social-music-platform-cymbal-shutting-down), [Hypebot](https://www.hypebot.com/playlist-sharing-startup-cymbal-joins-deadpool)                                                                                        |
| Blip.fm                          | 2008경 – ?(종료 시점 미확인)                                           | "Twitter for music": 곡+짧은 메시지                                                                                                              | 미확인("얼리어답터에게 히트")                     | 모회사 Fuzz가 2008.10 인력 2/3 감축, Fuzz.com은 2009.2 종료. Blip 최종 종료 사유는 미확인                                                           | —                                                                     | [Om Malik/GigaOM](https://om.co/gigaom/blipfm-facing-a-permanent-blip/), [AlternativeTo](https://alternativeto.net/software/blipfm/about/)                                                                                                                        |
| Twitter #Music                   | 2013.4경 – 2014.4.18                                                   | 트윗 활동 기반 음악 추천, Spotify·Rdio 재생 연동(비구독자는 30초)                                                                                | 출시 3개월 뒤 iOS 음악앱 133위                    | 【분석】본 앱 생태계 밖의 별도 앱, 풀트랙 라이선스 없음, 책임자 이탈                                                                                | 소셜 그래프를 가진 회사도 별도 음악 앱으로 사용자를 옮기지 못했다     | [CMU](https://archive.completemusicupdate.com/article/twitter-to-shut-its-standalone-music-app/), [Hypebot](https://hypebot.com/hypebot/2013/07/lessons-learned-from-recent-music-app-fails.html)                                                                 |
| Apple iTunes Ping                | 2010.9.1 – 2012.9.30                                                   | iTunes 내장 음악 SNS(친구·아티스트 팔로우)                                                                                                       | 48시간 내 100만 명 가입                           | 【공식】Tim Cook "the customer voted…" / 【분석】Facebook 연동 협상 결렬, 사용이 번거로움, 판매 도구처럼 느껴짐                                     | 초기 가입이 지속 사용으로 이어지지 않는다                             | [MacRumors](https://www.macrumors.com/2020/09/01/itunes-ping-launched-10-years-ago-today/), [Cult of Mac](https://www.cultofmac.com/apple-history/apple-ping-itunes-10)                                                                                           |
| Apple Music Connect              | 2015경(출시 연도 미검증) – 2018.12.13(게시 종료) / 2019.5(콘텐츠 제거) | 아티스트가 팬에게 게시물 발행                                                                                                                    | 미확인                                            | 【분석】대부분의 아티스트가 비활성, 2016년 전용 탭 제거 / 【공식】"streamlining"                                                                    | 공급자(크리에이터)가 움직이지 않으면 피드가 빈다                      | [Engadget](https://www.engadget.com/2018-12-13-apple-music-connect-removes-artist-posts.html), [MacRumors](https://www.macrumors.com/2018/12/13/apple-music-connect-shutting-down)                                                                                |
| Spotify Inbox → Messages         | ? – 2017 제거 / 2025.8.26 재출시                                       | 앱 내 1:1 곡 공유 메시지                                                                                                                         | (재출시 시점 Spotify MAU 6.96억)                  | 【분석·보도】2017년 저참여로 제거. 2025년 규모를 앞세워 재도입                                                                                      | 공유 기능은 결국 인컴번트가 번들한다                                  | [MIDiA](https://www.midiaresearch.com/blog/social-came-for-streamings-lunch-now-its-time-for-streaming-to-bite-back), [Verdict](https://www.verdict.co.uk/spotify-messages-gain-traction/)                                                                        |
| Turntable.fm                     | 2011.5 – 2013.12.2(+2021 부활 시도)                                    | 아바타 DJ 룸, 실시간 공동청취                                                                                                                    | 2011.6 활성 약 14만 명. 2013.9 월 순방문 약 8.9만 | 【공식】"the cost of running a music service has been too expensive" / 투자 약 700만 달러 소진                                                      | 라이선스 비용이 수익화보다 빨리 커졌다                                | [TechCrunch](https://techcrunch.com/2013/11/22/turntable-fm-shutting-down-so-company-can-focus-on-turntable-live-events-platform), [Wikipedia](https://en.wikipedia.org/wiki/Turntable.fm)                                                                        |
| Soundrop                         | ? – 2014.12.31                                                         | Spotify 데스크톱 앱 내 청취룸                                                                                                                    | 미확인                                            | 【보도】Spotify의 App Finder(서드파티 앱 플랫폼) 폐지                                                                                               | 남의 플랫폼 위의 기능은 하루아침에 사라진다                           | [DMN](https://www.digitalmusicnews.com/2014/11/12/soundrop-shutting/), [Engadget](https://www.engadget.com/2014/11/14/soundrop-spotify-app-platform-death/)                                                                                                       |
| Spotify Greenroom → Spotify Live | 2021.6 – 2023.4.30                                                     | 라이브 오디오 룸(Clubhouse 대응)                                                                                                                 | 다운로드 약 67만                                  | 【공식】"experimentation and learnings" / 【분석】라이브 오디오는 독립 제품보다 기능으로서 가치가 있다                                              | 팬데믹 수요에 기댄 독립 앱은 수요가 사라지면 같이 사라진다            | [MIDiA](https://www.midiaresearch.com/blog/as-spotify-joins-the-live-audio-shutdown-can-amp-and-spaces-get-it-right), [MBW](https://www.musicbusinessworldwide.com/spotify-shuts-down-spotify-live-after-two-years-of-experimentation)                            |
| Amazon Amp                       | 2022.3 – 2023.10.31                                                    | 라이선스 곡으로 라이브 라디오 쇼 호스팅, 청취자 콜인                                                                                             | 미확인                                            | 【공식】투자 우선순위 재검토 / 2022년 인력 절반 감축                                                                                                | —                                                                     | [TechCrunch](https://techcrunch.com/2023/10/05/amazon-shutters-its-live-radio-app-amp/), [CNBC](https://www.cnbc.com/2023/10/04/amazon-shuts-down-amp-live-audio-service.html)                                                                                    |
| 8tracks                          | 2008.8.8 – 2019.12.31                                                  | 최소 8곡짜리 사람 큐레이션 믹스('DJ')                                                                                                            | 사용자 약 75만 명이 플레이리스트 350만 개 생성    | 【공식】늘어나는 로열티를 감당할 매출 부족, 2014년 초부터 트래픽 감소 / 【보도】인수 무산                                                           | 사람 큐레이션의 정서적 가치는 비즈니스로 확장되기 어렵다              | [Inverse](https://www.inverse.com/input/features/remembering-8tracks-the-once-thrilling-streaming-service-that-spotify-killed-off), [Billboard](https://www.billboard.com/?p=8547162)                                                                             |
| Songza                           | ?(2014.7 Google 인수) – 2016.1.31                                      | 상황별 큐레이션 플레이리스트                                                                                                                     | 미확인                                            | 【공식】Google 인수(2014.7.1) 뒤 Play Music으로 통합                                                                                                | 큐레이션은 인컴번트의 '기능'으로 흡수된다                             | [Global News](https://globalnews.ca/news/2376343/google-to-retire-music-streaming-service-songza-as-of-jan-31/), [Vice](https://www.vice.com/en/article/yp3gpb/songza-is-shutting-down-but-its-best-features-are-already-in-google-play-music)                    |
| exfm                             | ~2010(4년 운영) – 2014.5.19                                            | 블로그 음원 발견(크롬 확장·앱)                                                                                                                   | 투자 275만 달러                                   | 【공식】음악 업계의 소송적 성격이 기술적 문제를 낳음 / 【분석】혼잡한 청취 시장                                                                     | —                                                                     | [Hypebot](https://www.hypebot.com/275-million-later-music-discovery-platform-exfm-to-shut-down), [BetaNews](https://betanews.com/2014/05/17/ex-fm-set-to-shutter-its-doors-may-19th)                                                                              |
| Heardle                          | 2022 – 2023.5.5                                                        | 매일 곡 맞히기 게임(Wordle류)                                                                                                                    | 2023.1 방문 1,000만 → 3월 600만                   | 【공식】다른 발견 기능에 집중 / 【분석】방문 급감, Spotify 앱에 통합되지 않음                                                                       | 유행성 포맷은 인수돼도 수명이 짧다                                    | [TechCrunch](https://techcrunch.com/2023/04/14/spotify-is-shutting-down-heardle-the-wordle-like-music-guessing-game-it-bought-last-year)                                                                                                                          |
| Rdio                             | 2010.8 – 2015.12                                                       | 구독형 스트리밍                                                                                                                                  | 미확인(부채 약 2.2억 달러)                        | 【분석】월 약 200만 달러 손실, 차별화 부족, 늦은 진입                                                                                               | 후발 스트리머는 규모 싸움에서 진다                                    | [VentureBeat](https://venturebeat.com/ai/rdio-struggled-to-compete-with-pandora-and-spotify-then-apple-google-and-microsoft-showed-up), [SmartCompany](https://www.smartcompany.com.au/startupsmart/the-classic-startup-mistake-what-went-wrong-for-rdio/)        |
| Grooveshark                      | ~2007(8년 운영) – 2015.4.30                                            | 사용자 업로드 기반 스트리밍                                                                                                                      | 미확인                                            | 【공식】메이저 3사와 합의해 폐쇄, "made very serious mistakes"                                                                                      | 무허가 모델은 소송으로 끝난다                                         | [Rolling Stone](https://www.rollingstone.com/music/music-news/grooveshark-shuts-down-after-eight-years-74101/), [Law360](https://law360.com/articles/650463)                                                                                                      |
| imeem                            | ? – 2009.12.8                                                          | 소셜 미디어·음악 공유                                                                                                                            | 미확인                                            | 【분석】라이선스 만료와 자금 고갈, MySpace에 헐값 매각(100만 달러 미만 보도)                                                                        | —                                                                     | [TechCrunch](https://techcrunch.com/2010/01/15/imeem-playlists-myspace), [Pollstar](https://news.pollstar.com/2009/12/09/myspace-music-scoops-up-imeem/)                                                                                                          |
| iLike                            | ?(2009.8 MySpace 인수) – 2012.2.7                                      | 소셜 음악 추천                                                                                                                                   | 미확인                                            | 【분석】매출이 성립하지 않음. MySpace 인수(약 2,000만 달러 보도) 뒤 폐쇄                                                                            | —                                                                     | [GeekWire](https://www.geekwire.com/2012/online-music-service-ilike-bites-dust/), [SlashGear](https://www.slashgear.com/ilike-social-music-service-is-officially-dead-07212488)                                                                                   |
| TikTok Music                     | 2023 – 2024.11.28                                                      | TikTok 연동 구독 스트리밍(5개 시장)                                                                                                              | 미확인                                            | 【공식】"Add to Music App"에 집중하고 스트리머와 경쟁하지 않고 협력 / 【분석】UMG 분쟁, 기대 이하 전환                                              | 최대 발견 플랫폼조차 스트리밍은 인컴번트에 넘겼다                     | [Hypebot](https://www.hypebot.com/tiktok-music-shuts-down/), [Tubefilter](https://www.tubefilter.com/2024/09/24/tiktok-music-standalone-service-shutting-down-worldwide/)                                                                                         |
| Musi                             | ? – 2024.9.24(App Store 퇴출)                                          | YouTube 오디오 래퍼 앱                                                                                                                           | 미확인                                            | 【보도】YouTube·NMPA·IFPI 민원 뒤 Apple이 삭제. 2026.3 Apple 승소                                                                                   | YouTube 위에 지은 음악 앱은 ToS 한 번에 무너진다                      | [MBW](https://www.musicbusinessworldwide.com/free-streaming-app-musi-sues-apple-over-removal-from-app-store/), [CMU 2026](https://completemusicupdate.com/apple-wins-legal-battle-with-musi-after-judge-rules-music-apps-lawsuit-was-not-the-paradigm-of-candor/) |
| Discz                            | 출범 시기 미확인 – 상태 미확인                                         | 짧은 스니펫 스와이프, 좋아요 대신 "plugs"                                                                                                        | 미국 앱스토어 음악 Top 10                         | 종료·피벗 확인 못함                                                                                                                                 | (추천 성과를 보상하는 메커닉)                                         | [Rolling Stone](https://www.rollingstone.com/music/music-features/discz-tiktok-recommendation-app-1324785/)                                                                                                                                                       |
| Stereo                           | 2020경(추정) – 상태 미확인                                             | 라이브 토크쇼 앱(음악 특화 아님)                                                                                                                 | 미확인                                            | 종료 확인 못함(App Store 등록 유지)                                                                                                                 | —                                                                     | [App Store](https://apps.apple.com/fi/app/stereo/id1501818976), [FA Mag](https://fa-mag.com/news/billionaire-bumble-seller-plans-global-launch-of-talk-show-app-58873.html)                                                                                       |
| Jukely                           | 2012 – 상태 미확인                                                     | 월 25달러 무제한 공연 멤버십                                                                                                                     | 2015년 미국 15개 도시와 런던·토론토               | 종료 확인 못함                                                                                                                                      | —                                                                     | [TechCrunch](https://techcrunch.com/2014/11/14/jukely-offers-unlimited-concerts-for-25-a-month)                                                                                                                                                                   |
| Kakao Music                      | 2013 – (운영 중으로 보임)                                              | 카카오톡 프로필 연동 음악                                                                                                                        | 미확인                                            | 2016년 카카오의 멜론 인수 뒤 관심 저하                                                                                                              | —                                                                     | [스포츠경향](https://sports.khan.co.kr/article/202001212253003)                                                                                                                                                                                                   |
| Corus(진행 중)                   | 2026.5 –                                                               | Cymbal 공동창업자의 무알고리즘·무광고 '사람 추천' 피드                                                                                           | 미공개                                            | (진행 중)                                                                                                                                           | VIBR와 같은 컨셉의 2026년 재도전                                      | [Mixmag](https://mixmag.net/read/new-music-app-cymbal-tipped-as-the-instagram-for-music-tech)                                                                                                                                                                     |

#### 1-A. '한 곡 단위 공유 / 음악 SNS 피드' 계열 (VIBR 근접군)

**This Is My Jam (2011–2015)**

- 개념과 메커닉: 지금 가장 좋아하는 곡 한 곡을 공유하는 서비스다. 피치는 "If you only trust me for a moment this week, listen to this."였다 — [TechCrunch, 2015-08-09](https://techcrunch.com/?p=1193462)
- 기원: Matthew Ogle과 Hannah Donovan이 음악 데이터 회사 The Echo Nest 안에서 만들었고, Spotify가 Echo Nest를 인수하기 약 6개월 전에 분사했다 — [TechCrunch](https://techcrunch.com/?p=1193462)
- 타임라인: "We started Jam in 2011". 2015-08-10 종료를 발표했고 2015년 9월 읽기전용으로 전환했다. 창업자들은 결정 전 거의 1년 동안 선택지를 검토했다 — [Hypebot](https://www.hypebot.com/this-is-my-jam-to-close-playlist-service/)
- 피크: 약 20만 명이 약 200만 개의 jam을 공유했다 — [TechCrunch](https://techcrunch.com/?p=1193462)
- 의존 플랫폼: YouTube, SoundCloud, Twitter, Facebook, The Hype Machine, The Echo Nest, Amazon — [TechCrunch](https://techcrunch.com/?p=1193462); [Radio Survivor](https://radiosurvivor.com/2015/08/this-is-my-jam-and-the-hazards-of-indie-music-curation)
- 【공식】API 유지보수 부채: "100% of our time's been spent updating years-old code libraries and hacking around deprecations just to keep the lights on." 변경 속도가 "soon exceeding our capacity to fix it" 수준이라고 했다 — [Radio Survivor(Matthew Lasar, 2015-08-11)](https://radiosurvivor.com/2015/08/this-is-my-jam-and-the-hazards-of-indie-music-curation)
- 【공식】재생 불가 증가: 라이선스·지역 제한으로 "sorry, this cannot be played here" 같은 메시지가 흔해졌다 — [Hypebot](https://www.hypebot.com/this-is-my-jam-to-close-playlist-service/)
- 【공식】청취 환경 변화: "streams moved from the web into apps", "our specific approach doesn't suit today's users very well" — [Hypebot](https://www.hypebot.com/this-is-my-jam-to-close-playlist-service/)
- 【공식】모바일: 모바일 스트리밍 규칙이 웹보다 훨씬 엄격해 제품을 완전히 다시 만들어야 했고, 초기 자금은 웹 버전에 쓴 상태였다. 2012년 이후 모바일 '한 곡 공유' 앱이 열 개 가까이 나왔지만 자리 잡지 못했다는 관찰도 덧붙였다 — [Hypebot](https://www.hypebot.com/this-is-my-jam-to-close-playlist-service/)
- 【공식】철학: "Jam's been about slow, considerate sharing since the start — didn't want to change that now." — [TechCrunch](https://techcrunch.com/?p=1193462)
- 【공식·보도】개인 사정: Ogle은 2015년 초 Spotify로, Donovan은 Drip으로 옮겨 일하고 있었다. 원래 미션을 갈 수 있는 데까지 탐구했다는 취지의 언급도 보도됐다 — [Digital Trends](https://www.digitaltrends.com/music/this-is-my-jam-shutting-down/); [Engadget](https://www.engadget.com/2015/08/09/this-is-my-jam-shutdown/). 이 문장은 검색 요약 기준이며 원문 대조는 하지 못했다. TechCrunch는 Ogle의 새 역할을 Spotify의 개인화·발견 제품으로 적었다 — [TechCrunch](https://techcrunch.com/?p=1193462)
- 종료 방식: 텍스트 내보내기, 읽기전용 API 유지, GitHub 오픈소스화, Spotify 플레이리스트로 아카이브를 제공했다 — [TechCrunch "Shuts Down Without Screwing Users"](https://techcrunch.com/?p=1193462)
- 【분석】Radio Survivor는 대형 플랫폼 API 위에 서비스를 짓는 소규모 개발자가 불안정한 지형에 놓인다고 지적하면서, 8tracks가 SoundCloud 검색을 중단한 사례와 연결했다 — [Radio Survivor](https://radiosurvivor.com/2015/08/this-is-my-jam-and-the-hazards-of-indie-music-curation)

**Cymbal (2015–2018)**

- 메커닉: Spotify·SoundCloud와 연동해 곡을 프로필에 포스팅하면 팔로워 뉴스피드에 뜨고, 그 피드가 곧 친구들의 곡으로 된 플레이리스트가 된다. 재생은 원본 소스에서 일어나 재생 크레딧도 원본에 돌아갔다 — [Bandwagon](https://bandwagon.asia/articles/social-music-platform-cymbal-shutting-down). 당시 별칭은 "Instagram for music" — [Mixmag 2026](https://mixmag.net/read/new-music-app-cymbal-tipped-as-the-instagram-for-music-tech)
- 후기 형태: Hypebot(2018)은 Spotify·Apple Music·Deezer·SoundCloud 어디서든 재생되는 플랫폼 불문 플레이리스트 공유 앱으로 묘사했다 — [Hypebot](https://www.hypebot.com/playlist-sharing-startup-cymbal-joins-deadpool)
- 자금과 팀: 2015년 설립, 시드 25만 달러 — [Hypebot](https://www.hypebot.com/playlist-sharing-startup-cymbal-joins-deadpool). 고별 노트 서명은 Gabe, Amadou, Charlie, Mario, Sam이었다. Ron Rofé(Vaizra), Peter Boyce II(Rough Draft Ventures·General Catalyst) 등에게 감사를 표했다 — [Bandwagon](https://bandwagon.asia/articles/social-music-platform-cymbal-shutting-down)
- 피크: 고별 노트는 "the hundreds of thousands"가 기회를 줬다고만 적었고 정확한 수치는 없다 — [Bandwagon](https://bandwagon.asia/articles/social-music-platform-cymbal-shutting-down)
- 종료: "Cymbal is shutting down on June 1st, 2018." Spotify·SoundCloud로 라이브러리를 내보낼 수 있게 했다 — [Bandwagon](https://bandwagon.asia/articles/social-music-platform-cymbal-shutting-down)
- 【공식】명시적 사유는 없다. 다른 스타트업에 조언하며 "music technology is a tough nut to crack", "the licensing issues are enough to intimidate developers into giving up"이라고 했다 — [Hypebot](https://www.hypebot.com/playlist-sharing-startup-cymbal-joins-deadpool)
- 【분석】Hypebot: 출시 때부터 수익화 방법이 불분명했다. Spotify의 규모(1.52억 계정) 앞에서 플랫폼 중립만으로는 부족했고, 팬들은 쓰던 스트리머 안에서 플레이리스트를 만든다 — [Hypebot](https://www.hypebot.com/playlist-sharing-startup-cymbal-joins-deadpool)
- 【공식·사후 회고】Charlie Kaplan(이름이 노트 서명자 'Charlie'와 일치)의 진단: 파편화는 "Imagine if you couldn't text a friend because she decided to sign up for a cellular plan through Verizon and you chose AT&T"와 같다. 처방은 "create a great single player mode in order to earn your multi player or social mode." — [MediaTech Ventures(Jack Diserens, 2020-04-09)](https://mediatech.ventures/the-social-music-tech-revolution/)
- 후속: 공동창업자 Gabe Jacobs가 2026년 5월 Corus를 출시했다. 음악·영화를 사람끼리 추천하는 서비스로 Instagram식 피드와 그리드 프로필을 쓰고 "알고리즘·AI 생성 콘텐츠·광고 없음"을 내세운다. 선택형 구독은 월 2.99달러다. Jacobs는 빅테크가 음악 발견을 알고리즘 기반의 혼자 하는 경험으로 바꿨다고 비판했다. 사용자 수치는 공개되지 않았다 — [Mixmag(Megan Townsend, 2026-06-19)](https://mixmag.net/read/new-music-app-cymbal-tipped-as-the-instagram-for-music-tech)

**Blip.fm (2008–?) — 원조 "Twitter for music"**

- TechCrunch가 Fuzz.com에서 분사한 "Twitter for music"으로 소개했다. Fuzz.com은 2009-02-13 문을 닫았지만 Blip.fm은 계속 운영됐다 — [TechCrunch](https://techcrunch.com/?p=38711)
- 곡을 공유하는 마이크로메시징 서비스로 얼리어답터에게 히트했다. 모회사는 2008년 10월 인력 2/3를 줄여 4명만 남았고, Om Malik은 상황을 "critical"이라 평했다 — [Om Malik/GigaOM(2009-02-11)](https://om.co/gigaom/blipfm-facing-a-permanent-blip/)
- AlternativeTo는 서비스가 중단됐다고 표시하지만 날짜와 사유는 없다 — [AlternativeTo](https://alternativeto.net/software/blipfm/about/)

**Twitter #Music (2013–2014)**

- 2012년 We Are Hunted를 인수해 만들었다. 트윗 활동에서 추천을 뽑고 Spotify·Rdio로 재생했으며, 2014-03-21 앱스토어에서 내리고 4월 18일 종료했다(출시 약 1년 만) — [CMU](https://archive.completemusicupdate.com/article/twitter-to-shut-its-standalone-music-app/); [Engadget](https://www.engadget.com/2014/03/21/twitter-music-shutdown/)
- 피크·지표: 출시 3개월 뒤 iOS 음악앱 133위였다 — [Hypebot(2013-07-30)](https://hypebot.com/hypebot/2013/07/lessons-learned-from-recent-music-app-fails.html)
- 【분석】CMU: "never really caught on". 별도 앱이라 본 Twitter 생태계 밖에 있었던 점이 발목을 잡았고, 책임자 Kevin Thau는 출시 한 달 만에 회사를 떠났다 — [CMU](https://archive.completemusicupdate.com/article/twitter-to-shut-its-standalone-music-app/)
- 【분석】Hypebot(2013): 풀트랙 라이선스가 없어 비구독자는 30초 미리듣기 뒤 다른 곳으로 가야 했다. 헤비 트위터 사용자가 아니면 쓸 이유가 없었다. 팔로우한 아티스트 기반 발견은 새 음악 노출을 보장하지 않았고, 구조가 인디를 배제하는 "popularity contest"였다 — [Hypebot](https://hypebot.com/hypebot/2013/07/lessons-learned-from-recent-music-app-fails.html)
- 【공식】Twitter 음악 계정: "We continue to experiment with new ways to bring you great content based on the music activity we see every day on Twitter." — [CMU](https://archive.completemusicupdate.com/article/twitter-to-shut-its-standalone-music-app/)

**Apple iTunes Ping (2010–2012)**

- 2010-09-01 iTunes 10과 함께 나왔고, Jobs는 "a social network for music"이라 불렀다 — [Cult of Mac](https://www.cultofmac.com/apple-history/apple-ping-itunes-10)
- 피크: Apple 보도자료 기준 48시간이 안 돼 100만 명 이상이 가입했다 — [MacRumors](https://www.macrumors.com/2020/09/01/itunes-ping-launched-10-years-ago-today/)
- 【공식】Tim Cook(D10, 2012): "We tried Ping, and I think the customer voted and said 'This isn't something that I want to put a lot of energy into.'" — [MacRumors](https://www.macrumors.com/2020/09/01/itunes-ping-launched-10-years-ago-today/)
- 【분석】Cult of Mac: Facebook 연동 협상이 결렬됐는데 경위는 끝내 설명되지 않았다. 쓰기 번거로웠고, 진짜 소셜 네트워크라기보다 음악을 파는 수단처럼 느껴졌다 — [Cult of Mac](https://www.cultofmac.com/apple-history/apple-ping-itunes-10)
- 종료: 2012-09-30 — [MacRumors](https://www.macrumors.com/2012/10/01/apples-ping-social-network-officially-closes/)

**Apple Music Connect (2015–2018/19)**

- 아티스트가 팬에게 게시물을 올리는 기능이다. 2018-12-13 게시가 중단됐고 기존 콘텐츠는 2019-05-24까지 검색됐다(5-29라는 보도도 있음). Apple은 이를 발견 경험의 "streamlining"이라고 설명했다 — [iPhone in Canada](https://www.iphoneincanada.ca/2018/12/13/apple-music-connect-feature-shutting-down/); [MacRumors](https://www.macrumors.com/2018/12/13/apple-music-connect-shutting-down)
- 【분석】Engadget: 대부분의 아티스트가 활동하지 않았고, Apple은 이미 2016년에 전용 Connect 탭을 없애는 등 수년간 이 기능을 뒤로 밀어 왔다 — [Engadget](https://www.engadget.com/2018-12-13-apple-music-connect-removes-artist-posts.html)

**Spotify Inbox 제거(2017) → Spotify Messages(2025)**

- 【분석】Spotify의 DM은 저참여로 2017년에 퇴역했다. 타이밍도 나빴다. 대중화하기엔 너무 일렀고, 그 뒤엔 Facebook·Instagram·Snapchat이 자리 잡아 너무 늦었다. "the major (at least Western) music streaming services have never fully committed to implementing social features" — [MIDiA(Tatiana Cirisano, 2025-02-27)](https://www.midiaresearch.com/blog/social-came-for-streamings-lunch-now-its-time-for-streaming-to-bite-back)
- 2017년 커뮤니티에서는 사용자들이 사전 경고나 설명 없이 제거됐다고 반발했다 — [Spotify Community](https://community.spotify.com/t5/Closed-Ideas/Social-Bring-back-Inbox-Messaging-with-Notifications/idi-p/1591025)
- 재출시: 2025-08-26 Messages를 출시했다. 일부 시장의 16세 이상 모바일 사용자가 대상인 1:1 채팅으로 음악·팟캐스트·오디오북을 공유한다. Spotify MAU는 2018년 말 2.07억에서 2025년 2분기 6.96억으로 늘었다. 【분석】Verdict는 공유는 쉬워지겠지만 소수 하드코어 팬 밖에서는 깊은 대화가 드물 것으로 봤고, 일각에서는 "feature creep"이라는 비판도 나왔다 — [Verdict(2025-08-29)](https://www.verdict.co.uk/spotify-messages-gain-traction/); [CMU "Brace yourself, Spotify is convinced people want it to be a messaging app"](https://completemusicupdate.com/brace-yourself-spotify-is-convinced-people-want-it-to-be-a-messaging-app/)

#### 1-B. 실시간 공동청취·라이브 오디오 계열

**Turntable.fm (2011–2013, 2021 부활 시도)**

- 2011년 5월 공개 출시, 6월 말 활성 사용자 약 14만 명. 2011년 9월 60만 명이라는 수치는 Wikipedia에 "citation needed"로 표시돼 있다. 2011년 7월 Fred Wilson(USV)이 주도한 700만 달러 라운드를 기업가치 3,500만 달러에 유치했다 — [Wikipedia](https://en.wikipedia.org/wiki/Turntable.fm)
- 라이선스: 처음에는 DMCA의 비대화형 라디오 조항에 기대 미국에서만 서비스했다("legally dubious gray area"). 2011년 7월 ASCAP과, 2012-03-13 메이저 4사와 계약했다 — [Wikipedia](https://en.wikipedia.org/wiki/Turntable.fm)
- 쇠퇴: 2013년 9월 Comscore 기준 순방문 약 8.9만. 2년간 약 100만 개 룸에서 4억 곡 이상이 재생됐다 — [TechCrunch(2013-11-22)](https://techcrunch.com/2013/11/22/turntable-fm-shutting-down-so-company-can-focus-on-turntable-live-events-platform)
- 비용 절감 시도: 2013년 9월 업로드를 없애고 SoundCloud 스트림으로 바꿔 월 약 2만 달러를 아꼈는데, 대부분 메이저 레이블 라이선스 비용이었다. 총 약 700만 달러를 소진했다 — [DMN(2013-11-24)](https://www.digitalmusicnews.com/2013/11/24/finallyshuttingturntabledown/)
- 【공식】"the cost of running a music service has been too expensive" / "If we also want to give Turntable Live a real shot, we need to fully focus on it." — [TechCrunch](https://techcrunch.com/2013/11/22/turntable-fm-shutting-down-so-company-can-focus-on-turntable-live-events-platform). 2013-11-22 발표, 12-02 종료, Turntable Live 마지막 공연은 12-13이었다 — [Wikipedia](https://en.wikipedia.org/wiki/Turntable.fm)
- 【분석】"Despite scaling to millions of users, Turntable never found effective ways to monetize these users." 라이선스와 레이블 관계도 원인으로 꼽혔다 — [MediaTech Ventures](https://mediatech.ventures/the-social-music-tech-revolution/). '수백만 사용자' 표현은 Wikipedia 수치와 맞지 않는다.
- 2021년 부활: Billy Chasen이 팬데믹 중에 비밀번호로 보호된 형태로 사이트를 되살렸다 — [Slashdot/The Verge(2021-03-04)](https://entertainment.slashdot.org/story/21/03/04/2226217/turntablefm-is-back-from-the-dead). 이어 750만 달러를 조달했고, 초기 팀원 Joseph Perla가 경쟁 서비스 tt.fm/turntable.org를 구독제로 내놨다 — [Hypebot(2021-06)](https://www.hypebot.com/dueling-turntables-rival-tt-fm-goes-live-as-turntable-fm-raises-7-5m); [TechCrunch(2021-06-08)](https://techcrunch.com/2021/06/08/turntable-fm-competitor-tt-fm-launches-beta-app-for-ios-and-android). 2021년 9월에도 Chasen의 Turntable 2.0에는 작동하는 앱이나 진지한 계획이 없었다 — [DMN(2021-09-07)](https://www.digitalmusicnews.com/2021/09/07/tt-fm-new-turntable-reemerges/). 2024년 10월 기준 Chasen 쪽은 Deepcut.fm, Perla 쪽은 Turntable Labs/Hangout으로 갈라졌다. Hangout은 2024-11-04 기준 Discord 서버와 대기자 명단만 운영했다 — [Wikipedia](https://en.wikipedia.org/wiki/Turntable.fm)

**Soundrop과 Spotify App Finder (2014)**

- Spotify는 2014년 3월 App Finder의 신규 앱 접수를 중단하고 개발자를 Web API·모바일 SDK로 돌렸다 — [TechCrunch(2014-03-24)](https://techcrunch.com/2014/03/24/spotify-shutters-app-submissions). 청취룸 앱 Soundrop은 이 결정 때문에 2014-12-31 종료를 발표했다 — [DMN](https://www.digitalmusicnews.com/2014/11/12/soundrop-shutting/); [Engadget](https://www.engadget.com/2014/11/14/soundrop-spotify-app-platform-death/)

**Spotify Greenroom → Spotify Live (2021–2023)**

- 2021년 Betty Labs(Locker Room)를 6,000만 달러 이상에 인수해 Greenroom(2021.6)을 냈고 Spotify Live로 이름을 바꿨다. 종료 전 다운로드는 약 67만이었다 — [MIDiA(Annie Langston, 2023-04-12)](https://www.midiaresearch.com/blog/as-spotify-joins-the-live-audio-shutdown-can-amp-and-spaces-get-it-right)
- 【공식】2023-04-30 종료, "after a period of experimentation and learnings around how Spotify users interact with live audio" — [MBW](https://www.musicbusinessworldwide.com/spotify-shuts-down-spotify-live-after-two-years-of-experimentation); [DMN](https://www.digitalmusicnews.com/2023/04/03/spotify-live-shuts-down/)
- 【분석】"live audio has always had more value as a product feature rather than a standalone product", "Throwing people in a virtual room and hoping a conversation materialises worked during lockdown". 같은 시기 Facebook의 라이브 오디오 룸(2022)과 Reddit Talk(2023.3)도 문을 닫았다 — [MIDiA](https://www.midiaresearch.com/blog/as-spotify-joins-the-live-audio-shutdown-can-amp-and-spaces-get-it-right)

**Amazon Amp (2022–2023)**

- 2022년 3월 출시. 사용자가 수백만 곡의 라이선스 카탈로그로 라이브 쇼를 진행하고 청취자 콜인을 받는 구조였다. 2022년 해고 때 Amp 인력 절반 가까이가 줄었고, 2023-10-31 종료했다 — [TechCrunch(2023-10-05)](https://techcrunch.com/2023/10/05/amazon-shutters-its-live-radio-app-amp/)
- 【공식】Amazon은 미래에 어떤 투자를 할지 몇 달간 검토한 끝에 내린 결정이며, 라이브 음악 커뮤니티에서 배운 것을 Amazon Music의 팬 경험에 반영하겠다고 밝혔다 — [TechCrunch](https://techcrunch.com/2023/10/05/amazon-shutters-its-live-radio-app-amp/); [CNBC](https://www.cnbc.com/2023/10/04/amazon-shuts-down-amp-live-audio-service.html)
- 관련 사례: Gimme Radio는 필요한 자금을 구하지 못해 2023년 4월 말 종료했다 — [Blabbermouth](https://blabbermouth.net/news/gimme-radio-to-shut-down-after-being-unable-to-secure-necessary-financing)

**Stereo (2020경 추정 –, 종료 미확인)**

- MagicLab(Bumble 관련) 지분을 매각한 Andrey Andreev가 라디오 토크쇼에서 착안해 만든 라이브 토크쇼 앱이다 — [FA Mag(Bloomberg)](https://fa-mag.com/news/billionaire-bumble-seller-plans-global-launch-of-talk-show-app-58873.html). App Store 등록은 아직 유지되고 있다("Stereo is the social app where people speak up – literally.") — [App Store](https://apps.apple.com/fi/app/stereo/id1501818976). 음악 특화 서비스가 아니고 종료 근거도 찾지 못했다.

#### 1-C. 사람 큐레이션·디스커버리 계열

**8tracks (2008–2019)**

- 2008-08-08 출시 — [mxdwn](https://music.mxdwn.com/2019/12/28/news/8tracks-streaming-platform-announces-its-shutting-down/). 초기에는 플레이리스트가 8곡 이상이어야 했고 사용자를 'DJ'라 불렀다. 전체 트랙리스트를 보여주지 않았고 온디맨드 재생도 안 됐다. 약 75만 명이 플레이리스트 350만 개를 만들었고, 2011년 Time의 Top 50 웹사이트에 들었다 — [Inverse/Input(2020-02)](https://www.inverse.com/input/features/remembering-8tracks-the-once-thrilling-streaming-service-that-spotify-killed-off)
- 【공식】Porter: 트래픽은 2014년 초부터 줄었다. 배경으로 2013년 Spotify를 꼽았고, 사용자들은 트랙리스트 비공개·온디맨드 불가 같은 제약을 싫어했다. 니치한 매력이 주류 성장 모델과 맞지 않았다며 "It doesn't translate to great business sense."라고 했다. 2015년 매각, 2016년 크라우드펀딩, 2017년 비공식 매각을 시도했다 — [Inverse](https://www.inverse.com/input/features/remembering-8tracks-the-once-thrilling-streaming-service-that-spotify-killed-off)
- 【공식】"To state it simply, we're shutting down because we can't generate enough revenue, at our current scale, to cover royalties that continue to increase." — 보도가 인용한 Porter 블로그 문장 — [Dancing Astronaut](https://dancingastronaut.com/2019/12/streaming-platform-8tracks-shutters-after-11-years/); [Hypebot](https://www.hypebot.com/hypebot/2019/12/8tracks-to-shut-down-12-31.html). "As technology has advanced, the atomic unit of consumption has shifted." YouTube·게임·앱과의 주의력 경쟁도 언급했다 — [mxdwn](https://music.mxdwn.com/2019/12/28/news/8tracks-streaming-platform-announces-its-shutting-down/)
- 【보도】Billboard는 인수가 무산된 뒤 문을 닫았다고 보도했다 — [Billboard](https://www.billboard.com/?p=8547162)

**Songza (? – 2016)**

- 2014-07-01 Google이 인수했다. 가격은 비공개로, 1,500만~3,900만 달러 이상 추정(NYT 보도 인용)이 있다. 2016-01-31 종료하고 Google Play Music에 통합했으며, Play Music도 2020-12-01 종료됐다 — [Global News](https://globalnews.ca/news/2376343/google-to-retire-music-streaming-service-songza-as-of-jan-31/); [Rain News](https://rainnews.com/google-acquires-songza/); [Wikipedia](https://en.wikipedia.com/wiki/Songza)
- 【분석】Vice는 "Songza is shutting down, but its best features are already in Google Play Music"라고 정리했다 — [Vice](https://www.vice.com/en/article/yp3gpb/songza-is-shutting-down-but-its-best-features-are-already-in-google-play-music)

**exfm (~2010–2014)**

- 4년간 275만 달러를 투자받은 소셜 음악 발견 플랫폼이다. 2013년 12월 종료를 발표했고 내보내기 도구를 제공했다 — [Hypebot](https://www.hypebot.com/275-million-later-music-discovery-platform-exfm-to-shut-down); [TNW(2013-12-20)](https://thenextweb.com/news/exfm-reveals-shutting-january-15-creates-export-tool-chrome-extension-let-users-keep-data). 2014년 1월 철회했다가 — [Hypebot](https://www.hypebot.com/exfm-reverses-course-will-not-shut-down) — 2014-05-19 웹·앱·확장·API를 모두 종료했다 — [BetaNews](https://betanews.com/2014/05/17/ex-fm-set-to-shutter-its-doors-may-19th). 같은 해 Rhapsody가 인수했다 — [Hypebot](https://www.hypebot.com/rhapsody-acquires-music-discovery-platform-exfm/)
- 【공식】창업자들은 기술적 문제의 원인으로 음악 업계의 소송적 성격을 들었다(검색 요약 기준) — [Hypebot](https://www.hypebot.com/275-million-later-music-discovery-platform-exfm-to-shut-down). 【분석】Rain News 제목: "Exfm succumbs to a crowded listening market" — [Rain News](https://rainnews.com/exfm-succumbs-to-a-crowded-listening-market/)

**Shuffler.fm**

- 확인된 것은 소셜 음악 서비스 Twones가 문을 닫고 그 팀·기술이 shuffler.fm에 합류했다는 사실뿐이다 — [All About Jazz](https://www.allaboutjazz.com/news/social-music-service-twones-shuts-down). Shuffler.fm 자체의 종료 정보는 찾지 못했다.

**Heardle (2022–2023)**

- 2022년 7월 Spotify가 인수하고 2023-05-05 종료했다. 【공식】다른 음악 발견 기능에 집중하겠다는 이유였다. 【분석】Similarweb 기준 방문은 2023년 1월 1,000만, 2월 730만, 3월 600만으로 줄었다. 독립 웹사이트로만 존재했고 Spotify 앱에 통합되지 않았다. 2023년 1월 Spotify는 500여 명(6%)을 해고했다 — [TechCrunch(2023-04-14)](https://techcrunch.com/2023/04/14/spotify-is-shutting-down-heardle-the-wordle-like-music-guessing-game-it-bought-last-year); [BGR](https://bgr.com/tech/spotify-is-shutting-down-music-guessing-game-heardle-a-year-after-acquiring-it/)

**Discz (출범 시기·현재 상태 미확인)**

- USC 수업 과제에서 출발해 "Spotify meets Tinder"식으로 만든 앱이다. 청취 이력을 바탕으로 곡을 추천하고 TikTok 길이의 스니펫을 들려준다. 좋아요 대신 "plugs"를 주는데, 내가 소개한 곡을 친구가 저장할 때마다 하나씩 받는다. 출시 직후 서버가 다운됐고, 이후 미국 앱스토어 음악 Top 10에 올랐다. 공동창업자 겸 CTO Michelle Yin은 Facebook 시니어 엔지니어 출신이다 — [Rolling Stone](https://www.rollingstone.com/music/music-features/discz-tiktok-recommendation-app-1324785/). 기사 원문은 접근이 차단돼 게재일과 현재 상태를 확인하지 못했다.

#### 1-D. 스트리밍·라이선스·플랫폼 의존 계열 (간략)

- **Rdio(2010.8–2015)**: 2015년 11월 파산보호를 신청했다. 부채 약 2.2억 달러는 대부분 Pulser Media에 진 것이었고, 월 약 200만 달러 손실을 냈다. Pandora가 핵심 자산을 7,500만 달러에 샀다. 보도된 구독 매출은 월 약 150만 달러, 운영비는 약 400만 달러(THR 인용, 2차 출처)였다. 전 직원들은 차별화 부족을 꼽았고 "the classic startup mistake"라는 평이 나왔다 — [VentureBeat](https://venturebeat.com/ai/rdio-struggled-to-compete-with-pandora-and-spotify-then-apple-google-and-microsoft-showed-up); [SmartCompany](https://www.smartcompany.com.au/startupsmart/the-classic-startup-mistake-what-went-wrong-for-rdio/)
- **Grooveshark(~2007–2015.4.30, Rolling Stone 기준 8년 운영)**: Universal·Sony·Warner와 합의해 즉시 폐쇄했고 사이트·IP 소유권을 레이블에 넘겼다. 【공식】사과문에서 "made very serious mistakes"라고 인정했다 — [Rolling Stone](https://www.rollingstone.com/music/music-news/grooveshark-shuts-down-after-eight-years-74101/); [Law360](https://law360.com/articles/650463); [B&T](https://www.bandt.com.au/music-streaming-site-grooveshark-closes-after-serious-mistakes/)
- **imeem(–2009.12)**: 2009-12-08 MySpace가 인수를 마무리했다(100만 달러 미만 보도). TechCrunch는 라이선스가 만료되고 자금이 바닥나 어차피 문을 닫았을 것이라고 봤다. 인수 직후 앱은 MySpace가 자기 라이선스를 확장할 때까지 작동하지 않았다 — [TechCrunch](https://techcrunch.com/2010/01/15/imeem-playlists-myspace); [Pollstar](https://news.pollstar.com/2009/12/09/myspace-music-scoops-up-imeem/)
- **iLike(? –2012)**: 2009년 8월 MySpace가 약 2,000만 달러에 인수했다는 보도가 있다. 2012-02-07 사이트를 닫고 MySpace Music으로 리다이렉트했다. GigaOM은 매출이 끝내 맞지 않았다고 평가했다(검색 요약 기준) — [GeekWire](https://www.geekwire.com/2012/online-music-service-ilike-bites-dust/); [SlashGear](https://www.slashgear.com/ilike-social-music-service-is-officially-dead-07212488)
- **TikTok Music(2023–2024.11.28)**: 2023년 출시해 5개 시장에서 운영했다 — [Rightstech](https://rightstech.com/2024/09/tiktok-music-to-shut-down-in-november-after-launching-in-2023/); [Loudest](https://loudest.in/news/tiktok-to-close-music-streaming-service-across-five-markets-by-november-17591.html). 2024-09-24 종료를 발표했다(플레이리스트 내보내기는 10-28까지). 【공식】"Add To Music App" 기능에 집중하고 스트리밍 서비스와 경쟁하는 대신 협력하겠다고 했다. 【분석】업계 일각은 2024년 초 UMG가 TikTok에서 카탈로그 전체를 뺀 분쟁과 기대 이하의 전환율을 의심했다. Resso의 인도 금지도 언급됐다 — [Hypebot](https://www.hypebot.com/tiktok-music-shuts-down/); [Tubefilter](https://www.tubefilter.com/2024/09/24/tiktok-music-standalone-service-shutting-down-worldwide/); [MBW](https://www.musicbusinessworldwide.com/tiktok-to-shutter-music-subscription-service-tiktok-music-in-november); [TechCrunch](https://techcrunch.com/2024/09/24/bytedance-is-shutting-down-tiktok-music-globally)
- **Musi(YouTube 래퍼, 2024 퇴출)**: 2024-07-29 "YouTube Legal"의 민원을 근거로 2024-09-24 App Store에서 삭제됐다. Apple은 NMPA·IFPI의 민원도 있었다고 주장했다 — [MBW](https://www.musicbusinessworldwide.com/free-streaming-app-musi-sues-apple-over-removal-from-app-store/); [DMN](https://www.digitalmusicnews.com/2024/10/07/music-apple-app-store-lawsuit/). 레이블들은 Apple에 여섯 차례 퇴출을 요구했다 — [CMU(2024-11-19)](https://completemusicupdate.com/labels-told-apple-six-times-to-kick-musi-out-of-app-store-new-legal-filing-reveals/). 2026년 3월 Apple이 소송에서 이겼다 — [CMU(2026-03-18)](https://completemusicupdate.com/apple-wins-legal-battle-with-musi-after-judge-rules-music-apps-lawsuit-was-not-the-paradigm-of-candor/)

#### 1-E. 기타 (간략)

- **Jukely**: 2012년 Andrew Cornett와 Bora Celik이 창업했다. 2014년 말 뉴욕에서 월 25달러 무제한 공연 구독(Plus 45달러)을 시작했고, 2015년 미국 15개 도시와 런던·토론토로 확장했다 — [TechCrunch(2014-11-14)](https://techcrunch.com/2014/11/14/jukely-offers-unlimited-concerts-for-25-a-month); [Fortune](https://fortune.com/2014/10/08/jukely-unlimited/); [TechCrunch(2015)](https://techcrunch.com/2015/02/06/jukely-launches-in-san-francisco/amp/). Celik은 "for now we're gonna slow down on further cities"라고 말했다(게재일 미확인) — [Billboard](https://www.billboard.com/?p=6707256). 종료 기록은 찾지 못했다.
- **Kakao Music(한국, 간략)**: 2013년 출시. 카카오가 2016년 멜론을 인수한 뒤 큰 주목을 받지 못했다. 2020년 1월 "옛 카톡 프사가 뜬다"는 소문에 사용자가 몰려 접속 장애가 났다 — [스포츠경향(2020-01-21)](https://sports.khan.co.kr/article/202001212253003). App Store 등록은 유지되고 있다 — [App Store](https://apps.apple.com/KR/app/id696690152). 서비스 종료 공지는 찾지 못했다.

### Inferences

- 【추론】종료 사유를 유형별로 나누면 다음과 같다(복수 해당). (a) 라이선스·로열티 비용: Turntable, 8tracks, Grooveshark, imeem, exfm, Cymbal(조언 형태), TikTok Music(추정). (b) 외부 플랫폼·API 의존: This Is My Jam, Soundrop, Musi, Cymbal, Twitter #Music. (c) 참여 부족: Ping, Apple Music Connect, Spotify Inbox, Twitter #Music, Spotify Live, Heardle. (d) 인컴번트 흡수·전략 변경: Songza, Heardle, TikTok Music, Amp, Spotify Live. (e) 자금·경쟁: Rdio, iLike, 8tracks. 단일 원인으로 끝난 사례는 거의 없고, '재생권이 없는 상태로 시작했고 사용자 행동은 저빈도'라는 조건이 겹친 경우가 대부분이다.
- 【추론】배포력이 문제를 풀어주지 못했다. Apple(Ping·Connect 두 번), Twitter, Spotify(Inbox·Live·Heardle 세 번), Amazon, ByteDance가 모두 소셜 음악 단독 제품을 접었다. 'VIBR가 작아서 실패한다'기보다 '이 형태 자체가 지속 사용을 만들기 어렵다'는 쪽에 무게가 실린다.
- 【추론】확인된 피크 규모가 작다. This Is My Jam 약 20만, Cymbal '수십만', Turntable 활성 약 14만, 8tracks 플레이리스트 제작자 약 75만에 그쳤다. 인컴번트(Spotify MAU 6.96억)와 수천 배 차이가 난다. 니치로는 성립했지만 라이선스·운영비를 감당할 규모에는 닿지 못했다.
- 【추론】This Is My Jam은 4년간 사용자당 평균 jam 약 10개(200만÷20만), 연 2~3개꼴이었다. 이 서비스의 철학("slow, considerate sharing")과 맞는 수치이면서, 피드 기반 서비스가 요구하는 빈도에는 크게 못 미친다.
- 【추론】시기별로 실패 양상이 달랐다. 2008–2015년은 라이선스와 API 변경, 2021–2024년은 팬데믹 이후 라이브 오디오 수요 증발과 빅테크 비용 절감이 주된 원인이었다. 2024–2026년에는 플랫폼 API 축소(Spotify)와 인컴번트의 재번들링(Spotify Messages)이 진행 중이다.

### Gaps

- Cymbal의 사용자 수치와 정확한 출시일을 확인하지 못했다. Apple Music Connect의 출시 연도(2015)와 Songza·iLike·Discz의 출범 시기도 1차 확인하지 못했다. 과제가 말한 "~2021–2023 Twitter for music" Cymbal은 확인되지 않았고, 다른 서비스(Blip.fm이나 다른 Cymbal 재출시 등)와 혼동했을 가능성이 있다. Charlie Kaplan이 CEO였다는 정보는 검색 요약에만 있고 1차 확인은 하지 못했다.
- Stereo, Discz, Jukely, Blip.fm, Shuffler.fm의 종료 시점과 사유를 찾지 못했다. 검색 한도 소진으로 추가 조회가 불가능했다.
- Turntable 부활(Deepcut.fm, Hangout)의 2025–2026년 상태, 2021년 750만 달러 라운드의 a16z 주도 여부, 8tracks의 '새 소유주에 의한 부활' 보도를 확인하지 못했다.
- Grooveshark 합의금(5,000만 달러 보도), Rdio 구독자 수, Ping과 Twitter #Music의 실사용 지표에 대한 1차 자료가 없다.
- This Is My Jam 창업자 고별문 원문은 직접 열람하지 못했다. 인용은 TechCrunch, Hypebot, Radio Survivor를 거친 것이다.
- Corus(2026)의 트랙션과 재생·라이선스 처리 방식은 공개되지 않았다.
- 과제 목록 외 후보인 Soundtracking, Soundwave(Spotify 인수설), Stationhead 등은 조사하지 못했다.

## 2. VIBR와 가장 가까운 사례(곡 추천 포스트 피드, '한 곡씩' 공유, 음악 트위터)와 각각 정확히 무엇이 잘못됐나

### Takeaway

VIBR(곡+커버 이미지+텍스트 포스트, 팔로우·좋아요·댓글, 팔로잉/최신/트렌딩 피드, YouTube IFrame과 iTunes 30초 미리듣기 재생, '알고리즘이 아닌 사람')는 사실상 This Is My Jam(한 곡 포스트+외부 임베드 재생+웹 우선)과 Cymbal("Instagram for music", 팔로워 피드=친구 곡 플레이리스트)을 합친 형태다. 두 서비스 모두 재생 통제 불능, 파편화, 저빈도 참여, 수익모델 부재로 끝났다. 이 컨셉 그대로는 '알려진 함정'에 해당한다. 그리고 2026년 5월 Cymbal 공동창업자가 같은 포지셔닝("no algorithm")으로 Corus를 다시 내놨다.

### Cited Findings

- **This Is My Jam(가장 가까운 선례)**
  - 무엇이 같은가: 한 곡 단위 공유이고, YouTube·SoundCloud 등 외부 임베드로 재생하며, 웹 기반이다 — [TechCrunch](https://techcrunch.com/?p=1193462)
  - 정확히 무엇이 잘못됐나: ① 외부 API 변경을 따라가느라 개발 시간 100%를 썼다 — [Radio Survivor](https://radiosurvivor.com/2015/08/this-is-my-jam-and-the-hazards-of-indie-music-curation). ② 라이선스·지역 제한으로 재생이 안 되는 곡이 늘었다("sorry, this cannot be played here"). ③ 청취가 웹에서 앱으로 옮겨갔다. ④ 모바일 규칙이 엄격해 전면 재구축이 필요했다. ⑤ 2012년 이후 모바일 '한 곡 공유' 앱이 열 개 가까이 실패했다 — [Hypebot](https://www.hypebot.com/this-is-my-jam-to-close-playlist-service/)
- **Cymbal(포스트 피드형의 직계 선례)**
  - 무엇이 같은가: 곡을 프로필에 포스팅하고, 팔로워 뉴스피드에 노출되며, 원본 소스(Spotify·SoundCloud)에서 재생된다 — [Bandwagon](https://bandwagon.asia/articles/social-music-platform-cymbal-shutting-down)
  - 정확히 무엇이 잘못됐나: 처음부터 수익화가 불명확했고, Spotify 규모 앞에서 플랫폼 중립 전략이 통하지 않았으며, 사용자는 자기 스트리머 안에서 플레이리스트를 만들었다(【분석】[Hypebot](https://www.hypebot.com/playlist-sharing-startup-cymbal-joins-deadpool)). 라이선스는 "tough nut to crack"이었다(【공식】같은 출처). 회고에 따르면 스트리밍 파편화 때문에 친구 간 공유 자체가 깨지고, 싱글플레이 모드 없이 소셜부터 시작했다 — [MediaTech Ventures](https://mediatech.ventures/the-social-music-tech-revolution/)
- **Blip.fm / Twitter #Music('음악 트위터')**
  - Blip.fm: 곡을 공유하는 마이크로메시징이었다. 모회사의 인력·자금 위기를 겪었고 종료 사유는 미상이다 — [Om Malik](https://om.co/gigaom/blipfm-facing-a-permanent-blip/)
  - Twitter #Music: 출시 3개월 뒤 iOS 음악앱 133위였다. 30초 미리듣기만으로는 붙잡아 둘 수 없었고("must go elsewhere"), 헤비 트위터 사용자가 아니면 쓸 이유가 없었다 — [Hypebot](https://hypebot.com/hypebot/2013/07/lessons-learned-from-recent-music-app-fails.html). 본 앱 밖의 별도 앱이라는 점도 문제였다 — [CMU](https://archive.completemusicupdate.com/article/twitter-to-shut-its-standalone-music-app/)
- **Apple Ping / Apple Music Connect(팔로우 기반 음악 그래프)**
  - Ping: 48시간에 100만 가입을 받고도 2년 만에 종료했다. Cook은 "the customer voted"라고 했다 — [MacRumors](https://www.macrumors.com/2020/09/01/itunes-ping-launched-10-years-ago-today/). 번거롭고 판매 도구처럼 느껴졌으며 Facebook 연동이 없었다 — [Cult of Mac](https://www.cultofmac.com/apple-history/apple-ping-itunes-10)
  - Connect: 아티스트가 활동하지 않아 피드가 비었다 — [Engadget](https://www.engadget.com/2018-12-13-apple-music-connect-removes-artist-posts.html)
- **Spotify Inbox → Messages(친구에게 곡 보내기)**
  - 2017년 저참여로 제거됐다가 2025-08-26 MAU 6.96억을 등에 업고 재출시됐다 — [Verdict](https://www.verdict.co.uk/spotify-messages-gain-traction/); [MIDiA](https://www.midiaresearch.com/blog/social-came-for-streamings-lunch-now-its-time-for-streaming-to-bite-back)
- **Discz(추천 성과 보상)**
  - 내가 소개한 곡을 친구가 저장하면 "plugs"를 받는 구조로, 사람 추천의 '성과'를 보상한다 — [Rolling Stone](https://www.rollingstone.com/music/music-features/discz-tiktok-recommendation-app-1324785/)
- **Corus(2026, 동일 컨셉 재도전)**
  - "no algorithm, no AI-generated content, no advertising"을 내건 사람 대 사람 추천 피드다. 선택형 월 2.99달러 구독이 있다 — [Mixmag](https://mixmag.net/read/new-music-app-cymbal-tipped-as-the-instagram-for-music-tech)

### Inferences

- 【추론】VIBR 요소별 선례 매핑:
  - 곡+이미지+텍스트 포스트: Cymbal("Instagram for music"), This Is My Jam(한 곡+짧은 코멘트) → 둘 다 종료.
  - 팔로우·좋아요·댓글 그래프: Ping, Cymbal, Twitter #Music → 참여 부족과 콜드스타트.
  - YouTube IFrame·iTunes 30초 재생: This Is My Jam의 임베드 재생 불가 문제, Twitter #Music의 30초 미리듣기 이탈 문제와 같은 구조다. 정책 리스크는 3장 참고.
  - 웹 우선(Next.js/PWA): This Is My Jam이 '청취는 앱으로 갔다'며 접은 지점과 같다.
  - '알고리즘이 아닌 사람': 2011–2018년 This Is My Jam·Cymbal의 정서와 같고, 2026년 Corus가 같은 슬로건을 쓰고 있다. 차별화 포인트로는 이미 소진됐다.
- 【추론】이 함정은 '벤처 규모로 키우는 소셜 네트워크'로 볼 때 치명적이다. 저비용 니치 커뮤니티나 개인 프로젝트로 볼 때는 덜 치명적이다. 다만 Spotify가 Messages로 '친구에게 곡 보내기'를 번들한 지금(2025~), 같은 기능을 별도 앱으로 하는 이유를 증명하기는 더 어려워졌다.
- 【추론】이 계열에서 '공유 빈도'에 관한 1차 증거는 모두 같은 방향을 가리킨다. This Is My Jam 사용자당 연 2~3개, Spotify Inbox 저참여, Connect 아티스트 비활성이다. VIBR 피드(팔로잉/최신/트렌딩)가 채워지려면 극소수 헤비 포스터에 기대야 할 가능성이 크다(4장 90-9-1 참고).

### Gaps

- This Is My Jam과 Cymbal의 리텐션·DAU/MAU, 사용자당 포스팅 빈도 분포 같은 1차 데이터는 찾지 못했다.
- "2012년 이후 실패한 모바일 한 곡 공유 앱 열 개 가까이"의 구체적 목록은 원문에 나오지 않는다.
- Spotify Messages 출시 뒤의 채택 지표는 2026-11 기준 공개 자료를 찾지 못했다.
- Corus의 성과와 재생 방식(임베드냐 링크아웃이냐)이 공개되지 않아 비교할 수 없다.

## 3. 창업자·VC·애널리스트가 지목한 소셜 뮤직의 구조적 문제 (반복 실패 패턴)

### Takeaway

반복 패턴은 여섯 가지다. ① 가치가 권리자에게 귀속되는 구조(선불 라이선스와 로열티), ② 플랫폼·API·ToS 의존, ③ 스트리밍 파편화 속 네트워크 효과 콜드스타트, ④ 저빈도 공유와 참여 불균형(lean-back 소비), ⑤ '제품이 아니라 기능'이라 인컴번트에 번들되는 구조, ⑥ 발견 주도권이 숏폼 소셜로 이동한 것. 2024–2026년에는 ②가 더 나빠졌다. Spotify API는 신규·소규모 앱에 사실상 닫혔다.

### Cited Findings

**① 권리자에게 가치가 귀속: 선불 라이선스와 로열티**

- 【분석·VC】Fred Wilson(USV, Turntable 리드 투자자): 스타트업은 "have to negotiate huge upfront payments to the music industry in order to even launch a service", 그리고 "no entrepreneur or investor would invest millions up front when the likelihood is 90% or greater that it will be a failure" — [Hypebot(2014-06-10), 원문 avc.com/2014/05/safe-harbors 인용](https://www.hypebot.com/can-streaming-music-innovation-be-supported-by-the-industry-without-reducing-licensing-fees/). Turntable 투자 주도 사실은 [Wikipedia](https://en.wikipedia.org/wiki/Turntable.fm) 참고.
- 【분석·VC】Wilson은 2012년 음악 스타트업이 시작하는 데만 최소 500만~2,000만 달러가 든다고 했다(일반 소프트웨어 스타트업은 약 50만 달러). 미러 사이트 기준이며 원문 wired.com은 열람에 실패했다 — [Wired 미러](https://wirednews.pages.dev/2012/11/music-startups)
- 【공식】Turntable: "the cost of running a music service has been too expensive" — [TechCrunch](https://techcrunch.com/2013/11/22/turntable-fm-shutting-down-so-company-can-focus-on-turntable-live-events-platform). 【공식】8tracks: 늘어나는 로열티를 감당할 매출이 없었다 — [Dancing Astronaut](https://dancingastronaut.com/2019/12/streaming-platform-8tracks-shutters-after-11-years/). 【공식】Cymbal: "the licensing issues are enough to intimidate developers into giving up" — [Hypebot](https://www.hypebot.com/playlist-sharing-startup-cymbal-joins-deadpool). 【공식】Grooveshark: 레이블과 합의해 폐쇄하고 IP를 넘겼다 — [Rolling Stone](https://www.rollingstone.com/music/music-news/grooveshark-shuts-down-after-eight-years-74101/)
- 【분석】Mixcloud는 광고가 로열티 비용을 충당하는 데 필요한 매출의 10%에도 못 미친다고 스스로 밝혔다. 라이선스 비용 구조가 무겁다는 것을 생존 기업이 직접 확인해 준 셈이다 — [Mixcloud](https://www.mixcloud.com/mixcloud/posts/ask-us-about-changes-to-the-basic-tier/)

**② 플랫폼·API·ToS 의존 (2024–2026년 악화)**

- 【공식】This Is My Jam: 의존 API 7곳의 변경을 따라가는 데 시간을 전부 썼다 — [Radio Survivor](https://radiosurvivor.com/2015/08/this-is-my-jam-and-the-hazards-of-indie-music-curation). Soundrop: Spotify App Finder 폐지로 종료했다 — [DMN](https://www.digitalmusicnews.com/2014/11/12/soundrop-shutting/)
- 【공식·Spotify】2024-11-27 신규 앱은 Related Artists, Recommendations, Audio Features, Audio Analysis, Featured/Category playlists, 30초 preview URL(multi-get 응답), 알고리즘·에디토리얼 플레이리스트에 접근할 수 없게 됐다(기존 extended 앱은 제외) — [Spotify for Developers 블로그](https://developer.spotify.com/blog/2024-11-27-changes-to-the-web-api); [TechCrunch](https://techcrunch.com/2024/11/27/spotify-cuts-developer-access-to-several-of-its-recommendation-features)
- 【보도】Extended quota 요건은 2025년부터 법인 등록 사업자, MAU 25만 이상, 주요 Spotify 시장 서비스, 출시된 서비스 운영이다. 2026-02 기준 Developer Mode는 Premium 구독이 필요하고 테스트 사용자는 5명(2021년 25명에서 축소)으로 제한된다. 엔드포인트도 추가로 폐지됐다(신보, 아티스트 top tracks, 아티스트 인기도·팔로워 등). Spotify는 "risky AI-aided or automated usage"를 이유로 들며 Developer Mode를 "sandboxed environment for learning and experimentation"으로 규정했다 — [TechCrunch(Ivan Mehta, 2026-02-06)](https://techcrunch.com/?p=3090291). 기준일은 출처마다 다르다. TechCrunch는 2025년 3월, DEV Community는 2025-05-15로 적었다 — [DEV Community](https://dev.to/leemartin/the-state-of-spotify-web-api-report-2025-4gh3). 개발자들은 "How can we possibly reach 250,000 MAU if we can only launch a beta to 5 users?"라고 반발했다 — [Spotify Community](https://community.spotify.com/t5/Spotify-for-Developers/Updating-the-Criteria-for-Web-API-Extended-Access/td-p/6920661/page/8)
- 【공식·YouTube】개발자 정책은 플레이어 백그라운드 재생 허용, 오디오 트랙 다운로드·분리 제공, 표준 재생 기능의 변경·추가·차단을 금지한다. Required Minimum Functionality 문서는 2025년 7월 개정됐다 — [YouTube Developer Policies guide](https://developers.google.com/youtube/terms/developer-policies-guide); [revision history](https://developers.google.com/youtube/terms/revision-history)
- 【공식·Apple】iTunes Search API 미리듣기 등 Promo Content는 다음 조건에서만 쓸 수 있다. 해당 콘텐츠를 홍보하는 페이지에만 둔다. 구매 페이지로 연결되는 "Download on iTunes/App Store" 배지 근처에 둔다. "provided courtesy of iTunes"를 표기한다. 스트리밍만 허용하고 다운로드·캐시는 금지한다. "is not used for independent entertainment value apart from its promotional purpose". Apple이 요청하면 즉시 제거해야 한다. 호출 한도는 분당 약 20회다 — [Apple Performance Partners: Search API](https://performance-partners.apple.com/search-api)
- 【보도】Musi(YouTube 래퍼)는 YouTube·NMPA·IFPI 민원 뒤 App Store에서 퇴출됐고 소송에서도 졌다 — [MBW](https://www.musicbusinessworldwide.com/free-streaming-app-musi-sues-apple-over-removal-from-app-store/); [CMU 2026](https://completemusicupdate.com/apple-wins-legal-battle-with-musi-after-judge-rules-music-apps-lawsuit-was-not-the-paradigm-of-candor/)

**③ 파편화와 네트워크 효과 콜드스타트**

- 【공식·창업자】Charlie Kaplan의 진단: 친구가 서로 다른 스트리머를 쓰면 공유가 깨진다(Verizon/AT&T 비유). 처방은 "create a great single player mode in order to earn your multi player or social mode". 【분석】같은 글은 실패한 서비스 다수가 '대규모 사용자가 모여야 가치가 생기는' 구조였다고 지적한다 — [MediaTech Ventures](https://mediatech.ventures/the-social-music-tech-revolution/)
- 【분석】팬들은 쓰던 스트리머 안에서 플레이리스트를 만든다 — [Hypebot(Cymbal)](https://www.hypebot.com/playlist-sharing-startup-cymbal-joins-deadpool)

**④ 저빈도 공유, 참여 불균형, lean-back 소비**

- 【분석】Mark Mulligan(MIDiA): "Western apps: lean back, listen with minimal friction" vs "Chinese apps: lean forward, dive in, interact". 서구 서비스는 "simply monetize consumption", "No one – digitally – is owning the fandom" — [Hypebot 재게재(2020-06-16)](https://www.hypebot.com/fandom-and-how-streaming-music-needs-a-new-future-mark-mulligan/)
- 【분석】Mulligan: 소셜 뮤직은 "for so long a promise unfulfilled in the West"였다. 35세 미만의 음악 발견은 YouTube, 스트리밍, 라디오, 소셜 순이다 — [Hypebot 재게재(2020-08-07)](https://www.hypebot.com/social-music-is-at-a-turning-point/)
- 【분석】참여 불균형 90-9-1: "90% of users are lurkers who never contribute", 9%는 가끔 기여하고 1%가 대부분을 기여한다. 완화책은 기여 장벽 낮추기, 일상 행동의 부산물로 참여 만들기, 백지 대신 편집할 템플릿 제공이다 — [Nielsen Norman Group(Jakob Nielsen, 2006-10-08)](https://www.nngroup.com/articles/participation-inequality/)
- 【보도】Spotify Inbox는 저참여로 제거됐고 — [Verdict](https://www.verdict.co.uk/spotify-messages-gain-traction/) — Apple Music Connect 아티스트들은 활동하지 않았다 — [Engadget](https://www.engadget.com/2018-12-13-apple-music-connect-removes-artist-posts.html)
- 【분석】2019년 음악 앱의 30일 리텐션이 3.5%라는 수치가 인용됐다(원 출처 미명시) — [MediaTech Ventures](https://mediatech.ventures/the-social-music-tech-revolution/)

**⑤ '제품이 아니라 기능': 인컴번트 번들과 흡수**

- 【분석】"live audio has always had more value as a product feature rather than a standalone product" — [MIDiA(2023)](https://www.midiaresearch.com/blog/as-spotify-joins-the-live-audio-shutdown-can-amp-and-spaces-get-it-right)
- 【분석】Twitter #Music은 본 앱 생태계 밖에 있어서 실패했고 — [CMU](https://archive.completemusicupdate.com/article/twitter-to-shut-its-standalone-music-app/) — Heardle은 Spotify 앱에 통합되지 않았다 — [TechCrunch](https://techcrunch.com/2023/04/14/spotify-is-shutting-down-heardle-the-wordle-like-music-guessing-game-it-bought-last-year)
- 【공식】TikTok은 자체 스트리밍을 접고 "Add To Music App"으로 인컴번트에 연결하는 쪽을 택했다 — [Hypebot](https://www.hypebot.com/tiktok-music-shuts-down/). Songza 기능은 Google Play Music에 흡수됐다 — [Vice](https://www.vice.com/en/article/yp3gpb/songza-is-shutting-down-but-its-best-features-are-already-in-google-play-music). Spotify는 2025년 Messages로 앱 내 곡 공유를 번들했다 — [Verdict](https://www.verdict.co.uk/spotify-messages-gain-traction/)

**⑥ 발견 주도권의 숏폼 이동과 주의력 경쟁**

- 【분석】MIDiA 2024년 4분기 조사에서 소셜 비디오 이용은 주 7.6시간, 음악 스트리밍은 6.5시간이었다. 16–19세의 1위 음악 발견 경로는 TikTok이고 스트리밍은 4위다. 그래도 "It is what comes after the discovery that matters" — [MIDiA(2025-02-27)](https://www.midiaresearch.com/blog/social-came-for-streamings-lunch-now-its-time-for-streaming-to-bite-back)
- 【공식】8tracks의 Porter는 YouTube·게임·앱과의 주의력 경쟁을 언급했다 — [mxdwn](https://music.mxdwn.com/2019/12/28/news/8tracks-streaming-platform-announces-its-shutting-down/)

**수익화**

- 【분석】Cymbal은 출시 때부터 수익화가 불명확했다 — [Hypebot](https://www.hypebot.com/playlist-sharing-startup-cymbal-joins-deadpool). Turntable은 사용자를 수익화하지 못했다 — [MediaTech Ventures](https://mediatech.ventures/the-social-music-tech-revolution/). Rdio는 매달 약 200만 달러를 잃었다 — [VentureBeat](https://venturebeat.com/ai/rdio-struggled-to-compete-with-pandora-and-spotify-then-apple-google-and-microsoft-showed-up)

### Inferences

- 【추론】반복 실패 패턴을 VIBR에 대입하면 다음과 같다. ① VIBR는 음원을 호스팅하지 않아 라이선스 비용은 피했지만, 그 대가로 '재생 경험을 통제할 권리'가 없다(This Is My Jam 경로). ② YouTube 정책(백그라운드 재생·오디오 분리 금지)과 Apple 미리듣기 조건("independent entertainment value" 금지, 스토어 배지와 표기 의무)을 보면, 소셜 피드 안에서 미리듣기를 주된 청취 경험으로 쓰는 것은 약관과 긴장 관계일 가능성이 있다. 법률 검토가 필요하다. ③ Spotify 연동으로 '친구 간 파편화'를 풀 길은 2025–2026년 정책(5인 Developer Mode, MAU 25만 요건) 때문에 1인 개발자에게 사실상 막혀 있다. ④ 공유 빈도와 90-9-1 문제는 피드형 설계와 정면으로 부딪힌다. ⑤ '친구에게 곡 보내기'는 Spotify Messages가 번들했다. ⑥ 발견은 숏폼에서 일어난다.
- 【추론】단골 처방인 '라이선스를 피하려고 임베드를 쓴다'는 2015년(This Is My Jam)에도 2024년(Musi)에도 플랫폼 정책 리스크로 되돌아왔다. 라이선스 리스크가 사라지는 게 아니라 플랫폼 리스크로 형태만 바뀐다.
- 【추론】'빅테크도 실패했다'는 사실은 양면적이다. 인컴번트가 기능을 번들해도 쓰이지 않을 수 있다(Spotify Inbox 2017). 그렇다고 독립 앱이 그 틈을 채운 사례도 없다. 수요 자체가 얕다는 가설이 가장 경제적인 설명이다.

### Gaps

- Water & Music(Cherie Hu), Stratechery, a16z의 소셜 뮤직 구조 분석은 검색 한도 때문에 찾지 못했다. Medium Cuepoint "Why Music-Based Social Networks are Doomed"는 403으로 열람하지 못했다.
- Hacker News의 종료 스레드(This Is My Jam, Turntable 등)는 열람하지 못했다.
- 공유 빈도(예: 스트리밍 사용자 중 곡을 공유하는 비율)에 대한 정량 1차 데이터는 찾지 못했다. 30일 리텐션 3.5%의 원 출처도 확인하지 못했다.
- Wilson의 2012년 Wired 발언은 미러로만 확인했다.
- iTunes 미리듣기·YouTube 임베드 약관을 VIBR의 실제 UI에 적용한 법률적 판단은 이 노트의 범위 밖이다. 위 내용은 약관 문구 대조 수준이다.

## 4. 장기 생존 서비스(Last.fm, RateYourMusic, Hype Machine, SoundCloud, Bandcamp, Mixcloud)와 그들이 다르게 한 것

### Takeaway

살아남은 곳은 '소셜 네트워크'가 아니라 혼자 써도 가치 있는 도구나 데이터(Last.fm 청취 기록, RYM 평점·목록·장르 DB), 권리 문제를 정면으로 해결한 모델(Mixcloud 라이선스, Bandcamp 판매, SoundCloud 메이저 계약), 크리에이터(공급자) 측 수익을 가진 곳이다. 생존 기업들도 소셜 기능은 약해졌다(Last.fm). 2017년(SoundCloud)과 2023년(Bandcamp)에는 존폐 위기나 대규모 해고를 겪었다.

### Cited Findings

- **Last.fm**: 지금은 라디오나 추천 엔진보다 청취 이력 기록 도구로 주로 쓰인다. Spotify가 주요 스트리머 중 유일하게 플랫폼 차원의 네이티브 스크로블링을 지원한다. 사이트 안의 소셜 기능은 거의 휴면 상태이고 커뮤니티는 Discord로 옮겨 가 Last.fm 통계 봇을 돌린다(사용자 댓글 기반) — [Hacker News 토론(미러)](https://brianlovin.com/hn/46266875). The Verge의 20주년 기사(Jacob Kastrenakes)는 Last.fm 데이터를 중심으로 새 커뮤니티가 생기고 있다고 전했다 — [MacStories 링크 "Last.fm turns 20 and people are still scrobbling"](https://www.macstories.net/linked/last-fm-turns-20-and-people-are-still-scrobbling/)
- **RateYourMusic**: 2000-12-24 Hossein Sharifi가 혼자 만들었다. 사용자가 음반을 카탈로그에 넣고 평점·리뷰·목록을 남기며, 장르 태그 투표와 출처 기반 장르 분류가 모더레이터 승인을 거쳐 쌓인다. 2026년 8월 기준 계정 160만 이상, 음반 740만, 평점 1.76억, 리뷰 380만, 목록 160만 이상이다. 후속작 Sonemic은 2015년 Indiegogo 크라우드펀딩으로 시작했고, 2020년 11월 별도 출시 대신 RYM에 기능을 넣는 쪽으로 바꿨다 — [Wikipedia](https://en.wikipedia.org/wiki/Rate_Your_Music)
- **Hype Machine**: 2005년 Hunter College 학생 Anthony Volodkin의 음악 DB 프로젝트로 시작했다 — [Technical.ly](https://technical.ly/uncategorized/hype-machine-history/). 2006년에는 "one-man band"로 소개됐다 — [CNN Money](https://money.cnn.com/2006/10/06/magazines/business2/volodkin_music.biz2/index.htm). 2007년 졸업 후 전업으로 운영했고 — [Hypebot(2009)](https://www.hypebot.com/conversation-with-hype-machines-anthony-volodkin/) — 2011년 사용자 100만 명을 돌파했다 — [Masters of Media(2011)](https://mastersofmedia.hum.uva.nl/2011/11/interview-with-arkadiy-kukarkin-developer-at-the-hype-machine). 2026년 3월 Wikipedia 스냅샷은 '활성'으로 표시한다(2차) — [Wikipedia 미러](https://wiki.krisyotam.com/content/wikipedia_en_all_nopic_2026-03/Hypem)
- **SoundCloud**: 2007년 창업. 2014–2016년 Warner, Merlin, Universal, Sony와 차례로 라이선스 계약을 맺었다. 2017년 1억 달러 조달에 실패해 인력 약 40%를 줄이고 사무소 2곳을 닫았다. 같은 해 8월 Raine·Temasek에서 1.695억 달러를 받아 회생했고, 2020년 SiriusXM이 7,500만 달러를 투자했다. 2021년 fan-powered royalties를 도입했다. 크리에이터 유료 도구(Artist Pro 연 99달러), 유통(Repost/SoundCloud For Artists) 사업을 한다. 2021년 12월 CFO는 2023년 순이익을 예상했다(달성 여부는 문서에서 미확인) — [Wikipedia](https://en.wikipedia.org/wiki/SoundCloud)
- **Bandcamp**: 창업자 Ethan Diamond는 2012년부터 흑자라고 주장한다(비상장이라 검증 불가) — [Tone Madison](https://tonemadison.com/?p=19272). 2022년 3월 Epic에 인수됐다가 2023년 9월 Songtradr에 매각됐고, 직원 약 절반이 해고됐다 — [The Fader(2023-10-16)](https://www.thefader.com/2023/10/16/bandcamp-hit-with-layoffs-following-songtrader-acquisition); [Hypebot](https://www.hypebot.com/hypebot/2023/09/epic-games-sells-bandcamp-to-songtradr-amid-layoffs.html)
- **Mixcloud**: 크리에이터가 믹스를 올리고 수익화할 수 있는 유일한 라이선스 플랫폼이라고 스스로 소개한다. 광고는 로열티 충당에 필요한 매출의 10%에도 못 미쳐 혼합 수익모델이 필요하다고 밝혔다 — [Mixcloud](https://www.mixcloud.com/mixcloud/posts/ask-us-about-changes-to-the-basic-tier/). 팬 구독(Select) 배분은 65%가 아티스트·작곡가 로열티, 5%가 결제 수수료이고, 나머지 30%를 DJ와 Mixcloud가 60:40으로 나눈다 — [FACT(2019)](https://factmag.com/2019/06/14/mixcloud-select-royalties). 라이선스와 소셜화 전략은 경영진 인터뷰 참고 — [Attack Magazine](https://www.attackmagazine.com/features/interview/nico-perez-on-licensing-the-changing-dj-landscape-making-mixcloud-more-social/)

### Inferences

- 【추론】생존 기업이 다르게 한 다섯 가지:
  1. **싱글플레이 효용이 먼저였다.** Last.fm(내 청취 통계), RYM(내 평점·목록), Bandcamp(구매·컬렉션), SoundCloud·Mixcloud(내 작품 호스팅)는 친구가 0명이어도 쓸 이유가 있다. Kaplan의 처방("single player mode"), Nielsen의 '부산물로서의 참여'와 맞아떨어진다. 스크로블링은 듣기만 해도 데이터가 쌓이는 수동 참여의 대표 사례다.
  2. **재생을 핵심 가치로 삼지 않았거나, 권리를 정면으로 해결했다.** RYM과 Last.fm의 핵심 자산은 메타데이터·평가·기록이라 재생 API가 바뀌어도 가치가 남는다. 재생이 핵심인 Mixcloud·SoundCloud는 라이선스를 직접 맺었고, Bandcamp는 판매로 권리 문제를 풀었다.
  3. **공급자(크리에이터) 측 수익이 있다.** SoundCloud는 크리에이터 구독·유통, Bandcamp는 판매 수수료, Mixcloud는 Select 배분 구조를 갖췄다. 실패 사례 대부분은 '청취자끼리의 공유'만 있고 돈을 낼 주체가 없었다.
  4. **니치 정체성과 취향의 권위가 있다.** RYM(장르 분류 거버넌스), Hype Machine(블로그 큐레이션 집계)은 '어디서 좋은 음악을 아는가'라는 권위를 축적했다.
  5. **1인·저비용으로 출발해 장기 운영했다.** RYM(2000, 1인 창업)과 Hype Machine(2005, 학생 1인)은 벤처식 급성장을 요구받지 않았다.
- 【추론】생존 기업에서도 '소셜'은 약해지고 '데이터·도구'만 남았다(Last.fm 소셜 기능 휴면, 커뮤니티는 Discord로 이동). 사람 기반 추천의 가치는 독립 소셜 그래프보다 사람들이 이미 모이는 곳에 공급되는 데이터나 도구 형태로 살아남았다.

### Gaps

- Last.fm의 현재 MAU·소유 구조(Paramount 산하 여부)·수익모델, RYM의 수익모델(구독·광고 비중), Hype Machine의 수익과 운영 인원에 대한 1차 자료는 검색 한도로 확인하지 못했다.
- SoundCloud의 첫 흑자 연도, Mixcloud의 수익성을 확인하지 못했다.
- 다른 연구자가 현재 잘 되는 서비스(Airbuds, stats.fm, Musicboard 등)를 맡았으므로 이 노트에는 넣지 않았다.

## 5. 2026년 소규모·1인 진입자가 이 함정을 피하려면

### Takeaway

1인 진입자가 피해야 할 것은 세 가지다. 재생을 핵심 경험으로 삼는 것(권리·ToS 리스크), 친구 그래프가 있어야만 가치가 생기는 설계(콜드스타트), 인컴번트가 이미 번들한 기능(곡 보내기)으로 경쟁하는 것. 대신 ① 혼자 써도 가치 있는 기록·취향 도구, ② 작고 닫힌 그룹, ③ 사용자가 이미 있는 채널로 배포되는 산출물, ④ 사람 추천의 '성과'를 측정하는 메커닉, ⑤ 운영비를 0에 가깝게 유지하고 품위 있게 종료할 계획을 기본값으로 삼아야 한다.

### Cited Findings

- 【공식·창업자】"create a great single player mode in order to earn your multi player or social mode" — [MediaTech Ventures(Charlie Kaplan 인용)](https://mediatech.ventures/the-social-music-tech-revolution/)
- 【분석】같은 글의 제안: 청취 데이터를 사회적으로 쓴다(친구와 취향이 겹치는 지점 보여주기). 추천한 곡이 어떻게 됐는지 추적해 성공한 추천을 보상한다("influencer score"). 사용자가 이미 콘텐츠를 소비하는 곳에서 15초 내외의 짧은 클립으로 발견을 전달한다 — [MediaTech Ventures](https://mediatech.ventures/the-social-music-tech-revolution/)
- 【공식·제품】Discz는 내가 소개한 곡을 친구가 저장하면 "plugs"를 준다. 좋아요 대신 추천 성과를 보상하는 실제 사례다 — [Rolling Stone](https://www.rollingstone.com/music/music-features/discz-tiktok-recommendation-app-1324785/)
- 【분석】MIDiA: 소비자는 스크린 타임을 줄이고 작고 닫힌(gated) 커뮤니티를 원한다. 스트리머는 더 작고 안전한 팬 커뮤니티 공간을 마케팅해야 하며, SoundCloud·Audiomack 같은 작은 플랫폼은 소셜 기능에 더 투자해야 한다 — [MIDiA(2025-02-27)](https://www.midiaresearch.com/blog/social-came-for-streamings-lunch-now-its-time-for-streaming-to-bite-back)
- 【분석】참여 불균형 완화책: 기여 장벽 낮추기(별점 등), 일상 행동의 부산물로 참여 만들기, 템플릿 편집 제공, 상위 기여자에 대한 과잉 보상 피하기 — [Nielsen Norman Group](https://www.nngroup.com/articles/participation-inequality/)
- 【공식·플랫폼 제약】Spotify Developer Mode는 테스트 사용자 5명에 Premium이 필요하다. Extended quota는 법인 등록과 MAU 25만이 필요하다 — [TechCrunch(2026-02-06)](https://techcrunch.com/?p=3090291). 추천·오디오 피처·preview URL은 2024-11-27부터 신규 앱에 막혔다 — [Spotify for Developers](https://developer.spotify.com/blog/2024-11-27-changes-to-the-web-api). YouTube는 백그라운드 재생과 오디오 분리를 금지한다 — [YouTube Developer Policies guide](https://developers.google.com/youtube/terms/developer-policies-guide). Apple 미리듣기는 홍보 목적으로만 쓸 수 있고, 스토어 배지와 "provided courtesy of iTunes" 표기가 필요하며, Apple이 요청하면 즉시 제거해야 한다 — [Apple Search API](https://performance-partners.apple.com/search-api)
- 【분석·VC】라이선스를 선불로 내야 하는 모델에는 투자자가 돈을 넣지 않는다(실패 확률 90% 이상 전제) — [Hypebot/Fred Wilson](https://www.hypebot.com/can-streaming-music-innovation-be-supported-by-the-industry-without-reducing-licensing-fees/)
- 【선례】1인으로 시작해 수십 년 생존한 사례가 있다. RYM(2000, Hossein Sharifi) — [Wikipedia](https://en.wikipedia.org/wiki/Rate_Your_Music), Hype Machine(2005, 학생 1인) — [Technical.ly](https://technical.ly/uncategorized/hype-machine-history/)
- 【선례】품위 있는 종료(내보내기, 읽기전용 API, 오픈소스)는 This Is My Jam에 "Without Screwing Users"라는 평가를 남겼다 — [TechCrunch](https://techcrunch.com/?p=1193462). Turntable(Spotify/CSV 내보내기, 익명 데이터 공개) — [TechCrunch](https://techcrunch.com/2013/11/22/turntable-fm-shutting-down-so-company-can-focus-on-turntable-live-events-platform), Cymbal(Spotify/SoundCloud 내보내기) — [Bandwagon](https://bandwagon.asia/articles/social-music-platform-cymbal-shutting-down)도 같은 방식을 택했다.
- 【경쟁 신호】2026년 5월 Corus가 "no algorithm, no ads"를 내건 사람 추천 피드를 월 2.99달러 선택 구독으로 출시했다 — [Mixmag](https://mixmag.net/read/new-music-app-cymbal-tipped-as-the-instagram-for-music-tech). 2025년 8월에는 Spotify가 앱 내 Messages를 출시했다 — [Verdict](https://www.verdict.co.uk/spotify-messages-gain-traction/)

### Inferences

- 【추론】VIBR가 계속 간다면 함정을 피하기 위한 최소 조건:
  1. **재생은 '부가'로, 핵심은 '기록·맥락'으로.** 곡 재생은 링크아웃(사용자의 스트리머로 열기)과 정책을 지키는 임베드(보이는 YouTube 플레이어, 백그라운드·오디오 전용 재생 없음)로 제한한다. iTunes 미리듣기는 스토어 배지와 표기 조건을 지키거나 아예 빼는 쪽을 검토한다. 그 대신 VIBR만의 가치는 '누가, 왜, 어떤 순간에 이 곡을 추천했는가'라는 텍스트·이미지 맥락과 아카이브에 둔다. 이 자산은 재생 API가 바뀌어도 남는다(RYM·Last.fm 경로).
  2. **싱글플레이 모드부터.** 혼자 써도 의미 있는 '음악 일기·아카이브(내 인생 곡 기록, 시기별 회고, 연말 결산 카드)'를 먼저 완성한다. 소셜은 그 부산물로 만든다(Kaplan, Nielsen). VIBR에 이미 있는 archive 라우트를 중심축으로 삼을 수 있다.
  3. **작은 닫힌 그룹 단위.** 공개 팔로잉/트렌딩 피드보다 친구 5~20명 단위의 그룹이나 '주간 한 곡' 의식처럼 저빈도를 전제로 설계한다. This Is My Jam의 "slow, considerate sharing"을 실패 원인이 아니라 설계 전제로 받아들이는 것이다. 피드가 비는 문제(90-9-1)도 그룹 단위에서는 덜 드러난다.
  4. **이미 사람이 있는 채널로 배포.** 결과물을 인스타그램 스토리, 카카오톡 공유 카드, Discord 봇처럼 외부로 퍼지는 아티팩트로 만든다(Last.fm 커뮤니티가 Discord로 간 경로). 별도 앱으로 사람을 데려오려 한 Twitter #Music·Ping·Heardle의 실패를 반복하지 않는다.
  5. **사람 추천의 성과를 측정하고 보상.** 내 추천으로 친구가 저장하거나 반복 재생한 횟수 같은 지표(Discz "plugs", "influencer score")는 '알고리즘 대신 사람'이라는 주장을 숫자로 증명하는 VIBR의 차별점이 될 수 있다. Corus·Spotify Messages와 구분되는 지점도 여기다.
  6. **비용 0 근접과 출구 설계.** 라이선스·서버 비용이 사용자 증가에 비례해 늘지 않는 구조를 유지하고, 데이터 내보내기·아카이브 모드를 처음부터 설계한다.
- 【추론】피벗 방향은 위 조건에서 자연스럽게 나온다. (a) 개인 음악 기록·회고 도구(싱글플레이 우선). (b) 소규모 그룹의 정기 추천 의식(닫힌 커뮤니티). (c) 특정 장르·씬에 집중한 니치 큐레이션 아카이브(RYM·Hype Machine 경로). 반대로 '공개 소셜 피드 + 앱 내 재생 + 사람 추천'이라는 현재 조합을 벤처형 성장 목표로 계속 다듬는 것이 이 노트가 확인한 가장 전형적인 함정이다.
- 【추론】포트폴리오나 학습 목적이라면 함정의 치명도는 낮다. 위 실패 사유 대부분이 '규모화와 수익화' 단계에서 터졌기 때문이다. 이 경우에도 Spotify API 의존(5인 제한)과 미리듣기 약관은 출시 전에 점검할 대상이다.

### Gaps

- 1인 개발자가 2024–2026년에 소셜 뮤직 앱을 성공적으로 운영한 사례 데이터(예: Airbuds·Receiptify류의 성장 경로)는 다른 연구자 담당이라 다루지 않았고, 검색 한도로 교차 확인도 하지 못했다.
- 한국 시장(카카오톡 공유, 멜론·지니 등 국내 스트리머 API 정책)에서 위 제약이 어떻게 달라지는지는 다른 연구자 담당이다.
- iTunes 미리듣기·YouTube 임베드를 VIBR UI에 쓰는 것이 약관 위반인지에 대한 법률적 판단은 하지 않았다. 문구 대조 수준의 위험 신호만 정리했다.
- Corus의 초기 성과는 2026-11 기준 공개 자료가 없어 '같은 컨셉 재도전'의 결과를 판단할 수 없다.
