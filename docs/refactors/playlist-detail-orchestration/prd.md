# PRD — playlist-detail-orchestration

## 문제 정의

`brief-original.md` 요약: `PlaylistDetailModal.tsx`(251줄)는 UI 로컬 state 6개, `useMutation` 4개, 파생 핸들러 10개 이상이 컴포넌트 함수 본문에 전부 inline돼 있다. 같은 저장소의 post 상세(`hooks/post/usePostDetailModal.ts`)와 게시글 작성(`hooks/post/useContentWrite.ts`)은 동일한 성격의 오케스트레이션 로직을 컴포넌트와 분리된 훅 파일로 빼는데, playlist 도메인만 다른 조직 방식을 쓴다. 이 문제는 직전 사이클(`playlist-detail-state-consolidation`, #253)의 PRD 진단 중 확인됐고, 목표 인터뷰에서 "데이터 소유권 통합"(그 사이클의 범위)과 "조직 방식"(이 사이클의 범위)을 별개 축으로 보고 후자를 의도적으로 이슈(#276)로 남겨뒀다.

왜 지금 다뤄야 하는가: 백로그 이슈 `#275`(Header/SongList/Toolbar prop drilling → Context 전환)가 다음 후보로 남아있는데, 그 작업이 이 훅 추출보다 먼저 진행되면 Context Provider가 지금 컴포넌트에 있는 state·mutation을 그대로 떠안게 되어 "긴 컴포넌트"가 "긴 Provider"로 자리만 옮기는 결과가 된다. 순서를 지금 바로잡는 편이 이후 비용이 적다(§비판적 재검토에서 자세히 다룸).

## 비판적 진단 (시니어 개발자 시각)

### 근거

- **Fact** — `PlaylistDetailModal.tsx` L18-37: `usePlaylistDetail` 구독 + 로컬 state 6개(`selectedSongIds`/`isEditingTitle`/`draftTitle`/`isConfirmOpen`/`isInvalidTitle`/`musicQuery`)가 컴포넌트 최상단에 선언돼 있다.
- **Fact** — L62-189: `useMutation` 4개(`changeOrderMutation`/`addSongMutation`/`renameMutation`/`deleteMutation`)가 전부 컴포넌트 본문에 inline이고, 각각 `queryClient.setQueryData`/`bumpPlaylistRefresh` 캐시 조작을 직접 담고 있다. 이 4개는 순수 로직(JSX 의존 없음)이라 훅으로 옮겨도 계산 결과가 달라지지 않는다.
- **Fact** — L45-194: `onPlayTotalSongs`/`toggleSelectSong`/`requestChangeOrder`/`deleteSelectedSongs`/`moveSong`/`moveSongTo`/`handleAddSong`/`startRename`/`validateRename`/`commitRename`/`cancelRename`/`requestDeletePlaylist` 12개 핸들러가 전부 컴포넌트 본문에 있다.
- **Fact(대조군)** — `hooks/post/usePostDetailModal.ts`(222줄)는 데이터 조합·플레이어 연동·편집 모드·UX 로그를 컴포넌트 밖 훅으로 완전히 분리했고, 그 훅을 쓰는 `PostCardDetailModal.tsx`는 `PostDetailModalContext.Provider`로 훅 반환값을 감싸는 조립부(12줄)만 남았다.
- **Fact(대조군)** — `hooks/post/useContentWrite.ts`(198줄)도 동일 패턴 — `UseContentWriteResult` 타입의 반환 객체(state·setter·핸들러)를 갖고, `ContentWriteModal.tsx`(82줄)는 그 훅을 불러 렌더링만 담당한다.
- **Fact** — `PlaylistDetailModal.test.tsx`(21개 테스트, 전부 `render(<PlaylistDetailModal .../>)` 경유)는 컴포넌트를 통째로 렌더링해 DOM assertion과 `queryClient.getQueryData` 직접 조회로 검증한다 — 훅을 별도로 단위 테스트하는 시도는 없다. 즉 오케스트레이션 로직은 이미 이 21개 테스트로 간접 검증되고 있다.
- **Fact** — `docs/conventions.md` §3.4는 훅 파일명 규칙(`hooks/{domain}/use{Domain}{Action}.ts`)만 규정하고 "언제 컴포넌트에서 훅으로 분리해야 하는가"는 강제 규칙으로 명시하지 않는다 — 이번 사이클에서 새 강제 규칙을 만들지 않고, 이미 두 도메인에서 반복된 실제 패턴을 이 도메인에도 맞추는 것으로 범위를 좁힌다.
- **Inference** — `usePostDetailModal`/`useContentWrite`와 동일한 형태(하나의 훅이 state+mutation+핸들러를 갖고 typed result를 반환, 컴포넌트는 그 훅을 불러 조립만 함)를 적용하면 조직 일관성이 생긴다. 다만 반환 객체를 평평하게 둘지(`useContentWrite`처럼) 관심사별로 묶을지(`usePostDetailModal`의 `player: {...}`처럼)는 이번 PRD에서 결정하지 않고 ADR에서 다룬다(기술적 결정, 목표 인터뷰 대상 아님).

### 증상 → 원인 체인

`PlaylistDetailModal.tsx`가 한눈에 훑기 어렵고 오케스트레이션 로직과 JSX가 섞여 있다 → (왜?) 6개 state·4개 mutation·12개 핸들러가 컴포넌트 함수 본문에 전부 선언돼 있다 → (왜?) 이 컴포넌트가 만들어지고 이후 여러 차례 수정(`playlist-detail-caching`, `playlist-detail-state-consolidation` 두 사이클 포함)되는 동안, "오케스트레이션은 별도 훅으로, 컴포넌트는 조립만" 패턴이 post/content-write 도메인에서 나중에 확립됐지만 playlist 도메인에는 소급 적용되지 않았다(구조 원인: 나중에 정착된 패턴이 기존 코드로 역전파되지 않음 — `feed-search-domain` 사이클에서 `PostMedia`의 leaf 직접구독 부재를 진단할 때도 동일한 구조 원인이 확인됐다, 이번이 이 저장소에서 세 번째 관찰 사례).

### 아키텍처 관점

- 이 문제는 `PlaylistDetailModal`에 국한되지 않는 반복 패턴이다 — 이번 세션에서만 "나중에 정착된 패턴이 오래된 코드에 소급되지 않음" 구조 원인이 이미 두 번(`PostCardDetailModal`/`ContentWriteModal`의 훅 분리 vs `PlaylistDetailModal`, `PostMedia`의 leaf 직접구독 vs 상위 통과) 확인됐다. 이번이 세 번째다.
- 기존 컨벤션과 충돌하지 않는다 — `docs/conventions.md` §3.4의 훅 네이밍 규칙과 호환되고(`hooks/playlist/usePlaylistDetailModal.ts` 같은 이름이 기존 `usePlaylistDetail.ts`/`usePlaylistRecommendations.ts`와 나란히 놓일 수 있음), 새 강제 규칙을 만들지 않는다.
- "당시엔 맞았지만 전제가 깨진" 결정이라기보다, 애초부터 이 컴포넌트가 먼저 만들어졌고(`playlist-detail-caching` 사이클 이전) 이후 다른 도메인에서 정착된 조직 관례가 아직 여기로 돌아오지 않은 경우다.

### 비판적 재검토 (사용자 문제 제기에 대한 반박 질문과 답)

- **이 증상이 정말 구조 문제인가, 아니면 파일이 길다는 인상뿐인가?** 파일 길이(251줄) 자체는 증거가 아니다 — 응집된 책임 하나를 251줄에 담았다면 문제가 아닐 수 있다. 하지만 이 파일은 "UI 로컬 state 관리", "서버 상태 변경(mutation) 오케스트레이션", "JSX 조립" 세 가지 서로 다른 성격의 책임을 한 함수에 담고 있고(경계 명확성 문제), 저장소의 다른 두 유사 도메인은 이미 이 세 책임 중 앞의 둘을 훅으로 분리했다 — 이건 우연이 아니라 반복된 조직 패턴에서 이 도메인만 벗어나 있는 것이다.
- **지금 안 고치면 다음 몇 번의 변경에서 구체적으로 어떤 비용이 드는가(YAGNI)?** 가장 구체적인 비용은 백로그 `#275`다 — `#275`가 먼저 진행되면 Context Provider가 지금 이 251줄의 state·mutation을 그대로 옮겨 담아야 하고("컴포넌트 안의 큰 블록"이 "Provider 안의 큰 블록"으로 자리만 이동), 이후 훅 분리를 다시 하려면 Provider와 훅 양쪽을 동시에 건드리는 더 큰 변경이 된다. 지금(Context 전환 전) 훅부터 분리해두면 `#275`는 "이 훅의 반환값을 Context로 감싸기"라는 훨씬 작은 작업이 된다.
- **더 급한 다른 문제를 가리는 건 아닌가?** 이 영역에 재현된 버그나 사용자 불만은 없다(버그 라벨이 붙은 `#224`/`#226`/`#228`과 달리 순수 조직 문제). 다만 이번 세션에서 바로 앞 두 사이클(`playlist-detail-state-consolidation`, `feed-search-domain`)이 만든 검증 흐름과 안전망이 아직 신선하고, `#275`가 이 작업에 의존적이라 순서상 지금이 적절하다.
- **정직하게 말해, 이 변경이 실제로 무엇을 개선하는가?** 버그를 고치지 않고, 새 테스트 커버리지를 추가하지도 않는다(기존 21개 테스트가 이미 이 로직을 간접 검증 중). 개선되는 것은 ① 조직 일관성(다른 두 도메인과 동일한 패턴), ② `#275` 착수 비용 감소, ③ 오케스트레이션 로직을 컴포넌트 렌더링과 독립적으로 다룰 수 있게 되는 것(예: 향후 훅 단위 테스트를 원하면 그때 추가 가능) 세 가지뿐이다 — 이 정도 이득이 변경 비용(파일 이동, 21개 테스트 회귀 확인)을 넘는다고 판단해 진행하지만, "극적으로 좋아진다"는 과장은 하지 않는다.

## 목표와 범위

### Goal

`PlaylistDetailModal.tsx`의 오케스트레이션 로직(로컬 state 6개, mutation 4개, 파생 핸들러 전부)을 `hooks/playlist/` 아래 새 훅으로 옮기고, 컴포넌트는 그 훅을 호출해 JSX를 조립하는 역할만 남긴다. `usePostDetailModal.ts`/`useContentWrite.ts`와 동일한 조직 패턴을 따른다.

### Success Criteria

- 새 훅 파일이 `hooks/playlist/`에 생기고, `docs/conventions.md` §3.4 네이밍 규칙(`use{Domain}{Action}.ts`)을 따른다.
- `PlaylistDetailModal.tsx`에 `useState`/`useMutation`이 더 이상 직접 나타나지 않는다 — 전부 새 훅 안으로 이동.
- `PlaylistDetailModal.test.tsx`의 기존 21개 테스트가 수정 없이 그대로 통과한다(컴포넌트를 통째로 렌더링하는 통합 테스트라 내부 구현 이동에 영향받지 않아야 함).
- 4개 mutation의 낙관적 업데이트 정책 차이(순서변경만 낙관적), 실패 시 롤백 없음, 삭제 후 캐시 강제 정리 없음 등 기존 동작이 전부 그대로 유지된다.
- `Header`/`Toolbar`/`SongList`로 전달되는 prop의 개수·값·타입이 바뀌지 않는다(이번 사이클은 그 값들이 "어디서 계산되는지"만 바꾼다 — prop drilling 자체의 정리는 `#275`의 범위).
- `lint`/`check-types`/`build`가 기존과 동일하게 통과한다.

### Out of Scope

- **`#275`(Header/SongList/Toolbar Context 전환)** — brief-original.md에서 이미 결정된 대로 이 사이클은 훅으로만 옮기고 Context 도입은 다루지 않는다. 두 이슈의 선후 관계(이 사이클을 먼저 완료)는 위 비판적 재검토에서 근거를 확인했다.
- **4개 mutation의 낙관적 업데이트 정책 통일** — 순서변경만 낙관적인 비대칭은 이전 두 사이클에서 이미 검토·유지가 결정된 사항(전제 변화 없음).
- **새 훅에 대한 격리된 단위 테스트(`renderHook`) 추가 여부** — 목표 인터뷰에서 확인.
- **`usePlaylistDetail`/`usePlaylistRecommendations` 등 기존 조회 훅의 구조 변경** — 이번 사이클은 조회가 아니라 상세 모달의 UI/mutation 오케스트레이션만 다룬다.
- `apps/api`, `packages/dto` 변경.

## Behavior Invariants

- 4개 액션(제목수정/곡추가/순서변경/삭제) 각각의 성공/실패/유효성검사 동작은 코드 이동 전후 동일하다.
- 순서변경만 `onMutate`에서 낙관적으로 반영되고, 나머지 3개는 `onSuccess`에서만 반영되는 비대칭은 유지된다.
- 실패 시 낙관적으로 반영된 값을 롤백하지 않는 현재 동작은 유지된다.
- 삭제 성공 시 상세 캐시를 강제로 지우지 않는(재요청 레이스 방지) 현재 동작은 유지된다.
- 연속 mutation 후 `getPlaylistDetail`이 추가 호출되지 않는 현재 동작(재시딩 없음)은 유지된다.
- `Header`/`SongList`/`Toolbar`가 받는 prop의 이름·타입·값은 바뀌지 않는다.

## 기준선 검증

| 명령             | 결과 | 실패 항목 | 비고                                                          |
| ---------------- | ---- | --------- | ------------------------------------------------------------- |
| pnpm lint        | 성공 | 없음      | turbo 4개 태스크(root/ui/api/web) 전부 성공(web만 cache miss) |
| pnpm check-types | 성공 | 없음      | turbo 3개 태스크 전부 성공                                    |
| pnpm test        | 성공 | 없음      | web 49 suites / 275 tests 전부 통과                           |
| pnpm build       | 성공 | 없음      | web 프로덕션 빌드 성공                                        |

- playlist 도메인 테스트만 별도 실행(`pnpm exec jest --testPathPatterns="[Pp]laylist"`): **5 suites / 39 tests** 통과 — `PlaylistDetailModal.test.tsx`(21개), `usePlaylistDetail.test.ts`, `usePlaylistRecommendations.test.ts`, `PlaylistDetailCacheSharing.integration.test.tsx`, `PlaylistPickerModal.test.tsx` 등.
- 변경 영향 예상 파일: `PlaylistDetailModal.tsx`(핵심, 251줄→대폭 축소 예상), 신규 훅 파일 1개(`hooks/playlist/` 추정 200줄 내외) — 확정값 아님, ADR 단계에서 구체화.
- 번들 크기·빌드 시간 증분: 측정 불가 — 새 라이브러리 도입이 없고 순수 코드 이동이라 유의미한 증분이 예상되지 않지만, PRD 단계에서 별도 측정은 하지 않음.

## 목표 인터뷰 결과 (AskUserQuestion)

**Q. 새 훅(오케스트레이션 로직)에 대해 과연 단위 테스트(`renderHook`)를 추가할까요, 기존 21개 통합 테스트만으로 충분할까요?**
A. 기존 21개로 충분(추천). 이유: 순수 코드 이동이라 동작이 바뀌지 않아야 하고, 기존 21개 통합 테스트가 이미 이 로직을 간접 검증하고 있다는 진단을 그대로 채택. 새 테스트 파일을 또 늘리는 것은 이 변경의 실제 이득(조직 일관성)에 비해 과함.

Behavior Invariants·Success Criteria 초안은 코드에서 그대로 도출했으며, 위 인터뷰 결과와 함께 그대로 확정한다.

---

**[GATE 1]** 위 진단·목표·범위·Behavior Invariants·기준선을 확인해주시면 다음 단계(ADR)로 넘어가겠습니다.
