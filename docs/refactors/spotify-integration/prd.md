# PRD — spotify-integration

## 문제 정의

Spotify 연동(로그인/검색/재생 세 용도)이 프론트엔드(`apps/web`)와 백엔드(`apps/api`) 양쪽에 코드로 남아있지만, 전수 확인 결과 세 용도 모두 현재 실제로 동작하지 않는다. `auth-state-ownership`(#231~#235) 사이클에서 `useSpotifyAuthStore` 조사 중 발견됐다(백로그 #237).

## 비판적 진단 (시니어 개발자 시각)

### 근거

- **[Fact]** `components/modals/LoginModal/LoginModal.tsx`에서 `{/* <SpotifyLoginButton /> */}`가 주석 처리돼 있어 로그인 화면에 Spotify 버튼이 렌더링되지 않는다.
- **[Fact]** `apps/api/src/modules/auth/auth.controller.ts`의 `POST /auth/spotify/exchange`는 토큰 교환(`authService.exchange`)까지만 하고, 실제 로그인 완결에 필요한 `handleSpotifySignIn` 호출과 `appJwt` 발급이 주석 처리돼 있다(`// 프론트 callback이 appJwt를 기대한다면(추후 정리)`). `GET /auth/spotify/token`은 `this.logger.warn('spotify/token is not implemented yet')`만 하는 미구현 스텁이다.
- **[Fact, git 이력으로 확인]** `git log --diff-filter=A --follow -- apps/api/src/modules/auth/auth.controller.ts`로 확인한 결과, 이 컨트롤러는 저장소의 "initial commit"(`8bc7786`)에 이미 지금과 같은(주석 처리된) 형태로 존재했다. 그 이후 이 파일에 가해진 변경은 eslint 설정 상속 정리(`7fa972f`) 하나뿐이다. 즉 **Spotify 로그인은 이 저장소 역사상 단 한 번도 실제로 동작한 적이 없다** — 최근에 비활성화된 게 아니라 애초에 완결되지 못한 기능이다. `LoginModal.tsx`의 `SpotifyLoginButton` 주석도 확인 가능한 커밋들에서 일관되게 주석 상태였다.
- **[Fact]** `api/spotify/searchTracks.ts`(`searchSpotifyTracks`)를 호출하는 곳이 `apps/web` 전체에 0곳이다(전수 grep). `mappers/spotifyTrackToMusic.ts`도 바럴 재export 외 실사용처가 0곳이다.
- **[Fact]** `useSpotifyAuthStore`의 `accessToken`/`ensureValidToken`을 실제로 읽는 곳이 없다 — `SpotifyTokenFromHash.tsx`(`app/layout.tsx`에 마운트)가 OAuth 콜백에서 토큰을 캐치해 저장만 할 뿐, 그 토큰을 소비하는 코드가 없다.
- **[Fact]** `types/spotify.d.ts`(Web Playback SDK 타입 선언)에 대응하는 실제 SDK 연동 코드가 `hooks/player/` 어디에도 없다 — 실제 재생은 iTunes 프리뷰/YouTube만 구현돼 있다.
- **[Fact]** `packages/dto`의 `music.dto.ts`는 `@IsEnum(MusicProvider)`로 `provider` 필드를 검증하는데, 이 검증은 `MusicProvider.SPOTIFY`도 여전히 유효한 값으로 통과시킨다 — 프론트 UI에 Spotify 검색 화면이 없어 정상적인 사용 흐름으로는 새로 생성될 수 없지만, API 계약 자체는 아직 이 값을 막지 않는다.
- **[Fact]** `apps/api/src/modules/seed/seed.ts`(개발용 시드 데이터)에는 `spotify`/`SPOTIFY` 문자열이 전혀 없다 — 적어도 시드 데이터에는 Spotify-provider 레코드가 없다. 다만 이는 시드 데이터에 국한된 확인이고, 실제 개발/운영 DB에 과거 QA나 수동 테스트로 생성된 데이터가 있는지는 코드로는 확인 불가(Hypothesis, 구현 단계에서 실제 DB 조회로 확인 필요).

### 증상 → 원인 체인

**증상**: Spotify 관련 코드가 로그인·검색·재생 세 영역에 걸쳐 프론트/백엔드 양쪽에 흩어져 있지만, 사용자가 실제로 도달할 수 있는 경로가 하나도 없다.
→ (왜?) 로그인 버튼이 렌더링되지 않고, 백엔드 로그인 완결 로직이 주석 처리돼 있으며, 검색/재생을 시작할 진입점 자체가 UI에 없다.
→ (왜?) git 이력상 이 기능은 처음부터 끝까지 완성된 적이 없다 — Google 로그인과 iTunes/YouTube 검색·재생만 실제로 완성해서 출시하고, Spotify는 시작만 해둔 채로 저장소에 계속 남아있었다.
→ **구조 원인**: "미완성 기능을 나중에 완성할 수도 있다"는 이유로 죽은 코드를 지우지 않고 유지해왔는데, 완성 계획이 실제로 진행된 적이 없어 유지 비용만 계속 쌓였다.

### 아키텍처 관점

- 이 문제는 인증(로그인)·검색(API 연동)·재생(플레이어) 세 도메인에 걸쳐 반복되는 패턴이다 — 특정 파일 하나의 문제가 아니라 "Spotify"라는 하나의 미완성 기능 축이 여러 계층에 동시에 흔적을 남긴 경우다.
- `CLAUDE.md`는 OAuth를 "Google + Spotify"로 명시하고 있어 문서상으로는 Spotify가 정식 기능처럼 보이지만, 실제 코드는 이를 뒷받침하지 못한다 — 문서가 코드보다 앞서 나가 있던 경우로 보인다(이번 사이클에서 `CLAUDE.md`도 함께 갱신 필요).
- "당시엔 맞았지만 전제가 깨진" 결정이 아니라, 애초에 완성되지 못하고 방치된 기능이다.

### 비판적 재검토 (사용자 문제 제기에 대한 반박 질문과 답)

- **이 증상이 정말 구조 문제인가, 우연인가?** — 로그인·검색·재생 세 영역이 전부 동시에 죽어있고, git 이력상 처음부터 그랬다는 게 확인돼 우연이 아니다(Fact 기반).
- **지금 안 고치면 다음 몇 번의 변경에서 무슨 비용이 드는가?** — 새로 인증 관련 코드를 작성하는 사람마다 "Google만 신경 쓰면 되는지, Spotify도 함께 고려해야 하는지" 매번 판단해야 한다(예: 이번 `auth-state-ownership` 사이클에서도 `useSpotifyAuthStore`를 조사에 포함시켜야 했다). `CLAUDE.md`를 읽는 사람은 Spotify가 정식 기능이라고 오해한다.
- **더 급한 다른 문제를 가리는 건 아닌가?** — 순수 죽은 코드 제거라 다른 급한 작업을 가리지 않는다. 다만 `MusicProvider.SPOTIFY` enum과 실제 DB 데이터의 관계는 코드 조사만으로 결론 낼 수 없어 구현 단계에서 실제 확인이 필요하다(Out of Scope로 미루지 않고 체크포인트 이슈에 포함).

## 목표와 범위

### Goal

로그인·검색·재생 세 용도 모두 실사용 경로가 없는 Spotify 연동 코드를 프론트엔드·백엔드에서 완전히 삭제해, 인증 흐름을 "Google만 실제로 동작한다"는 코드 현실과 일치시킨다.

### Success Criteria

- 프론트엔드: `useSpotifyAuthStore`, `api/spotify/searchTracks.ts`(및 `api/index.ts` 재export), `mappers/spotifyTrackToMusic.ts`(및 `mappers/index.ts` 재export), `SpotifyTokenFromHash.tsx`(및 `app/layout.tsx` 마운트), `authErrorMessage.ts`의 `spotify_error_*` 분기, `hooks/auth/config/spotify.ts`, `hooks/auth/server/spotifyAuth.ts`, `app/auth/spotify/route.ts`, `app/auth/spotify/callback/route.ts`, `SpotifyLoginButton.tsx`(및 `LoginModal.tsx`의 주석 참조), `types/spotify.d.ts`가 삭제된다.
- 백엔드: `auth.controller.ts`의 `spotify/exchange`·`spotify/token` 라우트, `auth.service.ts`의 `exchange()`·`handleSpotifySignIn()`, `auth/types.ts`의 `AuthProvider.SPOTIFY`·`SpotifyTokenResponse`·`SpotifyCurrentUserResponse`, `user.service.ts`의 `findOrCreateBySpotifyUserId()`가 삭제된다.
- `MusicProvider.SPOTIFY` enum은 구현 단계에서 실제 DB 조회로 `provider='spotify'` 데이터 존재 여부를 확인한 뒤, 없으면 enum도 삭제하고 있으면 enum은 유지하되 생성 경로만 막는다(아래 Behavior Invariants 참고).
- Google 로그인 흐름(성공/실패/에러 메시지)은 전혀 바뀌지 않는다.
- `CLAUDE.md`의 "OAuth는 Google + Spotify" 서술을 실제 상태에 맞게 갱신한다.
- `pnpm lint`/`check-types`/`test`/`build`(api·web 둘 다)가 베이스라인과 동일하게 통과한다.

### Out of Scope

- Spotify 개발자 콘솔에 등록된 OAuth 앱(client id/secret) 등록 해제, 관련 환경변수(`.env`) 삭제 — 코드 저장소 밖의 운영 작업이라 이 사이클의 코드 변경과 분리해서 별도로 안내만 한다.
- `MusicProvider.SPOTIFY`가 참조하는 실제 프로덕션 DB 데이터의 마이그레이션/정리 — enum을 유지하기로 결정되면 기존 데이터는 건드리지 않는다.
- 검색 UI 자체의 다른 개선(iTunes/YouTube 검색 UX 등) — 이번 사이클은 순수 삭제만 다룬다.

## Behavior Invariants

- Google 로그인 성공/실패/에러 메시지 흐름은 바뀌지 않는다.
- iTunes/YouTube 검색·재생 흐름은 바뀌지 않는다(Spotify 관련 코드와 독립적으로 구현돼 있음을 이미 확인).
- `MusicProvider.SPOTIFY` enum을 삭제하기로 결정되는 경우, 그 결정은 반드시 실제 DB에 해당 데이터가 없다는 걸 확인한 뒤에만 실행한다 — 확인 없이 삭제하지 않는다.
- 로그인하지 않은 사용자의 공개 피드 접근 등 인증과 무관한 기존 동작은 바뀌지 않는다.

## 기준선 검증

| 명령               | 결과 | 실패 항목 | 비고                            |
| ------------------ | ---- | --------- | ------------------------------- |
| `pnpm lint`        | 성공 | 없음      | 4개 패키지 전부 통과(캐시 히트) |
| `pnpm check-types` | 성공 | 없음      | 3개 패키지 전부 통과(캐시 히트) |
| `pnpm test` (api)  | 성공 | 없음      | 8 suites / 37 tests             |
| `pnpm test` (web)  | 성공 | 없음      | 40 suites / 226 tests           |
| `pnpm build`       | 성공 | 없음      | web 14개 라우트 정상 생성       |

측정 가능 지표: 삭제 대상 파일이 프론트엔드 11개(디렉터리 포함 시 더 많음), 백엔드 4개 파일 내 여러 메서드/타입 — 정확한 파일 수는 ADR의 체크포인트 이슈 분해에서 확정한다.

### 목표 인터뷰에서 확정된 결정

- **삭제 범위**: "완전 삭제" vs "검색/재생만 삭제하고 로그인 프로바이더는 남김" 중 사용자가 **"완전 삭제"**를 선택했다(추천안과 일치). 근거: git 이력상 로그인이 초기 커밋부터 한 번도 완성된 적이 없어 "재활성화"라는 개념이 사실상 성립하지 않는다.
- **`MusicProvider.SPOTIFY` enum 처리**: "구현 단계에서 DB 확인 후 결정" vs "확인 없이 무조건 삭제" 중 사용자가 **"구현 단계에서 DB 확인 후 결정"**을 선택했다(추천안과 일치). 근거: 데이터 무결성을 깨뜨리지 않으면서도 가장 안전한 결정 시점을 확보.
- **FE/BE 범위**: "한 사이클 안에서 체크포인트로만 분리" vs "완전히 별도 사이클(각 PRD/ADR)로 분리" 중 사용자가 **"한 사이클 안에서 체크포인트로만 분리"**를 선택했다(추천안과 일치). 근거: 같은 기능을 제거하는 하나의 일관된 작업이라 문서를 두 벌 작성하는 오버헤드가 불필요.

---

**[GATE 1]** 위 진단·목표·범위·Behavior Invariants·기준선을 확인해주시면 다음 단계로 넘어가겠습니다.
