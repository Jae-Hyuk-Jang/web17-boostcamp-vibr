# ADR — profile-info-caching

## 3안 비교

### 안 1 — 최소 개선안

`useProfileStore`의 `profile: Profile | null` 슬롯을 `profiles: Record<userId, Profile>`로 바꿔 캐시 키만 추가한다. 구조는 zustand 그대로 유지하고, `UserListModal`의 이중 경로(자기 목록은 `setQueryData`, 내 프로필은 zustand)도 그대로 남는다.

### 안 2 — 경계 재설계안

`profileQueryKey(userId)` + `useProfile`(`useQuery`) 공용 훅을 신설한다. 4개 쓰기 지점(팔로우/언팔로우/닉네임·bio 수정/팔로잉 수 증감)은 기존과 같은 `try/await` 구조를 유지하되, 성공 직후 `queryClient.setQueryData(profileQueryKey(userId), updater)`를 추가로 호출한다. `useProfileStore`는 삭제한다.

### 안 3 — 검증된 도구 도입안(useMutation 완전 이관) — **선택**

안 2와 같이 `useProfile`(`useQuery`)을 신설하되, `ProfileActionButton`의 팔로우/언팔로우 요청과 `ProfileInfo.handleSave`의 프로필 수정 요청을 각각 `useMutation`으로 재작성한다. 4개 쓰기 액션이 모두 이미 비낙관적(await 성공 후에만 반영)이므로 `onSuccess`에서만 캐시를 쓰고, `onMutate`/롤백 설계는 필요 없다. `ProfileActionButton`의 수동 `isLoading` state는 `mutation.isPending`으로 대체한다.

## 비교표 (10개 고정 기준)

| #   | 기준                 | 안 1                                                           | 안 2                                                                        | 안 3(선택)                                                                                              |
| --- | -------------------- | -------------------------------------------------------------- | --------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| 1   | 근본 원인 해결력     | 중간 — 캐시 키는 생기지만 `UserListModal`의 이중 경로는 그대로 | 높음 — 4개 쓰기 지점이 같은 캐시 계층으로 통일                              | 높음 — 안 2와 동일 + `ProfileActionButton`의 로딩 상태 관리까지 표준화                                  |
| 2   | 동작 보존 난이도     | 낮음 — 기존 로직 거의 그대로                                   | 중간 — 4개 지점에 `setQueryData` 추가, 모두 비낙관적이라 타이밍 보존은 쉬움 | 중간 — `useMutation` 전환이지만 `onMutate`가 필요 없어 안 2와 위험 수준이 비슷함(지난 사이클과 다른 점) |
| 3   | 책임·의존성 변화     | 매우 작음                                                      | 중간 — 신규 훅 1개, 소비처 3곳 수정                                         | 중간~큼 — 신규 훅 1개 + 소비처 3곳 + `ProfileActionButton` 내부 구조 변경                               |
| 4   | 테스트 용이성        | 낮음 — `Record` 기반 zustand는 새 테스트 패턴 필요             | 높음 — 기존 `createQueryClientWrapper` 인프라 재사용                        | 높음 — `useMutation` 생명주기(`isPending`/`isError`) 테스트가 표준화됨                                  |
| 5   | 변경 범위            | 작음                                                           | 중간(4개 파일)                                                              | 중간(4개 파일 + `ProfileActionButton`의 `isLoading` state 제거)                                         |
| 6   | 점진적 전환 가능성   | 쉬움                                                           | 가능 — 훅 도입 후 소비처 하나씩 전환                                        | 가능 — 같은 순서, 액션별로 이슈를 나눠 순차 전환 가능                                                   |
| 7   | 롤백 가능성          | 쉬움                                                           | 쉬움                                                                        | 쉬움 — 액션별 커밋이 분리되어 있으면 개별 되돌리기 가능                                                 |
| 8   | 성능·운영 영향       | 무해                                                           | 긍정적(캐시 격리)                                                           | 긍정적(캐시 격리) — 안 2와 동일                                                                         |
| 9   | 기존 코드와의 일관성 | 낮음 — 기존 zustand 패턴을 변형만                              | 높음 — `usePostDetail`류 `setQueryData` 패턴과 동일                         | 매우 높음 — `usePlaylistDetail` 사이클의 `useMutation` 패턴과 동일(이번엔 `onMutate` 없이 더 단순)      |
| 10  | 유지 비용            | 중간 — 캐시 키는 생겼지만 이중 경로 유지 비용은 그대로         | 낮음                                                                        | 낮음 — 로딩 상태 관리까지 표준화돼 `ProfileActionButton` 자체 복잡도도 감소                             |

## 라이브러리 도입 심사

해당 없음 — 새 라이브러리 도입이 아니다. TanStack Query는 `server-state-caching`(#148)에서 이미 도입·검증됐고, `playlist-detail-caching` 사이클에서 `useMutation` 패턴도 이미 검증됐다. 이번 사이클은 같은 패턴을 프로필 도메인에 적용하는 것뿐이다.

## 의사결정 인터뷰 로그

**Q. 3안 중 어느 안을 선택할까요? 이번에는 4개 쓰기 액션(팔로우/언팔로우/수정/증감)이 모두 이미 비낙관적(await 성공 후에만 반영)이라, 지난 플레이리스트 사이클과 달리 onMutate/롤백 설계가 필요 없습니다.**
A. 안 3 — useMutation 완전 이관(추천). 이유: 4개 액션이 모두 비낙관적이라 위험이 낮고, `ProfileActionButton`의 수동 `isLoading` state를 없앨 수 있다는 실질적 이득이 있다는 진단을 그대로 채택.

## 선택: 안 3

지난 `playlist-detail-caching` 사이클에서는 4개 액션 중 1개(순서변경)만 낙관적이라 안 3(`useMutation` 완전 이관)이 안 2보다 위험했지만, 이번엔 4개 액션 전부 비낙관적이라 `onMutate`/롤백 설계 자체가 필요 없다 — 비교표 기준 2(동작 보존 난이도)에서 안 2와 안 3의 차이가 사실상 사라진다. 반면 기준 1·10에서 안 3이 `ProfileActionButton`의 로딩 상태 관리까지 표준화한다는 실질적 이점을 더 갖는다. 위험 대비 이득이 명확해 안 3을 선택했다.

## ADR 본문

### Context

`useProfileStore`가 프로필 정보를 `userId`로 구분되지 않는 zustand 전역 슬롯에 보관한다. `ProfileView`(조회), `ProfileInfo`(팔로우 토글 콜백 연결 + 닉네임/bio 수정), `UserListModal`(내 프로필일 때 팔로잉 수 증감)이 소비한다. `UserListModal`은 자기 자신의 목록 쿼리 캐시는 `setQueryData`로, 프로필 정보는 zustand로 나눠 갱신하는 이중 경로를 갖고 있다. 안전망은 `ProfileView.test.tsx`(4개)+`UserListModal.test.tsx`(7개)뿐이고, `ProfileInfo.tsx`/`useProfileStore.ts`를 직접 겨냥한 테스트는 0건이다.

### Decision

`profileQueryKey(userId)` 기반 `useProfile` 공용 훅(`useQuery`, `staleTime: 60_000`)을 신설한다. `ProfileActionButton`의 팔로우/언팔로우 요청과 `ProfileInfo.handleSave`의 프로필 수정 요청을 각각 `useMutation`으로 재작성하고, `onSuccess`에서 관련 `profileQueryKey` 캐시를 `setQueryData`로 갱신한다. `UserListModal`의 "내 프로필일 때만" 분기는 유지하되, 그 안에서 호출하던 zustand 액션을 같은 `setQueryData` 호출로 교체한다. `useProfileStore.ts`는 모든 소비처 전환이 끝난 뒤 삭제한다.

### Alternatives

안 1(Record 기반 zustand)은 캐시 키는 생기지만 `UserListModal`의 이중 경로 문제(이번 사이클의 핵심 근거)를 해결하지 못해 기각. 안 2(수동 `setQueryData`)는 안 3과 위험 수준이 비슷한데도 `ProfileActionButton`의 로딩 상태 관리 개선 기회를 놓쳐 기각.

### Consequences

- 4개 쓰기 액션이 같은 캐시 계층(`setQueryData`)으로 통일되고, `ProfileActionButton`의 `isLoading` state가 `mutation.isPending`으로 대체돼 컴포넌트가 단순해진다.
- `useProfileStore.ts`가 삭제되고 `stores/index.ts`에서도 제거된다.
- 안전망이 얇았던 만큼(`ProfileInfo`/`ProfileActionButton` 0건), 체크포인트에서 characterization 테스트를 구조 변경보다 먼저 확보한다.

### Migration

아래 체크포인트 이슈 순서대로 진행한다. 각 이슈는 머지 후에도 저장소가 정상 상태를 유지한다.

### Rollback

`apps/api`/`packages/dto` 변경이 없고 DB/스키마 마이그레이션도 없으므로, 각 체크포인트 이슈는 해당 커밋만 `git revert`하면 이전 동작으로 즉시 복귀 가능하다.

## 회귀 안전망

우선순위: Characterization → Contract → State-transition → Integration → E2E.

1. **Characterization** (최우선, 구조 변경 전에 반드시 먼저 추가)
   - `ProfileInfo.tsx`: 팔로우 토글 콜백 연결(현재 `toggleFollow`) 호출 시 팔로워 수/팔로우 여부가 화면에 반영되는지, 닉네임/bio 수정(`handleSave`) 성공/실패 시 동작.
   - `ProfileActionButton.tsx`: 팔로우/언팔로우 성공/실패, `isLoading` 상태 전이, `isMyProfile`일 때 Recap 버튼으로 분기되는 동작.
   - `ProfileView.tsx`: `getUser` 실패 시 `renderError` throw 경로(현재 테스트 없음), `profile?.id !== userId`일 때 스켈레톤 표시.
   - `UserListModal.tsx`: 이미 있는 "내 프로필에서 팔로우 토글 시 전역 프로필(팔로잉 수)이 증가한다" 테스트가 새 구조에서도 그대로 통과하는지 재확인.
2. **Contract**
   - `profileQueryKey(userId)` 캐시 격리: 서로 다른 `userId`로 프로필을 연속 조회해도 캐시가 섞이지 않는다(Success Criteria).
   - `useMutation`의 `onSuccess`가 정확한 `profileQueryKey`에 정확한 필드만 갱신하는지(팔로우 토글은 `isFollowing`+`followerCount`, 수정은 `nickname`+`bio`, 증감은 `followingCount`).
3. **State-transition**
   - `useQuery`의 `pending → success/error` 전이.
   - 각 `useMutation`의 `idle → pending → success/error` 전이.
4. **Integration**
   - `UserListModal`과 `ProfileView`(내 프로필)를 같은 `QueryClient` 아래 마운트해, 모달에서 팔로우 토글 시 프로필 화면의 팔로잉 수가 갱신되는지 검증(이번 사이클의 핵심 시나리오 — 캐시 재사용이 아니라 "쓰기 전파").
5. **E2E** — Out of Scope(기존 사이클과 동일하게 미다룸).

### 회귀 시나리오

| 시나리오                                                       | 기존 결과                                               | 검증 수준              | 실패 시 조치                            |
| -------------------------------------------------------------- | ------------------------------------------------------- | ---------------------- | --------------------------------------- |
| `ProfileView`에서 `getUser` 실패                               | 에러가 throw되어 에러 바운더리로 전파(현재 테스트 없음) | Characterization(신규) | 구현 중단                               |
| 다른 `userId`로 프로필 이동                                    | 스켈레톤 표시 후 새 프로필 렌더링                       | Characterization       | 구현 중단                               |
| `ProfileActionButton`에서 팔로우/언팔로우                      | API 성공 후에만 상태 반영, 실패 시 toast                | Characterization       | 구현 중단                               |
| `ProfileInfo`에서 닉네임/bio 수정                              | API 성공 후에만 반영                                    | Characterization       | 구현 중단                               |
| `UserListModal`에서 다른 사람 팔로우(내 프로필 아님)           | 내 프로필 정보에 영향 없음                              | Characterization       | 구현 중단                               |
| `UserListModal`에서 내 프로필 대상 팔로우 → `ProfileView` 반영 | (신규 계약) 팔로잉 수가 두 화면 모두에서 일치           | Integration            | Success Criteria 미달성으로 이슈 재작업 |
| 서로 다른 `userId` 연속 조회                                   | (신규 계약) 캐시가 섞이지 않음                          | Contract               | Success Criteria 미달성으로 이슈 재작업 |

## 체크포인트 이슈 목록

각 이슈는 반나절~하루 크기, 한 이슈에서 한 종류의 변화만 다룬다.

1. **안전망 확보** — `ProfileInfo`/`ProfileActionButton`/`ProfileView`의 characterization/contract 테스트 추가(현재 0건인 부분 포함). 구조 변경 없음.
2. **`useProfile` 훅 신설** — `profileQueryKey(userId)` + `useQuery`(`staleTime: 60_000`) 공용 훅 추가 및 단위 테스트. 아직 소비처 전환 안 함.
3. **`ProfileView` 읽기 경로 전환** — `getUser`+`useEffect` 조합을 `useProfile`로 교체, `useProfileStore.setProfile` 호출 제거. 다른 소비처는 아직 유지.
4. **`ProfileActionButton`의 팔로우/언팔로우를 `useMutation`으로 전환** — 수동 `isLoading` state를 `mutation.isPending`으로 대체. `onFollowActionComplete` 콜백 호출은 `onSuccess`에서 유지.
5. **`ProfileInfo.handleSave`(닉네임/bio 수정)를 `useMutation`으로 전환** — `onSuccess`에서 `profileQueryKey` 캐시에 `setQueryData`.
6. **`ProfileInfo`의 `onFollowActionComplete` 콜백을 캐시 쓰기로 교체** — 현재 `toggleFollow`(zustand) 대신 `profileQueryKey` `setQueryData`.
7. **`UserListModal`의 "내 프로필" 분기를 캐시 쓰기로 교체** — `incrementFollowingCount`/`decrementFollowingCount` 호출을 `profileQueryKey` `setQueryData`로 교체. 이 시점에 `UserListModal`이 더 이상 `useProfileStore`를 쓰지 않게 됨.
8. **`useProfileStore.ts` 삭제** — `stores/index.ts`에서 제거, 소비처 전무 확인(`grep`으로 재확인).
9. **Success Criteria 계약/통합 테스트 추가 + dead code 제거** — userId 격리 계약 테스트, `UserListModal`↔`ProfileView` 쓰기 전파 통합 테스트, 미사용 코드 정리.
10. **문서 갱신** — `result.md` 작성, 이슈 #178 완료 코멘트 후 클로즈.

### 생성된 이슈

| 체크포인트                                            | 이슈 |
| ----------------------------------------------------- | ---- |
| 1. 안전망 확보                                        | #198 |
| 2. `useProfile` 훅 신설                               | #199 |
| 3. `ProfileView` 읽기 경로 전환                       | #200 |
| 4. `ProfileActionButton` → `useMutation`              | #201 |
| 5. `ProfileInfo.handleSave` → `useMutation`           | #202 |
| 6. `ProfileInfo`의 `onFollowActionComplete` 콜백 교체 | #203 |
| 7. `UserListModal`의 "내 프로필" 분기 교체            | #204 |
| 8. `useProfileStore` 삭제                             | #205 |
| 9. 계약/통합 테스트 + dead code 제거                  | #206 |
| 10. 문서 갱신                                         | #207 |

프로젝트 보드 등록은 `gh` 버전이 2.4.0(2.20 미만, `gh project` 서브커맨드 미지원)이라 자동화하지 못했습니다 — 필요하면 수동으로 등록해주세요.

---

**[GATE 2]** 위 대안 선택, 인터뷰 로그, ADR 본문, 회귀 안전망, 이슈 분해를 확인해주시면 실제 GitHub 이슈를 생성하겠습니다.
