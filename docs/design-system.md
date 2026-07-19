# VIBR 디자인 시스템

이 문서는 `apps/web`에 실제로 구현된 시각적 패턴을 코드 기준으로 정리한 레퍼런스입니다. 목적은 새 기능을 추가하거나 기존 기능을 확장할 때 **기존 스타일을 재발명하지 않고 그대로 재사용**할 수 있게 하는 것입니다. 코드 컨벤션(파일 구조, 네이밍, 상태 관리)은 `docs/conventions.md`를 참고하세요 — 이 문서는 "어떤 클래스를 쓸 것인가"에 집중합니다.

토큰은 `apps/web/app/globals.css`의 `@theme` 블록에 정의돼 있으며(Tailwind v4 CSS-first 설정), 이 문서의 모든 값은 그 파일과 실제 컴포넌트 코드를 grep한 결과를 근거로 합니다.

## 1. 디자인 컨셉

VIBR의 시각 언어는 **네오브루탈리즘(neobrutalism)** 계열입니다: 두꺼운 `border-2 border-primary`, 그림자를 완전히 오프셋시킨 "하드 섀도"(`shadow-[Npx_Npx_0px_0px_...]`, 블러 없음), 굵은 타이포그래피(`font-bold`/`font-black`, `font-normal`은 저장소 전체에 사용례 없음)가 조합되어 카드/버튼/모달 전반에 반복됩니다. 새 UI를 만들 때는 이 세 요소(두꺼운 테두리, 하드 섀도, 굵은 폰트)를 기본값으로 가정하세요.

## 2. 색상 토큰

`@theme`에 정의된 전체 팔레트와 실제 용도(코드 grep 기준):

| 토큰                    | 값        | 실제 용도                                                                                           |
| ----------------------- | --------- | --------------------------------------------------------------------------------------------------- |
| `--color-primary`       | `#00214d` | 기본 텍스트 색, 모든 테두리(`border-primary`), 프라이머리 버튼 배경                                 |
| `--color-accent-cyan`   | `#00ebc7` | hover 시 하드 섀도 색(`hover:shadow-[2px_2px_0px_0px_#00ebc7]`), 볼륨 슬라이더 thumb, 강조 배지     |
| `--color-accent-pink`   | `#ff5470` | 강조/CTA 버튼 배경(하트, 좋아요, 헤더 CTA)                                                          |
| `--color-accent-yellow` | `#fde24f` | 액션 버튼 강조 배경(예: `ProfileActionButton.tsx:66`의 `bg-accent-yellow/90`)                       |
| `--color-darkblue`      | `#1b2d45` | 오버레이/백드롭 틴트(`bg-darkblue/15`, `VolumeControl.tsx:59`) — `primary`보다 은은한 반투명 배경용 |
| `--color-gray-1`        | `#828282` | 보조 텍스트                                                                                         |
| `--color-gray-2`        | `#bdbdbd` | placeholder, 비활성 텍스트                                                                          |
| `--color-gray-3`        | `#e0e0e0` | 구분선(`border-gray-3`)                                                                             |
| `--color-gray-4`        | `#f5f5f7` | 서브틀 배경(카드 내부, 비활성 영역)                                                                 |
| `--color-white`         | `#fffffe` | 기본 배경, 모달/카드 배경                                                                           |
| `--color-black`         | `#191414` | 극히 드묾 — 대부분 `primary`가 텍스트 검정 역할을 대신함                                            |
| `--color-spotify-green` | `#1db954` | ⚠️ **정의만 있고 실제 미사용** — Spotify 버튼은 `#1ED760`/`#1DB954`를 직접 하드코딩(§7 참고)        |
| `--color-error`         | `#ca2a30` | 에러 텍스트/토스트                                                                                  |

### 사용 규칙

- **theme 색상 클래스(`text-primary`, `bg-accent-*`, `text-gray-1`~`4`)만 쓰세요.** `text-gray-400`, `bg-gray-50` 같은 Tailwind 기본 회색 팔레트가 21곳 이상에서 혼용되고 있는데(`SongList.tsx:132`, `PostDetailBody.tsx:58,67,68`, `ConfirmToast.tsx:8`, `PlaylistPickerModal.tsx:167`, `AgreeItem.tsx:24` 등), 이는 의도된 패턴이 아니라 일관성이 무너진 부분입니다. 새 코드에서는 반드시 `gray-1`~`gray-4` 중 하나를 쓰세요.
- **임의 hex 색상(`text-[#...]`, `bg-[#...]`)은 서드파티 브랜드 컬러(Spotify 등)에만 예외적으로 허용**합니다. 그 외의 경우 theme 토큰이 없다고 새 hex를 바로 쓰지 말고, `@theme`에 새 토큰을 추가하는 쪽을 우선 검토하세요.
- 하드 섀도의 색은 `hover:shadow-[2px_2px_0px_0px_#00ebc7]`처럼 여전히 hex로 박혀 있는 경우가 대부분이지만, 일부는 `var(--color-primary)`를 쓰기도 합니다(`ContentWriteModal.tsx:51`, `LoginModal.tsx:25`). 새 코드를 쓸 때는 `var(--color-primary)` 형태를 우선하세요(§6 참고).

## 3. 타이포그래피

폰트는 Pretendard Variable(`globals.css:1`) 고정, 별도 `font-family` 선택 불필요.

역할별로 실제 반복되는 조합(대표 4가지):

| 역할               | 클래스                                       | 예시                                                                                                     |
| ------------------ | -------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| 모달/드로어 제목   | `text-xl font-black text-primary`            | `modals/UserListModal/UserListModal.tsx:64`, `sidebar/Drawer.tsx:50`, `layout/MobileNotiOverlay.tsx:138` |
| 페이지/헤더 타이틀 | `text-2xl font-black`                        | `layout/Header.tsx:27`, `modals/PlaylistDetailModal/components/Header.tsx:90`                            |
| 본문/라벨(강조)    | `text-sm font-bold` 또는 `text-xs font-bold` | 댓글, 배지, 메타정보 등 광범위                                                                           |
| 보조 텍스트        | `text-sm text-gray-1`                        | 서브텍스트, 타임스탬프                                                                                   |

새 텍스트를 배치할 때는 이 표에서 역할이 가장 가까운 조합을 그대로 재사용하세요. `font-normal`/`font-light`는 저장소 관례에 없으므로 쓰지 마세요. `LoginRequestScreen.tsx:14`처럼 `text-2xl font-bold`(black이 아닌 bold)로 튀는 예외가 1건 있는데, 이는 관례가 아니라 누락이니 참고하지 마세요.

## 4. 여백/간격

내부 padding과 요소 간 gap에서 실제로 반복되는 값(빈도순):

- **padding**: `p-4` > `p-2` > `p-1` > `p-3` > `p-6` (카드류는 `p-4`가 기본값)
- **padding(축 분리)**: `px-4`/`px-6`/`px-3`, `py-2`/`py-4`/`py-1.5`
- **gap**: `gap-2` > `gap-3` ≈ `gap-1` > `gap-4`

임의의 새 값(`p-5`, `gap-2.5` 등)을 도입하기보다 위 스케일 안에서 고르세요. 이 값들이 사실상 이 프로젝트의 spacing 스케일입니다.

## 5. 모서리 둥글기(Radius)

컴포넌트 유형별로 뚜렷하게 구분되는 관례가 있습니다 — **컴포넌트 종류를 먼저 판단하고 그에 맞는 radius를 고르세요**:

| 컴포넌트 유형               | radius          | 예시                                                                                                   |
| --------------------------- | --------------- | ------------------------------------------------------------------------------------------------------ |
| 아바타/원형 버튼            | `rounded-full`  | `profile/ProfileInfo/ProfileInfo.tsx:47-48`                                                            |
| 카드/일반 버튼              | `rounded-xl`    | 다수                                                                                                   |
| 인풋/드롭다운               | `rounded-lg`    | 다수                                                                                                   |
| 소형 버튼(아이콘 버튼 등)   | `rounded-md`    | `player/QueueList.tsx:85,95,105`                                                                       |
| **중앙 정렬 모달**          | `rounded-3xl`   | `LoginModal.tsx:25`, `ContentWriteModal.tsx:51`, `UserListModal.tsx:61`, `PlaylistPickerModal.tsx:159` |
| **모바일 바텀시트**(상단만) | `rounded-t-2xl` | `layout/MobileBottomSheet.tsx:28`, `MobileNowPlaylistModal.tsx:85`, `PostCardDetailModal.tsx:257`      |

새 모달을 만들 때 데스크톱 중앙형이면 `rounded-3xl`, 모바일 바텀시트면 `rounded-t-2xl`을 그대로 따르세요(§8에 전체 클래스 레시피가 있습니다).

## 6. 테두리 / 그림자 — 하드 섀도 시스템

- 기본 테두리는 `border-2 border-primary`(287건 중 대다수)이며, `border-4`는 아바타 프레임 전용입니다(`ProfileInfo.tsx:47`).
- **하드 섀도**가 이 프로젝트의 시그니처 인터랙션입니다. 블러 없는 오프셋 그림자로, 두 가지 규모로 씁니다.
  - 버튼 hover: `hover:shadow-[2px_2px_0px_0px_#00ebc7]` (또는 `var(--color-primary)`) — `player/QueueList.tsx:85,95,105`, `player/MiniPlayerBar.tsx:147`
  - 중앙 모달 컨테이너: `shadow-[8px_8px_0px_0px_...]` — `modals/PlaylistDetailModal/PlaylistDetailModal.tsx:165`
  - 새 hover 인터랙션을 추가할 때는 `2px_2px`(소형)와 `8px_8px`(모달급) 중 맥락에 맞는 규모를 고르고, 순정 Tailwind `shadow-sm/md/lg`는 이 프로젝트의 시그니처가 아니므로 특별한 이유가 없으면 피하세요.
- 구분선은 `border-b border-gray-3`가 관례입니다(theme 토큰 사용). `border-gray-100`/`border-gray-300`(기본 팔레트)를 쓰는 예외가 있으나(`PlaylistPickerModal.tsx:167`, `AgreeItem.tsx:24`) 새 코드에서는 따르지 마세요 — §2의 색상 규칙과 동일한 이유입니다.

## 7. 아이콘

- **아이콘 라이브러리는 `lucide-react` 단일 소스**입니다. svg 직접 임포트나 다른 아이콘 라이브러리(react-icons 등)는 저장소에 없습니다. 새 아이콘이 필요하면 `lucide-react`에서 찾으세요.
  ```tsx
  import { ArrowLeft } from 'lucide-react';
  ```
- 크기는 `size={}` prop이 아니라 **className으로 지정**하는 쪽이 표준입니다: `w-4 h-4`(가장 흔함) > `w-5 h-5` > `w-6 h-6`.
- `globals.css`의 `sidebar-icon` 유틸(`w-6 aspect-square shrink-0`)은 사이드바 전용으로만 쓰이고(`Sidebar.tsx`, `MenuButton.tsx`) 다른 곳으로 확산되지 않았습니다. 사이드바 바깥에서는 `w-4 h-4`/`w-5 h-5`를 직접 쓰세요.

## 8. 재사용 가능한 컴포넌트 레시피

### 버튼

공유 `Button` 컴포넌트는 존재하지 않습니다(`packages/ui`는 빈 파일, `apps/web`에도 범용 버튼 없음) — 각 파일이 아래 클래스 조합을 인라인으로 반복합니다. **새 버튼을 만들 때 아래 세 변형 중 하나를 그대로 복사해서 쓰세요**(임의로 새 스타일을 만들지 마세요):

```tsx
// Primary
className = 'bg-primary text-white border-2 border-primary rounded-md font-bold ...';

// Secondary / outline
className = 'border-2 border-primary text-primary rounded-md font-bold hover:bg-white ...';

// Danger / accent
className = 'bg-accent-pink text-white border-2 border-primary rounded-md font-bold ...';
```

공통으로 `enabled:hover:shadow-[2px_2px_0px_0px_#00ebc7]`(§6), `disabled:opacity-50 disabled:cursor-not-allowed`, `transition-all`을 붙입니다. 참고: `player/QueueList.tsx:85-105`.

> 같은 버튼 스타일이 파일마다 반복되는 것 자체가 기술부채입니다 — 공용 `Button` 컴포넌트로 추출할 가치가 있습니다(§9 참고).

### 모달 — 중앙 정렬형

```tsx
// 백드롭
className = 'fixed inset-0 z-* flex items-center justify-center bg-primary/40 backdrop-blur-sm p-4 animate-fade-in';

// 컨테이너
className = 'bg-white rounded-3xl border-2 border-primary shadow-[8px_8px_0px_0px_...] ...';
```

참고: `LoginModal.tsx:20,25`, `ContentWriteModal.tsx:50-51`, `PlaylistDetailModal.tsx:160,165`.

### 모달 — 모바일 바텀시트

```tsx
className = 'fixed inset-x-0 bottom-0 rounded-t-2xl border-t-2 border-x-2 border-primary animate-slide-up';
```

참고: `layout/MobileBottomSheet.tsx:28`, `PostCardDetailModal.tsx:257`.

### 아바타

```tsx
// 컨테이너
className = 'w-24 h-24 rounded-full border-4 border-primary ...';
// 반응형: md:w-40 md:h-40
```

참고: `profile/ProfileInfo/ProfileInfo.tsx:47-48`.

## 9. 반응형 브레이크포인트

`@theme`에 커스텀 브레이크포인트 `2xs`(390px), `xs`(480px)가 추가돼 있고, Tailwind 기본 `sm`/`md`/`lg`/`xl`/`2xl`도 함께 씁니다. **모바일 우선(mobile-first)** 구조입니다 — 기본 클래스가 모바일 스타일이고 `md:`/`lg:`로 데스크톱을 오버라이드합니다:

```tsx
// profile/ProfileInfo/ProfileInfo.tsx:47
className = 'w-24 h-24 md:w-40 md:h-40';
```

사용 빈도는 `md:` > `sm:` > `lg:` > `xs:` > `2xl:` ≫ `2xs:`(사실상 거의 안 씀) 순입니다. 새 반응형 분기가 필요하면 `md:`를 우선 고려하고, `xs:`는 버튼/텍스트 크기의 미세조정(390~480px 구간)에만 쓰세요.

## 10. 다크모드

**미구현**입니다. `dark:` prefix 사용례가 저장소에 없고, `globals.css`도 라이트 테마 팔레트만 정의합니다. 새 컴포넌트에 `dark:` 클래스를 추가하지 마세요 — 대응하는 다크 팔레트가 없어 오히려 혼란을 줍니다.

## 11. 알려진 불일치 (새 코드 작성 시 따르지 말 것)

아래는 기존 코드에 남아있지만 "관례"가 아니라 정리가 안 된 부분입니다. 새 코드에서는 반대쪽(권장 방향)을 따르세요.

| 이슈                                                                                                | 발견 위치                                                                                                        | 권장 방향                                                                                                                  |
| --------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `text-gray-400`, `bg-gray-50` 등 Tailwind 기본 회색 혼용                                            | `SongList.tsx:132`, `PostDetailBody.tsx:58,67,68`, `ConfirmToast.tsx:8` 등 21곳+                                 | `gray-1`~`gray-4` theme 토큰만 사용                                                                                        |
| `--color-spotify-green` 토큰이 정의만 되고 실제로는 `#1ED760`/`#1DB954`를 하드코딩                  | `modals/LoginModal/loginButtons/SpotifyLoginButton.tsx:28-29`                                                    | 토큰을 실제로 쓰거나, 안 쓸 거면 `globals.css`에서 제거                                                                    |
| `animate-scale-up` 클래스가 4개 파일에서 쓰이지만 `globals.css` `@theme`/`@keyframes`에 정의가 없음 | `PostCardDetailModal.tsx:301`, `UserListModal.tsx:61`, `PlaylistPickerModal.tsx:159`, `LikedUsersOverlay.tsx:30` | 애니메이션 없이 렌더링되고 있을 가능성이 높은 버그. `globals.css`에 `@keyframes scale-up` + `--animate-scale-up` 추가 필요 |
| 공용 `Button` 컴포넌트 부재 — 버튼 스타일이 파일마다 인라인 반복                                    | §8 참고                                                                                                          | 신규 기능에서 버튼이 3번째 이상 반복되면 공용 컴포넌트 추출 검토                                                           |
| 하드 섀도 색이 `#00214D` hex와 `var(--color-primary)`로 혼재                                        | `ContentWriteModal.tsx:51` vs `Sidebar.tsx:232`                                                                  | `var(--color-primary)` 형태로 통일                                                                                         |

## 12. 새 기능/컴포넌트 추가 시 체크리스트

1. 색상은 `@theme`에 이미 있는 토큰(§2)에서만 고른다. 없으면 hex를 바로 쓰지 말고 토큰 추가를 먼저 검토한다.
2. 텍스트는 §3의 4가지 역할별 조합 중 가장 가까운 것을 그대로 쓴다.
3. spacing은 §4의 스케일(`p-1`~`p-6`, `gap-1`~`gap-4`) 안에서 고른다.
4. radius는 컴포넌트 종류(아바타/카드/버튼/모달/바텀시트)에 따라 §5 표를 그대로 따른다.
5. hover 인터랙션에 그림자를 추가한다면 순정 `shadow-*`가 아니라 하드 섀도(§6)를 쓴다.
6. 아이콘은 `lucide-react`에서만 가져오고 `w-4 h-4`/`w-5 h-5`로 크기를 준다.
7. 버튼/모달을 새로 만든다면 §8의 레시피를 복사해서 시작한다.
8. `dark:` prefix는 쓰지 않는다.
9. §11의 불일치 패턴(기본 회색 팔레트, 하드코딩 hex 등)은 새 코드에 다시 끌어들이지 않는다.
