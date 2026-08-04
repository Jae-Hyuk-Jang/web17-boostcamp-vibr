# Result — profile-info-caching

## 변경 요약

| 이슈 | 내용                                                                                                                                                                                                                                                                                 |
| ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| #198 | `ProfileInfo.tsx`/`ProfileActionButton.tsx`(기존 테스트 0건)의 현재 동작과 `ProfileView`의 `getUser` 실패 시 에러 전파·`profile?.id !== userId` 스켈레톤 유지 동작을 characterization/contract 테스트로 고정. 착수 전 11개였던 프로필 관련 테스트가 25개로 늘어남.                   |
| #199 | `profileQueryKey(userId)` + `useProfile`(`useQuery`, `staleTime: 60_000`) 공용 훅 신설. `usePlaylistDetail`/`usePostDetail`과 동일 근거로 같은 값 채택.                                                                                                                              |
| #200 | `ProfileView`의 읽기 경로(`getUser`+`useEffect`)를 `useProfile`로 교체, `useProfileStore.setProfile` 호출 제거. `profile?.id !== userId` 가드는 캐시 키 자체가 `userId`로 격리되며 불필요해져 `isPending` 기반 스켈레톤으로 대체.                                                    |
| #201 | `ProfileActionButton`의 팔로우/언팔로우 요청을 `useMutation`으로 전환. 비낙관적 액션이라 `onSuccess`에서만 콜백 호출, 수동 `isLoading` state를 `mutation.isPending`으로 대체.                                                                                                        |
| #202 | `ProfileInfo.handleSave`(닉네임/bio 수정)를 `useMutation`으로 전환. **GATE 3에서 발견**: `PATCH /user`가 갱신된 `Profile` 전체가 아니라 `{ success: true }`만 반환한다는 사실을 실제 브라우저 검증 중 발견 — 응답 본문 대신 저장 요청 값(`variables`)을 캐시에 병합하도록 즉시 수정. |
| #203 | `ProfileInfo`가 `ProfileActionButton`에 넘기던 `onFollowActionComplete`(zustand `toggleFollow`)를 `profileQueryKey` 캐시 `setQueryData`로 교체.                                                                                                                                      |
| #204 | `UserListModal`의 "내 프로필일 때만" 분기(`incrementFollowingCount`/`decrementFollowingCount`)를 `profileQueryKey` 캐시 `setQueryData`로 교체. 이로써 `useProfileStore` 소비처가 전무해짐.                                                                                           |
| #205 | `useProfileStore.ts` 삭제, `stores/index.ts`에서 export 제거. 잔여 참조 없음을 `grep`으로 확인.                                                                                                                                                                                      |
| #206 | Success Criteria(userId 캐시 격리)를 `useProfile.test.ts`에 직접 검증하는 계약 테스트로 추가, `UserListModal`↔`ProfileView` 쓰기 전파 통합 테스트(`ProfileFollowSync.integration.test.tsx`) 신설.                                                                                    |
| —    | GATE 3 실동작 검증 중 발견한 `updateProfile` API 응답 타입 불일치를 별도 커밋으로 수정(아래 참고).                                                                                                                                                                                   |
| #207 | 이 문서 작성 + 이슈 #178 클로즈.                                                                                                                                                                                                                                                     |

## Before / After

| 항목                                       | Before(prd.md 기준선)                                                                            | After                                                                                                                                                                                                                   |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 캐시 키                                    | `useProfileStore`의 `profile: Profile \| null` 슬롯 — `userId`로 구분되지 않음                   | `profileQueryKey(userId)` — 서로 다른 `userId`를 연속 조회해도 캐시가 섞이지 않음(계약 테스트 + 실제 브라우저로 확인)                                                                                                   |
| `UserListModal`의 팔로우 상태 갱신 경로    | 자기 목록 캐시는 `setQueryData`, "내 프로필"일 때만 별도로 `useProfileStore` 액션 호출 — 두 갈래 | 두 경로 모두 `setQueryData` — 같은 캐시 계층으로 통일, 별도 분기 로직 자체는 유지(도메인 규칙)되지만 갱신 메커니즘은 하나                                                                                               |
| `ProfileActionButton`의 로딩 상태          | 수동 `useState(isLoading)` + `try/finally`                                                       | `useMutation`의 `isPending` — 상태 관리 코드 자체가 사라짐                                                                                                                                                              |
| `useProfileStore.ts`                       | 52줄, zustand 스토어                                                                             | 삭제됨                                                                                                                                                                                                                  |
| `ProfileInfo`/`ProfileActionButton` 테스트 | 0건                                                                                              | 12건(characterization 12) + `useProfile` 6건 + 통합 1건 = 19건 신규                                                                                                                                                     |
| `pnpm test`(web)                           | 39 suites / 202 tests(직전 브랜치 기준, PRD 작성 시점)                                           | **40 suites / 225 tests**(+1 suite, +23 tests)                                                                                                                                                                          |
| `pnpm lint`/`check-types`/`build`          | 전부 통과                                                                                        | 전부 통과(회귀 없음)                                                                                                                                                                                                    |
| 변경 파일(diff stat, main 대비)            | —                                                                                                | 19개 파일, 850(+)/142(-)줄. 신규 파일 4개(`useProfile.ts`, `useProfile.test.ts`, `ProfileActionButton.test.tsx`, `ProfileInfo.test.tsx`, `ProfileFollowSync.integration.test.tsx`), 삭제 파일 1개(`useProfileStore.ts`) |

## 개발환경 실동작 확인

`packages/dto`는 변경하지 않아 `pnpm dto` 재빌드는 필요 없었다. `docker compose up -d`(mysql/neo4j/redis) + `pnpm dev`(api/web)로 실제 백엔드·DB를 띄우고, 시드 유저의 JWT를 `JWT_SECRET`으로 직접 서명해 `sessionStorage.appJwt`에 주입하는 방식으로 로그인 세션을 만든 뒤, Playwright로 실제 브라우저를 띄워 검증했다.

- **내 프로필 페이지(`/profile/{내 id}`)에서 닉네임 수정**: 최초 시도에서 저장 직후 닉네임이 **빈 문자열로, 팔로잉 수는 "NaNM"으로 깨지는 회귀를 실제로 재현**했다. 원인은 `PATCH /api/user`가 갱신된 `Profile` 전체가 아니라 `{ success: true }`만 반환하는데(`apps/api`의 `UserService.updateUser` 코드로 재확인), #202 구현이 이 응답 본문을 그대로 캐시에 덮어썼기 때문이었다. 저장 요청 값을 이전 캐시에 병합하도록 수정한 뒤 재검증해 닉네임이 정확히 반영됨을 확인했다.
- **다른 유저를 실제로 팔로우 후 언팔로우**: 사전에 실제 `POST /api/follow`로 팔로우 관계를 만든 뒤, 내 프로필 페이지에서 "팔로잉 목록" 모달을 열어 언팔로우 — **모달을 닫지 않고도 배경의 `ProfileView`에 표시된 팔로잉 수가 1 → 0으로 즉시 갱신됨을 확인**(페이지 이동·새로고침 없음). 이번 사이클의 핵심 시나리오(쓰기 전파)를 실제 브라우저 DOM 변화로 직접 검증했다.
- 두 시나리오 모두 콘솔 에러 0건.
- **확인하지 못한 부분**: `UserListModal`에서 "내 프로필이 아닌" 목록(예: 다른 사람의 팔로워 목록)을 열어 그 안에서 팔로우/언팔로우하는 경로는 실제 브라우저에서 재현하지 않고 단위/통합 테스트(#198, #204)로만 검증했다 — 시드 데이터에 팔로우 관계가 없어 이 경로를 브라우저에서 준비하려면 여러 유저 간 관계를 추가로 만들어야 해 이번 GATE 3 범위에서는 생략했다.

## Behavior Verification

prd.md의 Behavior Invariants 전부를 확인했다:

- ✅ 프로필 조회 실패 시 에러 바운더리로 전파 — #198/#200 characterization 테스트(`TestErrorBoundary`로 직접 검증).
- ✅ 다른 프로필로 전환 시 이전 프로필이 보이지 않음 — `profileQueryKey`가 `userId`로 격리되며 구조적으로 보장됨을 계약 테스트(#206)로 확인, 실제 동작은 `isPending` 기반 스켈레톤으로 대체(가드 자체는 더 이상 필요 없어짐, PRD에서 예상한 대로).
- ✅ 팔로우/언팔로우가 API 성공 후에만 반영되는 현재 타이밍 — #198/#201 characterization 테스트 + 실제 브라우저 확인.
- ✅ 닉네임/bio 수정이 API 성공 후에만 반영되는 현재 타이밍 — #198/#202 테스트 + 실제 브라우저 확인(단, 이 과정에서 반영 "내용"의 버그를 발견해 수정함, 타이밍 자체는 invariant대로 유지됨).
- ✅ 내 프로필이 아닌 대상을 팔로우/언팔로우해도 내 프로필 정보에 영향 없음 — #204 신규 테스트("내 프로필이 아닌 목록에서 팔로우 토글해도 내 프로필 캐시에는 영향이 없다").
- ✅ `isMyProfile` UI 분기(Recap 버튼 vs 팔로우 버튼) — 변경 없음, #198 characterization 테스트로 커버.

## Decision Review

adr.md에서 선택한 안 3(`useMutation` 완전 이관)의 예상과 실제 비교:

- **예상**: 4개 쓰기 액션이 모두 비낙관적이라 `onMutate`/롤백 설계가 필요 없어 안 2와 위험 수준이 비슷하면서 `ProfileActionButton`의 로딩 상태 관리까지 표준화하는 이득이 있다 → 실제로 `onMutate` 관련 문제는 전혀 없었다(지난 플레이리스트 사이클과 달리 이 부분의 예측이 정확히 들어맞음).
- **예상하지 못했던 점**: `useMutation`으로 전환하며 `onSuccess`의 응답 값(`data`)을 캐시에 직접 쓰는 패턴(`usePlaylistDetail`의 `renameMutation`이 로컬 `variables`만 병합했던 것과 달리, `#202`는 처음에 API 응답을 그대로 신뢰했다)이 실제 API 계약과 어긋난다는 것을 GATE 3의 실제 브라우저 검증에서야 발견했다. 정적 검증(lint/type-check/기존 유닛 테스트)은 이 문제를 전혀 잡지 못했다 — 유닛 테스트(#202 최초 작성분)도 `updateProfile.mockResolvedValue(updatedProfile)`처럼 **실제와 다른 응답 형태를 스스로 가정해서 mock**했기 때문에 테스트 자체가 잘못된 계약을 검증하고 있었다. 이는 "개발환경 실동작 확인은 사용자에게 위임하지 않는다"는 워크플로 규칙이 실제로 버그를 잡아낸 사례이자, `playlist-detail-caching`(전 사이클)이 `renameMutation`에서 이미 "API 응답이 아니라 로컬 값을 병합하라"는 패턴을 썼는데 이번엔 그 패턴에서 벗어났다가 문제가 생긴 사례다.
- **교훈**: `useMutation`의 `onSuccess`에서 서버 응답 값을 캐시에 쓸 때는, 그 응답이 실제로 무엇을 반환하는지 API 코드(`apps/api`)로 직접 확인하지 않으면 프론트엔드 타입 선언(`Promise<Profile>`)만으로는 속을 수 있다는 것이 재확인됐다.

## Remaining Debt

- `ProfileInfo`/`ProfileActionButton`/`UserListModal`이 캐시를 쓰는 부분(`setQueryData`)에 실패 시 롤백 로직이 없다 — 애초에 비낙관적 액션이라 실패해도 캐시를 건드리지 않으므로 롤백이 필요한 상황 자체가 없다. 별도 부채 아님.
- `usePostReactionOverridesStore`(#185)는 이번 사이클과 별개로 여전히 남아있다 — PRD Out of Scope, 다음 백로그 후보.
- `updateProfile`처럼 실제 API 응답 형태가 프론트엔드 타입 선언과 다른 사례가 이번에 하나 발견됐다 — 다른 `api/internal/*.ts` 함수들도 비슷한 불일치가 있을 수 있으나, 이번 사이클 범위를 벗어나 전수 조사는 하지 않았다.

## Follow-ups

- 별도 백로그 등록 없음 — 위 Remaining Debt 항목 중 실행 가능한 것은 없다(`usePostReactionOverridesStore`는 이미 #185로 등록돼 있음).
- `docs/tanstack-query/index.html`은 이번 사이클 대상이 아니라(useProfileStore는 애초에 그 문서의 Remaining Debt 표에 없었음) 갱신하지 않았다.

---

**[GATE 3]** 위 Before/After, 개발환경 실동작 확인(실제 브라우저에서 회귀를 발견·수정하고 재검증), Behavior Verification, 남은 부채를 확인해주시면 이 리팩터링 사이클을 종료하겠습니다.
