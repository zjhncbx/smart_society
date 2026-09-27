import { expect, test, type Page } from '@playwright/test';

/**
 * 浏览器返回 4 场景回归（T048 验证沉淀）：
 * 守卫绕过 / 登出后退 / 404 后退 / 组织切换后退。
 * 注：会话为内存态（无持久化），全页刷新即登出；因此登录后一律走 SPA 内导航
 * （菜单点击 / pushState+popstate 模拟应用内跳转），还原真实用户路径。
 * 场景 2 覆盖 RequireAuth effect 兜底修复：登出后立即浏览器后退曾因
 * React 19 transition 竞态导致守卫重定向丢失（整页空白卡死）。
 */

async function login(page: Page): Promise<void> {
  await page.goto('/login');
  await page.getByTestId('mock-quick-login').click();
  await expect(page).toHaveURL(/localhost:5173\/$/);
  await expect(page.getByTestId('org-switcher')).toBeVisible();
}

/** SPA 内跳转到任意路由（模拟应用内失效链接点击；须在登录态下使用，避免全页刷新丢会话） */
async function spaGoto(page: Page, path: string): Promise<void> {
  await page.evaluate((p) => {
    window.history.pushState(null, '', p);
    window.dispatchEvent(new PopStateEvent('popstate'));
  }, path);
}

test('场景1 守卫绕过：未登录深链受保护路由被重定向，后退不绕过守卫', async ({ page }) => {
  await page.goto('/login');
  await expect(page.getByText('社易管 · 管理端')).toBeVisible();
  // 未登录直捣受保护深链
  await page.goto('/finance');
  await expect(page).toHaveURL(/\/login/);
  // 管理端骨架（组织切换器）不渲染
  await expect(page.getByTestId('org-switcher')).toHaveCount(0);
  // 浏览器后退：只能落回登录页/空白页，受保护内容绝不出现
  await page.goBack();
  await expect(page.getByTestId('org-switcher')).toHaveCount(0);
  expect(page.url()).not.toMatch(/\/finance/);
});

test('场景2 登出后退：登出后浏览器后退无管理数据', async ({ page }) => {
  await login(page);
  // SPA 内进入受保护页，使历史栈含管理路由
  await page.getByRole('menuitem', { name: '基础收支' }).click();
  await expect(page).toHaveURL(/\/finance$/);
  await expect(page.getByTestId('org-switcher')).toBeVisible();
  // 登出（用户菜单 → 退出登录）
  await page.getByTestId('user-menu').click();
  await page.getByRole('menuitem', { name: '退出登录' }).click();
  await expect(page).toHaveURL(/\/login/);
  // 浏览器后退：落点为受保护 URL（工作台），守卫必须拦截回登录页，管理数据不残留
  await page.goBack();
  await expect(page).toHaveURL(/\/login/);
  await expect(page.getByTestId('org-switcher')).toHaveCount(0);
  await expect(page.getByTestId('user-menu')).toHaveCount(0);
});

test('场景3 404 后退：返回工作台为 replace 导航，后退不回 404', async ({ page }) => {
  await login(page);
  // SPA 内跳转失效路由（应用内失效链接场景）
  await spaGoto(page, '/unknown-page-xyz');
  await expect(page.getByText('页面不存在或已被移除')).toBeVisible();
  await page.getByRole('button', { name: '返回工作台' }).click();
  await expect(page).toHaveURL(/localhost:5173\/$/);
  // 浏览器后退：404 已被 replace 清出历史栈，应落回工作台而非 404
  await page.goBack();
  expect(page.url()).not.toMatch(/unknown-page-xyz/);
  await expect(page.getByText('页面不存在或已被移除')).toHaveCount(0);
  await expect(page.getByTestId('org-switcher')).toBeVisible();
});

test('场景4 组织切换后退：切换组织后后退不串数据', async ({ page }) => {
  await login(page);
  await expect(page.getByTestId('org-switcher')).toContainText('演示社会组织');
  // 切换到第二个组织（switchOrg + queryClient.clear 全量重拉）
  await page.getByTestId('org-switcher').click();
  await page.getByRole('menuitem', { name: '演示志愿者团队' }).click();
  await expect(page.getByTestId('org-switcher')).toContainText('演示志愿者团队');
  // SPA 内进入数据页后浏览器后退
  await page.getByRole('menuitem', { name: '基础收支' }).click();
  await expect(page).toHaveURL(/\/finance$/);
  await expect(page.getByTestId('org-switcher')).toContainText('演示志愿者团队');
  await page.goBack();
  // 组织上下文保持切换后的组织（客户端会话态不随历史回退），无串数据
  await expect(page).toHaveURL(/localhost:5173\/$/);
  await expect(page.getByTestId('org-switcher')).toContainText('演示志愿者团队');
});
