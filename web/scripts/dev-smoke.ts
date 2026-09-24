/**
 * W1 开发冒烟：不起 Vite dev server，直接用 Node http 加载 Mock handler，
 * 验证 { ret } 契约与各业务端点返回真实形状数据。
 * 运行：pnpm smoke（Node >= 20.19）
 */
import { createServer } from 'node:http';

import { handleApi } from '../mock/dev-api.ts';

const PORT = 5174;

function post<T>(
  path: string,
  body: Record<string, unknown>,
  headers: Record<string, string> = {},
): Promise<T> {
  return fetch(`http://127.0.0.1:${PORT}/api${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
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

    // ---- US1 认证链 ----
    const login = await post<{ userId: string; displayName: string; phone: string }>(
      '/auth/login',
      { account: '13800000000', password: 'admin123' },
    );
    assert(login.userId.length > 0 && login.displayName.length > 0, '认证：Mock 账号密码登录成功');

    let wrongPasswordRejected = false;
    try {
      await post('/auth/login', { account: '13800000000', password: 'wrong-pass' });
    } catch {
      wrongPasswordRejected = true;
    }
    assert(wrongPasswordRejected, '认证：错误密码被拒绝');

    const myOrgs = await post<Array<{ orgId: string; name: string; userRole: string }>>(
      '/orgs/mine',
      { userId: login.userId },
    );
    assert(myOrgs.length === 2 && myOrgs[0].orgId === 'org_mock', '认证：/orgs/mine 返回 2 个组织');

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

    // ---- US2 组织切换：按 orgId 区分数据 ----
    const itemsOrg2 = await post<{
      items: Array<{ id: string; orgId: string; status: string }>;
      total: number;
    }>('/work-items', { orgId: 'org_mock_2' });
    assert(
      itemsOrg2.items.length > 0 &&
        itemsOrg2.items.every((w) => w.orgId === 'org_mock_2') &&
        (items.items[0] as { id: string }).id !== itemsOrg2.items[0].id,
      '组织切换：org_mock_2 返回独立工作项数据',
    );
    const postureOrg2 = await post<{ status: string; pendingCount: number }>(
      '/sensing/posture',
      { orgId: 'org_mock_2' },
    );
    assert(
      postureOrg2.status === '正常' && postureOrg2.pendingCount === itemsOrg2.items.filter((w) => w.status === 'open').length,
      '组织切换：org_mock_2 态势独立计算',
    );

    const risks = await post<{ riskCount: number; warningCount: number }>('/risks', {});
    assert(risks.riskCount >= 1 && risks.warningCount >= 1, '风险：分级计数');

    const dq = await post<{ snapshot: { score: number }; issues: unknown[] }>('/data-quality', {});
    assert(dq.snapshot.score > 0 && dq.issues.length > 0, '数据质量：评分与问题');

    const automation = await post<{
      logs: Array<{ id: string; ruleId: string; status: string }>;
      total: number;
      page: number;
      pageSize: number;
      hasMore: boolean;
    }>('/automation', { page: 0, pageSize: 20 });
    assert(
      automation.logs.length > 0 && automation.total >= automation.logs.length,
      '自动化：分页运行记录（get-automation-logs 契约）',
    );

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

    const rules = await post<{
      rules: Array<{ id: string; name: string; whenText: string; ifText: string; thenText: string; enabled: boolean }>;
    }>('/rules', {});
    assert(
      rules.rules.length === 12 && rules.rules[0].whenText.length > 0,
      '规则：GR-01~12 列表（get-rule-config 契约）',
    );
    const toggled = await post<{ id: string; enabled: boolean }>('/rules/toggle', {
      ruleId: rules.rules[0].id,
      enabled: false,
    });
    assert(toggled.enabled === false, '规则：启停（set-rule-enabled 契约）');
    const rulesAfter = await post<{ rules: Array<{ id: string; enabled: boolean }> }>('/rules', {});
    assert(rulesAfter.rules.find((r) => r.id === rules.rules[0].id)?.enabled === false, '规则：启停状态持久化');
    await post('/rules/toggle', { ruleId: rules.rules[0].id, enabled: true });

    const report = await post<{
      financeTrend: unknown[];
      riskDistribution: unknown[];
      dqDimensions: unknown[];
      projectStatus: unknown[];
      totals: { members: number; dqScore: number };
    }>('/reports', {});
    assert(
      report.financeTrend.length > 0 &&
        report.riskDistribution.length > 0 &&
        report.dqDimensions.length > 0 &&
        report.totals.members > 0,
      '报表：聚合数据',
    );

    const trend = await post<{ eventTrend: unknown[]; anomalies: unknown[] }>('/trends', {});
    assert(trend.eventTrend.length === 7 && Array.isArray(trend.anomalies), '趋势：近 7 天与异常');

    const rel = await post<{
      nodes: unknown[];
      edges: unknown[];
      summary: Record<string, number>;
    }>('/relations', { entityType: 'project', entityId: 'p_demo_1' });
    assert(rel.nodes.length > 1 && rel.edges.length > 0, '血缘：项目关系图节点与边');

    const docs = await post<{ items: Array<{ id: string; status: string }>; total: number }>(
      '/documents',
      { pageSize: 10 },
    );
    assert(docs.items.length > 0 && docs.total > 0, '文件中心：列表与总数');

    const initDoc = await post<{
      documentId: string;
      uploadPath: string;
      code: string;
      correlationId: string;
    }>('/documents/init', {
      name: '烟测上传文件',
      fileName: 'smoke.txt',
      contentType: 'text/plain',
      domain: 'attachment',
    });
    assert(
      initDoc.documentId.length > 0 && initDoc.uploadPath.startsWith('_uploads/'),
      '文件中心：上传初始化',
    );

    const committed = await post<{ documentId: string; status: string; size: number }>(
      '/documents/commit',
      {
        documentId: initDoc.documentId,
        mode: 'proxy',
        contentBase64: Buffer.from('社易管 smoke 文件内容').toString('base64'),
        correlationId: initDoc.correlationId,
      },
    );
    assert(committed.status === 'active' && committed.size > 0, '文件中心：提交（代理写入）');

    const downloaded = await post<{ fileName: string; size: number; base64: string }>(
      '/documents/download',
      { documentId: initDoc.documentId },
    );
    assert(downloaded.base64.length > 0 && downloaded.size > 0, '文件中心：代理下载');

    const removed = await post<{ status: string }>('/documents/delete', {
      documentId: initDoc.documentId,
    });
    assert(removed.status === 'deleted', '文件中心：软删');

    // ---- US3 设置中心 ----
    const orgSettings = await post<{
      orgId: string;
      themeIndex: number;
      roleLabels: Record<string, string>;
      dingtalk: { configured: boolean; clientId?: string };
    }>('/settings/org', {});
    assert(
      orgSettings.orgId === 'org_mock' && Object.keys(orgSettings.roleLabels).length > 0,
      '设置：组织设置读取',
    );

    const savedOrgSettings = await post<{ ok: boolean }>('/settings/org/save', {
      themeIndex: 2,
      roleLabels: { ...orgSettings.roleLabels, chairman: '理事长' },
      dingtalkClientId: 'ding_client_demo',
      dingtalkClientSecret: 'ding_secret_demo',
    });
    assert(savedOrgSettings.ok === true, '设置：组织设置保存');

    const orgSettingsAfter = await post<{
      themeIndex: number;
      roleLabels: Record<string, string>;
      dingtalk: { configured: boolean; clientId?: string };
    }>('/settings/org', {});
    assert(
      orgSettingsAfter.themeIndex === 2 &&
        orgSettingsAfter.roleLabels.chairman === '理事长' &&
        orgSettingsAfter.dingtalk.configured === true &&
        orgSettingsAfter.dingtalk.clientId === 'ding_client_demo',
      '设置：组织设置保存回显',
    );

    const roles = await post<{
      roles: Array<{ code: string; permissions: string[]; dataScope: string }>;
      builtins: string[];
    }>('/settings/roles', {});
    assert(roles.roles.length > 0 && roles.builtins.length >= 6, '设置：角色列表与内置角色');

    const savedRole = await post<{ id: string }>('/settings/roles/save', {
      roleId: 'finance_lead',
      name: '财务负责人',
      permissions: ['finance:read', 'finance:write', 'approval:act'],
      dataScope: 'org',
    });
    assert(savedRole.id.length > 0, '设置：角色保存');

    const userSettings = await post<{ nickname: string | null; darkMode: boolean | null }>(
      '/settings/user',
      {},
    );
    assert(userSettings.darkMode !== undefined, '设置：用户偏好读取');
    const savedUser = await post<{ ok: boolean }>('/settings/user/save', {
      nickname: '管理员',
      darkMode: true,
    });
    assert(savedUser.ok === true, '设置：用户偏好保存');

    // ---- US4 治理对象：证照 / 合规事项 / 任期 ----
    const licenses = await post<{
      licenses: Array<{ id: string; code: string; status: string; expireAt: string | null }>;
      total: number;
      hasMore: boolean;
    }>('/governance/licenses', { page: 0, pageSize: 30 });
    assert(licenses.total >= 3 && licenses.licenses.length >= 3, '证照：列表（get-licenses 契约）');

    const savedLicense = await post<{ id: string; code: string; status: string }>(
      '/governance/licenses/save',
      {
        name: '组织机构信用代码证',
        licenseNo: '信证字第0004号',
        issuer: '市发改委',
        issuedAt: '2026-01-15',
        expireAt: '2031-01-14',
      },
    );
    assert(
      savedLicense.id.length > 0 && savedLicense.code.startsWith('LIC-') && savedLicense.status === 'active',
      '证照：创建返回 id/code/status',
    );

    const renewedLicense = await post<{ id: string; status: string }>('/governance/licenses/act', {
      id: savedLicense.id,
      action: 'expire',
    });
    assert(renewedLicense.status === 'expired', '证照：状态动作 expire 生效');

    const complianceItems = await post<{
      items: Array<{ id: string; code: string; status: string; deadline: string | null }>;
      total: number;
    }>('/governance/compliance', { page: 0, pageSize: 30 });
    assert(complianceItems.total >= 3 && complianceItems.items.length >= 3, '合规：列表（get-compliance-items 契约）');

    const startedCompliance = await post<{ id: string; status: string }>('/governance/compliance/act', {
      id: 'comp_mock_1',
      action: 'start',
    });
    assert(startedCompliance.status === 'executing', '合规：动作 start→executing');

    const doneCompliance = await post<{ id: string; status: string }>('/governance/compliance/act', {
      id: 'comp_mock_1',
      action: 'done',
    });
    assert(doneCompliance.status === 'done', '合规：动作 done 生效');

    const reopenedCompliance = await post<{ id: string; status: string }>('/governance/compliance/act', {
      id: 'comp_mock_1',
      action: 'reopen',
    });
    assert(reopenedCompliance.status === 'pending', '合规：动作 reopen→pending');

    const terms = await post<{
      terms: Array<{ id: string; code: string; title: string; status: string }>;
      total: number;
    }>('/governance/terms', { page: 0, pageSize: 30 });
    assert(terms.total >= 3 && terms.terms.length >= 3, '任期：列表（get-terms 契约）');

    const activatedTerm = await post<{ id: string; status: string }>('/governance/terms/act', {
      id: 'term_mock_3',
      action: 'activate',
    });
    assert(activatedTerm.status === 'active', '任期：动作 activate→active');

    // ---- US5 财务高级功能 ----
    const currentYear = String(new Date().getFullYear());
    const flows = await post<{
      flows: Array<{ id: string; name: string; bizType: string; nodes: string; enabled: boolean; isDefault: boolean }>;
    }>('/finance/flows', { bizType: 'finance' });
    assert(flows.flows.length >= 2, '审批流：列表（get-approval-flows 契约）');

    const savedFlow = await post<{ flowId: string }>('/finance/flows/save', {
      flow: {
        id: 'flow_mock_1',
        name: '财务报销默认审批流（改）',
        bizType: 'finance',
        nodes: JSON.stringify([
          { id: 'n1', name: '财务初审', type: 'approve', roleIds: ['finance_lead'] },
          { id: 'n2', name: '管理员终审', type: 'approve', roleIds: ['org_admin'] },
        ]),
        enabled: true,
        isDefault: true,
      },
    });
    assert(savedFlow.flowId === 'flow_mock_1', '审批流：保存返回 flowId');

    const flowsAfter = await post<{ flows: Array<{ id: string; name: string }> }>('/finance/flows', {
      bizType: 'finance',
    });
    assert(
      flowsAfter.flows.find((f) => f.id === 'flow_mock_1')?.name === '财务报销默认审批流（改）',
      '审批流：保存回显',
    );

    const savedOpening = await post<{ balances: Array<{ accountCode: string; debit: number }>; carried: number }>(
      '/finance/opening/save',
      {
        year: currentYear,
        balances: [{ accountCode: '1001', accountName: '现金', debit: 8000, credit: 0 }],
      },
    );
    assert(
      savedOpening.balances.length === 1 && savedOpening.balances[0].accountCode === '1001' && savedOpening.carried === 0,
      '期初：录入保存',
    );

    const openingEcho = await post<{ balances: Array<{ accountCode: string; debit: number }> }>(
      '/finance/opening',
      { year: currentYear },
    );
    assert(
      openingEcho.balances.find((b) => b.accountCode === '1001')?.debit === 8000,
      '期初：录入回显',
    );

    const carried = await post<{ balances: Array<{ accountCode: string }>; carried: number }>(
      '/finance/opening/save',
      { year: String(Number(currentYear) + 1), carryFromPrevious: true },
    );
    assert(
      carried.carried >= 2 && carried.balances.some((b) => b.accountCode === '1002'),
      '期初：上期结转（含银行存款）',
    );

    const ledger1002 = await post<{
      account: { code: string; name: string };
      entries: Array<{ debit: number; credit: number }>;
    }>('/finance/ledger', { year: currentYear, accountCode: '1002' });
    assert(
      ledger1002.account.code === '1002' && ledger1002.entries.length > 0,
      '总账：明细查询有数据',
    );

    const reportsBefore = await post<{ closingExists: boolean; trialBalance: { totals: { endDebit: number } } }>(
      '/finance/reports',
      { year: currentYear },
    );
    assert(reportsBefore.closingExists === false, '报表：结账前 closingExists=false');

    const closed = await post<{ alreadyClosed: boolean; voucherId: string; income: number; expense: number }>(
      '/finance/close',
      { year: currentYear },
    );
    assert(
      closed.alreadyClosed === false && closed.voucherId.length > 0 && closed.income + closed.expense > 0,
      '结账：生成结转凭证',
    );

    const reportsAfter = await post<{ closingExists: boolean }>('/finance/reports', { year: currentYear });
    assert(reportsAfter.closingExists === true, '结账：结账后 closingExists=true');

    const closedAgain = await post<{ alreadyClosed: boolean; voucherId: string }>('/finance/close', {
      year: currentYear,
    });
    assert(closedAgain.alreadyClosed === true, '结账：重复结账幂等返回');

    const unclosed = await post<{ removed: number }>('/finance/unclose', { year: currentYear });
    assert(unclosed.removed === 1, '反结账：移除结转凭证');

    const reportsReopened = await post<{ closingExists: boolean }>('/finance/reports', { year: currentYear });
    assert(reportsReopened.closingExists === false, '反结账：状态恢复未结账');

    // ---- US6 通知公告：发布→列表→编辑→删除闭环 ----
    const noticesBefore = await post<{
      notices: Array<{ id: string; title: string; isImportant: boolean; publishTime: string }>;
    }>('/notices', {});
    assert(
      noticesBefore.notices.length >= 3 && noticesBefore.notices.some((n) => n.isImportant === true),
      '公告：列表（含重要标记样例）',
    );

    await post('/notices/save', {
      id: 'n_smoke_1',
      title: '【冒烟】国庆假期值班安排',
      content: '假期期间秘书处轮值，紧急事务请联系值班人员。',
      publisher: '秘书处',
      publishTime: new Date().toISOString(),
      isImportant: true,
      status: 'active',
    });
    const noticesCreated = await post<{
      notices: Array<{ id: string; title: string; isImportant: boolean }>;
    }>('/notices', {});
    const createdNotice = noticesCreated.notices.find((n) => n.id === 'n_smoke_1');
    assert(createdNotice != null && createdNotice.isImportant === true, '公告：发布后出现在列表首位');

    await post('/notices/save', {
      id: 'n_smoke_1',
      title: '【冒烟】国庆假期值班安排（更新）',
      content: '假期期间秘书处轮值，紧急事务请联系值班人员。',
      publisher: '秘书处',
      publishTime: new Date().toISOString(),
      isImportant: false,
      status: 'active',
    });
    const noticesEdited = await post<{ notices: Array<{ id: string; title: string; isImportant: boolean }> }>(
      '/notices',
      {},
    );
    const editedNotice = noticesEdited.notices.find((n) => n.id === 'n_smoke_1');
    assert(
      editedNotice?.title === '【冒烟】国庆假期值班安排（更新）' && editedNotice.isImportant === false,
      '公告：编辑回显',
    );

    await post('/notices/delete', { id: 'n_smoke_1' });
    const noticesDeleted = await post<{ notices: Array<{ id: string }> }>('/notices', {});
    assert(!noticesDeleted.notices.some((n) => n.id === 'n_smoke_1'), '公告：删除后不再出现在列表');

    // ---- US8 错误注入机制 ----
    let mockFailRejected = false;
    let mockFailMessage = '';
    try {
      await post('/posture', {}, { 'X-Mock-Fail': '1' });
    } catch (error) {
      mockFailRejected = true;
      mockFailMessage = error instanceof Error ? error.message : '';
    }
    assert(
      mockFailRejected && mockFailMessage.includes('X-Mock-Fail'),
      '错误注入：X-Mock-Fail 请求返回业务错误码',
    );

    console.log('W1/W2/W3 + 趋势/血缘 + 文件中心 Mock smoke 全部通过');
    server.close();
    process.exit(0);
  } catch (error) {
    console.error('Mock smoke 失败：', error);
    server.close();
    process.exit(1);
  }
});
