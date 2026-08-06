import { MAX_PLAYLIST_TITLE_LENGTH, DEFAULT_IMAGES } from '@/constants';
import { Check, Pencil, Play, Trash2, X } from 'lucide-react';
import Image from 'next/image';
import Button from '@/components/ui/Button';
import { usePlaylistDetailModalContext } from '../PlaylistDetailModalContext';

export function Header() {
  const { playlist, songs, onPlayTotalSongs, titleEditing, confirmDelete } = usePlaylistDetailModalContext();

  const title = playlist?.title ?? '';
  const tracksCount = songs.length;
  const coverImgUrl = songs[0]?.albumCoverUrl || DEFAULT_IMAGES.ALBUM;
  const {
    isEditing: isEditingTitle,
    draftTitle,
    isInvalid: isInvalidTitle,
    handleStartRename: onStartRename,
    handleChangeTitle: onChangeTitle,
    handleCommitRename: onCommitRename,
    handleCancelRename: onCancelRename,
  } = titleEditing;
  const onDelete = confirmDelete.handleRequestDelete;

  return (
    <div className="relative bg-grayish border-b-2 border-primary p-6">
      <div className="flex items-center space-x-6">
        {/* Cover */}
        <div className="relative w-28 h-28 shrink-0">
          <div className="absolute inset-0 bg-primary translate-x-1 translate-y-1 rounded-xl"></div>
          <Image src={coverImgUrl} alt={title} fill className="object-cover rounded-xl border-2 border-primary z-10" />
          <div className="absolute -bottom-2 -right-2 z-20 bg-accent-pink text-white text-xs font-bold px-2 py-0.5 rounded-full border border-primary">
            {tracksCount}곡
          </div>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            {isEditingTitle ? (
              <div className="flex items-center gap-2 w-full">
                <div>
                  <input
                    autoFocus
                    className="w-full text-2xl font-black text-primary rounded-md border-2 border-primary px-2 py-1 focus:outline-none"
                    value={draftTitle}
                    onChange={(e) => onChangeTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        onCommitRename();
                      }
                      if (e.key === 'Escape') {
                        onCancelRename();
                      }
                    }}
                  />
                  {isInvalidTitle && (
                    <span className="text-right my-2 text-xs text-error">제목은 최대 {MAX_PLAYLIST_TITLE_LENGTH}자까지 허용합니다.</span>
                  )}
                </div>

                <Button
                  variant="secondary"
                  size="icon"
                  className="rounded-md p-1 hover:bg-gray-50"
                  onClick={onCommitRename}
                  aria-label="Confirm rename"
                >
                  <Check className="w-4 h-4" />
                </Button>
                <Button
                  variant="secondary"
                  size="icon"
                  className="rounded-md p-1 hover:bg-gray-50"
                  onClick={onCancelRename}
                  aria-label="Cancel rename"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <>
                <h2 className="text-2xl font-black text-primary leading-tight">{title}</h2>
                <div className="flex items-center gap-2">
                  <Button variant="secondary" size="icon" className="rounded-md p-1 hover:bg-gray-50" onClick={onStartRename} aria-label="Edit title">
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="secondary"
                    size="icon"
                    className="rounded-md p-1 text-accent-pink hover:bg-gray-50"
                    onClick={onDelete}
                    aria-label="Delete playlist"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </>
            )}
          </div>
          <p className="text-sm font-bold text-gray-500 mb-3">Created by Me</p>

          <div className="flex items-center space-x-2">
            <Button
              className="flex-1 rounded-lg border-transparent px-4 py-1.5 text-sm shadow-sm hover:border-black hover:bg-secondary hover:shadow-md"
              onClick={() => tracksCount > 0 && onPlayTotalSongs()}
            >
              <Play className="w-4 h-4 fill-current" />
              <span>재생</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
