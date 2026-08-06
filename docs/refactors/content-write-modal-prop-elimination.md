# ContentWriteModal 개선 기록

> 정식 `/refactoring-planner` 파이프라인(PRD/ADR/Result)을 거치지 않은 즉흥 페어 세션 기록입니다. `apps/web/src/components/modals/ContentWriteModal` 폴더를 대상으로 발견 즉시 논의하고 바로 구현한 5건을 다룹니다. 모든 항목은 동작 변경이 없는 순수 구조 개선이며, 각 단계마다 `pnpm check-types` / `pnpm lint` / `pnpm test`로 검증했습니다.

## 배경

`ContentWriteModal`을 개선 대상으로 잡고 구조 분석을 하다가, 사용자가 직접 질문한 두 가지가 이번 작업의 방향을 결정했습니다.

1. "props 문제는 없나요?" → 죽은 `initialMusic`(단수) prop 발견
2. "왜 이렇게 컴포넌트에 props가 많냐는 거야 다 없앨 수 없을까??" → 처음엔 "1단계 prop drilling이라 불필요한 추상화"라고 판단했으나, 사용자 재지시로 `PostCardDetailModal`에 이미 적용된 Context 패턴을 그대로 이식

---

## 문제 1 — 죽은 `initialMusic`(단수) prop

`ModalContainer.tsx → ContentWriteModal.tsx → useContentWrite.ts` 세 파일을 관통해서 `initialMusic?: Music`(단수)가 전달되고 있었지만, 실제 호출부(`useMusicActions.ts`의 `openWriteModalWithMusic`)는 이미 `initialMusics`(복수, 1개짜리 배열)로만 호출하고 있어 관통 경로 전체가 죽은 코드였습니다. 지지하는 주석도 낡아 있었습니다.

**Before** (`useContentWrite.ts`)

```ts
type Options = {
  /**
   * 기존 호출부 유지
   */
  initialMusic?: Music;

  /** 다곡 초기값 */
  initialMusics?: Music[];

  onSuccess: () => void;
};

const toInitialSelected = (initialMusics?: Music[], initialMusic?: Music): Music[] => {
  if (Array.isArray(initialMusics) && initialMusics.length > 0) {
    return uniqById(initialMusics);
  }
  return initialMusic ? [initialMusic] : [];
};

export const useContentWrite = ({ initialMusic, initialMusics, onSuccess }: Options): Return => {
  ...
  const [selectedMusics, setSelectedMusics] = useState<Music[]>(() => toInitialSelected(initialMusics, initialMusic));
  ...
  useEffect(() => {
    setSelectedMusics(toInitialSelected(initialMusics, initialMusic));
    ...
  }, [initialMusic, initialMusics]);
```

**After**

```ts
type Options = {
  /** 초기 선택 곡 */
  initialMusics?: Music[];

  onSuccess: () => void;
};

const toInitialSelected = (initialMusics?: Music[]): Music[] => {
  if (!Array.isArray(initialMusics)) return [];
  return uniqById(initialMusics);
};

export const useContentWrite = ({ initialMusics, onSuccess }: Options): UseContentWriteResult => {
  ...
  const [selectedMusics, setSelectedMusics] = useState<Music[]>(() => toInitialSelected(initialMusics));
  ...
  useEffect(() => {
    setSelectedMusics(toInitialSelected(initialMusics));
    ...
  }, [initialMusics]);
```

`useMusicActions.ts`의 낡은 주석도 실제 동작에 맞게 고쳤습니다.

```diff
-  /** 작성 모달(단일): DB에 보장 후 initialMusic으로 전달 */
+  /** 작성 모달(단일): DB에 보장 후 initialMusics(1개짜리 배열)로 전달 */
```

`ModalContainer.tsx`에서도 `initialMusic` 캐스팅 줄이 사라졌습니다(이 변경은 문제 5에서 완전히 제거되는 `initialMusics` 캐스팅과 별개로, 이 시점엔 `initialMusics` prop만 남았습니다).

---

## 문제 2 — `MusicSearch.tsx` 내부에 섞여 있던 플레이리스트 렌더링 로직

`renderPlaylistSection`이 `MusicSearch.tsx` 내부의 인라인 함수로 존재해, "검색창 렌더링"과 "추천 플레이리스트 섹션 렌더링"이라는 서로 다른 책임이 한 파일에 뒤섞여 있었습니다.

**Before** (`MusicSearch.tsx` 내부)

```tsx
const renderPlaylistSection = () => {
  let playlistContent;

  if (playlistStatus === 'loading') {
    playlistContent = <LoadingMessage />;
  } else if (briefs.length === 0) {
    playlistContent = <EmptyPlaylist onClick={refetch} />;
  } else {
    playlistContent = <BriefItemList briefs={briefs} selectedPlaylistId={selectedPlaylistId} onSelect={handleSelectPlaylist} />;
  }

  return (
    <>
      <div className="px-4 py-2 flex items-center text-xs font-bold text-accent-cyan uppercase tracking-wider bg-gray-4/50 border-b border-gray-3 mb-1">
        <Sparkles className="w-3 h-3 mr-1" />
        추천 (내 플레이리스트)
      </div>
      {playlistContent}
      {playlistError ? <div className="px-4 py-2 text-[11px] text-gray-2">{playlistError}</div> : null}
    </>
  );
};
```

**After** — `PlaylistSectionInner.tsx`로 `PlaylistRecommendationSection` 컴포넌트를 추출하고, `MusicSearch.tsx`는 호출만 합니다.

```tsx
// PlaylistSectionInner.tsx
export function PlaylistRecommendationSection({
  status,
  briefs,
  selectedPlaylistId,
  errorMessage,
  onSelect,
  onRetry,
}: Readonly<PlaylistRecommendationSectionProps>) {
  let playlistContent;
  if (status === 'loading') {
    playlistContent = <LoadingMessage />;
  } else if (briefs.length === 0) {
    playlistContent = <EmptyPlaylist onClick={onRetry} />;
  } else {
    playlistContent = <BriefItemList briefs={briefs} selectedPlaylistId={selectedPlaylistId} onSelect={onSelect} />;
  }

  return (
    <>
      <div className="px-4 py-2 flex items-center text-xs font-bold text-accent-cyan uppercase tracking-wider bg-gray-4/50 border-b border-gray-3 mb-1">
        <Sparkles className="w-3 h-3 mr-1" />
        추천 (내 플레이리스트)
      </div>
      {playlistContent}
      {errorMessage ? <div className="px-4 py-2 text-[11px] text-gray-2">{errorMessage}</div> : null}
    </>
  );
}
```

```tsx
// MusicSearch.tsx
<PlaylistRecommendationSection
  status={playlistStatus}
  briefs={briefs}
  selectedPlaylistId={selectedPlaylistId}
  errorMessage={playlistError}
  onSelect={handleSelectPlaylist}
  onRetry={refetch}
/>
```

---

## 문제 3 — 죽은 배럴(barrel) export

`ContentWriteModal/index.ts`가 `CoverImgUploader`/`MusicSearch`/`SelectedMusicList`를 재export하고 있었지만, 실제 import는 전부 상대경로 직접 참조(`./partials/CoverImgUploader` 등)였고 배럴을 경유한 import는 0건이었습니다.

**Before**

```ts
export { CoverImgUploader } from './partials/CoverImgUploader';
export { MusicSearch } from './partials/MusicSearch';
export { SelectedMusicList } from './partials/SelectedMusicList';
export { ContentWriteModal } from './ContentWriteModal';
```

**After**

```ts
export { ContentWriteModal } from './ContentWriteModal';
```

같은 맥락에서 `ContentWriteModal.test.tsx`에 있던 `jest.mock('./index', ...)` 블록도 제거했습니다 — 컴포넌트가 `./index`를 경유해 import한 적이 없어 리팩터링 전부터 이미 아무 효과가 없던 mock이었습니다.

---

## 문제 4 — leaf 컴포넌트 3개의 props drilling

`CoverImgUploader`(2 props), `SelectedMusicList`(3 props), `MusicSearch`(6 props)가 `ContentWriteModal.tsx`로부터 `useContentWrite()`의 반환값을 그대로 전달받고 있었습니다. 이 컴포넌트들은 이 모달의 유일한 소비처인데도, 매번 어떤 값을 어떤 이름으로 넘길지 `ContentWriteModal.tsx`가 일일이 배선해야 했습니다.

처음에는 "1단계짜리 얕은 prop drilling이라 Context로 바꾸는 게 오히려 과한 추상화"라고 판단했지만, 사용자가 `PostCardDetailModal`에 이미 적용된 패턴(`PostDetailModalContext.tsx`)을 근거로 재지시해 동일 패턴을 이식했습니다.

**Before** (`ContentWriteModal.tsx`)

```tsx
export const ContentWriteModal = ({ initialMusic, initialMusics }: Props) => {
  const { closeModal } = useModalStore();
  const handleWriteSuccess = () => { ... };

  const {
    selectedMusics, content, setContent, searchQuery, setSearchQuery,
    isSearchOpen, setIsSearchOpen, activeCover, isSubmitDisabled,
    onFileChange, onAddMusic, onAddPlaylist, onRemoveMusic, onMoveMusic, onSubmit,
  } = useContentWrite({ initialMusic, initialMusics, onSuccess: handleWriteSuccess });

  return (
    <ModalShell ...>
      <ModalPanel ...>
        ...
        <CoverImgUploader currentCover={activeCover} onFileChange={onFileChange} />
        <SelectedMusicList musics={selectedMusics} onRemove={onRemoveMusic} onMove={onMoveMusic} />
        <MusicSearch
          searchQuery={searchQuery} setSearchQuery={setSearchQuery}
          isSearchOpen={isSearchOpen} setIsSearchOpen={setIsSearchOpen}
          onAddMusic={onAddMusic} onAddPlaylist={onAddPlaylist}
        />
        ...
```

**After** — 신설한 `ContentWriteContext.tsx`가 `PostDetailModalContext.tsx`와 동일한 3단 구성(Provider/ValueProvider/useXContext)을 따릅니다.

```tsx
// ContentWriteContext.tsx (신규)
const ContentWriteContext = createContext<UseContentWriteResult | null>(null);

/** 값을 직접 주입하는 순수 Provider — 훅을 호출하지 않아 컴포넌트 단독 테스트에 쓴다. */
export function ContentWriteValueProvider({ value, children }: ValueProviderProps) {
  return <ContentWriteContext.Provider value={value}>{children}</ContentWriteContext.Provider>;
}

/**
 * useContentWrite는 이 모달 트리 전체가 공유하는 폼 상태(선택 곡·커버·검색·본문)를
 * 소유한 오케스트레이션 훅이라 반드시 한 곳에서만 호출돼야 한다 — 이 Provider가 그 유일한 호출 지점이다.
 */
export function ContentWriteProvider({ onSuccess, children }: ProviderProps) {
  const { modalProps } = useModalStore();
  const initialMusics = modalProps?.initialMusics as Music[] | undefined;
  const value = useContentWrite({ initialMusics, onSuccess });
  return <ContentWriteValueProvider value={value}>{children}</ContentWriteValueProvider>;
}

export function useContentWriteContext(): UseContentWriteResult {
  const v = useContext(ContentWriteContext);
  if (!v) throw new Error('useContentWriteContext must be used within ContentWriteProvider');
  return v;
}
```

```tsx
// ContentWriteModal.tsx
export const ContentWriteModal = () => {
  const { closeModal } = useModalStore();
  const handleWriteSuccess = () => { ... };

  return (
    <ContentWriteProvider onSuccess={handleWriteSuccess}>
      <ContentWriteModalPanel />
    </ContentWriteProvider>
  );
};

function ContentWriteModalPanel() {
  const { closeModal } = useModalStore();
  const { content, setContent, isSubmitDisabled, onSubmit } = useContentWriteContext();

  return (
    <ModalShell ...>
      <ModalPanel ...>
        <CoverImgUploader />
        <SelectedMusicList />
        <MusicSearch />
        ...
```

3개 leaf 컴포넌트도 각자 필요한 값만 `useContentWriteContext()`에서 구조분해합니다.

```tsx
// CoverImgUploader.tsx
export const CoverImgUploader = () => {
  const { activeCover: currentCover, onFileChange } = useContentWriteContext();
  ...

// SelectedMusicList.tsx
export const SelectedMusicList = () => {
  const { selectedMusics: musics, onRemoveMusic: onRemove, onMoveMusic: onMove } = useContentWriteContext();
  ...

// MusicSearch.tsx
export const MusicSearch = () => {
  const { searchQuery, setSearchQuery, isSearchOpen, setIsSearchOpen, onAddMusic, onAddPlaylist } = useContentWriteContext();
  ...
```

테스트도 `mockContextValue` + `ContentWriteValueProvider`로 값을 직접 주입하는 방식으로 재작성했습니다(`PostDetailBody.test.tsx`와 동일 패턴).

**전환하지 않은 것과 그 이유**

| 컴포넌트                                                                         | 왜 Context로 안 바꿨나                                                                                                                                                               |
| -------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ModalShell`/`ModalPanel`/`ModalCloseButton`/`Button`/`TickerText`               | 5~8개의 서로 다른 모달/도메인에서 재사용되는 범용 UI 킷. `ContentWriteContext`를 구독시키면 이 모달 전용이 되어버려 재사용이 깨짐                                                    |
| `MusicPickerSearch`                                                              | 코드 주석에 명시된 대로 `MusicSearch(ContentWriteModal)`와 `SearchDropdown(PlaylistDetailModal)`이 함께 쓰는 위젯                                                                    |
| `PlaylistBriefItem`                                                              | `.map()`으로 순회하며 각 항목(`brief`)을 받는 리스트 아이템 — "배열의 i번째 값"은 Context(하나의 공유 값)로 표현할 수 없는 구조                                                      |
| `PlaylistRecommendationSection`/`BriefItemList`/`EmptyPlaylist`/`LoadingMessage` | `MusicSearch` 단일 호출부(1홉)이고, 데이터 출처도 `useContentWrite`가 아니라 별도의 `usePlaylistRecommendations`. 소비처가 하나뿐인데 두 번째 Context를 세우는 건 과잉 추상화로 판단 |

---

## 문제 5 — `ContentWriteModal` 자신에 남아있던 `initialMusics` prop

문제 4까지 끝난 뒤에도 `ModalContainer.tsx`가 여전히 `<ContentWriteModal initialMusics={...} />` 형태로 prop 하나를 내려주고 있었습니다. 반면 형제 컴포넌트인 `PostCardDetailModal`은 `usePostDetailModal()`이 `useModalStore()`를 직접 구독해 **zero-prop**으로 마운트됩니다. 이 비일관을 해소했습니다.

**Before**

```tsx
// ModalContainer.tsx
import type { MusicResponseDto as Music } from '@repo/dto';
...
{modalType === MODAL_TYPES.WRITE && (
  <ContentWriteModal initialMusics={modalProps.initialMusics as Music[] | undefined} />
)}
```

**After**

```tsx
// ModalContainer.tsx (Music import도 함께 제거)
{
  modalType === MODAL_TYPES.WRITE && <ContentWriteModal />;
}
```

`initialMusics` 읽기는 `ContentWriteProvider` 내부로 이동했습니다(문제 4 코드의 `ContentWriteProvider` 구현 참고 — `useModalStore()`에서 `modalProps.initialMusics`를 직접 읽습니다). `usePostDetailModal.ts`의 아래 패턴과 동일합니다.

```ts
// usePostDetailModal.ts (기존 코드, 참고용 선례)
const { isOpen, modalType, modalProps, closeModal } = useModalStore();
const postId = isEnabled ? (modalProps?.postId as string | undefined) : undefined;
```

---

## Before / After 요약

| 항목                                            | Before                                                                                                 | After                                                                     |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------- |
| `useContentWrite` Options                       | `initialMusic?: Music` + `initialMusics?: Music[]` 이중 지원                                           | `initialMusics?: Music[]` 단일 지원                                       |
| `ContentWriteModal.tsx` props                   | `{ initialMusic?, initialMusics? }` 2개                                                                | **0개**(zero-prop)                                                        |
| `ModalContainer.tsx`의 `ContentWriteModal` 호출 | `<ContentWriteModal initialMusic={...} initialMusics={...} />`                                         | `<ContentWriteModal />`                                                   |
| `CoverImgUploader` props                        | 2개(`currentCover`, `onFileChange`)                                                                    | **0개**                                                                   |
| `SelectedMusicList` props                       | 3개(`musics`, `onRemove`, `onMove`)                                                                    | **0개**                                                                   |
| `MusicSearch` props                             | 6개(`searchQuery`, `setSearchQuery`, `isSearchOpen`, `setIsSearchOpen`, `onAddMusic`, `onAddPlaylist`) | **0개**                                                                   |
| `MusicSearch.tsx` 내부 플레이리스트 렌더링      | 인라인 함수 `renderPlaylistSection`                                                                    | 별도 컴포넌트 `PlaylistRecommendationSection`(`PlaylistSectionInner.tsx`) |
| `ContentWriteModal/index.ts`                    | 4개 export(3개는 어디서도 안 쓰임)                                                                     | 1개 export(`ContentWriteModal`만)                                         |
| leaf 컴포넌트 단독 테스트 방식                  | props 직접 spread(`<MusicSearch {...baseProps} />`)                                                    | `ContentWriteValueProvider` + `mockContextValue` 주입                     |
| `pnpm test`(web)                                | 회귀 없이 유지                                                                                         | **48 suites / 264 tests 전부 통과**                                       |

## 검증

- `pnpm check-types`(apps/web) — 통과
- `pnpm lint`(`eslint --max-warnings 0`) — 통과
- `pnpm test` — 48 suites / 264 tests 전부 통과, 회귀 없음
- 커밋은 아직 하지 않음(사용자 확인 대기)
