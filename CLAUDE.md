# CLAUDE.md

이 파일은 Claude Code(claude.ai/code)가 이 저장소에서 작업할 때 참고하는 가이드입니다.

## 프로젝트 개요

VIBR — 소셜 뮤직 큐레이션 플랫폼 (Next.js 웹 클라이언트 + NestJS API), 부스트캠프 4인 팀 프로젝트. "링크 공유"로 끝나던 음악 추천을 [추천 → 재생 → 반응]이 이어지는 흐름으로 바꾸고, 장르 유사도 기반 알고리즘이 아니라 팔로우/좋아요 같은 사람 사이의 관계를 통해 음악을 추천하는 것이 핵심 컨셉입니다.

## 모노레포 구조

pnpm workspaces + Turborepo. `apps/*`는 배포 대상, `packages/*`는 `workspace:*`로 소비되는 공유 라이브러리입니다.

- `apps/web` — Next.js 16 (App Router) 프론트엔드, 3000번 포트
- `apps/api` — NestJS 백엔드, 3002번 포트, prefix `/api`
- `packages/dto` — **API 계약의 단일 진실 공급원(source of truth).** class-validator/class-transformer 기반 DTO, 공유 enum, 도메인별(`src/<domain>/{req,res}`) 요청/응답 타입을 담고 있음. `apps/api`, `apps/web`이 `@repo/dto`를 resolve하려면 먼저 빌드(`pnpm dto`)돼야 하므로, DTO를 수정하면 반드시 다시 빌드할 것.
- `packages/ui`, `packages/eslint-config`, `packages/typescript-config` — 공유 UI 킷 및 lint/tsconfig 베이스

## 디렉터리 구조

### `apps/api/src`

```
src
├── app.module.ts / app.controller.ts / app.service.ts / main.ts
├── common
│   ├── decorators/userId.decorator.ts        # 요청에서 인증된 userId 추출
│   ├── filter/all-exception.filter.ts        # 전역 예외 응답 포맷
│   ├── guards/auth.guard.ts                  # 필수 인증 가드
│   ├── guards/auth.optional-guard.ts         # 선택적 인증 가드
│   └── interceptors/                         # comment/follow/like 스트림 로깅 인터셉터
├── infra
│   └── redis/                                # redis-keys, redis-stream 유틸/타입 (Streams 이벤트 버스)
└── modules
    ├── algorithm/     # Neo4j 그래프 기록·조회 (algorithm-stream.consumer.ts)
    ├── auth/           # Google OAuth, JWT 발급 (dto/, types.ts)
    ├── comment/        # controller/service/repository + entities/
    ├── feed/           # 홈 피드 조합 (policy/, sources/, spec/)
    ├── follow/
    ├── like/
    ├── log/            # 클라이언트 로그 수집
    ├── music/
    ├── noti/           # 알림
    ├── now-playlist/   # 현재 재생 큐
    ├── playlist/
    ├── post/           # post-music.repository.ts로 곡-게시글 연결
    ├── privacy/        # 약관 동의
    ├── seed/           # 개발용 시드 데이터
    ├── trending/       # internal/, jobs/, rank/, stream/ (Redis 기반 랭킹)
    ├── upload/         # NCP object storage 업로드
    └── user/
```

각 도메인 모듈은 대체로 `*.controller.ts → *.service.ts → *.repository.ts → entities/*.entity.ts` 구성이며, 테스트는 `*.spec.ts`로 같은 폴더 또는 `spec/`에 위치합니다.

### `apps/web` (`app/` = 라우트, `src/` = 나머지)

```
app
├── (home)/                    # 홈 피드
├── api/youtube-search/        # 유튜브 검색 프록시 route handler
├── archive/                   # 보관함
├── auth/google/callback/      # OAuth 콜백 route handler
├── post/[id]/
├── profile/[id]/posts/, profile/
├── setting/terms/, setting/
├── offline/                   # PWA 오프라인 페이지
├── layout.tsx / error.tsx / manifest.ts / globals.css

src
├── api
│   ├── internal/     # apps/api 호출 래퍼 (client.ts + 도메인별 파일)
│   ├── itunes/ youtube/   # 서드파티 음악 검색 직접 호출
├── components
│   ├── archive/ feed/ layout/ noti/ player/(nowPlaying) playlist/
│   ├── modals/       # ContentWriteModal, LoginModal, PlaylistDetailModal, PlaylistPickerModal,
│   │                 # PostCardDetailModal, PrivacyConsentModal, UserListModal, ModalContainer
│   ├── post/ profile/(ProfileInfo) providers/(QueryProvider) search/ setting/ sidebar/ skeleton/
├── constants          # auth, player, playlist, search, sidebar, terms, mock/
├── hooks
│   ├── auth/{client,config,server}   # 클라이언트/서버 인증 훅 분리
│   ├── noti/ player/(youtube) playlist/ post/ privacy/ queue/ search/
├── mappers            # itunes/youtube 트랙 → 내부 Music 타입 정규화
├── query-keys         # TanStack Query 쿼리 키 도메인별 중앙화 (auth/feed/noti/nowPlaylist/playlist/post/profile/search)
├── stores             # Zustand: player, modal, notiOverlay
├── types / utils
```

### `packages`

```
packages
├── dto/src/{comment,feed,follow,like,log,music,noti,now-playlist,
│            playlist,post,privacy,user}/{req,res}   # 도메인별 요청/응답 DTO + enum
├── ui/src            # 공유 UI 컴포넌트 (@repo/ui)
├── eslint-config      # base.mjs, next.js, react-internal.js
└── typescript-config   # base.json, nextjs.json, react-library.json
```

## 명령어

특별한 언급이 없으면 저장소 루트에서 실행합니다.

```bash
corepack enable && pnpm install   # 초기 설정
docker compose up -d              # mysql, neo4j, redis (로컬 인프라)
pnpm dto                          # packages/dto 빌드 — DTO 변경 후 dev/build 전에 필수
pnpm dev                          # apps/web + apps/api 동시 실행 (turbo --filter=api --filter=web)
pnpm lint                         # 전체 패키지 대상 turbo run lint
pnpm check-types                  # turbo run check-types
pnpm build                        # turbo run build
pnpm format                       # prettier --write
```

앱별 명령어 (`apps/api` 또는 `apps/web` 디렉터리에서):

```bash
pnpm dev                          # 개별 앱 dev 서버
pnpm lint                         # eslint --fix (api) / eslint --max-warnings 0 (web)
pnpm check-types                  # web: next typegen && tsc --noEmit

# apps/api 전용
pnpm test                         # jest, 유닛 스펙 (소스와 같은 위치의 *.spec.ts)
pnpm test -- <path or -t name>    # 단일 테스트 파일 / 이름 패턴 실행
pnpm test:watch
pnpm test:cov
pnpm test:e2e                     # jest --config ./test/jest-e2e.json
```

커밋 시 Husky + lint-staged가 staged 파일에 prettier/eslint를 실행하고, commitlint(`commitlint.config.js`)가 커밋 메시지에 Conventional Commits 규칙을 강제합니다. `type`은 `feat|fix|docs|style|refactor|test|chore|revert|perf|ci|design` 중 하나여야 하고(표준 세트에 UI/디자인 전용 `design` 추가), `scope`를 쓸 경우 소문자여야 합니다(`scope-case: lower-case`). 예: `feat(post): 좋아요 낙관적 업데이트 추가`.

`gh issue create`/`gh pr create`를 실행하기 전에는 반드시 `.github/ISSUE_TEMPLATE/issue.md`, `.github/pull_request_template.md`를 실제로 열어서 그 포맷을 따르세요 — 이 요약 문장만 보고 자체 포맷으로 대체하지 않습니다. 상세 규칙은 `docs/conventions.md` §6(커밋·PR)을 참고하세요.

## 백엔드 아키텍처 (`apps/api`)

NestJS, `src/modules/*` 아래 도메인별 모듈 구조 (auth, user, post, comment, follow, like, music, playlist, now-playlist, noti, upload, privacy, log, seed, feed, trending, algorithm). 각 도메인 모듈은 대체로 `*.controller.ts` → `*.service.ts` → `*.repository.ts` (TypeORM `Repository<Entity>` 래퍼) → `entities/*.entity.ts` 순서를 따릅니다.

역할이 뚜렷이 구분되는 세 가지 데이터스토어를 사용합니다:

- **MySQL (TypeORM)** — 사용자, 게시글, 플레이리스트 등 핵심 관계형 데이터. 엔티티는 `app.module.ts`의 glob으로 자동 탐색되며, `synchronize`는 production 외 환경에서 켜져 있습니다.
- **Redis (`ioredis` / `@nestjs-modules/ioredis`)** — 캐시이자 **Redis Streams 이벤트 버스**로 사용됩니다. 도메인 이벤트를 `infra/redis/redis-stream.util.ts` / `redis-keys.ts`를 통해 push하면, 스트림 컨슈머(`modules/trending/stream/trending-steam.consumer.ts`, `modules/algorithm/algorithm-stream.consumer.ts` 등)가 이를 소비해 트렌딩 점수와 추천 그래프를 요청 경로와 분리된 비동기 흐름으로 갱신합니다.
- **Neo4j (`neo4j-driver`, `'NEO4J_DRIVER'`로 주입)** — 사람 관계 그래프(`User`/`Content` 노드, 가중치가 감쇠하는 `INTERACTED` 엣지)로, `modules/algorithm`의 "알고리즘이 아닌 사람 기반" 추천 모델을 뒷받침합니다.

주목할 만한 모듈:

- `modules/feed` — 여러 소스(`sources/{following,recent,trending}.source.ts`, 모두 `feed-source.interface.ts` 구현)를 `policy/source-allocation.policy.ts`, `policy/feed-composition.policy.ts`로 조합해 홈 피드를 구성합니다. 새 피드 입력을 추가할 때는 서비스에 분기를 추가하지 말고 source 인터페이스를 구현한 뒤 allocation policy를 갱신하는 방식을 따르세요.
- `modules/trending` — Redis 스트림 기반 랭킹(`stream/`, `rank/trending-rank.store.ts`)과 `@nestjs/schedule`을 이용한 스케줄 감쇠(`jobs/trending-decay.job.ts`)로 구성됩니다.
- `modules/algorithm` — 상호작용 이벤트를 배치로 Neo4j 그래프에 기록하고, 그래프 기반 추천의 조회 경로 역할도 합니다.

인증: 커스텀 JWT(`@nestjs/jwt`, 30분 만료)를 `AuthGuard`(`common/guards/auth.guard.ts`, `Authorization: Bearer <token>` 헤더 필요)로 검증하며, 인증이 선택적인 엔드포인트는 `auth.optional-guard.ts`를 사용합니다. 유저 id는 `common/decorators/userId.decorator.ts`로 추출합니다. OAuth는 Google(`modules/auth`)이며 토큰 교환은 서버 사이드에서 이뤄집니다. 업로드는 `modules/upload`를 거쳐 NCP(네이버 클라우드) 오브젝트 스토리지로 전송됩니다(`@aws-sdk/client-s3`, S3 호환 엔드포인트). 전역 예외 응답 형식은 `common/filter/all-exception.filter.ts`에서 정의합니다.

## 프론트엔드 아키텍처 (`apps/web`)

Next.js App Router 구조로, `app/`에는 라우트/레이아웃만 두고 나머지(`components`, `hooks`, `stores`, `api`, `mappers`, `constants`, `types`, `utils`)는 모두 `src/`에 둡니다. import alias `@/*` → `src/*`.

- **상태 관리**: 전역 UI 상태(재생/모달/알림 오버레이)는 `src/stores`의 Zustand 스토어(player, modal, notiOverlay)에 두고, 서버 상태는 TanStack Query(`src/query-keys`에 도메인별 쿼리 키 중앙화)로 관리합니다. 자세한 도입 범위는 아래 "서버 상태 관리(TanStack Query)" 절 참고.
- **API 레이어** (`src/api`):
  - `internal/client.ts` — `apps/api` 호출용 공용 axios 인스턴스(`baseURL: /api`). `sessionStorage`의 bearer 토큰을 주입하며, `/user/me` 요청에서 401이 발생했을 때만(다른 요청의 401은 무시) 인증 관련 스토어를 정리하고 로그인 모달을 다시 엽니다 — 모든 요청 실패마다 전역 로그아웃되는 것을 막기 위한 의도된 좁은 범위입니다.
  - `internal/*.ts` — 백엔드 도메인당 하나씩, `@repo/dto` 타입을 사용하는 `internalClient`의 얇은 래퍼.
  - `itunes/`, `youtube/` — 서드파티 음악 검색 API를 직접 호출하고, `src/mappers/*ToMusic.ts`로 앱 내부 `Music` 형태로 정규화합니다.
  - `app/api/youtube-search/route.ts`, `app/auth/google/**/route.ts` — 서버 사이드 프록시/콜백 역할을 하는 Next.js route handler(프로바이더 시크릿과 `INTERNAL_API_URL` 기반 SSR 호출을 클라이언트에 노출하지 않기 위함).
- **플레이어**: YouTube iframe API, iTunes 미리듣기를 아우르는 멀티 프로바이더 재생을 `hooks/player/*`와 `stores/usePlayerStore.ts` 뒤로 통합하고, `mappers/*`가 각 프로바이더의 트랙 형태를 플레이어/큐에 도달하기 전에 하나의 `Music` 타입으로 정규화합니다.
- **Auth 분리**: `hooks/auth/client` vs `hooks/auth/server` — 이 경계를 지켜야 합니다. 서버 사이드 훅은 RSC/route handler에서 실행되며 `INTERNAL_API_URL`을 사용하고, 클라이언트 사이드 훅은 브라우저에서 실행되며 `API_BASE_URL` / axios client를 사용합니다.

## 프론트엔드 구현 패턴 (`apps/web`)

### 컴포넌트 구현 패턴

- `components/{domain}/` 폴더마다 `index.ts` 배럴 파일로 재export합니다 (예외 없이 모든 도메인 폴더에 존재: `archive`, `feed`, `layout`, `modals`, `noti`, `player`, `playlist`, `post`, `profile`, `search`, `setting`, `sidebar`, `skeleton`). 다른 폴더에서 컴포넌트를 가져올 때는 개별 파일 경로가 아니라 배럴(`@/components/post` 등)을 통해 import하세요.
- 컴포넌트가 커지면 두 가지 분리 방식을 씁니다: ① `partials/` 하위 폴더에 보조 컴포넌트를 두는 방식(`components/post/partials/PostActions.tsx` 등), ② 폴더명을 그대로 쓰고 그 안에 기능 단위 파일을 여러 개 두는 방식(`components/profile/ProfileInfo/FollowStats.tsx`, `ProfileActionButton.tsx` 등). 둘 다 상위 `index.ts`로 묶습니다.
- export되는 최상위 컴포넌트는 `interface {ComponentName}Props`를 쓰는 경향이 있고(`PostCardProps` 등), 내부 partials/보조 컴포넌트는 `type Props = {...}`를 쓰는 경향이 있습니다. 컴포넌트는 `export default function ComponentName(...)` 형태가 기본입니다.
- 스타일링은 Tailwind 클래스를 문자열로 직접 조합합니다(`cn`/`clsx` 유틸은 저장소 전체에 없음). 조건부 클래스는 배열 `.join(' ')` 또는 삼항 템플릿 문자열로 작성하세요 (`components/post/partials/PostActions.tsx`의 `heartClassName`, `components/sidebar/Sidebar.tsx` 참고).

### 상태 관리 방식 (Zustand)

- 파일당 스토어 1개, `stores/use{Domain}Store.ts` 네이밍. `State`/`Actions` 인터페이스를 분리 정의한 뒤 교집합 타입(`type XxxStore = XxxState & XxxActions`)으로 합쳐 `create<XxxStore>((set, get) => ({...}))`를 호출하는 형태를 따르세요 (`stores/usePlayerStore.ts` 참고).
- `persist`/`devtools` 등 zustand 미들웨어는 사용하지 않습니다 — 새 스토어를 추가할 때도 미들웨어 없이 순수 `create()`만 쓰세요.
- zustand는 **전역 UI 상태(모달/드로어/재생), 인증 상태, 여러 컴포넌트에 걸쳐 동기화가 필요하지만 TanStack Query 캐시로 정규화하기엔 성격이 다른 이벤트성 신호**(예: `usePostDeletionSignalStore`로 게시글 삭제를 목록 컴포넌트에 알림)에만 사용합니다. 좋아요/댓글수/본문처럼 "같은 서버 데이터의 값 동기화"가 필요한 경우는 `postDetailQueryKey` 쿼리 캐시(`queryClient.setQueryData`)로 정규화하세요(`usePostCacheSync`, `usePostLikeToggle`이 이 패턴의 예시) — zustand 오버라이드 맵으로 중복 구현하지 않습니다. 폼 입력값 등 컴포넌트 로컬 상태는 `useState`로 유지하고, 저장 시점에만 스토어에 반영하세요(`components/profile/ProfileInfo`가 이 패턴의 예시).

### 서버 상태 관리 (TanStack Query)

- `@tanstack/react-query`가 도입되어 있습니다. `QueryClientProvider`(`src/components/providers/QueryProvider.tsx`)가 `app/layout.tsx`에서 앱 전체에 단 하나만 마운트되며, `defaultOptions.queries.staleTime`과 공용 `MutationCache`(mutation 실패 시 토스트 표시) 정책이 여기 있습니다.
- 쿼리 키는 도메인별로 `src/query-keys/{domain}.ts`에 중앙화하고 `src/query-keys/index.ts`로 배럴 export합니다 — 문자열 배열을 훅 안에 직접 하드코딩하지 마세요.
- auth/noti/playlist/post/profile/feed/queue 도메인은 이미 `useQuery`/`useMutation`/`useInfiniteQuery` 기반입니다(`hooks/post/usePostDetail.ts`, `hooks/playlist/usePlaylists.ts`, `hooks/noti/useNotifications.ts` 등 참고). 새 백엔드(`apps/api`) 엔드포인트를 연동하는 데이터 페칭 훅을 추가할 때는 이 패턴을 기본으로 따르세요 — `useState`+`useEffect` 수동 페칭을 새로 추가하지 마세요.
- 아직 마이그레이션되지 않고 수동 패턴(`useState`+`useEffect`로 직접 페칭)이 남아있는 곳: `hooks/search/useItunesSearch.ts`/`useYoutubeSearch.ts`(서드파티 검색 API, `useYoutubeSearch`는 컴포넌트 로컬 `Map` 캐시도 별도로 구현), `hooks/post/useLikedUsers.ts`, `components/setting/PrivacyConsentView.tsx`. 이 파일들을 다른 작업 중에 건드리게 되면 React Query 전환 여부를 먼저 판단하세요(자동 전환 대상은 아님 — 관련 이슈 #260/#261).
- `PlaylistDetailModal.tsx`처럼 쿼리 캐시(`usePlaylistDetail`)와 로컬 `useState`가 렌더링의 이중 소스로 공존하는 곳도 있습니다(관련 이슈 #253) — 신규 코드에서 이 이중 구조를 따라 하지 말고, 가능하면 쿼리 캐시를 렌더링의 단일 소스로 쓰세요(`usePostDetail`이 그 예시).

### API 호출 패턴

- `src/api/internal/{domain}.ts`마다 `internalClient`(`api/internal/client.ts`의 axios 인스턴스)를 감싼 함수를 export합니다. 함수명은 `get/create/update/delete/add/remove` 등 동사 접두사 + 도메인 명사(`getFeedPosts`, `createPost`, `addFollow`, `removeFollow`)로 짓고, 요청/응답 타입은 항상 `@repo/dto`에서 import하세요. 새 백엔드 엔드포인트를 연동할 때 이 패턴을 그대로 따르면 됩니다.
- 데이터 페칭이 로딩/에러 상태 관리나 여러 컴포넌트 재사용을 필요로 하면 `hooks/{domain}/use{Domain}{Action}.ts` 커스텀 훅으로 감싸세요(예: `hooks/post/usePostDetail.ts`). 다만 단순한 액션 호출(좋아요 토글 등)은 컴포넌트에서 `api/internal` 함수를 직접 호출하는 경우도 많습니다(`components/post/PostCard.tsx`의 `addLike`/`removeLike` 등) — "반드시 훅을 거쳐야 한다"는 강제 규칙은 아닙니다.
- 외부 API 실패 시 그레이스풀 폴백이 필요하면 mock 데이터로 대체하는 패턴을 씁니다(`hooks/playlist/usePlaylistRecommendations.ts`의 `MOCK_PLAYLIST_BRIEFS` 폴백 참고).

### ⚠️ 일관성 없는 패턴 (강제 규칙 아님, 참고용)

아래는 코드베이스에 두 가지 방식이 섞여 있어 "이렇게 해야 한다"고 단정할 수 없는 부분입니다. 새 코드를 작성할 때는 **수정하려는 파일과 같은 폴더/도메인에서 이미 쓰인 방식을 따르는 것**을 우선하고, 임의로 통일하려 하지 마세요(요청받지 않은 리팩터링에 해당).

- **Props 타입 선언**: `interface {ComponentName}Props`(약 30개 파일)와 `type Props = {...}`(약 21개 파일)가 혼용됩니다. 최상위 export 컴포넌트는 `interface`, 내부 보조 컴포넌트는 `type`을 쓰는 경향이 있지만 엄격히 지켜지진 않습니다.
- **컴포넌트 분리 방식**: 같은 저장소 안에서 `partials/` 하위 폴더에 보조 컴포넌트를 모으는 방식(`components/post/partials/`)과, 폴더명을 그대로 쓰고 그 안에 개별 파일을 나열하는 방식(`components/profile/ProfileInfo/`)이 둘 다 쓰입니다. 어느 도메인이 어떤 방식을 쓸지에 대한 명시적 기준은 없습니다.
- **API 호출 경로**: "데이터 페칭은 훅을 통해서" 원칙이 있지만 실제로는 18개 이상의 컴포넌트가 `api/internal/*` 함수를 훅 없이 직접 import해서 호출합니다(`components/post/PostCard.tsx` 등). 훅 경유 여부가 로딩/에러 상태 관리 필요성과 항상 일치하지는 않습니다.
- **타입 정의 위치**: 전역 `src/types/{domain}.ts`와 컴포넌트 옆 로컬 `{domain}.types.ts`가 공존하며, "여러 곳에서 공유되면 전역, 아니면 로컬"이라는 경향만 있을 뿐 두 위치 사이를 가르는 강제된 기준은 없습니다.
- **서버 상태 페칭 전략**: 대부분 도메인은 TanStack Query로 마이그레이션됐지만 일부(서드파티 검색, `useLikedUsers`, `PrivacyConsentView`)는 아직 `useState`+`useEffect` 수동 패턴입니다. 자세한 목록은 위 "서버 상태 관리(TanStack Query)" 절 참고.

## 컨벤션

- **파일명과 폴더명은 kebab-case**입니다 (`check-file/filename-naming-convention`, `folder-naming-convention` lint 규칙이 error로 강제), 예: `user.controller.ts`, `feed-source.interface.ts`. Next.js 예약 파일(`app/**/{page,layout,loading,error,...}.tsx`)은 예외입니다. 단, 이 kebab-case 규칙은 `packages/eslint-config/base.mjs`에서 `"**/*.{ts,js,json}"`에만 적용되고 **`.tsx` 파일은 대상에서 빠져 있어** `apps/web/src/components` 아래 컴포넌트 파일은 `PostCard.tsx`, `FeedList.tsx`처럼 컴포넌트명 그대로 PascalCase로 짓는 것이 실제 관례입니다.
- TypeScript 네이밍은 `packages/eslint-config/base.mjs`의 `@typescript-eslint/naming-convention`으로 강제됩니다: 변수는 `camelCase`/`PascalCase`/`UPPER_CASE`, 타입/클래스/인터페이스는 `PascalCase`(`I` 접두사 금지), boolean 변수는 `is`/`has`/`should` 접두사 필수.
- 커스텀 훅은 `use{도메인}{동작}.ts`로 명명하고 `hooks/{domain}/` 아래 둡니다(`hooks/post/usePostDetail.ts`, `hooks/playlist/usePlaylistRecommendations.ts`, `hooks/queue/useQueueSync.ts`). 이벤트 핸들러는 예외 없이 `handleXxx` 접두사를 씁니다(`handleToggleLike`, `handleOpenDetail` 등).
- 타입은 여러 컴포넌트가 공유하면 전역 `src/types/{domain}.ts`에(`types/sidebar.ts`, `types/player.ts`), 특정 도메인 컴포넌트 묶음 전용이면 그 옆에 `{domain}.types.ts`로 둡니다(`components/noti/noti.types.ts`). 상수는 `UPPER_SNAKE_CASE`로 `constants/{domain}.ts` + `constants/index.ts` 배럴에 두고, mock 데이터는 `constants/mock/` 하위에 별도로 둡니다.
- DTO 변경은 `apps/api`나 `apps/web`에 임의로 중복 작성하지 말고 `packages/dto`에서 하세요 — 두 앱 모두 요청/응답/enum 타입을 `@repo/dto`에서 import합니다.
- `AuthGuard` vs `AuthOptionalGuard`: 엔드포인트가 비로그인 요청을 반드시 거부해야 하는지, 아니면 로그인 시에만 개인화되는 식으로 자연스럽게 동작해야 하는지에 따라 선택하세요(예: 로그인 시 개인화되는 공개 피드).
