# Feature Specification: 仓库文档优化整合——面向公开仓库

**Created**: 2026-10-09  
**Status**: Draft  
**Input**: User description: "深入分析仓库文档，优化整合文档，作为适合公开的仓库"

## Overview

将 SmartSociety 仓库文档体系从"内部开发笔记式"优化为"专业开源项目级"，同时服务**使用者（部署/评估）**与**贡献者（开发/协作）**两类受众。核心工作包括：精简 README.md（351→~150行）、重组 docs/ 目录（7→8 文件，含新索引与架构总览）、移除内部审核文档、精简产品路线图（1375→~200行）、补充开源社区标准文件（CHANGELOG/CODE_OF_CONDUCT/SECURITY/Issue&PR模板）、规范化文档间交叉引用以消除重复。

## User Scenarios & Testing *(mandatory)*

### User Story 1 - 评估者快速了解项目 (Priority: P1)

作为首次访问仓库的评估者，我希望 README 能在 30 秒内告诉我"这是什么、能干什么、长什么样"，通过 Logo/徽章/一句话定位/截图/精简技术栈快速判断项目价值，而不是面对 351 行的"上帝文件"无从下手。

**Why this priority**: README 是仓库门面，决定第一印象。当前 351 行的信息过载严重影响首次访问体验，是最高优先级问题。

**Independent Test**: 可以通过检查 README.md 行数≤150、包含 Logo/徽章/定位/截图/技术栈/目录索引来独立验证，无需依赖其他改动。

**Acceptance Scenarios**:

1. **Given** 用户首次访问仓库, **When** 打开 README.md, **Then** 30 秒内能看到项目定位（社易管是什么）、核心能力（3-5 条）、截图预览、精简技术栈表、目录索引链接
2. **Given** 用户想了解详细技术信息, **When** 点击 README 目录索引中的链接, **Then** 能跳转到 docs/ 下对应的专题文档
3. **Given** README 中引用技术细节, **When** 检查内容, **Then** 不包含云函数总览/云数据库表清单/同步机制/数据隔离模型等已迁至 docs/ 的详细内容

---

### User Story 2 - 部署者找到完整部署步骤 (Priority: P1)

作为希望自部署的使用者，我希望从 README 的目录索引快速跳转到独立部署指南，找到 AGC 配置、云函数部署、云数据库同步、Web 接入网关的完整步骤和验收清单，而不是在 README 和多个 docs 文件间反复跳转。

**Why this priority**: 部署是使用者转化的关键路径，当前 AGC 部署信息分散在 README（4 节）和 AGC部署联调.md 中，整合为单一部署指南是核心需求。

**Independent Test**: 可以通过检查 `docs/deployment.md` 是否包含完整部署流程（AGC 配置 + 云函数 + 云数据库 + Web 网关 + 验收清单）来独立验证。

**Acceptance Scenarios**:

1. **Given** 用户需要部署项目, **When** 打开 docs/deployment.md, **Then** 能看到从零开始的完整部署流程（应用关联→项目配置→云数据库→云函数→Web接入→验收）
2. **Given** 用户在 README 中看到部署指引, **When** 点击链接, **Then** 跳转到 docs/deployment.md 的对应章节
3. **Given** 用户查阅部署文档, **When** 搜索验收清单, **Then** 能在单一文档中找到完整的权限/参数/幂等/correlationId/规则联动验收项

---

### User Story 3 - 贡献者理解系统架构 (Priority: P2)

作为潜在贡献者，我希望有清晰的架构文档（端云架构、三端定位、混合通信、同步机制、数据隔离模型），以便理解系统设计并参与开发，而不是在 README 和产品路线图中拼凑架构全貌。

**Why this priority**: 架构理解是贡献者参与开发的前提，当前架构信息分散在 README（3 个独立章节）和产品路线图中，需要整合。

**Independent Test**: 可以通过检查 `docs/architecture.md` 是否涵盖端云架构图、三端定位、通信/同步/隔离模型来独立验证。

**Acceptance Scenarios**:

1. **Given** 贡献者想了解系统架构, **When** 打开 docs/architecture.md, **Then** 能看到端云总体架构图、三端定位（Web/Android/HarmonyOS）、混合通信机制、同步机制、数据隔离模型
2. **Given** 贡献者想了解设计原则, **When** 查看 architecture.md 的设计原则章节, **Then** 能看到产品十项核心原则（数据先于页面、业务先于客户端等）
3. **Given** README 中不再有架构细节, **When** 检查 README, **Then** 同步机制、数据隔离模型、混合通信等章节已被链接替代

---

### User Story 4 - 贡献者提交规范的 Issue 和 PR (Priority: P2)

作为贡献者，我希望有规范的 Issue 模板（Bug/Feature/Question）和 PR 模板（含门禁检查清单），以便高效地报告问题或提交代码。

**Why this priority**: 规范的 Issue/PR 流程是社区协作的基础设施，降低维护者筛选和审查成本。

**Independent Test**: 可以通过检查 `.github/ISSUE_TEMPLATE/` 和 `.github/PULL_REQUEST_TEMPLATE.md` 是否存在且内容完整来独立验证。

**Acceptance Scenarios**:

1. **Given** 贡献者发现 Bug, **When** 点击 New Issue, **Then** 能选择 Bug Report 模板并填写复现步骤/环境/预期行为
2. **Given** 贡献者提交 PR, **When** 打开 PR 编辑页面, **Then** 能看到包含门禁检查清单（typecheck/lint/test/build/smoke）的 PR 模板
3. **Given** 用户尝试提交空白 Issue, **When** 未选择模板, **Then** Issue 创建被阻止（config.yml 配置）

---

### User Story 5 - 安全研究者报告漏洞 (Priority: P2)

作为安全研究者，我希望有明确的 SECURITY.md 告知漏洞报告渠道和响应流程，而不是通过公开 Issue 暴露安全漏洞。

**Why this priority**: 安全政策是开源项目的标配，缺少会直接影响项目信誉。

**Independent Test**: 可以通过检查 SECURITY.md 是否包含报告渠道、响应流程、支持版本范围来独立验证。

**Acceptance Scenarios**:

1. **Given** 安全研究者发现漏洞, **When** 查看仓库根目录, **Then** 能看到 SECURITY.md 并找到报告渠道（邮箱/私有 Issue）
2. **Given** SECURITY.md 描述响应流程, **When** 阅读内容, **Then** 能看到确认时间承诺（如 48h 内确认）和更新频率承诺

---

### User Story 6 - 新人有序阅读文档 (Priority: P2)

作为新加入的开发者，我希望 docs/ 目录有导航索引和推荐阅读顺序，而不是面对 7+ 文件无从下手。

**Why this priority**: 文档导航降低新人上手门槛，当前缺少 docs/README.md 索引入口。

**Independent Test**: 可以通过检查 `docs/README.md` 是否包含文件列表、推荐阅读顺序、每文件一句话摘要来独立验证。

**Acceptance Scenarios**:

1. **Given** 新人打开 docs/ 目录, **When** 阅读 docs/README.md, **Then** 能看到所有文档的一句话摘要和推荐阅读顺序（如：先架构→再契约→再部署→再安全）
2. **Given** 新人想查找特定主题, **When** 在 docs/README.md 中搜索, **Then** 能通过分类索引（架构/契约/部署/安全/规范/路线图/FAQ）快速定位

---

### User Story 7 - 查看版本变更历史 (Priority: P3)

作为使用者/贡献者，我希望通过 CHANGELOG.md 了解每个版本做了什么变更，以便追踪项目演进和判断升级影响。

**Why this priority**: CHANGELOG 是版本管理的基础，但优先级低于门面文档和社区标准文件。

**Independent Test**: 可以通过检查 CHANGELOG.md 是否包含 V2→V3→V3.2→V4.1→V4.2→V4.3 的版本变更记录来独立验证。

**Acceptance Scenarios**:

1. **Given** 用户查看 CHANGELOG.md, **When** 浏览版本列表, **Then** 能看到从 V2 到 V4.3 的每个版本核心变更
2. **Given** 用户想了解特定版本, **When** 查看某版本详情, **Then** 能看到新增/变更/修复的分类列表

---

### Edge Cases

- 当 docs/ 中旧中文文件名文档被删除后，其他文档中指向旧文件名的相对链接将失效，需全部更新
- web/README.md 中引用 docs/ 旧文件名的链接也需同步更新
- README.md 中指向 docs/ 旧文件名的链接需更新为新文件名
- 产品路线图精简时需确保不遗漏已完成里程碑的关键信息
- AGC部署联调.md 内容被整合到 deployment.md 后，需确保验收清单完整迁移

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: README.md 必须精简至 ≤150 行，仅保留项目定位、截图、精简技术栈、仓库结构、快速开始、目录索引、里程碑、许可证
- **FR-002**: README.md 中云函数总览/云数据库表清单/AGC 配置/混合通信/同步机制/数据隔离模型/常见问题章节必须迁至对应 docs/ 文件，README 仅保留链接
- **FR-003**: 必须新建 `docs/architecture.md`，整合端云架构总览、三端定位、混合通信、同步机制、数据隔离模型、设计原则
- **FR-004**: 必须新建 `docs/deployment.md`，整合 README 中 AGC 配置章节与 `docs/AGC部署联调.md` 的完整部署流程
- **FR-005**: 必须新建 `docs/faq.md`，整合 README 常见问题与 AGC 部署联调中的常见问题
- **FR-006**: 必须新建 `docs/README.md` 作为 docs/ 目录导航索引，包含文件列表、分类、推荐阅读顺序
- **FR-007**: 必须新建 `docs/roadmap.md`，精简自产品审视与优化路线.md，≤200 行，保留产品愿景、核心架构原则、已完成里程碑，移除内部 P0/P1 技术债务与未实现规划细节
- **FR-008**: 必须将 `docs/业务API契约.md` 重命名/替换为 `docs/api-contract.md`，补充从 README 迁入的云函数总览
- **FR-009**: 必须将 `docs/云数据契约.md` 重命名/替换为 `docs/data-contract.md`，去除与 README 重复的表清单
- **FR-010**: 必须将 `docs/云存储安全策略.md` 重命名/替换为 `docs/cloud-storage-security.md`
- **FR-011**: 必须将 `docs/跨端统一用户身份与唯一标识规范.md` 重命名/替换为 `docs/identity-spec.md`
- **FR-012**: 必须删除 `docs/Web开发前审核报告.md`（内部审核报告，不适宜公开）
- **FR-013**: 必须删除旧中文文件名文档（由新英文文件名文档替代后删除原文件）
- **FR-014**: 必须新建 `CHANGELOG.md`，基于里程碑表格扩展为版本变更记录
- **FR-015**: 必须新建 `CODE_OF_CONDUCT.md`，采用 Contributor Covenant v2.1 中文版
- **FR-016**: 必须新建 `SECURITY.md`，包含安全漏洞报告渠道、响应流程、支持版本范围
- **FR-017**: 必须新建 `.github/ISSUE_TEMPLATE/bug_report.md`、`.github/ISSUE_TEMPLATE/feature_request.md`、`.github/ISSUE_TEMPLATE/config.yml`
- **FR-018**: 必须新建 `.github/PULL_REQUEST_TEMPLATE.md`，含门禁检查清单
- **FR-019**: 必须增强 CONTRIBUTING.md，补充安全漏洞报告指引、PR 流程细化、首次贡献者建议
- **FR-020**: 必须精简 web/README.md，移除与根 README 重复的技术栈描述和与 docs/ 重复的架构原则（改用链接引用）
- **FR-021**: 所有文档间交叉引用必须使用相对路径，同一信息只在一个文件中完整呈现，其他位置仅链接
- **FR-022**: 所有文档间链接必须在优化后验证可解析，无死链

### Key Entities

- **文档文件**: README.md、docs/*、web/README.md、CONTRIBUTING.md、SUPPORTED.md、CHANGELOG.md、CODE_OF_CONDUCT.md、SECURITY.md、.github/* — 优化/新建/删除的目标对象
- **内容单元**: 云函数总览、云数据库表清单、AGC 配置步骤、混合通信表、同步机制、数据隔离模型、常见问题、产品路线图、设计原则 — 需要从源文件迁移到目标文件的内容块
- **交叉引用链接**: 文档间相对路径引用 — 需要更新以匹配新文件名和结构

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: README.md 行数 ≤ 150 行
- **SC-002**: docs/roadmap.md 行数 ≤ 200 行
- **SC-003**: docs/ 目录下旧中文文件名文档全部删除，新英文文件名文档全部就位
- **SC-004**: 所有文档间相对链接可解析，零死链
- **SC-005**: 仓库根目录包含 CHANGELOG.md、CODE_OF_CONDUCT.md、SECURITY.md 三个标准文件
- **SC-006**: .github/ 目录包含至少 2 个 Issue 模板和 1 个 PR 模板
- **SC-007**: 同一信息（如云函数总览、云数据库表清单、AGC 配置步骤）只在一个文件中完整呈现，其他位置为链接
- **SC-008**: 任意文档中不存在指向已删除文件（Web开发前审核报告.md、旧中文文件名文档）的链接

## Assumptions

- 所有文档保持纯中文，不添加英文版本
- GPL-3.0 许可证保持不变，不修改 LICENSE 文件
- .gitignore 保持不变
- screenshots/ 目录内容保持不变
- 产品路线图精简时不引入新的产品规划内容，仅提炼现有已完成项和核心愿景
- docs/ 文件重命名采用英文 kebab-case（短横线命名），符合开源项目惯例
- AGC部署联调.md 的内容完整迁移至 deployment.md 后删除原文件
- CODE_OF_CONDUCT.md 采用 Contributor Covenant v2.1 中文翻译版
- SECURITY.md 中的漏洞报告渠道使用仓库 Issue 的安全标签（GitHub 安全公告功能）或指定邮箱
- web/README.md 保留 Web 端独有内容（工程目录、API Client 规范、状态管理、W0-W4 状态），仅去重

## Open Questions

- ~~目标受众~~ → 已确认：两者兼顾（使用者+贡献者）
- ~~语言策略~~ → 已确认：保持纯中文
- ~~内部文档处理~~ → 已确认：移除
- ~~社区文件补充~~ → 已确认：全部补充
- ~~产品路线图处理~~ → 已确认：精简为公开路线图（≤200行）
