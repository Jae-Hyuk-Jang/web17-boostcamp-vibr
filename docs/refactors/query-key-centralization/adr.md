# ADR — query-key-centralization

## 3안 비교

### 안 1 — 최소 개선안

실제로 역방향 의존이 있는 2개 키(`feedQueryKey`, `profileGridQueryKey`)만 각각의 자연스러운 훅 소유자로 옮긴다(예: `feedQueryKey` → `hooks/feed`류 신설, `profileGridQueryKey` → `hooks/profile/useProfile.ts` 인접). 나머지 10개는 그대로 둔다.

### 안 2 — 경계 재설계안(자체 구현) — **선택**

12개 쿼리키 전부를 `src/query-keys/{domain}.ts`(`feed.ts`/`playlist.ts`/`post.ts`/`profile.ts`/`noti.ts`/`auth.ts`/`search.ts`) + `src/query-keys/index.ts` 바럴로 옮긴다. 컴포넌트 파일은 더 이상 쿼리키를 export하지 않는다. 순수 함수/상수 이동이라 새 런타임 의존성은 없다.

### 안 3 — 검증된 도구 도입안(`@lukemorales/query-key-factory`)

계층적 타입세이프 쿼리키 팩토리를 만들어주는 라이브러리를 도입해 `createQueryKeys`로 도메인별 키 팩토리를 정의하는 방식.

## 비교표 (10개 고정 기준)

| #   | 기준                 | 안 1                                                            | 안 2(선택)                                                                        | 안 3                                                                              |
| --- | -------------------- | --------------------------------------------------------------- | --------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| 1   | 근본 원인 해결력     | 중간 — 실제 역방향 의존 2건만 해소, 나머지 10개는 그대로        | 높음 — 12개 전부 통일된 위치·규칙                                                 | 높음 — 안 2와 동일하지만 라이브러리의 계층적 키 생성 기능까지 추가로 얻음         |
| 2   | 동작 보존 난이도     | 매우 낮음 — 파일 2개만 이동                                     | 낮음 — 순수 이동(값 불변), 소비처 24개 import 경로만 교체                         | 낮음~중간 — 라이브러리 API로 재작성해야 해 기계적 이동보다 손이 더 감             |
| 3   | 책임·의존성 변화     | 매우 작음                                                       | 중간 — 신규 폴더 8개 파일, 새 의존성 없음                                         | 중간 — 신규 폴더 + 외부 패키지 1개 추가                                           |
| 4   | 테스트 용이성        | 변화 없음                                                       | 변화 없음 — 기존 테스트가 import 경로만 갱신하면 그대로 통과                      | 변화 없음(라이브러리 API도 결국 배열 반환)                                        |
| 5   | 변경 범위            | 작음(2개 정의 파일 + 소비처 4곳)                                | 큼(10개 정의 파일 + 소비처 24개 파일)                                             | 안 2와 동일 범위 + `package.json` 변경                                            |
| 6   | 점진적 전환 가능성   | 쉬움                                                            | 가능 — 도메인별로 순차 이동(체크포인트 이슈로 분리)                               | 가능 — 안 2와 동일한 순서로 가능                                                  |
| 7   | 롤백 가능성          | 쉬움                                                            | 쉬움 — 도메인별 커밋 분리 시 개별 되돌리기 가능                                   | 쉬움 — 단, 라이브러리 자체를 걷어내는 추가 작업 필요                              |
| 8   | 성능·운영 영향       | 무해                                                            | 무해(순수 이동)                                                                   | 무해하지만 번들에 패키지 1개 추가(작지만 0은 아님)                                |
| 9   | 기존 코드와의 일관성 | 낮음 — 문제 있는 2개만 고쳐 나머지 10개와 배치 기준이 계속 다름 | 높음 — 저장소가 이미 쓰는 `types/{domain}.ts`/`constants/{domain}.ts` 패턴과 동일 | 낮음 — 저장소에 없던 새 외부 라이브러리 패턴을 도입, 자체 컨벤션과 이질적         |
| 10  | 유지 비용            | 중간 — 배치 기준 자체가 이원화된 채로 남음                      | 낮음 — 규칙이 하나로 통일됨                                                       | 낮음(라이브러리가 유지되는 동안은) — 단, 유지보수가 멈춘 라이브러리라 장기 리스크 |

## 라이브러리 도입 심사 (안 3)

- **해결 책임-핵심 추상화 일치**: 라이브러리의 핵심 기능(계층적 키 생성, 타입 추론)은 우리 문제(정의 위치 통일)보다 과한 추상화다 — 우리에게 필요한 건 "어디에 정의하는가"이지 "키를 어떻게 생성하는가"가 아니다.
- **버전 호환성**: 최신 버전 1.3.4가 **2년 전** 마지막 배포(WebSearch로 확인, 2026-08 기준). TanStack Query v5 호환성이 공식 문서에 명시돼 있지 않다.
- **최근 릴리스·유지보수 상태**: socket.dev 분석 결과 "not healthy" 릴리스 주기로 평가됨.
- **번들·런타임 비용**: 작은 유틸이지만 우리 문제가 자체 구현으로 40줄 내외에 해결되는 규모라 굳이 추가할 이유가 약하다.
- **제거 비용**: 지금 도입하면, 유지보수가 멈춘 라이브러리를 앞으로 걷어내야 할 수 있다는 부채를 새로 만드는 셈이다.
- **결론**: 기각. 출처: [npm](https://www.npmjs.com/package/@lukemorales/query-key-factory), [GitHub](https://github.com/lukemorales/query-key-factory), [socket.dev 분석](https://socket.dev/npm/package/@lukemorales/query-key-factory).

## 의사결정 인터뷰 로그

**Q. 실제로 역방향 의존이 있는 건 12개 중 2개뿐입니다(`feedQueryKey`, `profileGridQueryKey`). 나머지 10개는 자기 파일 안에서만 쓰여 문제가 없습니다. 이번 사이클 범위를 어느 쪽으로 잡을까요?** _(PRD 단계에서 질문)_
A. 12개 전체를 한 곳으로 중앙화. 이유: 앞으로도 쿼리키가 계속 늘어날 것이므로 지금 규칙을 세워두면 반복 판단 비용이 줄어든다는 예방적 근거(사용자가 AI의 "2개만" 추천을 인지한 상태에서 직접 확정).

**Q. 중앙화한 쿼리키를 어떻게 구조화할까요? 단일 파일 vs 도메인별 파일+바럴.** _(PRD 단계에서 질문)_
A. 도메인별 파일 + 바럴(추천). 이유: 저장소의 기존 `types/`·`constants/` 도메인 분리 패턴과 동일한 관례를 따르는 것이 새 컨벤션을 만드는 것보다 낫다는 진단을 그대로 채택.

**Q. 라이브러리 도입안(`@lukemorales/query-key-factory`)도 안 3으로 검토해봤습니다 — 마지막 릴리스가 2년 전(v1.3.4)이고 TanStack Query v5 호환성이 문서화되어 있지 않아 유지보수 상태가 불안합니다. PRD에서 이미 확정한 '도메인별 파일+바럴, 자체 구현'(안 2) 방향으로 확정해도 될까요?**
A. 네, 안 2(자체 구현)로 확정(추천). 이유: 라이브러리 유지보수 중단 리스크를 감수할 이득이 없다는 심사 결과를 그대로 채택.

## 선택: 안 2

비교표 기준 9(기존 코드와의 일관성)·10(유지 비용)에서 안 2가 가장 우세하고, 안 3은 라이브러리 도입 심사에서 유지보수 상태 불안으로 기각됐다. 안 1(최소 범위)은 PRD 단계에서 사용자가 예방적 근거로 명시적으로 기각했다 — 실제 문제가 없는 10개까지 포함하는 것은 YAGNI 원칙과는 배치되지만, "쿼리키가 계속 늘어나는 추세"라는 Fact(5개 사이클에 걸쳐 반복 발생)에 근거한 합리적 선택으로 받아들인다.

## ADR 본문

### Context

TanStack Query 쿼리키 팩토리 12개가 10개 파일(훅 8개, 컴포넌트 4개)에 흩어져 있다. 그중 2개(`feedQueryKey`, `profileGridQueryKey`)는 컴포넌트 파일에 정의돼 다른 도메인의 훅이 그 컴포넌트를 역참조하는 구조적 문제를 만든다. 나머지 10개는 문제가 재현되지 않지만, 사용자가 향후 확장을 고려해 12개 전체의 정의 위치를 통일하기로 결정했다.

### Decision

`src/query-keys/{domain}.ts` 7개(`feed`/`playlist`/`post`/`profile`/`noti`/`auth`/`search`) + `src/query-keys/index.ts` 바럴을 신설한다. 각 도메인 파일은 해당 도메인의 쿼리키 팩토리 함수/상수를 `export`하고, 기존 훅/컴포넌트 파일은 그 파일에서 다시 `import`해서 쓴다. 쿼리키의 배열 값은 절대 바꾸지 않는다 — 오직 정의 위치와 import 경로만 옮긴다.

### Alternatives

안 1(2개만 이동)은 PRD 인터뷰에서 사용자가 예방적 근거로 명시적으로 기각했다. 안 3(라이브러리 도입)은 유지보수가 멈춘 패키지(2년간 미배포)라는 구체적 근거로 기각했다.

### Consequences

- 컴포넌트 파일이 더 이상 쿼리키를 export하지 않아, 훅→컴포넌트 역방향 의존이 완전히 사라진다.
- 새 쿼리를 추가할 때 "어디에 둘지"를 고민할 필요 없이 해당 도메인의 `query-keys/{domain}.ts`에 추가하면 된다는 규칙이 생긴다.
- 소비처 24개 파일의 import 문이 바뀐다 — 순수 기계적 변경이지만 diff 크기가 크다. 도메인별로 이슈를 쪼개 한 번에 리뷰할 범위를 제한한다.
- 기존 테스트가 `jest.mock('./FeedView', ...)`처럼 쿼리키를 정의 파일 경로로 mock하고 있었다면, mock 대상 경로도 함께 갱신해야 한다(구현 시 확인 필요).

### Migration

아래 체크포인트 이슈 순서대로 진행한다. 각 이슈는 머지 후에도 저장소가 정상 상태를 유지한다. 도메인 단위로 나눠 diff를 작게 유지한다.

### Rollback

`apps/api`/`packages/dto` 변경이 없고 쿼리키 값도 바뀌지 않으므로, 각 체크포인트 이슈는 해당 커밋만 `git revert`하면 즉시 이전 상태로 복귀 가능하다. 도메인별로 커밋이 분리돼 있어 특정 도메인 이동만 되돌리는 것도 가능하다.

## 회귀 안전망

이번 리팩터링은 **값이 바뀌지 않는 순수 위치 이동**이라, 새로운 동작을 특성화할 필요가 없다 — 기존 40 suites/225 tests가 이미 캐시 무효화·공유 동작을 검증하고 있다. 우선순위는 다음과 같다.

1. **Contract(최우선)** — 각 도메인 이동 직후 `pnpm check-types`로 깨진 import를 즉시 잡는다(TypeScript가 이 리팩터링의 1차 안전망).
2. **State-transition** — 기존 테스트가 그대로 통과하는지 확인 — 특히 `jest.mock`이 쿼리키 정의 파일의 경로를 직접 mock하던 테스트(있다면 이동 후 mock 경로도 갱신).
3. **Integration** — `pnpm test` 전체 스위트가 도메인 이동마다 통과하는지 확인.
4. **E2E** — Out of Scope.

### 회귀 시나리오

| 시나리오                                              | 기존 결과                               | 검증 수준   | 실패 시 조치                                   |
| ----------------------------------------------------- | --------------------------------------- | ----------- | ---------------------------------------------- |
| 쿼리키를 옮긴 뒤 옛 경로를 참조하는 import가 남아있음 | 컴파일 에러                             | Contract    | 구현 중단, import 경로 수정                    |
| 쿼리키 값이 실수로 바뀜(오타 등)                      | 캐시 무효화/공유가 깨짐                 | Integration | 구현 중단, 값 원복                             |
| 테스트의 `jest.mock` 경로가 옛 정의 파일을 가리킴     | mock이 적용되지 않아 실제 API 호출 시도 | Integration | mock 경로를 새 `query-keys/{domain}.ts`로 갱신 |
| 컴포넌트 파일에 쿼리키가 다시 추가됨(회귀)            | (신규 계약) 발생하지 않아야 함          | Contract    | Success Criteria 미달성으로 이슈 재작업        |

## 체크포인트 이슈 목록

각 이슈는 반나절~하루 크기. 도메인 단위로 나눠 한 이슈에서 한 도메인(또는 가장 작은 도메인 2개)만 옮긴다.

1. **`query-keys/` 폴더 뼈대 + auth·search 도메인 이동** — `src/query-keys/index.ts` 바럴 신설, `AUTH_ME_QUERY_KEY`(`useAuthMeQuery.ts`)를 `query-keys/auth.ts`로, `userSearchQueryKey`(`useUserSearch.ts`)를 `query-keys/search.ts`로 이동. 소비처 각 1곳뿐이라 패턴을 확립하기 좋은 가장 작은 두 도메인부터 시작.
2. **feed 도메인 이동** — `feedQueryKey`(`components/feed/FeedView.tsx` → `query-keys/feed.ts`). 소비처 4곳(`FeedView.tsx`, `Header.tsx`, `PostHeader.tsx`, `useContentWrite.ts`) import 경로 갱신 — 이번 사이클의 핵심 동기였던 역방향 의존 하나가 해소됨.
3. **noti 도메인 이동** — `notiQueryKey`(`useNotifications.ts` → `query-keys/noti.ts`).
4. **playlist 도메인 이동** — `playlistDetailQueryKey`, `PLAYLISTS_QUERY_KEY`를 `query-keys/playlist.ts`로. 소비처 6곳(`usePlaylistDetail.ts`, `usePlaylistRecommendations.ts`, `usePlaylists.ts`, `PlaylistDetailModal.tsx`, `ArchiveView.tsx`, `ArchiveViewHeader.tsx`).
5. **profile 도메인 이동** — `profileQueryKey`, `profileGridQueryKey`, `profilePostsFeedQueryKey`, `userListQueryKey`를 `query-keys/profile.ts`로. 소비처 6곳(`useProfile.ts`, `ProfileInfo.tsx`, `ProfileView.tsx`, `ProfilePostsFeed.tsx`, `UserListModal.tsx`, `useContentWrite.ts`) — 이번 사이클의 또 다른 역방향 의존(`profileGridQueryKey`)도 여기서 해소.
6. **post 도메인 이동** — `postDetailQueryKey`, `commentsQueryKey`를 `query-keys/post.ts`로. 소비처가 가장 많다(8곳: `usePostDetail.ts`, `usePostDetailModal.ts`, `usePostCacheSync.ts`, `usePostLikeToggle.ts`, `usePostReactions.ts`, `ProfilePostsFeed.tsx`, `PostCard.tsx`).
7. **Success Criteria 확인 + dead code 제거 + 문서 갱신** — 컴포넌트 파일이 쿼리키를 더 이상 export하지 않는지 `grep`으로 재확인, `docs/tanstack-query/index.html`의 "Query Key 지도" 표에서 "소유 파일" 열을 새 경로로 갱신, `result.md` 작성.

### 생성된 이슈

부모 이슈: #216(이 사이클은 사전 등록된 백로그 이슈 없이 대화에서 바로 시작돼, `/refactoring-planner` 착수 후 별도로 만들었다). #209~#215는 모두 #216의 GitHub sub-issue로 연결했다.

| 체크포인트                      | 이슈 |
| ------------------------------- | ---- |
| 1. 폴더 뼈대 + auth·search      | #209 |
| 2. feed 도메인                  | #210 |
| 3. noti 도메인                  | #211 |
| 4. playlist 도메인              | #212 |
| 5. profile 도메인               | #213 |
| 6. post 도메인                  | #214 |
| 7. Success Criteria + 문서 갱신 | #215 |

프로젝트 보드 등록은 `gh` 버전이 2.4.0(2.20 미만, `gh project` 서브커맨드 미지원)이라 자동화하지 못했습니다 — 필요하면 수동으로 등록해주세요.

---

**[GATE 2]** 위 대안 선택, 인터뷰 로그, ADR 본문, 회귀 안전망, 이슈 분해를 확인해주시면 실제 GitHub 이슈를 생성하겠습니다.
