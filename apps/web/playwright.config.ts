import { defineConfig, devices } from '@playwright/test';

/**
 * apps/api·MySQL·Neo4j·Redis 없이도 확인 가능한 클라이언트 전용 흐름(모달 오픈/애니메이션 등)만 검증한다.
 * 백엔드 의존 흐름(피드 데이터, 로그인 이후 화면)은 이슈 #27 범위 밖 — CI 통합 여부와 함께 별도 논의 대상이다.
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
