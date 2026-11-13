export const REDIS_KEYS = {
  TRENDING_POSTS: 'rank:trending:posts',
  // 원천 이벤트 스트림(트렌딩 컨슈머가 소비)
  LOG_EVENTS_STREAM: 'stream:log:events',
} as const;
