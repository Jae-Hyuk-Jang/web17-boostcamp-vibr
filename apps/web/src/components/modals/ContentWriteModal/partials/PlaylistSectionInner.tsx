import { Sparkles } from 'lucide-react';

import { PlaylistBriefItem } from '@/components/playlist';
import { PlaylistBriefResDto } from '@repo/dto';
import type { ListStatus } from '@/hooks';

export function LoadingMessage() {
  return <div className="p-4 text-center text-gray-2 text-sm">불러오는 중...</div>;
}

export function EmptyPlaylist({ onClick }: Readonly<{ onClick: () => Promise<void> }>) {
  return (
    <div className="p-4 text-center text-gray-2 text-sm">
      보관함이 비어있습니다.
      <div className="mt-2">
        <button type="button" onClick={onClick} className="text-xs font-bold underline text-gray-1">
          다시 시도
        </button>
      </div>
    </div>
  );
}

interface BriefItemListProps {
  briefs: PlaylistBriefResDto[];
  selectedPlaylistId: string | null;
  onSelect: (playlistId: string) => Promise<void>;
}

export function BriefItemList({ briefs, selectedPlaylistId, onSelect }: Readonly<BriefItemListProps>) {
  return (
    <div className="space-y-1">
      {briefs.map((pl) => (
        <PlaylistBriefItem key={pl.id} brief={pl} isLoading={selectedPlaylistId === pl.id} onSelect={onSelect} />
      ))}
    </div>
  );
}

interface PlaylistRecommendationSectionProps {
  status: ListStatus;
  briefs: PlaylistBriefResDto[];
  selectedPlaylistId: string | null;
  errorMessage: string | null;
  onSelect: (playlistId: string) => Promise<void>;
  onRetry: () => Promise<void>;
}

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
