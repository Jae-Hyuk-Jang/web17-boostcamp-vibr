'use client';

import { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import type { MusicRequestDto as UnsavedMusic, MusicResponseDto as SavedMusic, GetPlaylistDetailResDto } from '@repo/dto';

import { useModalStore, usePlayerStore } from '@/stores';
import { usePlaylistDetail } from '@/hooks/playlist/usePlaylistDetail';
import { PLAYLISTS_QUERY_KEY, playlistDetailQueryKey } from '@/query-keys';
import { MAX_PLAYLIST_TITLE_LENGTH } from '@/constants';
import { addMusicsToPlaylist, changeMusicOrderOfPlaylist, deletePlaylist, editTitleOfPlaylist } from '@/api';
import { reorder } from '@/utils';

export interface UsePlaylistDetailModalResult {
  playlist: GetPlaylistDetailResDto | undefined;
  songs: SavedMusic[];

  closeModal: () => void;
  onPlayTotalSongs: () => void;

  titleEditing: {
    isEditing: boolean;
    draftTitle: string;
    isInvalid: boolean;
    handleStartRename: () => void;
    handleChangeTitle: (v: string) => void;
    handleCommitRename: () => void;
    handleCancelRename: () => void;
  };

  selection: {
    selectedIds: Set<string>;
    toggle: (songId: string) => void;
    deleteSelected: () => void;
  };

  search: {
    query: string;
    handleQueryChange: (v: string) => void;
    handleAddSong: (song: UnsavedMusic) => void;
  };

  confirmDelete: {
    isOpen: boolean;
    handleRequestDelete: () => void;
    handleCancelDelete: () => void;
    handleConfirmDelete: () => void;
  };

  moveSong: (index: number, direction: 'up' | 'down') => void;
  moveSongTo: (from: number, to: number) => void;
}

/**
 * PlaylistDetailModal의 오케스트레이션 훅 — 데이터 조회, mutation 4개, UI 로컬 state를
 * 한데 모은다. usePostDetailModal/useContentWrite와 동일한 조직 패턴
 * (playlist-detail-orchestration #281).
 */
export function usePlaylistDetailModal(playlistId: string): UsePlaylistDetailModalResult {
  const { closeModal } = useModalStore();
  const queryClient = useQueryClient();

  const addToQueue = usePlayerStore((s) => s.addToQueue);
  const selectMusic = usePlayerStore((s) => s.selectMusic);
  const bumpPlaylistRefresh = () => queryClient.invalidateQueries({ queryKey: PLAYLISTS_QUERY_KEY });

  // usePlaylistRecommendations(#194)와 캐시를 공유하는 조회 경로. usePostDetail과 동일하게 캐시(data)가
  // 렌더링의 유일한 소스다 — 로컬 state로 별도 보관하지 않는다(playlist-detail-state-consolidation #272).
  const { data: playlist, isError: isPlaylistDetailError } = usePlaylistDetail(playlistId);
  const songs = playlist?.musics ?? [];

  const [selectedSongIds, setSelectedSongIds] = useState<Set<string>>(new Set());
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [draftTitle, setDraftTitle] = useState('');
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  const [isInvalidTitle, setIsInvalidTitle] = useState(false);
  const [musicQuery, setMusicQuery] = useState('');

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
      queryClient.setQueryData(playlistDetailQueryKey(playlistId), (prev: GetPlaylistDetailResDto | undefined) =>
        prev ? { ...prev, musics: nextSongs } : prev,
      );
    },
    onSuccess: () => {
      bumpPlaylistRefresh();
    },
    onError: (e) => {
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

  // 낙관적 업데이트 x - song id가 필요해서 안 됨(기존 제약 유지). onSuccess에서만 반영한다.
  const addSongMutation = useMutation({
    mutationFn: (song: UnsavedMusic) => addMusicsToPlaylist(playlistId, [song]),
    onSuccess: ({ addedMusics }) => {
      queryClient.setQueryData(playlistDetailQueryKey(playlistId), (prev: GetPlaylistDetailResDto | undefined) =>
        prev ? { ...prev, musics: [...prev.musics, ...addedMusics] } : prev,
      );
      bumpPlaylistRefresh();
    },
    onError: (e) => {
      console.error(e);
    },
  });

  const handleAddSong = (song: UnsavedMusic) => {
    addSongMutation.mutate(song);
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
      setIsEditingTitle(false);
      queryClient.setQueryData(playlistDetailQueryKey(playlistId), (prev: GetPlaylistDetailResDto | undefined) =>
        prev ? { ...prev, title: nextTitle } : prev,
      );
      bumpPlaylistRefresh();
    },
    onError: (e) => {
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

  // 현재도 낙관적 업데이트가 아니다 — deletePlaylist 성공 이후에만 모달을 닫는다.
  // (ADR 정정: removeQueries로 상세 캐시를 즉시 지우면, 아직 마운트된 이 컴포넌트의 usePlaylistDetail
  // 구독이 closeModal 반영 전에 곧바로 재요청해 방금 삭제한 playlistId를 다시 조회하는 레이스가 생겨
  // "불러오지 못했습니다" 에러가 잠깐 노출될 수 있다 — 캐시 정리는 하지 않고 staleTime 경과에 맡긴다.)
  const deleteMutation = useMutation({
    mutationFn: () => deletePlaylist(playlistId),
    onSuccess: () => {
      bumpPlaylistRefresh();
      closeModal();
    },
    onError: (e) => {
      console.error(e);
    },
  });

  useEffect(() => {
    const isInValid = !validateRename(draftTitle);
    if (isInvalidTitle !== isInValid) setIsInvalidTitle(isInValid);
  }, [draftTitle, isInvalidTitle]);

  return {
    playlist,
    songs,

    closeModal,
    onPlayTotalSongs,

    titleEditing: {
      isEditing: isEditingTitle,
      draftTitle,
      isInvalid: isInvalidTitle,
      handleStartRename: startRename,
      handleChangeTitle: setDraftTitle,
      handleCommitRename: commitRename,
      handleCancelRename: cancelRename,
    },

    selection: {
      selectedIds: selectedSongIds,
      toggle: toggleSelectSong,
      deleteSelected: deleteSelectedSongs,
    },

    search: {
      query: musicQuery,
      handleQueryChange: setMusicQuery,
      handleAddSong,
    },

    confirmDelete: {
      isOpen: isConfirmOpen,
      handleRequestDelete: requestDeletePlaylist,
      handleCancelDelete: () => setIsConfirmOpen(false),
      handleConfirmDelete: () => {
        setIsConfirmOpen(false);
        deleteMutation.mutate();
      },
    },

    moveSong,
    moveSongTo,
  };
}
