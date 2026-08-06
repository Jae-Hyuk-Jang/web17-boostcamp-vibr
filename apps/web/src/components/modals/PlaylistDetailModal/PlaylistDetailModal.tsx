import ConfirmOverlay from '@/components/ui/ConfirmOverlay';
import ModalShell from '@/components/ui/ModalShell';
import ModalPanel from '@/components/ui/ModalPanel';
import MusicPickerSearch from '@/components/search/picker/MusicPickerSearch';
import { DEFAULT_IMAGES } from '@/constants';
import { Header, SongList, Toolbar } from './components';
import { usePlaylistDetailModal } from '@/hooks/playlist/usePlaylistDetailModal';

export default function PlaylistDetailModal({ playlistId }: { playlistId: string }) {
  const { playlist, songs, closeModal, onPlayTotalSongs, titleEditing, selection, search, confirmDelete, moveSong, moveSongTo } =
    usePlaylistDetailModal(playlistId);

  return (
    playlist && (
      <ModalShell
        onClose={closeModal}
        ariaLabel="플레이리스트 상세"
        className="flex items-center justify-center bg-primary/40 backdrop-blur-sm p-4 animate-fade-in"
      >
        <ModalPanel className="w-full max-w-lg shadow-[8px_8px_0px_0px_#00214D] max-h-[85vh]">
          {/* Header Section */}
          <Header
            title={playlist.title}
            tracksCount={songs.length}
            coverImgUrl={songs[0]?.albumCoverUrl || DEFAULT_IMAGES.ALBUM}
            onPlayTotalSongs={onPlayTotalSongs}
            isEditingTitle={titleEditing.isEditing}
            draftTitle={titleEditing.draftTitle}
            isInvalidTitle={titleEditing.isInvalid}
            onStartRename={titleEditing.handleStartRename}
            onChangeTitle={titleEditing.handleChangeTitle}
            onCommitRename={titleEditing.handleCommitRename}
            onCancelRename={titleEditing.handleCancelRename}
            onDelete={confirmDelete.handleRequestDelete}
          />

          {/* Search Dropdown Area */}
          <div className="border-b-2 border-primary bg-accent/10 p-4 animate-fade-in">
            <MusicPickerSearch
              query={search.query}
              onQueryChange={search.handleQueryChange}
              onSelect={(music) => search.handleAddSong({ ...music, id: undefined })}
              placeholder="추가할 음악 검색..."
            />
          </div>

          {/* Toolbar (Delete) */}
          {selection.selectedIds.size > 0 && <Toolbar selectedSongIds={selection.selectedIds} deleteSelectedSongs={selection.deleteSelected} />}

          {/* Song List */}
          <SongList
            songs={songs}
            selectedSongIds={selection.selectedIds}
            toggleSelectSong={selection.toggle}
            moveSong={moveSong}
            moveSongTo={moveSongTo}
          />
        </ModalPanel>

        <ConfirmOverlay
          open={confirmDelete.isOpen}
          title="플레이리스트를 삭제할까요?"
          confirmLabel="삭제"
          cancelLabel="취소"
          onCancel={confirmDelete.handleCancelDelete}
          onConfirm={confirmDelete.handleConfirmDelete}
        />
      </ModalShell>
    )
  );
}
