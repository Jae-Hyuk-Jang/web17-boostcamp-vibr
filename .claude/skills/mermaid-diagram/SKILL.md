---
name: mermaid-diagram
description: 프로젝트 구조를 분석하여 Mermaid 다이어그램 HTML을 생성하고 브라우저를 실행하여 시각화합니다.
---

# Mermaid Diagram

프로젝트의 구조를 Mermaid 다이어그램으로 그려 `docs/architecture/index.html`에 저장하고, 즉시 브라우저로 엽니다. 한 페이지에 여러 다이어그램을 쌓아 올리는 방식이며, 기존에 만든 섹션은 지우지 않고 그대로 둔 채 새 섹션을 추가하는 것이 기본입니다(사용자가 "새로 다시 만들어줘"처럼 명시적으로 초기화를 요청한 경우에만 덮어씁니다).

## 대상 범위

이 저장소는 pnpm workspace 모노레포라 루트에 단일 `src/`가 없습니다. 사용자가 범위를 지정하지 않으면 다음을 기본 스캔 대상으로 합니다:

- `apps/api/src/modules/*` — 각 도메인 모듈 폴더를 노드로
- `apps/api/src/modules/**/entities/*.entity.ts` — ERD용 엔티티
- `apps/web/src/{components,hooks,stores,api,mappers}` — 각 최상위 폴더를 노드로

사용자가 특정 영역만 요청하면(예: "feed 모듈만", "web만") 그 하위 트리로 스캔 범위를 좁힙니다.

## 산출물 구성

**기본 산출물** — 인자 없이 "아키텍처 시각화해줘" 요청을 받으면 항상 아래 3개를 만듭니다(대상 지정이 필요 없고 기계적으로 스캔 가능하기 때문):

1. 백엔드 모듈 그래프 (`graph TD`)
2. 프론트엔드 폴더/컴포넌트 의존성 그래프 (`graph TD`)
3. **ERD — 엔티티 관계도** (`erDiagram`)

**온디맨드 산출물** — 사용자가 명시적으로 요청할 때만 추가합니다(대상을 사람이 골라줘야 결과가 유의미하므로 기본 실행에는 포함하지 않음):

4. **컴포넌트 렌더 트리** — "컴포넌트 트리 보여줘", "OOO 페이지 구조 보여줘" 같은 요청. 루트 컴포넌트(또는 페이지)를 사용자에게 확인하세요.
5. **데이터 흐름 시퀀스 다이어그램** — "좋아요 흐름 보여줘", "피드 로딩 흐름 그려줘" 같은 요청. 대상 액션/기능을 사용자에게 확인하세요.

상태 흐름(로그인 세션, 재생 상태 등)처럼 store의 상태가 명확히 구분되는 경우 `stateDiagram-v2`로 추가하는 것도 유효합니다 — 새로운 zustand 스토어를 다룰 때 상태값이 몇 가지 값으로 뚜렷이 구분되면(예: `isLoading`/`isPlaying`/enum 필드) 이 패턴을 재사용하세요.

## 단계

### 1. 의존성 스캔 — 모듈/폴더 그래프 (기본)

- 대상 디렉터리 아래 최상위 폴더(예: `modules/feed`, `modules/trending`, `components/post`, `stores`)를 노드로 잡습니다.
- 각 폴더 안의 파일들이 어떤 다른 폴더를 import하는지 `grep -rnE "from '\.\./|from '\.\./\.\./|from '@/"` 등으로 확인하고, 파일 단위가 아닌 **폴더 간 관계로 축약**합니다. 파일 하나하나를 노드로 만들면 그래프가 읽기 어려워지므로 지양합니다.
- `graph TD` 문법으로 변환합니다:
  ```
  graph TD
    feed --> trending
    feed --> follow
    post --> stores
  ```

### 2. ERD 스캔 — 엔티티 관계도 (기본)

- `apps/api/src/modules/**/entities/*.entity.ts` (및 `modules/*/*.entity.ts`처럼 entities 폴더 없이 바로 있는 경우도 포함, 예: `privacy.entity.ts`)를 모두 찾습니다.
- 각 파일에서 `@Entity()` 클래스명과 `@OneToMany`/`@ManyToOne`/`@ManyToMany`/`@OneToOne` 데코레이터를 grep으로 추출합니다: `grep -nE "@Entity|@OneToMany|@ManyToOne|@ManyToMany|@OneToOne|class [A-Za-z]+"`.
- `@ManyToOne(() => Target, ...)` 형태에서 대상 엔티티명을 뽑아 관계를 만듭니다. **중복 방지**: `OneToMany`/`ManyToOne`은 같은 관계의 양쪽이므로 `ManyToOne` 쪽(연관관계의 주인, FK를 가진 쪽)만 기준으로 관계를 그리면 충분합니다.
- 카디널리티 표기: `ManyToOne` → `ONE ||--o{ MANY`, `ManyToMany` → `A }o--o{ B`, `OneToOne` → `A ||--|| B`.
- `erDiagram` 문법으로 변환하고, 관계 라벨에는 FK 컬럼 의도를 짧게 남깁니다(예: `@JoinColumn({ name: 'author_id' })` → `"author"`):
  ```
  erDiagram
    USER ||--o{ POST : "author"
    POST ||--o{ POST_MUSIC : "tracks"
    MUSIC ||--o{ POST_MUSIC : "in_post"
  ```
- 엔티티 컬럼 전체(타입, nullable 등)까지는 나열하지 않습니다 — 관계 파악이 목적이므로 관계선 위주로 가볍게 유지하세요.

### 3. (온디맨드) 컴포넌트 렌더 트리

- 사용자가 지정한 루트 컴포넌트/페이지 파일을 Read로 엽니다.
- JSX 안에서 사용되는 자식 컴포넌트(`<ChildComponent`로 시작하는 태그, import된 로컬 컴포넌트만 — `div`/`span`류 HTML 태그나 외부 라이브러리 컴포넌트는 제외)를 찾고, 그 자식의 파일을 다시 Read해서 재귀적으로 따라갑니다.
- 깊이는 3~4단계 정도로 제한하고, 더 내려가면 지저분해지므로 리프 컴포넌트(`components/skeleton`, 아이콘 등)에서 멈춥니다.
- import 의존성 그래프(단계 1)와는 다른 성격임을 라벨/설명으로 명확히 구분하세요 — 이건 "누가 누구를 렌더하는가"(합성 트리)이지 "누가 누구를 import하는가"가 아닙니다.
- `graph TD`로 표현하되 섹션 제목에 "렌더 트리"임을 명시합니다.

### 4. (온디맨드) 데이터 흐름 시퀀스 다이어그램

- 사용자가 지정한 액션(예: "좋아요 토글")의 트리거 지점(보통 `handleXxx` 이벤트 핸들러)을 컴포넌트에서 찾습니다.
- 거기서 호출하는 `api/internal/*` 함수 → 이 함수가 부르는 백엔드 경로를 확인하고, `apps/api/src/modules/*/*.controller.ts`에서 같은 경로/메서드의 컨트롤러 핸들러를 grep으로 찾습니다.
- 컨트롤러 → 서비스 → 레포지토리(또는 Redis/Neo4j) 흐름과, 응답이 돌아온 뒤 프론트에서 어느 zustand 스토어/상태가 갱신되는지까지 추적합니다.
- `sequenceDiagram`으로 표현합니다. participant는 상황에 맞게 고르되, 보통 `Component`, `API(axios)`, `Controller`, `Service`, `DB/Redis/Neo4j` 정도면 충분합니다:
  ```
  sequenceDiagram
    participant C as PostCard
    participant A as api/internal/like
    participant Ctrl as LikeController
    participant S as LikeService
    participant DB as MySQL
    C->>A: addLike(postId)
    A->>Ctrl: POST /like
    Ctrl->>S: create(userId, postId)
    S->>DB: insert
    DB-->>S: ok
    S-->>Ctrl: ok
    Ctrl-->>A: 201
    A-->>C: 성공 → optimistic UI 확정
  ```

### 5. HTML 생성

- `docs/architecture/index.html` 파일이 없으면 생성하고, 있으면 **기존 섹션 뒤에 새 섹션을 추가**합니다(전체 재작성 요청이 아닌 한 기존 `<h2>`/`<pre class="mermaid">` 블록은 유지). 필요하면 `docs/architecture/` 디렉터리를 먼저 만듭니다.
- Mermaid.js는 CDN에서 로드합니다: `<script src="https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js"></script>` (파일당 한 번만, 이미 있으면 중복 추가하지 않음).
- 각 다이어그램은 `<h2>제목</h2>` + 필요하면 `<p class="legend">범례/근거</p>` + `<pre class="mermaid">...</pre>` 블록으로 구성합니다.
- 어두운 테마를 적용합니다: `body { background: #1a1a1a; color: #eee; }` + `mermaid.initialize({ startOnLoad: true, theme: 'dark' })`.
- 이 파일은 브라우저에서 직접 여는 일반 정적 HTML입니다(Artifact 도구가 아님). CDN 스크립트를 로드하므로 **인터넷 연결이 없으면 다이어그램이 렌더링되지 않습니다** — 이 점을 알고 있어야 합니다.

### 6. 브라우저 실행

- macOS: `open docs/architecture/index.html`
- Linux: `xdg-open docs/architecture/index.html`
- 이 환경은 WSL2입니다. `xdg-open`은 대체로 없거나 실패하므로, 아래 순서로 폴백하세요. **`explorer.exe`는 WSL에서 정상적으로 열려도 종료 코드 1을 반환하는 것으로 알려져 있으므로, exit code만으로 실패 여부를 단정하지 말고 사용자에게 열렸는지 확인을 요청하세요.**
  ```bash
  xdg-open docs/architecture/index.html 2>/dev/null \
    || wslview docs/architecture/index.html 2>/dev/null \
    || explorer.exe "$(wslpath -w docs/architecture/index.html)" 2>/dev/null
  ```

## 완료 후

"아키텍처 다이어그램이 브라우저에서 열렸습니다."라고 보고하고, 이번에 추가/갱신한 다이어그램이 무엇인지 목록으로 요약합니다. 브라우저를 실제로 열 수 없는 환경(원격/헤드리스 등)이거나 WSL2에서 `explorer.exe` 성공 여부가 불확실하면, 파일 경로(및 WSL UNC 경로 `\\wsl.localhost\...`)를 함께 안내합니다.

## 주의사항

- 이 스킬은 madge, dependency-cruiser 같은 정밀 정적 분석 도구가 아니라, 폴더/모듈 단위의 개략적인 구조 파악용입니다.
- 그래프 하나의 노드가 15개를 넘어가 지저분해지면, 스캔 범위를 하위 트리 하나로 좁혀 다시 실행하는 것을 제안하세요.
- `docs/architecture/index.html`은 기본적으로 섹션이 누적되는 산출물입니다. 오래돼서 실제 코드와 어긋난 다이어그램이 있으면 사용자에게 알리고 해당 섹션만 다시 생성하세요. 커밋할지 여부는 사용자에게 확인하세요.
