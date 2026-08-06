# PRD — playlist-picker-cache-sync

## 문제 정의

`brief-original.md` 요약: `PlaylistPickerModal.tsx`가 `addMusicsToPlaylist`/`createNewPlaylist`를 `useMutation` 없이 직접 호출하고, 파일 전체에 `setQueryData`/`invalidateQueries` 호출이 0건이다. 성공해도 플레이리스트 목록·상세 캐시가 조용히 stale해진다. 이 문제는 `docs/component-hook-audit/index.html`(05 플레이리스트 도메인 감사, 심각도 "심각")에서 발견됐고, 이슈 `#284`로 등록됐다.

왜 지금 다뤄야 하는가: `PlaylistDetailModal` 도메인은 4번의 사이클(`playlist-detail-caching` #186 → `playlist-detail-state-consolidation` #253 → `playlist-detail-orchestration` #276 → `playlist-detail-prop-drilling` #275)을 거쳐 캐시·조직 구조가 정리됐다. `PlaylistPickerModal`은 그 정리 대상에 포함된 적이 없고(파일이 겹치지 않음), 이 도메인에 남은 유일한 심각도 "심각" 항목이다.

## 비판적 진단 (시니어 개발자 시각)

### 근거

- **Fact** — `PlaylistPickerModal.tsx` L68-80(`saveToPlaylist`): `addMusicsToPlaylist(playlistId, req)` 호출 후 성공 toast(`handleSaveResultToast`)와 `closeModal()`만 실행한다. `queryClient`를 아예 import하지 않는다(grep 확인) — 캐시 쓰기 코드가 전혀 없다.
- **Fact** — L98-113(`handleCreateAndSave`): `createNewPlaylist()`로 새 플레이리스트를 만든 뒤 `saveToPlaylist(created.id)`를 호출하지만, 새로 만든 플레이리스트가 `PLAYLISTS_QUERY_KEY`(`usePlaylists`가 구독하는 목록 캐시) 캐시에 전혀 반영되지 않는다.
- **Fact(대조군)** — `hooks/playlist/usePlaylistDetailModal.ts`의 `addSongMutation`(동일한 "곡을 플레이리스트에 추가" 서버 동작)은 `queryClient.setQueryData(playlistDetailQueryKey(...))` + `bumpPlaylistRefresh()`(`invalidateQueries({ queryKey: PLAYLISTS_QUERY_KEY })`)를 둘 다 수행한다 — 같은 서버 변경(`POST /playlist/:id/music`)에 대해 두 진입점(상세 모달 vs 피커 모달)의 캐시 처리가 완전히 다르다.
- **Fact** — `usePlaylists.ts`는 이미 `useQuery`(`PLAYLISTS_QUERY_KEY`) 기반이다 — `PlaylistPickerModal`도 이미 이 훅을 구독 중이라, 문제는 "TanStack Query 미도입"이 아니라 "mutation 성공 후 캐시를 갱신하는 코드가 빠졌다"는 좁은 지점이다.
- **Fact** — `PlaylistPickerModal.test.tsx`(74줄, 3개 테스트)는 배경 클릭/닫기, `usePlaylists` 구독 계약(외부에서 캐시가 무효화되면 재조회되는지)만 다룬다. `saveToPlaylist`/`handleCreateAndSave` 자체의 성공/실패 경로, 캐시 반영 여부는 테스트가 0개다 — `PlaylistDetailModal.test.tsx`가 21개 테스트로 4개 mutation을 촘촘히 커버하는 것과 대조적이다.
- **Fact** — `saveToPlaylist`는 `PlaylistDetailModal`이 이미 열려 있는 상태에서 같은 `playlistId`로 호출될 수 있다(사용자가 상세 모달과 피커 모달을 별개 진입점으로 오갈 수 있음, `ModalContainer.tsx` 확인) — 이 경우 상세 모달의 `playlistDetailQueryKey` 캐시가 갱신되지 않아 화면에 새로 추가한 곡이 반영되지 않는 실제 stale 시나리오가 성립한다.

### 증상 → 원인 체인

곡을 피커로 저장해도 이미 열려있는 상세 화면·목록에 반영되지 않는다 → (왜?) `PlaylistPickerModal.tsx`가 mutation 성공 후 관련 쿼리 캐시를 전혀 건드리지 않는다 → (왜?) 이 컴포넌트는 `useMutation`을 쓰지 않고 API 함수를 직접 `await`하는 방식으로 작성됐고, "서버 변경 후 캐시 갱신"이라는 규칙이 `PlaylistDetailModal` 쪽에만 적용되고 이 파일에는 처음부터 적용되지 않았다(구조 원인: 캐시 소유권·갱신 책임이 도메인 전체가 아니라 개별 컴포넌트 단위로 암묵적으로만 존재).

### 아키텍처 관점

- 이 문제는 `PlaylistPickerModal`에 국한되지 않는, 이 저장소에서 반복 관찰된 클래스다 — "같은 서버 동작에 대해 진입점마다 캐시 처리가 다르다"는 점에서 이번 세션의 다른 발견들("나중에 정착된 패턴이 예전 코드에 소급 안 됨")과 유사하지만, 이번은 조직/전달 방식이 아니라 **정확성**(캐시가 실제로 stale해짐) 문제라는 점이 다르다 — 심각도가 "심각"인 이유다.
- 기존 컨벤션과 충돌하지 않는다 — `CLAUDE.md`는 "서버 상태는 TanStack Query로 관리"를 이미 명시했고, `usePlaylistDetailModal.ts`의 `addSongMutation`이 정확히 따라야 할 참조 패턴으로 이미 존재한다. 새 패턴을 만드는 게 아니라 기존 패턴을 여기에도 적용하는 것이다.
- "당시엔 맞았지만 전제가 깨진" 결정이 아니라, 애초에 `PlaylistPickerModal`이 캐시 갱신 없이 작성됐고 그 이후 확립된 캐시 규칙이 이 파일에 소급 적용된 적이 없는 경우다.

### 비판적 재검토 (사용자 문제 제기에 대한 반박 질문과 답)

- **이 증상이 정말 구조 문제인가, 아니면 우연한 누락인가?** 감사 문서와 코드 확인 결과 "우연한 누락"이 아니라 파일 전체에 캐시 쓰기 코드가 체계적으로 없다(0건) — 단순 버그 하나가 아니라 이 파일이 캐시 갱신 책임 자체를 지지 않도록 작성됐다는 뜻이다. 구조 문제로 분류하는 것이 맞다.
- **지금 안 고치면 다음 몇 번의 변경에서 구체적으로 어떤 비용이 드는가(YAGNI)?** 이미 지금 이 순간에도 실재하는 사용자 체감 버그다(상세 모달이 열린 채로 피커로 곡을 추가하면 화면에 반영 안 됨) — YAGNI 판단 대상이 아니라 이미 발생 중인 결함이다.
- **더 급한 다른 문제를 가리는 건 아닌가?** 오히려 반대다 — 이 감사 문서의 플레이리스트 도메인에서 유일하게 남은 "심각" 등급이라, 지금까지 진행한 4개 사이클(전부 "중간"/조직 문제)보다 우선순위가 높다.

## 목표와 범위

### Goal

`saveToPlaylist`(및 `handleCreateAndSave`가 내부적으로 재사용하는 저장 경로)를 `useMutation`으로 전환하고, 성공 시 `usePlaylistDetailModal.ts`의 `addSongMutation`과 동일한 캐시 갱신(`playlistDetailQueryKey(playlistId)` 캐시 업데이트 + `PLAYLISTS_QUERY_KEY` invalidate)을 수행해 두 진입점의 캐시 처리를 일관되게 맞춘다.

### Success Criteria

- 곡 저장 성공 시 `playlistDetailQueryKey(playlistId)` 캐시가 갱신된다(이미 `PlaylistDetailModal`이 열려 있었다면 새로 추가된 곡이 화면에 반영됨).
- 곡 저장 성공 시 `PLAYLISTS_QUERY_KEY` 캐시가 invalidate되어 목록의 `tracksCount`가 최신화된다.
- `handleCreateAndSave`로 새로 만든 플레이리스트가 `PLAYLISTS_QUERY_KEY` 목록에 반영된다.
- 기존 사용자 체감 동작(성공/실패 toast 문구, 로딩 상태 `isCreating`/`submittingPlaylistId`, `isSubmittable` 가드, 모달 닫힘 시점)은 전혀 바뀌지 않는다.
- `PlaylistPickerModal.test.tsx`에 저장/생성 성공 시 캐시 반영을 검증하는 계약 테스트가 신규로 추가된다(착수 전 0개).
- `lint`/`check-types`/`build`가 기존과 동일하게 통과한다.

### Out of Scope

- **`PlaylistBriefItem`과의 마크업 중복**(`#284` 부수 발견, 경미) — 캐시 정확성 문제와 무관한 별개 축, 이번 사이클에서 다루지 않는다.
- **`PlaylistDetailModal`의 4개 mutation 자체** — `playlist-detail-orchestration`/`playlist-detail-prop-drilling`에서 이미 정리 완료, 이번 사이클은 참조만 한다.
- **삭제/제목수정 등 `PlaylistPickerModal`에 없는 다른 액션** — 이 컴포넌트에는 저장/생성 두 액션만 존재, 범위 확장 없음.
- `apps/api`, `packages/dto` 변경 — API 계약(`addMusicsToPlaylist`/`createNewPlaylist`의 요청/응답)은 이미 필요한 정보(`addedMusics`, 생성된 `PlaylistResDto`)를 반환하므로 프론트엔드만으로 해결 가능.

## Behavior Invariants

- `saveToPlaylist` 성공/실패 시 toast 문구(`'이미 플레이리스트에 있는 곡이에요.'`/`'보관함에 저장했어요.'`/`'저장에 실패했습니다.'`)는 변경 없다.
- `handleCreateAndSave` 성공/실패 시 toast 문구(`'플레이리스트 생성에 실패했습니다.'`)와 실패 시 `submitErrorMsg` 설정은 변경 없다.
- 저장 성공 시 `closeModal()`이 호출되는 시점은 변경 없다.
- `isSubmittable`(`hasMusics && !submittingPlaylistId && !isCreating`) 가드 로직은 변경 없다.
- `musics`가 없으면(`!musics || musics.length === 0`) 아무 것도 하지 않는 동작은 변경 없다.

## 기준선 검증

| 명령             | 결과 | 실패 항목 | 비고                                |
| ---------------- | ---- | --------- | ----------------------------------- |
| pnpm lint        | 성공 | 없음      | turbo 4개 태스크 전부 성공          |
| pnpm check-types | 성공 | 없음      | turbo 3개 태스크 전부 성공          |
| pnpm test        | 성공 | 없음      | web 49 suites / 275 tests 전부 통과 |
| pnpm build       | 성공 | 없음      | web 프로덕션 빌드 성공              |

- `PlaylistPickerModal.test.tsx` 단독 실행: **1 suite / 3 tests** 통과 — 전부 배경클릭/닫기/구독계약, 저장·생성 경로 테스트 0개(안전망 공백, 이번 사이클의 첫 체크포인트가 이를 메운다).
- 변경 영향 예상 파일: `PlaylistPickerModal.tsx`(핵심), `PlaylistPickerModal.test.tsx`(신규 테스트 추가) — 확정값 아님, ADR 단계에서 구체화.
- 번들 크기·빌드 시간 증분: 측정 불가 — 새 라이브러리 도입이 없고 변경 범위가 파일 1~2개 수준이라 유의미한 증분이 예상되지 않지만, PRD 단계에서 별도 측정은 하지 않음.

## 목표 인터뷰 결과 (AskUserQuestion)

**Q. `PlaylistPickerModal.test.tsx`에 추가할 테스트 범위는 어디까지가 좋을까요? (현재 저장/생성 경로 전용 테스트가 0개입니다)**
A. 저장/생성 성공+실패+캐시 반영 전체(추천). 이유: 이전 리팩터링 사이클들과 달리 이번은 실제 "심각" 등급 버그를 고치는 것이고, 안전망 자체가 0개인 상태에서 성공 경로만 고정하면 실패 경로의 회귀를 잡을 수 없다는 진단을 그대로 채택.

Behavior Invariants·Success Criteria 초안은 코드에서 그대로 도출했으며, 위 인터뷰 결과와 함께 그대로 확정한다.

---

**[GATE 1]** 위 진단·목표·범위·Behavior Invariants·기준선을 확인해주시면 다음 단계(ADR)로 넘어가겠습니다.
