# 变更描述

简要描述本 PR 的改动内容和目的。

## 关联 Issue

关闭 #

## 变更类型

- [ ] bugfix：缺陷修复
- [ ] feature：新功能
- [ ] docs：文档变更
- [ ] refactor：重构（不改变行为）
- [ ] test：仅测试相关
- [ ] chore：工程/依赖杂项

## 门禁检查清单

### Web 端（任一前端改动）

- [ ] `pnpm typecheck`：0 error
- [ ] `pnpm lint`：0 error 0 warning
- [ ] `pnpm test`：全部通过
- [ ] `pnpm build`：生产构建成功
- [ ] `pnpm smoke`：Mock 冒烟 68 项断言全过（涉及 mock/接口契约时必跑）

### 移动端（任一 Dart/工程改动）

- [ ] `flutter analyze`：0 issue
- [ ] `flutter test`：全部通过

### 文档（docs/、README.md 等）

- [ ] 相对链接有效
- [ ] 锚点与章节一一对应
- [ ] 未引入外部徽章/图片外链

## 自测结论

描述你进行的自测，例如：
- [ ] 本地验证通过
- [ ] Mock 模式冒烟通过
- [ ] 真实 AGC 网关联调通过

## 截图/录屏

如适用，添加截图或录屏展示改动效果。
