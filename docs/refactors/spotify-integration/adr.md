# ADR — spotify-integration

## 3안 비교

### 안 1 — 최소 개선안: 죽은 코드 완전 삭제 (채택)

로그인·검색·재생 세 용도에 걸친 Spotify 관련 코드를 프론트엔드·백엔드에서 그대로 삭제한다. 새 구조를 설계하지 않고, 기존에 동작하던 Google 로그인·iTunes/YouTube 검색·재생 경로는 손대지 않는다. `MusicProvider.SPOTIFY` enum은 DB 확인 후 조건부 삭제.

### 안 2 — 경계 재설계안: OAuth 프로바이더 확장 구조 재설계 (기각)

단순 삭제에서 그치지 않고, 향후 새 프로바이더(Apple, Kakao 등)를 쉽게 추가할 수 있도록 `modules/auth`의 프로바이더별 로직을 공통 인터페이스로 추상화한다.

### 안 3 — 자체 구현안: Feature flag로 감싸 비활성화 상태 유지 (기각)

코드를 삭제하지 않고 `ENABLE_SPOTIFY_LOGIN=false` 같은 환경변수로 게이팅해, 언제든 플래그만 켜면 재활성화할 수 있는 상태를 유지한다.

## 비교표 (10개 고정 기준)

| #   | 기준                 | 안 1                                             | 안 2                                                               | 안 3                                                                 |
| --- | -------------------- | ------------------------------------------------ | ------------------------------------------------------------------ | -------------------------------------------------------------------- |
| 1   | 근본 원인 해결력     | 죽은 코드 문제를 100% 해결                       | 동일 + 미래 확장성 확보                                            | 죽은 코드가 여전히 저장소에 남음 — 근본 해결 아님                    |
| 2   | 동작 보존 난이도     | 낮음 — 삭제 대상이 전부 실사용 0곳으로 확인됨    | 높음 — 기존 Google 로직도 새 인터페이스로 옮겨야 해 회귀 위험 커짐 | 낮음 — 코드 안 지움                                                  |
| 3   | 책임·의존성 변화     | 인증 모듈이 Google 하나만 책임짐(단순화)         | 프로바이더 추상화 계층이 새로 생겨 책임이 늘어남                   | 변화 없음(플래그만 추가)                                             |
| 4   | 테스트 용이성        | 삭제라 새 테스트 불필요, 기존 테스트로 회귀 확인 | 추상화 계층 자체를 새로 테스트해야 함                              | 플래그 on/off 두 경로를 다 테스트해야 함(비용 증가)                  |
| 5   | 변경 범위            | FE 11개 + BE 4개 파일                            | 안 1 + `modules/auth` 전체 리팩터링                                | 안 1보다 작지만(파일은 안 지움) 플래그 배선 추가                     |
| 6   | 점진적 전환 가능성   | 높음 — FE→BE 순으로 체크포인트 분리 가능         | 낮음 — 추상화가 완성돼야 안전                                      | 높음(그냥 플래그만 추가)                                             |
| 7   | 롤백 가능성          | 높음 — 삭제 커밋 revert                          | 낮음 — 구조 자체가 바뀜                                            | 매우 높음(플래그 하나)                                               |
| 8   | 성능·운영 영향       | 없음                                             | 없음                                                               | 없음(다만 죽은 코드가 번들에 계속 포함됨)                            |
| 9   | 기존 코드와의 일관성 | Google만 남아 실제 동작과 일치                   | 저장소에 프로바이더 추상화 패턴이 없어 새로 도입하는 셈            | "언젠가 켤 수도 있다"는 근거가 git 이력상 없음(초기 커밋부터 미완성) |
| 10  | 유지 비용            | 낮음 — 지우고 끝                                 | 중간 — 추상화 계층을 계속 유지해야 함                              | 높음 — 아무도 안 쓰는 코드를 계속 관리                               |

## 라이브러리 도입 심사

해당 없음 — 새 패키지를 추가하지 않는다. 순수 삭제 작업이다.

## 의사결정 인터뷰 로그

PRD 단계에서 이미 확정된 세 결정을 참조만 한다:

- 삭제 범위: "완전 삭제" vs "검색/재생만 삭제, 로그인은 유지" → **"완전 삭제"** 선택(git 이력상 로그인이 한 번도 완성된 적 없음).
- `MusicProvider.SPOTIFY` enum: "구현 단계 DB 확인 후 결정" vs "확인 없이 삭제" → **"DB 확인 후 결정"** 선택.
- FE/BE 범위: "한 사이클 체크포인트 분리" vs "완전 별도 사이클" → **"체크포인트 분리"** 선택.

ADR 단계에서 새로 필요했던 결정:

```markdown
**Q. 삭제 순서를 프론트엔드 먼저 → 백엔드로 갈까요, 백엔드 먼저 → 프론트엔드로 갈까요?**
A. 프론트엔드 먼저(추천). 이유: 사용자 진입점(로그인 버튼, OAuth 리다이렉트 라우트)을 먼저 없애면, 그 다음에 백엔드 라우트를 지워도 "존재하지 않는 프론트 진입점이 존재하지 않는 백엔드 라우트를 가리키는" 상태로 논리적으로 항상 일관된다. 반대 순서로 하면 잠깐이라도 "프론트가 이미 사라진 백엔드 라우트를 향한 죽은 코드를 아직 갖고 있는" 어색한 중간 상태가 생긴다(실질적 위험은 없지만 리뷰 가독성 문제).
```

## 선택: 안 1

안 2는 이번 사이클의 목적(죽은 코드 제거)을 넘어서는 새 추상화 도입이라 과설계다 — 필요하다는 근거(다음 프로바이더 추가 계획)가 없다. 안 3은 PRD에서 이미 "완전 삭제"를 선택한 근거(git 이력상 재활성화 시도가 없었음)와 정면으로 배치된다. 안 1이 세 가지 목표 인터뷰 결정 모두와 일치하고, 변경이 가장 단순하며 롤백이 가장 쉽다.

## ADR 본문

### Context

Spotify 관련 코드가 인증(로그인)·검색·재생 세 계층에 걸쳐 프론트엔드·백엔드 양쪽에 남아있지만, 전수 확인 결과 실사용 경로가 전혀 없다(prd.md 참고). git 이력상 로그인은 초기 커밋부터 한 번도 완성되지 않았다.

### Decision

다음 파일들을 삭제한다:

**프론트엔드**

- `stores/useSpotifyAuthStore.ts`
- `api/spotify/searchTracks.ts`(및 `api/index.ts`의 재export 줄)
- `mappers/spotifyTrackToMusic.ts`(및 `mappers/index.ts`의 재export 줄)
- `hooks/auth/client/SpotifyTokenFromHash.tsx`(및 `app/layout.tsx`의 `<SpotifyTokenFromHash />` 마운트)
- `hooks/auth/client/authErrorMessage.ts`의 `spotify_error_*` 분기(파일 자체는 Google 에러도 처리하므로 유지, 관련 분기만 제거)
- `hooks/auth/config/spotify.ts`
- `hooks/auth/server/spotifyAuth.ts`
- `app/auth/spotify/route.ts`, `app/auth/spotify/callback/route.ts`
- `components/modals/LoginModal/loginButtons/SpotifyLoginButton.tsx`(및 `LoginModal.tsx`의 주석 처리된 참조, `loginButtons/index.ts`의 재export)
- `types/spotify.d.ts`

**백엔드**

- `modules/auth/auth.controller.ts`의 `spotify/exchange`·`spotify/token` 엔드포인트
- `modules/auth/auth.service.ts`의 `exchange()`(Spotify 토큰 교환)·`handleSpotifySignIn()`
- `modules/auth/types.ts`의 `AuthProvider.SPOTIFY`·`SpotifyTokenResponse`·`SpotifyCurrentUserResponse`
- `modules/user/user.service.ts`의 `findOrCreateBySpotifyUserId()`

**조건부**

- `packages/dto`의 `MusicProvider.SPOTIFY`: 구현 단계에서 실제 DB에 `provider='spotify'` 데이터가 있는지 확인 후, 없으면 삭제하고 있으면 유지(생성 경로는 이미 프론트 UI에 없으므로 추가 조치 불필요).

**문서**

- `CLAUDE.md`의 "OAuth는 Google + Spotify" 서술을 "OAuth는 Google"로 갱신(Spotify가 완성된 적 없다는 사실 포함).

### Alternatives

- 안 2(프로바이더 추상화 재설계): 이번 사이클 목적을 넘어서는 과설계로 기각.
- 안 3(feature flag 유지): git 이력상 재활성화 근거가 없어 기각.

### Consequences

**장점**: 인증 모듈이 실제로 동작하는 Google 하나만 책임지게 돼 코드와 문서(`CLAUDE.md`)가 일치한다. 새 인증 관련 코드를 작성할 때 Spotify를 고려해야 하는지 매번 판단할 필요가 없어진다.

**단점**: 없음(순수 죽은 코드 제거, 기존 동작 변경 없음).

**위험**: `apps/web/src/components/modals/PlaylistPickerModal/PlaylistPickerModal.test.tsx`, `PostCardDetailModal.test.tsx` 2개 테스트 파일이 mock `Music` 객체의 `provider` 필드에 `'SPOTIFY'`를 임의로 쓰고 있다(Spotify 기능 자체를 테스트하는 게 아니라 그냥 provider 값 하나를 예시로 쓴 것) — `MusicProvider.SPOTIFY` enum을 삭제하기로 결정되면 이 두 곳만 다른 provider 값(예: `'ITUNES'`)으로 바꾸면 된다. enum을 유지하기로 하면 이 파일들은 손댈 필요가 없다.

### Migration

1. **체크포인트 1**: 프론트엔드 Spotify 코드 전부 삭제(로그인 진입점부터 — 위 "삭제 순서" 인터뷰 결정에 따름).
2. **체크포인트 2**: 백엔드 Spotify 코드 삭제 + `MusicProvider.SPOTIFY` enum DB 확인 후 조건부 삭제.
3. **체크포인트 3**: `CLAUDE.md`·`docs/architecture/index.html`(있다면) 등 문서 갱신 + `result.md` 작성.

### Rollback

- 각 체크포인트는 독립된 커밋이라 문제가 생긴 체크포인트만 revert하면 그 이전 상태로 정확히 복원된다.
- `MusicProvider.SPOTIFY` enum을 삭제했는데 이후 실제로 참조하는 데이터가 발견되면(예: 사용자 리포트), enum 값만 다시 추가하는 별도 커밋으로 복구 가능 — TypeORM `synchronize`가 production 외 환경에서 켜져 있으므로 스키마 자체에 영향은 없다(enum은 애플리케이션 레벨 validation일 뿐 DB 컬럼 타입이 아님, `Music.provider`가 실제로 어떻게 저장되는지는 구현 단계에서 재확인).

## 회귀 안전망

### 테스트 우선순위

- **Characterization**: 삭제 전 Google 로그인 흐름(`GoogleLoginButton`, `AuthLoginQueryHandler`, `hooks/auth/server/googleAuth.ts`)이 Spotify 관련 코드와 실제로 독립적인지 코드 리딩으로 재확인(테스트 추가는 기존 커버리지로 충분하면 불필요).
- **Contract**: 백엔드 `modules/auth` 관련 스펙 테스트가 있다면(현재 `auth.controller`/`auth.service`에 대응하는 `.spec.ts`는 없음으로 확인됨) 삭제 후에도 `pnpm test`가 8 suites/37 tests 그대로 유지되는지 확인.
- **State-transition**: 해당 없음(Spotify 관련 상태 전이 자체가 삭제 대상).

### 회귀 시나리오

| 시나리오                                                                 | 기존 결과                                                        | 검증 수준                    | 실패 시 조치                         |
| ------------------------------------------------------------------------ | ---------------------------------------------------------------- | ---------------------------- | ------------------------------------ |
| Google 로그인 성공                                                       | 정상 로그인, `appJwt` 발급                                       | 통합                         | 구현 중단                            |
| Google 로그인 실패(에러 메시지)                                          | `authErrorMessage.ts`의 `google_error_*` 분기로 메시지 표시      | 단위                         | 구현 중단                            |
| iTunes/YouTube 검색·재생                                                 | 기존과 동일                                                      | 통합                         | 구현 중단                            |
| `MusicProvider.SPOTIFY`를 쓰던 2개 테스트 파일                           | provider 값이 무엇이든 테스트 의도(다른 관찰 지점)는 그대로 통과 | 계약                         | enum 유지로 전환(삭제 강행하지 않음) |
| 게시글/플레이리스트에 이미 `provider: 'spotify'`로 저장된 데이터(있다면) | 조회/렌더링이 깨지지 않음                                        | 실동작(DB 조회 후 수동 확인) | enum 유지, 삭제 범위에서 제외        |

## 체크포인트 이슈 목록

```markdown
# 목적

Spotify 관련 코드 중 프론트엔드에 있는 부분(로그인 진입점·검색·재생 토큰 저장) 전체를 삭제해 인증 흐름을 Google 하나로 단순화한다.

## Scope

- `stores/useSpotifyAuthStore.ts`, `api/spotify/searchTracks.ts`(+ `api/index.ts` 재export), `mappers/spotifyTrackToMusic.ts`(+ `mappers/index.ts` 재export), `hooks/auth/client/SpotifyTokenFromHash.tsx`(+ `app/layout.tsx` 마운트 제거), `hooks/auth/client/authErrorMessage.ts`의 `spotify_error_*` 분기, `hooks/auth/config/spotify.ts`, `hooks/auth/server/spotifyAuth.ts`, `app/auth/spotify/route.ts`, `app/auth/spotify/callback/route.ts`, `components/modals/LoginModal/loginButtons/SpotifyLoginButton.tsx`(+ `LoginModal.tsx`/`loginButtons/index.ts` 참조 제거), `types/spotify.d.ts` 삭제

## Out of Scope

- 백엔드 삭제 — 체크포인트 2.
- `MusicProvider.SPOTIFY` enum — 체크포인트 2에서 DB 확인 후 처리.

## Behavior Invariants

- Google 로그인 흐름은 전혀 바뀌지 않는다.
- iTunes/YouTube 검색·재생 흐름은 전혀 바뀌지 않는다.

## Acceptance Criteria

- [ ] Given 위 파일 목록, When 삭제하면, Then 어디서도 참조하는 곳이 없다(전수 grep으로 확인).
- [ ] Given Google 로그인, When 시도하면, Then 기존과 동일하게 성공/실패 처리된다.
- [ ] `pnpm lint && pnpm check-types && pnpm test && pnpm build`(web) 통과.

## Verification

- [ ] 위 명령 + `pnpm dev`로 로그인 모달에 Google 버튼만 보이는지, `/auth/spotify`·`/auth/spotify/callback` 라우트가 사라졌는지 확인.

## Rollback

- 이 체크포인트의 커밋을 revert.

## Dependency

- 선행 이슈: 없음.
- 후속 이슈: 체크포인트 2(백엔드 삭제 + enum 처리).
```

```markdown
# 목적

Spotify 관련 백엔드 코드를 삭제하고, `MusicProvider.SPOTIFY` enum을 실제 DB 데이터 확인 후 조건부로 정리한다.

## Scope

- `modules/auth/auth.controller.ts`의 `spotify/exchange`·`spotify/token` 라우트
- `modules/auth/auth.service.ts`의 `exchange()`·`handleSpotifySignIn()`
- `modules/auth/types.ts`의 `AuthProvider.SPOTIFY`·`SpotifyTokenResponse`·`SpotifyCurrentUserResponse`
- `modules/user/user.service.ts`의 `findOrCreateBySpotifyUserId()`
- 실제 DB(dev 환경)에서 `provider='spotify'` 데이터 존재 여부 조회 → `packages/dto`의 `MusicProvider.SPOTIFY` 삭제 여부 결정(있으면 유지, 이 이슈에서 결정 근거를 기록)

## Out of Scope

- 체크포인트 1(프론트엔드)이 선행돼야 함.

## Behavior Invariants

- Google 로그인 흐름은 전혀 바뀌지 않는다.
- `MusicProvider.SPOTIFY`에 실제로 걸린 데이터가 있다면 그 데이터의 조회/렌더링은 바뀌지 않는다(enum 유지).

## Acceptance Criteria

- [ ] Given 위 백엔드 코드, When 삭제하면, Then `apps/api` 전수 grep으로 참조가 0곳이다.
- [ ] Given DB에 `provider='spotify'` 데이터가 없음을 확인, When enum을 삭제하면, Then `pnpm dto` 재빌드 후 `apps/web`/`apps/api` 양쪽 타입체크가 통과한다.
- [ ] Given DB에 데이터가 있다면, When enum을 유지하기로 결정하면, Then 그 근거(건수 등)를 result.md에 기록한다.
- [ ] `pnpm lint && pnpm check-types && pnpm test`(api) 통과.

## Verification

- [ ] `pnpm dev`로 API 기동 후 Google 로그인 전체 흐름(리다이렉트→콜백→appJwt 발급) 실제 확인.

## Rollback

- 이 체크포인트의 커밋을 revert. enum을 삭제했는데 문제가 생기면 값만 다시 추가하는 별도 커밋으로 복구.

## Dependency

- 선행 이슈: 체크포인트 1.
- 후속 이슈: 체크포인트 3(문서 갱신).
```

```markdown
# 목적

`CLAUDE.md` 등 Spotify를 정식 기능처럼 서술하던 문서를 실제 상태(Google만 지원)에 맞게 갱신하고 result.md를 작성한다.

## Scope

- `CLAUDE.md`의 "OAuth는 Google + Spotify" 서술 갱신
- `docs/refactors/spotify-integration/result.md` 작성

## Out of Scope

- 코드 변경 없음(문서 + 검증).

## Behavior Invariants

- 해당 없음(문서 전용).

## Acceptance Criteria

- [ ] prd.md의 Success Criteria 각 항목 충족 여부를 근거와 함께 확인.

## Verification

- [ ] 체크포인트 1·2의 `pnpm dev` 실동작 확인 결과를 result.md에 반영.

## Rollback

- 문서 커밋 revert.

## Dependency

- 선행 이슈: 체크포인트 2.
```

---

**[GATE 2]** 위 대안 비교, 인터뷰 로그, ADR, 안전망, 이슈 분해를 확인해주시면 이슈를 생성하고 구현으로 넘어가겠습니다.
