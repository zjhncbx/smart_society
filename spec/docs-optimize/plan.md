# Implementation Plan: 仓库文档优化整合——面向公开仓库

**Input**: Feature specification from `spec/docs-optimize/spec.md`

## Summary

将 SmartSociety 仓库文档体系从"内部开发笔记式"优化为"专业开源项目级"。核心工作：(1) README.md 精简（351→≤150行），外迁详细内容到 docs/；(2) docs/ 目录重组（7中文文件→8英文文件+索引），移除内部审核文档，整合分散内容；(3) 补充开源社区标准文件（CHANGELOG/CODE_OF_CONDUCT/SECURITY/Issue&PR模板）；(4) 规范化交叉引用，消除重复，实现单一信息源。

## Technical Context

**Language/Version**: Markdown（GitHub Flavored）、YAML（.github 模板配置）  
**Primary Dependencies**: 无（纯文档变更）  
**State Management**: N/A  
**Storage**: Git 仓库文件系统  
**Testing**: 链接完整性验证（相对路径可解析检查）  
**Target Platform**: GitHub/GitCode 公开仓库  
**Project Type**: 文档重组  
**Performance Goals**: README ≤ 150 行、roadmap ≤ 200 行  
**Constraints**: 不修改源代码/LICENSE/.gitignore/screenshots；保持纯中文  
**Scale/Scope**: 仓库根目录 3 个 .md 文件修改 + docs/ 7→8 文件重组 + 新增 6 个社区文件 + .github/ 3 个模板 + web/README.md 1 个文件优化 = 约 21 个文件操作

## Project Structure

### Documentation (this feature)

```text
spec/docs-optimize/
├── spec.md              # 需求规格（Phase 1 产出）
├── plan.md              # 本文件（Phase 2 产出）
└── tasks.md             # 任务清单（Phase 3 产出）
```

### Source Code (repository root) — 优化后目标结构

```text
smart_society/                         # 仓库根目录
├── README.md                          # [修改] 精简至 ≤150 行
├── CHANGELOG.md                       # [新建] 版本变更记录
├── CODE_OF_CONDUCT.md                 # [新建] 行为准则
├── CONTRIBUTING.md                    # [修改] 增强
├── LICENSE                            # [不变]
├── SECURITY.md                        # [新建] 安全政策
├── SUPPORTED.md                       # [不变]
├── .gitignore                         # [不变]
├── .github/                           # [新建目录]
│   ├── ISSUE_TEMPLATE/
│   │   ├── bug_report.md              # [新建] Bug 报告模板
│   │   ├── feature_request.md         # [新建] 功能请求模板
│   │   └── config.yml                 # [新建] 模板配置
│   └── PULL_REQUEST_TEMPLATE.md       # [新建] PR 模板
├── screenshots/                       # [不变]
├── docs/                              # [重组]
│   ├── README.md                      # [新建] docs 目录导航索引
│   ├── architecture.md                # [新建] 端云架构总览
│   ├── deployment.md                  # [新建] 完整部署指南
│   ├── faq.md                         # [新建] 常见问题
│   ├── roadmap.md                     # [新建] 公开路线图（≤200行）
│   ├── api-contract.md                # [新建→替代] 业务 API 契约
│   ├── data-contract.md               # [新建→替代] 云数据契约
│   ├── cloud-storage-security.md      # [新建→替代] 云存储安全策略
│   ├── identity-spec.md              # [新建→替代] 跨端身份规范
│   ├── AGC部署联调.md                 # [删除→内容迁入 deployment.md]
│   ├── Web开发前审核报告.md            # [删除] 内部文档
│   ├── 业务API契约.md                 # [删除→替代为 api-contract.md]
│   ├── 云数据契约.md                  # [删除→替代为 data-contract.md]
│   ├── 云存储安全策略.md               # [删除→替代为 cloud-storage-security.md]
│   ├── 产品审视与优化路线.md           # [删除→替代为 roadmap.md]
│   └── 跨端统一用户身份与唯一标识规范.md # [删除→替代为 identity-spec.md]
├── mobile/                            # [不变]
└── web/
    └── README.md                      # [修改] 去重+链接更新
```

**Structure Decision**: 本特性为文档重组项目，不涉及 ArkTS/应用代码结构变更。遵循"单一信息源"原则：每种详细信息只在一个 .md 文件中完整呈现，README.md 为导航入口，docs/ 为详细文档集合。文件命名采用英文 kebab-case 以符合开源项目惯例。

## Complexity Tracking

无。本特性为纯文档变更，不涉及代码架构或复杂度违规。

## Research & Decisions

### RD-1: docs/ 文件命名策略

**Decision**: 采用英文 kebab-case 短横线命名（如 `api-contract.md`、`data-contract.md`）

**Rationale**: 
- 开源项目惯例使用英文文件名，兼容性和可访问性更好
- 中文文件名在某些 Git 客户端/操作系统上可能出现编码问题
- kebab-case 是 Markdown 文档的事实标准命名风格

**Alternatives considered**:
- 保留中文文件名：不利于国际协作，编码兼容性风险
- camelCase/PascalCase：不符合 Markdown 文档惯例

### RD-2: AGC部署联调.md 处理策略

**Decision**: 内容完整迁移至 `docs/deployment.md`，然后删除原文件

**Rationale**:
- AGC 部署联调.md 的内容本身就是部署指南，适合合并到统一的 deployment.md
- 避免两个文件内容重叠（README 的 AGC 章节 + AGC部署联调.md）
- deployment.md 可包含：应用关联→项目配置→云数据库→云函数部署→Web 接入网关→验收清单→常见问题

**Alternatives considered**:
- 保留原文件仅做重命名：仍需处理与 README AGC 章节的内容重叠
- 仅链接不合并：无法实现"单一信息源"

### RD-3: 产品审视与优化路线.md 精简策略

**Decision**: 提取产品愿景（§0）、核心架构原则（§32 十条）、已完成里程碑，删除内部技术债务评估（§一~§九历史审计、P0 门禁记录）、未实现 P1 规划细节（§13/§15/§23/§24/§25/§26/§27/§28/§29），控制在 ≤200 行

**Rationale**:
- 公开路线图应展现"产品方向"而非"内部技术债"
- 1375 行的原始文档包含大量内部 Go/No-Go 决策记录，不适合公开
- 已完成里程碑是项目成果展示，必须保留
- 核心架构原则（十项）是项目理念的核心表达，必须保留

**Alternatives considered**:
- 完整保留：暴露内部决策过程，不专业
- 仅保留里程碑：缺少产品愿景和设计原则，信息不完整

### RD-4: README.md 精简后内容迁移对照

**Decision**: 按以下映射迁出内容

| README 原章节 | 迁入目标 |
|--------------|----------|
| 鸿蒙云开发（AGC）配置（整节） | docs/deployment.md |
| 云函数总览（整节） | docs/api-contract.md（已有云函数分类，补充完整列表） |
| 混合通信（整节） | docs/architecture.md |
| 同步机制（整节） | docs/architecture.md |
| 数据隔离模型（整节） | docs/architecture.md |
| 常见问题（整节） | docs/faq.md |

**Rationale**: README 保留导航入口功能，详细内容分散到专题文档，消除三处以上的内容重叠

**Alternatives considered**:
- 保留部分详细内容在 README：违反"单一信息源"原则，维护时易产生不一致

### RD-5: roadmap.md 内容范围

**Decision**: 保留以下内容，控制在 ≤200 行：
1. 产品核心定位（1 句话）
2. 产品边界（核心用户/核心业务/明确不做）—— 精简自 §1
3. 三端产品定位（Web/Android/HarmonyOS 各 2-3 行）—— 精简自 §2
4. 核心架构原则（§32 十条，~40 行）
5. 已完成里程碑表格（精简自 README 里程碑 + §30 Phase 列表）
6. 近期方向（2-3 行概述，不展开 P1 细节）

**Rationale**: 公开路线图应传达"产品是什么、为什么这样设计、做到了什么、下一步方向"，而非"内部技术债务清单"

### RD-6: architecture.md 内容来源整合

**Decision**: 从以下来源整合，控制在 ~150 行：
1. 端云总体架构图 —— 来自 产品路线图 §3
2. 三端产品定位 —— 来自 产品路线图 §2（精简版，roadmap 中也引用但此处更详细）
3. 混合通信机制 —— 来自 README 混合通信章节
4. 同步机制 —— 来自 README 同步机制章节
5. 数据隔离模型 —— 来自 README 数据隔离模型章节
6. 设计原则 —— 来自 产品路线图 §32

**Rationale**: 架构信息当前分散在 3 个文件中，整合后为单一信息源

### RD-7: CODE_OF_CONDUCT.md 采用 Contributor Covenant v2.1 中文版

**Decision**: 采用 Contributor Covenant v2.1 中文翻译

**Rationale**: Contributor Covenant 是最广泛采用的开源行为准则，中文版与项目语言一致

### RD-8: SECURITY.md 漏洞报告渠道

**Decision**: 使用 GitHub 安全公告（Security Advisories）作为主要渠道，邮箱作为备用

**Rationale**: GitHub 安全公告允许私有披露，避免公开 Issue 暴露漏洞。邮箱作为非 GitHub 用户的备用渠道。

## Data Model

本特性为纯文档变更，无数据模型。但定义以下内容迁移映射关系：

### 文档内容迁移矩阵

| 内容单元 | 当前位置 | 目标位置 | 迁移方式 |
|---------|---------|---------|---------|
| AGC 应用关联步骤 | README §鸿蒙云开发→1 | docs/deployment.md §1 | 迁移+整合 |
| AGC 项目侧配置 | README §鸿蒙云开发→2 | docs/deployment.md §2 | 迁移+整合 |
| 云数据库表清单 | README §鸿蒙云开发→3 | docs/data-contract.md | 引用链接 |
| 云函数部署指引 | README §鸿蒙云开发→4 + AGC部署联调.md | docs/deployment.md §3 | 合并+整合 |
| Web 接入网关 | AGC部署联调.md §四 | docs/deployment.md §4 | 迁移 |
| 验收清单 | AGC部署联调.md §五 | docs/deployment.md §5 | 迁移 |
| AGC 常见问题 | AGC部署联调.md §六 | docs/faq.md | 合并 |
| 云函数总览（80个） | README §云函数总览 | docs/api-contract.md §附录 | 迁移 |
| 混合通信表 | README §混合通信 | docs/architecture.md §3 | 迁移 |
| 同步机制 | README §同步机制 | docs/architecture.md §4 | 迁移 |
| 数据隔离模型 | README §数据隔离 | docs/architecture.md §5 | 迁移 |
| 常见问题 | README §常见问题 | docs/faq.md | 迁移+扩展 |
| 产品愿景/原则 | 产品审视与优化路线 §0+§32 | docs/roadmap.md | 精简提取 |
| 里程碑 | README §里程碑 | docs/roadmap.md §4 | 迁移+扩展 |
| 审核记录 | Web开发前审核报告 | — | 删除 |
| Go/No-Go 门禁 | Web开发前审核报告 §〇 | — | 删除 |

### 交叉引用链接更新矩阵

| 链接来源 | 旧链接目标 | 新链接目标 |
|---------|-----------|-----------|
| README.md | `docs/AGC部署联调.md` | `docs/deployment.md` |
| README.md | `docs/业务API契约.md` | `docs/api-contract.md` |
| README.md | `docs/云数据契约.md` | `docs/data-contract.md` |
| README.md | `docs/产品审视与优化路线.md` | `docs/roadmap.md` |
| CONTRIBUTING.md | `docs/云数据契约.md` / `docs/业务API契约.md` | `docs/data-contract.md` / `docs/api-contract.md` |
| web/README.md | `docs/AGC部署联调.md` | `docs/deployment.md` |
| web/README.md | `docs/业务API契约.md` / `docs/云数据契约.md` | `docs/api-contract.md` / `docs/data-contract.md` |
| web/README.md | `docs/跨端统一用户身份与唯一标识规范.md` | `docs/identity-spec.md` |
| web/README.md | `docs/云存储安全策略.md` | `docs/cloud-storage-security.md` |
| docs/*（新文件互引） | 旧文件名 | 新文件名 |

## Contracts & Interfaces

### 文档接口契约

#### README.md 结构契约（≤150 行）

```text
# 社易管（SmartSociety）
Logo + 徽章行
中文简介（3-5 句）
截图预览（保留现有表格）
技术栈（精简表，只列核心层）
仓库结构（精简树，只到一级目录）
快速开始（移动端+Web 各 3-5 行，详细步骤链接 docs/）
文档导航（链接到 docs/ 下各文件，替代内联详细章节）
里程碑（精简表格）
许可证
```

#### docs/README.md 索引契约

```text
# 文档目录
分类索引表（架构/契约/部署/安全/规范/路线图/FAQ）
推荐阅读顺序
各文件一句话摘要
```

#### docs/deployment.md 结构契约

```text
# 部署指南
一、前置要求（环境+工具）
二、应用关联（AGC 创建项目/应用+Account Kit）
三、项目侧配置（agconnect-services.json+EntryAbility+MethodChannel）
四、云数据库（对象类型同步，引用 data-contract.md）
五、云函数部署（DevEco Studio + AGC 在线编辑器，CLI 不可用说明）
六、Web 接入真实网关（环境变量+认证链联调）
七、云存储配置（引用 cloud-storage-security.md）
八、验收清单（权限/参数/幂等/correlationId/规则联动）
九、常见问题
```

#### docs/architecture.md 结构契约

```text
# 技术架构
一、端云总体架构（架构图+架构原则）
二、三端定位（Web/Android/HarmonyOS 各自职责）
三、混合通信（MethodChannel 表）
四、同步机制（本地优先+操作入队+周期推送+云端拉取）
五、数据隔离模型（orgId 隔离+组织关系共享）
六、设计原则（十项核心原则）
```

#### docs/roadmap.md 结构契约（≤200 行）

```text
# 产品路线图
产品定位（1 句话）
产品边界（核心/不做）
已完成里程碑表格
近期方向（2-3 行概述）
核心架构原则（十项，~40 行）
```

#### docs/faq.md 结构契约

```text
# 常见问题
通用问题（合并自 README）
部署问题（合并自 AGC部署联调.md）
移动端问题
Web 端问题
```

### 社区文件契约

#### CHANGELOG.md 格式

```text
# 变更记录
## [V4.3] - YYYY-MM-DD
### 新增
- ...
### 变更
- ...
### 修复
- ...
（依次回溯至 V2）
```

#### CODE_OF_CONDUCT.md

Contributor Covenant v2.1 中文版，包含：
- 承诺条款
- 行为标准（可接受/不可接受）
- 执行责任
- 适用范围
- 执行方式

#### SECURITY.md 结构

```text
# 安全政策
支持的版本
报告漏洞（GitHub 安全公告+邮箱）
响应承诺（确认时间+更新频率）
公开披露政策
```

#### .github/ISSUE_TEMPLATE/bug_report.md

包含：标题、问题描述、复现步骤、期望行为、实际行为、环境信息、截图/日志

#### .github/ISSUE_TEMPLATE/feature_request.md

包含：功能描述、解决的问题、建议方案、替代方案、补充信息

#### .github/PULL_REQUEST_TEMPLATE.md

包含：变更描述、关联 Issue、变更类型（bugfix/feature/docs/refactor/test/chore）、门禁检查清单（typecheck/lint/test/build/smoke）、自测结论

#### .github/ISSUE_TEMPLATE/config.yml

```yaml
blank_issues_enabled: false
contact_links: []
```
