# 变更记录

本项目所有重要变更均记录在此文件中。格式基于 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/)，版本号遵循 [语义化版本](https://semver.org/lang/zh-CN/)。

---

## [V4.3] - 2026-10

### 新增

- 双端设计令牌同源体系（主色 `#1677FF` 系、统一圆角/字阶/阴影）
- Web 布局对标钉钉/飞书设计语言（浅灰画布、白卡细边框、语义功能色）
- 移动端卡片流强化与返回键行为审计

### 变更

- Web 管理端全页面统一 `PageContainer` 骨架与 `DesignTokens` 体系

---

## [V4.2] - 2026-09

### 新增

- 治理规则启停功能（`ruleConfig` 字段，`set-rule-enabled` 云函数）
- 5 个新云函数：`search-all`、`get-rule-config`、`set-rule-enabled`、`get-automation-logs`、`get-report-stats`（共 80 个云函数）
- AGC 部署联调文档

### 变更

- `run-governance-rules` 改造为按 `OrgSettings.ruleConfig` 跳过被禁用规则
- 移动端缺陷清零

---

## [V4.1] - 2026-08

### 新增

- 统一业务事件中心（`BusinessEvent`，云函数层自动落事件）
- 数据质量规则（8 类确定性规则）与健康度评分
- 规则引擎 GR-01~12（任务逾期升级/进度偏差/审批 SLA/预算超支/职位空缺/证照到期/任期届满/合规逾期等，支持组织级启停）
- 自动任务与风险预警闭环
- 统一工作项 `WorkItem`（审批/自动任务/项目任务/风险整改/数据治理统一抽象）
- 组织态势总览（运行状态/待处理/风险/数据问题/"最值得关注"结论）
- 全域检索
- 统一待办中心
- 风险完整钻取
- 同步中心
- 组织数字画像（管理健康度加权评分与多维钻取）

### 变更

- 幂等机制改为原子认领协议（`claim→execute→done/failed`，并发单执行窗口最小化）
- `WorkItem` 服务端 DataScope 前置过滤
- 权限函数增加身份有效性校验

---

## [V3.2] - 2026-07

### 新增

- 钉钉通讯录单向同步（部门选择/主部门保留/角色保留/失败重试）
- 设置数据上云（角色名/钉钉配置/主题/昵称云端存储）
- RBAC 角色权限（`Role`/`Permission`/`DataScope` + `get-my-permissions` 云端鉴权）

### 变更

- 跨端身份落地：华为登录自动换取内部 `userId`，原 19 处 `openId` 用法已替换
- `Person` 对象已建，建立 `User→Person→OrganizationMembership` 链

---

## [V3] - 2026-06

### 新增

- 华为账号认证（Account Kit 一键登录 + OAuth 回调）
- 多组织管理（一个华为账号同时加入并管理多个组织）
- 自动双向同步（本地优先 + 30s 周期推送与拉取合并）
- 组织层级（父子/伙伴关系共享）
- `correlationId` 全链贯通（业务动作→事件→审计→规则→任务/风险→工作项）

### 变更

- 云函数权限加固：所有组织级写接口增加成员校验，管理员操作增加 admin 校验
- 云函数总数扩展至 70+

---

## [V2] - 2026-05

### 新增

- 端云一体化架构（华为 AGC Serverless：云函数 + 云数据库）
- 7 个云函数 + 3 张核心表（Member/Project/Notice）
- 云函数桥接 `MethodChannel`（`com.smartsociety/cloud`）
- 认证桥接 `MethodChannel`（`com.smartsociety/auth`）
- 存储桥接 `MethodChannel`（`com.smartsociety/storage`）

---

## V1 及更早

- 环境搭建 / 核心 UI / 角色体系 / 本地持久化（Flutter-OH 工程、三模块 + 仪表盘、分级角色、Hive 多盒）
