'use client';

import { useMemo, useRef, useEffect } from 'react';
import { Search, Sparkles, X } from 'lucide-react';

import { usePlaylistRecommendations, type PlaylistDetail } from '@/hooks';

import type { MusicResponseDto as Music } from '@repo/dto';
import { BriefItemList, EmptyPlaylist, LoadingMessage } from './PlaylistSectionInner';

import MusicPickerSearch from '@/components/search/picker/MusicPickerSearch';

interface MusicSearchProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;

  isSearchOpen: boolean;
  setIsSearchOpen: (isOpen: boolean) => void;

  onAddMusic: (music: Music) => void;
  onAddPlaylist: (playlist: PlaylistDetail) => void;
}

export const MusicSearch = ({ searchQuery, setSearchQuery, isSearchOpen, setIsSearchOpen, onAddMusic, onAddPlaylist }: MusicSearchProps) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isSearchOpen) return;
    const handleMouseDown = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleMouseDown);
    return () => document.removeEventListener('mousedown', handleMouseDown);
  }, [isSearchOpen, setIsSearchOpen]);

  const hasQuery = useMemo(() => searchQuery.trim().length > 0, [searchQuery]);
  const isRecommendEnabled = useMemo(() => isSearchOpen && !hasQuery, [isSearchOpen, hasQuery]);

  const {
    status: playlistStatus,
    briefs,
    errorMessage: playlistError,
    selectedPlaylistId,
    refetch,
    selectPlaylist,
  } = usePlaylistRecommendations({ enabled: isRecommendEnabled });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setIsSearchOpen(true);
  };

  const handleInputFocus = () => {
    setIsSearchOpen(true);
  };

  const handleSelectPlaylist = async (playlistId: string) => {
    const detail = await selectPlaylist(playlistId);
    if (!detail) return;

    onAddPlaylist(detail);
  };

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

  return (
    <div ref={containerRef} className="relative mb-6">
      <label htmlFor="musicQuery" className="text-sm font-bold text-gray-1 mb-2 block">
        음악 검색
      </label>

      <div className="relative z-20">
        <input
          id="musicQuery"
          type="text"
          placeholder="어떤 음악을 공유하고 싶나요?"
          value={searchQuery}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          className="w-full pl-10 pr-10 py-3 rounded-xl border-2 border-primary text-primary placeholder:text-gray-2
                     focus:outline-none focus:ring-2 focus:ring-accent-cyan focus:border-accent-cyan transition-all font-medium"
        />
        <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-2" />
        {searchQuery && (
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              setSearchQuery('');
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-gray-2 hover:bg-gray-1 flex items-center justify-center transition-colors"
            aria-label="검색어 지우기"
          >
            <X className="w-3 h-3 text-white" />
          </button>
        )}
      </div>

      {isSearchOpen ? (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border-2 border-primary rounded-xl shadow-lg max-h-60 overflow-y-auto overscroll-contain custom-scrollbar z-20 py-2">
          {hasQuery ? (
            <MusicPickerSearch showInput={false} query={searchQuery} onQueryChange={setSearchQuery} onSelect={onAddMusic} />
          ) : (
            renderPlaylistSection()
          )}
        </div>
      ) : null}
    </div>
  );
};
