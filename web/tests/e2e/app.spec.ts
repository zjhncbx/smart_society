import { expect, test } from '@playwright/test';

test('未登录访问工作台跳转登录页', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveURL(/\/login/);
  await expect(page.getByText('社易管 · 管理端')).toBeVisible();
});
