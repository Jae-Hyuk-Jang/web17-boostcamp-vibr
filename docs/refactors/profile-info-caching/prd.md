# PRD — profile-info-caching

## 문제 정의

`useProfileStore`(`stores/useProfileStore.ts`, 52줄)가 프로필 정보(닉네임/자기소개/팔로워·팔로잉 수/팔로우 여부)를 `userId`로 구분되지 않는 zustand 전역 슬롯 하나에 보관한다. 이슈 #178로 등록됐고, `usePostReactionOverridesStore`(#185, 별도 이슈)와 같은 계열이지만 소비처가 3곳(`ProfileView`/`ProfileInfo`/`UserListModal`)으로 더 적어 먼저 다룬다.

같은 급의 문제(캐시 키 없는 zustand 전역 슬롯)를 플레이리스트 상세(`playlistDetailQueryKey`, `playlist-detail-caching` 사이클)에서 이미 한 번 해결한 전례가 있어, 이번 사이클은 그 패턴을 프로필 정보에도 적용할 수 있는지 검증한다.

## 비판적 진단 (시니어 개발자 시각)

### 근거

- **Fact** — `ProfileView.tsx:53-67`가 `getUser(userId)`를 `useEffect`+`try/catch`+`useState`(`renderError`) 조합으로 직접 페칭해 `useProfileStore.setProfile(info)`에 저장한다. `userId`로 구분된 캐시 키가 없다.
- **Fact** — `ProfileView.tsx:78`에 `profile?.id !== userId`일 때 스켈레톤을 보여주는 가드가 있다 — 캐시 키 없이 전역 슬롯을 쓰는 구조에서 화면 전환 시 이전 프로필이 잠깐 보이는 것을 막기 위한 방어 코드로 보인다.
- **Fact** — `UserListModal.tsx:66-83`(`handleFollowActionComplete`)은 **같은 팔로우 액션 완료 후 상태 갱신**을 두 가지 다른 메커니즘으로 나눠 처리한다: ① 자기 자신의 목록 쿼리 캐시(`userListQueryKey`)는 `queryClient.setQueryData`로, ② 대상이 "내 프로필"일 때만 `useProfileStore`의 `incrementFollowingCount`/`decrementFollowingCount`를 별도 호출. 이 이중 경로는 `UserListModal.test.tsx:108`("내 프로필에서 팔로우 토글 시 전역 프로필(팔로잉 수)이 증가한다")에 이미 테스트로 고정돼 있다.
- **Fact** — `ProfileInfo.tsx:15-16,30-33`가 `useProfileStore`의 `toggleFollow()`/`updateProfileInfo()`를 직접 호출해 전역 슬롯을 갱신한다.
- **Fact** — `profileGridQueryKey(userId)`(`ProfileView.tsx:19`, `feed-list-query-migration` #166/#177에서 도입)는 이미 프로필 게시글 **목록**을 `userId`별로 캐시하고 있다 — 같은 화면 안에서 "게시글 목록"은 쿼리 캐시, "프로필 정보 자체"는 zustand로 서로 다른 상태 관리 방식이 공존한다.
- **Fact** — 안전망: `ProfileView.test.tsx`(4개) + `UserListModal.test.tsx`(7개) = 11개 테스트가 있지만, `ProfileInfo.tsx`(`toggleFollow`/`updateProfileInfo` 호출부)와 `useProfileStore.ts` 자체를 직접 겨냥한 테스트는 0건이다. `ProfileView.test.tsx`는 `ProfileInfo`를 목(mock)으로 대체해 렌더링만 확인하므로 실제 팔로우/수정 동작은 검증하지 않는다. `getUser` 실패 시 `renderError` throw 경로, `profile?.id !== userId` 스켈레톤 가드도 테스트되지 않는다.
- **Inference** — 팔로우 상태 갱신이 `queryClient.setQueryData`(자기 목록)와 `useProfileStore` 액션(전역 프로필)으로 나뉜 것은, `postDetailQueryKey`/`usePostDetail.updatePostContent`가 이미 정착시킨 "관련 상태는 같은 캐시 계층에서 `setQueryData`로 갱신한다"는 원칙이 프로필 도메인에는 아직 적용되지 않았기 때문으로 보인다.

### 증상 → 원인 체인

`UserListModal`에서 "내 프로필"의 팔로잉 수를 갱신할 때만 별도로 zustand 전역 액션을 호출해야 한다 → (왜?) 프로필 "정보"가 `userId`로 구분된 캐시가 없어 `queryClient.setQueryData`로 갱신할 대상 자체가 없다 → (왜?) 프로필 게시글 **목록**은 `feed-list-query-migration`(#166/#177)에서 쿼리 캐시화됐지만, 프로필 **정보**는 같이 다뤄지지 않고 여전히 zustand 전역 슬롯에 남아있다(구조 원인: 이전 사이클이 "목록"만 범위로 좁혔고, 이번이 그 다음 조각).

### 아키텍처 관점

- 이 문제는 이 화면에 국한되지 않는다 — `playlistDetailQueryKey`(플레이리스트 상세)가 이미 겪고 해결한 것과 같은 클래스("캐시 키 없는 zustand 전역 슬롯을 userId/id별 쿼리 캐시로 전환")다. 다만 프로필 정보는 쓰기 액션이 4개(팔로우/언팔로우/닉네임·bio 수정/팔로잉 수 증감)로, 플레이리스트 상세의 4개 액션과 규모가 비슷하다.
- 기존 컨벤션(`CLAUDE.md`의 "서버 상태와 UI 상태를 같은 종류로 취급하지 않는다")과 충돌하지 않는다 — 오히려 이 원칙을 프로필 도메인에도 마저 적용하는 방향이다.
- 이전 결정과 충돌하지 않는다 — `feed-list-query-migration`이 프로필 "정보"를 Out of Scope로 남긴 적은 있지만(암묵적), "하지 않기로" 명시적으로 결정한 적은 없다.

### 비판적 재검토 (사용자 문제 제기에 대한 반박 질문과 답)

- **이 증상이 정말 구조 문제인가, 아니면 우연한 버그인가?** 구조 문제다. `UserListModal`의 이중 경로(쿼리 캐시 vs zustand)는 실제 코드에 존재하고 테스트로도 고정돼 있다(Fact). 다만 `profile?.id !== userId` 가드가 막고 있는 "다른 프로필로 이동 시 이전 정보가 잠깐 보이는" 증상 자체가 실사용자에게 재현·보고된 사례는 이번 조사에서 없었다 — 가드가 이미 증상을 가리고 있어서인지, 애초에 문제가 없었는지는 구분할 수 없다. 이 점은 솔직히 밝혀둔다.
- **지금 안 고치면 다음 몇 번의 변경에서 구체적으로 어떤 비용이 드는가?** `UserListModal`처럼 "내 프로필일 때만 별도 처리"하는 분기가 프로필 정보를 다루는 곳마다 반복될 위험이 있다 — 예를 들어 향후 다른 화면에서 팔로우 토글을 추가하면 같은 이중 경로를 다시 구현해야 한다. 이미 한 곳(`UserListModal`)에서 이 패턴이 나타났다는 것 자체가 반복 가능성의 근거다.
- **더 급한 다른 문제를 가리는 건 아닌가?** 이번 조사에서 발견한 더 급한 문제는 없다. 다만 `ProfileInfo.tsx`/`useProfileStore.ts`의 characterization test 공백(0건)이 이번 전환의 실질적 리스크이므로, 회귀 안전망 확보가 이번 사이클의 선행 작업이 되어야 한다(ADR 단계에서 다룬다).

## 목표와 범위

### Goal

`ProfileView`/`ProfileInfo`/`UserListModal`이 프로필 정보를 `['profile', userId]`류 쿼리 캐시로 공유하도록 전환하고, 조회뿐 아니라 팔로우/언팔로우/닉네임·bio 수정/팔로잉 수 증감 쓰기 액션도 `setQueryData`로 통일한다. `useProfileStore`는 이번 사이클에서 완전히 삭제한다.

### Success Criteria

- 다른 사용자의 프로필로 이동해도 캐시가 `userId`로 격리돼, 이전 프로필 정보가 새 프로필 화면에 노출되지 않는다 — 이를 검증하는 계약 테스트를 추가한다.
- `UserListModal`의 "내 프로필일 때만 별도 zustand 호출" 분기가 사라지고, 모든 팔로우 상태 갱신이 같은 캐시 계층(`setQueryData`)을 통해 이뤄진다.
- `useProfileStore.ts` 파일이 삭제되고, `stores/index.ts`에서도 제거된다.
- 기존 Behavior Invariants가 모두 통과하고, `lint`/`check-types`/`test`/`build`가 기존과 동일하게 통과한다.

### Out of Scope

- `usePostReactionOverridesStore`(#185) — 별도 이슈, 이번 사이클과 섞지 않는다.
- 프로필 게시글 목록(`profileGridQueryKey`)의 무효화 로직 재검토 — `feed-list-query-migration`에서 이미 정리된 안정적 패턴이라 다시 손대지 않는다.
- `ProfileActionButton.tsx`의 팔로우 요청 API 호출 자체(`addFollow`/`removeFollow`) — 이번엔 그 결과를 어디에 반영하는지만 바꾼다.
- `apps/api`, `packages/dto` 변경.

## Behavior Invariants

- 프로필 조회 실패 시 에러 바운더리로 전파되는 현재 동작(`renderError` throw) 유지.
- `profile?.id !== userId`일 때 스켈레톤을 보여주는 동작(또는 이를 대체하는 동등한 로딩 상태 표시) 유지 — 다른 프로필로 전환 시 이전 프로필이 잠깐 보이지 않아야 한다.
- 팔로우/언팔로우 버튼 클릭 시 API 호출(`addFollow`/`removeFollow`) 성공 후에만 상태가 바뀌는 현재 타이밍 유지(낙관적 업데이트 아님 — `ProfileActionButton.handleFollowAction`은 `await` 후 `onFollowActionComplete()` 호출).
- 닉네임/bio 수정(`ProfileInfo.handleSave`)은 `updateProfile` API 성공 후에만 반영되는 현재 타이밍 유지.
- `UserListModal`에서 "내 프로필"이 아닌 대상을 팔로우/언팔로우해도 내 프로필 정보(팔로잉 수)에는 영향이 없는 현재 동작 유지.
- `isMyProfile`(내 프로필 여부에 따른 UI 분기 — Recap 버튼 vs 팔로우 버튼)은 유지.

## 목표 인터뷰 결과 (AskUserQuestion)

**Q. 이번 리팩터링의 범위는 무엇인가요? (조회만 쿼리화 vs 조회+팔로우/수정 액션까지 모두)**
A. 조회+쓰기 액션 모두(추천). 이유: `UserListModal`의 이중 경로(쿼리 캐시 vs zustand)가 바로 이 쓰기 액션들이라, 조회만 바꾸면 문제의 절반만 해결된다는 진단을 그대로 채택.

**Q. `useProfileStore`(zustand)를 이번 사이클에서 완전히 삭제할까요?**
A. 삭제(추천). 이유: 조회+쓰기 액션을 모두 전환하면 `useProfileStore`를 쓸 이유가 사라지고, 이전 사이클(`usePlaylistRefreshStore`, `useFeedRefreshStore` 등)도 전환 후 즉시 삭제해온 기존 패턴과 일치.

**Q. profile 캐시의 staleTime을 얼마로 둘까요?**
A. 60초 — 기존 패턴과 동일(추천). 이유: `playlistDetailQueryKey`/`postDetailQueryKey`와 같은 근거(세션 중 잦은 재편집 대상이 아님)를 프로필에도 그대로 적용하는 것이 일관성 측면에서 자연스러움.

**Q. Success Criteria에 "다른 프로필로 이동해도 캐시가 userId로 격리된다"를 계약 테스트로 명시할까요?**
A. 포함(추천). 이유: 브리프의 핵심 가설(캐시 키 없음 → 전역 슬롯 덮어쓰기 위험)을 직접 검증하는 유일한 방법이라는 진단을 그대로 채택.

## 기준선 검증

| 명령             | 결과 | 실패 항목 | 비고                                                                |
| ---------------- | ---- | --------- | ------------------------------------------------------------------- |
| pnpm lint        | 성공 | 없음      | 전 패키지 cache hit                                                 |
| pnpm check-types | 성공 | 없음      | 전 패키지 cache hit                                                 |
| pnpm test        | 성공 | 없음      | api 8 suites/37 tests, web 36 suites/202 tests 모두 통과(cache hit) |
| pnpm build       | 성공 | 없음      | web 프로덕션 빌드 성공(FULL TURBO, 전 패키지 cache hit)             |

- 프로필 관련 테스트만 별도 확인: `ProfileView.test.tsx`(4개), `UserListModal.test.tsx`(7개) = 11개. `ProfileInfo.tsx`/`useProfileStore.ts` 대상 테스트는 0개 — 이번 전환의 안전망 공백.
- 변경 영향 예상 파일: `ProfileView.tsx`, `ProfileInfo.tsx`(및 `ProfileInfo/` 하위 `ProfileActionButton.tsx`), `UserListModal.tsx`, `useProfileStore.ts`(삭제), `stores/index.ts`, 신규 쿼리 훅 파일 1개 — 측정 불가(실제 구현 전이라 확정값 아님, ADR 단계 이슈 분해에서 구체화).
- 번들 크기·빌드 시간 증분: 측정 불가 — 새 라이브러리 도입이 없어 유의미한 증분이 예상되지 않지만, 이번 PRD 단계에서 별도 측정은 하지 않음.

---

**[GATE 1]** 위 진단·목표·범위·Behavior Invariants·기준선을 확인해주시면 다음 단계(ADR)로 넘어가겠습니다.
