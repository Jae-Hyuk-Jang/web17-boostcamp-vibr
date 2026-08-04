# 문제 영역

`apps/web`에서 프로필 "정보"(닉네임/자기소개/팔로워·팔로잉 수/팔로우 여부)가 서버 상태 캐시가 아니라 `useProfileStore`(zustand) 전역 슬롯 하나에 들어있다. `usePostReactionOverridesStore`(#185, 별도 이슈로 분리)와 같은 계열이지만, 소비처가 더 적어 먼저 다룬다.

## 관찰한 증상

- `profile: Profile | null` 슬롯이 `userId`로 구분되지 않는다 — 다른 사용자의 프로필로 이동하면 같은 전역 슬롯을 덮어쓴다.
- 팔로우/언팔로우, 팔로잉 수 증감이 이 전역 슬롯을 손으로 갱신하는 액션(`toggleFollow`/`incrementFollowingCount`/`decrementFollowingCount`)으로 흩어져 있다.

## 실제 사례

- `apps/web/src/components/profile/ProfileView.tsx:53-67` — `getUser(userId)`를 `useEffect`+`useState` 조합으로 직접 페칭해 `useProfileStore.setProfile(info)`에 저장한다. 같은 파일 78행에서 `profile?.id !== userId`를 확인해 스켈레톤을 보여주는 가드가 있는데, 이는 "캐시 키가 없어서 다른 유저 프로필로 전환 시 이전 프로필이 잠깐 보일 수 있는" 문제를 화면에서 가리는 용도로 보인다(가설, 실제 깜빡임 재현은 안 함).
- `apps/web/src/components/profile/ProfileInfo/ProfileInfo.tsx:15-16,30-33` — `toggleFollow()`/`updateProfileInfo()`를 `useProfileStore`에서 직접 호출해 전역 슬롯을 갱신.
- `apps/web/src/components/modals/UserListModal/UserListModal.tsx:66-83` — 이 모달은 **자기 자신의 리스트 쿼리 캐시**(`userListQueryKey`)는 `queryClient.setQueryData`로 갱신하면서(정석적인 TanStack Query 패턴), 대상이 "내 프로필"일 때만 별도로 `useProfileStore`의 `incrementFollowingCount`/`decrementFollowingCount`를 호출한다 — 같은 종류의 상태 갱신이 한 컴포넌트 안에서 두 가지 다른 메커니즘(쿼리 캐시 vs zustand 전역 액션)으로 나뉘어 있다.
- `profileGridQueryKey(userId)`(`ProfileView.tsx:19`)는 이미 `feed-list-query-migration`(#166/#177)에서 프로필 게시글 목록용으로 쿼리 캐시화됐다 — 같은 화면 안에 "쿼리 캐시로 관리되는 부분(게시글 목록)"과 "zustand로 관리되는 부분(프로필 정보 자체)"이 공존한다.

## 초기 가설

- (가설) 프로필 정보를 `['profile', userId]`류 쿼리 캐시로 옮기면, `ProfileView`의 fetch 로직(`useEffect`+`try/catch`+`useState` 조합)을 `useQuery`로 대체할 수 있고, `UserListModal`의 두 갈래 갱신 로직(쿼리 캐시 + zustand)도 `setQueryData` 하나로 통일할 수 있을 것으로 보인다.
- (가설, 미검증) 이렇게 하면 "다른 사용자 프로필로 이동 시 캐시 키 없이 전역 슬롯을 덮어쓰는" 구조적 위험 자체가 사라진다. 다만 실제로 사용자가 겪은 버그(깜빡임 등)가 재현된 사례는 아직 없다 — PRD 단계에서 이 부분을 비판적으로 재검토해야 한다.

## 기대 효과

- 프로필 정보 조회·갱신이 `userId`로 구분된 캐시를 갖게 되어, 여러 프로필을 오가도 상태가 섞이지 않는다.
- 팔로우/언팔로우 후 상태 갱신이 `UserListModal`의 자기 목록 캐시와 동일한 방식(`setQueryData`)으로 통일되어, "내 프로필일 때만 별도 zustand 액션 호출" 같은 분기가 사라진다.

## 제약

- 이번 사이클은 `apps/web`(프론트엔드) 범위로 한정한다. `apps/api`, `packages/dto`의 계약은 바꾸지 않는다.
- 기존 사용자 동작(프로필 조회, 팔로우/언팔로우, 프로필 정보 수정)의 눈에 보이는 결과는 유지되어야 한다.
- 이미 도입된 TanStack Query 패턴(`usePlaylistDetail`, `usePostDetail` 등)과의 일관성을 우선 고려한다 — 새 라이브러리 도입은 없음.
