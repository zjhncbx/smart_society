# 技术架构

> 社易管三端技术架构与设计原则。三端共享统一数据契约、统一业务 API、统一身份与权限模型。

---

## 一、端云总体架构

```text
                         SmartSociety
                              │
             ┌────────────────┼────────────────┐
             ↓                ↓                ↓
          Web端            Android         HarmonyOS
             │                │                │
             └────────────────┼────────────────┘
                              ↓
                       统一身份认证
                              ↓
                         API Gateway
                              ↓
                 ┌────────────┴────────────┐
                 ↓                         ↓
           Cloud Functions            可演进后端服务
                 │                         │
                 └────────────┬────────────┘
                              ↓
                         Cloud DB
                         /       \
                        /         \
             Cloud Storage       Cache
```

Web 前端：

```text
Web App → Cloud Hosting → CDN/HTTPS
```

**架构原则**：

1. 三端共享统一数据契约。
2. 三端不得分别实现核心业务规则。
3. 普通查询可以采用 Cloud DB 能力，但关键业务操作优先经过云函数/统一业务服务。
4. 高风险操作必须经过服务端权限、状态和业务规则校验。
5. Cloud DB 是数据底座，不是整个业务逻辑层。
6. Cloud Hosting 不作为任意后端程序运行环境使用。
7. 后续规模扩大时，可在 API Gateway 后增加独立后端服务，不破坏客户端契约。

---

## 二、三端定位

| 端 | 职责 |
|---|---|
| **Web** | 组织级管理控制台——复杂治理、配置、批量处理与分析中心 |
| **Android** | 移动管理与执行端——随时感知 + 随时处理（驾驶舱、待办、审批、风险处置、离线工作） |
| **HarmonyOS** | 与 Android 共享业务模型的移动管理端——数据模型/身份/权限/状态机/规则完全一致，UI 结合鸿蒙设备能力优化 |

---

## 三、混合通信

移动端（Flutter ↔ HarmonyOS 原生壳）通过 MethodChannel 桥接：

| Channel | 方法 | 用途 |
|---|---|---|
| `com.smartsociety/storage` | `getStoragePath` | 返回 `filesDir`（Hive 落盘路径） |
| `com.smartsociety/cloud` | `callFunction` | 参数 `{ name, data?, timeout? }` → `cloudFunction.call` |
| `com.smartsociety/auth` | `signIn` / `signOut` / `getUserInfo` | 华为 Account Kit 桥接 |

---

## 四、同步机制

- **本地优先**：所有写入操作先持久化到 Hive，界面即时响应。
- **操作入队**：每个 save/delete 操作自动入队到 SyncProvider 的持久化队列。
- **周期推送**：30s 定时器自动处理队列，网络不可用时操作保留等待重试（单次失败指数退避 500ms / 1s / 2s，共 3 次）。
- **云端拉取**：推送完成后、启动时与切换组织时自动拉取云端最新数据合并到本地。

---

## 五、数据隔离模型

```text
用户 A ──┬── 组织 X（admin）── MemberX, ProjectX, NoticeX
         │       └── 子组织 X1（shareMembers=true）→ 可查看 X1 成员
         └── 组织 Y（member）── 仅可见 Y 的数据

用户 B ──── 组织 X（manager）── 与 A 共享 X 的数据（同 orgId）
```

- 所有数据表通过 `orgId` 字段隔离，云函数强制校验用户是否属于该组织。
- 组织关系（`OrganizationRelationship`）控制跨组织共享：`shareMembers`、`shareActivities`、`shareNotices`。

---

## 六、设计原则（十项核心原则）

### 1. 数据先于页面

没有可靠数据，不继续堆 UI。

### 2. 业务先于客户端

核心规则只能有一套，三端只是不同入口。

### 3. 事件先于人工操作

业务发生后系统应该知道发生了什么。

### 4. 感知必须连接行动

预警最终必须进入工作项、审批或整改。

### 5. 自动化必须可解释

每个自动动作都有事件、规则、结果和审计。

### 6. 高风险决策必须保留人工授权

系统可以发现、建议、推动，但关键授权由人完成。

### 7. Cloud DB 是数据底座，不是全部后端

业务逻辑通过统一服务层治理。

### 8. Cloud Hosting 是 Web 托管能力，不替代后端服务

Web 前端与后端业务服务职责明确分离。

### 9. 移动端做执行，Web 做治理配置

避免三个客户端功能失控和重复建设。

### 10. 不追求功能数量，追求治理闭环

最终衡量：人工管理动作减少多少、问题提前发现多少、流程缩短多少、治理闭环多少。

---

## 交叉引用

- 数据契约见 [docs/data-contract.md](data-contract.md)
- 业务 API 契约见 [docs/api-contract.md](api-contract.md)
- 身份规范见 [docs/identity-spec.md](identity-spec.md)
- 云存储安全策略见 [docs/cloud-storage-security.md](cloud-storage-security.md)
- 部署与联调见 [docs/deployment.md](deployment.md)
- 产品路线图见 [docs/roadmap.md](roadmap.md)
