import { Trash2 } from 'lucide-react';
import { usePlaylistDetailModalContext } from '../PlaylistDetailModalContext';

export function Toolbar() {
  const {
    selection: { selectedIds, deleteSelected },
  } = usePlaylistDetailModalContext();

  return (
    <div className="flex items-center justify-between px-6 py-2 bg-accent-pink/10 border-b border-accent-pink/20">
      <span className="text-xs font-bold text-accent-pink">{selectedIds.size}개 선택됨</span>
      <button onClick={deleteSelected} className="text-xs font-bold text-accent-pink flex items-center hover:underline">
        <Trash2 className="w-3 h-3 mr-1" /> 삭제하기
      </button>
    </div>
  );
}
