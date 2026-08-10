export type M10TermKey =
  | 'SOW'
  | 'SLA'
  | 'AI_PRODUCT_ENTITLEMENT'
  | 'TENANT'
  | 'MILESTONE'
  | 'FIXED_VERSION_BINDING'
  | 'ACCEPTANCE_GATE';

export interface M10GlossaryEntry {
  name: string;
  fullName?: string;
  description: string;
}

export const m10Glossary: Record<M10TermKey, M10GlossaryEntry> = {
  SOW: {
    name: 'SOW（工作说明书）',
    fullName: 'Statement of Work',
    description: '明确项目交付范围、成果物、责任分工和验收条件。',
  },
  SLA: {
    name: 'SLA（服务级别协议）',
    fullName: 'Service Level Agreement',
    description: '约定服务可用性、响应时间、解决时限及未达标后的处置规则。',
  },
  AI_PRODUCT_ENTITLEMENT: {
    name: 'AI 产品权益',
    description: '合同授予特定租户使用某一 AI 产品版本及其能力范围的权利。',
  },
  TENANT: {
    name: '租户',
    description: '在数据、权限和配置上相互隔离的客户或组织空间。',
  },
  MILESTONE: {
    name: '项目里程碑',
    description: '带负责人、计划时间、完成条件和证据要求的阶段检查点。',
  },
  FIXED_VERSION_BINDING: {
    name: '固定版本绑定',
    description: '项目绑定指定资产版本，不会自动跟随该资产的最新版本变化。',
  },
  ACCEPTANCE_GATE: {
    name: '验收／结项门禁',
    description: '项目进入验收或结项前必须满足的任务、异常和证据条件。',
  },
};
