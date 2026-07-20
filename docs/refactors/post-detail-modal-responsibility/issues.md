# Issues — post-detail-modal-responsibility (안 2: UX 로그 전담 훅 추출)

"이 이슈만 머지해도 기존 동작이 유지되고 저장소가 정상 상태인가"를 기준으로 4개로 나눴습니다. 순서대로 의존합니다.

---

## 이슈 1 — `PostCardDetailModal` UX 로그 특성화 테스트 작성

### 목적

UX 로그를 훅으로 옮기기 전에, `regression-plan.md`의 회귀 행렬을 기존(리팩터링 전) 인라인 코드 기준으로 먼저 테스트로 고정한다.

### Scope

- `PostCardDetailModal.test.tsx` 신설 — `enqueueLog`를 스파이하여 회귀 행렬 7개 시나리오 검증
- `PostCard.test.tsx` 패턴(실제 store + 자식 컴포넌트/네트워크 훅 mock)을 그대로 적용

### Out of Scope

- `PostCardDetailModal.tsx` 실제 로직 변경(테스트만 추가)

### Behavior Invariants

- baseline.md의 4, 5번(dwell 로그 정확히 1회 전송, 비로그인 미전송)을 테스트로 고정

### Acceptance Criteria

- [ ] Given 로그인 사용자가 모달을 닫기 버튼으로 닫음, When 확인하면, Then `enqueueLog`가 dwell/재생 정보를 포함해 1회 호출된다
- [ ] Given 모달이 닫기 버튼 없이 unmount됨, When 확인하면, Then `enqueueLog`가 1회 호출된다
- [ ] Given 닫기 버튼 클릭 직후 unmount, When 확인하면, Then `enqueueLog`가 정확히 1회만 호출된다(중복 없음)
- [ ] Given 비로그인 사용자, When 모달이 닫히면, Then `enqueueLog`가 호출되지 않는다
- [ ] Given 이 게시글의 음악 재생 중 시간 경과, When 로그가 전송되면, Then `listenMsByMusic`에 반영된다
- [ ] Given 다른 게시글 음악 재생 중, When 확인하면, Then 이 게시글의 `listenMsByMusic`에는 반영되지 않는다

### Verification

- [ ] `pnpm --filter web test -- PostCardDetailModal`, `lint`, `check-types`

### Rollback

- 테스트 파일만 추가되므로 해당 커밋 revert로 충분

### Dependency

- 없음(첫 이슈)

---

## 이슈 2 — `usePostDetailUxLog` 훅 신설

### 목적

UX 로그 수집(ref 5개, effect 2개, callback 2개)을 전담 훅으로 캡슐화한다. 아직 어떤 컴포넌트도 이 훅을 쓰지 않는 안전한 상태로 둔다.

### Scope

- `apps/web/src/hooks/post/usePostDetailUxLog.ts` 신설: `{ enabled, postId, userId, isPlaying, currentMusicId, postMusicIds }` → `{ recordPlayedMusic(musicId), emit() }`
- `hooks/post/index.ts` 배럴에 export 추가
- 훅 자체의 유닛 테스트(`usePostDetailUxLog.test.ts`) 작성 — `renderHook`으로 dwell 계산, `emitOnce` 가드, 재생 시간 누적을 독립 검증(brief-fixed.md의 핵심 Goal)

### Out of Scope

- `PostCardDetailModal.tsx` 변경(다음 이슈)

### Behavior Invariants

- baseline.md 4, 5번

### Acceptance Criteria

- [ ] Given `usePostDetailUxLog`를 `renderHook`으로 단독 렌더링, When `emit()`을 두 번 연속 호출하면, Then 로그 전송은 1회만 발생한다(`emitOnce` 가드)
- [ ] Given 비로그인(`userId` 없음), When `emit()`을 호출하면, Then 로그가 전송되지 않는다
- [ ] Given `recordPlayedMusic`으로 여러 곡을 기록, When `emit()`을 호출하면, Then `playedMusicCount`가 정확하다

### Verification

- [ ] `pnpm --filter web test -- usePostDetailUxLog`, `lint`, `check-types`

### Rollback

- 신규 파일 삭제로 충분(아직 소비처 없음)

### Dependency

- 이슈 1 선행(회귀 대조군 확보)

---

## 이슈 3 — `PostCardDetailModal` 훅 전환

### 목적

`PostCardDetailModal.tsx`가 `usePostDetailUxLog`를 쓰도록 전환하고, 인라인 UX 로그 코드(ref 5개, effect 2개, callback 2개, 약 105줄)를 제거한다.

### Scope

- `PostCardDetailModal.tsx`: UX 로그 관련 ref/effect/callback 제거, `usePostDetailUxLog` 호출로 교체
- `handlePlayFromPost`/`handlePlayAll`에서 `recordPlayedMusic` 호출
- `handleClose`/unmount effect에서 `emit()` 호출

### Out of Scope

- 후보 B(라우팅 전환)·C(본문수정) 추출 — 이번 사이클 범위 밖
- 반응 상태(`usePostReactions`) 로직 변경

### Behavior Invariants

- baseline.md 10개 전부(특히 4, 5번)

### Acceptance Criteria

- [ ] Given 리팩터링 전/후, When 이슈 1의 `PostCardDetailModal.test.tsx`를 그대로 실행하면, Then 테스트 코드 수정 없이(mock 대상 경로 조정은 예외) 전부 통과한다
- [ ] Given `PostCardDetailModal.tsx`, When 파일을 확인하면, Then UX 로그 관련 ref/effect가 더 이상 존재하지 않는다

### Verification

- [ ] `pnpm --filter web test -- PostCardDetailModal`, `lint`, `check-types`, `build`

### Rollback

- `PostCardDetailModal.tsx`만 이전 커밋으로 되돌리면 복구(훅은 이슈 2로 이미 독립 검증된 상태라 영향 없음)

### Dependency

- 이슈 2 선행

---

## 이슈 4 — 결과 검증 및 `result.md`

### 목적

전체 기준선을 재확인하고 Before/After를 비교해 사이클을 공식 종료한다.

### Scope

- `pnpm lint`/`check-types`/`test`/`build` 전체 재실행 및 결과 기록
- `docs/refactors/post-detail-modal-responsibility/result.md` 작성(GATE 6)
- 남은 후보(B: 라우팅 전환, C: 본문수정, E: 전면 분리)를 백로그로 남길지 판단

### Verification

- [ ] `pnpm lint`, `pnpm check-types`, `pnpm test`, `pnpm build` 전부 통과
- [ ] baseline.md의 Behavior Invariants 10개 재확인

### Rollback

- 문서 변경뿐이므로 해당 없음

### Dependency

- 이슈 1~3 전부 완료 후
