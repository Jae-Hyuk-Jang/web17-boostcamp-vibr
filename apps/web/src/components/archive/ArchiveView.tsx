'use client';

import { useQueryClient } from '@tanstack/react-query';

import { PlaylistItem } from './PlaylistItems';
import ArchiveViewHeader from './ArchiveViewHeader';
import { deletePlaylist, editTitleOfPlaylist } from '@/api';
import { usePlaylists, PLAYLISTS_QUERY_KEY } from '@/hooks/playlist/usePlaylists';
import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';

export default function ArchiveView() {
  const queryClient = useQueryClient();
  const { data: playlists = [], isError, error } = usePlaylists();
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  useEffect(() => {
    if (!isError) return;
    toast.error('플레이리스트 목록을 불러오지 못했습니다.');
    console.error(error);
  }, [isError, error]);

  const invalidatePlaylists = () => queryClient.invalidateQueries({ queryKey: PLAYLISTS_QUERY_KEY });

  const handleRename = async (id: string, title: string) => {
    try {
      await editTitleOfPlaylist(id, title);
      await invalidatePlaylists();
    } catch (e) {
      toast.error('플레이리스트 이름 변경에 실패했습니다.');
      console.error(e);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deletePlaylist(id);
      await invalidatePlaylists();
    } catch (e) {
      toast.error('플레이리스트 삭제에 실패했습니다.');
      console.error(e);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      {/* 페이지 헤더 */}
      <ArchiveViewHeader />

      {/* 플리 목록 */}
      <div className="w-full flex flex-col space-y-4">
        {/* 사용자의 플리 목록 */}
        {playlists.map((p) => (
          <PlaylistItem
            key={p.id}
            id={p.id}
            title={p.title}
            tracksCount={p.tracksCount}
            firstAlbumCoverUrl={p.firstAlbumCoverUrl}
            openMenuId={openMenuId}
            setOpenMenuId={setOpenMenuId}
            onRename={handleRename}
            onDelete={handleDelete}
          />
        ))}
      </div>
    </div>
  );
}
