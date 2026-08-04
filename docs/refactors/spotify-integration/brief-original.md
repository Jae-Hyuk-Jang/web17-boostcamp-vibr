# 문제 영역

## 관찰한 증상

- `LoginModal.tsx`에서 `{/* <SpotifyLoginButton /> */}`로 로그인 버튼이 주석 처리되어 렌더링되지 않음.
- 백엔드 `POST /auth/spotify/exchange`도 실제 로그인 처리(`handleSpotifySignIn`+`appJwt` 발급)가 `// 추후 정리` 주석과 함께 주석 처리되어 호출되지 않음.
- `api/spotify/searchTracks.ts`(`searchSpotifyTracks`)를 호출하는 곳이 전체 코드베이스에 0곳.
- `useSpotifyAuthStore`의 `accessToken`/`ensureValidToken`을 실제로 읽는 곳이 없음(토큰 캐치만 하고 쓰는 곳 없음).
- `types/spotify.d.ts`(Web Playback SDK 타입 선언)에 대응하는 실제 SDK 연동 코드가 없음.

## 실제 사례

- 프론트엔드: `useSpotifyAuthStore`, `api/spotify/searchTracks.ts`, `mappers/spotifyTrackToMusic.ts`(바럴 재export 외 실사용처 0), `SpotifyTokenFromHash.tsx`, `authErrorMessage.ts`의 `spotify_error_*`, `hooks/auth/config/spotify.ts`, `hooks/auth/server/spotifyAuth.ts`, `app/auth/spotify/{route,callback/route}.ts`, `SpotifyLoginButton.tsx`, `types/spotify.d.ts`.
- 백엔드: `auth.controller.ts`의 `spotify/exchange`·`spotify/token`(미구현 스텁), `auth.service.ts`의 `exchange()`·`handleSpotifySignIn()`(호출되지 않음), `auth/types.ts`의 `AuthProvider.SPOTIFY` 등, `user.service.ts`의 `findOrCreateBySpotifyUserId()`(호출되지 않음).

## 초기 가설

- 누군가 의도적으로 임시 비활성화했다가 완전히 정리하지 못한 상태로 보임(가설, 검증 필요).

## 기대 효과

- 사용하지 않는 OAuth 프로바이더 코드가 사라져 인증 흐름이 단순해짐(Google만 남음). 죽은 코드 제거로 유지보수 범위 감소.

## 제약

- `MusicProvider.SPOTIFY` enum에 걸린 과거 DB 데이터가 있을 수 있어 이 enum 값 자체를 지울지는 데이터 확인 후 별도 결정.
- "완전 삭제 vs 재활성화 여지를 남겨둘 것인지"는 제품/팀 확인이 필요한 결정.
