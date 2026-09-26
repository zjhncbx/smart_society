/**
 * Web 端代表页截图采集（mock 模式 dev server）
 *
 * 前置：pnpm dev（mock 模式，http://localhost:5173）
 * 用法：node scripts/capture-screens.ts
 * 输出：../screenshots/web/*.png
 */
import { mkdir } from 'node:fs/promises';
import { fileURLToPath, URL } from 'node:url';

import { chromium } from '@playwright/test';

const BASE_URL = process.env.CAPTURE_BASE_URL ?? 'http://localhost:5173';
const OUT_DIR = fileURLToPath(new URL('../../screenshots/web/', import.meta.url));

/** 等待 dev server 就绪（最多 60s） */
async function waitForServer(url: string): Promise<void> {
  for (let i = 0; i < 60; i++) {
    try {
      const res = await fetch(url);
      if (res.ok) return;
    } catch {
      // 未就绪，继续等待
    }
    await new Promise((r) => setTimeout(r, 1000));
  }
  throw new Error(`dev server 未就绪：${url}`);
}

async function main(): Promise<void> {
  await waitForServer(BASE_URL);
  await mkdir(OUT_DIR, { recursive: true });

  // 优先使用仓库内/已安装的 Chromium，回退系统 Edge（避免强制下载浏览器）
  let browser;
  try {
    browser = await chromium.launch();
  } catch {
    browser = await chromium.launch({ channel: 'msedge' });
  }
  const page = await browser.newPage({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,
  });

  try {
    // 1. 登录页
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(800);
    await page.screenshot({ path: `${OUT_DIR}/login.png` });
    console.log('  ✓ login.png');

    // 2. Mock 快捷登录 → 工作台
    await page.click('[data-testid="mock-quick-login"]');
    await page.waitForURL(`${BASE_URL}/`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1200);
    await page.screenshot({ path: `${OUT_DIR}/workbench.png` });
    console.log('  ✓ workbench.png');

    // 3~5. 代表页：财务 / 风险（治理）/ 自动化
    // 注意：会话为内存态（zustand 无 persist），整页 goto 会丢登录态被守卫重定向回 /login，
    // 因此登录后必须走客户端导航：pushState + popstate 由 React Router 接管路由。
    const pages: Array<{ path: string; file: string; settle?: number }> = [
      { path: '/finance', file: 'finance.png', settle: 1200 },
      { path: '/risk', file: 'risk.png', settle: 1200 },
      { path: '/automation', file: 'automation.png', settle: 1200 },
    ];
    for (const p of pages) {
      await page.evaluate((path) => {
        window.history.pushState({}, '', path);
        window.dispatchEvent(new PopStateEvent('popstate'));
      }, p.path);
      await page.waitForURL(`${BASE_URL}${p.path}`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(p.settle ?? 800);
      await page.screenshot({ path: `${OUT_DIR}/${p.file}` });
      console.log(`  ✓ ${p.file}`);
    }
  } finally {
    await browser.close();
  }
  console.log('Web 截图采集完成');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
