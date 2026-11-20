/** 피드 출처 테스트용 쿼리 빌더 목. 체이닝 메서드는 자기 자신을 돌려준다 */
export const makeQueryBuilderMock = () => ({
  innerJoinAndSelect: jest.fn().mockReturnThis(),
  leftJoinAndSelect: jest.fn().mockReturnThis(),
  innerJoin: jest.fn().mockReturnThis(),
  orderBy: jest.fn().mockReturnThis(),
  andWhere: jest.fn().mockReturnThis(),
  take: jest.fn().mockReturnThis(),
  getMany: jest.fn(),
});

export type QueryBuilderMock = ReturnType<typeof makeQueryBuilderMock>;

/** UUIDv7 형식의 반응 기록 id. 뒤 숫자가 클수록 나중에 만든 것 */
export const postIdOf = (n: number) =>
  `019be16a-1000-7000-8000-${String(n).padStart(12, '0')}`;
