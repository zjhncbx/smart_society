/**
 * W1 开发冒烟：不起 Vite dev server，直接用 Node http 加载 Mock handler，
 * 验证 { ret } 契约与各业务端点返回真实形状数据。
 * 运行：pnpm smoke（Node >= 20.19）
 */
import { createServer } from 'node:http';

import { handleApi } from '../mock/dev-api.ts';

const PORT = 5174;

function post<T>(path: string, body: Record<string, unknown>): Promise<T> {
  return fetch(`http://127.0.0.1:${PORT}/api${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }).then(async (r) => {
    const json = (await r.json()) as { ret: { code: number; message: string; data: T } };
    if (json.ret.code !== 0) {
      throw new Error(`[${path}] ${json.ret.message}`);
    }
    return json.ret.data;
  });
}

function assert(cond: unknown, label: string): void {
  if (!cond) {
    throw new Error(`断言失败：${label}`);
  }
  console.log(`  ✓ ${label}`);
}

const server = createServer((req, res) => {
  if (req.url?.startsWith('/api')) {
    req.url = req.url.slice(4);
    void handleApi(req, res);
    return;
  }
  res.writeHead(404);
  res.end();
});

server.listen(PORT, async () => {
  try {
    console.log('W1/W2 Mock smoke 开始');
    const perm = await post<{ roleId: string; permissions: string[] }>('/permissions/mine', {});
    assert(perm.roleId === 'org_admin' && perm.permissions.includes('*'), '权限：org_admin 全量');

    const posture = await post<{
      status: string;
      pendingCount: number;
      riskCount: number;
      topConcerns: unknown[];
    }>('/sensing/posture', {});
    assert(posture.pendingCount > 0 && Array.isArray(posture.topConcerns), '态势：计数与关注项');

    const items = await post<{ items: unknown[]; total: number; dataScope: string }>(
      '/work-items',
      { status: 'open', pageSize: 5 },
    );
    assert(items.items.length > 0 && items.dataScope === 'org', 'WorkItem：分页与 DataScope');

    const act = await post<{ status: string }>('/work-items/act', {
      id: (items.items[0] as { id: string }).id,
      action: 'done',
    });
    assert(act.status === 'done', 'WorkItem：动作闭环');

    const risks = await post<{ riskCount: number; warningCount: number }>('/risks', {});
    assert(risks.riskCount >= 1 && risks.warningCount >= 1, '风险：分级计数');

    const dq = await post<{ snapshot: { score: number }; issues: unknown[] }>('/data-quality', {});
    assert(dq.snapshot.score > 0 && dq.issues.length > 0, '数据质量：评分与问题');

    const automation = await post<{ logs: unknown[]; counts: { todayRuns: number } }>(
      '/automation',
      {},
    );
    assert(automation.logs.length > 0 && automation.counts.todayRuns > 0, '自动化：运行记录');

    const audit = await post<{ logs: Array<{ correlationId?: string }> }>('/audit/logs', {});
    assert(audit.logs.length > 0 && audit.logs[0]?.correlationId, '审计：日志与关联ID');

    const search = await post<unknown[]>('/search', { query: '逾期' });
    assert(search.length > 0, '检索：命中');

    const org = await post<{ profile: { name: string }; relationships: unknown[] }>('/organization', {});
    assert(org.profile.name.length > 0 && org.relationships.length > 0, '组织：档案与关系');

    const members = await post<{ members: unknown[]; total: number }>('/members', { pageSize: 10 });
    assert(members.members.length > 0, '成员：列表');

    const projects = await post<{ projects: Array<{ id: string; status: number }> }>('/projects', {});
    assert(projects.projects.length > 0, '项目：列表');
    const trans = await post<{ status: number; statusLabel: string }>('/projects/transition', {
      id: projects.projects[0].id,
      action: 'start',
    });
    assert(trans.status === 1 && trans.statusLabel === '进行中', '项目：状态迁移走业务动作');

    const approvals = await post<{ approvals: Array<{ id: string; canAct: boolean }> }>('/approvals', {});
    assert(approvals.approvals.some((a) => a.canAct), '审批：待办存在');
    const actApproval = await post<{ status: string }>('/approvals/act', {
      id: approvals.approvals[0].id,
      action: 'approve',
    });
    assert(actApproval.status === 'approved', '审批：通过动作');

    const res = await post<{ status: string }>('/resolutions/save', {
      title: '冒烟决议',
      content: '用于验证',
      responsibleName: '张三',
      deadline: '2026-12-31',
    });
    assert(res.status === 'pending', '决议：创建');

    const stats = await post<{ income: number; expense: number; balance: number }>('/finance/stats', {});
    assert(stats.income > 0 && stats.balance >= 0, '财务：统计');
    const submitted = await post<{ recordId: string; status: string }>('/finance/submit', {
      type: 'expense',
      amount: 100,
      categoryLabel: '办公费',
      summary: '冒烟单据',
      date: '2026-08-17',
    });
    assert(submitted.recordId.length > 0 && submitted.status === 'approving', '财务：提交进入审批');

    console.log('W1/W2 Mock smoke 全部通过');
    server.close();
    process.exit(0);
  } catch (error) {
    console.error('W1 Mock smoke 失败：', error);
    server.close();
    process.exit(1);
  }
});
