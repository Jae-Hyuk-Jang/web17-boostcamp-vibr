import ConfirmOverlay from '@/components/ui/ConfirmOverlay';
import ModalShell from '@/components/ui/ModalShell';
import ModalPanel from '@/components/ui/ModalPanel';
import MusicPickerSearch from '@/components/search/picker/MusicPickerSearch';
import { Header, SongList, Toolbar } from './components';
import { PlaylistDetailModalProvider, usePlaylistDetailModalContext } from './PlaylistDetailModalContext';

export default function PlaylistDetailModal({ playlistId }: { playlistId: string }) {
  return (
    <PlaylistDetailModalProvider playlistId={playlistId}>
      <PlaylistDetailModalPanel />
    </PlaylistDetailModalProvider>
  );
}

function PlaylistDetailModalPanel() {
  const { closeModal, selection, search, confirmDelete } = usePlaylistDetailModalContext();

  return (
    <ModalShell
      onClose={closeModal}
      ariaLabel="플레이리스트 상세"
      className="flex items-center justify-center bg-primary/40 backdrop-blur-sm p-4 animate-fade-in"
    >
      <ModalPanel className="w-full max-w-lg shadow-[8px_8px_0px_0px_#00214D] max-h-[85vh]">
        <Header />

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
        {selection.selectedIds.size > 0 && <Toolbar />}

        <SongList />
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
  );
}
