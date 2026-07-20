# Brief Fixed — post-detail-modal-responsibility

## Goal

`PostCardDetailModal.tsx`에 인라인으로 흩어진 UX 로그 수집 로직(체류 시간, 재생 곡 수, 곡별 재생 시간, 중복 전송 방지)을 전담 훅(가칭 `usePostDetailUxLog`)으로 추출해서, **`PostCardDetailModal`을 렌더링하지 않고도 로그 계산·중복 방지 로직을 독립적으로 검증할 수 있게** 한다.

## Success Criteria

1. **테스트 용이성(최우선)**: `usePostDetailUxLog`를 `renderHook`으로 단독 테스트할 수 있다 — 재생 시간 누적 계산, `emitOnce` 중복 방지 가드(닫기 경로와 unmount 경로 양쪽)를 `PostCardDetailModal` 전체를 렌더링하지 않고 검증한다.
2. `Date.now()`/`setInterval` 같은 외부효과가 훅 내부에 캡슐화되어, 테스트에서 주입/모킹 가능한 형태여야 한다(seam 확보).
3. `PostCardDetailModal.tsx`의 UX 로그 관련 코드(5개 ref, effect 2개, callback 2개, 약 105줄)가 제거되고 훅 호출로 대체된다 — 파일 길이 감소는 목표가 아니라 결과다.
4. `baseline.md`의 Behavior Invariants 10개, 특히 4·5번(dwell 로그 정확히 1회 전송, 비로그인 미전송)이 리팩터링 후에도 그대로 성립한다.

## Behavior Invariants (baseline.md 재확인, 변경 없음)

`docs/refactors/post-detail-modal-responsibility/baseline.md`의 10개 항목을 그대로 따른다. 특히:

- 로그인 사용자가 재생한 시간이 정확히 누적된다(4번).
- 모달이 어떤 경로로 닫히든(닫기 버튼/배경 클릭/스와이프/언마운트) 로그는 정확히 한 번만 전송된다(4번).
- 비로그인 사용자는 로그를 전송하지 않는다(5번).

## Out of Scope

- **반응형 라우팅 전환**(후보 B), **본문 수정 로직**(후보 C) 추출 — Stage 1에서 YAGNI 기준으로 보류. 이번 사이클에서 건드리지 않는다.
- **좋아요한 사용자 목록 오버레이, 반응 상태(`usePostReactions`) 로직** — 변경하지 않는다.
- **컨테이너/표현 전면 분리**(후보 E) — 범위 밖.
- **재생 트리거(`handlePlayFromPost`/`handlePlayAll`) 자체의 동작 변경** — UX 로그 훅으로 위임하는 배선만 바뀌고, `usePlayerStore` 액션 호출 방식은 그대로 둔다.
- **새 라이브러리 도입** — 필요 없음(네이티브 `Date.now`/`setInterval`만 사용, 훅 추출만으로 충분).
- **데이터 마이그레이션/배포 호환성** — 클라이언트 전용 로직이라 해당 없음.

## 용어 정의

- **UX 로그 요약(post-detail summary log)**: 모달이 닫히거나 언마운트될 때 서버(`/api/logs`)로 전송되는, 체류 시간(dwell)·재생한 곡 수·곡별 재생 시간을 담은 로그 1건.
- **emitOnce**: 같은 모달 세션에서 이 요약 로그가 두 번 전송되지 않도록 막는 가드.
