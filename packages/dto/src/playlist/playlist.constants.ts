/** 플레이리스트 제목 최대 길이(DB 컬럼, DTO 검증, 웹 입력 제한이 함께 참조) */
export const PLAYLIST_TITLE_MAX_LENGTH = 50;

/** 플레이리스트 소개 글 최대 길이 */
export const PLAYLIST_DESCRIPTION_MAX_LENGTH = 2300;

/**
 * 플레이리스트 커버 모자이크(2×2)에 쓰는 이미지 수.
 * 서버 커버 규칙(서로 다른 앨범 커버가 이 수 이상이면 앞의 이 수만큼)과 화면 배치가 같은 값을 써야 한다.
 */
export const PLAYLIST_COVER_MOSAIC_COUNT = 4;
