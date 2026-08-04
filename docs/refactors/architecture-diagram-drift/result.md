# Result — architecture-diagram-drift

## 변경 요약

`docs/architecture/index.html`의 9개 다이어그램을 실제 코드와 대조해 재검증하고, drift가 확인된 6개를 수정했다(ADR의 안 1 — 최소 개선안).

- **이슈 1(#246, 커밋 `0df9ddc`)**: 구조 스캔형 3개 다이어그램에 실제 코드엔 있지만 누락됐던 노드/엣지 추가 — 백엔드 모듈 다이어그램에 `now-playlist`(초기 커밋부터 존재하는 고립 모듈), 프론트엔드 최상위 폴더 다이어그램에 `query-keys`(query-key-centralization #211~215 신설) + `components/hooks --> query-keys` 엣지, 컴포넌트 cross-import 다이어그램에 `post --> feed`(타입 전용 import) 엣지.
- **이슈 2(#247, 커밋 `f5c177a`)**: 상태 관리형 4개 다이어그램 재작성 — 인증 세션 상태 흐름도를 `useAuthMe()`/TanStack Query 기준으로 전면 재작성, zustand 스토어 사용 현황에서 죽은 스토어 5개(`useAuthStore`/`useNotiStore`/`usePostReactionOverridesStore`/`useProfileStore`/`useFeedRefreshStore`) 제거 및 재스캔 중 새로 확인된 `h_post --> useModalStore`/`usePlayerStore` 엣지 추가, `usePostReactionOverridesStore 상세 흐름`을 `postDetailQueryKey` 쿼리 캐시 기반 다이어그램으로 완전히 교체, 서버 상태 캐싱 다이어그램의 죽은 `AuthBootstrap` 참조를 현재 `useAuthMe()` 소비처 기준으로 수정. 상단 "마지막 갱신" 배너도 오늘 날짜로 갱신.

이미 정확했던 3개(ERD, 음악 재생 상태 흐름도, 살아있는 3개 스토어 노드 자체)는 건드리지 않았다.

## Before / After

| 항목                                     | Before(prd.md 기준선)                                                                                                                                             | After                                                                                                                                      |
| ---------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| stale/부분 stale 다이어그램 수           | 6개(9개 중)                                                                                                                                                       | 0개 — 9개 전부 grep 전수 대조로 현재 코드와 일치 확인                                                                                      |
| 존재하지 않는 노드 참조                  | `useAuthStore`/`useNotiStore`/`usePostReactionOverridesStore`/`useProfileStore`/`useFeedRefreshStore`/`AuthBootstrap` (mermaid 코드 블록 내부에 실제 노드로 존재) | 0개 — 6개 심볼 모두 mermaid 코드 블록에서 제거 확인(`awk`로 `<pre class="mermaid">` 블록만 추출해 재검증). 본문 서술에는 과거형으로만 남음 |
| 누락된 노드/엣지                         | `now-playlist` 모듈, `query-keys` 폴더, `post→feed`·`h_post→useModalStore`·`h_post→usePlayerStore` 엣지                                                           | 전부 추가됨                                                                                                                                |
| 상단 "마지막 갱신" 배너                  | 2026-07-22(당시에도 부정확했음)                                                                                                                                   | 2026-08-04, 이번에 반영한 사이클 번호(#245~247) 명시                                                                                       |
| `pnpm lint`/`check-types`/`test`/`build` | 전부 통과(기준선)                                                                                                                                                 | 전부 통과, 전량 캐시 히트(문서 전용 변경이라 애플리케이션 빌드 산출물 자체가 바뀌지 않았음을 의미)                                         |
| mermaid 다이어그램 렌더링 검증           | 사전 검증 없음(수동 grep 대조만)                                                                                                                                  | 9개 블록 전부 `@mermaid-js/mermaid-cli`(mermaid 10.x, CDN 스크립트와 동일 메이저 버전)로 실제 SVG/PNG 렌더링 성공                          |

## 개발환경 실동작 확인

- `packages/dto` 변경 없음(문서 전용 사이클).
- 이 사이클은 정적 HTML 문서라 `pnpm dev`로 띄울 서버 라우트가 없다. 대신 이 문서의 핵심 산출물인 **mermaid 다이어그램이 실제로 렌더링되는지**를 직접 검증했다:
  1. `docs/architecture/index.html`의 `<pre class="mermaid">...</pre>` 블록 9개를 스크립트로 추출.
  2. `npx @mermaid-js/mermaid-cli@10`(문서가 CDN에서 로드하는 `mermaid@10`과 동일 메이저 버전)으로 9개 블록 전부를 SVG로 렌더링 — **9/9 성공**, 문법 에러 없음.
  3. 이번에 가장 크게 손댄 2개(인증 세션 상태 흐름도, 게시글 반응 상세 흐름)와 구조 변경이 큰 1개(zustand 스토어 사용 현황), 백엔드 모듈 다이어그램은 PNG로 렌더링해 육안으로도 확인 — 노드/엣지가 의도한 대로(죽은 스토어 3→0개 시각적으로 사라짐, `now-playlist` 고립 노드 표시, `h_post`의 새 엣지 2개 등) 나타남을 확인.
  4. `pnpm lint`/`check-types`/`test`(api 8 suites/37 tests, web 40 suites/226 tests)/`build`를 재실행해 기준선과 동일하게 전부 통과(전량 캐시 히트 — 애플리케이션 코드가 한 바이트도 안 바뀌었다는 의미이기도 함)를 확인.
- 직접 확인하지 못한 부분: 실제 브라우저에서 `file://` 또는 정적 호스팅으로 이 HTML을 열었을 때의 레이아웃/스크롤/다크 배경 대비 같은 시각적 디테일은 이 샌드박스에 브라우저 자동화 도구가 없어 확인하지 못했다. 다만 mermaid-cli가 내부적으로 동일한 mermaid 렌더러(puppeteer 기반 헤드리스 크로미움)를 사용하므로, 다이어그램 자체의 렌더링 결과는 실제 브라우저와 사실상 동일하다.

## Behavior Verification

이 사이클은 Behavior Invariant가 "애플리케이션 코드는 한 줄도 바뀌지 않는다"였다 — `git diff --stat`으로 두 커밋 모두 `docs/architecture/index.html` 1개 파일만 변경됐음을 확인했다(`apps/api`, `apps/web`, `packages/dto` 변경 없음). 과거 사이클 서술(예: `#48`, `#101~109`, `#72~94`, `#139`, `#184`, `#208`, `#177` 등)은 전부 과거형으로 보존했고, ADR의 회귀 시나리오 5개를 각각 확인했다:

| 회귀 시나리오                                                               | 결과                                                                                                 |
| --------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| 체크포인트 1 이후 백엔드 모듈 다이어그램의 기존 25개 엣지가 그대로인가      | ✅ `git diff`로 추가된 라인(now-playlist 노드 1줄)만 있고 기존 엣지 삭제/변경 없음 확인              |
| 체크포인트 1 이후 컴포넌트 cross-import의 기존 18개 엣지가 그대로인가       | ✅ `post --> feed` 1줄 추가만 있고 기존 18개 엣지 그대로                                             |
| 체크포인트 2 이후 살아있는 3개 스토어의 fan-in 엣지가 PRD 목록과 일치하는가 | ✅ PRD에서 재도출한 정확한 목록(s_modal 15개, s_notiOverlay 1개, s_player 9개)으로 교체, 재검증 완료 |
| 체크포인트 2 이후 삭제된 심볼이 과거형 서술 외에 남아있지 않은가            | ✅ mermaid 코드 블록 내부 grep 결과 0건(모두 본문 legend의 과거형 문장에만 존재)                     |
| 체크포인트 2 이후 lint/check-types/test/build가 기준선과 동일한가           | ✅ 전부 통과, 전량 캐시 히트                                                                         |

## Decision Review

ADR에서 안 1(최소 개선안)을 선택하며 예상한 것과 실제 결과:

- **예상**: "범위가 6개 다이어그램으로 제한적이라 반나절 내 끝날 것"이었으나, 목표 인터뷰에서 "파일 전체 재스캔"으로 범위가 넓어지면서 실제로는 나머지 3개 다이어그램(ERD, 컴포넌트 cross-import, 프론트엔드 최상위 폴더)까지 전수 검증하는 데 추가 조사 시간이 들었다. 다만 이 조사 덕분에 PRD 작성 시점엔 몰랐던 3가지(`now-playlist` 누락, `query-keys` 누락, `post→feed`/`h_post` 신규 엣지)를 추가로 발견해 최종 결과물의 정확도가 PRD 때 예상한 것보다 더 높아졌다 — "범위를 넓힌 결정"이 실제로 가치를 만들어냈다.
- **예상**: "안 2(섹션별 타임스탬프)를 기각한 게 맞았는가?" — 이번 사이클에서 발견한 drift 대부분(예: `query-keys` 누락)이 "그 사이클이 끝난 뒤 얼마나 지났는지"가 아니라 "그 사이클이 애초에 이 문서를 갱신 대상으로 인지하지 못했는지"에서 왔다는 게 이번 조사로 다시 확인됐다. 섹션별 타임스탬프가 있었더라도 query-key-centralization(#211~215)이 이 문서를 갱신 대상으로 인지하지 못했다면 그 섹션의 타임스탬프 자체가 갱신되지 않았을 것이다 — 안 1 선택과 안 2 기각 근거가 이번 조사로 더 뒷받침됐다.
- **새로 확인된 사실**: PostHeader.tsx의 삭제 흐름이 예상보다 더 많이 바뀌어 있었다 — 옛 다이어그램은 "store에 `deletedPostId`를 write하고 FeedView가 그걸 읽어 필터링"이라고 그렸지만, 실제로는 `feedQueryKey` 캐시를 직접 조작하는 방식으로 완전히 바뀌어 있었다(아마 feed-list-query-migration 사이클에서). 이건 PRD 작성 시점엔 "usePostReactionOverridesStore가 삭제됐다"까지만 알고 있었고, 대체 흐름의 구체적 모양은 checkpoint 2 구현 중에 처음 조사했다.

## Remaining Debt

- **근본 원인(사이클별 갱신 트리거 부재) 자체는 해결하지 않음** — ADR에서 명시적으로 안 1을 선택했으므로 의도된 결과다. 다음 리팩터링 사이클이 이 문서를 다시 빠뜨리면 동일한 drift가 재발할 수 있다.
- `feed↔post` 컴포넌트 도메인 간 양방향 참조(`feed --> post`, `post --> feed`)가 생겼다는 사실이 이번에 다이어그램으로 드러났다 — 두 도메인의 경계가 흐려지고 있다는 신호일 수 있어, 향후 feed/post 관련 리팩터링을 계획할 때 참고할 가치가 있다(이번 사이클은 문서 반영만, 구조 개선은 범위 밖).
- `docs/design-system.md`, `docs/components/index.html`, `docs/component-design/*.md`의 나머지 staleness는 #242에서 일부만 처리됐고 이번 사이클 범위 밖이다.

## Follow-ups

- (선택) mermaid-diagram 스킬 자체에 "이 문서를 갱신 대상에 포함해야 하는가?"를 다른 사이클의 PRD 체크리스트에 넣는 자동 트리거 도입 — ADR 안 3(자동화 도구 도입)에서 기각됐지만, 근본 원인 해결책으로는 여전히 유효한 방향이라 별도 백로그로 등록할 가치가 있음.
- `feed↔post` 양방향 컴포넌트 의존성 정리 여부 검토(위 Remaining Debt 참고).
