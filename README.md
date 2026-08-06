# AIMP 统一 AI 管控平台交互原型

[在线预览](https://moongaga.github.io/a2a-preview/)

本仓库是 AIMP 已完成模块的独立预览版本，可脱离 Axhub 本地运行环境直接构建和部署。

## 已发布模块

- M03 Agent 管理
- M04 工作空间
- M05 任务中心
- M06 知识库
- M07 Prompt 工程
- M08 Agent 编排引擎
- M09 动态计划
- M11 Agent 测试沙箱
- M12 异常工单中心
- M15 基础管理
- M16 权限管理

Tools 工具集尚未完成，本次未发布。

## 本地运行

```bash
npm ci
npm run dev
```

## 验证与构建

```bash
npm run validate
npm run typecheck
npm run build
npm run preview
```

## 深链接

原型使用 Hash 路由，角色和模块状态可直接分享：

```text
https://moongaga.github.io/a2a-preview/#page=module&module=workspace&view=agent-chat&role=employee
```

仓库中的业务数据均为高保真原型模拟数据，不用于生产环境。
