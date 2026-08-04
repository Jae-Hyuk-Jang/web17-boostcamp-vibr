# Result — spotify-integration

## 변경 요약

로그인·검색·재생 세 용도 모두 실사용 경로가 없던 Spotify 연동 코드를 프론트엔드·백엔드에서 전부 삭제했다. 3개 체크포인트 이슈로 진행했다.

- **#238** — 프론트엔드 삭제: `useSpotifyAuthStore`, `api/spotify/searchTracks.ts`, `mappers/spotifyTrackToMusic.ts`, `SpotifyTokenFromHash.tsx`, `hooks/auth/config/spotify.ts`, `hooks/auth/server/spotifyAuth.ts`, `app/auth/spotify/{route,callback/route}.ts`, `SpotifyLoginButton.tsx`, `types/spotify.d.ts` 및 관련 참조(`logout.ts`, `client.ts`의 401 핸들러, `authErrorMessage.ts`, `layout.tsx`, `api/internal/auth.ts`의 `spotifyToken`/`spotifyExchange`, 각 배럴) 전부 삭제.
- **#239** — 백엔드 삭제: `auth.controller.ts`의 `spotify/exchange`·`spotify/token` 라우트, `auth.service.ts`의 `exchange()`·`handleSpotifySignIn()`, `types.ts`의 `AuthProvider.SPOTIFY`와 관련 응답 타입, `user.service.ts`의 `findOrCreateBySpotifyUserId()`, 더 이상 쓰이지 않는 `ExchangeTokenDto` 삭제. 구현 단계에서 실제 dev DB를 조회해 `user.provider`/`music.provider` 둘 다 `'spotify'` 값이 0건임을 확인한 뒤 `packages/dto`의 `MusicProvider.SPOTIFY`도 삭제.
- **#240**(본 이슈) — `CLAUDE.md`의 디렉터리 트리·OAuth 서술·상태 관리 설명에서 Spotify 관련 항목 제거, `docs/tanstack-query/index.html`의 zustand 경계 표 갱신. `result.md` 작성.

Google 로그인, iTunes/YouTube 검색·재생 흐름은 코드 diff상 전혀 바뀌지 않았다.

## Before / After

| 항목                                                     | Before(prd.md 기준선)                                      | After                                                                                                                 |
| -------------------------------------------------------- | ---------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| Spotify 관련 파일(전수 grep)                             | 프론트엔드 11개 파일 + 백엔드 4개 파일 내 여러 메서드/타입 | 0개 — `apps/web`/`apps/api`/`packages/dto` 전수 재확인 결과 `grep -rliE "spotify"` 매치 0건(주석 1곳 제외, 아래 참고) |
| `AuthProvider.SPOTIFY` / `MusicProvider.SPOTIFY` enum    | 존재(실사용 0곳으로 추정)                                  | 삭제 — 실제 DB 조회로 `provider='spotify'` 데이터 0건 확인 후 삭제                                                    |
| `/api/auth/spotify/exchange`, `/api/auth/spotify/token`  | 라우트 존재(로그인 미완결 상태)                            | 404(라우트 자체가 사라짐, curl로 확인)                                                                                |
| `/auth/spotify`, `/auth/spotify/callback`(프론트 라우트) | 라우트 존재                                                | 404(curl로 확인)                                                                                                      |
| `LoginModal`의 로그인 버튼                               | Google + (주석 처리된 Spotify) + Tmp                       | Google + Tmp                                                                                                          |
| pnpm lint                                                | 성공                                                       | 성공(변경 없음)                                                                                                       |
| pnpm check-types                                         | 성공                                                       | 성공(변경 없음)                                                                                                       |
| pnpm test (api)                                          | 8 suites / 37 tests                                        | 8 suites / 37 tests(변경 없음 — Spotify 전용 스펙 테스트가 애초에 없었음)                                             |
| pnpm test (web)                                          | 40 suites / 226 tests                                      | 40 suites / 226 tests(변경 없음 — mock provider 값만 `'SPOTIFY'` → `'YOUTUBE'`로 교체된 2곳)                          |
| pnpm build                                               | 성공                                                       | 성공(web 라우트 목록에서 `/auth/spotify*` 사라짐을 빌드 출력으로 확인)                                                |
| git diff (구현 2개 + 문서 1개 커밋 합산)                 | -                                                          | 31 files changed, 20 insertions(+), 626 deletions(-)                                                                  |

## 개발환경 실동작 확인

- `packages/dto`를 변경했으므로(`MusicProvider.SPOTIFY` 삭제) **가장 먼저** `pnpm dto`로 재빌드했다.
- `docker compose up -d`(mysql/redis/neo4j) + `pnpm dev`(또는 `pnpm --filter api dev`)로 기동.
- **DB 확인(체크포인트 2의 핵심 절차)**: `docker exec vibr-mysql mysql -uroot -p1234 vibr -e "SELECT provider, COUNT(*) FROM user GROUP BY provider;"` → 결과는 `NULL` 2건뿐, `'spotify'`/`'google'` 값 자체가 0건. `SELECT provider, COUNT(*) FROM music GROUP BY provider;` → `'itunes'` 6건뿐, `'spotify'` 0건. 두 테이블 모두 `provider` 컬럼이 `varchar`(TypeORM `synchronize`)라 enum 값을 지워도 스키마 자체는 영향받지 않음을 확인.
- **프론트엔드(체크포인트 1) 실동작**: `curl`로 `/auth/spotify`(404), `/auth/spotify/callback`(404), `/auth/google`(307 리다이렉트), `/`·`/archive`(200) 확인. `pnpm dev` 로그에 컴파일·런타임 에러 없음.
- **백엔드(체크포인트 2) 실동작**: API 재시작 로그에서 `spotify/exchange`·`spotify/token` 라우트가 더 이상 매핑되지 않음을 확인. `curl -X POST /api/auth/spotify/exchange`(404), `/api/auth/spotify/token`(404), `/api/auth/google/exchange`(400, `code` 누락 정상 검증), 개발용 `/api/auth/login/tmp`(정상 `appJwt` 발급) 확인. `Found 0 errors`로 컴파일 안정.
- **직접 확인하지 못한 부분**: 이 환경에 브라우저 자동화 도구가 없어, Google 로그인 팝업/리다이렉트 전체 플로우를 실제 브라우저 클릭으로 끝까지 확인하지는 못했다(`query-client-policy`/`auth-state-ownership` 사이클과 동일한 한계). 대신 `/auth/google` 리다이렉트 응답(307)과 `/auth/google/exchange`의 입력 검증(400)까지는 API 레벨로 확인했고, Google 로그인 관련 코드는 이번 사이클에서 한 줄도 수정하지 않았다(diff로 확인) — 로직 자체가 바뀌지 않았으므로 회귀 위험이 구조적으로 낮다.

## Behavior Verification

- **Behavior Invariants(prd.md)**: Google 로그인 흐름 코드는 diff상 전혀 안 바뀜(`auth.service.ts`의 `exchangeGoogle`/`fetchGoogleUserInfo`/`handleGoogleSignIn`, `hooks/auth/server/googleAuth.ts`, `app/auth/google/**` 미변경). iTunes/YouTube 검색·재생 흐름도 미변경. `MusicProvider.SPOTIFY` enum 삭제는 실제 DB 확인(0건)을 거친 뒤에만 실행했다.
- **회귀 시나리오(adr.md)**: "Google 로그인 성공/실패", "iTunes/YouTube 검색·재생", "`MusicProvider.SPOTIFY`를 쓰던 2개 테스트 파일" 전부 확인됨(테스트 통과 + 코드 diff 확인). "기존 `provider: 'spotify'` 데이터" 시나리오는 실제 DB에 해당 데이터가 없어 해당 없음으로 종료.

## Decision Review

- ADR에서 안 1(죽은 코드 완전 삭제)을 선택하며 예상한 비용은 "FE 11개 + BE 4개 파일"이었다. 실제로는 여기에 더해 `ExchangeTokenDto`(BE, 소비처가 사라져 함께 삭제)와 2개 테스트 파일의 mock provider 값 교체가 추가됐다 — 둘 다 ADR에서 이미 예견했던 부수 효과였다(각각 "위험" 섹션과 "Rollback" 섹션에 미리 기록해둠).
- PRD에서 "완전 삭제"를 선택한 근거(git 이력상 로그인이 한 번도 완성된 적 없음)가 구현 단계에서도 그대로 확인됐다 — 삭제 중 예상 밖의 의존성이나 숨은 소비처가 전혀 발견되지 않았다.
- DB 확인 결과(user/music 둘 다 `'spotify'` 0건)는 "이 기능이 정말 한 번도 쓰인 적이 없다"는 PRD의 핵심 가설을 데이터 레벨에서도 뒷받침했다.
- 예상하지 못했던 것: `docs/architecture/index.html`(Mermaid 다이어그램에 `useSpotifyAuthStore`/`useSpotifyPlayerStore` 노드), `docs/design-system.md`(`--color-spotify-green` 토큰), `docs/components/index.html`·`docs/component-design/{modals,buttons}.md`(Spotify 로그인 버튼을 언급하는 컴포넌트 문서)에도 Spotify 관련 서술이 남아있다는 걸 발견했다 — 이번 사이클 범위(`CLAUDE.md` + `docs/tanstack-query`)를 넘어서는 문서라 Remaining Debt로 남긴다.

## Remaining Debt

- `docs/architecture/index.html`의 Mermaid 다이어그램에 `useSpotifyAuthStore`/`useSpotifyPlayerStore` 노드와 관련 edge가 아직 남아있다 — 다이어그램 구조를 건드려야 해서 이번 사이클에서는 손대지 않았다.
- `docs/design-system.md`의 `--color-spotify-green` 토큰(정의만 있고 실사용 없었다고 이미 기록돼 있던 부채)과 관련 부채 항목(§7)이 이제 "정의는 있지만 그 근거였던 `SpotifyLoginButton.tsx` 자체가 삭제됨"으로 상태가 바뀌었다 — 토큰과 부채 기록 정리 필요.
- `docs/components/index.html`, `docs/component-design/modals.md`, `docs/component-design/buttons.md`가 `LoginModal`을 "Google/Spotify/Tmp 3버튼"으로 서술하고 있다 — 이제 2버튼(Google/Tmp)이다.
- Out of Scope로 명시했던 것: Spotify 개발자 콘솔에 등록된 OAuth 앱(client id/secret) 등록 해제, `.env`의 `SPOTIFY_*` 환경변수 정리는 코드 저장소 밖 운영 작업이라 이번 사이클에서 하지 않았다.

## Follow-ups

- 위 Remaining Debt의 문서 4곳(`docs/architecture/index.html`, `docs/design-system.md`, `docs/components/index.html`, `docs/component-design/{modals,buttons}.md`) 정리 — 작은 후속 이슈로 등록 권장.
- `.env`/Spotify 개발자 콘솔 정리 체크리스트(코드 밖 작업): `SPOTIFY_CLIENT_ID`, `SPOTIFY_CLIENT_SECRET`, `SPOTIFY_REDIRECT_URI`, `SPOTIFY_TOKEN_URL`, `SPOTIFY_API_BASE_URL` 등 관련 환경변수 삭제, Spotify 개발자 대시보드에서 등록된 앱/리다이렉트 URI 해제.
- `useAuthMe()` 필드별 리렌더 최적화(#236), `MusicProvider.SPOTIFY` 삭제와 무관하게 이미 등록된 다른 백로그 항목들은 이번 사이클과 별개로 남아있음.
