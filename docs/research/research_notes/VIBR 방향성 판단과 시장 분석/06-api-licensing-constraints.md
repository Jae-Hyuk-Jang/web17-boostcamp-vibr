# 06. 2026년 11월 기준 음악 API·라이선스 제약 — 1인 개발자의 소셜 뮤직 웹앱 실현 가능성 지도

> 기준일 2026-11-13. 각 규칙에는 문서 URL과 문서에 적힌 날짜를 붙였고, 날짜가 없는 문서는 "날짜 미표기, 2026-11-13 열람"으로 적었다. 공식 원문으로 확인하지 못한 내용은 **[불확실]**, 검색 결과 요약만으로 확인한 내용은 **[검색 요약 기준]**으로 표시했다. 이 노트는 법률 자문이 아니다. **[변호사 검토 필요]** 표시 항목은 출시 전에 전문가 확인이 필요하다.
> 조사 도중 세션의 WebSearch 한도가 소진되었다. 그 뒤로는 공식 문서 URL을 직접 열람하는 방식만 썼고, 봇 차단 등으로 열지 못한 문서(MusicBrainz, Discogs, Genius, 국가법령정보센터 조문 등)는 각 절의 Gaps에 남겼다. Hacker News와 The Verge의 반응도 같은 이유로 수집하지 못했다.

---

## Q1. Spotify Web API·Web Playback SDK — 2024-11-27 기능 제한, 2025년 확장 쿼터 기준, 개발 모드 사용자 한도, Premium 요건, 2026년 변경

### Takeaway

2026년 11월 현재 1인 개발자는 Spotify를 공개 서비스의 데이터 소스나 재생 소스로 쓸 수 없다. 근거는 세 가지다.

- 신규 앱은 2024-11-27부터 추천, 오디오 특징, 관련 아티스트, 30초 preview URL을 쓸 수 없다.
- 확장 쿼터는 2025-05-15부터 법인·기관이면서 MAU 25만 이상인 서비스만 신청할 수 있다.
- 개발 모드는 신규 앱 2026-02-11, 기존 앱 2026-03-09부터 "앱 소유자 Premium 필수, 사용자 5명, 축소된 엔드포인트" 체제가 됐다.

재생은 Premium 구독자에게만 허용된다. 다른 서비스의 스트림과 섞는 것, 그리고 동시 청취자에게 단일 소스를 재생하는 것은 정책으로 금지돼 있다.

### Cited Findings

#### 2024-11-27: 신규 사용 사례 대상 기능 차단

- 공지 원문: "Effective today, new Web API use cases will no longer be able to access or use the following endpoints and functionality." 차단 대상은 Related Artists, Recommendations, Audio Features, Audio Analysis, Get Featured Playlists, Get Category's Playlists, 30-second preview URLs(multi-get 응답의 `SimpleTrack` 객체), "Algorithmic and Spotify-owned editorial playlists"다. — [Spotify for Developers 블로그, 2024-11-27](https://developer.spotify.com/blog/2024-11-27-changes-to-the-web-api)
- 적용 대상은 2024-11-27 이후 등록된 신규 앱과, 확장 요청이 대기 중이지 않던 기존 개발 모드 앱이다. 이미 extended mode 접근권이 있던 앱은 "remain unaffected"다. 공식 사유는 "creating a more secure platform"이다. — [같은 글](https://developer.spotify.com/blog/2024-11-27-changes-to-the-web-api)
- 커뮤니티의 Audio Features 403 문의 스레드에서 "Spotify에는 대체 엔드포인트가 없다"는 취지의 답변이 나왔다. [검색 요약 기준. 답변자가 직원인지는 원문으로 확인하지 못함] — [Spotify Community 스레드](https://community.spotify.com/t5/Spotify-for-Developers/Web-API-Get-Track-s-Audio-Features-403-error/td-p/6654507)

#### 2025-04-15 공지, 2025-05-15 시행: 확장 쿼터(Extended Quota) 기준 강화

- 2025-05-15부터 새 기준이 적용된다. 확장 접근은 "reserved for apps with established, scalable, and impactful use cases"이고, Developer Terms 변경도 같은 날 시행됐다. 개발 모드는 "will remain accessible for experimentation and personal use"라고 밝혔다. — [Spotify 블로그, 2025-04-15](https://developer.spotify.com/blog/2025-04-15-updating-the-criteria-for-web-api-extended-access)
- 문서 원문: "as of May 15th 2025, Spotify only accepts applications from organizations (not individuals)." 6개 기준은 다음과 같다.
  1. 법적으로 등록된 사업체·기관
  2. 출시되어 운영 중인 서비스
  3. MAU 25만 이상
  4. 주요 Spotify 시장에서 이용 가능
  5. 상업적 생존 가능성(commercial viability)
  6. 약관 준수

  신청 절차는 회사 이메일로 Partner Application을 제출하고, 승인되면 대시보드에서 Quota extension을 요청하는 순서다. 심사는 최대 6주 걸린다. — [Web API 문서 "Quota modes", 날짜 미표기, 2026-11-13 열람](https://developer.spotify.com/documentation/web-api/concepts/quota-modes)

- 날짜 상충: TechCrunch는 확장 쿼터 기준 강화 시점을 "March 2025"로 적었다. 공식 블로그(2025-04-15 공지, 05-15 시행)와 다르므로 공식 날짜를 따른다. — [TechCrunch, 2026-02-06](https://techcrunch.com/2026/02/06/spotify-changes-developer-mode-api-to-require-premium-accounts-limits-test-users/)

#### 2026-02-06 공지: 개발 모드 축소(신규 앱 2026-02-11, 기존 앱 2026-03-09)

- 신규 개발 모드 Client ID의 기본 조건은 다음 네 가지다. 신규 앱 적용일은 "Starting Wednesday, 11 February"(2026)이고 기존 통합 앱은 3월 9일이다. — [Spotify 블로그 "Update on Developer Access and Platform Security", 2026-02-06 게시, 03-09 갱신](https://developer.spotify.com/blog/2026-02-06-update-on-developer-access-and-platform-security)
  - Premium 필수
  - 개발자당 Client ID 1개
  - 승인 사용자 최대 5명
  - 축소된 엔드포인트 세트
- 3월 9일 갱신 내용: 커뮤니티 반발을 반영해 기존 통합 앱의 엔드포인트 접근 변경은 연기했다. Premium 필수, 5명 한도, Client ID 1개 제한은 기존 앱에도 3월 9일에 적용됐다. — [같은 글](https://developer.spotify.com/blog/2026-02-06-update-on-developer-access-and-platform-security)
- 공식 사유와 성격 규정은 다음과 같다. 개발 모드는 "non-commercial use by individual developers"용으로 유지된다. — [같은 글](https://developer.spotify.com/blog/2026-02-06-update-on-developer-access-and-platform-security)
  - 사유: "advances in automation and AI have fundamentally altered the usage patterns and risk profile of developer access"
  - 개발 모드의 성격: "should not be relied on as a foundation for building or scaling a business on Spotify"
- 현재 문서 기준 개발 모드 조건은 다음과 같다. — [Quota modes, 2026-11-13 열람](https://developer.spotify.com/documentation/web-api/concepts/quota-modes)
  - 인원: "Up to 5 authenticated Spotify users can use an app that is in development mode." allowlist에 없는 사용자의 요청은 403을 받는다.
  - Premium: "The app owner must have a Spotify Premium account for apps in development mode to function."
  - 쿼터: 요청 상한이 개발자 계정 단위로 걸리며, 초과하면 429 "QUOTA_EXCEEDED"를 받는다.
- 사용자 한도는 25명에서 5명으로 줄었다. 개발 모드는 2021년에 25명 한도로 도입됐었다. — [TechCrunch, 2026-02-06](https://techcrunch.com/2026/02/06/spotify-changes-developer-mode-api-to-require-premium-accounts-limits-test-users/)
- 마이그레이션 가이드의 주요 변경점은 다음과 같다. 확장 쿼터 앱은 "No migration required"다. — [February 2026 Web API Dev Mode Changes – Migration Guide, 2026-11-13 열람](https://developer.spotify.com/documentation/web-api/tutorials/february-2026-migration-guide)
  - 삭제된 배치 조회: `GET /tracks`, `/albums`, `/artists`, `/episodes`, `/shows`, `/audiobooks`, `/chapters`
  - 삭제된 탐색·아티스트 엔드포인트: `GET /browse/new-releases`, `/browse/categories`, `/browse/categories/{id}`, `/artists/{id}/top-tracks`
  - 삭제된 타 사용자 조회: `GET /users/{id}`, `/users/{id}/playlists`, `GET /markets`
  - 라이브러리 저장과 팔로우는 `PUT/DELETE /me/library`로 통합됐다.
  - 플레이리스트의 `/tracks`는 `/items`로 바뀌었고, 사용자가 소유하거나 협업하는 플레이리스트에서만 items를 반환한다.
  - Search `limit`은 최대 50에서 10으로, 기본값은 20에서 5로 줄었다.
  - 제거된 응답 필드: track의 `available_markets`·`linked_from`·`popularity`, album의 `label`·`popularity`, artist의 `followers`·`popularity`, `GET /me`의 `country`·`email`·`explicit_content`·`followers`·`product`
  - `external_ids` 제거는 2026년 3월 changelog로 철회됐다.
- 2026년 7월 업데이트로 "the Client IDs per developer limit has been increased to 25"가 됐다. — [Migration Guide](https://developer.spotify.com/documentation/web-api/tutorials/february-2026-migration-guide). 세부 일자(7월 23일)는 2차 출처 기준이다. [불확실] — [Vorp Labs](https://vorplabs.com/agent-tools/spotify-cli)

#### 개발자·업계 반응

- 한 개발자는 개발 모드에서 `PUT /me/following`과 플레이리스트 쓰기 요청이 403을 받는다고 보고했다. `PUT /me/library`로 바꾸자 해결됐다. 답변은 커뮤니티 회원이 했고 직원 답변은 없다. — [Spotify Community "Restore Web API write access for individual developers"](https://community.spotify.com/t5/Spotify-for-Developers/Restore-Web-API-write-access-for-individual-developers/m-p/7474338)
- 다음 반응은 헤드라인과 요약만 확인했다. [검색 요약 기준]
  - "Spotify Just Killed Thousands of Third-Party Music Apps, and Developers Reveal Which Ones Are Next" — [Headphonesty, 2026-02](https://www.headphonesty.com/2026/02/spotify-crackdown-thousands-third-party-music-apps/)
  - "Spotify's API Lock-Down: The End of Open Data for the Music Business?" — [Medium](https://medium.com/@apollinereymond/spotifys-api-lock-down-the-end-of-open-data-for-the-music-business-0a9bf07dba27)
- 공식 2월 업데이트 스레드 — [Spotify Community "February 2026 Spotify for Developers update thread"](https://community.spotify.com/t5/Spotify-for-Developers/February-2026-Spotify-for-Developers-update-thread/m-p/7330564/highlight/true)

#### Developer Policy("Effective as of 15 May, 2025"): 재생, 상업적 이용, 통합 제한

- IV.1 재생: 음악 재생은 Premium 구독자에게만 제공해야 한다. 원문: "shall only be made available to subscribers to the Premium Spotify Service." 팟캐스트는 예외다. — [Spotify Developer Policy](https://developer.spotify.com/policy)
- IV.2–3 상업적 이용: "Except for the limited commercial uses for Non-Streaming SDAs (set out below) commercial uses are not permitted for SDAs." 스트리밍 앱은 광고, 스폰서십, 프로모션을 판매할 수 없다. — [같은 문서](https://developer.spotify.com/policy)
- III.5 타 서비스와의 통합: "Do not create any product or service which is integrated with streams or content from another service." — [같은 문서](https://developer.spotify.com/policy)
- III.4·III.10 동시 청취: "Do not create any product or service which includes any non-interactive internet webcasting service." 하나의 소스를 여러 동시 청취자에게 재생하는 것이 금지 예시로 제시돼 있다. 업장 등 공개 장소 재생도 금지다. — [같은 문서](https://developer.spotify.com/policy)
- 그 밖의 금지 사항 — [같은 문서](https://developer.spotify.com/policy)
  - III.6: "Do not synchronize any sound recordings with any visual media"
  - III.7: 다른 오디오와 믹스하거나 겹쳐 재생하는 것
  - III.14: Spotify 콘텐츠로 ML·AI 모델을 학습시키거나 입력하는 것
- 메타데이터·커버아트 규칙(II.4–5, V.2, VI) — [같은 문서](https://developer.spotify.com/policy)
  - 원문: "may only be used in connection with the underlying content"
  - 재생할 때 커버아트와 메타데이터를 표시하고 Spotify로 링크백해야 한다.
  - 메타데이터나 커버아트를 단독 상품으로 제공할 수 없다.
  - Spotify Marks로 출처를 표시해야 하고, 앱 이름을 "Spot"으로 시작할 수 없다.

#### Embeds·iFrame API: Client ID 없이 쓰는 경로

- iFrame API는 `createController`, `loadUri`/`loadEntity`, `play`, `pause`, `resume`, `seek`, `destroy` 메서드와 `ready`, `playback_started`, `playback_update` 이벤트를 제공한다. 페이지에 Client ID나 승인 절차 언급은 없다. Safari는 "blocks autoplay without user interaction"이다. — [Spotify iFrame API reference, 2026-11-13 열람](https://developer.spotify.com/documentation/embeds/references/iframe-api)
- 원문: "By using Spotify Embeds, you accept the Spotify Developer Terms of Service." — [Spotify Embeds 개요](https://developer.spotify.com/documentation/embeds)
- 오디오 Embed는 최소 폭 280px, 높이 352·232·152·80px 중 하나다. 뮤직비디오 재생에는 250×150px 이상이 필요하다. — [Creating an Embed](https://developer.spotify.com/documentation/embeds/tutorials/creating-an-embed)

### Inferences

- **공개 서비스 기능으로는 불가:** Spotify 로그인 기반 기능은 1인 개발자에게 사실상 불가능하다. 청취 기록(`/me/player/recently-played`, `/me/top`), 플레이리스트 생성, Web Playback SDK 재생이 모두 해당한다. 개발 모드는 5명 한도에 소유자 Premium이 필요하고, 확장 쿼터는 법인이면서 MAU 25만 이상이어야 한다. 남는 용도는 포트폴리오용으로 5명 이내에서 시연하는 정도다.
- **VIBR의 Spotify 제거는 정책상 타당했다.** VIBR의 글로벌 플레이어는 YouTube와 iTunes를 한 큐에서 섞는다. 이 구조는 Spotify의 III.5(타 서비스 스트림과 통합 금지)와 IV.1(Premium 전용) 모두와 충돌한다.
- **다시 넣는다면 범위를 좁혀야 한다.** 현실적인 범위는 게시글의 외부 링크나 Embed 카드다. 글로벌 플레이어나 혼합 큐에 Spotify Embed를 넣는 것은 III.5 해석상 위험하다. [정책 해석 불확실, 변호사·정책 검토 필요]
- **메타데이터 소스로도 부적합하다.** Developer Policy는 메타데이터와 커버아트를 "원 콘텐츠와 함께만" 쓰고 Spotify로 링크백하도록 요구한다. 따라서 Spotify 메타데이터를 YouTube로 재생하는 게시글에 채워 넣는 용도는 정책과 맞지 않는다.
  - 반면 링크 변환처럼 "Spotify로 가는 링크"를 만드는 용도는 정책 취지에 맞는다.
  - 이 용도에서는 `external_ids`(ISRC)가 유지된 점이 유용하다.
  - 다만 search limit 10, popularity 필드 제거, 개발자 계정 단위 쿼터 때문에 대량 메타데이터 소스로는 맞지 않는다.
- **피벗 축으로 두면 위험이 크다.** 2026-02 공지는 AI와 자동화로 인한 위험을 이유로 들었고 "계속 진화시키겠다"고 예고했다. 앞으로 더 축소될 수 있다는 뜻으로 읽힌다.

### Gaps

- 3월 9일에 연기된 기존 개발 모드 앱의 엔드포인트 변경이 2026-11 현재 시행됐는지 확인하지 못했다.
- 2024-11-27의 preview URL 제한이 단일 트랙 조회에도 적용되는지, 실제로 null이 반환되는지 공식 원문으로 검증하지 못했다.
- Spotify Embed에서 로그아웃·Free·Premium 사용자가 각각 무엇을 듣는지(30초 미리듣기 대 전곡) 공식 문서로 확인하지 못했다. Embeds Terms of Use 원문도 열람하지 못했다.
- 확장 쿼터 기준의 "key Spotify markets"에 한국이 포함되는지 확인하지 못했다.
- Hacker News와 The Verge의 반응은 검색 한도 소진으로 수집하지 못했다.

---

## Q2. YouTube — Data API v3 쿼터, IFrame Player API, API Services Terms·Developer Policies, YouTube Music 공개 API 부재

### Takeaway

YouTube IFrame 임베드는 1인 개발자가 무료로 전곡(뮤직비디오)을 합법적으로 재생할 수 있는 사실상 유일한 경로다. 대신 다섯 가지 조건이 붙는다.

1. 보이는 플레이어여야 한다(200×200px 이상, 오버레이 금지).
2. 오디오 분리, 백그라운드 플레이어, 캐시와 오프라인 재생이 금지된다.
3. 검색은 2026-06-01부터 별도 버킷에서 하루 100회로 제한된다.
4. API 데이터는 30일까지만 저장할 수 있다.
5. YouTube Music 공식 공개 API는 없다.

### Cited Findings

#### Data API v3 쿼터(2026-06-01 구조 변경)

- 프로젝트당 하루 10,000 units(전 엔드포인트 합산)에 별도 일일 버킷이 따로 있다. — [YouTube Data API "Quota costs", 날짜 미표기, 2026-11-13 열람](https://developers.google.com/youtube/v3/determine_quota_cost)
  - 별도 버킷: `search.list` 하루 100회, `videos.insert` 하루 100회
  - 호출당 비용: `search.list` 1 unit(자체 버킷), `videos.list` 1, `playlistItems.list` 1, `playlists.insert` 50
  - 리셋: 태평양시 자정
- 2026-06-01 개정 원문: "API calls to the videos.insert and search.list methods will be charged to their own respective quota buckets." — [YouTube Data API Revision History](https://developers.google.com/youtube/v3/revision_history)
- 같은 이력의 기타 변경 — [Revision History](https://developers.google.com/youtube/v3/revision_history)
  - 2025-07-10: `mostPopular` 차트가 "Trending Music, Movies, and Gaming charts" 영상으로 바뀌고 Trending 페이지가 deprecated됐다.
  - 2025-12-04: 업로드 비용이 약 1,600에서 약 100 units로 줄었다.
- 쿼터 증설과 회수 조건(III.D.3, III.D.4) — [Developer Policies](https://developers.google.com/youtube/terms/developer-policies)
  - 증설은 "you can apply for a quota extension by completing an API Compliance Audit"이다.
  - 승인되더라도 "you must use the additional quota granted only for the approved use case."
  - 90일 연속 비활성인 프로젝트는 접근이 축소될 수 있다.

#### Developer Policies(페이지 날짜 미표기, 약관 개정 이력상 최신 개정 2026-06-01, 2026-11-13 열람)

- 재생 형태 제한 — [YouTube API Services Developer Policies](https://developers.google.com/youtube/terms/developer-policies)
  - III.I.7: "separate, isolate, or modify the audio or video components of any YouTube audiovisual content" 금지
  - III.I.8: 오디오나 비디오 구성요소를 따로 홍보하는 것 금지
  - III.I.9: "create, include, or promote features that play content, including audio or video components, from a background player" 금지. 여기서 background player는 사용자가 보고 있는 페이지·탭·화면에 표시되지 않는 플레이어를 뜻한다.
- 플레이어 기능을 수정·차단하는 것(III.I.6)과 플레이어 안의 링크를 가리는 것(III.I.4)은 금지다. — [같은 문서](https://developers.google.com/youtube/terms/developer-policies)
- 콘텐츠 저장 금지(III.E.1): "download, import, backup, cache, or store copies of YouTube audiovisual content without YouTube's prior written approval"과 "make content available for offline playback"이 금지된다. — [같은 문서](https://developers.google.com/youtube/terms/developer-policies)
- API Data 저장(III.E.4) — [같은 문서](https://developers.google.com/youtube/terms/developer-policies)
  - Non-Authorized Data는 "not longer than 30 calendar days" 동안만 저장할 수 있다.
  - 기타 Authorized Data도 "for no longer than 30 calendar days"다.
  - 저장한 데이터를 최신 상태와 맞추도록 노력해야 하고, 사용자 화면에는 가장 최신 API Data를 표시해야 한다.
- 다른 소스의 결과를 YouTube 검색 결과처럼 섞어 보여주는 것은 금지다(III.C.5). — [같은 문서](https://developers.google.com/youtube/terms/developer-policies)
- 상업적 이용 — [같은 문서](https://developers.google.com/youtube/terms/developer-policies)
  - 허용(III.G.2): API Client 판매, 광고가 붙는(ad-enabled) 블로그·웹사이트
  - 사전 서면 승인 필요(III.G.1.b–c): YouTube 콘텐츠나 플레이어 위·안에 광고와 스폰서십을 판매하는 것
  - 조건부 금지(III.G.1.d): YouTube API Data가 있는 페이지의 광고 판매는 "unless other data, content, or material not obtained from YouTube appears on the same page"인 경우에만 허용되고, 그 콘텐츠가 독립적 가치를 가져야 한다.
- III.I.1: "create, offer, or act as a substitute for, or substantially similar service to, any YouTube Applications" 금지. 상당한 독립적 가치가 없는 한 YouTube의 핵심 사용자 경험을 재현할 수 없다. — [같은 문서](https://developers.google.com/youtube/terms/developer-policies)

#### Required Minimum Functionality(RMF)·IFrame Player API

- 크기: "Embedded players must have a viewport that is at least 200px by 200px." 컨트롤을 표시하면 컨트롤 전체가 보이는 크기여야 하고, 16:9 플레이어는 480×270을 권장한다. — [IFrame Player API reference](https://developers.google.com/youtube/iframe_api_reference), [Required Minimum Functionality](https://developers.google.com/youtube/terms/required-minimum-functionality)
- RMF의 화면·조작 규칙 — [RMF, 날짜 미표기, 2026-11-13 열람](https://developers.google.com/youtube/terms/required-minimum-functionality)
  - 오버레이: "You must not display overlays, frames, or other visual elements in front of any part of a YouTube embedded player"
  - 자동재생: "must not initiate an automatic playback until the player is visible and more than half of the player is visible"
  - 동시 자동재생: "A page or screen must not have more than one YouTube player that automatically plays content simultaneously"
  - 썸네일: 재생을 시작하는 썸네일은 120×70px 이상이어야 한다.
  - mouseover나 touch로 사용자 대신 동작을 시작할 수 없다.
  - "You must not make changes to the YouTube player that are not explicitly described by the API documentation."
- 클라이언트 식별 — [RMF](https://developers.google.com/youtube/terms/required-minimum-functionality), [IFrame API](https://developers.google.com/youtube/iframe_api_reference), [YouTube API Services Terms revision history](https://developers.google.com/youtube/terms/revision-history)
  - API Client는 `HTTP Referer`로 자신을 식별해야 하고 `noreferrer`를 쓰면 안 된다.
  - 지키지 않으면 플레이어 기능이 축소될 수 있다. IFrame API 오류 153은 Referer나 식별 정보가 빠졌다는 뜻이다.
  - 이 요구사항은 2025-07-07에 RMF의 "API Client Identity and Credentials" 항목으로 추가됐다.
- 브라우저는 사용자 상호작용 없는 unmuted 재생을 차단할 수 있다. `playVideo` 같은 스크립트 재생도 대상이다(onAutoplayBlocked 이벤트). — [IFrame Player API reference](https://developers.google.com/youtube/iframe_api_reference)

#### 최근 약관 개정(YouTube API Services) — [Terms revision history](https://developers.google.com/youtube/terms/revision-history)

- 2026-05-04 추가, 2026-06-01 명확화: 감사를 통과한 분석 용도 개발자는 파생 지표를 만들거나 통계 데이터를 30일 넘게 저장할 수 있는 정책(III.L)이 생겼다. 신청은 2026-06-01부터 쿼터 증설 양식으로 받는다.
- 2025-01-23: Android Player API 언급이 삭제됐다. 이 API는 2023년에 deprecated됐다.
- 개정 이력에 백그라운드 재생이나 오디오 전용 재생에 관한 신규 개정은 없다.

#### YouTube Music 공개 API 부재

- ytmusicapi 문서는 스스로를 "Unofficial API for YouTube Music"이라고 소개한다. 웹 클라이언트 요청을 에뮬레이션하는 방식이고 "not supported nor endorsed by Google"이다. — [ytmusicapi 문서](https://ytmusicapi.readthedocs.io/en/stable/)

### Inferences

- **VIBR 코드와 맞닿는 지점(백그라운드 재생 위험):** YouTube iframe 컨테이너는 `apps/web/src/components/player/nowPlaying/NowPlayingCoverPlayback.tsx`에 있는 `max-w-55 aspect-square` 박스(약 220px)다. 이 박스를 감싸는 `apps/web/src/components/player/RightPanel.tsx` 섹션은 모바일(lg 미만)에서 전체 플레이어를 닫으면 `hidden` 클래스가 붙는다(`'hidden lg:flex ...'`).
  - 이 상태에서 MiniPlayerBar로 재생이 계속된다면 III.I.9의 "background player"(보이지 않는 플레이어)에 해당할 소지가 있다. [확인 필요: display:none 상태의 iframe에서 재생이 이어지는지, 실제 UX 흐름]
  - 데스크톱에서도 우측 패널을 리사이즈해 플레이어가 200px 미만으로 줄어들지 않는지 확인이 필요하다.
- **검색 쿼터 병목:** 서버 프록시(`apps/web/app/api/youtube-search/route.ts`)는 단일 서버 키(`process.env.YOUTUBE_SEARCH_API_KEY`)로 `https://www.googleapis.com/youtube/v3/search`를 호출한다(2026-11-13 코드 확인). 따라서 캐시가 없다면 전체 사용자가 프로젝트 하나의 하루 100회 검색 버킷을 나눠 쓴다. 현실적인 대응 순서는 다음과 같다.
  1. iTunes 검색으로 곡을 먼저 찾는다.
  2. 사용자가 YouTube URL을 붙여넣으면 `videos.list`(1 unit, 일반 10,000 버킷)로 처리한다.
  3. 그래도 부족하면 감사를 받아 증설을 신청한다.
- **30일 저장 규정:** 게시글에 YouTube 제목과 썸네일을 영구 저장하는 구조라면 주기적 갱신이 필요할 수 있다. [불확실: 영상 ID 같은 식별자에 대한 예외 조항은 확인하지 못함]
- **수익화:** 게시글과 댓글처럼 YouTube 외 콘텐츠가 독립적 가치를 가지면 페이지 광고는 가능해 보인다. 플레이어 위나 안에 광고를 거는 것은 승인 없이 불가다. [정책 검토 필요]
- **리스닝 룸:** 동기 재생을 명시적으로 금지하는 조항은 없다. 다만 다음 이유로 동기화 정확도가 떨어지므로 "제한적으로 가능"으로 본다.
  - 각 참가자 기기에 플레이어가 보여야 한다.
  - 자동재생은 RMF 조건과 브라우저 정책 때문에 사용자 제스처가 필요하다.
  - 광고가 참가자마다 다르게 나온다.
- **III.I.1(대체 서비스 금지):** "YouTube 음악 플레이어 클론"으로 보이면 위험하다. 소셜 큐레이션과 사람 기반 추천이 "significant independent value"를 주장할 근거다.

### Gaps

- 영상 ID 등 식별자가 30일 저장 규정의 예외인지 확인하지 못했다(Developer Policies 전문 미대조).
- API Compliance Audit의 소요 기간과 소규모 앱의 승인 가능성에 대한 데이터를 찾지 못했다.
- display:none 상태의 iframe 재생 지속, 모바일 PWA에서 화면 잠금 시 재생 같은 브라우저별 동작을 검증하지 못했다.
- Google 공식 문서에서 "YouTube Music API 없음"을 명시한 페이지는 찾지 못했다. 비공식 라이브러리의 자기 서술로만 확인했다.

---

## Q3. Apple — Apple Music API·MusicKit JS(비용·토큰·구독자 전용 재생·미리듣기), iTunes Search API(rate limit, 30초 미리듣기·아트워크 허용 범위)

### Takeaway

iTunes Search API는 무료이고 분당 약 20회까지 호출할 수 있다. 다만 30초 미리듣기와 아트워크는 "스토어 콘텐츠 홍보"용으로만 허용된다. 스토어 배지 근처에 두고, "provided courtesy of iTunes"를 표기하고, 스트리밍만 할 뿐 캐시하면 안 된다. VIBR처럼 피드나 큐에서 미리듣기를 연속 재생하는 방식은 회색지대다.

MusicKit JS와 Apple Music API는 연 99달러의 개발자 프로그램 가입이 필요하다. 사용자의 Apple Music 구독 접근을 돕는 용도로만 쓸 수 있다. 수익화(광고, 유료화, 사용자 정보 요구), 다른 콘텐츠와의 동기화, 재생과 분리된 아트·텍스트 사용은 금지다.

### Cited Findings

#### iTunes Search API(Apple Services Performance Partners, 페이지 푸터 © 2022, 2026-11-13 열람)

- 원문: "The Search API is limited to approximately 20 calls per minute (subject to change)." — [iTunes Search API](https://performance-partners.apple.com/search-api)
- 용도 제한 — [같은 문서](https://performance-partners.apple.com/search-api)
  - "only to promote store content and not for entertainment purposes"
  - 샘플 등은 "must be proximate to a store badge"
  - Promo Content는 해당 콘텐츠를 홍보하는 페이지에만, "Download on iTunes" 같은 배지 근처에 두어야 한다.
  - 음악 미리듣기에는 "provided courtesy of iTunes"를 표기해야 한다.
  - "is streamed only, and not downloaded, saved, cached, or synchronized with video"
  - "is not used for independent entertainment value apart from its promotional purpose"
  - Apple이 요청하면 즉시 삭제해야 한다. 준거법은 캘리포니아법이다.
- 제휴(affiliate) 가입은 명시적 필수 조건이 아니다. 수수료를 받으려면 파트너 링크를 올바르게 인코딩해야 한다. — [같은 문서](https://performance-partners.apple.com/search-api)

#### Apple Music API·MusicKit JS(Apple Developer Program License Agreement, 2026-11-13 열람, 버전 날짜 미확인)

- 정의(1.2): MusicKit APIs는 "enable Apple Music users to access their subscription"이다. MusicKit JS는 "enables Apple Music users to access their subscription through Your Applications, websites, or web applications"이다. — [Apple Developer Program License Agreement](https://developer.apple.com/support/terms/apple-developer-program-license-agreement/)
- 3.3.6(D) 본문 — [같은 문서](https://developer.apple.com/support/terms/apple-developer-program-license-agreement/)
  - 사용자의 Apple Music 구독 접근을 돕는 목적과 무관한 호출은 금지된다.
  - Apple Music Identity Guidelines를 따라야 한다.
  - 원문: "You agree not to require payment for or indirectly monetize access to the Apple Music service (e.g. in-app purchase, advertising, requesting user info)"
- 3.3.6(D)의 세부 항목 — [같은 문서](https://developer.apple.com/support/terms/apple-developer-program-license-agreement/)
  - 재생: 재생을 제공한다면 "full songs must be enabled for playback, and users must initiate playback"이어야 하고 표준 컨트롤(play/pause/skip)을 제공해야 한다.
  - 다운로드·업로드·수정 금지: "MusicKit Content cannot be synchronized with any other content, unless otherwise permitted by Apple in the Documentation"
  - 아트·텍스트: "album art and music-related text from the MusicKit API may not be used separately from music playback or managing playlists"
  - 사용자 메타데이터(플레이리스트, 즐겨찾기): 명확히 고지했고 앱과 직접 관련된 기능에만 쓸 수 있다.
  - MusicKit JS: 다른 JavaScript와 재결합하거나 재호스팅할 수 없다.
- 3.3.6(F) Apple Music Feed API 프리뷰 — [같은 문서](https://developer.apple.com/support/terms/apple-developer-program-license-agreement/)
  - "streamed only, and not downloaded, saved, cached, or synchronized with video"
  - Apple Music으로 직접 연결되는 배지 근처에 두어야 한다.
  - "provided courtesy of Apple Music"을 표기해야 한다.
- 비용: Apple Developer Program은 "$99 annual membership"이다. — [Apple Developer Program](https://developer.apple.com/programs/)
- 비Apple 플랫폼(웹)에서는 MusicKit 개발자로 등록한 뒤 private key로 developer token을 생성한다. [검색 요약 기준] — [WWDC22 "Meet Apple Music API and MusicKit"](https://developer.apple.com/videos/play/wwdc2022-10148)
- 2026년 7월 Apple 포럼에 질문이 올라왔다. "공유 청취 웹앱(각자 자기 구독으로 같은 곡을 재생하고 서버는 곡 ID와 위치만 중계)이 3.3.6(D)의 'synchronized' 금지에 해당하는가"라는 질문이다. Apple 직원 답변은 없다(답변 0개, 열람 시점 기준). — [Apple Developer Forums thread 838157](https://developer.apple.com/forums/thread/838157)

### Inferences

- **VIBR의 현재 iTunes 미리듣기 사용은 회색지대다.** 현재 피드와 큐에서 30초를 연속 재생한다. 문제가 되는 조건은 "not for entertainment purposes"와 "independent entertainment value 금지"다. 최소한 다음 조치가 필요하다. [정책 검토 필요]
  - 미리듣기 옆에 스토어 배지와 링크를 둔다.
  - "provided courtesy of iTunes"를 표기한다.
  - 캐시와 다운로드를 하지 않는다.
  - 큐 자동 연속 재생처럼 엔터테인먼트 성격이 강한 사용을 줄인다.
- **rate limit:** 분당 20회는 서버에서 호출하면 병목이다. VIBR는 `apps/web/src/api/itunes/`에서 브라우저가 직접 호출하므로 호출이 사용자 IP별로 분산될 가능성이 크다. [불확실: 한도가 IP 기준인지 확인하지 못함]
- **MusicKit 경로는 VIBR 구조와 충돌 소지가 크다.** 비용은 연 99달러이고, 전곡은 구독자만 들을 수 있다. 수익화 금지 예시에 "requesting user info"까지 들어 있다. 여기에 다른 콘텐츠와의 동기화 금지가 더해지면 YouTube·iTunes 혼합 플레이어, 광고 모델, 리스닝 룸 모두 충돌할 수 있다. 현실적인 범위는 Apple Music 구독자에게 "내 Apple Music 라이브러리에 담기" 같은 보조 기능을 주는 정도다.
- **앨범아트 출처에 따라 규칙이 다르다.** MusicKit에서 받은 앨범아트를 재생과 분리해 피드 카드 장식으로만 쓰면 3.3.6(D)에 걸린다. iTunes Search API에서 받은 아트는 홍보 목적 조건을 따른다.

### Gaps

- MusicKit JS나 Apple Music API로 비구독자에게 30초 프리뷰를 재생하는 것이 허용되는지, 그 조건을 공식 문서로 확인하지 못했다.
- DPLA의 버전 날짜, Apple Music Identity Guidelines 원문, 한국 원화 가격을 확인하지 못했다.
- iTunes Search API 약관이 2022년 이후 개정됐는지 알 수 없다(페이지 날짜 표기가 2022). rate limit의 기준(IP인지 앱인지)도 미확인이다.

---

## Q4. 기타 API — Deezer, SoundCloud, Last.fm, MusicBrainz·ListenBrainz, Discogs, 가사(Genius·Musixmatch), Odesli·song.link, TIDAL, Audius, Jamendo·FMA, 오디오 분석 대안(Essentia·Cyanite·ReccoBeats)

### Takeaway

2025–2026년에 "개인 개발자에게 열린 문"이 전반적으로 좁아졌다.

- Deezer는 2025년에 개인의 신규 API 접근을 중단했다.
- SoundCloud는 유료 Artist Pro 구독자만 앱을 등록할 수 있고, 다른 서비스 콘텐츠와 섞어 스트리밍하는 것을 금지한다.
- Odesli는 키 없는 공개 API가 2026-11-13 직접 확인 결과 401을 반환한다.

아직 열려 있는 곳은 다음과 같다.

- Last.fm(비상업 용도만)
- ListenBrainz(오픈 데이터, 초당 1회)
- Audius(무료 플랜)
- Jamendo(비상업)

가사는 유료 라이선스가 필요하다. Spotify 오디오 특징의 대안은 셋 중 하나다: 약관이 불명확한 무료 서비스(ReccoBeats), 비상업 라이선스 오픈소스(Essentia), 유료 B2B(Cyanite). 어느 쪽이든 메이저 곡 음원에 합법적으로 접근할 방법이 없다는 근본 제약은 그대로다.

### Cited Findings

#### Deezer

- 2025-10-19 Deezer Community Manager의 공지 원문: "Too many abuses and misappropriations of the possibilities offered by our API, contrary to our Terms & Conditions ... have unfortunately led us to disable the possibility of creating new accesses ... enabling the use of our API by private individuals." 복구 시점은 밝히지 않았다. — [Deezer Community 스레드 "api auth impossible"](https://en.deezercommunity.com/features-feedback-44/api-auth-impossible-80857)
- 2025-06-18 비직원 Superuser는 "Deezer API was disabled for the time being"이라고 썼다. 2026-03-09 사용자 글까지 해결 소식은 없다. — [같은 스레드](https://en.deezercommunity.com/features-feedback-44/api-auth-impossible-80857)
- 상충: Deezer 개발자 FAQ는 여전히 OAuth와 앱 등록 방법을 설명한다. [검색 요약 기준] — [Deezer FAQs For Developers](https://support.deezer.com/hc/en-gb/articles/360011538897-Deezer-FAQs-For-Developers)
- B2B 통합 플랫폼 "Deezer for Business" 개편 보도가 있다. [헤드라인만 확인, 날짜 미확인] — [Music Business Worldwide](https://www.musicbusinessworldwide.com/deezer-launches-revamped-deezer-for-business-platform-bringing-partnerships-advertising-ai-detection-licensing-and-more-under-one-roof/)

#### SoundCloud

- 앱 등록 조건 원문: "You need a SoundCloud Artist Pro subscription to register API applications and receive credentials." CLI나 웹에서 셀프서비스로 등록하며, 페이지에 날짜는 없다. — [SoundCloud "Register an app"](https://developers.soundcloud.com/docs/api/register-app)
- 과거 경위: 2016-09-23부터 신청·심사제였다. — [SoundCloud 블로그 "API Sign-up Changes", 2016-09-23](https://developers.soundcloud.com/blog/api-sign-up-changes)
- API Terms of Use(2024-03-30 시행) — [SoundCloud API Terms of Use](https://developers.soundcloud.com/docs/api/terms-of-use)
  - 업로더와 SoundCloud를 크레딧으로 표시하고 soundcloud.com으로 백링크해야 한다.
  - "Your app must not include file-save functionality." 캐시는 세션 단위만 허용되고 오프라인 재생은 금지다.
  - 일부 상업적 이용은 허용된다. 다만 "any app that features any advertising, sponsorship or promotion around User Content"는 금지다. SoundCloud에서 이미 가능한 기능을 인앱 결제로 파는 것도 금지다.
  - AI 학습이나 입력, 핑거프린트 생성은 금지다.
  - "any service that aggregates and streams User Content from multiple users into an on-demand listening service" 금지
  - "any playback experience which aggregates and streams User Content with content from other services" 금지
  - 이용료: "Access to the SoundCloud API is currently provided free of charge"

#### Last.fm(효력일 미표기, 2026-11-13 열람) — [Last.fm API Terms of Service](https://www.last.fm/api/tos)

- 상업적 이용
  - 3.1: "You are permitted to use the Last.fm Data solely for non-commercial purposes"
  - 3.2: 상업적으로 쓰려면 commercial use agreement를 신청해야 한다. 계약 없이 상업적으로 쓰면 접근이 즉시 해지될 수 있다.
- 한도와 캐싱
  - 4.4: 호출 한도는 공개되지 않으며 Last.fm 재량이다.
  - 4.3.4: HTTP 헤더에 맞춰 캐싱해야 하고, "Reasonable Usage Cap"은 100MB다.
- 출처 표기와 사용자 데이터
  - 출처 표기("powered by AudioScrobbler" 버튼과 링크)가 필요하고, 배치는 Last.fm 승인을 받아야 한다.
  - 5.1.6: 사용자를 식별하거나 연락하는 목적으로 쓸 수 없다.
  - 2.3: 유럽경제지역(EEA) 밖에서 쓰려면 별도 조건이 붙는다.

#### ListenBrainz·MusicBrainz

- ListenBrainz API — [ListenBrainz API 문서](https://listenbrainz.readthedocs.io/en/latest/users/api/index.html)
  - 호출 규칙: "never make more than ONE call per second." rate limit 헤더(`X-RateLimit-*`)가 있고 초과하면 429를 받는다.
  - 유효한 User-Agent가 필수이며, 없으면 차단될 수 있다.
  - 계정 작업에는 사용자 토큰이 필요하다.
  - 제공 범주: User history exports, Statistics, Popularity, Recommendations, Social, Player 등
- 추천 API: `GET /1/cf/recommendation/user/(mb_username)/recording`은 협업 필터링으로 만든 녹음(recording) MBID와 점수를 돌려준다. 문서에 "experimental"로 표시돼 있고, 추천이 아직 생성되지 않았으면 204를 반환한다. 피드백 제출과 삭제 API도 있다. — [ListenBrainz Recommendation API](https://listenbrainz.readthedocs.io/en/latest/users/api/recommendation.html)
- Spotify 청취를 자동 기록하는 기능을 지원하며, 최근 기록이 중복될 수 있다는 경고가 붙어 있다. [검색 요약 기준] — [ListenBrainz "Adding your data"](https://beta.listenbrainz.org/add-data)
- 청취 데이터가 오픈 라이선스로 공개된다는 서술이 있다. [2차 출처, 공식 라이선스 원문은 미확인] — [ListenBrainz(위키 미러)](https://kaweah.freedombox.rocks/kiwix/wikipedia_en_all_maxi_2023-10/ListenBrainz)

#### Odesli·song.link

- **2026-11-13 직접 호출 결과(본 조사):** 키 없이 `GET https://api.song.link/v1-alpha.1/links?url=<Apple Music URL>`을 호출하면 HTTP 401과 `{"statusCode":401,"code":"PUBLIC_API_ACCESS_DEPRECATED"}`가 반환된다. 같은 현상이 2026-10-03에 제3자 패키지에서 보고됐다. [검색 요약 기준] — [Packagist omnisong/odesli](https://packagist.org/packages/omnisong/odesli)
- 구 문서는 "인증 불필요, 키가 있으면 더 높은 한도, 키는 이메일로 발급"이라고 설명한다. 키 없는 한도는 분당 10회라는 2차 출처가 있다. [Notion 본문 열람 실패, 검색 요약 기준] — [Songlink API 문서(Notion)](https://linktree.notion.site/API-d0ebe08a5e304a55928405eb682f6741)
- 키는 developers@song.link로 이메일을 보내 요청한다. — [npm odesli.js](https://www.npmjs.com/package/odesli.js)

#### TIDAL

- TIDAL Developer Platform은 "APIs, tools, code and documentation" 묶음이다. — [TIDAL Support "Tidal for Developers"](https://support.tidal.com/hc/en-us/articles/23052303648529-Tidal-for-Developers)
- 2024-01에 공개된 "TIDAL SDK for Web"은 웹앱이 "TIDAL preview tracks"를 재생할 수 있게 한다. [검색 요약 기준] — [tidal-music GitHub Discussion #40](https://github.com/orgs/tidal-music/discussions/40)
- 2차 카탈로그에 따르면 `openapi.tidal.com/v2`가 JSON:API 형식으로 카탈로그, 추천, 플레이리스트, 검색, playback manifest를 제공한다. [불확실] — [API Evangelist TIDAL](https://github.com/api-evangelist/tidal)

#### Audius

- API Plans 페이지에서 "Create API Key"를 누르면 API Key와 Bearer Token이 발급된다. Free 플랜(문서상 제한 없음)과 Unlimited 플랜이 있다. [검색 요약 기준] — [Audius SDK README(@audius/sdk 15.3.1)](https://cdn.jsdelivr.net/npm/@audius/sdk@15.3.1/README.md), [Audius SDK 문서](https://docs.audius.org/sdk)

#### Jamendo·Free Music Archive

- Jamendo API는 비상업 용도면 무료다. 광고나 제휴 수익을 포함한 상업적 이용은 Jamendo 라이선싱 팀의 견적을 받아야 한다. 약관의 최종 수정 표기는 2013년이다. 곡마다 CC 라이선스가 다르고 NC 조건이 붙은 곡도 있다. [검색 요약 기준] — [Jamendo API Terms of Use](https://devportal.jamendo.com/api_terms_of_use), [Jamendo CC 설명](https://support-artist.jamendo.com/creative-commons-explained)
- Free Music Archive는 2018년 11월 종료를 발표했고 2019년 Tribe of Noise에 인수됐다. API 중단은 2차 출처로만 확인했다. [불확실] — [Wikipedia: Free Music Archive](https://en.wikipedia.org/wiki/Free_Music_Archive)

#### 가사(Musixmatch·Genius)

- Musixmatch 무료 개발자 플랜은 가사 일부(약 30%)만 준다. 전체 가사, 싱크 가사, 상업적 이용은 유료 라이선스이고 엔터프라이즈는 맞춤 견적이다. [2차 출처만 있음, 불확실] — [apis.io Musixmatch](https://apis.io/providers/musixmatch/)
- Genius 문서(docs.genius.com)는 열람이 차단됐다. Gaps에 기록했다.

#### 오디오 분석 대안

- ReccoBeats
  - acousticness, danceability, energy, instrumentalness, liveness, loudness, speechiness, tempo, valence를 카탈로그 트랙이나 업로드한 오디오에서 추출한다. — [ReccoBeats 문서 "Audio Feature Extraction"](https://reccobeats.com/docs/documentation/Analysis/audio-features-extraction)
  - API 키가 필요 없고 무료라는 디렉터리 서술이 있다. [불확실] — [apis.io ReccoBeats](https://apis.io/apis/reccobeats/reccobeats-audio-features-api/)
  - R 패키지 taylor가 Spotify track ID로 조회하는 래퍼를 제공한다. — [taylor 문서](https://rdrr.io/cran/taylor/man/get_reccobeats_audio_features.html)
- Essentia
  - 라이브러리는 Affero GPLv3이고 원문은 "for non-commercial applications"다. 상업용은 UPF MTG에서 별도 라이선스를 받는다.
  - 사전학습 모델 원문: "All the models are available under the CC BY-NC-SA 4.0 license." 요청하면 proprietary 라이선스를 받을 수 있다.
  - 출처 — [Essentia Licensing](https://essentia.upf.edu/licensing_information.html)
- Cyanite
  - 무드, 장르, 악기, 템포, 가사 테마 태깅과 유사도·자유문장 검색을 제공한다. 검색 쿼리는 무제한이고 Advanced Search는 API 전용 애드온이다. 가격은 계산기로 안내한다. — [Cyanite 블로그](https://cyanite.ai/blog/music-api-comparison/)
  - 제3자 추정 가격은 서로 엇갈린다(Free 월 100 tags, $19/월부터 등). [불확실] — [aichief](https://aichief.com/ai-tools/cyanite-ai/), [Dataconomy](https://dataconomy.com/?p=89051)
- Spotify 오디오 특징 스크레이퍼(비공식, 1,000건당 $3.99)도 있다. 약관 위반 위험이 있다. [검색 요약 기준] — [Apify](https://apify.com/musicae/spotify-audio-features-scraper)

### Inferences

- **공통 흐름:** "AI·자동화 남용"을 이유로 개인 개발자 접근을 축소하는 움직임이 이어지고 있다(Spotify 2026-02, Deezer 2025-10, Odesli 키 필수화, SoundCloud 유료 구독자 한정). 피벗할 때 외부 API에 의존하는 기능은 "언제든 닫힐 수 있는 문"으로 보고 설계해야 한다. 핵심 가치는 자체 데이터(소셜 그래프)에 두는 편이 안전하다.
- **SoundCloud:** VIBR의 혼합 플레이어와 정면으로 충돌한다(타 서비스와 함께 스트리밍 금지, User Content 주변 광고 금지). 넣지 않는 것이 맞다.
- **열린 데이터원:** ListenBrainz와 MusicBrainz는 "청취 기록과 추천 보조"에 쓸 수 있지만 초당 1회 한도에 맞춘 배치·큐 설계가 필요하다. Last.fm은 비상업 단계에서만 쓸 수 있다.
- **Audius·Jamendo:** 전곡 스트리밍과 백그라운드 재생까지 가능한 몇 안 되는 카탈로그다. 다만 메이저 곡과 K-pop이 사실상 없을 가능성이 커서 한국 대중 사용자 수요와는 맞지 않을 수 있다. [추론, 카탈로그 구성 미검증]
- **오디오 특징:** 메이저 곡 음원에 합법적으로 접근할 수 없다(iTunes 프리뷰 다운로드·캐시 금지). 그래서 Essentia와 Cyanite는 권리를 확보한 카탈로그(인디, CC)에만 현실적이다. ReccoBeats는 무료지만 약관과 지속성이 불명확하므로 핵심 기능을 의존시키는 것은 권하지 않는다.

### Gaps

- MusicBrainz의 rate limit과 상업적 이용 조건(라이브 데이터 피드, 지원자 등급)은 공식 페이지가 봇 차단(Anubis)으로 열리지 않아 확인하지 못했다.
- Discogs API의 rate limit과 약관은 developers 페이지가 403을 반환해 확인하지 못했다.
- Genius API가 가사를 제공하지 않는다는 점을 공식 문서로 확인하지 못했다(열람 차단).
- TIDAL의 2025–2026년 웹 재생 SDK 범위(전곡 여부)와 Developer Terms를 확인하지 못했다.
- Audius의 약관과 스트리밍 조건, ReccoBeats의 약관과 rate limit, Cyanite와 Musixmatch의 공식 가격을 확인하지 못했다.
- AcousticBrainz 종료(2022)에 대한 공식 출처를 수집하지 못했다. SoundCloud Artist Pro 가격과 셀프서비스 등록 도입 시점도 확인하지 못했다.
- ListenBrainz 데이터 라이선스(CC0 여부)와 추천 결과의 상업적 이용 조건을 공식 원문으로 확인하지 못했다.

---

## Q5. 법적·라이선스 경계 — 임베드 대 호스팅, 30초 미리듣기, 앨범아트, 가사, 사용자 업로드, 임베드 기반 "함께 듣기", 한국 특이사항(징수규정·음저협)

### Takeaway

"각 플랫폼 공식 플레이어 임베드·링크" 구조는 음원을 직접 호스팅하는 것보다 법적 위험이 훨씬 낮다. 그러나 대법원 2021년 전원합의체 판결에 따르면, 침해물로 연결되는 링크를 영리적이고 계속적으로 게시하면 공중송신권 침해 방조가 될 수 있다. 따라서 비공식 업로드를 신고·삭제하는 체계가 필요하다.

음원을 직접 호스팅하거나 스트리밍하려면 세 권리자(작사·작곡 저작권, 실연자, 음반제작자) 모두의 이용허락이 필요하다. 요율은 문체부가 승인하는 징수규정으로 정해지므로 1인 개발자에게는 비현실적이다. 가사 역시 음저협 신탁 관리 대상이다. "30초면 괜찮다"는 법정 안전지대는 확인되지 않았고, 미리듣기는 API 약관이 허용하는 범위에서만 쓸 수 있다.

### Cited Findings

#### 한국 판례: 링크와 방조

- 대법원 2021. 9. 9. 선고 2017도19025 전원합의체 판결의 요지는 두 가지다.
  - 링크 자체는 저작권법상 공중송신(전송)의 구성요건을 충족하지 않는다.
  - 그러나 공중송신권을 침해한 영상물로 연결되는 링크를 자기 사이트에 영리적·계속적으로 게시하면 정범의 공중송신권 침해를 방조한 것이 될 수 있다.

  이로써 링크를 방조로 보지 않던 대법원 2015. 3. 12. 선고 2012도13748 판결의 입장이 바뀌었다. — [법률신문 "2021년 분야별 중요판례분석(26) 엔터테인먼트법"](https://www.lawtimes.co.kr/news/articleView.html?idxno=180983), [법률신문 판례 변경 보도](https://www.lawtimes.co.kr/news/articleView.html?idxno=172826), [법무법인 세종(신&김) 뉴스레터](https://shinkim.com/kor/media/newsletter/1613)

- 후속 판결로 대법원 2021. 11. 25. 선고 2021도10903 판결이 링크 사이트 운영자의 방조를 인정했고, 하급심에서도 실형 선고가 이어졌다. [2차 출처] — [nepla 위키 "링크 행위를 통한 불법 스트리밍 서비스 사건"](https://www.nepla.ai/wiki/지식재산/저작권/링크-행위를-통한-불법-스트리밍-서비스-사건-ov59rpvy6n06)
- 학계에서는 이 판결이 공중송신과 전송, 링크 게시와 링크 사이트 운영을 구별하지 않았다고 비판한다. [검색 요약 기준] — [교보 스콜라 논문](https://scholar.kyobobook.co.kr/article/detail/4010028673632)

#### 한국 음악 사용료 구조

- 2012-06-08 문체부 보도자료 "문화부, 음악저작권 3단체 음악전송 사용료 규정 승인"의 내용은 다음과 같다. 수치는 모두 2012년 기준이며 현행 요율이 아니다. — [문화체육관광부 보도자료, 2012-06-08](https://www.mcst.go.kr/kor/s_notice/press/pressView.jsp?pSeq=12149)
  - 권리자 구성: 저작권자(작사·작곡가, 한국음악저작권협회), 실연자(한국음악실연자연합회), 음반제작자(한국음원제작자협회)
  - 스트리밍 종량제 요율: "스트리밍 종량제 상품의 경우 세 권리자가 받게 될 사용료의 합계는 1회당 7.2원"(저작권자 1.2원, 실연자 0.72원, 제작자 5.28원)
  - 홍보 예외: "홍보나 판촉을 목적으로 소비자에게 음원을 무료로 제공하는 경우"에는 최소한의 관리비용만 내고 사용료를 면제받을 수 있다.
- 신탁단체는 사용료 요율이나 금액을 징수규정에 반영해 문체부 승인을 받아야 한다. 다만 법원은 OTT 사건에서 징수규정이 기준일 뿐 실제 계약에서는 당사자가 달리 정할 수 있다고 봤다. [검색 요약 기준] — [신&김 뉴스레터 PDF](https://shinkim.com/kor/media/newsletter/pdf/2775)
- 한국음악저작권협회 저작권 신탁계약약관(2017-04-13 변경본)은 작사자·작곡자·편곡자·음악출판자의 저작권을 신탁받아 관리하는 계약을 정한다. 따라서 가사(작사)도 음저협 관리 대상이다. — [한국저작권위원회 게재 PDF(음저협 신탁계약약관)](https://www.copyright.or.kr/master/file/displayPdf.do?fileNo=39515)
- 2026-03 보도에 따르면 방송사와 PP 사이에 사용료 정산 기준 논란이 있다. 신임 음저협 회장은 창작자에게 불리한 규정을 개정하겠다고 밝혔다. 징수규정이 계속 바뀔 수 있다는 신호다. — [머니투데이방송, 2026-03-10](https://news.mtn.co.kr/news-detail/2026031016410826064)

#### 플랫폼 약관이 정하는 경계(앞 절 재인용)

- 30초 미리듣기
  - iTunes: 홍보 목적으로만, 스토어 배지 근처에, 스트리밍만 하고 캐시·다운로드·영상 동기화 금지 — [iTunes Search API](https://performance-partners.apple.com/search-api)
  - Apple Music Feed: "provided courtesy of Apple Music" 표기, 스트리밍만 — [Apple DPLA 3.3.6(F)](https://developer.apple.com/support/terms/apple-developer-program-license-agreement/)
- 앨범아트·메타데이터
  - Spotify: "only ... in connection with the underlying content", 링크백 필요 — [Spotify Developer Policy](https://developer.spotify.com/policy)
  - Apple MusicKit: 재생이나 플레이리스트 관리와 분리해서 쓸 수 없음 — [Apple DPLA 3.3.6(D)](https://developer.apple.com/support/terms/apple-developer-program-license-agreement/)
- 저장
  - YouTube: 오디오·비디오 다운로드, 캐시, 저장 금지, API 데이터 30일 — [YouTube Developer Policies](https://developers.google.com/youtube/terms/developer-policies)
  - SoundCloud: 파일 저장 기능 금지 — [SoundCloud API Terms](https://developers.soundcloud.com/docs/api/terms-of-use)
- 함께 듣기
  - Spotify: 하나의 소스를 여러 동시 청취자에게 재생하거나 비상호작용 웹캐스팅하는 것을 명시적으로 금지 — [Spotify Developer Policy](https://developer.spotify.com/policy)
  - Apple: "cannot be synchronized with any other content"의 적용 범위가 불명확하고, 2026-07 질문에 답변이 없음 — [Apple Forums 838157](https://developer.apple.com/forums/thread/838157)
  - YouTube: 명시적 조항 없음(RMF와 정책 원문에서 동기화 관련 규정을 찾지 못함) — [RMF](https://developers.google.com/youtube/terms/required-minimum-functionality)

### Inferences

- **임베드와 링크의 위험도:** VIBR가 음원 파일을 저장하거나 전송하지 않고 각 플랫폼의 공식 플레이어(권리 처리된 스트림)만 쓰면, 전송 주체는 플랫폼이다. 2021년 판결도 링크 자체는 전송이 아니라고 봤으므로 직접 책임 위험은 낮다.
  - 다만 사용자들이 비공식·불법 업로드 영상을 반복해서 공유하고 VIBR가 이를 "영리적·계속적으로" 노출하면 방조 위험이 생긴다.
  - 대응책은 공식 채널(아티스트 공식 채널, Topic 채널) 우선 노출, 권리자 신고·삭제 절차, 이용약관 고지다. [변호사 검토 필요]
- **30초 미리듣기:** 법정 "30초 안전지대"는 확인되지 않았다. 2012년 규정의 "홍보·판촉 무료 제공 면제"는 권리자와 계약한 전송 사업자를 전제로 한 것으로 보인다. [추론] 따라서 VIBR가 미리듣기 음원을 직접 호스팅하는 것은 불가하고, API가 제공하는 미리듣기를 약관 범위에서만 써야 한다.
- **가사:** 음저협이 관리하는 저작물이므로 전체 가사를 표시하려면 이용허락이 필요하다. 현실적인 선택지는 외부 가사 페이지로 링크하거나, 유료 라이선스 공급자를 쓰는 것이다. [음저협 및 변호사 확인 필요]
- **사용자 업로드 음원:** 일반 상업 음원은 세 권리자의 전송 이용허락과 OSP 책임이 걸리므로 1인 개발자에게 비현실적이다. 자작곡이나 CC 음원만 허용하더라도 권리 확인과 신고 처리 체계가 필요하다. [변호사 검토 필요]
- **리스닝 룸:** 각 참가자가 플랫폼에서 직접 스트리밍하고 VIBR는 곡 ID와 재생 위치만 중계한다면 VIBR가 공연이나 전송의 주체가 될 가능성은 낮아 보인다. 그러나 국내 판례가 없고 플랫폼마다 약관이 다르다(Spotify 금지, Apple 불명확, YouTube 명시 조항 없음). [변호사 검토 필요]
- **사업자 형태:** 개인이 광고 수익을 내는 순간 Last.fm(비상업 전용), Jamendo(상업 견적), Spotify(SDA 상업적 이용 금지) 등의 "비상업" 조건을 위반할 수 있다. 수익화 시점에 각 약관을 다시 검토해야 한다.

### Gaps

- 저작권법 제102~104조(OSP 책임 제한, 특수한 유형의 OSP 의무) 원문을 확보하지 못했다(국가법령정보센터 열람 실패). 출시 전에 직접 확인해야 한다.
- 현행 음저협 징수규정의 전송·미리듣기·가사 항목 원문을 확보하지 못했다. 2012년 수치와 2017년 약관만 확인했으므로 현행과 다를 수 있다.
- 함께하는음악저작인협회(KOSCAP) 등 복수 신탁단체 체제의 영향을 확인하지 못했다.
- 한국에서 YouTube 공식 임베드(퍼가기)를 저작권상 어떻게 판단하는지에 대한 판례와 유권해석을 찾지 못했다. 2021년 판결은 링크만 다뤘다.
- 청취 기록 수집과 관련한 개인정보보호법상 요건(동의, 보관 기간)은 조사하지 않았다.

---

## Q6. 이 제약 아래에서 불가능하거나 위험해지는 제품 아이디어와 아직 열려 있는 아이디어

### Takeaway

아직 열려 있는 영역은 다음과 같다.

- VIBR 고유의 "사람 기반 큐레이션"(자체 소셜 그래프)
- YouTube 공식 임베드 재생(가시성 조건 준수)
- 오픈 데이터(ListenBrainz, MusicBrainz)
- 비상업 단계의 Last.fm 연동
- CC 음원(Jamendo, Audius)

닫혔거나 위험한 영역은 다음과 같다.

- Spotify 데이터와 재생에 기반한 기능 일체
- 오디오 특징 기반 무드 검색
- 무허가 가사 표시
- YouTube 기반 PWA 백그라운드 재생
- 대규모 크로스 플랫폼 링크 변환(Odesli 키 필수화)

### Cited Findings

- 아래 사실들이 판정을 가르는 근거다.
  - Spotify 개발 모드는 5명 한도에 소유자 Premium이 필요하고, 확장 쿼터는 법인이면서 MAU 25만 이상이어야 한다. — [Spotify Quota modes](https://developer.spotify.com/documentation/web-api/concepts/quota-modes)
  - Spotify 추천과 오디오 특징은 신규 앱에서 차단됐다. — [Spotify 2024-11-27](https://developer.spotify.com/blog/2024-11-27-changes-to-the-web-api)
  - Spotify는 타 서비스 스트림과의 통합과 동시 청취자 대상 재생을 금지한다. — [Spotify Developer Policy](https://developer.spotify.com/policy)
- YouTube는 백그라운드 플레이어와 오디오 분리를 금지하고(III.I.7·III.I.9), 검색은 하루 100회 버킷이다. — [YouTube Developer Policies](https://developers.google.com/youtube/terms/developer-policies), [Quota costs](https://developers.google.com/youtube/v3/determine_quota_cost)
- iTunes 미리듣기는 홍보 목적으로만 쓸 수 있고 캐시가 금지된다. — [iTunes Search API](https://performance-partners.apple.com/search-api)
- MusicKit은 수익화와 동기화를 금지하고 연 99달러가 든다. — [Apple DPLA](https://developer.apple.com/support/terms/apple-developer-program-license-agreement/), [Apple Developer Program](https://developer.apple.com/programs/)
- SoundCloud는 타 서비스와 함께 스트리밍하는 것을 금지하고 Artist Pro 구독자만 앱을 등록할 수 있다. — [SoundCloud API Terms](https://developers.soundcloud.com/docs/api/terms-of-use), [Register an app](https://developers.soundcloud.com/docs/api/register-app)
- Deezer는 개인의 신규 접근을 중단했다. — [Deezer Community](https://en.deezercommunity.com/features-feedback-44/api-auth-impossible-80857)
- Odesli의 키 없는 API는 401 `PUBLIC_API_ACCESS_DEPRECATED`를 반환한다(2026-11-13 직접 확인). Last.fm은 비상업 용도만 허용한다. — [Last.fm API ToS](https://www.last.fm/api/tos)
- Essentia는 비상업 라이선스(AGPLv3, 모델은 CC BY-NC-SA 4.0)다. — [Essentia Licensing](https://essentia.upf.edu/licensing_information.html)

### Inferences

#### API별 요약 매트릭스(2026-11 기준)

| API                                 | 1인 개발자 접근             | 검색·메타데이터                           | 재생                                       | 추천·오디오 특징         | 사용자 청취 기록             | 승인·쿼터                      | 비용                      | 핵심 약관 제약                                                               | 최근 변경                                                         | 출처                                                                                                                                                                                                                                                         |
| ----------------------------------- | --------------------------- | ----------------------------------------- | ------------------------------------------ | ------------------------ | ---------------------------- | ------------------------------ | ------------------------- | ---------------------------------------------------------------------------- | ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Spotify Web API + Web Playback SDK  | 개발 모드만(5명)            | 가능(search limit 10, popularity 등 제거) | Premium 사용자만(SDK)                      | 신규 앱 불가             | 5명 이내만                   | 확장 쿼터: 법인, MAU 25만 이상 | 무료(소유자 Premium 필요) | 타 서비스 통합 금지, 동시 청취 금지, SDA 상업 이용 불가, ML 학습 금지        | 2024-11-27, 2025-05-15, 2026-02-11/03-09, 2026-07(Client ID 25개) | [blog](https://developer.spotify.com/blog/2026-02-06-update-on-developer-access-and-platform-security), [guide](https://developer.spotify.com/documentation/web-api/tutorials/february-2026-migration-guide), [policy](https://developer.spotify.com/policy) |
| Spotify Embeds·iFrame API           | 가능(Client ID 언급 없음)   | –                                         | Embed 위젯(로그아웃 시 재생 범위 [불확실]) | –                        | –                            | 없음                           | 무료                      | Developer Terms 적용, 최소 폭 280px                                          | –                                                                 | [iframe-api](https://developer.spotify.com/documentation/embeds/references/iframe-api), [embeds](https://developer.spotify.com/documentation/embeds)                                                                                                         |
| YouTube Data API v3 + IFrame Player | 가능                        | 가능(검색 하루 100회 버킷)                | 임베드 전곡(보이는 플레이어 필수)          | 없음(mostPopular 차트만) | 불가(YouTube Music API 없음) | 증설은 Compliance Audit        | 무료                      | 200×200px 이상, 오버레이·백그라운드·오디오 분리·캐시 금지, 데이터 30일       | 2026-06-01 쿼터 버킷 분리, 2025-07-07 RMF 식별 요건               | [policies](https://developers.google.com/youtube/terms/developer-policies), [quota](https://developers.google.com/youtube/v3/determine_quota_cost), [RMF](https://developers.google.com/youtube/terms/required-minimum-functionality)                        |
| iTunes Search API                   | 가능(키 없음)               | 가능(분당 약 20회)                        | 30초 프리뷰(홍보 목적만)                   | 없음                     | 없음                         | 없음                           | 무료                      | 배지 근처 배치, "courtesy of iTunes" 표기, 캐시 금지, 엔터테인먼트 목적 금지 | 페이지 © 2022                                                     | [search-api](https://performance-partners.apple.com/search-api)                                                                                                                                                                                              |
| Apple Music API·MusicKit JS         | 가능(유료 회원)             | 가능                                      | 구독자 전곡, 사용자가 재생을 시작해야 함   | 개인 추천 등 [미검증]    | 구독자 [미검증]              | developer token                | 연 99달러                 | 수익화 금지, 동기화 금지, 아트·텍스트 분리 사용 금지                         | 2026-07 공유 청취 질의 무응답                                     | [DPLA](https://developer.apple.com/support/terms/apple-developer-program-license-agreement/), [programs](https://developer.apple.com/programs/)                                                                                                              |
| Deezer                              | 개인 신규 접근 중단         | (기존 공개 엔드포인트 상태 [불확실])      | –                                          | –                        | –                            | –                              | –                         | –                                                                            | 2025-06 중단, 2025-10 확인                                        | [community](https://en.deezercommunity.com/features-feedback-44/api-auth-impossible-80857)                                                                                                                                                                   |
| SoundCloud                          | Artist Pro 구독자만 등록    | 가능                                      | 가능(세션 캐시만)                          | –                        | –                            | 셀프서비스                     | API 무료(구독료 별도)     | 타 서비스와 함께 스트리밍 금지, 주변 광고 금지, AI 금지                      | 약관 2024-03-30                                                   | [terms](https://developers.soundcloud.com/docs/api/terms-of-use), [register](https://developers.soundcloud.com/docs/api/register-app)                                                                                                                        |
| Last.fm                             | 가능                        | 가능                                      | 없음                                       | 유사·태그 [세부 미검증]  | 가능(scrobble)               | 한도 비공개                    | 무료(비상업)              | 비상업 전용, 출처 표기, 사용자 식별 금지, 캐시 100MB                         | 효력일 미표기                                                     | [tos](https://www.last.fm/api/tos)                                                                                                                                                                                                                           |
| ListenBrainz                        | 가능                        | 가능                                      | 없음                                       | CF 추천(experimental)    | 가능(내보내기·통계)          | 초당 1회, User-Agent 필수      | 무료                      | 라이선스 원문 [미확인]                                                       | –                                                                 | [api](https://listenbrainz.readthedocs.io/en/latest/users/api/index.html), [rec](https://listenbrainz.readthedocs.io/en/latest/users/api/recommendation.html)                                                                                                |
| MusicBrainz                         | 가능 [세부 미확인]          | 가능                                      | 없음                                       | 없음                     | 없음                         | [미확인]                       | [미확인]                  | [미확인]                                                                     | –                                                                 | (공식 페이지 봇 차단)                                                                                                                                                                                                                                        |
| Odesli·song.link                    | 키 필요                     | 링크 변환                                 | 없음                                       | 없음                     | 없음                         | 이메일로 키 요청               | [미확인]                  | [미확인]                                                                     | 키 없는 API 종료(2026-11-13 401 확인)                             | [npm](https://www.npmjs.com/package/odesli.js), [packagist](https://packagist.org/packages/omnisong/odesli)                                                                                                                                                  |
| TIDAL                               | 개발자 플랫폼 [세부 미확인] | 가능 [2차]                                | 웹 SDK는 프리뷰(2024-01)                   | 추천 [2차]               | [미확인]                     | [미확인]                       | [미확인]                  | [미확인]                                                                     | –                                                                 | [GitHub #40](https://github.com/orgs/tidal-music/discussions/40)                                                                                                                                                                                             |
| Audius                              | 가능(API 키)                | 가능                                      | 전곡(아티스트 업로드분) [약관 미확인]      | –                        | –                            | Free·Unlimited 플랜            | 무료 플랜                 | [미확인]                                                                     | –                                                                 | [SDK README](https://cdn.jsdelivr.net/npm/@audius/sdk@15.3.1/README.md)                                                                                                                                                                                      |
| Jamendo                             | 가능                        | 가능                                      | 전곡(CC)                                   | –                        | –                            | –                              | 비상업 무료, 상업은 견적  | 곡별 CC(NC 포함)                                                             | 약관 2013                                                         | [terms](https://devportal.jamendo.com/api_terms_of_use)                                                                                                                                                                                                      |
| Musixmatch                          | 가능(제한)                  | 가사 일부(약 30%) [2차]                   | –                                          | –                        | –                            | –                              | 전체 가사는 유료          | 상업·전체 가사는 라이선스                                                    | –                                                                 | [apis.io](https://apis.io/providers/musixmatch/)                                                                                                                                                                                                             |
| ReccoBeats                          | 가능 [약관 미확인]          | –                                         | –                                          | Spotify식 audio features | –                            | [미확인]                       | 무료 [2차]                | [미확인]                                                                     | –                                                                 | [docs](https://reccobeats.com/docs/documentation/Analysis/audio-features-extraction)                                                                                                                                                                         |
| Essentia                            | 가능(오픈소스)              | –                                         | –                                          | 음원이 있으면 로컬 분석  | –                            | –                              | 비상업 무료, 상업은 별도  | AGPLv3, 모델 CC BY-NC-SA 4.0                                                 | –                                                                 | [licensing](https://essentia.upf.edu/licensing_information.html)                                                                                                                                                                                             |
| Cyanite                             | 가능(유료)                  | –                                         | –                                          | 무드 태깅·유사도         | –                            | –                              | 유료(가격 [불확실])       | 음원 업로드 필요                                                             | –                                                                 | [blog](https://cyanite.ai/blog/music-api-comparison/)                                                                                                                                                                                                        |

#### 후보 기능별 실현 가능성(판정: 가능, 제한, 불가)

| 후보 기능                                                | 판정                                          | 이유                                                                                                                                                                                                                                                                                                                                                                                                               | 출처                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| -------------------------------------------------------- | --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **크로스 플랫폼 재생**(한 플레이어에서 여러 서비스 재생) | **제한**                                      | YouTube 임베드와 iTunes 30초 조합은 조건부로 유지할 수 있다(보이는 플레이어 200×200px 이상, 백그라운드 금지, 미리듣기는 홍보 조건). 나머지 경로는 막혀 있다. Spotify SDK는 5명 한도, Premium 필수, 타 서비스 통합 금지(III.5)로 불가다. MusicKit은 연 99달러, 구독자 전용, 다른 콘텐츠와 동기화 금지다. SoundCloud는 "with content from other services" 스트리밍을 금지한다. Deezer는 신규 접근이 중단됐다.        | [YT policies](https://developers.google.com/youtube/terms/developer-policies), [RMF](https://developers.google.com/youtube/terms/required-minimum-functionality), [iTunes](https://performance-partners.apple.com/search-api), [Spotify policy](https://developer.spotify.com/policy), [Apple DPLA](https://developer.apple.com/support/terms/apple-developer-program-license-agreement/), [SC terms](https://developers.soundcloud.com/docs/api/terms-of-use), [Deezer](https://en.deezercommunity.com/features-feedback-44/api-auth-impossible-80857) |
| **청취 기록 가져오기**                                   | **제한**                                      | Last.fm(비상업 전용)과 ListenBrainz(초당 1회)는 가능하다. Spotify는 개발 모드 5명 한도라 공개 서비스로는 불가다. Apple은 MusicKit, 구독자, 99달러가 필요하고 메타데이터를 고지된 기능에만 써야 한다. YouTube Music은 공식 API가 없어 불가다.                                                                                                                                                                       | [Last.fm ToS](https://www.last.fm/api/tos), [ListenBrainz API](https://listenbrainz.readthedocs.io/en/latest/users/api/index.html), [Spotify quota](https://developer.spotify.com/documentation/web-api/concepts/quota-modes), [ytmusicapi](https://ytmusicapi.readthedocs.io/en/stable/)                                                                                                                                                                                                                                                               |
| **취향 매칭**(사용자 간)                                 | **가능**(자체 데이터) / **제한**(외부 데이터) | VIBR 안의 좋아요, 팔로우, 게시 데이터를 쓰면 외부 약관 제약이 없다. Last.fm과 ListenBrainz로 보강할 수 있다(Last.fm은 비상업, 사용자 식별 목적 금지). Spotify의 top items에 의존하면 불가다. Spotify 콘텐츠로 ML을 학습하는 것도 금지다(III.14).                                                                                                                                                                   | [Last.fm ToS](https://www.last.fm/api/tos), [Spotify policy](https://developer.spotify.com/policy)                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| **오디오 특징 기반 무드 검색**                           | **불가**(Spotify) / **제한**(대체 수단)       | Spotify Audio Features와 Analysis는 신규 앱에서 차단됐다. ReccoBeats는 약관과 지속성이 불명확하다. Essentia는 비상업 라이선스이고 음원이 필요하다. Cyanite는 유료이고 음원 업로드가 필요하다. iTunes 프리뷰는 다운로드와 캐시가 금지라 분석용 입수 경로도 없다. 대안인 사용자 태깅 기반 무드(소셜 태그)는 가능하다.                                                                                                | [Spotify 2024-11-27](https://developer.spotify.com/blog/2024-11-27-changes-to-the-web-api), [ReccoBeats](https://reccobeats.com/docs/documentation/Analysis/audio-features-extraction), [Essentia](https://essentia.upf.edu/licensing_information.html), [Cyanite](https://cyanite.ai/blog/music-api-comparison/), [iTunes](https://performance-partners.apple.com/search-api)                                                                                                                                                                          |
| **가사 표시**                                            | **불가**(무허가) / **제한**(유료 라이선스)    | 가사는 음저협 신탁 관리 대상(작사자)이다. Musixmatch는 무료로 약 30%만 주고 전체 가사는 유료 라이선스다(2차 출처). 대안은 외부 가사 페이지 링크다. [변호사·음저협 확인 필요]                                                                                                                                                                                                                                       | [음저협 신탁계약약관 PDF](https://www.copyright.or.kr/master/file/displayPdf.do?fileNo=39515), [apis.io Musixmatch](https://apis.io/providers/musixmatch/)                                                                                                                                                                                                                                                                                                                                                                                              |
| **리스닝 룸·동기 재생**                                  | **제한**                                      | YouTube 임베드로 각자 재생하고 제어 신호만 동기화하는 방식은 명시적 금지 조항이 없다. 다만 각 기기에 보이는 플레이어가 있어야 하고, 사용자 제스처로 재생을 시작해야 하고(자동재생 차단), 광고가 사용자마다 달라 동기 오차가 생긴다. Spotify는 동시 청취자 대상 단일 소스 재생을 금지한다. Apple의 "cannot be synchronized" 적용 범위는 불명확하다(2026-07 질문 무응답). 국내 법리도 미확립이다. [변호사 검토 필요] | [RMF](https://developers.google.com/youtube/terms/required-minimum-functionality), [IFrame API](https://developers.google.com/youtube/iframe_api_reference), [Spotify policy](https://developer.spotify.com/policy), [Apple forum](https://developer.apple.com/forums/thread/838157)                                                                                                                                                                                                                                                                    |
| **PWA 백그라운드 재생**                                  | **불가**(YouTube) / **제한**(그 외)           | YouTube III.I.9는 "play content ... from a background player"를 금지한다(보이지 않는 페이지, 탭, 화면 포함). iTunes 프리뷰는 30초이고 홍보 목적 조건이 붙는다. Jamendo(비상업)와 Audius(약관 미확인) 같은 권리가 확보된 CC·인디 음원만 백그라운드 전곡 재생이 가능하다. VIBR 모바일 레이아웃에서 플레이어가 숨겨진 채 재생될 위험은 Q2 Inferences를 참고.                                                          | [YT policies](https://developers.google.com/youtube/terms/developer-policies), [iTunes](https://performance-partners.apple.com/search-api), [Jamendo](https://devportal.jamendo.com/api_terms_of_use), [Audius](https://cdn.jsdelivr.net/npm/@audius/sdk@15.3.1/README.md)                                                                                                                                                                                                                                                                              |
| **크로스 플랫폼 링크 변환**                              | **제한**                                      | Odesli의 키 없는 API는 종료됐고(2026-11-13 401 확인) 키는 이메일로 요청해야 한다(조건과 비용 미확인). 직접 구현하면 YouTube 검색 하루 100회, Spotify search limit 10과 개발자 계정 쿼터, Apple Music API 연 99달러가 걸린다. Spotify `external_ids`(ISRC)가 유지된 점과, "Spotify로 링크백"이 정책 취지에 맞는 점은 유리하다.                                                                                      | [npm odesli.js](https://www.npmjs.com/package/odesli.js), [quota](https://developers.google.com/youtube/v3/determine_quota_cost), [Spotify guide](https://developer.spotify.com/documentation/web-api/tutorials/february-2026-migration-guide), [Spotify policy](https://developer.spotify.com/policy)                                                                                                                                                                                                                                                  |
| (추가) **30초 미리듣기 피드 재생**(현행 VIBR)            | **제한**                                      | 홍보 목적 조건(배지, "courtesy of iTunes" 표기, 엔터테인먼트 목적 금지, 캐시 금지)을 지켜야 한다.                                                                                                                                                                                                                                                                                                                  | [iTunes](https://performance-partners.apple.com/search-api)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| (추가) **광고·유료화**                                   | **제한**                                      | YouTube는 독립적 가치가 있는 비YouTube 콘텐츠가 있는 페이지에만 광고를 허용하고, 플레이어 주변·내부 광고는 승인이 필요하다. Spotify 스트리밍 앱은 상업적 이용이 불가하다. MusicKit은 수익화를 금지한다. Last.fm은 상업 계약이 필요하다. SoundCloud는 주변 광고를 금지한다.                                                                                                                                         | [YT policies](https://developers.google.com/youtube/terms/developer-policies), [Spotify policy](https://developer.spotify.com/policy), [Apple DPLA](https://developer.apple.com/support/terms/apple-developer-program-license-agreement/), [Last.fm ToS](https://www.last.fm/api/tos), [SC terms](https://developers.soundcloud.com/docs/api/terms-of-use)                                                                                                                                                                                              |
| (추가) **사용자 음원 업로드·자체 스트리밍**              | **불가**(상업 음원) / **제한**(자작곡·CC)     | 세 권리자(저작권자, 실연자, 음반제작자) 모두의 전송 이용허락이 필요하고 징수규정은 문체부 승인 사항이다. OSP 책임도 따른다. [변호사 검토 필요]                                                                                                                                                                                                                                                                     | [문체부 2012-06-08](https://www.mcst.go.kr/kor/s_notice/press/pressView.jsp?pSeq=12149), [신&김](https://shinkim.com/kor/media/newsletter/pdf/2775)                                                                                                                                                                                                                                                                                                                                                                                                     |
| (추가) **사람 기반 추천**(자체 Neo4j 그래프)             | **가능**                                      | 외부 API 의존이 없다. 외부 추천 API(Spotify Recommendations, Related Artists)가 차단된 상황에서는 오히려 차별점이 된다. ListenBrainz CF 추천은 보조로 쓸 수 있다(experimental).                                                                                                                                                                                                                                    | [Spotify 2024-11-27](https://developer.spotify.com/blog/2024-11-27-changes-to-the-web-api), [ListenBrainz rec](https://listenbrainz.readthedocs.io/en/latest/users/api/recommendation.html)                                                                                                                                                                                                                                                                                                                                                             |

#### 방향성 판단에 주는 시사점(추론)

- **유지·고도화 쪽 근거:** 1인 개발자가 지속할 수 있는 축은 "재생"이 아니라 "큐레이션과 관계"다. VIBR가 원래 내세운 "알고리즘이 아닌 사람 기반 추천"은 2024–2026년 플랫폼 API 폐쇄 흐름에서 오히려 방어하기 쉬운 포지션이다. 외부 추천과 오디오 특징 API가 사라져도 핵심 가치가 유지된다.
- **재생 전략:** 현실적인 조합은 다음 세 가지다. 플레이어 가시성 규칙(Q2)을 지키는 것이 선결 과제다.
  - YouTube 공식 임베드 중심
  - iTunes 미리듣기는 홍보 조건 준수
  - 각 서비스 앱에서 듣도록 보내는 링크아웃(Spotify·Apple Music으로 "열기")
- **피벗 후보 중 피해야 할 방향:** 다음 아이디어는 2026년 정책 아래에서 사실상 막혀 있다.
  - Spotify 데이터 중심 아이디어(청취 통계·Wrapped류, Spotify 기반 플레이리스트 생성기, 취향 분석 리포트)
  - 오디오 특징 기반 무드 검색
  - 가사 중심 서비스
  - 백그라운드 재생이 필수인 "음악 앱 대체"
- **아직 열린 피벗 후보:** 다음 방향은 제약이 상대적으로 적다.
  - ListenBrainz·Last.fm 연동형 "청취 기록 공유와 비교"(비상업 단계)
  - 소셜 태그 기반 무드 큐레이션
  - YouTube 임베드 기반의 함께 듣기(제한적, 법률 검토 필요)
  - 인디·CC 음악 큐레이션(Audius, Jamendo는 전곡과 백그라운드까지 가능하나 카탈로그 적합성은 미검증)
- **플랫폼 리스크 관리:** 외부 API는 모두 "언제든 축소될 수 있다"는 전제로 설계해야 한다. 2025–2026년에만 Spotify, Deezer, Odesli, SoundCloud가 개인 접근을 줄였다. 어댑터 계층(현재 `src/mappers/*ToMusic.ts`가 그 역할)을 유지해 공급자를 교체할 수 있게 해 두는 편이 안전하다.

### Gaps

- 한국 국내 음악 서비스(Melon, Genie, FLO, VIBE, Bugs)의 공개 개발자 API 제공 여부를 조사하지 못했다(검색 한도 소진).
- 각 판정의 법적 부분(임베드 방조 위험, 리스닝 룸, 미리듣기의 홍보 목적 해석, 광고)은 변호사 검토 전 잠정 판단이다.
- Audius와 Jamendo 카탈로그에 한국 사용자 취향(K-pop, 메이저 곡)이 얼마나 있는지 검증하지 못했다.
- 사용자가 Spotify "개인정보 다운로드"(확장 스트리밍 기록 JSON)를 직접 업로드받는 방식으로 청취 기록을 가져오는 우회 경로가 가능한지, 그 약관과 개인정보 측면을 확인하지 못했다.
