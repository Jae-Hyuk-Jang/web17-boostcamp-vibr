'use client';

import { MusicProvider } from '@repo/dto/values';
import { useCallback } from 'react';
import { useMusicActions, usePlayerNavigation } from '@/hooks';
import { useAuthMe } from '@/hooks/auth/client';
import { useModalStore, MODAL_TYPES, usePlayerStore } from '@/stores';
import { enqueueLog } from '@/utils';
import { makeArchiveAddMusicLog, makePostAddMusicLog } from '@/api';

import { NowPlayingCoverPlayback, NowPlayingProgressTick, NowPlayingMetaActions, NowPlayingControlsStatic, PlaybackProvider } from './index';

export default function NowPlaying() {
  const { currentMusic, isPlaying, isPrevAvailable, isNextAvailable, onTogglePlay, onPrev, onNext } = usePlayerNavigation();

  const volume = usePlayerStore((s) => s.volume);
  const setVolume = usePlayerStore((s) => s.setVolume);
  const playError = usePlayerStore((s) => s.playError);
  const setPlayError = usePlayerStore((s) => s.setPlayError);

  const { isAuthenticated } = useAuthMe();
  const { openModal } = useModalStore();
  const { openWriteModalWithMusic, addMusicToArchive } = useMusicActions();

  const isPlayable = Boolean(currentMusic);
  const isYouTube = currentMusic?.provider === MusicProvider.YOUTUBE;

  const clearPlayError = useCallback(() => setPlayError(null), [setPlayError]);

  const safeTogglePlay = useCallback(() => {
    if (!isPlayable) return;
    clearPlayError();
    onTogglePlay();
  }, [isPlayable, clearPlayError, onTogglePlay]);

  const safePrev = useCallback(() => {
    if (!isPrevAvailable) return;
    clearPlayError();
    onPrev();
  }, [isPrevAvailable, clearPlayError, onPrev]);

  const safeNext = useCallback(() => {
    if (!isNextAvailable) return;
    clearPlayError();
    onNext();
  }, [isNextAvailable, clearPlayError, onNext]);

  const handlePost = useCallback(async () => {
    if (!isAuthenticated) {
      openModal(MODAL_TYPES.LOGIN);
      return;
    }
    if (!currentMusic) return;

    enqueueLog(makePostAddMusicLog({ musicIds: [currentMusic.id] }));
    await openWriteModalWithMusic(currentMusic);
  }, [isAuthenticated, openModal, currentMusic, openWriteModalWithMusic]);

  const handleSave = useCallback(async () => {
    if (!isAuthenticated) {
      openModal(MODAL_TYPES.LOGIN);
      return;
    }
    if (!currentMusic) return;

    enqueueLog(makeArchiveAddMusicLog({ musicIds: [currentMusic.id] }));
    await addMusicToArchive(currentMusic);
  }, [isAuthenticated, openModal, currentMusic, addMusicToArchive]);

  return (
    <div className="p-4 py-8 border-b-2 border-primary">
      <h2 className="text-xs font-bold text-accent-pink tracking-widest uppercase mb-4 text-center">Now Playing</h2>

      <PlaybackProvider>
        <NowPlayingCoverPlayback currentMusic={currentMusic} isYouTube={isYouTube} />
        <NowPlayingMetaActions currentMusic={currentMusic} playError={playError} onPost={handlePost} onSave={handleSave} />
        <NowPlayingProgressTick currentMusic={currentMusic} />
      </PlaybackProvider>

      <NowPlayingControlsStatic
        enabled={Boolean(currentMusic)}
        isPlaying={isPlaying}
        canPrev={isPrevAvailable}
        canNext={isNextAvailable}
        onClearPlayError={clearPlayError}
        onTogglePlay={safeTogglePlay}
        onPrev={safePrev}
        onNext={safeNext}
        volume={volume}
        onVolumeChange={setVolume}
      />
    </div>
  );
}
