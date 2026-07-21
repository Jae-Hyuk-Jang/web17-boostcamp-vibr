# Result — mobile-queue-view-duplication

## 변경 요약

| 이슈                | 내용                                                                                                                                                                                                                               |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| #119                | `RightPanel` 풀플레이어 오버레이 열기/닫기(X 버튼/ESC/뒤로가기)와 데스크탑 상시 패널 렌더링을 특성화 테스트로 고정(착수 전 0건)                                                                                                    |
| #120                | `RightPanel`에 `queueSectionRef`+스크롤 플래그, `handleOpenFullPlayer`/`handleOpenQueue` 두 핸들러 도입. `MiniPlayerBar`의 `ListPlus` 버튼을 `onOpenQueue`(스크롤 있음)에 연결, 앨범아트 탭은 `onOpenFullPlayer`(스크롤 없음) 유지 |
| #121                | `MobileNowPlaylistModal` 컴포넌트·테스트·소비처(`ModalContainer`, `modals/index.ts`) 삭제, `MODAL_TYPES.MOBILE_QUEUE` 제거, `RightPanel`의 `isQueueOpen`을 `isFullPlayerOpen` 기반으로 교체                                        |
| (issue 3 후속 수정) | `pnpm dev`로 직접 확인하는 과정에서 `ListPlus` 버튼 타이틀이 "현재 재생목록 닫기"로 토글을 암시하지만 실제로는 안 닫히는 불일치를 발견해, 고정 라벨 "재생목록 보기"로 수정                                                         |
| #122                | 이 문서 작성                                                                                                                                                                                                                       |

## Before / After

| 항목                                | Before(prd.md 기준선)                                                                                                    | After                                                                                                           |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------- |
| 모바일 재생목록 진입점              | 2개(앨범아트 탭 → 풀플레이어/`QueueList`, `ListPlus` → `MobileNowPlaylistModal`/`MobileQueueRow`), 기능 집합이 서로 다름 | **1개** — 둘 다 풀플레이어(`QueueList`)로 연결. `ListPlus`는 추가로 큐 위치까지 자동 스크롤                     |
| 모바일 큐 전용 코드                 | `MobileNowPlaylistModal.tsx` 140줄 + 테스트 21줄                                                                         | **0줄**(삭제)                                                                                                   |
| `MODAL_TYPES`                       | `MOBILE_QUEUE` 포함 9개                                                                                                  | **8개**(죽은 값 제거)                                                                                           |
| `RightPanel`/`MiniPlayerBar` 테스트 | 0건                                                                                                                      | `RightPanel.test.tsx` 7건(신규)                                                                                 |
| `pnpm lint`                         | 통과(cache hit)                                                                                                          | 통과                                                                                                            |
| `pnpm check-types`                  | 통과(cache hit)                                                                                                          | 통과                                                                                                            |
| `pnpm test`                         | web 17 suites/67 tests, api 8 suites/37 tests                                                                            | web **17 suites/73 tests**(모달 테스트 1건 삭제 + player 테스트 7건 추가 = 순증 6), api 8 suites/37 tests(불변) |
| `pnpm build`                        | 통과(cache hit)                                                                                                          | 통과                                                                                                            |

모바일에서 `ListPlus`로 재생목록을 열었을 때 이제 보관함 추가·추천 글 작성·드래그 재정렬·`TickerText` 마퀴 스크롤을 모두 쓸 수 있다(이전에는 `MobileNowPlaylistModal` 경로에서 전부 빠져 있었다).

## 개발환경 실동작 확인

- `packages/dto`는 변경하지 않아 `pnpm dto` 재빌드는 필요 없었다.
- `pnpm dev`로 `apps/web`만 기동한 뒤 Playwright(`chromium`, 모바일 뷰포트 390×844)로 직접 조작해 확인했다:
  - 앨범아트/곡정보 영역 클릭 → 풀플레이어가 열리고 `NowPlaying`부터 보임(스크롤 없음) — 스크린샷으로 확인, 콘솔에는 `apps/api` 미기동으로 인한 예상된 500 2건 외 에러 없음.
  - X 버튼으로 닫은 뒤 `ListPlus`("재생목록 보기") 클릭 → 풀플레이어가 다시 열림 — 스크린샷으로 확인.
  - 이 과정에서 위 "issue 3 후속 수정" 항목의 버그(타이틀이 토글을 암시)를 실제로 발견하고 그 자리에서 고쳤다.
  - 큐가 비어 있는 상태라 두 진입점의 스크롤 위치 차이가 화면상 육안으로는 구분되지 않았다(내용이 한 화면에 다 들어가서 스크롤할 게 없음) — `scrollIntoView` 호출 자체는 `RightPanel.test.tsx`의 유닛 테스트(`Element.prototype.scrollIntoView` mock)로 정확히 검증했다: `ListPlus` 경로에서만 `{ block: 'start' }`로 호출되고 앨범아트 경로에서는 호출되지 않음을 확인.
- **직접 확인하지 못한 부분**:
  - 스와이프다운으로 닫는 동작은 jsdom의 `TouchEvent` 시뮬레이션 한계로 자동화 테스트에 포함하지 못했고, 이 sandbox에는 실제 터치 디바이스가 없어 수동 확인도 못 했다. 기존에 있던 로직(`handleTouchMove`)을 이번에 변경하지 않았으므로 회귀 위험은 낮다고 판단하지만, 사용자가 실제 모바일 기기에서 한 번 확인해주면 좋다.
  - 곡이 많이 쌓인 실제 큐에서 `ListPlus` 클릭 시 스크롤이 실제로 얼마나 부드럽게/즉각적으로 보이는지는 데이터가 없어 시각적으로 확인하지 못했다. 유닛 테스트로 호출 자체는 보장되지만, 애니메이션 타이밍(풀플레이어 슬라이드업과 스크롤이 겹칠 때)은 사용자가 실제 사용 중 확인해주길 권장한다.

## Behavior Verification

prd.md의 Behavior Invariants:

- ✅ `MiniPlayerBar`의 재생/일시정지/이전곡/다음곡/보관함 추가/추천 글 작성 버튼 — 전부 변경하지 않음(코드 diff에 해당 핸들러 수정 없음).
- ✅ 데스크탑(lg 이상) 상시 `RightPanel` 레이아웃/리사이즈 — `ResizableRightPanel.tsx` 미변경, `RightPanel.test.tsx`의 "데스크탑 상시 패널에는 재생목록이 QueueList로 렌더링된다" 테스트로 재확인.
- ✅ 큐 아이템 클릭 시 재생, 삭제/순서 변경(위/아래/드래그) — `QueueList.tsx` 자체는 수정하지 않았고(Out of Scope), 계속 동일한 `usePlayerStore` 액션을 그대로 사용.
- ✅ 풀플레이어 오버레이를 ESC/뒤로가기로 닫는 동작 — `RightPanel.test.tsx`에서 각각 테스트로 검증. X 버튼도 함께 검증. 스와이프다운은 위 "직접 확인하지 못한 부분" 참고.

adr.md의 회귀 시나리오 표 5개 중 4개(앨범아트 탭/`ListPlus` 클릭/ESC·뒤로가기·X버튼/데스크탑 진입)를 테스트로 커버했고, "큐 비어있음" 시나리오는 `QueueList` 자체 로직이라 변경하지 않았으므로 별도 재검증 없이 기존 동작이 유지된다고 간주했다.

## Decision Review

adr.md에서 선택한 안 2(큐로 자동 스크롤)의 예상과 실제 비교:

- **예상**: 변경 범위가 `RightPanel`에 ref 하나 추가하는 수준으로 작다 → **대체로 맞았다.** `queueSectionRef`+`shouldScrollToQueue` 플래그+`useEffect` 하나로 구현이 끝났다.
- **예상했던 위험이 실제로 발생**: ADR의 "새 위험" 항목에 "`ListPlus` 버튼의 토글 의미가 사라진다"를 이미 적어뒀는데, 실제로 `pnpm dev`에서 확인해보니 그 여파가 코드 동작뿐 아니라 **버튼 타이틀 텍스트("현재 재생목록 닫기")에도 남아있어 사용자에게 잘못된 정보를 보여주는** 형태로 드러났다. ADR 작성 시점에는 "동작"만 고려했지 "라벨 텍스트"까지는 짚지 못했다 — 실제 UI를 눈으로 보고서야 발견했다. 이슈 3 범위 안에서 바로 고쳐서 별도 이슈를 만들지 않았다.
- **예상하지 못했던 점**: `MiniPlayerBar`의 `isQueueOpen` prop이 타이틀 고정 후 완전히 불필요해져서, prop 자체를 제거했다(ADR에는 "계산 방식 교체"까지만 적혀 있었고 "prop 삭제"는 없었다) — 계획보다 한 단계 더 정리된 결과다.

## Remaining Debt

- 스와이프다운 닫기의 자동화 테스트 부재(jsdom 한계) — Follow-up으로 남긴다.
- 실제 대량의 큐 데이터에서 스크롤 애니메이션 체감은 사용자 확인 필요.

## Follow-ups

- 별도로 다루지 않은 백로그: #96(저장소 전역 순환참조), #97(conventions.md 배럴 규칙 갱신), #98(하드 섀도 색상 통일), #100(Playwright CI 통합), #117(TrackItem/MusicPickerSearch 결과 행 레이아웃 공용화 검토).
- `docs/component-design/modals.md`는 이번 변경으로 8개 모달 중 1개(`MobileNowPlaylistModal`)가 사라져 표가 부분적으로 낡았다는 점을 문서 상단에 표기해뒀다 — 다음에 모달 전체를 다시 분석할 기회가 있으면 표 자체도 갱신할 것.

---

**[GATE 3]** 위 Before/After, 개발환경 실동작 확인, Behavior Verification, 남은 부채를 확인해주시면 이 리팩터링 사이클을 종료하겠습니다.
