import { render } from '@testing-library/react';
import type { PostResponseDto } from '@repo/dto';
import SharedPostDetailOpener from './SharedPostDetailOpener';
import { MODAL_TYPES, useModalStore } from '@/stores';

describe('SharedPostDetailOpener', () => {
  beforeEach(() => {
    useModalStore.setState({ isOpen: false, modalType: null, modalProps: {} });
  });

  it('공유 링크로 받은 글의 상세 모달을 연다', () => {
    const post = { id: 'shared-post' } as PostResponseDto;

    const { container } = render(<SharedPostDetailOpener post={post} />);

    expect(useModalStore.getState().modalType).toBe(MODAL_TYPES.POST_DETAIL);
    expect(useModalStore.getState().modalProps).toEqual({ postId: 'shared-post', initialPost: post });
    expect(container).toBeEmptyDOMElement();
  });
});
