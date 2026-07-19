# VIBR 코드 컨벤션

이 문서는 저장소 실제 코드를 기준으로 정리한 코드 컨벤션 레퍼런스입니다. 프로젝트 전반의 맥락은 루트 `CLAUDE.md`를 참고하고, 이 문서는 "어떻게 짤 것인가"에 대한 실제 예시 위주로 정리합니다.

## 1. 파일/폴더 네이밍

- **파일명·폴더명은 기본적으로 kebab-case**입니다. ESLint의 `check-file/filename-naming-convention`, `folder-naming-convention` 규칙이 `**/*.{ts,js,json}`에 대해 error로 강제합니다.
  - 예: `user.controller.ts`, `feed-source.interface.ts`, `redis-stream.util.ts`
  - Next.js 예약 파일(`app/**/{page,layout,loading,error,not-found,...}.tsx`)은 예외입니다.
- **단, 이 규칙은 `.tsx`에는 적용되지 않습니다.** `packages/eslint-config/base.mjs`의 대상이 `.ts/.js/.json`뿐이라, `apps/web/src/components` 아래 컴포넌트 파일은 컴포넌트명 그대로 **PascalCase**를 씁니다.
  - 예: `PostCard.tsx`, `FeedList.tsx`, `MobileNotiOverlay.tsx`

## 2. TypeScript 네이밍 (`@typescript-eslint/naming-convention`)

- 변수: `camelCase` / `PascalCase` / `UPPER_CASE`
- 타입 · 클래스 · 인터페이스: `PascalCase`, `I` 접두사 금지 (`IUser` ❌ → `User` ⭕)
- boolean 변수: `is` / `has` / `should` 접두사 필수
  ```ts
  // apps/web/src/hooks/post/useContentWrite.ts:105
  const isSubmitDisabled = selectedMusics.length === 0;
  // apps/web/src/hooks/noti/useNotiPolling.ts:13-14
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isLoading = useAuthStore((s) => s.isLoading);
  ```

## 3. 프론트엔드 (`apps/web`)

### 3.1 컴포넌트

- `components/{domain}/` 폴더마다 **`index.ts` 배럴 파일**로 재export합니다(예외 없음: `archive`, `feed`, `layout`, `modals`, `noti`, `player`, `playlist`, `post`, `profile`, `search`, `setting`, `sidebar`, `skeleton`). 다른 폴더에서 가져올 때는 개별 파일 경로가 아니라 배럴(`@/components/post`)을 통해 import합니다.
- 컴포넌트가 커지면 두 가지 분리 방식 중 하나를 씁니다.
  1. `partials/` 하위 폴더에 보조 컴포넌트를 두는 방식 — `components/post/partials/PostActions.tsx`
  2. 폴더명을 컴포넌트명 그대로 쓰고 그 안에 기능 단위 파일을 나열하는 방식 — `components/profile/ProfileInfo/FollowStats.tsx`, `ProfileActionButton.tsx`

  둘 다 상위 `index.ts`로 묶습니다. 어느 방식을 쓸지 강제 기준은 없으므로, **수정하려는 파일과 같은 도메인에서 이미 쓰인 방식을 따르세요.**

- Props 타입: 최상위 export 컴포넌트는 `interface {ComponentName}Props`, 내부 partials/보조 컴포넌트는 `type Props = {...}` 경향이 있습니다(강제 아님).
  ```ts
  // apps/web/src/components/modals/UserListModal/UserListModal.tsx:14
  interface UserListModalProps { ... }
  // apps/web/src/components/TickerText.tsx
  type Props = { ... }
  ```
- 컴포넌트는 `export default function ComponentName(...)` 형태가 기본입니다.
- 이벤트 핸들러는 예외 없이 `handleXxx` 접두사를 씁니다(`handleToggleLike`, `handleOpenDetail`). 예: `components/post/partials/PostActions.tsx`, `components/post/PostCard.tsx`
- 스타일링은 Tailwind 클래스를 문자열로 직접 조합합니다. `cn`/`clsx` 같은 유틸은 저장소에 없습니다. 조건부 클래스는 배열 `.join(' ')` 또는 삼항 템플릿 문자열로 작성합니다(`components/post/partials/PostActions.tsx`의 `heartClassName`, `components/sidebar/Sidebar.tsx` 참고).

### 3.2 상태 관리 (Zustand)

- 파일당 스토어 1개, `stores/use{Domain}Store.ts` 네이밍(`useAuthStore.ts`, `usePlayerStore.ts`, `useFeedRefreshStore.ts` 등).
- `State`/`Actions` 인터페이스를 분리 정의한 뒤 교집합 타입으로 합쳐 `create<XxxStore>((set, get) => ({...}))`를 호출합니다.
  ```ts
  // apps/web/src/stores/usePlayerStore.ts
  interface PlayerState { currentMusic: Music | null; isPlaying: boolean; ... }
  interface PlayerActions { playMusic: (music: Music) => void; ... }
  type PlayerStore = PlayerState & PlayerActions;
  export const usePlayerStore = create<PlayerStore>((set, get) => ({ ... }));
  ```
- `persist`/`devtools` 등 미들웨어는 사용하지 않습니다. 새 스토어도 순수 `create()`만 씁니다.
- zustand는 **전역 UI 상태(모달/드로어/재생), 인증 상태, 여러 컴포넌트에 걸쳐 동기화가 필요한 서버 데이터 오버라이드**에만 씁니다(예: `usePostReactionOverridesStore`로 피드/상세모달 간 좋아요 상태 동기화). 폼 입력값 같은 컴포넌트 로컬 상태는 `useState`로 유지하고 저장 시점에만 스토어에 반영합니다.
- React Query 등 서버 상태 캐싱 라이브러리는 쓰지 않습니다. 데이터 페칭은 커스텀 훅 안에서 `useState` + `useEffect`/`useCallback`으로 직접 구현합니다.

### 3.3 API 호출

- `src/api/internal/{domain}.ts`마다 `internalClient`(axios 인스턴스)를 감싼 함수를 export합니다. 함수명은 `get/create/update/delete/add/remove` 등 동사 접두사 + 도메인 명사(`getFeedPosts`, `createPost`, `addFollow`), 요청/응답 타입은 항상 `@repo/dto`에서 import합니다.
  ```ts
  // apps/web/src/api/internal/post.ts
  export const getFeedPosts = async (cursors?: Cursor, limit = DEFAULT_FEED_LIMIT) => {
    const { data } = await internalClient.get<Feed>('/feed', { params: { ... } });
    return data;
  };
  ```
- 로딩/에러 상태 관리나 여러 컴포넌트 재사용이 필요하면 `hooks/{domain}/use{Domain}{Action}.ts` 커스텀 훅으로 감쌉니다(`hooks/post/usePostDetail.ts`). 단순 액션 호출(좋아요 토글 등)은 컴포넌트에서 `api/internal` 함수를 직접 호출하는 경우도 많아 "반드시 훅을 거쳐야 한다"는 강제 규칙은 아닙니다.
- 외부 API 실패 시 그레이스풀 폴백이 필요하면 mock 데이터로 대체합니다(`hooks/playlist/usePlaylistRecommendations.ts`의 `MOCK_PLAYLIST_BRIEFS`).

### 3.4 훅

- `hooks/{domain}/use{Domain}{Action}.ts`로 명명합니다: `hooks/post/usePostDetail.ts`, `hooks/playlist/usePlaylistRecommendations.ts`, `hooks/queue/useQueueSync.ts`.
- **범용/도메인 무관 훅은 `hooks/` 루트에 그대로 둡니다**(`useDebouncedValue.ts`, `useIsMobile.ts`, `useInfiniteScroll.ts`, `useMusicActions.ts` 등). 특정 도메인에 속하지 않는다고 판단되면 도메인 폴더를 억지로 만들지 않아도 됩니다.
- `hooks/auth/{client,config,server}`처럼 **클라이언트/서버 실행 경계가 있는 도메인은 하위 폴더로 명시적으로 분리**합니다. 서버 사이드 훅은 RSC/route handler에서 `INTERNAL_API_URL`을 쓰고, 클라이언트 사이드 훅은 브라우저에서 `API_BASE_URL`/axios client를 씁니다 — 이 경계를 넘나들지 않도록 주의하세요.

### 3.5 타입 · 상수 위치

- 여러 컴포넌트가 공유하는 타입은 전역 `src/types/{domain}.ts`(`types/sidebar.ts`, `types/player.ts`), 특정 도메인 컴포넌트 묶음 전용 타입은 그 옆에 `{domain}.types.ts`(`components/noti/noti.types.ts`)로 둡니다. "여러 곳에서 공유되면 전역, 아니면 로컬"이라는 경향만 있을 뿐 강제 기준은 아닙니다.
- 상수는 `UPPER_SNAKE_CASE`로 `constants/{domain}.ts` + `constants/index.ts` 배럴에 둡니다. mock 데이터는 `constants/mock/` 하위에 별도로 둡니다.

## 4. 백엔드 (`apps/api`)

### 4.1 모듈 구조

각 도메인 모듈(`src/modules/*`)은 대체로 다음 순서를 따릅니다.

```
*.controller.ts → *.service.ts → *.repository.ts (TypeORM Repository<Entity> 래퍼) → entities/*.entity.ts
```

예: `modules/post/` = `post.controller.ts`, `post.service.ts`, `post.repository.ts`, `post-music.repository.ts`(post-music 연결 전용 repository 분리), `entities/`, `post.module.ts`.

새 피드 입력 소스를 추가하는 등 "여러 구현체가 하나의 역할을 한다"는 패턴에서는 서비스에 분기(`if/switch`)를 추가하지 말고, 인터페이스를 구현한 뒤(`feed-source.interface.ts`) allocation policy를 갱신하는 방식을 따르세요(`modules/feed`가 이 패턴의 기준).

### 4.2 인증 가드 선택

- `AuthGuard` — 비로그인 요청을 반드시 거부해야 하는 엔드포인트(좋아요, 팔로우, 플레이리스트 등).
- `AuthOptionalGuard` — 비로그인도 허용하되 로그인 시 개인화되는 엔드포인트(예: 홈 피드).
  ```ts
  // apps/api/src/modules/feed/feed.controller.ts:21
  @UseGuards(AuthOptionalGuard)
  // apps/api/src/modules/playlist/playlist.controller.ts:26
  @UseGuards(AuthGuard)
  ```
- 유저 id는 `common/decorators/userId.decorator.ts`로 추출합니다.

### 4.3 테스트

- `*.spec.ts`를 소스와 같은 폴더에 두거나(`follow.service.spec.ts`), 도메인 폴더 안 `spec/`에 모읍니다(`modules/feed/spec/feed.service.spec.ts`). 두 방식 모두 쓰이며, 도메인 내 테스트가 여러 개로 늘어나면 `spec/`로 묶는 경향이 있습니다.
- `noUncheckedIndexedAccess` strict 모드 이후 테스트 코드에서 배열/mock-call 인덱싱 결과에 non-null assertion(`!`)을 쓰는 경우가 흔합니다(예: `mock.calls[0]!` — `toHaveBeenCalledTimes` 검증 직후처럼 존재가 보장되는 지점에 한해서).

### 4.4 데이터스토어 역할 분리

- **MySQL(TypeORM)** — 핵심 관계형 데이터. 엔티티는 `app.module.ts`의 glob으로 자동 탐색.
- **Redis** — 캐시 + Streams 이벤트 버스. 도메인 이벤트는 `infra/redis/redis-stream.util.ts`/`redis-keys.ts`를 통해 push하고, 스트림 컨슈머(`modules/trending/stream/`, `modules/algorithm/algorithm-stream.consumer.ts`)가 비동기로 소비합니다.
- **Neo4j** — 사람 관계 그래프 기반 추천(`modules/algorithm`).

## 5. DTO (`packages/dto`)

- API 계약의 단일 진실 공급원입니다. `apps/api`, `apps/web` 어디에도 요청/응답 타입을 중복 작성하지 말고 `packages/dto`의 `@repo/dto`에서 import합니다.
- 도메인별 `src/<domain>/{req,res}` 구조, class-validator/class-transformer 기반.
- DTO 변경 후에는 `pnpm dto`로 반드시 재빌드해야 `apps/api`/`apps/web`이 최신 타입을 resolve합니다.

## 6. 커밋 · PR

- Husky + lint-staged가 staged 파일에 prettier/eslint를 실행합니다(`lint-staged.config.mjs`가 워크스페이스별로 eslint를 라우팅).
- commitlint(`commitlint.config.js`)가 Conventional Commits를 강제합니다.
  - `type`: `feat | fix | docs | style | refactor | test | chore | revert | perf | ci | design` 중 하나 (`design`은 UI/디자인 전용으로 표준 세트에 추가된 것).
  - `scope`를 쓸 경우 소문자(`scope-case: lower-case`).
  - 예: `feat(post): 좋아요 낙관적 업데이트 추가`
  - 커밋 subject 맨 앞에 대문자로 시작하는 라틴 약어(PR, STAR, JWT, PascalCase 컴포넌트명 등)를 두면 `subject-case` 규칙에 false-positive로 걸릴 수 있으니, 소문자로 바꾸거나 문장 뒤쪽으로 옮기세요.
- PR 본문은 `.github/pull_request_template.md`의 STAR 포맷(Situation/Task/Action/Result + 관련 이슈)을 따릅니다. 관련 이슈는 `- Closes #번호` 형식으로 씁니다.
- 하나의 커밋은 하나의 관심사만 다룹니다(one-concern-per-commit). 서로 무관한 변경(예: 사전 존재하던 lint 버그 수정과 새 기능 변경)은 별도 커밋으로 분리합니다.

## 7. ⚠️ 강제 규칙이 아닌, 혼용되는 패턴

아래는 저장소에 두 가지 방식이 섞여 있어 "이렇게 해야 한다"고 단정할 수 없는 부분입니다. 새 코드를 작성할 때는 **수정하려는 파일과 같은 폴더/도메인에서 이미 쓰인 방식을 우선 따르고**, 임의로 통일하려 하지 마세요(요청받지 않은 리팩터링에 해당).

| 항목               | 방식 A                               | 방식 B                            | 비고                                               |
| ------------------ | ------------------------------------ | --------------------------------- | -------------------------------------------------- |
| Props 타입         | `interface {Name}Props` (~30개 파일) | `type Props = {...}` (~21개 파일) | 최상위/내부 컴포넌트로 경향은 있으나 엄격하진 않음 |
| 컴포넌트 분리      | `partials/` 하위 폴더                | 폴더명 그대로 + 개별 파일 나열    | 도메인별 명시적 기준 없음                          |
| API 호출 경로      | 훅 경유                              | `api/internal/*` 직접 import      | 18개 이상 컴포넌트가 훅 없이 직접 호출             |
| 타입 정의 위치     | 전역 `src/types/{domain}.ts`         | 로컬 `{domain}.types.ts`          | "공유 여부"가 유일한 경향                          |
| 백엔드 테스트 위치 | 소스 옆 `*.spec.ts`                  | 도메인 `spec/` 폴더               | 둘 다 쓰임                                         |
