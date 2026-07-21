import { test, expect } from '@playwright/test';

test.describe('스모크 테스트 — Playwright 설치 검증(#27)', () => {
  test('홈 페이지가 정상적으로 로딩된다', async ({ page }) => {
    const response = await page.goto('/');

    expect(response?.status()).toBe(200);
    await expect(page).toHaveTitle(/VIBR/);
  });

  test('로그인 모달이 열리고, 실제로 애니메이션이 적용된 채 렌더링된다', async ({ page }) => {
    await page.goto('/');

    await page.getByTitle('로그인').first().click();

    const dialog = page.getByRole('dialog', { name: '로그인' });
    await expect(dialog).toBeVisible();

    // #25(animate-scale-up 죽은 클래스)와 같은 종류의 버그 재발 방지:
    // 클래스명이 마크업에 있다는 것만으로는 애니메이션이 실제로 재생되는지 알 수 없으므로
    // computed style(animation-name)을 직접 확인한다.
    const animationName = await dialog.evaluate((el) => getComputedStyle(el).animationName);
    expect(animationName).not.toBe('none');

    await dialog.getByRole('button', { name: '닫기' }).click();
    await expect(dialog).not.toBeVisible();
  });
});
