# PRD — modal-composition-structure

## 문제 정의

`apps/web/src/components/modals/` 아래 8개 모달(`ContentWriteModal`, `LoginModal`, `MobileNowPlaylistModal`, `PlaylistDetailModal`, `PlaylistPickerModal`, `PostCardDetailModal`, `PrivacyConsentModal`, `UserListModal`)의 구조·관계가 파악돼 있지 않고, 공통 추출 가능한 부분과 배럴(`index.ts`) 구조의 유효성·순환 참조 여부가 확인된 적이 없다(`brief-original.md`).

직전 `modal-shell-duplication` 사이클(#64)이 backdrop·배경 클릭 판정·z-index·접근성을 `ModalShell`로 추출했지만, 이번 진단에서 그 사이클이 다루지 않은 두 번째 층의 중복(닫기 버튼·패널 컨테이너 마크업)과, PR #84에서 지적됐던 것과 같은 클래스의 순환 참조가 모달 도메인에도 남아있음을 확인했다. 정적 검증(lint/type-check/build)이 전부 통과해도 dev 모드에서만 재현되는 이 클래스의 버그를 이미 한 번 겪은 저장소이므로, 지금 확인해두는 것이 다음 모달 추가/수정 비용을 줄인다.

## 비판적 진단 (시니어 개발자 시각)

### 근거

**Fact**

- `madge --circular`로 저장소 전체를 검사한 결과 **13개의 실제 순환 참조**가 있다. 모달 도메인은 그중 **1개**뿐: `modals/ContentWriteModal/index.ts ↔ ContentWriteModal.tsx`(자기 배럴에서 형제 컴포넌트를 다시 import). 나머지 12개는 `hooks/index.ts`, `api/index.ts`, `stores`, `components/post`, `components/search`, `components/player` 등 모달과 무관한 도메인에 퍼져 있다.
- `@/components/modals`(도메인 최상위 배럴)를 import하는 곳은 저장소 전체에 **0곳**이다. `ModalContainer.tsx`도, 최상위 `components/index.ts`도 각 모달을 개별 파일 경로로 직접 import한다(`grep` 검증).
- `docs/conventions.md` §3.1은 "`components/{domain}/` 폴더마다 index.ts 배럴로 재export, 예외 없음(modals 포함)"이라고 명시하지만, PR #84(2026-07-21 병합)가 정확히 이 규칙 때문에 발생한 dev 모드 HMR 버그를 고치며 31개 파일을 개별 경로 import로 전환했다. 문서가 실제 코드 상태를 반영하지 못하고 있다.
- 8개 모달 하위 폴더별 `index.ts`(예: `ContentWriteModal/index.ts`)는 `ModalContainer.tsx`가 상대 경로(`from './ContentWriteModal'`)로 정상 소비한다 — 이 배럴들은 죽은 코드가 아니다.
- 직전 사이클에서 만든 `ModalCloseButton`(`components/ModalCloseButton.tsx`)의 실사용처는 저장소 전체에 **0곳**이다(테스트 파일 제외). 8개 모달이 전부 닫기 X 버튼을 손으로 새로 구현했고, 그 결과 최소 4가지 서로 다른 className 조합이 존재한다: ① `ContentWriteModal`/`LoginModal`(완전 동일, `ModalCloseButton`의 기본값과도 동일), ② `UserListModal`/`PlaylistPickerModal`(완전 동일, hover 배경만 다름), ③ `PrivacyConsentModal`(className 없는 bare button), ④ `PostCardDetailModal` 모바일/`MobileNowPlaylistModal`(아이콘 크기 `w-5 h-5`로 다름). `PlaylistDetailModal`은 모달 레벨 닫기 버튼 자체가 없다(배경 클릭으로만 닫힘).
- 패널 컨테이너 스타일(`bg-white w-full max-w-* rounded-3xl border-2 border-primary ... overflow-hidden`)이 7/8 모달에서 거의 동일하게 반복된다(`PostCardDetailModal` 데스크탑만 `rounded-2xl`/`shadow-2xl`/`max-w-5xl`로 의도적으로 다름). `docs/design-system.md` §8이 이미 이 패턴을 "재사용 가능한 레시피"로 문서화해뒀지만 컴포넌트로 추출되지는 않았다.
- `docs/design-system.md` §11("알려진 불일치")에 모달 관련 항목이 이미 두 개 기록돼 있다: 하드 섀도 색상 `#00214D` vs `var(--color-primary)` 혼용(문서가 예시로 든 위치는 최신 코드와 어긋나 있고, 실제로는 `PlaylistDetailModal.tsx:165`가 hex를 씀), 공용 `Button` 컴포넌트 부재.
- 저장소 eslint 설정 어디에도 `import/no-cycle`(또는 동급) 규칙이 없다 — 순환 참조가 생겨도 lint/CI가 잡지 못한다.
- 기준선 검증(아래) 전부 PASS. 8개 모달 모두 특성화 테스트 보유(web 48개 테스트 중 다수). `PostCardDetailModal.tsx`가 최근 6개월간 가장 많이 변경된 파일(6회) — hot spot.

**Inference**

- 헤더·닫기 버튼 중복은 실제 유지보수 마찰을 만든다 — 이미 만들어둔 공용 컴포넌트(`ModalCloseButton`)조차 강제되지 않아 안 쓰였다는 사실이, "추출만 하고 끝내면 또 이렇게 될 것"이라는 위험을 뒷받침한다.
- `conventions.md`와 실제 코드의 불일치는 다음 개발자가 어느 쪽을 믿어야 할지 헷갈리게 하고, 실수로 광범위 배럴 import를 다시 들여오는 회귀로 이어질 수 있다.

**Hypothesis**

- `ui/` 폴더 신설이 정리에 도움이 될 수 있다 — 다만 이미 `components/` 최상위에 `ModalShell`/`ModalCloseButton`/`LoadingSpinner`/`ConfirmOverlay` 등 도메인 없는 공용 컴포넌트가 loose 파일로 존재하므로, 새 폴더가 "새 문제 해결"이 아니라 "기존 관습의 재명명"에 가까울 수 있다. 검증 안 된 가설이므로 해결책으로 고정하지 않고 ADR 단계(3안 비교)에서 다룬다.

### 증상 → 원인 체인

```
증상: 새 모달을 추가하거나 기존 모달의 헤더/닫기 버튼/패널 스타일을 바꾸려면
      8곳 중 어디를 손대야 할지 확인해야 하고, 그 결과 이미 4가지 닫기 버튼
      변형과 하드 섀도 색상 혼용이 발생했다.
  ↓ 왜?
직접 원인: 닫기 버튼·패널 컨테이너 마크업이 8개 파일에 각자 인라인으로
           반복돼 있고, 유일하게 존재하는 공용 컴포넌트(ModalCloseButton)는
           강제되지 않아 실사용처가 0곳이다.
  ↓ 왜?
구조 원인: "공통 추출"이 컴포넌트 신설로 끝나고, 기존 소비처를 그 컴포넌트로
           전환하는 단계가 프로세스에 없었다(직전 사이클도 ModalShell/
           ModalCloseButton을 만들었지만 8곳 중 ModalShell만 전환되고
           ModalCloseButton은 전환되지 않은 채 종료됨).
```

### 아키텍처 관점

- 순환 참조는 모달 국소 문제가 아니라 저장소 전역 패턴(13개 중 12개가 모달 밖)이다 — 이번 사이클은 모달 1건만 다루고 나머지는 Follow-ups로 남긴다(사용자 확정).
- `conventions.md`의 배럴 "예외 없음" 규칙은 PR #84 이후 이미 깨진 전제 위에 서 있다 — 이번 사이클에서 규칙을 다시 쓰지는 않지만(Out of Scope), PRD에 이 사실을 명시해 후속 이슈의 근거로 남긴다.
- `ModalCloseButton`이 안 쓰이는 현상은 "컴포넌트를 만드는 것"과 "기존 코드를 그 컴포넌트로 전환하는 것"이 별개의 작업이라는, 이 저장소의 반복되는 패턴을 보여준다(직전 사이클의 `MobileNowPlaylistModal`/`PostCardDetailModal` 모바일도 결국 전환 안 하고 남겨둔 전례가 있다). 이번 사이클의 이슈 분해(ADR 단계)에서는 "컴포넌트 신설"과 "8곳 전환"을 반드시 같은 사이클 안의 순차 이슈로 묶어야 한다.

### 비판적 재검토 (사용자 문제 제기에 대한 반박과 답)

- **이 증상이 정말 구조 문제인가, 우연한 버그인가?** → 구조 문제다. `ModalCloseButton` 미사용, 패널 스타일 반복, 순환 참조 3가지 모두 한 파일의 실수가 아니라 8개 파일에 걸쳐 반복되는 패턴으로 확인됐다(Fact).
- **지금 안 고치면 다음 몇 번의 변경에서 어떤 비용이 드는가(YAGNI)?** → 이미 실제로 겪은 비용이 있다: PR #84의 dev 모드 HMR 장애가 정확히 이 클래스(자기참조 배럴)의 순환 참조 때문이었다. 가설이 아니라 재현된 사실이라 우선순위를 높게 판단한다.
- **더 급한 다른 문제를 가리는 건 아닌가?** → 저장소 전역 순환 참조 12건이 더 큰 문제일 수 있으나, 사용자와 논의 후 이번 사이클은 모달 범위로 좁히고 나머지는 별도 이슈로 명시하기로 했다(Out of Scope 참고).
- **"ui/ 폴더"가 정말 필요한 해결책인가?** → 검증되지 않았다. 폴더 위치 자체는 근본 원인(중복 마크업 + 미전환 공용 컴포넌트)을 고치지 않으므로, 목표 단계에서 결론으로 고정하지 않고 ADR 3안 비교에서 다른 대안과 같은 기준으로 비교한다.

### 후보 우선순위

이번 진단은 단일 문제 영역(모달 8개 + 그 배럴 구조)에 대한 것으로, 비교할 복수의 독립적 후보가 아니라 하나의 연결된 근본 원인(마크업/스타일 미추출 + 미전환 + 배럴 구조 혼란)이므로 별도 우선순위표는 생략한다.

## 목표와 범위

### Goal

- 새 모달을 추가하거나 기존 모달의 헤더·닫기 버튼·패널 스타일을 바꿀 때, 8곳을 일일이 손대지 않고 공용 컴포넌트 하나만 고치면 되게 한다.
- `ContentWriteModal`의 자기참조 배럴 순환 참조를 제거한다.

### Success Criteria

- `ModalCloseButton`(또는 그 대체 컴포넌트) 실사용처가 0 → 적용 가능한 모달 수만큼 증가한다.
- 닫기 버튼 마크업 변형이 4가지 → 1가지(닫기 없음이 의도인 경우는 제외)로 수렴한다.
- 패널 컨테이너 공통 스타일이 신설 컴포넌트로 추출되어 각 모달의 인라인 className 반복이 줄어든다.
- `ContentWriteModal` 자기참조 순환 참조 1건이 madge 재검증 시 0건이 된다.
- 8개 모달 특성화 테스트 48개 전부 통과(무수정 통과가 원칙, DOM 구조 변경으로 쿼리 조정이 필요하면 왜 그런지 기록).
- `pnpm lint`/`check-types`/`test`/`build` 전부 PASS.

### Out of Scope

- 저장소 전역 순환 참조 12건(hooks/api/stores/post/search/player) — 별도 후속 이슈로 분리.
- `docs/conventions.md`의 배럴 "예외 없음" 규칙 재정의 — 어긋난다는 사실만 기록하고 규칙 자체는 다시 쓰지 않음.
- ESC/뒤로가기 등 `ModalContainer`의 전역 로직 변경.
- 공용 `Button` 컴포넌트 신설(등록/저장 등 액션 버튼 통일) — 이번 범위는 닫기 버튼·패널 컨테이너만.
- `MobileNowPlaylistModal`을 `ModalShell`로 전환하는 것 — 직전 사이클에서 이미 "결함 없음"으로 결론남, 재검토 안 함.
- `ui/` 폴더 신설 여부 자체 — 해결책 선택이므로 지금 결론내지 않고 ADR 단계(3안 비교)에서 다룸.
- 새 라이브러리 도입 — 자체 구현만 사용.
- 데이터 마이그레이션/배포 호환성 대응 — 해당 없음(순수 프론트엔드 UI 리팩터링).

## Behavior Invariants

- 각 모달의 열림/닫힘 트리거(`useModalStore` + `MODAL_TYPES`)는 유지된다.
- 배경 클릭 시 닫힘/안 닫힘 차이(`closeOnBackdrop`: `ContentWriteModal`·`PrivacyConsentModal`은 `false`, 나머지는 `true`)는 유지된다.
- `ModalShell`이 적용된 7곳의 `role="dialog"`/`aria-modal` 접근성 속성은 유지된다.
- `PostCardDetailModal`(모바일 바텀시트/데스크탑)과 `MobileNowPlaylistModal`의 반응형 분기(`lg:hidden`/`hidden lg:flex`)는 유지된다.
- 8개 모달의 기존 특성화 테스트(48개 중 다수)는 전부 통과해야 한다 — 무수정 통과가 원칙이며, DOM 구조 변경으로 쿼리 조정이 필요한 경우 직전 `modal-shell-duplication` 사이클과 동일한 기준으로 별도 커밋에 기록한다.
- ESC/뒤로가기 처리(`ModalContainer`의 전역 로직)는 이번 범위 밖이라 건드리지 않는다.

## 기준선 검증

| 명령               | 결과 | 비고                        |
| ------------------ | ---- | --------------------------- |
| `pnpm lint`        | PASS | 14.2s                       |
| `pnpm check-types` | PASS | 6.9s                        |
| `pnpm test`        | PASS | 7.2s — api 37/37, web 48/48 |
| `pnpm build`       | PASS | 19.7s                       |

추가 지표:

- 모달 8개 폴더 프로덕션 코드 총 2,736줄(테스트 제외).
- `madge --circular`: 저장소 전체 13건, 그중 모달 도메인 1건(`ContentWriteModal`).
- `ModalCloseButton` 실사용처: 0곳(테스트 제외).
- `PostCardDetailModal.tsx`: 최근 6개월 변경 6회로 모달 중 최다.

---

**[GATE 1]** 위 진단, 목표·범위, Behavior Invariants, 기준선을 확인해주시면 ADR 단계(3안 비교 + 의사결정 인터뷰 로그)로 넘어가겠습니다.
