# 文档目录

> 社易管（SmartSociety）项目文档索引。所有文档使用中文编写，文件名使用英文 kebab-case。

---

## 推荐阅读顺序

1. **[architecture.md](architecture.md)** — 理解端云总体架构、三端定位、混合通信、同步机制与核心设计原则
2. **[data-contract.md](data-contract.md)** + **[api-contract.md](api-contract.md)** — 掌握统一数据契约与业务 API 契约（三端开发的共同基础）
3. **[deployment.md](deployment.md)** — 云函数部署、AGC 联调与验收清单
4. **[cloud-storage-security.md](cloud-storage-security.md)** + **[identity-spec.md](identity-spec.md)** — 云存储安全规则与跨端身份规范
5. **[roadmap.md](roadmap.md)** — 产品路线图与里程碑
6. **[faq.md](faq.md)** — 常见问题速查

---

## 文档索引

| 分类 | 文件 | 摘要 |
|---|---|---|
| 架构 | [architecture.md](architecture.md) | 端云总体架构、三端定位、混合通信 MethodChannel、同步机制、数据隔离模型、十项核心设计原则 |
| 契约 | [data-contract.md](data-contract.md) | 统一字段契约、32 张对象类型总览、统一事件/工作项契约、命名编码与审计约定 |
| 契约 | [api-contract.md](api-contract.md) | 业务动作命名规范、幂等契约、权限与审计、三端接入要求、80 个云函数完整分类列表 |
| 部署 | [deployment.md](deployment.md) | 云函数部署清单、OrgSettings.ruleConfig 同步、CLI 不可用说明、Web 接入真实网关、联调验收清单 |
| 安全 | [cloud-storage-security.md](cloud-storage-security.md) | 桶安全规则、目录布局、访问控制模型、SDK 直传与代理上传、文件中心云函数清单 |
| 规范 | [identity-spec.md](identity-spec.md) | 四层身份模型、三端统一关系、userId 设计要求、严禁作为主键的字段、高风险操作审计 |
| 路线图 | [roadmap.md](roadmap.md) | 产品核心定位与边界、三端定位、里程碑进度、近期方向 |
| FAQ | [faq.md](faq.md) | 通用问题、部署联调、移动端、Web 端常见问题与解决方案 |
