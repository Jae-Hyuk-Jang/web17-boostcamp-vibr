import { useMutation, useQueryClient } from '@tanstack/react-query';

import ConfirmOverlay from '@/components/ui/ConfirmOverlay';
import ModalShell from '@/components/ui/ModalShell';
import ModalPanel from '@/components/ui/ModalPanel';
import MusicPickerSearch from '@/components/search/picker/MusicPickerSearch';
import { useModalStore, usePlayerStore } from '@/stores';
import { PLAYLISTS_QUERY_KEY } from '@/hooks/playlist/usePlaylists';
import { usePlaylistDetail, playlistDetailQueryKey } from '@/hooks/playlist/usePlaylistDetail';
import type { MusicRequestDto as UnsavedMusic, MusicResponseDto as SavedMusic, GetPlaylistDetailResDto } from '@repo/dto';
import { useEffect, useRef, useState } from 'react';
import { DEFAULT_IMAGES, MAX_PLAYLIST_TITLE_LENGTH } from '@/constants';
import { Header, SongList, Toolbar } from './components';
import { addMusicsToPlaylist, changeMusicOrderOfPlaylist, deletePlaylist, editTitleOfPlaylist } from '@/api';
import { reorder } from '@/utils';
import { toast } from 'react-toastify';

export default function PlaylistDetailModal({ playlistId }: { playlistId: string }) {
  const { closeModal } = useModalStore();
  const queryClient = useQueryClient();

  const addToQueue = usePlayerStore((s) => s.addToQueue);
  const selectMusic = usePlayerStore((s) => s.selectMusic);
  const bumpPlaylistRefresh = () => queryClient.invalidateQueries({ queryKey: PLAYLISTS_QUERY_KEY });

  // usePlaylistRecommendations(#194)와 캐시를 공유하는 조회 경로. 변경 액션은 순차 전환 중(useMutation으로
  // 옮긴 액션은 onSuccess에서 이 캐시에도 씀) — 로컬 state(playlist/songs)가 여전히 렌더링의 소스이므로,
  // 최초 로드 이후 캐시가 갱신돼도(다른 액션의 쓰기로) 로컬 state를 덮어쓰지 않도록 최초 1회만 시딩한다.
  const { data: fetchedPlaylist, isError: isPlaylistDetailError } = usePlaylistDetail(playlistId);
  const hasSeededRef = useRef(false);

  const [playlist, setPlaylist] = useState<GetPlaylistDetailResDto | null>(null);
  const [songs, setSongs] = useState<SavedMusic[]>([]);
  const [selectedSongIds, setSelectedSongIds] = useState<Set<string>>(new Set());
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [draftTitle, setDraftTitle] = useState('');
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  const [isInvalidTitle, setIsInvalidTitle] = useState(false);
  const [musicQuery, setMusicQuery] = useState('');

  useEffect(() => {
    if (fetchedPlaylist && !hasSeededRef.current) {
      hasSeededRef.current = true;
      setPlaylist(fetchedPlaylist);
      setSongs(fetchedPlaylist.musics);
    }
  }, [fetchedPlaylist]);

  useEffect(() => {
    if (isPlaylistDetailError) {
      toast.error('플레이리스트 정보를 불러오지 못했습니다.');
    }
  }, [isPlaylistDetailError]);

  const onPlayTotalSongs = () => {
    if (songs.length > 0) {
      addToQueue(songs);
      selectMusic(songs[0]!);
    }
  };

  const toggleSelectSong = (songId: string) => {
    const newSelected = new Set(selectedSongIds);
    if (selectedSongIds.has(songId)) newSelected.delete(songId);
    else newSelected.add(songId);

    setSelectedSongIds(newSelected);
  };

  // 현재도 낙관적 업데이트다 — onMutate에서 즉시 로컬/캐시를 반영한 뒤 API를 호출한다.
  // 현재 동작 그대로, 실패해도 onMutate의 낙관적 반영을 롤백하지 않는다(사용자 확인).
  const changeOrderMutation = useMutation({
    mutationFn: (nextSongs: SavedMusic[]) =>
      changeMusicOrderOfPlaylist(
        playlistId,
        nextSongs.map((s) => s.id),
      ),
    onMutate: (nextSongs) => {
      setSongs(nextSongs);
      queryClient.setQueryData(playlistDetailQueryKey(playlistId), (prev: GetPlaylistDetailResDto | undefined) =>
        prev ? { ...prev, musics: nextSongs } : prev,
      );
    },
    onSuccess: () => {
      bumpPlaylistRefresh();
    },
    onError: (e) => {
      toast.error('변경사항 반영에 실패했습니다.');
      console.error(e);
    },
  });

  const requestChangeOrder = (nextSongs: SavedMusic[]) => {
    changeOrderMutation.mutate(nextSongs);
  };

  const deleteSelectedSongs = () => {
    const nextSongs = songs.filter((s) => !selectedSongIds.has(s.id));
    setSelectedSongIds(new Set());
    requestChangeOrder(nextSongs);
  };

  const moveSong = (index: number, direction: 'up' | 'down') => {
    const nextSongs = reorder(songs, index, direction);
    requestChangeOrder(nextSongs);
  };

  const moveSongTo = (from: number, to: number) => {
    if (from === to) return;
    if (from < 0 || from >= songs.length) return;
    if (to < 0 || to >= songs.length) return;

    const nextSongs = [...songs];
    const [item] = nextSongs.splice(from, 1);
    if (!item) return;
    nextSongs.splice(to, 0, item);

    requestChangeOrder(nextSongs);
  };

  const handleAddSong = async (song: UnsavedMusic) => {
    try {
      // 낙관적 업데이트 x - song id가 필요해서 안 됨
      const { addedMusics } = await addMusicsToPlaylist(playlistId, [song]);
      setSongs([...songs, ...addedMusics]);
      bumpPlaylistRefresh();
    } catch (e) {
      toast.error('곡 추가에 실패했습니다.');
      console.error(e);
    }
  };

  const startRename = () => {
    if (!playlist) return;
    setDraftTitle(playlist.title);
    setIsEditingTitle(true);
  };

  const validateRename = (title: string) => {
    return title.trim().length <= MAX_PLAYLIST_TITLE_LENGTH;
  };

  // 현재도 낙관적 업데이트가 아니다 — editTitleOfPlaylist 성공 이후에만 로컬/캐시 title을 바꾼다.
  // (ADR 정정: 당초 onMutate 낙관적 쓰기로 계획했으나 실제로는 비낙관적 액션이라 현재 동작을 보존한다.)
  const renameMutation = useMutation({
    mutationFn: (nextTitle: string) => editTitleOfPlaylist(playlistId, nextTitle),
    onSuccess: (_data, nextTitle) => {
      setPlaylist((prev) => (prev ? { ...prev, title: nextTitle } : prev));
      setIsEditingTitle(false);
      queryClient.setQueryData(playlistDetailQueryKey(playlistId), (prev: GetPlaylistDetailResDto | undefined) =>
        prev ? { ...prev, title: nextTitle } : prev,
      );
      bumpPlaylistRefresh();
    },
    onError: (e) => {
      toast.error('플레이리스트 이름 변경에 실패했습니다.');
      console.error(e);
    },
  });

  const commitRename = () => {
    if (!playlist) return;
    if (isInvalidTitle) return;

    const nextTitle = draftTitle.trim();
    if (!nextTitle || nextTitle === playlist.title) {
      setIsEditingTitle(false);
      setDraftTitle(playlist.title);
      return;
    }
    renameMutation.mutate(nextTitle);
  };

  const cancelRename = () => {
    if (playlist) setDraftTitle(playlist.title);
    setIsEditingTitle(false);
    setIsInvalidTitle(false);
  };

  const requestDeletePlaylist = () => {
    setIsConfirmOpen(true);
  };

  useEffect(() => {
    const isInValid = !validateRename(draftTitle);
    if (isInvalidTitle !== isInValid) setIsInvalidTitle(isInValid);
  }, [draftTitle, isInvalidTitle]);

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
            isEditingTitle={isEditingTitle}
            draftTitle={draftTitle}
            isInvalidTitle={isInvalidTitle}
            onStartRename={startRename}
            onChangeTitle={setDraftTitle}
            onCommitRename={commitRename}
            onCancelRename={cancelRename}
            onDelete={requestDeletePlaylist}
          />

          {/* Search Dropdown Area */}
          <div className="border-b-2 border-primary bg-accent/10 p-4 animate-fade-in">
            <MusicPickerSearch
              query={musicQuery}
              onQueryChange={setMusicQuery}
              onSelect={(music) => handleAddSong({ ...music, id: undefined })}
              placeholder="추가할 음악 검색..."
            />
          </div>

          {/* Toolbar (Delete) */}
          {selectedSongIds.size > 0 && <Toolbar selectedSongIds={selectedSongIds} deleteSelectedSongs={deleteSelectedSongs} />}

          {/* Song List */}
          <SongList songs={songs} selectedSongIds={selectedSongIds} toggleSelectSong={toggleSelectSong} moveSong={moveSong} moveSongTo={moveSongTo} />
        </ModalPanel>

        <ConfirmOverlay
          open={isConfirmOpen}
          title="플레이리스트를 삭제할까요?"
          confirmLabel="삭제"
          cancelLabel="취소"
          onCancel={() => setIsConfirmOpen(false)}
          onConfirm={async () => {
            try {
              setIsConfirmOpen(false);
              await deletePlaylist(playlistId);
              bumpPlaylistRefresh();
              closeModal();
            } catch (e) {
              toast.error('플레이리스트 삭제에 실패했습니다.');
              console.error(e);
            }
          }}
        />
      </ModalShell>
    )
  );
}
