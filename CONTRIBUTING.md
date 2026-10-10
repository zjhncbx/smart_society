# 参与贡献指南（CONTRIBUTING）

感谢关注社易管（SmartSociety）！本文说明参与贡献的环境要求、流程与门禁规范。

## 1. 环境要求

支持环境矩阵（DevEco Studio、Flutter-OH、Node、浏览器版本）见 [`SUPPORTED.md`](SUPPORTED.md)。最低要求：

- Flutter-OH **3.41.10-ohos-1.0.1**（鸿蒙定制版，含 Dart 3.11）
- DevEco Studio 6.1+（含 HarmonyOS SDK）
- Node.js 18+（Web 端建议 20+，pnpm）
- JDK 17（端侧构建）

## 2. 参与流程

1. Fork 仓库并创建特性分支：`git checkout -b feat/your-feature`（或 `fix/`、`docs/` 前缀）。
2. 完成改动并保证**全部门禁通过**（见 §3）。
3. 以中文提交信息原子提交（见 §4），推送到你的 Fork。
4. 发起 Pull Request 至 `master`，描述改动目的、影响面与自测结论。

> 云函数 / 云数据库 / `agconnect-services.json` 属于云端资产，**不接受未在 issue 中讨论的改动**；`web/src/mock/` 与 `VITE_API_MODE` 契约为冻结接口，修改需附契约文档同步说明。

### PR 流程细化

1. **Fork → 分支**：从你的 Fork 创建分支，不要直接在 `master` 上开发。
2. **分支命名**：`feat/`（新功能）、`fix/`（缺陷修复）、`docs/`（文档）、`refactor/`（重构）。
3. **门禁通过**：提交 PR 前确保所有对应端门禁命令通过（见 §3）。
4. **PR 描述**：必须包含——改动目的、涉及模块、影响面评估、自测结论。模板见 [`.github/PULL_REQUEST_TEMPLATE.md`](.github/PULL_REQUEST_TEMPLATE.md)。
5. **原子提交**：一次 PR 聚焦一件事，避免混合多种不相关改动。

## 3. 门禁命令

改动合入前必须通过对应端的门禁：

**Web 端（`web/`，任一前端改动）：**

```bash
pnpm typecheck   # tsc --noEmit，0 error
pnpm lint        # eslint，0 error 0 warning
pnpm test        # vitest run，全部通过
pnpm build       # 生产构建成功
pnpm smoke       # Mock 冒烟（68 项断言），涉及 mock/接口契约时必跑
```

**移动端（`mobile/Application/`，任一 Dart/工程改动）：**

```bash
flutter analyze  # 0 issue（含 info）
flutter test     # 全部通过
```

**文档（`docs/`、`README.md` 等）：** 无命令门禁，但需保证相对链接有效、锚点与章节一一对应、不引入外部徽章/图片外链。

## 4. 中文提交规范

提交信息使用中文，格式为 `类型: 简述`，一次提交聚焦一件事：

| 前缀 | 用途 | 示例 |
|------|------|------|
| `feat:` | 新功能 | `feat: Web 报表页支持 CSV 导出` |
| `fix:` | 缺陷修复 | `fix: 首页 Tab 返回键增加再按一次退出防抖` |
| `docs:` | 文档变更 | `docs: 文档体系优化与仓库门面升级` |
| `refactor:` | 重构（不改变行为） | `refactor: 硬编码色值统一收敛到 DesignTokens` |
| `test:` | 仅测试相关 | `test: 补充 404 页 replace 导航组件测试` |
| `chore:` | 工程/依赖杂项 | `chore: 升级 pnpm 锁文件` |

## 5. 两类贡献说明

### 代码贡献

- 遵循各端既有架构约定：Web 端统一 API Client（`{ ret }` 契约 + Zod 校验）、TanStack Query 数据层、设计令牌唯一基准 `web/src/theme/tokens.ts`（禁止散落硬编码色值）；移动端设计令牌唯一基准 `mobile/Application/lib/config/theme_config.dart`。
- UI 改动须与对端保持设计语言一致（主色 `#1677FF` 系、圆角/字阶/阴影两档阴影），新页面使用统一骨架（Web `PageContainer` / 移动端 `PageHeader` + `AppCard`）。
- 新增云函数须同步更新 [docs/data-contract.md](docs/data-contract.md)、[docs/api-contract.md](docs/api-contract.md) 与 README 云函数总览。

### 文档贡献

- 修正错别字、失效链接、过期版本号等可直接提 PR。
- 新增文档放入 `docs/`，文件名使用英文 kebab-case（如 `new-topic.md`）。
- 单一信息源原则：云函数部署/联调细节只写在 [docs/deployment.md](docs/deployment.md)，其他位置以相对链接指向。

## 6. 首次贡献者建议

- 查找标有 `good first issue` 标签的 issue，这些是适合新贡献者入门的任务。
- 提交 PR 前先在 issue 中留言表达意愿，避免多人重复工作。
- 文档修复（错别字、链接失效）是最简单的入门方式。
- 如有疑问，可在 issue 中提问或在 PR 中请求早期反馈。

## 7. 安全漏洞报告

如果您发现安全漏洞，**请勿在公开 issue 中报告**。请参阅 [`SECURITY.md`](SECURITY.md) 中的漏洞报告流程，通过非公开渠道安全地提交。

## 8. 许可证

本项目基于 **GPL-3.0** 发布（全文见 [`LICENSE`](LICENSE)）。你提交的贡献将自动遵循同一许可证授权给本项目及其用户。
