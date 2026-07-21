'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import { Search, XCircle } from 'lucide-react';

import { useItunesSearch, useYoutubeSearch } from '@/hooks';
import { getHintMessage } from '@/utils';
import TickerText from '@/components/ui/TickerText';
import type { ContentSearchMode } from '@/types';
import type { MusicResponseDto as Music } from '@repo/dto';

const SEARCH_TAB_TITLES: Record<ContentSearchMode, string> = {
  music: '음원',
  video: '유튜브',
};

const SEARCH_TAB_ENTRIES = Object.entries(SEARCH_TAB_TITLES) as [ContentSearchMode, string][];

export interface MusicPickerSearchProps {
  query: string;
  onQueryChange: (next: string) => void;
  onSelect: (music: Music) => void;
  placeholder?: string;
  onFocus?: () => void;
  className?: string;
}

/**
 * 검색해서 목록에 추가하는 "선택형" 음악 검색 위젯.
 * MusicSearch(ContentWriteModal)/SearchDropdown(PlaylistDetailModal)가 공유한다.
 * 결과 클릭 시 onSelect에 Music 원본을 그대로 넘긴다 — id 변환 같은
 * 소비처별 계약 차이는 위젯이 알지 못하고 호출부 콜백에서 처리한다.
 */
export default function MusicPickerSearch({
  query,
  onQueryChange,
  onSelect,
  placeholder = '음악 검색',
  onFocus,
  className = '',
}: MusicPickerSearchProps) {
  const [mode, setMode] = useState<ContentSearchMode>('music');

  const itunes = useItunesSearch({ query, enabled: mode === 'music' });
  const videos = useYoutubeSearch({ query, enabled: mode === 'video' });
  const active = useMemo(() => (mode === 'video' ? videos : itunes), [mode, itunes, videos]);

  const hintMessage = useMemo(() => getHintMessage(active.trimmedQuery), [active.trimmedQuery]);

  const handleChangeMode = (nextMode: ContentSearchMode) => {
    if (mode === nextMode) return;
    setMode(nextMode);
  };

  const renderResults = () => {
    if (active.status === 'idle' && query) return <div className="p-4 text-center text-gray-2 text-sm">{hintMessage}</div>;
    if (active.status === 'idle') return null;
    if (active.status === 'loading') return <div className="p-4 text-center text-gray-2 text-sm">검색 중...</div>;
    if (active.status === 'error') {
      return <div className="p-4 text-center text-gray-2 text-sm">{active.errorMessage ?? '검색 중 오류가 발생했습니다.'}</div>;
    }
    if (active.status === 'empty') return <div className="p-4 text-center text-gray-2 text-sm">검색 결과가 없습니다.</div>;

    return (
      <div className="max-h-60 overflow-y-auto custom-scrollbar">
        {active.results.map((music) => (
          <button
            key={music.id}
            type="button"
            onClick={() => onSelect(music)}
            className="w-full flex items-center p-2 hover:bg-gray-4 text-left border-b border-gray-100 last:border-0"
          >
            <Image
              src={music.albumCoverUrl}
              alt={music.title}
              width={32}
              height={32}
              className="w-8 h-8 rounded border border-gray-200 mr-2 object-cover shrink-0"
            />
            <div className="flex-1 min-w-0">
              <TickerText text={music.title} className="font-bold text-sm" />
              <TickerText text={music.artistName} className="text-xs text-gray-500" />
            </div>
          </button>
        ))}
      </div>
    );
  };

  return (
    <div className={className}>
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          onFocus={onFocus}
          placeholder={placeholder}
          className="w-full pl-10 pr-9 py-2 rounded-xl border-2 border-primary focus:outline-none bg-white font-medium"
        />
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-2" />
        {query.length > 0 ? (
          <button
            type="button"
            onClick={() => onQueryChange('')}
            title="검색어 지우기"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-2 hover:text-primary"
          >
            <XCircle className="w-5 h-5" />
          </button>
        ) : null}
      </div>

      {query ? (
        <>
          <div className="flex text-center gap-1 mt-2">
            {SEARCH_TAB_ENTRIES.map(([tabMode, tabTitle]) => (
              <button
                key={tabMode}
                type="button"
                title={`${tabTitle} 검색`}
                aria-pressed={mode === tabMode}
                onClick={() => handleChangeMode(tabMode)}
                className={`flex-1 rounded-md px-3 py-2 text-sm transition-colors ${
                  mode === tabMode ? 'bg-primary font-bold text-white' : 'text-gray-500 hover:text-gray-700 hover:bg-white/60'
                }`}
              >
                {tabTitle}
              </button>
            ))}
          </div>

          {renderResults()}
        </>
      ) : null}
    </div>
  );
}
