import { ITUNES_SEARCH } from '@/constants';

export const getHintMessage = (trimmed: string): string | undefined => {
  const isBelowMinQuery = trimmed.length > 0 && trimmed.length < ITUNES_SEARCH.MIN_QUERY_LENGTH;
  if (!isBelowMinQuery) return undefined;
  return `${ITUNES_SEARCH.MIN_QUERY_LENGTH}글자 이상 입력해주세요.`;
};
