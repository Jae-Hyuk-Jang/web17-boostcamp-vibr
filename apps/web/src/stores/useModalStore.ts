import { create } from 'zustand';

export const MODAL_TYPES = {
  WRITE: 'WRITE',
  LOGIN: 'LOGIN',
  POST_DETAIL: 'POST_DETAIL',
  FOLLOWER_USER: 'FOLLOWER_USER',
  FOLLOWING_USER: 'FOLLOWING_USER',
  PLAYLIST_DETAIL: 'PLAYLIST_DETAIL',
  PLAYLIST_PICKER: 'PLAYLIST_PICKER',
  PRIVACY_CONCENT: 'PRIVACY_CONCENT',
} as const;

export type ModalType = (typeof MODAL_TYPES)[keyof typeof MODAL_TYPES] | null;

interface ModalState {
  modalType: ModalType;
  isOpen: boolean;
  modalProps: Record<string, unknown>;

  openModal: (type: ModalType, props?: Record<string, unknown>) => void;
  closeModal: () => void;
}

export const useModalStore = create<ModalState>((set) => ({
  modalType: null,
  isOpen: false,
  modalProps: {},
  openModal: (type, props?) => set({ isOpen: true, modalType: type, modalProps: props || {} }),
  closeModal: () => set({ isOpen: false, modalType: null, modalProps: {} }),
}));
